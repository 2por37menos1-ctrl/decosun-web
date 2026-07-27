-- DecoSun ERP - Phase 3A.14
-- Normalize Edgar advisor identity to canonical advisor_id.
--
-- Scope:
-- - Update only Edgar profile advisor_id when null/different.
-- - Update only historical projects with advisor_id is null and advisor_name Edgar/Edgar Leighton.
-- - Do not modify project_commissions, payments, treasury, amounts, or financial statuses.
--
-- Idempotency:
-- - Re-running keeps the same final state.

begin;

do $$
declare
  v_canonical_advisor_id constant uuid := '4a84c0a5-184e-4ca1-8cd5-406a1e2a0301';
  v_advisor_count integer;
  v_advisor_name_count integer;
  v_profile_count integer;
  v_profile_name_count integer;
  v_profiles_updated integer;
  v_projects_updated integer;
begin
  -- 1) Validate canonical advisor exists exactly once.
  select count(*)
    into v_advisor_count
  from public.advisors a
  where a.id = v_canonical_advisor_id;

  if v_advisor_count <> 1 then
    raise exception 'Phase 3A.14 aborted: expected exactly 1 advisors row for canonical id %, got %',
      v_canonical_advisor_id,
      v_advisor_count;
  end if;

  -- 2) Validate canonical advisor name belongs to Edgar identity.
  select count(*)
    into v_advisor_name_count
  from public.advisors a
  where a.id = v_canonical_advisor_id
    and lower(trim(coalesce(a.full_name, ''))) in ('edgar', 'edgar leighton');

  if v_advisor_name_count <> 1 then
    raise exception 'Phase 3A.14 aborted: canonical advisor id % is not Edgar identity',
      v_canonical_advisor_id;
  end if;

  -- 3) Validate there is exactly one Edgar profile.
  select count(*)
    into v_profile_count
  from public.profiles p
  where lower(trim(coalesce(p.full_name, ''))) in ('edgar', 'edgar leighton');

  if v_profile_count <> 1 then
    raise exception 'Phase 3A.14 aborted: expected exactly 1 Edgar profile, got %',
      v_profile_count;
  end if;

  -- 4) Validate the Edgar profile can be linked to canonical advisor id.
  select count(*)
    into v_profile_name_count
  from public.profiles p
  where lower(trim(coalesce(p.full_name, ''))) in ('edgar', 'edgar leighton')
    and (p.advisor_id is null or p.advisor_id <> v_canonical_advisor_id);

  -- 5) Update only Edgar profile advisor_id (if needed).
  update public.profiles p
     set advisor_id = v_canonical_advisor_id
   where lower(trim(coalesce(p.full_name, ''))) in ('edgar', 'edgar leighton')
     and (p.advisor_id is null or p.advisor_id <> v_canonical_advisor_id);

  get diagnostics v_profiles_updated = row_count;

  -- 6) Update only unequivocal historical Edgar projects.
  -- Security criterion: advisor_id must be null AND advisor_name must be Edgar identity.
  -- Region is intentionally not used as a hard filter to avoid missing legacy Edgar
  -- projects outside normalized region metadata.
  update public.projects pr
     set advisor_id = v_canonical_advisor_id
   where pr.advisor_id is null
     and lower(trim(coalesce(pr.advisor_name, ''))) in ('edgar', 'edgar leighton');

  get diagnostics v_projects_updated = row_count;

  raise notice 'Phase 3A.14 updates: profiles=% projects=% profile_candidates=%',
    v_profiles_updated,
    v_projects_updated,
    v_profile_name_count;
end $$;

-- 7) Post-checks (read-only verification outputs).
-- 7.1 Edgar profile should now point to canonical advisor_id.
select
  p.id as profile_id,
  p.full_name,
  p.role,
  p.region_code,
  p.advisor_id
from public.profiles p
where lower(trim(coalesce(p.full_name, ''))) in ('edgar', 'edgar leighton');

-- 7.2 Historical Edgar projects with advisor_id null should be zero.
select
  count(*) as projects_edgar_null_advisor_id
from public.projects pr
where pr.advisor_id is null
  and lower(trim(coalesce(pr.advisor_name, ''))) in ('edgar', 'edgar leighton');

-- 7.3 Edgar projects tied to canonical advisor_id.
select
  count(*) as projects_edgar_canonical_advisor_id
from public.projects pr
where pr.advisor_id = '4a84c0a5-184e-4ca1-8cd5-406a1e2a0301'::uuid
  and lower(trim(coalesce(pr.advisor_name, ''))) in ('edgar', 'edgar leighton');

-- 7.4 project_commissions remain unchanged in normalization scope.
select
  count(*) as project_commissions_edgar_null_advisor_id
from public.project_commissions pc
where pc.advisor_id is null
  and lower(trim(coalesce(pc.advisor_name, ''))) in ('edgar', 'edgar leighton');

select
  count(*) as project_commissions_edgar_canonical_advisor_id
from public.project_commissions pc
where pc.advisor_id = '4a84c0a5-184e-4ca1-8cd5-406a1e2a0301'::uuid
  and lower(trim(coalesce(pc.advisor_name, ''))) in ('edgar', 'edgar leighton');

commit;
