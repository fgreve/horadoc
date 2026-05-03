import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";

export class CLCScraper extends ClinicScraper {
  readonly clinicId = "clc" as const;
  private readonly baseUrl = "https://www.clinicalascondes.cl";

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/especialidades`
      );
      const data = await response.json();
      return (data as Array<{ codigo: string; nombre: string }>).map((s) => ({
        externalId: s.codigo,
        name: s.nombre,
      }));
    } catch {
      return [];
    }
  }

  async scrapeDoctors(specialtyId: string): Promise<RawDoctor[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/api/medicos?especialidad=${specialtyId}`
      );
      const data = await response.json();
      return (
        data as Array<{
          codigo: string;
          nombre: string;
          especialidad: string;
          centro: string;
        }>
      ).map((d) => ({
        externalId: d.codigo,
        name: d.nombre,
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
        `${this.baseUrl}/api/disponibilidad?medico=${doctorId}&desde=${from}&hasta=${to}`
      );
      const data = await response.json();
      return (
        data as Array<{
          fecha: string;
          horaInicio: string;
          horaFin: string;
          centro: string;
          virtual: boolean;
        }>
      ).map((s) => ({
        doctorExternalId: doctorId,
        date: s.fecha,
        startTime: s.horaInicio,
        endTime: s.horaFin,
        sede: s.centro,
        isTelemedicine: s.virtual,
        rawData: s as unknown as Record<string, unknown>,
      }));
    } catch {
      return [];
    }
  }
}
