import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "csv-parse/sync";
import type { RawLead } from "../src/lib/lead";
import { POST as grade } from "../src/app/api/grade/route";
import { POST as processLead } from "../src/app/api/automation/process/route";
import { POST as retryHook } from "../src/app/api/automation/retry-hook/route";
import { sendAutomationEvent } from "../src/lib/automation-webhook";

const rawRows = parse(readFileSync("data/leads.csv", "utf8"), { columns: true, skip_empty_lines: true }) as RawLead[];
const raw = new Map(rawRows.map(row => [row.lead_id, row]));
const sessions = new Map<string, Record<string, unknown>>();
const outcomes = new Map<string, Record<string, unknown>>();
const alerts = new Map<string, Record<string, unknown>>();
const failures = new Map<string, Record<string, unknown>>();
let nextId = 0;
let failNextGemini = false;
let zohoCalls = 0;
let makeHeader = "";

const originalFetch = globalThis.fetch;
process.env.SUPABASE_URL = "https://mock.supabase";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only";
process.env.GEMINI_API_KEY = "test-only";
process.env.N8N_WEBHOOK_URL = "https://mock.n8n/webhook";
process.env.AUTOMATION_SECRET = "test-only-automation";
delete process.env.ZOHO_CLIENT_ID;
delete process.env.ZOHO_CLIENT_SECRET;
delete process.env.ZOHO_REFRESH_TOKEN;

function response(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }
function filterRows(table: string, query: URLSearchParams) {
  let rows: Record<string, unknown>[] = table === "raw_leads" ? [...raw.values()] : table === "hook_sessions" ? [...sessions.values()] : table === "lead_outcomes" ? [...outcomes.values()] : table === "processing_failures" ? [...failures.values()] : [...alerts.values()];
  for (const key of ["id", "lead_id", "source_key", "created_at"]) {
    const clause = query.get(key);
    if (clause?.startsWith("eq.")) rows = rows.filter(row => String(row[key]) === clause.slice(3));
    if (clause?.startsWith("lt.")) rows = rows.filter(row => String(row[key]) < clause.slice(3));
  }
  return rows;
}
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === "mock.n8n") return response({ accepted: true });
  if (url.hostname === "mock.make") { makeHeader = new Headers(init?.headers).get("x-make-apikey") ?? ""; return response({ accepted: true }); }
  if (url.hostname === "accounts.zoho.in") return response({ access_token: "test-only" });
  if (url.hostname === "www.zohoapis.in") { zohoCalls++; return response({ data: [{ status: "success", details: { id: "crm-test" } }] }); }
  if (url.hostname === "generativelanguage.googleapis.com") {
    assert.equal(new Headers(init?.headers).get("x-goog-api-key"), "test-only");
    if (failNextGemini) { failNextGemini = false; return response({ error: "quota" }, 429); }
    const prompt = JSON.parse(String(init?.body)).contents[0].parts[0].text as string;
    const output = prompt.includes("Return exactly three") ? { rewrites: ["Buyers notice a clear opening.\nStart with the problem they face.", "Your first line sets the scene.\nMake the buyer's challenge visible.", "A better hook starts here.\nShow your reader what changes."] } : { subject: "A note on your tool result", body: "Hi, I read the details you entered and the result the tool returned. If it would help to talk through a next step, you can book a call at https://myntmore.com/founder-meeting" };
    return response({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }] });
  }
  assert.equal(url.hostname, "mock.supabase");
  const table = url.pathname.split("/").at(-1)!;
  const method = init?.method ?? "GET";
  const store = table === "hook_sessions" ? sessions : table === "lead_outcomes" ? outcomes : table === "lead_alerts" ? alerts : failures;
  if (method === "GET") return response(filterRows(table, url.searchParams));
  const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
  if (method === "POST") {
    if (table === "hook_sessions") { body.id = `00000000-0000-4000-8000-${String(++nextId).padStart(12, "0")}`; body.created_at = "2026-10-08T12:00:00+00:00"; }
    const key = String(body.id ?? body.source_key);
    store.set(key, { ...(store.get(key) ?? {}), ...body });
    return response([store.get(key)]);
  }
  if (method === "PATCH") {
    const matches = filterRows(table, url.searchParams);
    for (const item of matches) Object.assign(item, body);
    return response(matches);
  }
  throw new Error(`Unexpected method ${method}`);
};

