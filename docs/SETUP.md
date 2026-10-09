# Rebuild guide: every manual step

## 0. Prerequisites and project copy

Use Node.js 24 or a current supported LTS, npm, Git, a browser, and accounts for Google AI Studio, Supabase, Make, Zoho CRM, GitHub, Vercel, and Loom. n8n is an optional alternative. Copy this whole folder to the new device, including `package-lock.json` and `data/leads.csv`. Do **not** copy `.env.local` into a repository or send it to anyone. Keep your API keys in a password manager.

On the new device:

```powershell
cd PATH_TO_THIS_FOLDER
npm ci
npm test
npm run preview:leads
Copy-Item .env.example .env.local
npm run dev
```

The preview is deliberately offline and contains no Gemini-written emails. It confirms that all 20 input rows get a rule outcome.

After filling `.env.local`, run `npm run check:config`. It prints which variable names are present or missing without printing any secret values. A nonzero exit means a required value or the optional Zoho credential group is incomplete.

## 1. Supabase database

1. Create a free Supabase project in a region near you. Wait for provisioning.
2. Open **SQL Editor**, create a query, paste the complete contents of `supabase/schema.sql`, and run it once. The tables are `raw_leads`, `hook_sessions`, `lead_outcomes`, `lead_alerts`, and `processing_failures`.
3. In **Project Settings > API**, copy the project URL to `SUPABASE_URL` and the server-side service role key to `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. The service role key must never be prefixed `NEXT_PUBLIC_` or placed in browser code.
4. In Table Editor, confirm that all five tables exist. Row level security is enabled; the server uses the service role key.

## 2. Gemini

1. In Google AI Studio, create a free Gemini API key.
2. Add it as `GEMINI_API_KEY` in `.env.local` and later in Vercel server environment variables.
3. The code calls `gemini-2.5-flash` with `responseMimeType: application/json` and a `responseSchema`. Free quotas and model availability may vary; if a request fails, inspect the API error and retry when quota is available.
4. The app rejects any draft with an em dash, disallowed URL, unsupported number, >=120 words, or selected jargon/claims. A rejected draft creates a visible failure record when it came through the lead processor. Hook Grader generation failures remain in `hook_sessions` with `generation_status='failed'`. Review all acceptable drafts too; automated checks cannot establish full factual accuracy.

## 3. Make automation (required by Task 02)

Follow [the Make scenario guide](MAKE_SCENARIO.md) to create one Custom webhook, a Router with CSV and Hook Grader branches, and two HTTP requests to the protected app processor. Set `MAKE_WEBHOOK_URL` and `MAKE_WEBHOOK_API_KEY` in `.env.local` and Vercel. Leave `N8N_WEBHOOK_URL` empty when using Make. This is the path to use for the assignment's live demonstration.

## 3b. n8n alternative

1. Create an n8n cloud workspace or run n8n on a reachable server. Import `n8n/lead-follow-up.json` through **Workflows > Import from file**.
2. Open the HTTP Request node. Replace `https://YOUR_VERCEL_DOMAIN/api/automation/process` with your deployed Vercel URL plus `/api/automation/process`.
3. Set `x-automation-secret` to a long random value. Put exactly the same value in Vercel and local `.env.local` as `AUTOMATION_SECRET`. The export has a placeholder, never a real key. For stronger n8n secret storage, replace the literal header with an n8n credential or environment variable in your own workspace before exporting publicly.
4. Save and **activate** the workflow. Copy its **production** webhook URL to `N8N_WEBHOOK_URL` in Vercel and `.env.local`. Leave `MAKE_WEBHOOK_URL` empty if using n8n. The test URL is only for a temporarily listening editor session.
5. This n8n flow receives `{source:"csv",lead_id:"L01"}` or `{source:"hook_grader",session_id:"UUID"}`, then calls the protected app endpoint. The endpoint does all rules, Gemini writing, database writes, and optional CRM sync. The webhook acknowledges receipt immediately and the HTTP node retries transient failures three times. A webhook HTTP 200 confirms **receipt only**; use n8n execution history and `lead_outcomes` to confirm completion.
6. To backfill failures, use `npm run retry` after fixing the cause. It retries pending Hook Grader generations/webhook deliveries, unresolved processor failures, and CRM states that were `failed` or `not_configured`. It reads the configured Supabase project and calls the protected deployed app in `APP_BASE_URL`. Idempotency prevents a completed lead from generating a second draft. Manual n8n execution retry is also available from its Executions view.

## 4. Import and run the 20 sample sessions

