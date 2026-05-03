async function main() {
  console.log("Testing reserva.alemana.cl...");
  try {
    const r = await fetch(
      "https://reserva.alemana.cl/reserva/portal/busqueda?empresa=1",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-CL,es;q=0.9",
        },
      }
    );
    console.log("Status:", r.status);
    const html = await r.text();
    console.log("HTML length:", html.length);
    console.log("Has csrfToken:", html.includes("csrfToken"));
    console.log("Has DataDome:", html.includes("datadome"));
    console.log("Has captcha/challenge:", html.includes("captcha") || html.includes("challenge"));
    const optionCount = (html.match(/<option/g) || []).length;
    console.log("Option tags:", optionCount);

    const csrfMatch = html.match(/csrfToken.*?:\s*["']([^"']+)["']/);
    if (csrfMatch) console.log("CSRF token:", csrfMatch[1].slice(0, 30) + "...");

    // Print first 500 chars to see what we got
    console.log("\nFirst 500 chars:");
    console.log(html.slice(0, 500));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

main();
