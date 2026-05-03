import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CLCScraper } from "@/lib/scrapers/clc";
import { AlemanaScraper } from "@/lib/scrapers/alemana";
import { SantaMariaScraper } from "@/lib/scrapers/santa-maria";
import { IndisaScraper } from "@/lib/scrapers/indisa";
import type { ClinicId, ClinicScraper } from "@/lib/scrapers/base";

const scrapers: Record<ClinicId, ClinicScraper> = {
  clc: new CLCScraper(),
  alemana: new AlemanaScraper(),
  santa_maria: new SantaMariaScraper(),
  indisa: new IndisaScraper(),
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clinicId, specialtyCode, centerId } = body as {
    clinicId: ClinicId;
    specialtyCode?: string;
    centerId?: string;
  };

  if (!clinicId || !scrapers[clinicId]) {
    return NextResponse.json(
      { error: "Valid clinicId required: clc, alemana, santa_maria, indisa" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startTime = Date.now();
  const { data: run } = await supabase
    .from("scrape_runs")
    .insert({ clinic_id: clinicId, status: "running" })
    .select()
    .single();

  try {
    const scraper = scrapers[clinicId];

    if (clinicId === "clc" && specialtyCode) {
      const clcScraper = scraper as CLCScraper;
      const results = await clcScraper.scrapeFirstAvailable(
        specialtyCode,
        centerId || "1",
        10
      );

      let doctorsInserted = 0;
      let slotsInserted = 0;

      for (const result of results) {
        const centerName =
          result.centroMedico === "1"
            ? "Estoril"
            : result.centroMedico === "2"
              ? "Chicureo"
              : result.centroMedico === "5"
                ? "Peñalolén"
                : `Centro ${result.centroMedico}`;

        const { data: doctor } = await supabase
          .from("doctors")
          .upsert(
            {
              clinic_id: clinicId,
              external_id: result.medicoCod,
              name: result.medicoNombre,
              specialty_raw:
                result.areaMedicaEspecifica?.[0]?.areaMedEspDesc ?? "",
              sede: centerName,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "clinic_id,external_id" }
          )
          .select("id")
          .single();

        if (doctor) {
          doctorsInserted++;
          for (const hora of result.horasDisponibles ?? []) {
            const [dd, mm, yyyy] = result.fecha.split("-");
            const isoDate = `${yyyy}-${mm}-${dd}`;

            await supabase.from("available_slots").upsert(
              {
                doctor_id: doctor.id,
                clinic_id: clinicId,
                date: isoDate,
                start_time: hora.hora.trim(),
                sede: centerName,
                is_telemedicine: false,
                is_available: true,
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "doctor_id,date,start_time" }
            );
            slotsInserted++;
          }
        }
      }

      const durationMs = Date.now() - startTime;
      await supabase
        .from("scrape_runs")
        .update({
          status: "success",
          slots_found: slotsInserted,
          slots_new: slotsInserted,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run?.id);

      return NextResponse.json({
        success: true,
        clinicId,
        doctorsFound: results.length,
        doctorsInserted,
        slotsInserted,
        durationMs,
      });
    }

    const specialties = await scraper.scrapeSpecialties();

    const durationMs = Date.now() - startTime;
    await supabase
      .from("scrape_runs")
      .update({
        status: "success",
        slots_found: specialties.length,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run?.id);

    return NextResponse.json({
      success: true,
      clinicId,
      specialtiesFound: specialties.length,
      specialties: specialties.slice(0, 20),
      durationMs,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    await supabase
      .from("scrape_runs")
      .update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Unknown",
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run?.id);

    return NextResponse.json(
      { error: "Scrape failed", details: String(error) },
      { status: 500 }
    );
  }
}
