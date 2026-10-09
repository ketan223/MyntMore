# Make.com scenario - exact account setup

The assignment explicitly asks the Hook Grader to send its session through a **Make.com webhook**. The code is ready for that webhook; these account actions must be done after you have your Make account and deployed app URL. Make's [Custom webhook documentation](https://apps.make.com/gateway?output=1) describes the webhook and `x-make-apikey` authentication; its [HTTP module documentation](https://apps.make.com/http?output=1) describes outgoing API requests.

## Scenario topology

```text
Webhooks > Custom webhook
  -> Router
     -> CSV filter -> HTTP > Make a request -> POST /api/automation/process
     -> Hook filter -> HTTP > Make a request -> POST /api/automation/process
```

The Next.js endpoint holds the reusable cleaning, scoring, Gemini, routing, Supabase, alert, and optional Zoho logic. Make supplies the event trigger, branches, execution history, and retries. No module sends email or a message.

## Configure it

1. Create a new Make scenario named `Myntmore Lead Follow-Up - Drafts Only`.
2. Add **Webhooks > Custom webhook**. Name it `myntmore-lead-event`. Add **API key authentication** with a long random key. Put that key in `MAKE_WEBHOOK_API_KEY` in `.env.local` and Vercel. Make expects this key in the `x-make-apikey` request header. Copy the generated webhook URL to `MAKE_WEBHOOK_URL` in both places. Keep both values private.
3. Define a webhook data structure with these fields: `source` (text), `lead_id` (text, optional), and `session_id` (text, optional). Example CSV event: `{"source":"csv","lead_id":"L01"}`. Example Hook Grader event: `{"source":"hook_grader","session_id":"00000000-0000-4000-8000-000000000001"}`. Do not put secret values in sample bodies.
4. Add a **Router** after the webhook. First route filter: `source` equals `csv`. Second route filter: `source` equals `hook_grader`. Unexpected sources must not reach the processor; inspect them in Make execution history.
5. On the CSV route, add **HTTP > Make a request**. Set method `POST`, URL `https://YOUR_VERCEL_DOMAIN/api/automation/process`, and content type `application/json`. Add header `x-automation-secret` with the same value as Vercel `AUTOMATION_SECRET`. Set request body to JSON with `source` fixed to `csv` and `lead_id` mapped from the webhook's `lead_id` field.
6. On the Hook route, add another HTTP request with the same URL/header. Set body to JSON with `source` fixed to `hook_grader` and `session_id` mapped from the webhook's `session_id` field. Do not include an empty `session_id` in the CSV route.
7. Configure each HTTP module to treat non-2xx responses as errors. Turn on Make's incomplete-execution storage or add a Retry error handler for temporary errors; inspect and retry failures after correcting their cause. The processor uses idempotent `source_key` values, so replaying an event does not create another completed outcome.
8. Run the scenario once with a CSV event after importing `raw_leads`. Confirm `lead_outcomes` has `csv:L01`. Then turn the scenario **On**. Submit a Hook Grader visit and confirm its `hook:<UUID>` outcome. Check the Make execution log and database; webhook receipt alone is not processing proof.

The app uses `MAKE_WEBHOOK_URL` when set and falls back to `N8N_WEBHOOK_URL` only when Make is absent. For this assignment, set Make and leave n8n empty. The n8n JSON is retained as an optional alternative for reuse elsewhere.
