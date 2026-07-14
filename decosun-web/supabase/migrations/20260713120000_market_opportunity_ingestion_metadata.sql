-- DecoSun Mercado Publico - Phase 1 ingestion metadata.
-- Additive only: existing opportunities and audit payloads are preserved.

alter table public.market_opportunities
  add column if not exists original_closing_at timestamptz,
  add column if not exists extended_closing_at timestamptz,
  add column if not exists closing_was_extended boolean not null default false,
  add column if not exists ingestion_sources text[] not null default '{}'::text[],
  add column if not exists last_public_scan_at timestamptz,
  add column if not exists last_recommended_sync_at timestamptz;

create index if not exists idx_market_opportunities_closing_at
  on public.market_opportunities(closing_at);

create index if not exists idx_market_opportunities_site_visit_at
  on public.market_opportunities(site_visit_at);
