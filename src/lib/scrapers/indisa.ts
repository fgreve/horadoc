import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";

export class IndisaScraper extends ClinicScraper {
  readonly clinicId = "indisa" as const;
  private readonly baseUrl = "https://www.indisa.cl";

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/especialidades`
      );
      const data = await response.json();
      return (data as Array<{ id: string; nombre: string }>).map((s) => ({
        externalId: s.id,
        name: s.nombre,
      }));
    } catch {
      return [];
    }
  }

  async scrapeDoctors(specialtyId: string): Promise<RawDoctor[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/profesionales?especialidad=${specialtyId}`
      );
      const data = await response.json();
      return (
        data as Array<{
          id: string;
          nombre: string;
          especialidad: string;
          sede: string;
        }>
      ).map((d) => ({
        externalId: d.id,
        name: d.nombre,
        specialtyRaw: d.especialidad,
        sede: d.sede,
      }));
    } catch {
      return [];
    }
  }

  async scrapeSlots(doctorId: string, dateRange: DateRange): Promise<RawSlot[]> {
    try {
      const from = dateRange.from.toISOString().split("T")[0];
      const to = dateRange.to.toISOString().split("T")[0];
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/horas-disponibles?profesional=${doctorId}&desde=${from}&hasta=${to}`
      );
      const data = await response.json();
      return (
        data as Array<{
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          sede: string;
          telemedicina: boolean;
        }>
      ).map((s) => ({
        doctorExternalId: doctorId,
        date: s.fecha,
        startTime: s.hora_inicio,
        endTime: s.hora_fin,
        sede: s.sede,
        isTelemedicine: s.telemedicina,
        rawData: s as unknown as Record<string, unknown>,
      }));
    } catch {
      return [];
    }
  }
}
