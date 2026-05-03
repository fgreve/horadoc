import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";

interface CLCCenter {
  cenMedCod: string;
  cenMedDesc: string;
}

interface CLCGeneralArea {
  areaMedGenCod: string;
  areaMedGenDesc: string;
}

interface CLCSpecificArea {
  areaMedEspCod: string;
  areaMedEspDesc: string;
}

interface CLCSlotResult {
  centroMedico: string;
  medicoCod: string;
  medicoNombre: string;
  fecha: string;
  hora: string;
  areaMedica: { areaMedGenCod: string; areaMedGenDesc: string }[];
  areaMedicaEspecifica: { areaMedEspCod: string; areaMedEspDesc: string }[];
  horasDisponibles: { hora: string }[];
  valorConsulta: number;
}

interface CLCAvailableDay {
  dia: string;
  fecha: string;
}

interface CLCTimeSlot {
  hora: string;
}

function formatDateCL(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function nextWeekday(): Date {
  const d = new Date();
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 1);
  else if (day === 6) d.setDate(d.getDate() + 2);
  return d;
}

export class CLCScraper extends ClinicScraper {
  readonly clinicId = "clc" as const;
  private readonly baseUrl =
    "https://www1.miclc.cl:8443/Api/ApiAgendaWeb/api/v1";
  private readonly centerIds = ["1", "2", "5"];

  private async apiGet<T>(endpoint: string): Promise<T | null> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          "x-request-id": crypto.randomUUID(),
        },
      });
      const json = await response.json();
      if (json.success) return json.data as T;
      return null;
    } catch {
      return null;
    }
  }

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    const allSpecialties = new Map<string, RawSpecialty>();

    const results = await Promise.all(
      this.centerIds.map((id) =>
        this.apiGet<CLCGeneralArea[]>(
          `/ListaAreasMedicasGenerales?idCentro=${id}`
        )
      )
    );

    for (const areas of results) {
      if (!areas) continue;
      for (const area of areas) {
        if (!allSpecialties.has(area.areaMedGenCod)) {
          allSpecialties.set(area.areaMedGenCod, {
            externalId: area.areaMedGenCod,
            name: area.areaMedGenDesc,
          });
        }
      }
    }

    return Array.from(allSpecialties.values());
  }

  async scrapeSubSpecialties(
    centerId: string,
    generalAreaCode: string
  ): Promise<CLCSpecificArea[]> {
    const data = await this.apiGet<CLCSpecificArea[]>(
      `/ListaAreasMedicasEspecificas?idCentro=${centerId}&areaGenCod=${generalAreaCode}`
    );
    return data ?? [];
  }

  async scrapeDoctors(specialtyId: string): Promise<RawDoctor[]> {
    const doctors = new Map<string, RawDoctor>();
    const today = formatDateCL(nextWeekday());

    const results = await Promise.all(
      this.centerIds.map(async (centerId) => {
        const subSpecs = await this.scrapeSubSpecialties(
          centerId,
          specialtyId
        );
        const slotResults = await Promise.all(
          subSpecs.map((sub) =>
            this.apiGet<CLCSlotResult[]>(
              `/ListaPrimerasHorasDisponiblesMedicoAreaEspTest?idCentro=${centerId}&areaEspCod=${sub.areaMedEspCod}&fechaConsulta=${today}&proxCitas=5`
            )
          )
        );
        return { centerId, slotResults };
      })
    );

    for (const { centerId, slotResults } of results) {
      for (const slots of slotResults) {
        if (!slots) continue;
        for (const slot of slots) {
          if (!doctors.has(slot.medicoCod)) {
            const centerName = this.getCenterName(centerId);
            doctors.set(slot.medicoCod, {
              externalId: slot.medicoCod,
              name: slot.medicoNombre,
              specialtyRaw:
                slot.areaMedicaEspecifica?.[0]?.areaMedEspDesc ??
                slot.areaMedica?.[0]?.areaMedGenDesc ??
                "",
              sede: centerName,
            });
          }
        }
      }
    }

    return Array.from(doctors.values());
  }

  async scrapeSlots(
    doctorId: string,
    dateRange: DateRange
  ): Promise<RawSlot[]> {
    const slots: RawSlot[] = [];
    const fromStr = formatDateCL(dateRange.from);

    const daysResults = await Promise.all(
      this.centerIds.map((centerId) =>
        this.apiGet<CLCAvailableDay[]>(
          `/ListaDiasDisponiblesMedico?idCentro=${centerId}&medicoCod=${doctorId}&fechaDesde=${fromStr}`
        )
      )
    );

    for (let i = 0; i < this.centerIds.length; i++) {
      const centerId = this.centerIds[i];
      const days = daysResults[i];
      if (!days) continue;

      const filteredDays = days.filter((d) => {
        const [dd, mm, yyyy] = d.fecha.split("-");
        const date = new Date(+yyyy, +mm - 1, +dd);
        return date >= dateRange.from && date <= dateRange.to;
      });

      for (const day of filteredDays) {
        const times = await this.apiGet<CLCTimeSlot[]>(
          `/ListaHorariosDisponiblesMedico?idCentro=${centerId}&especCod=0&medicoCod=${doctorId}&fecha=${day.fecha}`
        );
        if (!times) continue;

        const [dd, mm, yyyy] = day.fecha.split("-");
        const isoDate = `${yyyy}-${mm}-${dd}`;

        for (const time of times) {
          slots.push({
            doctorExternalId: doctorId,
            date: isoDate,
            startTime: time.hora.trim(),
            sede: this.getCenterName(centerId),
            isTelemedicine: false,
            rawData: { centerId, originalDate: day.fecha },
          });
        }
      }
    }

    return slots;
  }

  async scrapeFirstAvailable(
    specialtyCode: string,
    centerId = "1",
    proxCitas = 10
  ): Promise<CLCSlotResult[]> {
    const today = formatDateCL(nextWeekday());
    const data = await this.apiGet<CLCSlotResult[]>(
      `/ListaPrimerasHorasDisponiblesMedicoAreaEspTest?idCentro=${centerId}&areaEspCod=${specialtyCode}&fechaConsulta=${today}&proxCitas=${proxCitas}`
    );
    return data ?? [];
  }

  async scrapeCenters(): Promise<CLCCenter[]> {
    const data = await this.apiGet<CLCCenter[]>("/ListaCentrosMedicos");
    return data ?? [];
  }

  private getCenterName(centerId: string): string {
    const names: Record<string, string> = {
      "1": "Estoril",
      "2": "Chicureo",
      "5": "Peñalolén",
      "9": "Telemedicina",
    };
    return names[centerId] ?? `Centro ${centerId}`;
  }
}
