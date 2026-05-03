import { readFileSync } from "fs";
import { resolve } from "path";

const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

async function main() {
  // Step 1: Get search page and extract CSRF + specialties
  console.log("1. Fetching search page...");
  const searchResp = await fetch(
    "https://reserva.alemana.cl/reserva/portal/busqueda?empresa=1",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
    }
  );

  const cookies = searchResp.headers.get("set-cookie") || "";
  const html = await searchResp.text();

  const csrfMatch = html.match(/csrfToken.*?:\s*["']([^"']+)["']/);
  const csrf = csrfMatch ? csrfMatch[1] : "";
  console.log("   CSRF:", csrf.slice(0, 20) + "...");
  console.log("   Cookies:", cookies.slice(0, 80) + "...");

  // Extract specialty options from the search form
  // The page uses Vue with el-select, specialties are in a JS data structure
  const areasMatch = html.match(/areas_medicas.*?:\s*(\[[\s\S]*?\])\s*[,}]/);
  if (areasMatch) {
    console.log("   Found areas_medicas in JS data");
  }

  // Try to find specialties in select options or Vue data
  const selectMatch = html.match(/<el-option[^>]*value="(\d+)"[^>]*label="([^"]+)"/g);
  if (selectMatch) {
    console.log("   Found", selectMatch.length, "el-option tags");
  }

  // Step 2: Fetch results page for Oftalmología (area 171)
  console.log("\n2. Fetching results for Oftalmología (area 171)...");
  const resultResp = await fetch(
    "https://reserva.alemana.cl/reserva/portal/resultado/area-medica?empresa=1&tipo_busqueda=1&area_medica=171&ubicacion=99&horario=A&fecha=05/05/2026",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
        Cookie: cookies.split(",").map(c => c.split(";")[0]).join("; "),
        Referer: "https://reserva.alemana.cl/reserva/portal/busqueda?empresa=1",
      },
    }
  );

  console.log("   Status:", resultResp.status);
  const resultHtml = await resultResp.text();
  console.log("   HTML length:", resultHtml.length);

  // Look for parametros-back
  const paramMatch = resultHtml.match(/:parametros-back="([^"]+)"/);
  if (paramMatch) {
    console.log("   Found :parametros-back prop!");
    const decoded = paramMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'");

    try {
      const data = JSON.parse(decoded);
      console.log("   Keys:", Object.keys(data).join(", "));
      if (data.profesionales) {
        console.log("   Profesionales count:", data.profesionales.length);
        if (data.profesionales[0]) {
          const p = data.profesionales[0];
          console.log("   First doctor:", JSON.stringify(p).slice(0, 200));
        }
      }
      if (data.sucursales) {
        console.log("   Sucursales:", JSON.stringify(data.sucursales));
      }
    } catch (e: any) {
      console.log("   JSON parse error:", e.message);
      console.log("   Decoded start:", decoded.slice(0, 200));
    }
  } else {
    console.log("   No :parametros-back found");
    console.log("   Looking for Vue data...");
    const vueData = resultHtml.match(/profesionales.*?(\[[\s\S]{0,200})/);
    if (vueData) console.log("   Found profesionales ref:", vueData[1].slice(0, 100));

    // Check if blocked
    if (resultHtml.includes("datadome") || resultHtml.includes("captcha")) {
      console.log("   BLOCKED by bot protection!");
    }
    console.log("   First 300 chars:", resultHtml.slice(0, 300));
  }

  // Step 3: Try availability endpoint
  console.log("\n3. Testing availability endpoint...");
  const availResp = await fetch(
    "https://reserva.alemana.cl/reserva/portal/disponibilidad/dia/profesional?empresa=1&profesional=6122068&tipo_busqueda=1&area_medica=171&area_interes=0&ubicacion=99&tipo_di=&di=&super_centro=&centro=&horario=A&idioma=&fecha=05/05/2026&dia=5&sobrecupo=false",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookies.split(",").map(c => c.split(";")[0]).join("; "),
        "X-CSRF-TOKEN": csrf,
        Referer: "https://reserva.alemana.cl/reserva/portal/resultado/area-medica",
      },
    }
  );

  console.log("   Status:", availResp.status);
  const availText = await availResp.text();
  console.log("   Response length:", availText.length);
  console.log("   Response:", availText.slice(0, 300));
}

main().catch(console.error);