The original Google Doc links to [leads.csv in Drive](https://drive.google.com/file/d/11TC4oqGx7GUIOR0CJ4KaWgTtHEkFaw64/view?usp=sharing). This repo already has the provided local CSV at `data/leads.csv`. Do not use the fictional `.example` addresses for real outreach.

```powershell
npm run import
```

The command upserts all 20 raw rows into Supabase, then posts one event per row to Make (or n8n when Make is not configured). It prints each webhook receipt status. Check Table Editor: `raw_leads` should show 20 rows, `lead_outcomes` should show 20 completed rows, and `lead_alerts` should show 8 Hot alert records when Gemini succeeds. If a draft fails validation or quota, the row stays in `raw_leads`, the problem appears in `processing_failures`, and the event can be retried. `lead_outcomes` counts depend on successful Gemini calls, so do not claim the live run succeeded until you see all 20.

Check with SQL:

```sql
select tier, count(*) from public.lead_outcomes group by tier order by tier;
select source_key, error_message, last_failed_at from public.processing_failures where resolved_at is null order by last_failed_at desc;
select source_key, summary from public.lead_alerts where not acknowledged order by created_at desc;
select lead_id from public.raw_leads except select lead_id from public.lead_outcomes where source_key like 'csv:%';
```

When a previously failed event succeeds, `resolved_at` is set automatically. Keep its record for audit. Do not delete the source row.

## 5. Zoho CRM, drafts only

The assignment requests a Zoho demonstration. This repository supports optional CRM upsert. Do this only in your own authorized Zoho CRM workspace.

1. Create a Zoho OAuth client in Zoho API Console for your region. Generate a refresh token with the minimal CRM Leads create/update scope needed for this demo. Keep it out of screenshots and the repo.
2. Add `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` in Vercel. Set `ZOHO_ACCOUNTS_DOMAIN` and `ZOHO_API_DOMAIN` for your region (`.in` examples are in `.env.example`; use `.com` or another region when appropriate).
3. The app upserts a **Leads** record by email for valid, non-test, first-contact sample sessions, putting tier, score, reason, and any draft in the Description. It never invokes Zoho email send actions. Duplicate sessions remain distinct in Supabase and do not overwrite the first contact's CRM draft.
4. Run the sample import after configuring Zoho. Show a few records and the Description in Loom. If Zoho is not configured, `crm_state='not_configured'`. If sync fails, `crm_state='failed'` and the server log has the error. After adding or fixing credentials, `npm run retry` attempts CRM sync without generating another draft. Do not describe a missing CRM result as complete.
5. Keep all sample emails fictional. If your Zoho plan rejects `.example` addresses, demonstrate the draft and routing in Supabase instead and explain that limitation honestly in Loom.

## 6. GitHub and Vercel

1. Run `git init`, `git add .`, and `git commit -m "Build Myntmore Round 2 assignment"`. Check `git status` and `git ls-files` to ensure no `.env.local` or credentials are tracked.
2. Create a new GitHub repository under your own account and push the main branch. Copy the verified repository URL into the submission document.
3. In Vercel, **Add New Project > Import Git Repository**. Select this repository. Framework should detect Next.js.
4. Add `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTOMATION_SECRET`, and optional Zoho variables to Vercel environment variables. Add `MAKE_WEBHOOK_URL` and `MAKE_WEBHOOK_API_KEY` after creating Make, then redeploy.
5. Update the Make HTTP modules with the actual Vercel domain. This resolves the circular setup: first deploy the app, then create/activate Make, then add the Make URL/key to Vercel and redeploy.
6. Open the live site on desktop and mobile. Submit a real two-line hook with a test contact under your control. Check `hook_sessions`, the Make execution, `lead_outcomes` with a `hook:` key, and the visible result. Copy the actual live URL to the submission document.

## 7. Operational recovery

- **Gemini 429/5xx:** a CSV raw row remains and the error is recorded in `processing_failures`. A Hook Grader session is saved before generation and shows `generation_status='failed'`. Run `npm run retry` after quota/service recovery.
- **Webhook failure:** Hook Grader session remains with `webhook_status='pending'`. Run `npm run retry`. CSV import prints webhook receipt status; inspect Make (or n8n) execution and database status for completion.
- **Duplicate lead:** raw session remains; `duplicate_of` records the first contact and no second draft is created.
- **Missing email/test/non-buyer/prompt injection:** explicit `flags`, a reason, and Not a fit tier; no email draft.
- **Zoho failure:** `crm_state='failed'`; fix Zoho and run `npm run retry`. Existing drafts are reused. No sending workflow exists.
- **New free tool:** add source mapping in `src/lib/lead.ts`, add its form session source, and test a sample row. Do not alter scoring solely through a prompt.
- **Access control:** the automation endpoint rejects missing or incorrect `x-automation-secret`. Rotate the secret in both Vercel and Make together. Make's inbound webhook also uses `MAKE_WEBHOOK_API_KEY`.

## 8. Assignment-only manual evidence

1. Open the Myntmore [Profile Optimizer](https://www.myntmore.com/tools/linkedin-optimizer) and observe its flow; compare the Hook Grader page.
2. Perform the 15 AI-search queries in `docs/OPS_JUDGEMENT.md` directly in ChatGPT, Perplexity, and Gemini. Save screenshots showing the answer and cited sources. Do not copy web-search results into the table as if they were answers from those products.
3. Record a 5-7 minute Loom with camera on, in the required order: sample automation and Zoho or honest limitation; Hook Grader visitor flow; rule versus Gemini walkthrough; remaining gaps. Show no keys.
4. Copy the assignment Google Doc, rename it `Ketan Tiwari - Systems + AI Automation Intern (Round 2)`, fill your verified email and real links, and export it as PDF. Use the local submission draft only as a starting point. Make Drive links Anyone with the link can view when requested.
5. Reply to the existing email thread with the final PDF attachment by **10 October, 12 noon** in the sender's intended time zone. This repository does not send that email.
