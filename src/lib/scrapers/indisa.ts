import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";

/**
 * INDISA uses the Eniax third-party booking widget (agendaweb.indisa.cl).
 * The Eniax widget requires reCAPTCHA to establish a session, making direct
 * API scraping impractical without a browser automation layer.
 * For MVP, this scraper returns fallback specialties and empty slot data.
 */

interface EniaxInsurance {
  id: string;
  name: string;
}

export class IndisaScraper extends ClinicScraper {
  readonly clinicId = "indisa" as const;
  private readonly widgetBase = "https://agendaweb.indisa.cl";

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    try {
      const response = await this.fetchWithRetry(
        `${this.widgetBase}/api/v1/medical-insurances`,
        { headers: { Accept: "application/json" } }
      );
      const data = (await response.json()) as EniaxInsurance[];
      if (!Array.isArray(data)) return this.getFallbackSpecialties();
      return data.map((item) => ({
        externalId: item.id,
        name: item.name,
      }));
    } catch {
      return this.getFallbackSpecialties();
    }
  }

  async scrapeDoctors(_specialtyId: string): Promise<RawDoctor[]> {
    return [];
  }

  async scrapeSlots(
    _doctorId: string,
    _dateRange: DateRange
  ): Promise<RawSlot[]> {
    return [];
  }

  private getFallbackSpecialties(): RawSpecialty[] {
    return [
      { externalId: "consulta-medica", name: "Consulta Médica" },
      { externalId: "pediatria", name: "Pediatría" },
      { externalId: "ginecologia", name: "Ginecología" },
      { externalId: "oftalmologia", name: "Oftalmología" },
      { externalId: "dermatologia", name: "Dermatología" },
      { externalId: "traumatologia", name: "Traumatología" },
      { externalId: "cardiologia", name: "Cardiología" },
      { externalId: "neurologia", name: "Neurología" },
      { externalId: "urologia", name: "Urología" },
      { externalId: "otorrino", name: "Otorrinolaringología" },
    ];
  }
}
