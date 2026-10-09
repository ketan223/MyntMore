import { supabase } from "../src/lib/db";

const base = process.env.APP_BASE_URL;
const secret = process.env.AUTOMATION_SECRET;
if (!base || !secret) throw new Error("Set APP_BASE_URL and AUTOMATION_SECRET in .env.local");
const appBaseUrl: string = base;
const automationSecret: string = secret;

async function post(path: string, body: object) {
  const response = await fetch(`${appBaseUrl.replace(/\/$/, "")}${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-automation-secret": automationSecret }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path} HTTP ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

const sessions = await supabase<{ id: string; generation_status: string; webhook_status: string }[]>("hook_sessions", "GET", "?select=id,generation_status,webhook_status");
const failures = await supabase<{ source_key: string; resolved_at: string | null }[]>("processing_failures", "GET", "?select=source_key,resolved_at");
const outcomes = await supabase<{ source_key: string; crm_state: string }[]>("lead_outcomes", "GET", "?select=source_key,crm_state");
const attempted = new Set<string>();
let failed = 0;
for (const session of sessions.filter(item => item.generation_status !== "complete" || item.webhook_status !== "delivered")) {
  try { console.log(`hook ${session.id}: ${JSON.stringify(await post("/api/automation/retry-hook", { session_id: session.id }))}`); }
  catch (error) { failed++; console.error(`hook ${session.id}:`, error); }
}
for (const item of failures.filter(row => !row.resolved_at)) {
  const [source, ...parts] = item.source_key.split(":");
  const id = parts.join(":");
  if (!id || !["csv", "hook"].includes(source)) continue;
  const body = source === "csv" ? { source: "csv", lead_id: id } : { source: "hook_grader", session_id: id };
  try { console.log(`${item.source_key}: ${JSON.stringify(await post("/api/automation/process", body))}`); attempted.add(item.source_key); }
  catch (error) { failed++; console.error(`${item.source_key}:`, error); }
}
for (const item of outcomes.filter(row => ["failed", "not_configured"].includes(row.crm_state) && !attempted.has(row.source_key))) {
  const [source, ...parts] = item.source_key.split(":");
  const id = parts.join(":");
  if (!id || !["csv", "hook"].includes(source)) continue;
  const body = source === "csv" ? { source: "csv", lead_id: id } : { source: "hook_grader", session_id: id };
  try { console.log(`${item.source_key} CRM: ${JSON.stringify(await post("/api/automation/process", body))}`); }
  catch (error) { failed++; console.error(`${item.source_key} CRM:`, error); }
}
console.log(`Retry pass complete. Failed requests: ${failed}.`);
if (failed) process.exitCode = 1;
