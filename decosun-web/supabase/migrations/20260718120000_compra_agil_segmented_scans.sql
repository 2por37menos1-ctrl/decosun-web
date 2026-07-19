-- Resumable, bounded executions for Radar Compra Agil.
-- Additive only: no legacy objects or opportunity data are removed.

alter table public.compra_agil_radar_config
  drop constraint if exists compra_agil_radar_config_last_error_stage_check;

alter table public.compra_agil_radar_config
  add constraint compra_agil_radar_config_last_error_stage_check
  check (
    last_error_stage is null
    or last_error_stage in (
      'list', 'detail', 'database', 'authorization', 'config', 'runtime'
    )
  );

update public.compra_agil_radar_config
set last_error_stage = 'runtime'
where last_error_code = 'runtime_timeout'
  and last_error_stage is null
  and last_scan_stats ->> 'stage' = 'runtime';

alter table public.compra_agil_radar_config
  add column current_scan_run_id uuid,
  add column external_request_timeout_ms integer not null default 15000
    check (external_request_timeout_ms between 1000 and 60000),
  add column segment_max_requests integer not null default 12
    check (segment_max_requests between 1 and 100),
  add column segment_max_duration_ms integer not null default 90000
    check (segment_max_duration_ms between 10000 and 120000),
  add column stale_heartbeat_seconds integer not null default 300
    check (stale_heartbeat_seconds between 60 and 3600),
  add column max_segments_per_scan integer not null default 100
    check (max_segments_per_scan between 1 and 500);

create table public.compra_agil_scan_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running'
    check (status in ('running', 'failed', 'success')),
  phase text not null default 'listing'
    check (phase in ('listing', 'detail', 'finalize')),
  scan_until timestamptz not null,
  window_mode text not null check (window_mode in ('initial', 'incremental')),
  window_from timestamptz not null,
  window_to timestamptz not null,
  search_terms text[] not null,
  product_terms text[] not null,
  region_codes smallint[] not null default '{}'::smallint[],
  minimum_budget numeric(16, 2),
  max_requests_per_scan integer not null check (max_requests_per_scan between 10 and 5000),
  external_request_timeout_ms integer not null check (external_request_timeout_ms between 1000 and 60000),
  segment_max_requests integer not null check (segment_max_requests between 1 and 100),
  segment_max_duration_ms integer not null check (segment_max_duration_ms between 10000 and 120000),
  stale_heartbeat_seconds integer not null check (stale_heartbeat_seconds between 60 and 3600),
  term_index integer not null default 0 check (term_index >= 0),
  page_number integer not null default 1 check (page_number >= 1),
  current_stage text not null default 'list'
    check (current_stage in ('list', 'detail', 'finalize')),
  current_request_type text
    check (current_request_type is null or current_request_type in ('listing', 'detail')),
  current_term text,
  current_external_id text,
  cursor jsonb not null default '{"phase":"listing","term_index":0,"page_number":1}'::jsonb,
  requests_used integer not null default 0 check (requests_used >= 0),
  pages_consulted integer not null default 0 check (pages_consulted >= 0),
  total_received integer not null default 0 check (total_received >= 0),
  unique_candidates integer not null default 0 check (unique_candidates >= 0),
  details_consulted integer not null default 0 check (details_consulted >= 0),
  details_reused integer not null default 0 check (details_reused >= 0),
  detail_not_found integer not null default 0 check (detail_not_found >= 0),
  records_processed integer not null default 0 check (records_processed >= 0),
  relevant integer not null default 0 check (relevant >= 0),
  excluded integer not null default 0 check (excluded >= 0),
  inserted integer not null default 0 check (inserted >= 0),
  updated integer not null default 0 check (updated >= 0),
  last_error_code text,
  last_error_stage text check (
    last_error_stage is null
    or last_error_stage in (
      'list', 'detail', 'database', 'authorization', 'config', 'runtime'
    )
  ),
  last_error_request_number integer,
  last_error_request_type text
    check (last_error_request_type is null or last_error_request_type in ('listing', 'detail')),
  last_error_search_term text,
  last_error_page_number integer,
  last_error_external_id text,
  last_upstream_status integer,
  last_error_message text,
  lease_token uuid,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.compra_agil_radar_config
  add constraint compra_agil_radar_config_current_scan_run_id_fkey
  foreign key (current_scan_run_id)
  references public.compra_agil_scan_runs(id)
  on delete set null;

create unique index idx_compra_agil_scan_runs_single_active
  on public.compra_agil_scan_runs ((1))
  where status = 'running';

create index idx_compra_agil_scan_runs_recent
  on public.compra_agil_scan_runs (started_at desc);

