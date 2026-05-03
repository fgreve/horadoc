export type ClinicId = "indisa" | "clc" | "santa_maria" | "alemana";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface RawSpecialty {
  externalId: string;
  name: string;
}

export interface RawDoctor {
  externalId: string;
  name: string;
  specialtyRaw: string;
  sede?: string;
}

export interface RawSlot {
  doctorExternalId: string;
  date: string;
  startTime: string;
  endTime?: string;
  sede?: string;
  isTelemedicine?: boolean;
  rawData?: Record<string, unknown>;
}

export interface ScrapeResult {
  clinicId: ClinicId;
  slotsFound: number;
  slotsNew: number;
  slotsRemoved: number;
  durationMs: number;
  error?: string;
}

export abstract class ClinicScraper {
  abstract readonly clinicId: ClinicId;

  abstract scrapeSpecialties(): Promise<RawSpecialty[]>;
  abstract scrapeDoctors(specialtyId: string): Promise<RawDoctor[]>;
  abstract scrapeSlots(doctorId: string, dateRange: DateRange): Promise<RawSlot[]>;

  protected async fetchWithRetry(
    url: string,
    options?: RequestInit,
    retries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            ...options?.headers,
          },
        });
        if (response.ok) return response;
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
    throw lastError;
  }
}
