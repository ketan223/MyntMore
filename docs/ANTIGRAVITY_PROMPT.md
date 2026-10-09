# Ready-to-paste prompt for free Antigravity or another coding assistant

Paste this together with the GitHub repository URL or the full project folder. Replace bracketed values with your own account values **only inside the assistant's secure environment**; never paste real secrets into chat or a commit.

```text
You are helping me finish and verify a Systems & AI Automation Intern assignment. Work in the supplied Myntmore Round 2 repository. Read README.md, docs/SETUP.md, docs/OPS_JUDGEMENT.md, supabase/schema.sql, and all source code before changing anything. The source CSV is data/leads.csv; the assignment's original CSV URL is https://drive.google.com/file/d/11TC4oqGx7GUIOR0CJ4KaWgTtHEkFaw64/view?usp=sharing. The sample contacts are fictional.

Goal: make the two projects run end to end in my own Supabase, Make, Gemini, Zoho CRM, GitHub, and Vercel accounts. Preserve every input session and record every failure. Never send email or a message to a real person. All follow-ups must remain drafts. Never commit, print, screenshot, or expose any API key, OAuth token, webhook secret, or password.

Task 01: Import all 20 CSV rows. Verify raw_leads count 20 and one outcome per row. Inspect L05 incomplete session, L07 test, L09/L14 non-buyers, L11 repeated email from L03, L15 same company but different person, L16 competing service provider, L18 missing email, and L19 prompt injection. Explain the deterministic score, tier, service, and reason for every row. Gemini may write only eligible draft emails; it does not assign scores. Each draft must use both tool_input and tool_output, have fewer than 120 words, avoid jargon and em dashes, invent no numbers or claims, and use only https://myntmore.com/founder-meeting as a call link. Hot rows need draft and alert record; Warm rows get one nurture draft; Not a fit gets reason and no draft. Make the Make webhook scenario, retries, and Supabase failure visibility work. If Zoho credentials are available, upsert fictional lead records with draft text in Description, without sending email.

Task 02: Verify the Next.js landing/contact/hook/results flow. Score a hook by five fixed code rules (0-100), identical text yielding identical score. Use Gemini gemini-2.5-flash with responseSchema JSON for exactly three two-line rewrites. Save contact, hook, score, checks, and rewrites as one Supabase hook_sessions row. Send the session ID to the Make.com webhook and verify one lead_outcomes row keyed hook:UUID. Deploy on Vercel and test desktop and mobile.

Task 03: Diagnose the Supabase source constraint bug in docs/OPS_JUDGEMENT.md. For AI search, do not invent ChatGPT, Perplexity, or Gemini answer observations. If I have browser access, help me ask the five listed questions in all three platforms, record appearance position, other providers, one-line answer, cited sources, and 15 screenshots. Refine the three website changes based on actual results.

Manual deliverables: Guide me through only the account/OAuth/UI actions I must perform. Use docs/MAKE_SCENARIO.md for the exact Make setup. Give exact clicks and explain what values to copy where, with no secrets in chat. Verify every step after I do it. Prepare a truthful final PDF with verified repository, Vercel, and Loom links, then help me reply to the existing email thread with that PDF. Do not claim a live step is done without checking it. Run npm ci, npm test, npm run build, npm run preview:leads, and appropriate live smoke tests. Show me any remaining blocker precisely.
```

The prompt is designed for a coding assistant with access to this folder. If the free tier has a context limit, split the work into these messages: (1) read/verify repo and CSV, (2) Supabase/Gemini/Make, (3) Zoho/Vercel/live test, (4) AI search/screenshots/Loom/PDF.
