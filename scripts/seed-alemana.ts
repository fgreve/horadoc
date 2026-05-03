import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = "https://reserva.alemana.cl";

interface SessionInfo {
  csrf: string;
  cookies: string;
}

interface SlotData {
  fecha: string;
  hora: string;
  sucursal: string;
  sucursal_indice: string;
  servicio_indice: number;
  prestacion: number;
  calendario: number;
  prestacion_nombre: string;
  servicio: string;
}

async function getSession(empresa: string): Promise<SessionInfo | null> {
  const r = await fetch(`${BASE_URL}/reserva/portal/busqueda?empresa=${empresa}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await r.text();
  const csrfMatch = html.match(/csrfToken.*?:\s*["']([^"']+)["']/);
  const rawCookies = r.headers.get("set-cookie") || "";
  if (!csrfMatch) return null;
  return {
    csrf: csrfMatch[1],
    cookies: rawCookies.split(",").map((c) => c.split(";")[0]).join("; "),
  };
}

async function fetchSlots(
  empresa: string,
  doctorIndice: number,
  date: string,
  day: number,
  session: SessionInfo
): Promise<SlotData[]> {
  try {
    const r = await fetch(
      `${BASE_URL}/reserva/portal/disponibilidad/dia/profesional?empresa=${empresa}&profesional=${doctorIndice}&tipo_busqueda=1&area_medica=0&area_interes=0&ubicacion=99&tipo_di=&di=&super_centro=&centro=&horario=A&idioma=&fecha=${date}&dia=${day}&sobrecupo=false`,
      {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          Cookie: session.cookies,
          "X-CSRF-TOKEN": session.csrf,
          Referer: `${BASE_URL}/reserva/portal/resultado/area-medica`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getAllProfessionals(
  empresa: string,
  session: SessionInfo
): Promise<{ indice: number; nombre_apellido: string }[]> {
  const r = await fetch(
    `${BASE_URL}/reserva/portal/resultado/area-medica?empresa=${empresa}&tipo_busqueda=1&area_medica=171&ubicacion=99&horario=A&fecha=05/05/2026`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
        Cookie: session.cookies,
      },
    }
  );
  const html = await r.text();
  const paramMatch = html.match(/:parametros-back="([^"]+)"/);
  if (!paramMatch) return [];

  const decoded = paramMatch[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'");

  const data = JSON.parse(decoded);
  return (data.profesionales || []).map((p: any) => ({
    indice: p.indice,
    nombre_apellido:
      p.nombre_apellido ||
      `${p.nombres} ${p.apellido_primero} ${p.apellido_segundo}`.trim(),
  }));
}

async function seedClinic(empresa: string, clinicId: "alemana" | "santa_maria") {
  const clinicName = empresa === "1" ? "Clínica Alemana" : "Clínica Santa María";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Seeding ${clinicName} (empresa=${empresa})`);
  console.log("=".repeat(50));

  const session = await getSession(empresa);
  if (!session) {
    console.log("ERROR: Could not establish session");
    return;
  }
  console.log("Session OK");

  // Get all professionals (the list is shared across all specialties)
  const allProfs = await getAllProfessionals(empresa, session);
  console.log(`Total professionals: ${allProfs.length}`);

  // Sample every Nth doctor to cover the list
  const sampleSize = 100;
  const step = Math.max(1, Math.floor(allProfs.length / sampleSize));
  const sample = allProfs.filter((_, i) => i % step === 0).slice(0, sampleSize);
  console.log(`Sampling ${sample.length} doctors for availability...\n`);

  let totalDoctors = 0;
  let totalSlots = 0;
  const dates = [
    { str: "05/05/2026", day: 5 },
    { str: "06/05/2026", day: 6 },
    { str: "07/05/2026", day: 7 },
    { str: "08/05/2026", day: 8 },
    { str: "09/05/2026", day: 9 },
  ];

  // Process in batches of 5 concurrent requests
  const batchSize = 5;
  for (let i = 0; i < sample.length; i += batchSize) {
    const batch = sample.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (prof) => {
        let doctorInserted = false;
        let doctorId: string | null = null;

        for (const { str, day } of dates) {
          const slots = await fetchSlots(empresa, prof.indice, str, day, session);
          if (slots.length === 0) continue;

          if (!doctorInserted) {
            const specialty = slots[0].servicio
              ? slots[0].servicio.replace(/ (VIT|LD|SCA|CHI|PE)$/, "").trim()
              : "General";

            const { data: doc } = await supabase
              .from("doctors")
              .upsert(
                {
                  clinic_id: clinicId,
                  external_id: String(prof.indice),
                  name: prof.nombre_apellido,
                  specialty_raw: specialty,
                  sede: slots[0].sucursal,
                  last_seen_at: new Date().toISOString(),
                },
                { onConflict: "clinic_id,external_id" }
              )
              .select("id")
              .single();

            if (!doc) return;
            doctorId = doc.id;
            doctorInserted = true;
            totalDoctors++;
          }

          for (const slot of slots) {
            const [dd, mm, yyyy] = slot.fecha.split("/");
            const isoDate = `${yyyy}-${mm}-${dd}`;
            await supabase.from("available_slots").upsert(
              {
                doctor_id: doctorId,
                clinic_id: clinicId,
                date: isoDate,
                start_time: slot.hora,
                sede: slot.sucursal,
                is_telemedicine: false,
                is_available: true,
                raw_data: { prestacion: slot.prestacion_nombre, servicio: slot.servicio },
                last_seen_at: new Date().toISOString(),
              },
              { onConflict: "doctor_id,date,start_time" }
            );
            totalSlots++;
          }
        }
      })
    );

    process.stdout.write(
      `  Processed ${Math.min(i + batchSize, sample.length)}/${sample.length} | ${totalDoctors} docs, ${totalSlots} slots\r`
    );
  }

  console.log(`\n\n  TOTAL ${clinicName}: ${totalDoctors} doctors, ${totalSlots} slots`);
}

async function main() {
  console.log("=== Seeding Alemana + Santa María (sampling approach) ===");
  console.log("Strategy: sample 100 doctors from full list, query 5 days each\n");

  await seedClinic("1", "alemana");
  await seedClinic("2", "santa_maria");

  // Print final stats
  for (const clinic of ["alemana", "santa_maria"] as const) {
    const { count: docCount } = await supabase
      .from("doctors")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic);
    const { count: slotCount } = await supabase
      .from("available_slots")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic)
      .eq("is_available", true);
    console.log(`DB ${clinic}: ${docCount} doctors, ${slotCount} slots`);
  }
}

main().catch(console.error);
