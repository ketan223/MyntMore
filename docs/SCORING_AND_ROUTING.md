# Task 01 scoring and routing specification

`src/lib/lead.ts` is the authority for the rules below. This page explains the fixed decisions in plain language and records the expected result for every provided CSV row. Gemini does **not** choose a score, tier, service, or exclusion reason. It only writes the draft after a row passes the rules.

## Cleaning and duplicate policy

1. Trim and normalize whitespace. Compare emails in lowercase.
2. Keep every original session in `raw_leads`, including a test, invalid, or repeated session.
3. Mark an email repeated only when the **same email address** appeared in an earlier session. Shared company name alone is not a duplicate. The repeated session keeps `duplicate_of` and receives no second draft or CRM overwrite.
4. Flag missing/invalid email, obvious test entry, missing tool input/output, student/job-seeker intent, competing service provider, missing company, and instruction-injection text. A flag is stored with the reason rather than silently dropping the row.
5. For new Hook Grader sessions, previous CSV and earlier Hook Grader emails are considered for repeat-contact detection.

## Fit score, 1 to 10

Start at **1** and add:

| Signal | Points |
| --- | ---: |
| Company present | +2 |
| Founder, CEO, managing director, CRO, VP Sales, or Head of Sales designation | +2 |
| Marketing Manager designation, if no higher decision-maker match | +1 |
| B2B or commercial intent signal in designation, company, input, or output | +2 |
| Source tool maps to a Myntmore service | +1 |
| Both tool input and output present | +1 |
| Source is an outreach, ROI, battle-card, ICP, or lead-magnet tool | +1 |

Clamp the sum to 1-10. Cap test entries, non-buyers, and competing providers at **2**. Cap incomplete sessions and instruction-injection attempts at **3**. The score measures apparent service fit; the tier also considers whether it is safe and possible to draft an email. For example, L18 may score highly for fit but is routed Not a fit because it has no address.

## Service mapping

| Tools | Service |
| --- | --- |
| Profile Optimizer, Posting Rhythm Builder, Founder Presence Analyzer, Hook Grader | Personal branding |
| ROI Calculator, Battle Card, ICP Builder, Case Study Generator | Lead generation |
| DM Angle Generator | LinkedIn outreach |
| Lead Magnet Ideas | Cold email |

An unknown tool gets no mapped service point. To add a tool, update the mapping and add a test before using it in production.

## Tier and writing policy

- **Hot:** score 8-10 and no exclusion flag or repeated contact. Gemini writes one direct follow-up draft; `lead_alerts` gets one alert record.
- **Warm:** score 5-7 and no exclusion flag or repeated contact. Gemini writes one nurture draft.
- **Not a fit:** score 1-4, or missing/invalid email, test, non-buyer, competitor, incomplete session, injection attempt, or repeated contact. Store the reason, draft nothing, and create no Hot alert.
- The draft must be under 120 words, without jargon, em dashes, invented numbers/claims, or any call link except `https://myntmore.com/founder-meeting`. It should use details from both the visitor input and tool result. Code validates several mechanical rules; a human must still review semantic accuracy before sending. No send function exists.

## Expected local result for the supplied 20 rows

These are code-rule results from `npm run preview:leads`, before any Gemini or CRM call.

| ID | Tier | Score | Service | Decision and handling |
| --- | --- | ---: | --- | --- |
| L01 | Hot | 8 | Lead generation | Founder, ROI planning, complete session; draft and alert. |
| L02 | Hot | 10 | Lead generation | B2B founder with a defined HR-software buyer; draft and alert. |
| L03 | Hot | 9 | Personal branding | Founder profile has a clear CFO audience and tool feedback; draft and alert. |
| L04 | Hot | 10 | Lead generation | Manufacturer selling to European procurement heads; draft and alert. |
| L05 | Not a fit | 3 | LinkedIn outreach | Tool input and output are both empty; retain with incomplete-session flag, no draft. |
| L06 | Warm | 7 | Personal branding | Founder has a posting need but weak B2B intent; one nurture draft. |
| L07 | Not a fit | 2 | Cold email | Obvious test entry; retain with test flag, no draft. |
| L08 | Warm | 5 | Personal branding | CRO with low posting frequency; one nurture draft. |
| L09 | Not a fit | 2 | Personal branding | Student seeking recruiters, not a business buyer; no draft. |
| L10 | Warm | 7 | Lead generation | Founder used a proposal tool; one nurture draft while commercial fit is uncertain. |
| L11 | Not a fit | 9 | Personal branding | Same email as L03; keep the second session, suppress duplicate draft and CRM overwrite. |
| L12 | Hot | 10 | LinkedIn outreach | Founder targeting HR heads for corporate travel; draft and alert. |
| L13 | Hot | 10 | Lead generation | B2B software founder targeting finance decision-makers; draft and alert. |
| L14 | Not a fit | 2 | LinkedIn outreach | Job seeker looking for an SDR/BDR role, not a buyer; no draft. |
| L15 | Warm | 6 | Personal branding | Different contact from L02 at the same company; CEO visibility need; one nurture draft. |
| L16 | Not a fit | 2 | Personal branding | Appears to sell LinkedIn ghostwriting, a competing service; no draft. |
| L17 | Hot | 10 | Cold email | Head of Sales for B2B IT staffing and services; draft and alert. |
| L18 | Not a fit | 10 | Lead generation | Strong possible fit but no email address, so no email can be drafted. |
| L19 | Not a fit | 3 | Lead generation | Input tries to command the score/tier and invent a guarantee; ignore as untrusted data, no draft. |
| L20 | Hot | 8 | Lead generation | Founder evaluating outreach ROI with complete inputs; draft and alert. |

Totals: **8 Hot, 4 Warm, 8 Not a fit**. The integration test also submits one new Hook Grader visitor through the same processor and verifies idempotency and failure recovery with mock services.
