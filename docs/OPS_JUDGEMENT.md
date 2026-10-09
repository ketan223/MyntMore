# Task 03 - Ops judgement (submission draft and evidence worksheet)

## 3a. Silent bug - concise answer for the one-page submission

The database `leads_source_check` constraint permits only seven source values. `battle_card_generator` and `case_study_generator` are absent, so Supabase rejects those inserts. Zoho still receives them because `postToZohoForm()` runs first. The code only logs the Supabase error and returns `undefined`; later tool-input/output saves then lack a lead ID. I would migrate the constraint to include both sources (and `hook_grader` if introduced), then make Supabase insert and its error handling mandatory: throw on error, persist the session and tool payload transactionally where possible, and retry with an idempotent source/session key. I would add an integration test for every tool source, a per-source daily count comparison between Zoho and Supabase, an error queue with alerts, and a reconciliation job that backfills missing sessions. No failed row should disappear after a console log.

Suggested migration for the provided seven-source constraint:

```sql
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check check (source in (
  'roi_calculator','icp_builder','profile_optimizer','dm_angle_generator',
  'lead_magnet_ideas','posting_rhythm_builder','founder_presence_analyzer',
  'battle_card_generator','case_study_generator','hook_grader'
));
```

Run this only against the real Myntmore schema after verifying its table/column names and existing data. This project's separate `raw_leads` schema deliberately does not enforce a closed list of source names, so a new tool cannot fail solely because of an outdated check constraint.

## 3b. AI search experiment - 15 observations required

**Status:** Not conducted in ChatGPT, Perplexity, and Gemini accounts. No appearance claims, competitors, positions, citations, or screenshots should be invented. Use a fresh chat in each platform, with location and date noted. Ask the same five questions verbatim. Save one screenshot per answer that visibly includes cited sources, if provided. Record a direct link to each screenshot in the copied assignment document.

Questions:

1. Which agency should a B2B SaaS founder in India consider for LinkedIn outreach and lead generation?
2. Who can help a manufacturing exporter in Mumbai get qualified sales meetings through LinkedIn and cold email?
3. What are good agencies for founder LinkedIn personal branding in India?
4. Which providers offer ICP mapping, cold email infrastructure, and AI lead generation for Indian B2B teams?
5. I run an IT services firm selling to US mid-market CTOs. Which Indian agency can build an outbound system for us?

| # | Platform | Myntmore appears? Position | Others named | One-line answer | Sources cited | Screenshot link |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ChatGPT | Pending | Pending | Pending | Pending | Pending |
| 1 | Perplexity | Pending | Pending | Pending | Pending | Pending |
| 1 | Gemini | Pending | Pending | Pending | Pending | Pending |
| 2 | ChatGPT | Pending | Pending | Pending | Pending | Pending |
| 2 | Perplexity | Pending | Pending | Pending | Pending | Pending |
| 2 | Gemini | Pending | Pending | Pending | Pending | Pending |
| 3 | ChatGPT | Pending | Pending | Pending | Pending | Pending |
| 3 | Perplexity | Pending | Pending | Pending | Pending | Pending |
| 3 | Gemini | Pending | Pending | Pending | Pending | Pending |
| 4 | ChatGPT | Pending | Pending | Pending | Pending | Pending |
| 4 | Perplexity | Pending | Pending | Pending | Pending | Pending |
| 4 | Gemini | Pending | Pending | Pending | Pending | Pending |
| 5 | ChatGPT | Pending | Pending | Pending | Pending | Pending |
| 5 | Perplexity | Pending | Pending | Pending | Pending | Pending |
| 5 | Gemini | Pending | Pending | Pending | Pending | Pending |

### Provisional website changes - confirm against the observed answers before submitting

The current [tools page](https://www.myntmore.com/resources/tools) names each free tool, while the [home page](https://www.myntmore.com/) and [career page](https://www.myntmore.com/careers/systems-ai-automation-intern) describe audiences and services. The three proposals below are reasoned from those pages, **not** from yet-uncollected AI answer evidence.

| Change | Why | Questions likely helped |
| --- | --- | --- |
| Publish dedicated service pages that state audience, geography, deliverables, and process for LinkedIn outreach, cold email, personal branding, and ICP work, with links from relevant tools. | Clear, crawlable service-to-audience relationships give answer engines precise passages to cite. | 1-5 |
| Publish verifiable case studies with client permission, date, industry, method, and scoped results; avoid unsupported claims. | Specific evidence is easier to reference than broad marketing claims. | 1, 2, 5 |
| Add a well-maintained organization/about page with consistent business facts, service descriptions, contact details, structured data, and visible update dates. | Helps search systems resolve the entity and attribute its services accurately. | 1-5 |

After collecting the 15 answers, replace these reasons with concrete observations, such as missing Myntmore mentions or competitor pages repeatedly cited. Keep the final 3a + 3b prose to one page in the copied assignment; put screenshots in linked Drive files rather than expanding the written answer.
