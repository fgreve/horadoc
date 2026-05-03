import { CLCScraper } from "../src/lib/scrapers/clc";

async function main() {
  const scraper = new CLCScraper();

  console.log("=== Testing CLC Scraper ===\n");

  console.log("1. Fetching medical centers...");
  const centers = await scraper.scrapeCenters();
  console.log(`   Found ${centers.length} centers:`, centers);

  console.log("\n2. Fetching specialties...");
  const specialties = await scraper.scrapeSpecialties();
  console.log(`   Found ${specialties.length} specialties`);
  console.log("   First 5:", specialties.slice(0, 5));

  if (specialties.length > 0) {
    const testSpecialty = specialties[0];
    console.log(`\n3. Fetching first-available for specialty "${testSpecialty.name}" (code ${testSpecialty.externalId})...`);
    const results = await scraper.scrapeFirstAvailable(testSpecialty.externalId, "1", 3);
    console.log(`   Found ${results.length} doctors with availability`);
    if (results.length > 0) {
      console.log("   First result:", JSON.stringify(results[0], null, 2).slice(0, 500));
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