create table public.compra_agil_scan_candidates (
  scan_run_id uuid not null references public.compra_agil_scan_runs(id) on delete cascade,
  external_id text not null,
  list_item jsonb not null,
  discovery_terms text[] not null default '{}'::text[],
  preliminary_reason text,
  was_existing boolean,
  detail_requested boolean not null default false,
  detail_not_found boolean not null default false,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scan_run_id, external_id)
);

create index idx_compra_agil_scan_candidates_pending
  on public.compra_agil_scan_candidates (scan_run_id, external_id)
  where processed = false;

alter table public.compra_agil_scan_runs enable row level security;
alter table public.compra_agil_scan_candidates enable row level security;

revoke all on table public.compra_agil_scan_runs from anon, authenticated;
revoke all on table public.compra_agil_scan_candidates from anon, authenticated;
grant select on table public.compra_agil_scan_runs to authenticated;
grant all on table public.compra_agil_scan_runs to service_role;
grant all on table public.compra_agil_scan_candidates to service_role;

create policy compra_agil_scan_runs_select_gerencia
on public.compra_agil_scan_runs
for select
to authenticated
using (public.is_compra_agil_gerencia());

grant update (
  external_request_timeout_ms,
  segment_max_requests,
  segment_max_duration_ms,
  stale_heartbeat_seconds,
  max_segments_per_scan,
  updated_at
) on table public.compra_agil_radar_config to authenticated;

