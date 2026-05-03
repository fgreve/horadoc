import { createClient } from "@supabase/supabase-js";
import { CLCScraper } from "../src/lib/scrapers/clc";
import { readFileSync } from "fs";
import { resolve } from "path";

const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const POPULAR_SPECIALTIES = [
  { gen: "15", esp: "58", name: "Dermatología Adulto" },
  { gen: "27", esp: "171", name: "Oftalmología" },
  { gen: "12", esp: "44", name: "Cardiología" },
  { gen: "26", esp: "170", name: "Neurología Adulto" },
  { gen: "34", esp: "220", name: "Traumatología Adulto" },
  { gen: "22", esp: "148", name: "Ginecología" },
  { gen: "19", esp: "80", name: "Gastroenterología" },
  { gen: "39", esp: "68", name: "Urología" },
  { gen: "53", esp: "260", name: "Pediatría General" },
  { gen: "30", esp: "187", name: "Psiquiatría Adulto" },
];

async function main() {
  const scraper = new CLCScraper();
  const centers = ["1", "2", "5"];
  let totalDoctors = 0;
  let totalSlots = 0;

  console.log("=== Seeding CLC data from live API ===\n");

  const mondayStr = "05-05-2026";
  console.log(`Using date: ${mondayStr} (Monday)\n`);

  for (const spec of POPULAR_SPECIALTIES) {
    console.log(`Scraping: ${spec.name} (espCode: ${spec.esp})...`);

    for (const centerId of centers) {
      const baseUrl = "https://www1.miclc.cl:8443/Api/ApiAgendaWeb/api/v1";
      const url = `${baseUrl}/ListaPrimerasHorasDisponiblesMedicoAreaEspTest?idCentro=${centerId}&areaEspCod=${spec.esp}&fechaConsulta=${mondayStr}&proxCitas=10`;
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json", "x-request-id": crypto.randomUUID() },
      });
      const json = await response.json();
      if (!json.success || !json.data?.length) continue;
      const results = json.data;
      if (results.length === 0) continue;

      const centerName =
        centerId === "1" ? "Estoril" : centerId === "2" ? "Chicureo" : "Peñalolén";

      console.log(`  ${centerName}: ${results.length} doctors`);

      for (const result of results) {
        const { data: doctor, error: docErr } = await supabase
          .from("doctors")
          .upsert(
            {
              clinic_id: "clc",
              external_id: result.medicoCod,
              name: result.medicoNombre,
              specialty_raw: spec.name,
              sede: centerName,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "clinic_id,external_id" }
          )
          .select("id")
          .single();

        if (docErr || !doctor) {
          console.error(`    Error upserting doctor ${result.medicoNombre}:`, docErr?.message);
          continue;
        }

        totalDoctors++;

        for (const hora of result.horasDisponibles ?? []) {
          const [dd, mm, yyyy] = result.fecha.split("-");
          const isoDate = `${yyyy}-${mm}-${dd}`;

          const { error: slotErr } = await supabase
            .from("available_slots")
            .upsert(
              {
                doctor_id: doctor.id,
                clinic_id: "clc",
                date: isoDate,
                start_time: hora.hora.trim(),
                sede: centerName,
                is_telemedicine: false,
                is_available: true,
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "doctor_id,date,start_time" }
            );

          if (!slotErr) totalSlots++;
        }
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Doctors upserted: ${totalDoctors}`);
  console.log(`Slots upserted: ${totalSlots}`);
}

main().catch(console.error);
