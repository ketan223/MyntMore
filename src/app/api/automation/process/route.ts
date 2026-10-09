import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { classifyLead, type RawLead } from "@/lib/lead";
import { draftFollowUp } from "@/lib/gemini";
import { syncZohoDraft } from "@/lib/zoho";

const payloadSchema = z.object({ source: z.enum(["csv", "hook_grader"]), lead_id: z.string().optional(), session_id: z.uuid().optional() });
export async function POST(request: Request) {
  if (!process.env.AUTOMATION_SECRET || request.headers.get("x-automation-secret") !== process.env.AUTOMATION_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  let failureKey = `${parsed.data.source === "csv" ? "csv" : "hook"}:${parsed.data.lead_id ?? parsed.data.session_id ?? "missing"}`;
  try {
    const event = parsed.data;
    let row: RawLead;
    let sourceKey: string;
    if (event.source === "csv") {
      if (!event.lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });
      sourceKey = `csv:${event.lead_id}`;
      const rows = await supabase<RawLead[]>("raw_leads", "GET", `?lead_id=eq.${encodeURIComponent(event.lead_id)}&select=*`);
      if (!rows.length) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      row = rows[0];
    } else {
      if (!event.session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });
      sourceKey = `hook:${event.session_id}`;
      const sessions = await supabase<{ name: string; designation: string; email: string; hook: string; score: number; rewrites: string[]; created_at: string }[]>("hook_sessions", "GET", `?id=eq.${event.session_id}&select=*`);
      if (!sessions.length) return NextResponse.json({ error: "Session not found" }, { status: 404 });
      const session = sessions[0];
      const names = session.name.trim().split(/\s+/);
      row = { lead_id: sourceKey, created_at: session.created_at, source_tool: "hook_grader", first_name: names[0], last_name: names.slice(1).join(" "), designation: session.designation, email: session.email, company: "", company_website: "", linkedin_url: "", tool_input: session.hook, tool_output: `Hook score ${session.score}/100; rewrites: ${session.rewrites.join(" | ")}` };
    }
    const existing = await supabase<{ source_key: string; processing_state: string; crm_state: string; normalized_email: string | null; duplicate_of: string | null; flags: string[]; score: number; tier: string; reason: string; service: string | null; draft_subject: string | null; draft_body: string | null }[]>("lead_outcomes", "GET", `?source_key=eq.${encodeURIComponent(sourceKey)}&select=*`);
    if (existing[0]?.processing_state === "complete") {
      const saved = existing[0];
      if (["failed", "not_configured"].includes(saved.crm_state) && saved.normalized_email && !saved.duplicate_of && !saved.flags.includes("test_entry")) {
        try {
          const draft = saved.draft_subject && saved.draft_body ? { subject: saved.draft_subject, body: saved.draft_body } : undefined;
          const crm = await syncZohoDraft({ email: saved.normalized_email, first_name: row.first_name, last_name: row.last_name, company: row.company }, { score: saved.score, status: saved.tier, reason: saved.reason, service: saved.service }, draft);
          await supabase("lead_outcomes", "PATCH", `?source_key=eq.${encodeURIComponent(sourceKey)}`, { crm_state: crm.state });
          return NextResponse.json({ sourceKey, state: "already_complete", crmState: crm.state });
        } catch (error) {
          console.error("Zoho retry failed", error);
          return NextResponse.json({ sourceKey, state: "already_complete", crmState: "failed" });
        }
      }
      return NextResponse.json({ sourceKey, state: "already_complete", crmState: saved.crm_state });
    }
    failureKey = sourceKey;
    const earlier = await supabase<{ lead_id: string; email: string }[]>("raw_leads", "GET", `?created_at=lt.${encodeURIComponent(row.created_at)}&email=not.is.null&select=lead_id,email&order=created_at.asc`);
    const prior = new Map<string, string>();
    for (const item of earlier) if (item.email && !prior.has(item.email.toLowerCase().trim())) prior.set(item.email.toLowerCase().trim(), item.lead_id);
    const earlierHooks = await supabase<{ id: string; email: string }[]>("hook_sessions", "GET", `?created_at=lt.${encodeURIComponent(row.created_at)}&select=id,email&order=created_at.asc`);
    for (const item of earlierHooks) if (item.email && !prior.has(item.email.toLowerCase().trim())) prior.set(item.email.toLowerCase().trim(), `hook:${item.id}`);
    const outcome = classifyLead(row, prior);
    let draft: { subject: string; body: string } | undefined;
    if (outcome.draft_eligible) draft = await draftFollowUp(row, outcome.service ?? "lead generation", outcome.status as "hot" | "warm");
    const [saved] = await supabase<{ source_key: string }[]>("lead_outcomes", "POST", "?on_conflict=source_key", { source_key: sourceKey, lead_id: row.lead_id, normalized_email: outcome.normalized_email, tier: outcome.status, score: outcome.score, service: outcome.service, reason: outcome.reason, flags: outcome.flags, duplicate_of: outcome.duplicate_of, draft_subject: draft?.subject ?? null, draft_body: draft?.body ?? null, alert_needed: outcome.status === "hot", processing_state: "processing", crm_state: "pending" });
    if (!saved) throw new Error("Outcome save failed");
    let crmState = "not_configured";
    if (outcome.normalized_email && !outcome.flags.includes("test_entry") && !outcome.duplicate_of) {
      try { crmState = (await syncZohoDraft({ email: outcome.normalized_email, first_name: row.first_name, last_name: row.last_name, company: row.company }, { score: outcome.score, status: outcome.status, reason: outcome.reason, service: outcome.service }, draft)).state; }
      catch (error) { crmState = "failed"; console.error("Zoho sync failed", error); }
    }
    if (outcome.status === "hot") await supabase("lead_alerts", "POST", "?on_conflict=source_key", { source_key: sourceKey, summary: `${row.first_name} ${row.last_name} at ${row.company}: ${outcome.service}; score ${outcome.score}/10. Draft available in lead_outcomes.` });
    await supabase("lead_outcomes", "PATCH", `?source_key=eq.${encodeURIComponent(sourceKey)}`, { crm_state: crmState, processing_state: "complete" });
    try { await supabase("processing_failures", "PATCH", `?source_key=eq.${encodeURIComponent(sourceKey)}`, { resolved_at: new Date().toISOString() }); }
    catch (error) { console.error("Could not mark old failure resolved", error); }
    return NextResponse.json({ sourceKey, outcome, draft, crmState });
  } catch (error) {
    console.error("Lead processing failed", error);
    try { await supabase("processing_failures", "POST", "?on_conflict=source_key", { source_key: failureKey, error_message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error", last_failed_at: new Date().toISOString(), resolved_at: null }); }
    catch (recordError) { console.error("Failed to record processing failure", recordError); }
    return NextResponse.json({ error: "Lead processing failed; inspect logs and retry the event." }, { status: 503 });
  }
}