create or replace function public.compra_agil_claim_segment(
  p_run_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.compra_agil_scan_runs
  set lease_token = p_lease_token,
      lease_expires_at = clock_timestamp() + make_interval(secs => p_lease_seconds),
      heartbeat_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_run_id
    and status = 'running'
    and (lease_token is null or lease_expires_at < clock_timestamp());
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.compra_agil_begin_request(
  p_run_id uuid,
  p_lease_token uuid,
  p_stage text,
  p_request_type text,
  p_search_term text default null,
  p_page_number integer default null,
  p_external_id text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_request integer;
begin
  update public.compra_agil_scan_runs
  set requests_used = requests_used + 1,
      current_stage = p_stage,
      current_request_type = p_request_type,
      current_term = p_search_term,
      current_external_id = p_external_id,
      heartbeat_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_run_id
    and status = 'running'
    and lease_token = p_lease_token
    and lease_expires_at >= clock_timestamp()
  returning requests_used into next_request;
  if next_request is null then
    raise exception 'scan_segment_lease_lost';
  end if;
  if p_stage = 'detail' and p_external_id is not null then
    update public.compra_agil_scan_candidates
    set detail_requested = true,
        updated_at = clock_timestamp()
    where scan_run_id = p_run_id and external_id = p_external_id;
  end if;
  return next_request;
end;
$$;

create or replace function public.compra_agil_persist_listing_page(
  p_run_id uuid,
  p_lease_token uuid,
  p_candidates jsonb,
  p_received integer,
  p_next_term_index integer,
  p_next_page_number integer,
  p_next_phase text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.compra_agil_scan_runs
    where id = p_run_id and status = 'running'
      and lease_token = p_lease_token
      and lease_expires_at >= clock_timestamp()
  ) then
    raise exception 'scan_segment_lease_lost';
  end if;

  insert into public.compra_agil_scan_candidates (
    scan_run_id, external_id, list_item, discovery_terms,
    preliminary_reason, updated_at
  )
  select
    p_run_id,
    candidate.external_id,
    candidate.list_item,
    array[candidate.discovery_term],
    candidate.preliminary_reason,
    clock_timestamp()
  from jsonb_to_recordset(coalesce(p_candidates, '[]'::jsonb)) as candidate(
    external_id text,
    list_item jsonb,
    discovery_term text,
    preliminary_reason text
  )
  where candidate.external_id is not null
  on conflict (scan_run_id, external_id) do update
  set list_item = excluded.list_item,
      discovery_terms = (
        select array_agg(distinct term order by term)
        from unnest(
          public.compra_agil_scan_candidates.discovery_terms
          || excluded.discovery_terms
        ) as term
      ),
      preliminary_reason = excluded.preliminary_reason,
      updated_at = clock_timestamp();

  update public.compra_agil_scan_runs
  set phase = p_next_phase,
      current_stage = case when p_next_phase = 'detail' then 'detail' else 'list' end,
      term_index = p_next_term_index,
      page_number = p_next_page_number,
      cursor = jsonb_build_object(
        'phase', p_next_phase,
        'term_index', p_next_term_index,
        'page_number', p_next_page_number
      ),
      pages_consulted = pages_consulted + 1,
      total_received = total_received + greatest(p_received, 0),
      unique_candidates = (
        select count(*) from public.compra_agil_scan_candidates
        where scan_run_id = p_run_id
      ),
      heartbeat_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_run_id and lease_token = p_lease_token;
end;
$$;

create or replace function public.compra_agil_complete_candidate(
  p_run_id uuid,
  p_lease_token uuid,
  p_external_id text,
  p_relevant boolean,
  p_inserted boolean,
  p_detail_consulted boolean,
  p_detail_reused boolean,
  p_detail_not_found boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update public.compra_agil_scan_candidates
  set processed = true,
      processed_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where scan_run_id = p_run_id
    and external_id = p_external_id
    and processed = false
    and exists (
      select 1 from public.compra_agil_scan_runs
      where id = p_run_id and status = 'running'
        and lease_token = p_lease_token
        and lease_expires_at >= clock_timestamp()
    );
  get diagnostics affected = row_count;
  if affected = 1 then
    update public.compra_agil_scan_runs
    set records_processed = records_processed + 1,
        relevant = relevant + case when p_relevant then 1 else 0 end,
        excluded = excluded + case when p_relevant then 0 else 1 end,
        inserted = inserted + case when p_inserted then 1 else 0 end,
        updated = updated + case when p_inserted then 0 else 1 end,
        details_consulted = details_consulted + case when p_detail_consulted then 1 else 0 end,
        details_reused = details_reused + case when p_detail_reused then 1 else 0 end,
        detail_not_found = detail_not_found + case when p_detail_not_found then 1 else 0 end,
        current_external_id = p_external_id,
        current_stage = 'detail',
        current_request_type = 'detail',
        cursor = jsonb_build_object(
          'phase', 'detail',
          'last_completed_external_id', p_external_id
        ),
        heartbeat_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where id = p_run_id and lease_token = p_lease_token;
  end if;
  return affected = 1;
end;
$$;

create or replace function public.compra_agil_finalize_scan(
  p_run_id uuid,
  p_lease_token uuid,
  p_stats jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_until timestamptz;
  affected integer;
begin
  select scan_until into run_until
  from public.compra_agil_scan_runs
  where id = p_run_id and status = 'running'
    and phase = 'finalize'
    and lease_token = p_lease_token
    and lease_expires_at >= clock_timestamp()
  for update;
  if run_until is null then
    raise exception 'scan_segment_lease_lost';
  end if;

  update public.compra_agil_radar_config
  set last_successful_change_at = run_until,
      last_scan_completed_at = clock_timestamp(),
      last_scan_status = 'success',
      last_scan_stats = p_stats,
      last_error_code = null,
      last_error_stage = null,
      last_error_request_number = null,
      last_error_request_type = null,
      last_error_search_term = null,
      last_error_page_number = null,
      last_error_external_id = null,
      last_upstream_status = null,
      last_error_message = null,
      updated_at = clock_timestamp()
  where id = 1 and current_scan_run_id = p_run_id;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'scan_config_finalize_failed';
  end if;

  update public.compra_agil_scan_runs
  set status = 'success',
      current_stage = 'finalize',
      current_request_type = null,
      current_term = null,
      current_external_id = null,
      cursor = '{}'::jsonb,
      completed_at = clock_timestamp(),
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_run_id;
end;
$$;

create or replace function public.compra_agil_release_segment(
  p_run_id uuid,
  p_lease_token uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.compra_agil_scan_runs
  set lease_token = null,
      lease_expires_at = null,
      heartbeat_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_run_id and lease_token = p_lease_token;
$$;

revoke all on function public.compra_agil_claim_segment(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.compra_agil_begin_request(uuid, uuid, text, text, text, integer, text) from public, anon, authenticated;
revoke all on function public.compra_agil_persist_listing_page(uuid, uuid, jsonb, integer, integer, integer, text) from public, anon, authenticated;
revoke all on function public.compra_agil_complete_candidate(uuid, uuid, text, boolean, boolean, boolean, boolean, boolean) from public, anon, authenticated;
revoke all on function public.compra_agil_release_segment(uuid, uuid) from public, anon, authenticated;
revoke all on function public.compra_agil_finalize_scan(uuid, uuid, jsonb) from public, anon, authenticated;

grant execute on function public.compra_agil_claim_segment(uuid, uuid, integer) to service_role;
grant execute on function public.compra_agil_begin_request(uuid, uuid, text, text, text, integer, text) to service_role;
grant execute on function public.compra_agil_persist_listing_page(uuid, uuid, jsonb, integer, integer, integer, text) to service_role;
grant execute on function public.compra_agil_complete_candidate(uuid, uuid, text, boolean, boolean, boolean, boolean, boolean) to service_role;
grant execute on function public.compra_agil_release_segment(uuid, uuid) to service_role;
grant execute on function public.compra_agil_finalize_scan(uuid, uuid, jsonb) to service_role;

comment on table public.compra_agil_scan_runs is
  'Sanitized resumable scan state. Never stores credentials, headers, or upstream URLs.';

comment on table public.compra_agil_scan_candidates is
  'Service-role-only transient candidate state used to resume bounded scan segments.';
