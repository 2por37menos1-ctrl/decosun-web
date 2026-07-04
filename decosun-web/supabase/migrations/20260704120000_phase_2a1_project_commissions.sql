-- DecoSun Financial Engine - Phase 2A.1
-- Passive commission ledger foundation.
--
-- This migration creates generated commission records from confirmed
-- project_payments only. It does not pay commissions, does not create
-- treasury_movements expenses, does not modify legacy project commission
-- fields, and does not connect automatically to register_project_payment yet.
--
-- Business rule: commission is born only when customer money enters.

create table if not exists public.project_commissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  project_payment_id uuid references public.project_payments(id) on delete restrict,
  advisor_id uuid,
  advisor_name text not null,
  advisor_email text,
  advisor_region text,
  commission_type text not null,
  commission_rate numeric(7, 4),
  commission_base_amount numeric(14, 2) not null,
  commission_amount numeric(14, 2) not null check (commission_amount > 0),
  paid_amount_cached numeric(14, 2) not null default 0 check (paid_amount_cached >= 0),
  balance_cached numeric(14, 2) not null check (balance_cached >= 0),
  status text not null default 'generated',
  source text not null default 'project_payment',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint project_commissions_status_check check (
    status in (
      'generated',
      'partially_paid',
      'paid',
      'voided',
      'reversed'
    )
  ),
  constraint project_commissions_type_check check (
    commission_type in (
      'base',
      'especial'
    )
  ),
  constraint project_commissions_paid_not_over_amount_check check (
    paid_amount_cached <= commission_amount
  ),
  constraint project_commissions_balance_matches_amount_check check (
    balance_cached = commission_amount - paid_amount_cached
  )
);

comment on table public.project_commissions is
  'DecoSun Financial Engine Phase 2A.1: passive ledger of commissions generated from confirmed customer payment events. This table does not represent commission payout.';

comment on column public.project_commissions.project_id is
  'Project that generated the commission. Kept for direct reporting and traceability.';

comment on column public.project_commissions.project_payment_id is
  'Confirmed project_payments event that generated this commission. Phase 2A.1 generates at most one active commission per payment.';

comment on column public.project_commissions.advisor_id is
  'Legacy advisor id copied from projects at generation time, when available.';

comment on column public.project_commissions.advisor_name is
  'Advisor name copied from projects at generation time for historical traceability.';

comment on column public.project_commissions.commission_type is
  'Legacy commission type copied from projects. Phase 2A.1 supports base and especial. sin_comision creates no payable commission.';

comment on column public.project_commissions.commission_rate is
  'Legacy advisor_commission_rate copied from projects for base commissions.';

comment on column public.project_commissions.commission_base_amount is
  'Received customer payment amount used as the proportional base for generated commission.';

comment on column public.project_commissions.commission_amount is
  'Generated commission amount. This is not a paid commission and must not create a treasury expense in Phase 2A.1.';

comment on column public.project_commissions.paid_amount_cached is
  'Future payout cache. Phase 2A.1 keeps this at zero because generated and paid commissions are separate events.';

comment on column public.project_commissions.balance_cached is
  'Future pending commission balance. In Phase 2A.1 this equals commission_amount.';

comment on column public.project_commissions.status is
  'Traceable lifecycle status. Financial history must be voided, reversed, or paid later instead of deleted.';

comment on column public.project_commissions.source is
  'Origin of the generated commission, for example project_payment or historical_migration.';

comment on column public.project_commissions.metadata is
  'Snapshot of legacy commission inputs and payment context used to generate this commission.';

create index if not exists idx_project_commissions_project_id
  on public.project_commissions(project_id);

create index if not exists idx_project_commissions_project_payment_id
  on public.project_commissions(project_payment_id);

create index if not exists idx_project_commissions_advisor_id
  on public.project_commissions(advisor_id);

create index if not exists idx_project_commissions_status
  on public.project_commissions(status);

create index if not exists idx_project_commissions_source
  on public.project_commissions(source);

create index if not exists idx_project_commissions_created_at
  on public.project_commissions(created_at);

create index if not exists idx_project_commissions_project_status
  on public.project_commissions(project_id, status);

create unique index if not exists idx_project_commissions_active_payment_unique
  on public.project_commissions(project_payment_id)
  where project_payment_id is not null
    and status in ('generated', 'partially_paid', 'paid');

-- Phase 2A.1 keeps direct table access closed for client roles. Writes should
-- go through audited RPCs that enforce business rules and permissions.
revoke all on table public.project_commissions from anon;
revoke all on table public.project_commissions from authenticated;