test("all 20 CSV events and one Hook Grader event run through the APIs", async () => {
  const gradeResponse = await grade(new Request("http://localhost/api/grade", { method: "POST", body: JSON.stringify({ name: "Asha Example", designation: "Founder", email: "asha@example.test", hook: "Most founders post more but hear less.\nStart with the buyer's problem instead." }) }));
  assert.equal(gradeResponse.status, 200);
  const graded = await gradeResponse.json();
  assert.equal(graded.rewrites.length, 3);
  assert.equal(sessions.get(graded.id)?.generation_status, "complete");
  assert.equal(sessions.get(graded.id)?.webhook_status, "delivered");
  const headers = { "x-automation-secret": "test-only-automation" };
  const hookResponse = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify({ source: "hook_grader", session_id: graded.id }) }));
  assert.equal(hookResponse.status, 200);
  for (const row of rawRows) {
    const response = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify({ source: "csv", lead_id: row.lead_id }) }));
    assert.equal(response.status, 200, row.lead_id);
  }
  assert.equal(outcomes.size, 21);
  assert.equal(alerts.size, 8);
  assert.equal(outcomes.get("csv:L11")?.duplicate_of, "L03");
  for (const id of ["L05", "L07", "L09", "L14", "L16", "L18", "L19"]) assert.equal(outcomes.get(`csv:${id}`)?.draft_body, null);
  const repeat = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify({ source: "csv", lead_id: "L03" }) }));
  assert.equal((await repeat.json()).state, "already_complete");
  assert.equal(outcomes.size, 21);
});

test("a lead-generation failure stays visible and resolves on retry", async () => {
  raw.set("L21", { ...rawRows[0], lead_id: "L21", created_at: "2026-10-02 09:00", first_name: "Nina", last_name: "Example", email: "nina@newco.example", company: "NewCo" });
  const headers = { "x-automation-secret": "test-only-automation" };
  const event = { source: "csv", lead_id: "L21" };
  failNextGemini = true;
  const originalError = console.error;
  console.error = () => {};
  const failed = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify(event) }));
  console.error = originalError;
  assert.equal(failed.status, 503);
  assert.equal(outcomes.has("csv:L21"), false);
  assert.equal(failures.get("csv:L21")?.resolved_at, null);
  const retried = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify(event) }));
  assert.equal(retried.status, 200);
  assert.equal(outcomes.get("csv:L21")?.processing_state, "complete");
  assert.ok(failures.get("csv:L21")?.resolved_at);
});

test("CRM can be configured later without generating a second draft or overwriting a duplicate", async () => {
  process.env.ZOHO_CLIENT_ID = "test-only";
  process.env.ZOHO_CLIENT_SECRET = "test-only";
  process.env.ZOHO_REFRESH_TOKEN = "test-only";
  const headers = { "x-automation-secret": "test-only-automation" };
  const priorDraft = outcomes.get("csv:L03")?.draft_body;
  const repaired = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify({ source: "csv", lead_id: "L03" }) }));
  assert.equal((await repaired.json()).crmState, "synced");
  assert.equal(outcomes.get("csv:L03")?.draft_body, priorDraft);
  const afterFirst = zohoCalls;
  const duplicate = await processLead(new Request("http://localhost/api/automation/process", { method: "POST", headers, body: JSON.stringify({ source: "csv", lead_id: "L11" }) }));
  assert.equal((await duplicate.json()).crmState, "not_configured");
  assert.equal(zohoCalls, afterFirst);
  delete process.env.ZOHO_CLIENT_ID;
  delete process.env.ZOHO_CLIENT_SECRET;
  delete process.env.ZOHO_REFRESH_TOKEN;
});

test("Make webhook delivery uses its server-side API key", async () => {
  process.env.MAKE_WEBHOOK_URL = "https://mock.make/hook";
  process.env.MAKE_WEBHOOK_API_KEY = "test-make-key";
  assert.equal(await sendAutomationEvent({ source: "csv", lead_id: "L01" }), "delivered");
  assert.equal(makeHeader, "test-make-key");
  delete process.env.MAKE_WEBHOOK_URL;
  delete process.env.MAKE_WEBHOOK_API_KEY;
});

test("a Gemini failure retains one hook session and a protected retry completes it", async () => {
  failNextGemini = true;
  const originalError = console.error;
  console.error = () => {};
  const failed = await grade(new Request("http://localhost/api/grade", { method: "POST", body: JSON.stringify({ name: "Bina Example", designation: "Founder", email: "bina@example.test", hook: "Your buyers miss the first point.\nHere is how to make it clear." }) }));
  console.error = originalError;
  assert.equal(failed.status, 503);
  const saved = await failed.json();
  assert.equal(sessions.get(saved.sessionId)?.generation_status, "failed");
  const retried = await retryHook(new Request("http://localhost/api/automation/retry-hook", { method: "POST", headers: { "x-automation-secret": "test-only-automation" }, body: JSON.stringify({ session_id: saved.sessionId }) }));
  assert.equal(retried.status, 200);
  assert.equal(sessions.get(saved.sessionId)?.generation_status, "complete");
  assert.equal(sessions.get(saved.sessionId)?.webhook_status, "delivered");
  globalThis.fetch = originalFetch;
});
