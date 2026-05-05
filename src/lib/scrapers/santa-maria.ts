import {
  ClinicScraper,
  DateRange,
  RawDoctor,
  RawSlot,
  RawSpecialty,
} from "./base";
import { santaMariaGet } from "./santa-maria-api";

interface SMEspecialidad {
  codEspComercial: number;
  descEspComercial: string;
}

interface SMEstudio {
  tipoEstudio: string;
  codigo: number;
  descripcion: string;
}

interface SMDoctor {
  rutProf: number;
  dvProf: string;
  primerNombre: string;
  segundoNombre: string | null;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  codProfesion: number;
  desProfesion: string;
  estudios: SMEstudio[];
}

interface SMSucursal {
  codSucursal: number;
  desSucursal: string;
  abreviatura: string;
}

export class SantaMariaScraper extends ClinicScraper {
  readonly clinicId = "santa_maria" as const;
  private specialtyCache: SMEspecialidad[] | null = null;

  async scrapeSpecialties(): Promise<RawSpecialty[]> {
    try {
      const data = await santaMariaGet<{
        especComerciales: SMEspecialidad[];
      }>("/api/comun/especialidades", { codEmpresa: "2" });

      this.specialtyCache = data.especComerciales || [];
      return this.specialtyCache.map((s) => ({
        externalId: String(s.codEspComercial),
        name: s.descEspComercial,
      }));
    } catch {
      return [];
    }
  }

  async scrapeDoctors(specialtyId: string): Promise<RawDoctor[]> {
    try {
      const data = await santaMariaGet<{
        datosMedico: SMDoctor[];
      }>("/api/especialista/especialistas", {
        codEmpresa: "2",
        codEspecialidad: specialtyId,
      });

      const doctors = data.datosMedico || [];

      // Filter doctors whose estudios match the requested specialty description
      const specName = this.specialtyCache?.find(
        (s) => String(s.codEspComercial) === specialtyId,
      )?.descEspComercial?.toUpperCase();

      const filtered = specName
        ? doctors.filter((d) =>
            d.estudios?.some((e) =>
              specName.includes(e.descripcion) ||
              e.descripcion.includes(specName.split(" ")[0]),
            ),
          )
        : doctors;

      return filtered.slice(0, 100).map((d) => {
        const primarySpec =
          d.estudios?.find((e) => e.tipoEstudio === "ESPECIALIDAD")
            ?.descripcion || "";
        return {
          externalId: `${d.rutProf}-${d.dvProf}`,
          name: d.nombreCompleto.trim(),
          specialtyRaw: primarySpec,
        };
      });
    } catch {
      return [];
    }
  }

  async scrapeSucursales(): Promise<SMSucursal[]> {
    try {
      const data = await santaMariaGet<{
        sucursales: SMSucursal[];
      }>("/api/comun/sucursales", { codEmpresa: "2" });
      return data.sucursales || [];
    } catch {
      return [];
    }
  }

  async scrapeSlots(
    _doctorId: string,
    _dateRange: DateRange,
  ): Promise<RawSlot[]> {
    // Calendar/availability endpoints require patient RUT authentication.
    // Slots will be populated once patient-context scraping is implemented.
    return [];
  }

  async scrapeAllDoctorsWithSpecialties(): Promise<
    { doctor: RawDoctor; specialties: string[] }[]
  > {
    try {
      const data = await santaMariaGet<{
        datosMedico: SMDoctor[];
      }>("/api/especialista/especialistas", { codEmpresa: "2" });

      return (data.datosMedico || []).map((d) => ({
        doctor: {
          externalId: `${d.rutProf}-${d.dvProf}`,
          name: d.nombreCompleto.trim(),
          specialtyRaw:
            d.estudios?.find((e) => e.tipoEstudio === "ESPECIALIDAD")
              ?.descripcion || "",
        },
        specialties: (d.estudios || [])
          .filter((e) => e.tipoEstudio === "ESPECIALIDAD")
          .map((e) => e.descripcion),
      }));
    } catch {
      return [];
    }
  }
}
