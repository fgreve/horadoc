import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";

interface AlemanaProfessional {
  indice: number;
  nombres: string;
  apellido_primero: string;
  apellido_segundo: string;
  nombre_apellido: string;
  primera_hora?: AlemanaPrimeraHora[];
}

interface AlemanaPrimeraHora {
  primera_hora_fecha: string;
  primera_hora: string;
  prestacion: number;
  id_servicio: number;
  id_calendario: number;
  sucursal: { codigo: number; nombre: string };
}

interface AlemanaSlotResponse {
  hora: string;
  prestacion?: number;
  calendario?: number;
}

export class AlemanaScraper extends ClinicScraper {
  readonly clinicId: "alemana" | "santa_maria" = "alemana";
  protected readonly empresa: string = "1";
  protected readonly baseUrl = "https://reserva.alemana.cl";

  protected readonly sucursales: Record<string, string> = {
    "1": "Vitacura",
    "2": "La Dehesa",
    "4": "San Carlos de Apoquindo",
    "8": "Maitencillo",
    "10": "Chicureo",
    "14": "Plaza Egaña",
  };

  private csrfToken: string | null = null;
  private cookies: string | null = null;

  private async initSession(): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/reserva/portal/busqueda?empresa=${this.empresa}`
      );
      const html = await response.text();

      const csrfMatch = html.match(/csrfToken['"]\s*:\s*['"]([^'"]+)['"]/);
      if (csrfMatch) {
        this.csrfToken = csrfMatch[1];
      }

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        this.cookies = setCookie;
      }

      return !!this.csrfToken;
    } catch {
      return false;
    }
  }

  private async fetchPage(url: string): Promise<string | null> {
    try {
      const headers: Record<string, string> = {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-CL,es;q=0.9",
      };
      if (this.cookies) headers["Cookie"] = this.cookies;
      if (this.csrfToken) headers["X-CSRF-TOKEN"] = this.csrfToken;

      const response = await this.fetchWithRetry(url, { headers });
      return await response.text();
    } catch {
      return null;
    }
  }

  private parseParametrosBack(html: string): Record<string, unknown> | null {
    const match = html.match(/:parametros-back="([^"]+)"/);
    if (!match) return null;

    try {
      const decoded = match[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#039;/g, "'");
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    await this.initSession();

    const html = await this.fetchPage(
      `${this.baseUrl}/reserva/portal/busqueda?empresa=${this.empresa}`
    );
    if (!html) return [];

    const specialties: RawSpecialty[] = [];
    const optionRegex =
      /<option[^>]*value="(\d+)"[^>]*>([^<]+)<\/option>/g;
    let optMatch;
    while ((optMatch = optionRegex.exec(html)) !== null) {
      if (optMatch[1] !== "0") {
        specialties.push({
          externalId: optMatch[1],
          name: optMatch[2].trim(),
        });
      }
    }

    return specialties;
  }

  async scrapeDoctors(specialtyId: string): Promise<RawDoctor[]> {
    if (!this.csrfToken) await this.initSession();

    const today = this.formatDate(new Date());
    const html = await this.fetchPage(
      `${this.baseUrl}/reserva/portal/resultado/area-medica?empresa=${this.empresa}&tipo_busqueda=1&area_medica=${specialtyId}&ubicacion=99&horario=A&fecha=${today}`
    );
    if (!html) return [];

    const params = this.parseParametrosBack(html);
    if (!params || !Array.isArray(params.profesionales)) return [];

    return (params.profesionales as AlemanaProfessional[]).map((p) => ({
      externalId: String(p.indice),
      name: p.nombre_apellido || `${p.apellido_primero} ${p.apellido_segundo}, ${p.nombres}`,
      specialtyRaw: "",
      sede: p.primera_hora?.[0]?.sucursal?.nombre,
    }));
  }

  async scrapeSlots(
    doctorId: string,
    dateRange: DateRange
  ): Promise<RawSlot[]> {
    if (!this.csrfToken) await this.initSession();

    const slots: RawSlot[] = [];
    const current = new Date(dateRange.from);

    while (current <= dateRange.to) {
      const dateStr = this.formatDate(current);
      const day = current.getDate();

      try {
        const headers: Record<string, string> = {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        };
        if (this.cookies) headers["Cookie"] = this.cookies;
        if (this.csrfToken) headers["X-CSRF-TOKEN"] = this.csrfToken;

        const response = await this.fetchWithRetry(
          `${this.baseUrl}/reserva/portal/disponibilidad/dia/profesional?empresa=${this.empresa}&profesional=${doctorId}&tipo_busqueda=1&area_medica=0&area_interes=0&ubicacion=99&tipo_di=&di=&super_centro=&centro=&horario=A&idioma=&fecha=${dateStr}&dia=${day}&sobrecupo=false`,
          { headers }
        );

        const data = (await response.json()) as AlemanaSlotResponse[];
        if (Array.isArray(data)) {
          for (const slot of data) {
            const [dd, mm, yyyy] = dateStr.split("/");
            slots.push({
              doctorExternalId: doctorId,
              date: `${yyyy}-${mm}-${dd}`,
              startTime: slot.hora,
              isTelemedicine: false,
              rawData: slot as unknown as Record<string, unknown>,
            });
          }
        }
      } catch {
        // Skip days that fail
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  protected formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
}
