-- Sanitized diagnostics for the latest Compra Agil scan failure.
-- Additive only: no legacy objects or historical opportunity data are changed.

alter table public.compra_agil_radar_config
  add column last_error_code text,
  add column last_error_stage text
    check (last_error_stage is null or last_error_stage in ('list', 'detail', 'database', 'authorization', 'config')),
  add column last_error_request_number integer
    check (last_error_request_number is null or last_error_request_number >= 0),
  add column last_error_request_type text
    check (last_error_request_type is null or last_error_request_type in ('listing', 'detail')),
  add column last_error_search_term text,
  add column last_error_page_number integer
    check (last_error_page_number is null or last_error_page_number >= 1),
  add column last_error_external_id text,
  add column last_upstream_status integer
    check (last_upstream_status is null or last_upstream_status between 100 and 599),
  add column last_error_message text;

comment on column public.compra_agil_radar_config.last_error_message is
  'Sanitized operational message only. Must never contain credentials, headers, URLs, or upstream payloads.';
