export async function supabase<T>(table: string, method: "GET" | "POST" | "PATCH", query = "", body?: unknown): Promise<T> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Supabase environment variables are missing");
  const res = await fetch(`${base.replace(/\/$/, "")}/rest/v1/${table}${query}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
    body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store"
  });
  if (!res.ok) throw new Error(`Supabase ${table} HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return (await res.json()) as T;
}
