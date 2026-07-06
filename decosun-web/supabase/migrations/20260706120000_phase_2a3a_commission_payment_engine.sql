-- DecoSun Financial Engine - Phase 2A.3a
-- Controlled commission payment engine backend.
--
-- This migration creates the audited payment event that turns a generated
-- project_commissions balance into a real treasury_movements expense. It does
-- not modify original commission_amount, project_payments, customer payments,
-- legacy project commission fields, ProjectModal.jsx, Dashboard.jsx, or any UI.
--
-- Business rule: generated commission and paid commission are different
-- financial events. A commission payout is born only when gerencia confirms
-- that money leaves the company.

create table if not exists public.project_commission_payments (
  id uuid primary key default gen_random_uuid(),
  project_commission_id uuid not null references public.project_commissions(id) on delete restrict,
  treasury_movement_id uuid references public.treasury_movements(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  payment_date date not null,
  company_name text not null,
  bank text not null,
  payment_method text,
  status text not null default 'confirmed',
  paid_by uuid references auth.users(id) on delete set null,
  notes text,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint project_commission_payments_status_check check (
    status in (
      'confirmed',
      'voided',
      'reversed'
    )
  ),
  constraint project_commission_payments_idempotency_key_not_blank_check check (
    length(trim(idempotency_key)) > 0
  )
);

-- Compatibility with the legacy project_commission_payments table.
-- Some production databases already have this table with historical columns:
-- id, project_id, amount, percent, payment_date, payment_source, notes,
-- created_by, and created_at. Do not drop, rename, or rewrite those columns.
-- Phase 2A.3a adds nullable columns required by the new payout engine and the
-- RPC inserts all required values for new rows.
alter table public.project_commission_payments
  add column if not exists project_commission_id uuid references public.project_commissions(id) on delete restrict,
  add column if not exists treasury_movement_id uuid references public.treasury_movements(id) on delete restrict,
  add column if not exists company_name text,
  add column if not exists bank text,
  add column if not exists payment_method text,
  add column if not exists status text default 'confirmed',
  add column if not exists paid_by uuid references auth.users(id) on delete set null,
  add column if not exists idempotency_key text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists metadata jsonb default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_commission_payments_amount_positive_check'
      and conrelid = 'public.project_commission_payments'::regclass
  ) then
    alter table public.project_commission_payments
      add constraint project_commission_payments_amount_positive_check
      check (amount > 0) not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_commission_payments_status_valid_check'
      and conrelid = 'public.project_commission_payments'::regclass
  ) then
    alter table public.project_commission_payments
      add constraint project_commission_payments_status_valid_check
      check (
        status in (
          'confirmed',
          'voided',
          'reversed'
        )
      ) not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_commission_payments_phase_2a3a_idempotency_check'
      and conrelid = 'public.project_commission_payments'::regclass
  ) then
    alter table public.project_commission_payments
      add constraint project_commission_payments_phase_2a3a_idempotency_check
      check (
        project_commission_id is null
        or (
          idempotency_key is not null
          and length(trim(idempotency_key)) > 0
        )
      ) not valid;
  end if;
end;
$$;

comment on table public.project_commission_payments is
  'DecoSun Financial Engine Phase 2A.3a: audited commission payout events. Each confirmed row creates one treasury_movements egreso and updates project_commissions payout caches.';

comment on column public.project_commission_payments.project_commission_id is
  'Generated commission being paid. The original commission_amount remains immutable.';

comment on column public.project_commission_payments.treasury_movement_id is
  'Treasury egreso created by the commission payout RPC. Kept nullable during the transaction and linked before returning.';

comment on column public.project_commission_payments.amount is
  'Amount paid against the generated commission balance. Must not exceed project_commissions.balance_cached at payment time.';

comment on column public.project_commission_payments.payment_date is
  'Date money leaves the company for the commission payout.';

comment on column public.project_commission_payments.status is
  'Payout lifecycle status. Phase 2A.3a creates confirmed payments only; void/reverse belongs to later phases.';

comment on column public.project_commission_payments.paid_by is
  'Authenticated gerencia user who confirmed the commission payout.';

comment on column public.project_commission_payments.idempotency_key is
  'Required key that prevents duplicate commission payouts and duplicate treasury expenses on retry or double click.';

comment on column public.project_commission_payments.metadata is
  'Snapshot of commission, project, advisor, and balance context at payout time.';

create index if not exists idx_project_commission_payments_project_commission_id
  on public.project_commission_payments(project_commission_id);

create index if not exists idx_project_commission_payments_treasury_movement_id
  on public.project_commission_payments(treasury_movement_id);

create index if not exists idx_project_commission_payments_payment_date
  on public.project_commission_payments(payment_date);

create index if not exists idx_project_commission_payments_status
  on public.project_commission_payments(status);

