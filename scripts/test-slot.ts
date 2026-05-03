process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  // Get session
  const r1 = await fetch(
    "https://reserva.alemana.cl/reserva/portal/busqueda?empresa=1",
    { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
  );
  const html = await r1.text();
  const csrfMatch = html.match(/csrfToken.*?:\s*["']([^"']+)["']/);
  const csrf = csrfMatch ? csrfMatch[1] : "";
  const cookies = (r1.headers.get("set-cookie") || "")
    .split(",")
    .map((c) => c.split(";")[0])
    .join("; ");

  // Extract areas_medicas from the search page JS
  const areasMatch = html.match(/areas_medicas\s*:\s*(\[[\s\S]*?\])\s*,/);
  if (areasMatch) {
    try {
      const areas = JSON.parse(areasMatch[1]);
      console.log("Found", areas.length, "areas_medicas on search page");
      console.log("First 20:");
      for (const a of areas.slice(0, 20)) {
        console.log(`  ${a.codigo || a.id}: ${a.nombre || a.descripcion}`);
      }
    } catch (e: any) {
      console.log("Parse error:", e.message);
      console.log("Raw:", areasMatch[1].slice(0, 200));
    }
  } else {
    // Try to find the specialty list in the HTML differently
    console.log("No areas_medicas found. Searching for specialty data...");

    // Look for Vue data bindings
    const dataMatch = html.match(/data\s*\(\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\}\s*\}/);
    if (dataMatch) console.log("Found Vue data():", dataMatch[1].slice(0, 200));

    // Try extracting from select/el-select elements
    const selectBlock = html.match(/area_medica[\s\S]{0,2000}/);
    if (selectBlock) console.log("area_medica context:", selectBlock[0].slice(0, 300));
  }

  // Now test fetching Oftalmologia (171) and sampling for doctors with slots
  console.log("\n--- Testing Oftalmología (171) with slot fetching ---");
  const resultResp = await fetch(
    "https://reserva.alemana.cl/reserva/portal/resultado/area-medica?empresa=1&tipo_busqueda=1&area_medica=171&ubicacion=99&horario=A&fecha=05/05/2026",
    { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html", Cookie: cookies } }
  );
  const resultHtml = await resultResp.text();
  const paramMatch = resultHtml.match(/:parametros-back="([^"]+)"/);
  if (!paramMatch) { console.log("No parametros-back!"); return; }

  const decoded = paramMatch[1]
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'");
  const data = JSON.parse(decoded);

  // Check calendario - this tells which days have availability
  const calKeys = Object.keys(data.calendario || {});
  console.log("Calendario days with data:", calKeys.length, "->", calKeys.slice(0, 5));
  if (calKeys.length > 0) {
    const firstDay = data.calendario[calKeys[0]];
    console.log("Day", calKeys[0], "structure:", JSON.stringify(firstDay).slice(0, 200));
  }

  // Get doctor indices from calendario entries
  const doctorIndicesFromCal = new Set<number>();
  for (const day of Object.values(data.calendario || {}) as any[]) {
    if (day?.profesionales) {
      for (const idx of day.profesionales) doctorIndicesFromCal.add(idx);
    }
  }
  console.log("Unique doctor indices in calendario:", doctorIndicesFromCal.size);

  // Fetch slots for doctors that appear in the calendario
  const calDoctors = [...doctorIndicesFromCal].slice(0, 10);
  console.log("\nFetching slots for", calDoctors.length, "calendario doctors...");

  let totalWithSlots = 0;
  for (const idx of calDoctors) {
    const prof = data.profesionales.find((p: any) => p.indice === idx);
    const name = prof?.nombre_apellido || `ID:${idx}`;
    const url = `https://reserva.alemana.cl/reserva/portal/disponibilidad/dia/profesional?empresa=1&profesional=${idx}&tipo_busqueda=1&area_medica=171&area_interes=0&ubicacion=99&tipo_di=&di=&super_centro=&centro=&horario=A&idioma=&fecha=05/05/2026&dia=5&sobrecupo=false`;
    const r = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookies,
        "X-CSRF-TOKEN": csrf,
        Referer: "https://reserva.alemana.cl/reserva/portal/resultado/area-medica",
      },
    });
    const slots = await r.json();
    const count = Array.isArray(slots) ? slots.length : 0;
    if (count > 0) {
      totalWithSlots++;
      console.log(`  ✓ ${name}: ${count} slots - ${slots[0].hora} @ ${slots[0].sucursal}`);
    }
  }
  console.log(`\n${totalWithSlots}/${calDoctors.length} doctors had slots on Monday`);
}

main().catch(console.error);
