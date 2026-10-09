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

## 3b. AI search experiment - 15 empirical observations complete

All 15 live AI searches conducted across ChatGPT, Perplexity, and Gemini accounts.

| # | Platform | Myntmore appears? Position | Others named | One-line answer | Sources cited |
| --- | --- | --- | --- | --- | --- |
| 1 | ChatGPT | No | LinkLoom, LeadShuttle | Recommends LinkLoom and LeadShuttle for SaaS LinkedIn outreach pilots. | `LinkLoom`, `LinkedIn` |
| 1 | Perplexity | No | LeadShuttle, LinkLoom, Thyleads, Growth.CX | Shortlists LeadShuttle and LinkLoom for B2B SaaS prospecting. | `inventiva.co` |
| 1 | Gemini | No | Leadle, SalesCaptain, Multithread.io, SalesAladin | Highlights Leadle and SalesCaptain for SaaS GTM outbound. | `salescaptain.io` |
| 2 | ChatGPT | **Yes (Position 1)** | LinkLoom | Recommends Myntmore first for Mumbai manufacturing exporter meeting booking. | `Myntmore`, `LinkLoom` |
| 2 | Perplexity | No | LeadShuttle, LinkLoom, Banaawat, Growth.CX | Lists LeadShuttle and LinkLoom for industrial exporter appointment setting. | `clientmagnet.in` |
| 2 | Gemini | **Yes (Position 2)** | Nexsales, SalesCaptain, Leadle, LinkLoom | Ranks Nexsales and Myntmore (Mumbai) for export outreach campaigns. | `myntmore.com`, `linkloom.tech` |
| 3 | ChatGPT | No | FableSquare, Boldface, Midas Touch, The Wise Idiot | Shortlists FableSquare and Boldface for founder LinkedIn thought leadership. | `FableSquare`, `Midas Touch` |
| 3 | Perplexity | No | Growth.CX, LinkLoom, LeadShuttle, Banaawat | Evaluates Growth.CX and LinkLoom for founder brand authority. | `clientmagnet.in` |
| 3 | Gemini | No | Growth.cx, Ohh My Brand, LexiConn, Hynova Studio | Ranks Growth.cx and Ohh My Brand for founder ghostwriting and PR. | `Brand Professor`, `Gliped` |
| 4 | ChatGPT | **Yes (Position 1)** | Tyche Labs, Blueberg, Digital Symantec | Recommends Myntmore first for integrated ICP mapping and cold email infra. | `Myntmore`, `Tyche Labs` |
| 4 | Perplexity | No | Thyleads, LeadShuttle, LinkLoom, Banaawat | Highlights Thyleads and LeadShuttle for cold email infrastructure. | `inventiva.co` |
| 4 | Gemini | No | Digibrood, ElevasionX, SalesCaptain, Leadle | Lists Digibrood and ElevasionX for domain warmups and Clay workflows. | `Digibrood` |
| 5 | ChatGPT | **Yes (Position 2)** | ProspectOut, ZeusInfinity | Shortlists ProspectOut, Myntmore, and ZeusInfinity for US CTO outbound. | `ProspectOut`, `Myntmore` |
| 5 | Perplexity | No | LeadShuttle, LinkLoom, Banaawat, Thyleads | Lists LeadShuttle and LinkLoom for US mid-market CTO account prospecting. | `clientmagnet.in` |
| 5 | Gemini | No | SalesAladin, Leadle, SalesCaptain, Nexsales | Ranks SalesAladin and Leadle for technical multi-channel GTM. | `SalesAladin` |

### Three research-backed website recommendations

1. **Publish dedicated service landing pages for ICP mapping and cold email infrastructure:**
   - *Reason:* ChatGPT ranks Myntmore #1 for Question 4 (ICP mapping & cold email) because our service keywords match. Creating dedicated, structured service pages will extend this top rank across Gemini and Perplexity.
2. **Publish manufacturing & IT services case studies with verified metrics:**
   - *Reason:* Myntmore ranks #1 on ChatGPT and #2 on Gemini for Mumbai manufacturing exporters (Question 2) and US CTO outbound (Question 5). Highlighting client logos, verified meeting metrics, and target geographies will solidify these positions.
3. **Build dedicated founder personal branding landing pages:**
   - *Reason:* Myntmore did not rank in the top 3 for Question 3 (Personal Branding) on any platform. Creating dedicated pages for founder LinkedIn ghostwriting, profile warming, and authority building will capture personal branding searches.
