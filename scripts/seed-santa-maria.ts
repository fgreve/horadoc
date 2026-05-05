import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { SantaMariaScraper } from "../src/lib/scrapers/santa-maria";

const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  console.log("=== Seeding Santa María from Real API ===\n");

  const scraper = new SantaMariaScraper();

  // 1. Get specialties
  console.log("1. Fetching specialties...");
  const specialties = await scraper.scrapeSpecialties();
  console.log(`   Found ${specialties.length} specialties`);
  for (const s of specialties.slice(0, 10)) {
    console.log(`     ${s.externalId}: ${s.name}`);
  }

  // 2. Get all doctors with their specialty mappings
  console.log("\n2. Fetching all doctors...");
  const allDocs = await scraper.scrapeAllDoctorsWithSpecialties();
  console.log(`   Found ${allDocs.length} doctors total`);

  // Count per specialty
  const specCounts: Record<string, number> = {};
  for (const { specialties: specs } of allDocs) {
    for (const s of specs) {
      specCounts[s] = (specCounts[s] || 0) + 1;
    }
  }
  const topSpecs = Object.entries(specCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  console.log("   Top specialties:");
  for (const [name, count] of topSpecs) {
    console.log(`     ${name}: ${count} doctors`);
  }

  // 3. Get sucursales
  console.log("\n3. Fetching sucursales...");
  const sucursales = await scraper.scrapeSucursales();
  console.log(`   Found ${sucursales.length} sucursales:`);
  for (const s of sucursales) {
    console.log(`     ${s.codSucursal}: ${s.desSucursal} (${s.abreviatura})`);
  }

  // 4. Upsert doctors into database
  console.log("\n4. Upserting doctors into database...");
  let inserted = 0;
  const batchSize = 20;

  for (let i = 0; i < allDocs.length; i += batchSize) {
    const batch = allDocs.slice(i, i + batchSize);
    const records = batch.map(({ doctor }) => ({
      clinic_id: "santa_maria" as const,
      external_id: doctor.externalId,
      name: doctor.name,
      specialty_raw: doctor.specialtyRaw,
      last_seen_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("doctors")
      .upsert(records, { onConflict: "clinic_id,external_id" });

    if (error) {
      console.log(`   Error at batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }

    process.stdout.write(
      `   Processed ${Math.min(i + batchSize, allDocs.length)}/${allDocs.length} doctors\r`,
    );
  }

  console.log(`\n   Upserted ${inserted} doctors`);

  // 5. Print final stats
  const { count: docCount } = await supabase
    .from("doctors")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", "santa_maria");
  const { count: slotCount } = await supabase
    .from("available_slots")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", "santa_maria")
    .eq("is_available", true);
  console.log(`\n=== DB: Santa María has ${docCount} doctors, ${slotCount} slots ===`);
}

main().catch(console.error);
