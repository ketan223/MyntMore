export type AutomationEvent = { source: "csv"; lead_id: string } | { source: "hook_grader"; session_id: string };

export async function sendAutomationEvent(event: AutomationEvent): Promise<"delivered" | "not_configured"> {
  const makeUrl = process.env.MAKE_WEBHOOK_URL;
  const url = makeUrl || process.env.N8N_WEBHOOK_URL;
  if (!url) return "not_configured";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (makeUrl) {
    if (!process.env.MAKE_WEBHOOK_API_KEY) throw new Error("MAKE_WEBHOOK_API_KEY is required when MAKE_WEBHOOK_URL is set");
    headers["x-make-apikey"] = process.env.MAKE_WEBHOOK_API_KEY;
  }
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(event) });
  if (!response.ok) throw new Error(`Automation webhook HTTP ${response.status}`);
  return "delivered";
}
