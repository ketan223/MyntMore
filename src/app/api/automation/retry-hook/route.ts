import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { completeHookSession, type HookSession } from "@/lib/hook-session";

const payload = z.object({ session_id: z.uuid() });
export async function POST(request: Request) {
  if (!process.env.AUTOMATION_SECRET || request.headers.get("x-automation-secret") !== process.env.AUTOMATION_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  try {
    const [session] = await supabase<HookSession[]>("hook_sessions", "GET", `?id=eq.${parsed.data.session_id}&select=*`);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.generation_status === "complete" && session.webhook_status === "delivered") return NextResponse.json({ id: session.id, state: "already_complete" });
    const { webhookStatus } = await completeHookSession(session);
    return NextResponse.json({ id: session.id, generation: "complete", webhookStatus });
  } catch (error) {
    console.error("Hook retry failed", error);
    return NextResponse.json({ error: "Retry failed; inspect the saved session and server logs." }, { status: 503 });
  }
}
