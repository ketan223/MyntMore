import { supabase } from "./db";
import { rewriteHook } from "./gemini";
import { sendAutomationEvent } from "./automation-webhook";

export type HookSession = {
  id: string;
  name: string;
  designation: string;
  email: string;
  hook: string;
  score: number;
  checks: unknown;
  rewrites: string[];
  generation_status: "pending" | "complete" | "failed";
  webhook_status: "pending" | "delivered";
};

export async function completeHookSession(session: HookSession) {
  let rewrites = session.rewrites;
  if (session.generation_status !== "complete" || !Array.isArray(rewrites) || rewrites.length !== 3) {
    try {
      rewrites = await rewriteHook(session.hook);
      await supabase("hook_sessions", "PATCH", `?id=eq.${session.id}`, { rewrites, generation_status: "complete", generation_error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown generation error";
      try { await supabase("hook_sessions", "PATCH", `?id=eq.${session.id}`, { generation_status: "failed", generation_error: message }); }
      catch (saveError) { console.error("Could not save hook generation failure", saveError); }
      throw error;
    }
  }
  let webhookStatus: "pending" | "delivered" = "pending";
  try { if ((await sendAutomationEvent({ source: "hook_grader", session_id: session.id })) === "delivered") webhookStatus = "delivered"; }
  catch (error) { console.error("Hook webhook delivery failed; session retained for retry", error); }
  await supabase("hook_sessions", "PATCH", `?id=eq.${session.id}`, { webhook_status: webhookStatus });
  return { rewrites, webhookStatus };
}
