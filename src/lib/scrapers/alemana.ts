import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";

export class AlemanaScraper extends ClinicScraper {
  readonly clinicId = "alemana" as const;
  private readonly baseUrl = "https://agenda.clinicaalemana.cl";

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/v1/especialidades`
      );
      const data = await response.json();
      return (data as Array<{ id: string; descripcion: string }>).map((s) => ({
        externalId: s.id,
        name: s.descripcion,
      }));
    } catch {
      return [];
    }
  }

  async scrapeDoctors(specialtyId: string): Promise<RawDoctor[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/v1/profesionales?especialidadId=${specialtyId}`
      );
      const data = await response.json();
      return (
        data as Array<{
          id: string;
          nombreCompleto: string;
          especialidad: string;
          centro: string;
        }>
      ).map((d) => ({
        externalId: d.id,
        name: d.nombreCompleto,
        specialtyRaw: d.especialidad,
        sede: d.centro,
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
        `${this.baseUrl}/api/v1/agenda?profesionalId=${doctorId}&fechaDesde=${from}&fechaHasta=${to}`
      );
      const data = await response.json();
      return (
        data as Array<{
          fecha: string;
          horaInicio: string;
          horaTermino: string;
          centro: string;
          telemedicina: boolean;
        }>
      ).map((s) => ({
        doctorExternalId: doctorId,
        date: s.fecha,
        startTime: s.horaInicio,
        endTime: s.horaTermino,
        sede: s.centro,
        isTelemedicine: s.telemedicina,
        rawData: s as unknown as Record<string, unknown>,
      }));
    } catch {
      return [];
    }
  }
}
