export async function syncZohoDraft(row: { email: string; first_name: string; last_name: string; company: string }, outcome: { score: number; status: string; reason: string; service: string | null }, draft?: { subject: string; body: string }) {
  const { ZOHO_CLIENT_ID: id, ZOHO_CLIENT_SECRET: secret, ZOHO_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) return { state: "not_configured" as const };
  const accounts = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.in";
  const tokenResponse = await fetch(`${accounts}/oauth/v2/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ refresh_token: refresh, client_id: id, client_secret: secret, grant_type: "refresh_token" }) });
  if (!tokenResponse.ok) throw new Error(`Zoho OAuth HTTP ${tokenResponse.status}`);
  const token = (await tokenResponse.json()).access_token;
  if (!token) throw new Error("Zoho OAuth response lacks access_token");
  const api = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in";
  const res = await fetch(`${api}/crm/v2/Leads/upsert`, { method: "POST", headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ duplicate_check_fields: ["Email"], data: [{ First_Name: row.first_name || "Visitor", Last_Name: row.last_name || row.first_name || "Visitor", Company: row.company || "Unknown", Email: row.email, Description: `Assignment demo, fictional lead. Tier: ${outcome.status}; score: ${outcome.score}; service: ${outcome.service ?? "none"}; reason: ${outcome.reason}. Draft only, never send. ${draft ? `Subject: ${draft.subject}\n${draft.body}` : "No draft."}` }] }) });
  const result = await res.json();
  if (!res.ok || result.data?.[0]?.status !== "success") throw new Error(`Zoho upsert failed: ${JSON.stringify(result).slice(0, 500)}`);
  return { state: "synced" as const, id: result.data[0].details?.id as string };
}
