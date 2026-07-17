-- DecoSun Radar Compra Agil V2.
-- Additive only. Legacy Mercado Publico objects are intentionally left intact
-- until the separately approved cleanup stage.

create table public.compra_agil_opportunities (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  title text not null,
  description text,
  status text not null,
  call_number smallint check (call_number in (1, 2)),
  first_call_closing_at timestamptz,
  second_call_closing_at timestamptz,
  closing_at timestamptz,
  published_at timestamptz,
  last_changed_at timestamptz,
  institution_name text,
  institution_rut text,
  unit_name text,
  region_code smallint check (region_code between 1 and 16),
  region_name text,
  budget_amount numeric(16, 2) check (budget_amount is null or budget_amount >= 0),
  currency text,
  products jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  delivery_address text,
  delivery_days integer check (delivery_days is null or delivery_days >= 0),
  offers_received integer check (offers_received is null or offers_received >= 0),
  purchase_order_id bigint,
  priority text not null default 'baja' check (priority in ('alta', 'media', 'baja')),
  priority_score smallint not null default 0 check (priority_score between 0 and 100),
  matched_keywords text[] not null default '{}'::text[],
  matched_products text[] not null default '{}'::text[],
  is_relevant boolean not null default false,
  review_status text not null default 'nueva',
  exclusion_reason text,
  match_evidence jsonb not null default '{}'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  detail_fetched_at timestamptz,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compra_agil_radar_config (
  id smallint primary key default 1 check (id = 1),
  search_terms text[] not null default array[
    'cortinas roller', 'blackout', 'screen', 'persianas', 'toldos',
    'control solar', 'cortinas clinicas', 'cierre de cristal'
  ]::text[],
  product_terms text[] not null default array[
    'roller', 'blackout', 'screen', 'persiana', 'toldo',
    'control solar', 'cortina clinica', 'cierre de cristal', 'cerramiento'
  ]::text[],
  region_codes smallint[] not null default '{}'::smallint[],
  minimum_budget numeric(16, 2) check (minimum_budget is null or minimum_budget >= 0),
  initial_lookback_days integer not null default 14 check (initial_lookback_days between 1 and 90),
  overlap_minutes integer not null default 10 check (overlap_minutes between 1 and 60),
  max_requests_per_scan integer not null default 500 check (max_requests_per_scan between 10 and 5000),
  last_successful_change_at timestamptz,
  last_scan_started_at timestamptz,
  last_scan_completed_at timestamptz,
  last_scan_status text not null default 'never' check (last_scan_status in ('never', 'running', 'success', 'failed')),
  last_scan_stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.compra_agil_radar_config (id)
values (1)
on conflict (id) do nothing;

create index idx_compra_agil_open_closing
  on public.compra_agil_opportunities(closing_at)
  where status = 'publicada' and is_relevant = true;

create index idx_compra_agil_region_closing
  on public.compra_agil_opportunities(region_code, closing_at);

create index idx_compra_agil_priority_closing
  on public.compra_agil_opportunities(priority_score desc, closing_at);

create index idx_compra_agil_relevance_scanned
  on public.compra_agil_opportunities(is_relevant, scanned_at desc);

create index idx_compra_agil_matched_keywords_gin
  on public.compra_agil_opportunities using gin(matched_keywords);

create index idx_compra_agil_matched_products_gin
  on public.compra_agil_opportunities using gin(matched_products);

create or replace function public.is_compra_agil_gerencia()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'gerencia'
      and coalesce(is_active, true)
  );
$$;

revoke all on function public.is_compra_agil_gerencia() from public;
grant execute on function public.is_compra_agil_gerencia() to authenticated;

alter table public.compra_agil_opportunities enable row level security;
alter table public.compra_agil_radar_config enable row level security;

revoke all on table public.compra_agil_opportunities from anon, authenticated;
revoke all on table public.compra_agil_radar_config from anon, authenticated;

grant select on table public.compra_agil_opportunities to authenticated;
grant select on table public.compra_agil_radar_config to authenticated;
grant update (
  search_terms,
  product_terms,
  region_codes,
  minimum_budget,
  initial_lookback_days,
  overlap_minutes,
  max_requests_per_scan,
  updated_at
) on table public.compra_agil_radar_config to authenticated;

grant all on table public.compra_agil_opportunities to service_role;
grant all on table public.compra_agil_radar_config to service_role;

create policy compra_agil_opportunities_select_gerencia
on public.compra_agil_opportunities
for select
to authenticated
using (public.is_compra_agil_gerencia());

create policy compra_agil_radar_config_select_gerencia
on public.compra_agil_radar_config
for select
to authenticated
using (public.is_compra_agil_gerencia());

create policy compra_agil_radar_config_update_gerencia
on public.compra_agil_radar_config
for update
to authenticated
using (public.is_compra_agil_gerencia())
with check (public.is_compra_agil_gerencia());

comment on table public.compra_agil_opportunities is
  'Current normalized Compra Agil V2 opportunities and inclusion audit evidence.';

comment on table public.compra_agil_radar_config is
  'Gerencia-managed Radar filters and successful incremental scan watermark. Contains no API credentials.';