create or replace function public.generate_project_commission_from_payment(
  p_project_payment_id uuid
)
returns table (
  project_commission_id uuid,
  project_payment_id uuid,
  project_id uuid,
  commission_amount numeric,
  status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_project_payment record;
  v_project record;
  v_profile record;
  v_existing_commission record;
  v_commission_type text;
  v_commission_rate numeric(7, 4);
  v_commission_amount numeric(14, 2);
  v_advisor_name text;
begin
  -- Phase 2A.1 is intentionally passive. This RPC creates only a generated
  -- commission ledger record. It never creates treasury_movements expenses,
  -- never marks commissions as paid, and never updates legacy project fields.

  if auth.uid() is null then
    raise exception 'generate_project_commission_from_payment requires an authenticated user';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  if not (
    v_profile.role = 'gerencia'
    or (
      v_profile.role = 'administracion_regional'
      and v_profile.region_code = 'quinta_region'
    )
  ) then
    raise exception 'User is not allowed to generate project commissions'
      using errcode = '42501';
  end if;

  if p_project_payment_id is null then
    raise exception 'Project payment id is required';
  end if;

  -- 1. Lock the payment event. A commission can only be born from confirmed
  -- customer money already recorded in project_payments.
  select *
    into v_project_payment
  from public.project_payments
  where id = p_project_payment_id
  for update;

  if not found then
    raise exception 'Project payment % was not found', p_project_payment_id;
  end if;

  if v_project_payment.status <> 'confirmed' then
    raise exception 'Project payment % is %, but commission can only be generated from confirmed payments',
      p_project_payment_id,
      v_project_payment.status;
  end if;

  -- 2. Idempotency: return the existing active commission for this payment
  -- instead of creating a duplicate.
  select *
    into v_existing_commission
  from public.project_commissions pc
  where pc.project_payment_id = p_project_payment_id
    and pc.status in ('generated', 'partially_paid', 'paid')
  order by pc.created_at asc
  limit 1;

  if found then
    project_commission_id := v_existing_commission.id;
    project_payment_id := v_existing_commission.project_payment_id;
    project_id := v_existing_commission.project_id;
    commission_amount := v_existing_commission.commission_amount;
    status := v_existing_commission.status;

    return next;
    return;
  end if;

  -- 3. Lock the project so the legacy commission configuration is read as
  -- one consistent snapshot during generation.
  select *
    into v_project
  from public.projects
  where id = v_project_payment.project_id
  for update;

  if not found then
    raise exception 'Project % was not found for payment %',
      v_project_payment.project_id,
      p_project_payment_id;
  end if;

  v_commission_type := coalesce(
    nullif(trim(v_project.advisor_commission_type), ''),
    'base'
  );

  if v_commission_type = 'sin_comision' then
    -- sin_comision intentionally creates no payable commission row.
    project_commission_id := null;
    project_payment_id := v_project_payment.id;
    project_id := v_project.id;
    commission_amount := 0;
    status := 'voided';

    return next;
    return;
  end if;

  v_advisor_name := nullif(trim(v_project.advisor_name), '');

  if v_advisor_name is null then
    raise exception 'Project % does not have an advisor name for commission generation',
      v_project.id;
  end if;

  if v_commission_type = 'base' then
    v_commission_rate := coalesce(v_project.advisor_commission_rate, 0);
    v_commission_amount := round(
      v_project_payment.amount * (v_commission_rate / 100),
      2
    );
  elsif v_commission_type = 'especial' then
    if coalesce(v_project.sale_value, 0) <= 0 then
      raise exception 'Project % requires sale_value greater than zero for proportional special commission',
        v_project.id;
    end if;

    v_commission_rate := null;
    v_commission_amount := round(
      coalesce(v_project.advisor_commission_amount, 0)
        * (v_project_payment.amount / v_project.sale_value),
      2
    );
  else
    raise exception 'Unsupported advisor_commission_type % for project %',
      v_commission_type,
      v_project.id;
  end if;

  if v_commission_amount <= 0 then
    -- A zero or negative result is not a payable generated commission. This
    -- preserves the rule that the table stores payable commission events only.
    project_commission_id := null;
    project_payment_id := v_project_payment.id;
    project_id := v_project.id;
    commission_amount := 0;
    status := 'voided';

    return next;
    return;
  end if;

  -- 4. Insert the generated commission ledger record only. Payout and treasury
  -- expense creation belong to a later phase.
  insert into public.project_commissions (
    project_id,
    project_payment_id,
    advisor_id,
    advisor_name,
    advisor_email,
    advisor_region,
    commission_type,
    commission_rate,
    commission_base_amount,
    commission_amount,
    paid_amount_cached,
    balance_cached,
    status,
    source,
    created_by,
    metadata
  )
  values (
    v_project.id,
    v_project_payment.id,
    v_project.advisor_id,
    v_advisor_name,
    v_project.advisor_email,
    v_project.advisor_region,
    v_commission_type,
    v_commission_rate,
    v_project_payment.amount,
    v_commission_amount,
    0,
    v_commission_amount,
    'generated',
    'project_payment',
    auth.uid(),
    jsonb_build_object(
      'phase', '2A.1',
      'payment_amount', v_project_payment.amount,
      'payment_status', v_project_payment.status,
      'payment_date', v_project_payment.payment_date,
      'legacy_sale_value', v_project.sale_value,
      'legacy_advisor_commission_type', v_project.advisor_commission_type,
      'legacy_advisor_commission_rate', v_project.advisor_commission_rate,
      'legacy_advisor_commission_amount', v_project.advisor_commission_amount,
      'legacy_commission_fields_preserved', true
    )
  )
  returning id into project_commission_id;

  project_payment_id := v_project_payment.id;
  project_id := v_project.id;
  commission_amount := v_commission_amount;
  status := 'generated';

  return next;
end;
$$;

comment on function public.generate_project_commission_from_payment(uuid) is
  'DecoSun Financial Engine Phase 2A.1: idempotently creates a passive generated commission from one confirmed project_payments event. It does not pay commissions, create treasury expenses, modify legacy project commission fields, or connect automatically to register_project_payment.';

revoke all on function public.generate_project_commission_from_payment(uuid) from public;
revoke all on function public.generate_project_commission_from_payment(uuid) from anon;
grant execute on function public.generate_project_commission_from_payment(uuid) to authenticated;

-- Phase 2A.1 intentionally does not:
-- - create project_commission_payments
-- - create treasury_movements expenses
-- - mark commissions as paid
-- - update projects.advisor_commission_amount
-- - update projects.advisor_commission_status
-- - update projects.commission_registered
-- - connect automatically to register_project_payment
-- - backfill historical payments
-- - delete or rewrite legacy commission data
-- - apply Supabase RLS read policies, which must be audited before production use