create index if not exists idx_project_commission_payments_paid_by
  on public.project_commission_payments(paid_by);

create unique index if not exists idx_project_commission_payments_commission_idempotency_unique
  on public.project_commission_payments(project_commission_id, idempotency_key)
  where project_commission_id is not null
    and idempotency_key is not null;

create unique index if not exists idx_project_commission_payments_treasury_movement_unique
  on public.project_commission_payments(treasury_movement_id)
  where treasury_movement_id is not null;

-- Phase 2A.3a keeps direct table access closed for client roles. Payouts must
-- go through the audited pay_project_commission RPC.
revoke all on table public.project_commission_payments from anon;
revoke all on table public.project_commission_payments from authenticated;

create or replace function public.pay_project_commission(
  p_project_commission_id uuid,
  p_amount numeric,
  p_payment_date date default current_date,
  p_company_name text default null,
  p_bank text default null,
  p_payment_method text default null,
  p_notes text default null,
  p_idempotency_key text default null
)
returns table (
  project_commission_payment_id uuid,
  treasury_movement_id uuid,
  project_commission_id uuid,
  commission_amount numeric,
  paid_amount_cached numeric,
  balance_cached numeric,
  status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile record;
  v_commission record;
  v_project record;
  v_existing_payment record;
  v_project_commission_payment_id uuid;
  v_treasury_movement_id uuid;
  v_idempotency_key text;
  v_amount numeric(14, 2);
  v_company_name text;
  v_bank text;
  v_payment_method text;
  v_payment_date date;
  v_branch text;
  v_new_paid_amount numeric(14, 2);
  v_new_balance numeric(14, 2);
  v_new_status text;
begin
  -- Phase 2A.3a is the first controlled payout step. It creates one
  -- project_commission_payments event and one treasury_movements egreso, then
  -- updates payout caches on the generated commission. It never edits the
  -- original generated commission amount, project payments, customer payments,
  -- or legacy project commission fields.

  if auth.uid() is null then
    raise exception 'pay_project_commission requires an authenticated user';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception 'No profile found for authenticated user';
  end if;

  if coalesce(v_profile.role, '') <> 'gerencia' then
    raise exception 'Only gerencia can pay project commissions'
      using errcode = '42501';
  end if;

  if p_project_commission_id is null then
    raise exception 'Project commission id is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Commission payment amount must be greater than zero';
  end if;

  v_amount := round(p_amount, 2);
  v_payment_date := coalesce(p_payment_date, current_date);
  v_idempotency_key := nullif(trim(p_idempotency_key), '');
  v_company_name := nullif(trim(p_company_name), '');
  v_bank := nullif(trim(p_bank), '');
  v_payment_method := nullif(trim(p_payment_method), '');

  if v_idempotency_key is null then
    raise exception 'Idempotency key is required to pay project commission';
  end if;

  -- 1. Lock the generated commission row. The balance check and cache update
  -- must be serialized to prevent double payment.
  select *
    into v_commission
  from public.project_commissions
  where id = p_project_commission_id
  for update;

  if not found then
    raise exception 'Project commission % was not found', p_project_commission_id;
  end if;

  -- 2. Idempotency: returning the original payout prevents duplicate treasury
  -- expenses if the same request is retried or a user double clicks.
  select *
    into v_existing_payment
  from public.project_commission_payments pcp
  where pcp.project_commission_id = p_project_commission_id
    and pcp.idempotency_key = v_idempotency_key
  limit 1;

  if found then
    project_commission_payment_id := v_existing_payment.id;
    treasury_movement_id := v_existing_payment.treasury_movement_id;
    project_commission_id := v_commission.id;
    commission_amount := v_commission.commission_amount;
    paid_amount_cached := v_commission.paid_amount_cached;
    balance_cached := v_commission.balance_cached;
    status := v_commission.status;

    return next;
    return;
  end if;

  if v_commission.status not in ('generated', 'partially_paid') then
    raise exception 'Project commission % has status %, but only generated or partially_paid commissions can be paid',
      p_project_commission_id,
      v_commission.status;
  end if;

  if v_amount > v_commission.balance_cached then
    raise exception 'Commission payment amount % exceeds pending balance % for commission %',
      v_amount,
      v_commission.balance_cached,
      p_project_commission_id;
  end if;

  select *
    into v_project
  from public.projects
  where id = v_commission.project_id;

  if not found then
    raise exception 'Project % was not found for commission %',
      v_commission.project_id,
      p_project_commission_id;
  end if;

  v_company_name := coalesce(
    v_company_name,
    nullif(trim(v_project.company_name), ''),
    case
      when v_project.region_code = 'iquique' then 'Decosun Spa'
      else 'Decosun Group SpA'
    end
  );

  v_bank := coalesce(
    v_bank,
    nullif(trim(v_project.payment_bank), '')
  );

  if v_bank is null then
    raise exception 'Bank is required to pay project commission';
  end if;

  v_branch := case
    when v_project.region_code = 'iquique' then 'Iquique'
    else 'Vina del Mar'
  end;

  -- 3. Create the commission payment event first. This is the payout source
  -- event and stores the idempotency key before treasury is linked.
  insert into public.project_commission_payments (
    project_id,
    project_commission_id,
    amount,
    payment_date,
    company_name,
    bank,
    payment_method,
    status,
    paid_by,
    notes,
    idempotency_key,
    metadata
  )
  values (
    v_commission.project_id,
    v_commission.id,
    v_amount,
    v_payment_date,
    v_company_name,
    v_bank,
    v_payment_method,
    'confirmed',
    auth.uid(),
    p_notes,
    v_idempotency_key,
    jsonb_build_object(
      'phase', '2A.3a',
      'project_id', v_commission.project_id,
      'project_payment_id', v_commission.project_payment_id,
      'advisor_id', v_commission.advisor_id,
      'advisor_name', v_commission.advisor_name,
      'advisor_region', v_commission.advisor_region,
      'commission_type', v_commission.commission_type,
      'commission_amount', v_commission.commission_amount,
      'previous_paid_amount_cached', v_commission.paid_amount_cached,
      'previous_balance_cached', v_commission.balance_cached,
      'legacy_commission_fields_preserved', true
    )
  )
  returning id into v_project_commission_payment_id;

  -- 4. Create the treasury egreso second. Treasury remains the cash-flow log
  -- that explains where company money went.
  insert into public.treasury_movements (
    date,
    company_name,
    bank,
    description,
    type,
    amount,
    category,
    subcategory,
    branch,
    person_name,
    notes,
    source_module,
    project_id,
    reconciliation_status
  )
  values (
    v_payment_date,
    v_company_name,
    v_bank,
    'Pago comision asesor: ' || coalesce(v_commission.advisor_name, 'Asesor'),
    'egreso',
    v_amount,
    'Comisión',
    'Pago comision asesor',
    v_branch,
    coalesce(v_commission.advisor_name, ''),
    concat_ws(
      E'\n',
      p_notes,
      'project_commission_id: ' || v_commission.id::text,
      'project_commission_payment_id: ' || v_project_commission_payment_id::text,
      'advisor_name: ' || coalesce(v_commission.advisor_name, ''),
      'phase: 2A.3a'
    ),
    'project_commission_payment',
    v_commission.project_id,
    'pendiente'
  )
  returning id into v_treasury_movement_id;

  -- 5. Link the payout event to the treasury movement.
  update public.project_commission_payments
  set
    treasury_movement_id = v_treasury_movement_id,
    updated_at = now()
  where id = v_project_commission_payment_id;

  v_new_paid_amount := v_commission.paid_amount_cached + v_amount;
  v_new_balance := v_commission.commission_amount - v_new_paid_amount;
  v_new_status := case
    when v_new_balance = 0 then 'paid'
    else 'partially_paid'
  end;

  -- 6. Update payout caches only. The generated commission amount remains the
  -- immutable source amount for this commission.
  update public.project_commissions
  set
    paid_amount_cached = v_new_paid_amount,
    balance_cached = v_new_balance,
    status = v_new_status,
    updated_at = now()
  where id = v_commission.id;

  project_commission_payment_id := v_project_commission_payment_id;
  treasury_movement_id := v_treasury_movement_id;
  project_commission_id := v_commission.id;
  commission_amount := v_commission.commission_amount;
  paid_amount_cached := v_new_paid_amount;
  balance_cached := v_new_balance;
  status := v_new_status;

  return next;
end;
$$;

comment on function public.pay_project_commission(uuid, numeric, date, text, text, text, text, text) is
  'DecoSun Financial Engine Phase 2A.3a: controlled gerencia-only commission payout RPC. It creates a project_commission_payments event, creates one treasury_movements egreso, links both, and updates project_commissions payout caches without modifying commission_amount, project_payments, customer payments, or legacy project commission fields.';

revoke all on function public.pay_project_commission(uuid, numeric, date, text, text, text, text, text) from public;
revoke all on function public.pay_project_commission(uuid, numeric, date, text, text, text, text, text) from anon;
grant execute on function public.pay_project_commission(uuid, numeric, date, text, text, text, text, text) to authenticated;

-- Phase 2A.3a intentionally does not:
-- - modify project_commissions.commission_amount
-- - modify project_payments
-- - modify customer payment events
-- - update projects.advisor_commission_amount
-- - update projects.advisor_commission_status
-- - update projects.commission_registered
-- - modify ProjectModal.jsx
-- - modify Dashboard.jsx
-- - connect any UI
-- - implement commission payment void/reversal flows
