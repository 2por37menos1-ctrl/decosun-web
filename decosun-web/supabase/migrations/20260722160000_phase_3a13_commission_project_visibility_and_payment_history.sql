-- DecoSun ERP - Phase 3A.13
-- Commission visibility by project scope + commission payment history read APIs.
--
-- This migration adds read-only RPCs. It does not modify commission amounts,
-- does not create payouts, does not create treasury movements, and does not
-- change pay_project_commission behavior.
--
-- Purpose:
-- 1) Allow secure read-only commission visibility per project for:
--    - gerencia (all projects)
--    - Edgar Iquique (north projects, commissions related to Edgar only)
-- 2) Expose commission payment history for Treasury > Commissions reporting.

create or replace function public.get_project_commissions_for_project(
  p_project_id uuid
)
returns table (
  project_commission_id uuid,
  project_id uuid,
  project_title text,
  project_region text,
  customer_name text,
  advisor_id uuid,
  advisor_name text,
  advisor_region text,
  commission_type text,
  commission_rate numeric,
  commission_amount numeric,
  paid_amount_cached numeric,
  balance_cached numeric,
  status text,
  generated_at timestamptz,
  project_payment_id uuid,
  payment_date date,
  payment_amount numeric,
  payment_company_name text,
  payment_bank text,
  last_payment_date date,
  last_payment_amount numeric,
  last_payment_company_name text,
  last_payment_bank text,
  last_payment_reference text,
  last_payment_status text,
  last_payment_treasury_movement_id uuid
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile record;
  v_project record;
  v_is_edgar_iquique boolean;
  v_is_north_project boolean;
  v_is_edgar_scope boolean;
begin
  if auth.uid() is null then
    raise exception 'get_project_commissions_for_project requires an authenticated user';
  end if;

  if p_project_id is null then
    raise exception 'Project id is required';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'Project % was not found', p_project_id;
  end if;

  v_is_edgar_iquique := (
    v_profile.role = 'jefatura_region'
    and v_profile.region_code = 'iquique'
    and trim(coalesce(v_profile.full_name, '')) in ('Edgar', 'Edgar Leighton')
  );

  v_is_north_project := coalesce(v_project.region_code, '') in (
    'iquique',
    'norte',
    'arica',
    'tarapaca',
    'calama',
    'antofagasta'
  );

  v_is_edgar_scope := v_is_edgar_iquique and v_is_north_project;

  if not (
    v_profile.role = 'gerencia'
    or v_is_edgar_scope
  ) then
    raise exception 'User is not allowed to read project commissions for this project'
      using errcode = '42501';
  end if;

  return query
  select
    pc.id as project_commission_id,
    pc.project_id,
    pr.title as project_title,
    pr.region_code as project_region,
    pr.contact_name as customer_name,
    pc.advisor_id,
    pc.advisor_name,
    pc.advisor_region,
    pc.commission_type,
    pc.commission_rate,
    pc.commission_amount,
    pc.paid_amount_cached,
    pc.balance_cached,
    pc.status,
    pc.created_at as generated_at,
    pc.project_payment_id,
    pp.payment_date,
    pc.commission_base_amount as payment_amount,
    pp.company_name as payment_company_name,
    pp.bank as payment_bank,
    pcp_last.payment_date as last_payment_date,
    pcp_last.amount as last_payment_amount,
    pcp_last.company_name as last_payment_company_name,
    pcp_last.bank as last_payment_bank,
    pcp_last.notes as last_payment_reference,
    pcp_last.status as last_payment_status,
    pcp_last.treasury_movement_id as last_payment_treasury_movement_id
  from public.project_commissions pc
  join public.projects pr on pr.id = pc.project_id
  left join public.project_payments pp on pp.id = pc.project_payment_id
  left join lateral (
    select
      pcp.payment_date,
      pcp.amount,
      pcp.company_name,
      pcp.bank,
      pcp.notes,
      pcp.status,
      pcp.treasury_movement_id
    from public.project_commission_payments pcp
    where pcp.project_commission_id = pc.id
    order by pcp.payment_date desc, pcp.created_at desc
    limit 1
  ) pcp_last on true
  where pc.project_id = p_project_id
    and (
      not v_is_edgar_scope
      or (
        (v_profile.advisor_id is not null and pc.advisor_id = v_profile.advisor_id)
        or (
          v_profile.advisor_id is null
          and pc.advisor_id is null
          and trim(coalesce(pc.advisor_name, '')) in ('Edgar', 'Edgar Leighton')
        )
      )
    )
  order by coalesce(pp.payment_date, pc.created_at::date) desc, pc.created_at desc;
end;
$$;

comment on function public.get_project_commissions_for_project(uuid) is
  'DecoSun Phase 3A.13: read-only project-scoped commission detail for gerencia and Edgar Iquique north scope. Returns generated commission data with payment-origin and last payout snapshot.';

revoke all on function public.get_project_commissions_for_project(uuid) from public;
revoke all on function public.get_project_commissions_for_project(uuid) from anon;
grant execute on function public.get_project_commissions_for_project(uuid) to authenticated;

create or replace function public.get_project_commission_payments_for_project(
  p_project_id uuid
)
returns table (
  project_commission_payment_id uuid,
  project_commission_id uuid,
  project_id uuid,
  project_title text,
  project_region text,
  advisor_id uuid,
  advisor_name text,
  commission_type text,
  commission_status text,
  project_payment_id uuid,
  origin_payment_date date,
  origin_payment_amount numeric,
  origin_payment_company_name text,
  origin_payment_bank text,
  payout_date date,
  payout_amount numeric,
  payout_company_name text,
  payout_bank text,
  payout_method text,
  payout_reference text,
  payout_status text,
  treasury_movement_id uuid,
  paid_by uuid,
  paid_by_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile record;
  v_project record;
  v_is_edgar_iquique boolean;
  v_is_north_project boolean;
  v_is_edgar_scope boolean;
begin
  if auth.uid() is null then
    raise exception 'get_project_commission_payments_for_project requires an authenticated user';
  end if;

  if p_project_id is null then
    raise exception 'Project id is required';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  select *
    into v_project
  from public.projects
  where id = p_project_id;

  if not found then
    raise exception 'Project % was not found', p_project_id;
  end if;

  v_is_edgar_iquique := (
    v_profile.role = 'jefatura_region'
    and v_profile.region_code = 'iquique'
    and trim(coalesce(v_profile.full_name, '')) in ('Edgar', 'Edgar Leighton')
  );

  v_is_north_project := coalesce(v_project.region_code, '') in (
    'iquique',
    'norte',
    'arica',
    'tarapaca',
    'calama',
    'antofagasta'
  );

  v_is_edgar_scope := v_is_edgar_iquique and v_is_north_project;

  if not (
    v_profile.role = 'gerencia'
    or v_is_edgar_scope
  ) then
    raise exception 'User is not allowed to read project commission payments for this project'
      using errcode = '42501';
  end if;

  return query
  select
    pcp.id as project_commission_payment_id,
    pcp.project_commission_id,
    pc.project_id,
    pr.title as project_title,
    pr.region_code as project_region,
    pc.advisor_id,
    pc.advisor_name,
    pc.commission_type,
    pc.status as commission_status,
    pc.project_payment_id,
    pp.payment_date as origin_payment_date,
    pc.commission_base_amount as origin_payment_amount,
    pp.company_name as origin_payment_company_name,
    pp.bank as origin_payment_bank,
    pcp.payment_date as payout_date,
    pcp.amount as payout_amount,
    pcp.company_name as payout_company_name,
    pcp.bank as payout_bank,
    pcp.payment_method as payout_method,
    pcp.notes as payout_reference,
    pcp.status as payout_status,
    pcp.treasury_movement_id,
    pcp.paid_by,
    payer.full_name as paid_by_name,
    pcp.created_at
  from public.project_commission_payments pcp
  join public.project_commissions pc on pc.id = pcp.project_commission_id
  join public.projects pr on pr.id = pc.project_id
  left join public.project_payments pp on pp.id = pc.project_payment_id
  left join public.profiles payer on payer.id = pcp.paid_by
  where pc.project_id = p_project_id
    and (
      not v_is_edgar_scope
      or (
        (v_profile.advisor_id is not null and pc.advisor_id = v_profile.advisor_id)
        or (
          v_profile.advisor_id is null
          and pc.advisor_id is null
          and trim(coalesce(pc.advisor_name, '')) in ('Edgar', 'Edgar Leighton')
        )
      )
    )
  order by pcp.payment_date desc, pcp.created_at desc;
end;
$$;

comment on function public.get_project_commission_payments_for_project(uuid) is
  'DecoSun Phase 3A.13: read-only project-scoped commission payment history for gerencia and Edgar Iquique north scope, preserving payout and treasury traceability.';

revoke all on function public.get_project_commission_payments_for_project(uuid) from public;
revoke all on function public.get_project_commission_payments_for_project(uuid) from anon;
grant execute on function public.get_project_commission_payments_for_project(uuid) to authenticated;

create or replace function public.get_project_commission_payments_report(
  p_from_date date default null,
  p_to_date date default null,
  p_advisor_id uuid default null,
  p_status text default null,
  p_region text default null,
  p_project_search text default null,
  p_company_name text default null
)
returns table (
  project_commission_payment_id uuid,
  project_commission_id uuid,
  project_id uuid,
  project_title text,
  project_region text,
  customer_name text,
  advisor_id uuid,
  advisor_name text,
  commission_type text,
  project_payment_id uuid,
  origin_payment_date date,
  origin_payment_amount numeric,
  origin_payment_company_name text,
  origin_payment_bank text,
  payout_date date,
  payout_amount numeric,
  payout_company_name text,
  payout_bank text,
  payout_method text,
  payout_reference text,
  payout_status text,
  treasury_movement_id uuid,
  paid_by uuid,
  paid_by_name text,
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
  v_project_search text;
  v_company_name text;
begin
  if auth.uid() is null then
    raise exception 'get_project_commission_payments_report requires an authenticated user';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  if coalesce(v_profile.role, '') <> 'gerencia' then
    raise exception 'User is not allowed to read commission payment reports'
      using errcode = '42501';
  end if;

  if p_from_date is not null and p_to_date is not null and p_from_date > p_to_date then
    raise exception 'from date cannot be after to date';
  end if;

  v_status := nullif(trim(p_status), '');
  v_region := nullif(trim(p_region), '');
  v_project_search := nullif(trim(p_project_search), '');
  v_company_name := nullif(trim(p_company_name), '');

  if v_status is not null
    and v_status not in ('confirmed', 'voided', 'reversed') then
    raise exception 'Unsupported commission payment status %', v_status;
  end if;

  return query
  select
    pcp.id as project_commission_payment_id,
    pcp.project_commission_id,
    pc.project_id,
    pr.title as project_title,
    pr.region_code as project_region,
    pr.contact_name as customer_name,
    pc.advisor_id,
    pc.advisor_name,
    pc.commission_type,
    pc.project_payment_id,
    pp.payment_date as origin_payment_date,
    pc.commission_base_amount as origin_payment_amount,
    pp.company_name as origin_payment_company_name,
    pp.bank as origin_payment_bank,
    pcp.payment_date as payout_date,
    pcp.amount as payout_amount,
    pcp.company_name as payout_company_name,
    pcp.bank as payout_bank,
    pcp.payment_method as payout_method,
    pcp.notes as payout_reference,
    pcp.status as payout_status,
    pcp.treasury_movement_id,
    pcp.paid_by,
    payer.full_name as paid_by_name,
    pcp.created_at
  from public.project_commission_payments pcp
  join public.project_commissions pc on pc.id = pcp.project_commission_id
  join public.projects pr on pr.id = pc.project_id
  left join public.project_payments pp on pp.id = pc.project_payment_id
  left join public.profiles payer on payer.id = pcp.paid_by
  where (p_from_date is null or pcp.payment_date >= p_from_date)
    and (p_to_date is null or pcp.payment_date <= p_to_date)
    and (p_advisor_id is null or pc.advisor_id = p_advisor_id)
    and (v_status is null or pcp.status = v_status)
    and (v_region is null or pr.region_code = v_region)
    and (v_company_name is null or pcp.company_name = v_company_name)
    and (
      v_project_search is null
      or coalesce(pr.title, '') ilike '%' || v_project_search || '%'
      or coalesce(pr.contact_name, '') ilike '%' || v_project_search || '%'
      or coalesce(pr.quote_number, '') ilike '%' || v_project_search || '%'
      or pr.id::text = v_project_search
    )
  order by pcp.payment_date desc, pcp.created_at desc;
end;
$$;

comment on function public.get_project_commission_payments_report(date, date, uuid, text, text, text, text) is
  'DecoSun Phase 3A.13: gerencia-only read-only report of commission payout events with project, advisor, origin payment, and treasury linkage for Finance > Commissions.';

revoke all on function public.get_project_commission_payments_report(date, date, uuid, text, text, text, text) from public;
revoke all on function public.get_project_commission_payments_report(date, date, uuid, text, text, text, text) from anon;
grant execute on function public.get_project_commission_payments_report(date, date, uuid, text, text, text, text) to authenticated;
