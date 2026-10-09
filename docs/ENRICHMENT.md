# Optional enrichment demonstration - three real companies

The 20 sample people and their `.example` companies are fictional, so enriching them as if they were real would create false data. `data/real_company_enrichment.csv` instead demonstrates one public, source-backed field for three real companies, checked on 8 October 2026. It is deliberately separate from the fictional lead table.

| Company | Public company-size signal | Primary source | Freshness caveat |
| --- | --- | --- | --- |
| Zoho | More than 19,000 employees | [Zoho About](https://www.zoho.com/aboutus.html) | Company statement, not live headcount. |
| HubSpot | 9,000+ global employees | [HubSpot Newsroom](https://www.hubspot.com/company-news) | The newsroom figure may lag an [October 2026 workforce change](https://www.hubspot.com/company-news/company-update). |
| Atlassian | 12,000+ Atlassians | [Atlassian About](https://www.atlassian.com/company) | The About figure may lag a [March 2026 workforce change](https://www.atlassian.com/blog/company-news/atlassian-team-update-march-2026). |

For production enrichment, store `company_name`, `signal`, `value`, `source_url`, `checked_at`, and `confidence` per observation. Refresh before using a changing metric in sales copy. Never use a company-size observation to invent a claim about one of the sample leads.
