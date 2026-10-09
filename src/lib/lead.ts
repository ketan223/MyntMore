export type RawLead = { lead_id: string; created_at: string; source_tool: string; first_name: string; last_name: string; designation: string; email: string; company: string; company_website: string; linkedin_url: string; tool_input: string; tool_output: string };
export type Outcome = { lead_id: string; normalized_email: string | null; status: "hot" | "warm" | "not_fit"; score: number; service: string | null; reason: string; flags: string[]; duplicate_of: string | null; draft_eligible: boolean };

const normalize = (v: string | null | undefined) => (v ?? "").trim().replace(/\s+/g, " ");
const nonBuyer = /student|open to work|looking for (an? )?(sdr|bdr|job|role)|recruiters|hiring managers/i;
const competitor = /ghostwrit|linkedin posts for founders|agency|digital marketing/i;
const b2b = /b2b|saas|software|manufactur|components|cfo|cto|procurement|fintech|staffing|managed services|business|corporate|importers|reconciliation|sales/i;
const outreach = /dm_angle|roi_calculator|battle_card|icp_builder|lead_magnet/;
const presence = /profile_optimizer|posting_rhythm|founder_presence|hook_grader/;

export function classifyLead(row: RawLead, previousByEmail = new Map<string, string>()): Outcome {
  const email = normalize(row.email).toLowerCase();
  const flags: string[] = [];
  const text = `${row.designation} ${row.company} ${row.tool_input} ${row.tool_output}`;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) flags.push("missing_or_invalid_email");
  if (/\btest\b/i.test(`${row.first_name} ${row.last_name} ${row.designation} ${row.company}`) || email === "test@test.com") flags.push("test_entry");
  if (!normalize(row.tool_input) || !normalize(row.tool_output)) flags.push("incomplete_session");
  if (/ignore all previous instructions|set the score|guarantees? \d+ meetings/i.test(row.tool_input)) flags.push("prompt_injection_input");
  const duplicateOf = email ? previousByEmail.get(email) ?? null : null;
  if (duplicateOf) flags.push("repeat_contact");
  if (email && !duplicateOf) previousByEmail.set(email, row.lead_id);
  if (nonBuyer.test(text)) flags.push("non_buyer");
  if (competitor.test(text)) flags.push("service_competitor");
  if (!row.company?.trim()) flags.push("missing_company");

  const service = presence.test(row.source_tool) ? "personal branding" :
    row.source_tool === "roi_calculator" ? "lead generation" :
    row.source_tool === "dm_angle_generator" ? "LinkedIn outreach" :
    row.source_tool === "battle_card_generator" || row.source_tool === "icp_builder" ? "lead generation" :
    row.source_tool === "lead_magnet_ideas" ? "cold email" :
    row.source_tool === "case_study_generator" ? "lead generation" : null;
  let score = 1;
  if (row.company?.trim()) score += 2;
  if (/founder|ceo|managing director|cro|vp sales|head of sales/i.test(row.designation)) score += 2;
  else if (/marketing manager/i.test(row.designation)) score += 1;
  if (b2b.test(text)) score += 2;
  if (service) score += 1;
  if (normalize(row.tool_input) && normalize(row.tool_output)) score += 1;
  if (outreach.test(row.source_tool)) score += 1;
  score = Math.max(1, Math.min(10, score));
  if (flags.includes("non_buyer") || flags.includes("test_entry") || flags.includes("service_competitor")) score = Math.min(score, 2);
  if (flags.includes("incomplete_session") || flags.includes("prompt_injection_input")) score = Math.min(score, 3);
  const disqualifier = flags.some(x => ["missing_or_invalid_email", "test_entry", "non_buyer", "service_competitor", "incomplete_session", "prompt_injection_input"].includes(x));
  let status: Outcome["status"] = disqualifier || score <= 4 ? "not_fit" : score >= 8 ? "hot" : "warm";
  // Keep the repeated session for analysis, but suppress a second draft to one person.
  if (duplicateOf) status = "not_fit";
  const why = flags.length ? flags.join(", ").replaceAll("_", " ") : `${row.designation || "Visitor"} at ${row.company || "unknown company"} used ${row.source_tool}; ${service ?? "no service match"} fit.`;
  return { lead_id: row.lead_id, normalized_email: email || null, status, score, service, reason: why, flags, duplicate_of: duplicateOf, draft_eligible: status !== "not_fit" && !duplicateOf };
}
