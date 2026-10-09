# Final submission checklist and honest status

**Deadline in the received message:** 10 October at 12 noon. Confirm the time zone with the sender if needed. The user message identifies Ketan Tiwari, but the final name spelling and email address must be verified before submission.

| Item | Current state | Final action |
| --- | --- | --- |
| Source code | Built locally | Push to the candidate's GitHub; paste actual URL. |
| Rule-based sample run | 20/20 local results | Run with Supabase and Gemini, inspect live outcomes. |
| Hook Grader | Next.js build passes | Deploy Vercel and test a real session end to end. |
| Make | Code and scenario instructions provided | Create the Custom webhook and HTTP routes, then verify execution. An n8n alternative is included. |
| Zoho | Optional integration code present | Obtain candidate-owned OAuth credentials, sync fictional records, verify screenshots. |
| Task 03a | Draft answer written | Paste into copied assignment. |
| Task 03b | Questions and worksheet ready | Run 15 platform queries and attach screenshots; then refine website changes. |
| Loom | Script below ready | Record camera-on 5-7 minute video. |
| PDF | Local draft can be generated | Copy original Google Doc, fill verified links/details, export final PDF. |
| Email | Not sent | Reply to the original thread with final PDF attachment. |

## Loom 5-7 minute outline

1. **0:00-1:45:** Show 20 raw Supabase rows, 20 outcomes, 8/4/8 split, alert records, failure check, and Zoho draft records if configured. Point to L11, L18, L19.
2. **1:45-3:00:** Use the live Hook Grader as a visitor. Show contact, a two-line hook, score feedback, three rewrites, and its Supabase/Make event.
3. **3:00-5:15:** Walk through `classifyLead`, `gradeHook`, `structuredGemini`, the Make webhook, and SQL tables. Say exactly which parts are fixed rules and which are Gemini.
4. **5:15-6:30:** State honest limitations: quota/credentials if relevant, automated fact-check limits, manual AI-search screenshots, any missing CRM results, and the next fix.

## Final email reply draft

Subject: keep the existing email subject and reply in the same thread.

Hi Myntmore team,

Thank you for the assignment. I have attached my Round 2 submission PDF. It contains the project links, workflow explanation, and my operations judgement answers.

Best,  
Ketan Tiwari

Attach only the final verified PDF. Do not attach `.env.local` or any secret file. Check that GitHub and Vercel links open in a private browser window and that Drive screenshot links are viewable by anyone with the link if required.
