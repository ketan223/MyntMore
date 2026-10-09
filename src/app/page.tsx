"use client";
import { useState, type FormEvent } from "react";
import type { Grade } from "@/lib/grade";

type Result = { id: string; grade: Grade; rewrites: string[]; processing: string };
export default function Home() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [hook, setHook] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, designation, email, hook }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not grade hook");
      setResult(data); setStep(2);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not grade hook"); }
    finally { setLoading(false); }
  }
  return <main className="shell">
    <header className="top"><div className="brand">myntmore<span>.</span></div><span className="badge">FREE TOOL · ASSIGNMENT DEMO</span></header>
    <div className="hero"><div className="eyebrow">LINKEDIN CONTENT TOOL</div><h1>Make the first two lines <em>count.</em></h1><p>Paste the opening of a LinkedIn post. Get a consistent score, clear fixes, and three fresh rewrites.</p></div>
    <div className="progress" aria-label={`Step ${step + 1} of 3`}><span className={step >= 0 ? "active" : ""}>01 About you</span><span className={step >= 1 ? "active" : ""}>02 Your hook</span><span className={step >= 2 ? "active" : ""}>03 Results</span></div>
    {step === 0 && <section className="card"><div className="card-head"><span className="step-no">01 / 03</span><h2>Start with your details</h2><p>We save your session so you can connect this tool to a follow-up workflow.</p></div><form onSubmit={e => { e.preventDefault(); setStep(1); }} className="form"><label>Name<input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></label><label>Designation<input required minLength={2} maxLength={120} value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Founder, Head of Sales..." /></label><label>Email<input required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label><button type="submit">Continue <span>→</span></button></form></section>}
    {step === 1 && <section className="card"><div className="card-head"><span className="step-no">02 / 03</span><h2>Paste your opening lines</h2><p>Use exactly two lines. The score comes from five fixed checks, each worth 20 points.</p></div><form onSubmit={submit} className="form"><label>First two lines<textarea required minLength={12} maxLength={600} rows={5} value={hook} onChange={e => setHook(e.target.value)} placeholder={"Most founders post more but hear less.\nHere's what changed when we focused on the buyer."} /></label><div className="form-foot"><button className="back" type="button" onClick={() => setStep(0)}>← Back</button><span>{hook.length} / 600</span></div>{error && <div className="error" role="alert">{error}</div>}<button disabled={loading} type="submit">{loading ? "Grading..." : "Grade my hook"} <span>→</span></button></form></section>}
    {step === 2 && result && <section className="results"><div className="score-card"><div><span className="step-no">YOUR HOOK SCORE</span><h2>{result.grade.score}<small>/100</small></h2><p>Five transparent checks. The same words always get the same score.</p></div><div className="ring" style={{ background: `conic-gradient(#cfed79 ${result.grade.score}%, #e6e9e2 0)` }}><div>{result.grade.score >= 80 ? "Strong" : result.grade.score >= 60 ? "Getting there" : "Room to grow"}</div></div></div><div className="card"><h3>What the rules found</h3><div className="checks">{result.grade.checks.map(check => <div key={check.name} className="check"><span className={check.passed ? "pass" : "fail"}>{check.passed ? "✓" : "!"}</span><div><strong>{check.name}</strong><p>{check.passed ? "Passed" : check.feedback}</p></div></div>)}</div></div><div className="card"><h3>Three ways to rewrite it</h3><p className="subtle">Generated with Gemini from your original hook. Review before posting.</p><div className="rewrites">{result.rewrites.map((rewrite, index) => <div className="rewrite" key={index}><span>OPTION 0{index + 1}</span><p>{rewrite}</p><button type="button" onClick={() => navigator.clipboard.writeText(rewrite)}>Copy</button></div>)}</div></div><button className="again" onClick={() => { setResult(null); setHook(""); setStep(1); }}>Try another hook →</button><p className="privacy">Session ID: {result.id}. Follow-up status: {result.processing}. No email is sent by this demo.</p></section>}
    <footer><span>Built as a Systems & AI Automation Intern assignment demo.</span><a href="https://myntmore.com/founder-meeting">Book a call ↗</a></footer>
  </main>;
}
