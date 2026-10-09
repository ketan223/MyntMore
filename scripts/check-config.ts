const required = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "AUTOMATION_SECRET", "APP_BASE_URL", "MAKE_WEBHOOK_URL", "MAKE_WEBHOOK_API_KEY"];
const optionalZoho = ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"];
let missing = false;
for (const name of required) {
  const present = Boolean(process.env[name]?.trim());
  console.log(`${present ? "OK" : "MISSING"} ${name}`);
  if (!present) missing = true;
}
for (const name of ["SUPABASE_URL", "APP_BASE_URL", "MAKE_WEBHOOK_URL"]) {
  const value = process.env[name];
  if (!value) continue;
  try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) throw new Error("bad protocol"); }
  catch { console.error(`INVALID_URL ${name}`); missing = true; }
}
const zohoCount = optionalZoho.filter(name => Boolean(process.env[name]?.trim())).length;
console.log(zohoCount === 0 ? "OPTIONAL Zoho disabled" : zohoCount === optionalZoho.length ? "OK Zoho credentials group" : "INCOMPLETE Zoho credentials group");
if (zohoCount > 0 && zohoCount < optionalZoho.length) missing = true;
if (missing) process.exitCode = 1;
