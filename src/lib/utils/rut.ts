export function cleanRut(rut: string): string {
  return rut.replace(/[.\-]/g, "").trim().toUpperCase();
}

export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;

  const body = clean.slice(0, -1);
  const verifier = clean.slice(-1);

  let formatted = "";
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    formatted = body[i] + formatted;
    count++;
    if (count % 3 === 0 && i !== 0) {
      formatted = "." + formatted;
    }
  }

  return `${formatted}-${verifier}`;
}

export function validateRut(rut: string): boolean {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const expectedVerifier = clean.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let computedVerifier: string;

  if (remainder === 11) {
    computedVerifier = "0";
  } else if (remainder === 10) {
    computedVerifier = "K";
  } else {
    computedVerifier = remainder.toString();
  }

  return computedVerifier === expectedVerifier;
}
