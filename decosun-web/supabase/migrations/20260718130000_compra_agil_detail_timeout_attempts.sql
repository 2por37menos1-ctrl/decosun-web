-- Separate Compra Agil listing/detail timeouts and persist manual detail attempts.
-- Additive only. Existing opportunities, cursor and watermark are preserved.

alter table public.compra_agil_radar_config
  add column detail_request_timeout_ms integer not null default 30000
    check (detail_request_timeout_ms between 1000 and 60000),
  add column max_detail_attempts integer not null default 2
    check (max_detail_attempts between 1 and 5);

alter table public.compra_agil_scan_runs
  add column detail_request_timeout_ms integer not null default 30000
    check (detail_request_timeout_ms between 1000 and 60000),
  add column max_detail_attempts integer not null default 2
    check (max_detail_attempts between 1 and 5);

alter table public.compra_agil_scan_candidates
  add column detail_attempt_count integer not null default 0
    check (detail_attempt_count >= 0);

-- The persisted failed detail request happened before this counter existed.
-- Count it once without marking the candidate processed or moving its cursor.
update public.compra_agil_scan_candidates as candidate
set detail_attempt_count = 1,
    updated_at = clock_timestamp()
from public.compra_agil_scan_runs as run
where candidate.scan_run_id = run.id
  and candidate.external_id = run.last_error_external_id
  and candidate.processed = false
  and candidate.detail_requested = true
  and candidate.detail_attempt_count = 0
  and run.last_error_stage = 'detail'
  and run.last_error_code = 'upstream_request_timeout';

grant update (
  detail_request_timeout_ms,
  max_detail_attempts,
  updated_at
) on table public.compra_agil_radar_config to authenticated;

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
  next_detail_attempt integer;
begin
  if p_stage = 'detail' and p_external_id is not null then
    update public.compra_agil_scan_candidates as candidate
    set detail_requested = true,
        detail_attempt_count = detail_attempt_count + 1,
        updated_at = clock_timestamp()
    where candidate.scan_run_id = p_run_id
      and candidate.external_id = p_external_id
      and candidate.processed = false
      and candidate.detail_attempt_count < (
        select run.max_detail_attempts
        from public.compra_agil_scan_runs as run
        where run.id = p_run_id
          and run.status = 'running'
          and run.lease_token = p_lease_token
          and run.lease_expires_at >= clock_timestamp()
      )
    returning detail_attempt_count into next_detail_attempt;

    if next_detail_attempt is null then
      raise exception 'detail_attempt_limit_reached';
    end if;
  end if;

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
  return next_request;
end;
$$;

revoke all on function public.compra_agil_begin_request(
  uuid, uuid, text, text, text, integer, text
) from public, anon, authenticated;

grant execute on function public.compra_agil_begin_request(
  uuid, uuid, text, text, text, integer, text
) to service_role;

comment on column public.compra_agil_radar_config.detail_request_timeout_ms is
  'Sanitized configurable timeout for Mercado Publico detail requests.';

comment on column public.compra_agil_scan_candidates.detail_attempt_count is
  'Persistent count of manual detail attempts within the same scan run.';
