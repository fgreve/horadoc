import * as crypto from "crypto";
import { v1 as uuidv1 } from "uuid";

const RSA_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAraQCAhnWWzV9JwlXeO3G
oIH+OxslGRjq3DRKJmaiOkrhvJDEcxSSMVq7H7pKF+/V5oNAoiI4VyuZ4jG6E/NE
+t8IXnvdX288BcV6NYI/0xdAZeookrNcTTMzHgn0VYE63067rhH4z/8q1JNs7Ery
XCMMPulF/0BqX8tERTQOGEjpv2zY6PwGrOwNx96gs5Jo5j4T8OsCsTP1Yp9SYSiL
gL8gdwADuVsugdpxhh1gBuv2oAlLIK/OonuhJYTg7dBurmHRyIrgU9A9wbG0adlN
3qsULWCIMjBwteJEFam6fn483SGq2NsHGcz/vpH7xc2OjQ1ZOCm4Y777VmhDbvqj
yQIDAQAB
-----END PUBLIC KEY-----`;

const API_KEY = "64B0C9CA-C296-4D6E-A6A5-08DCE702AD38";
const API_BASE = "https://apiprod-bsaye6h6a5hbhzgm.a03.azurefd.net";

function hybrindEncryptText(plaintext: string): string {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const encryptedKey = crypto.publicEncrypt(
    { key: RSA_PUBLIC_KEY_PEM, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    aesKey,
  );
  return `${encryptedKey.toString("base64")}:${iv.toString("base64")}:${encrypted.toString("base64")}`;
}

function apiCall(path: string, params?: Record<string, string>, method: "GET" | "POST" = "GET", body?: unknown): Promise<Response> {
  const qs = params ? new URLSearchParams(params).toString() : "";
  const url = qs ? `${API_BASE}${path}?${qs}` : `${API_BASE}${path}`;
  let sigPayload: string;
  if (body && typeof body === "object") sigPayload = JSON.stringify(body);
  else if (qs) sigPayload = qs;
  else sigPayload = path;
  const nonce = uuidv1();
  const timestamp = String(Date.now());
  const signature = hybrindEncryptText(`${sigPayload}|${nonce}|${timestamp}`);
  return fetch(url, {
    method,
    headers: {
      "x-portalunificado-apikey": API_KEY, "x-xmsbs-tenantkey": API_KEY,
      "x-portalunico-nonce": nonce, "x-portalunico-timestamp": timestamp, "x-portalunico-signature": signature,
      "x-request-origin": "https://www.clinicasantamaria.cl",
      Origin: "https://www.clinicasantamaria.cl", Referer: "https://www.clinicasantamaria.cl/reserva-de-horas",
      Accept: "application/json", "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function tryPost(label: string, path: string, body: unknown) {
  console.log(`\n${label}`);
  console.log(`  Body: ${JSON.stringify(body)}`);
  try {
    const r = await apiCall(path, undefined, "POST", body);
    console.log(`  Status: ${r.status}`);
    const text = await r.text();
    console.log(`  Response: ${text.slice(0, 600)}`);
    return r.ok ? JSON.parse(text) : null;
  } catch (e: unknown) {
    console.log(`  Error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function tryGet(label: string, path: string, params: Record<string, string>) {
  console.log(`\n${label}`);
  console.log(`  Params: ${JSON.stringify(params)}`);
  try {
    const r = await apiCall(path, params);
    console.log(`  Status: ${r.status}`);
    const text = await r.text();
    console.log(`  Response: ${text.slice(0, 600)}`);
    return r.ok ? JSON.parse(text) : null;
  } catch (e: unknown) {
    console.log(`  Error: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

async function main() {
  console.log("=== Santa María: Calendar Detail Exploration ===\n");

  const ep = "/api/AgendamientoAmbulatorio/calendarios-detalle-especialidad";

  // Try various body structures for calendarios-detalle-especialidad
  await tryPost("1. codEspComercial + codEmpresa", ep, {
    codEspComercial: 296, codEmpresa: 2,
  });

  await tryPost("2. codEspComercial + codEmpresa + codSucursal", ep, {
    codEspComercial: 296, codEmpresa: 2, codSucursal: 1,
  });

  await tryPost("3. codEspComercial string + fecha", ep, {
    codEspComercial: "296", codEmpresa: "2", fecha: "2026-05-05",
  });

  await tryPost("4. especialidadId string", ep, {
    especialidadId: "296", codEmpresa: "2",
  });

  await tryPost("5. With diaCalendario", ep, {
    codEspComercial: 296, codEmpresa: 2, diaCalendario: "2026-05-05",
  });

  await tryPost("6. With modeloCentral and sucursal", ep, {
    codEspComercial: 296, codEmpresa: 2, codSucursal: 1, modeloCentral: "AMBULATORIO",
  });

  // Try calendarios-detalle-especialista as GET
  await tryGet("7. calendarios-detalle-especialista GET (rut)",
    "/api/AgendamientoAmbulatorio/calendarios-detalle-especialista",
    { codEmpresa: "2", rutProf: "13482241" },
  );

  await tryGet("8. calendarios-detalle-especialista GET (persona.id)",
    "/api/AgendamientoAmbulatorio/calendarios-detalle-especialista",
    { codEmpresa: "2", "persona.id": "13482241" },
  );

  // Try POST for calendarios-detalle-especialista
  await tryPost("9. calendarios-detalle-especialista POST (persona.id)",
    "/api/AgendamientoAmbulatorio/calendarios-detalle-especialista",
    { persona: { id: "13482241" }, codEmpresa: 2 },
  );

  await tryPost("10. calendarios-detalle-especialista POST (rutProf)",
    "/api/AgendamientoAmbulatorio/calendarios-detalle-especialista",
    { rutProf: 13482241, codEmpresa: 2 },
  );

  await tryPost("11. calendarios-detalle-especialista POST (codEspComercial + rut)",
    "/api/AgendamientoAmbulatorio/calendarios-detalle-especialista",
    { rutProf: 13482241, codEmpresa: 2, codEspComercial: 296 },
  );

  // Try agendas-inmediato POST with different body
  await tryPost("12. agendas-inmediato POST with fecha string",
    "/api/AgendamientoAmbulatorio/agendas-inmediato",
    { fecha: "05-05-2026", codEmpresa: 2 },
  );

  await tryPost("13. agendas-inmediato POST with codEspComercial",
    "/api/AgendamientoAmbulatorio/agendas-inmediato",
    { fecha: "2026-05-05T00:00:00", codEmpresa: 2, codEspComercial: 296 },
  );
}

main().catch(console.error);
