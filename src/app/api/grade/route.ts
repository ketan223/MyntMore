import { NextResponse } from "next/server";
import { z } from "zod";
import { gradeHook } from "@/lib/grade";
import { supabase } from "@/lib/db";
import { completeHookSession, type HookSession } from "@/lib/hook-session";

const inputSchema = z.object({ name: z.string().trim().min(2).max(100), designation: z.string().trim().min(2).max(120), email: z.email().max(254), hook: z.string().trim().min(12).max(600) });
export async function POST(request: Request) {
  let sessionId: string | undefined;
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check the contact details and hook length." }, { status: 400 });
    const input = parsed.data;
    const grade = gradeHook(input.hook);
    const [saved] = await supabase<HookSession[]>("hook_sessions", "POST", "", { name: input.name, designation: input.designation, email: input.email.toLowerCase(), hook: input.hook, score: grade.score, checks: grade.checks, rewrites: [], generation_status: "pending", webhook_status: "pending" });
    if (!saved?.id) throw new Error("Session insert returned no ID");
    sessionId = saved.id;
    const { rewrites, webhookStatus } = await completeHookSession(saved);
    return NextResponse.json({ id: saved.id, grade, rewrites, processing: webhookStatus });
  } catch (error) {
    console.error("Hook grading failed", error);
    return NextResponse.json({ error: sessionId ? `Session ${sessionId} was saved, but rewrites could not be completed. An operator can retry it.` : "Could not save this hook right now. Please try again.", sessionId }, { status: 503 });
  }
}
