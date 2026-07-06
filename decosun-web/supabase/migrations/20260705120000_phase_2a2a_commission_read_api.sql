-- DecoSun Financial Engine - Phase 2A.2a
-- Read-only commission reporting API foundation.
--
-- This migration exposes advisor-level and detail-level commission reports
-- through audited security definer RPCs. It does not pay commissions, does not
-- create treasury_movements, does not write project_commissions, and does not
-- modify legacy project commission fields.
--
-- Business rule: project_commissions is the source of generated commissions.
-- Commission payment belongs to later phases.

create or replace function public.get_project_commissions_summary(
  p_from_date date default null,
  p_to_date date default null,
  p_advisor_id uuid default null,
  p_status text default null,
  p_region text default null
)
returns table (
  advisor_id uuid,
  advisor_name text,
  advisor_region text,
  total_generated numeric,
  total_paid numeric,
  total_pending numeric,
  project_count bigint,
  payment_count bigint,
  generated_count bigint,
  partially_paid_count bigint,
  paid_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile record;
  v_status text;
  v_region text;
begin
  -- Phase 2A.2a is reporting only. This RPC performs no inserts, updates, or
  -- deletes. Generated and paid commissions remain separate financial events.

  if auth.uid() is null then
    raise exception 'get_project_commissions_summary requires an authenticated user';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  if coalesce(v_profile.role, '') not in ('gerencia', 'administracion_regional') then
    raise exception 'User is not allowed to read commission reports'
      using errcode = '42501';
  end if;

  if v_profile.role = 'administracion_regional'
    and nullif(trim(v_profile.region_code), '') is null then
    raise exception 'Regional administration user does not have a region_code'
      using errcode = '42501';
  end if;

  v_status := nullif(trim(p_status), '');
  v_region := nullif(trim(p_region), '');

  if v_status is not null
    and v_status not in ('generated', 'partially_paid', 'paid', 'voided', 'reversed') then
    raise exception 'Unsupported commission status %', v_status;
  end if;

  if p_from_date is not null and p_to_date is not null and p_from_date > p_to_date then
    raise exception 'from date cannot be after to date';
  end if;

  if v_profile.role = 'administracion_regional'
    and v_region is not null
    and v_region <> v_profile.region_code then
    raise exception 'Regional administration user cannot read another region'
      using errcode = '42501';
  end if;

  return query
  select
    pc.advisor_id,
    pc.advisor_name,
    pc.advisor_region,
    coalesce(sum(pc.commission_amount), 0)::numeric as total_generated,
    coalesce(sum(pc.paid_amount_cached), 0)::numeric as total_paid,
    coalesce(sum(pc.balance_cached), 0)::numeric as total_pending,
    count(distinct pc.project_id)::bigint as project_count,
    count(distinct pc.project_payment_id)::bigint as payment_count,
    count(*) filter (where pc.status = 'generated')::bigint as generated_count,
    count(*) filter (where pc.status = 'partially_paid')::bigint as partially_paid_count,
    count(*) filter (where pc.status = 'paid')::bigint as paid_count
  from public.project_commissions pc
  join public.projects pr on pr.id = pc.project_id
  left join public.project_payments pp on pp.id = pc.project_payment_id
  where (
      (
        v_status is not null
        and pc.status = v_status
      )
      or (
        v_status is null
        and pc.status in ('generated', 'partially_paid', 'paid')
      )
    )
    and (p_advisor_id is null or pc.advisor_id = p_advisor_id)
    and (
      p_from_date is null
      or coalesce(pp.payment_date, pc.created_at::date) >= p_from_date
    )
    and (
      p_to_date is null
      or coalesce(pp.payment_date, pc.created_at::date) <= p_to_date
    )
    and (
      v_profile.role = 'gerencia'
      or pr.region_code = v_profile.region_code
    )
    and (
      v_region is null
      or pr.region_code = v_region
    )
  group by
    pc.advisor_id,
    pc.advisor_name,
    pc.advisor_region
  order by
    coalesce(sum(pc.balance_cached), 0) desc,
    coalesce(sum(pc.commission_amount), 0) desc,
    pc.advisor_name asc;
end;
$$;

comment on function public.get_project_commissions_summary(date, date, uuid, text, text) is
  'DecoSun Financial Engine Phase 2A.2a: read-only advisor-level commission summary from project_commissions. This reporting RPC does not pay commissions, create treasury expenses, modify project_commissions, or update legacy project fields.';

revoke all on function public.get_project_commissions_summary(date, date, uuid, text, text) from public;
revoke all on function public.get_project_commissions_summary(date, date, uuid, text, text) from anon;
grant execute on function public.get_project_commissions_summary(date, date, uuid, text, text) to authenticated;

create or replace function public.get_project_commissions_detail(
  p_from_date date default null,
  p_to_date date default null,
  p_advisor_id uuid default null,
  p_status text default null,
  p_region text default null
)
returns table (
  project_commission_id uuid,
  project_id uuid,
  project_title text,
  customer_name text,
  project_payment_id uuid,
  payment_date date,
  payment_amount numeric,
  advisor_id uuid,
  advisor_name text,
  advisor_region text,
  commission_type text,
  commission_rate numeric,
  commission_amount numeric,
  paid_amount_cached numeric,
  balance_cached numeric,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile record;
  v_status text;
  v_region text;
begin
  -- Phase 2A.2a is reporting only. This RPC reads the commission ledger and
  -- project/payment context without creating payouts or treasury movements.

  if auth.uid() is null then
    raise exception 'get_project_commissions_detail requires an authenticated user';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  if coalesce(v_profile.role, '') not in ('gerencia', 'administracion_regional') then
    raise exception 'User is not allowed to read commission reports'
      using errcode = '42501';
  end if;

  if v_profile.role = 'administracion_regional'
    and nullif(trim(v_profile.region_code), '') is null then
    raise exception 'Regional administration user does not have a region_code'
      using errcode = '42501';
  end if;

  v_status := nullif(trim(p_status), '');
  v_region := nullif(trim(p_region), '');

  if v_status is not null
    and v_status not in ('generated', 'partially_paid', 'paid', 'voided', 'reversed') then
    raise exception 'Unsupported commission status %', v_status;
  end if;

  if p_from_date is not null and p_to_date is not null and p_from_date > p_to_date then
    raise exception 'from date cannot be after to date';
  end if;

  if v_profile.role = 'administracion_regional'
    and v_region is not null
    and v_region <> v_profile.region_code then
    raise exception 'Regional administration user cannot read another region'
      using errcode = '42501';
  end if;

  return query
  select
    pc.id as project_commission_id,
    pc.project_id,
    pr.title as project_title,
    pr.contact_name as customer_name,
    pc.project_payment_id,
    pp.payment_date,
    pc.commission_base_amount as payment_amount,
    pc.advisor_id,
    pc.advisor_name,
    pc.advisor_region,
    pc.commission_type,
    pc.commission_rate,
    pc.commission_amount,
    pc.paid_amount_cached,
    pc.balance_cached,
    pc.status,
    pc.created_at
  from public.project_commissions pc
  join public.projects pr on pr.id = pc.project_id
  left join public.project_payments pp on pp.id = pc.project_payment_id
  where (
      (
        v_status is not null
        and pc.status = v_status
      )
      or (
        v_status is null
        and pc.status in ('generated', 'partially_paid', 'paid')
      )
    )
    and (p_advisor_id is null or pc.advisor_id = p_advisor_id)
    and (
      p_from_date is null
      or coalesce(pp.payment_date, pc.created_at::date) >= p_from_date
    )
    and (
      p_to_date is null
      or coalesce(pp.payment_date, pc.created_at::date) <= p_to_date
    )
    and (
      v_profile.role = 'gerencia'
      or pr.region_code = v_profile.region_code
    )
    and (
      v_region is null
      or pr.region_code = v_region
    )
  order by coalesce(pp.payment_date, pc.created_at::date) desc, pc.created_at desc;
end;
$$;

comment on function public.get_project_commissions_detail(date, date, uuid, text, text) is
  'DecoSun Financial Engine Phase 2A.2a: read-only detailed commission ledger from project_commissions with project and payment context. This reporting RPC does not pay commissions, create treasury expenses, modify project_commissions, or update legacy project fields.';

revoke all on function public.get_project_commissions_detail(date, date, uuid, text, text) from public;
revoke all on function public.get_project_commissions_detail(date, date, uuid, text, text) from anon;
grant execute on function public.get_project_commissions_detail(date, date, uuid, text, text) to authenticated;

-- Phase 2A.2a intentionally does not:
-- - grant direct table access to project_commissions
-- - create project_commission_payments
-- - create treasury_movements expenses
-- - mark commissions as paid
-- - insert, update, delete, void, or reverse project_commissions
-- - update projects.advisor_commission_amount
-- - update projects.advisor_commission_status
-- - update projects.commission_registered
-- - expose advisor self-service commission visibility
