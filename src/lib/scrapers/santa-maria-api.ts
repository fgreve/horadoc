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
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const encryptedKey = crypto.publicEncrypt(
    {
      key: RSA_PUBLIC_KEY_PEM,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey,
  );
  return `${encryptedKey.toString("base64")}:${iv.toString("base64")}:${encrypted.toString("base64")}`;
}

function signedHeaders(sigPayload: string): Record<string, string> {
  const nonce = uuidv1();
  const timestamp = String(Date.now());
  const signature = hybrindEncryptText(
    `${sigPayload}|${nonce}|${timestamp}`,
  );
  return {
    "x-portalunificado-apikey": API_KEY,
    "x-xmsbs-tenantkey": API_KEY,
    "x-portalunico-nonce": nonce,
    "x-portalunico-timestamp": timestamp,
    "x-portalunico-signature": signature,
    "x-request-origin": "https://www.clinicasantamaria.cl",
    Origin: "https://www.clinicasantamaria.cl",
    Referer: "https://www.clinicasantamaria.cl/reserva-de-horas",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function santaMariaGet<T = unknown>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const qs = params ? new URLSearchParams(params).toString() : "";
  const url = qs ? `${API_BASE}${path}?${qs}` : `${API_BASE}${path}`;
  const sigPayload = qs || path;

  const response = await fetch(url, { headers: signedHeaders(sigPayload) });
  if (!response.ok) {
    throw new Error(`Santa María API ${response.status} on GET ${path}`);
  }
  return response.json() as Promise<T>;
}

export { API_BASE, API_KEY };
