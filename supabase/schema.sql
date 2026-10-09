-- Run in Supabase SQL Editor. No client-side table access is allowed.
create table if not exists public.raw_leads (
  lead_id text primary key,
  created_at timestamp without time zone not null,
  source_tool text not null,
  first_name text,
  last_name text,
  designation text,
  email text,
  company text,
  company_website text,
  linkedin_url text,
  tool_input text,
  tool_output text,
  imported_at timestamptz not null default now()
);
create table if not exists public.hook_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  designation text not null,
  email text not null,
  hook text not null,
  score integer not null check (score between 0 and 100),
  checks jsonb not null,
  rewrites jsonb not null default '[]'::jsonb,
  generation_status text not null default 'pending' check (generation_status in ('pending','complete','failed')),
  generation_error text,
  webhook_status text not null default 'pending' check (webhook_status in ('pending','delivered'))
);
create table if not exists public.lead_outcomes (
  source_key text primary key,
  lead_id text not null,
  processed_at timestamptz not null default now(),
  normalized_email text,
  tier text not null check (tier in ('hot','warm','not_fit')),
  score integer not null check (score between 1 and 10),
  service text,
  reason text not null,
  flags jsonb not null default '[]',
  duplicate_of text,
  draft_subject text,
  draft_body text,
  alert_needed boolean not null default false,
  processing_state text not null,
  crm_state text not null
);
create table if not exists public.lead_alerts (
  source_key text primary key,
  created_at timestamptz not null default now(),
  summary text not null,
  acknowledged boolean not null default false
);
create table if not exists public.processing_failures (
  source_key text primary key,
  last_failed_at timestamptz not null default now(),
  error_message text not null,
  resolved_at timestamptz
);
-- Idempotent upgrades for projects created from an earlier version of this file.
alter table public.hook_sessions add column if not exists generation_status text not null default 'pending';
alter table public.hook_sessions add column if not exists generation_error text;
alter table public.hook_sessions alter column rewrites set default '[]'::jsonb;
alter table public.processing_failures add column if not exists resolved_at timestamptz;
create index if not exists raw_leads_email_created_idx on public.raw_leads (lower(email), created_at);
create index if not exists lead_outcomes_tier_idx on public.lead_outcomes (tier);
alter table public.raw_leads enable row level security;
alter table public.hook_sessions enable row level security;
alter table public.lead_outcomes enable row level security;
alter table public.lead_alerts enable row level security;
alter table public.processing_failures enable row level security;
-- Service role access only. Never expose SUPABASE_SERVICE_ROLE_KEY in browser code.
