import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import type { RawLead } from "../src/lib/lead";
import { sendAutomationEvent } from "../src/lib/automation-webhook";

const csvPath = resolve(process.argv[2] ?? "data/leads.csv");
const rows = parse(readFileSync(csvPath, "utf8"), { columns: true, skip_empty_lines: true, bom: true }) as RawLead[];
if (rows.length !== 20) console.warn(`Expected sample of 20, got ${rows.length}. Continuing.`);
if (new Set(rows.map(r => r.lead_id)).size !== rows.length) throw new Error("Duplicate lead_id in CSV");
const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
const res = await fetch(`${base.replace(/\/$/, "")}/rest/v1/raw_leads?on_conflict=lead_id`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(rows) });
if (!res.ok) throw new Error(`Import failed: ${await res.text()}`);
console.log(`Imported ${rows.length} rows. Every row remains in raw_leads.`);
if (process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL) {
  for (const row of rows) {
    try { console.log(`${row.lead_id}: webhook ${await sendAutomationEvent({ source: "csv", lead_id: row.lead_id })}`); }
    catch (error) { console.error(`${row.lead_id}: webhook failed`, error); process.exitCode = 1; }
  }
} else console.log("MAKE_WEBHOOK_URL and N8N_WEBHOOK_URL missing. Import complete; automation events not triggered.");
