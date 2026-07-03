-- DecoSun Financial Engine - Phase 1B
-- Foundation for register_project_payment RPC.
-- This migration does not activate the new UI payment flow.
-- ProjectModal.jsx, Dashboard.jsx, Treasury.jsx, and current behavior remain unchanged.
-- The objective is managerial cash-flow traceability, not accounting software.

alter table public.project_payments
  add column if not exists idempotency_key text,
  add column if not exists payment_method text;

comment on column public.project_payments.idempotency_key is
  'DecoSun Financial Engine Phase 1B: prevents duplicate customer payment events when the same registration request is retried.';

comment on column public.project_payments.payment_method is
  'How the customer paid, for example bank_transfer, cash, card, mercado_pago, or other.';

create unique index if not exists idx_project_payments_project_id_idempotency_key
  on public.project_payments(project_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.register_project_payment(
  p_project_id uuid,
  p_amount numeric,
  p_payment_date date default current_date,
  p_company_name text default null,
  p_bank text default null,
  p_payment_method text default null,
  p_payment_milestone text default 'manual',
  p_source text default 'register_project_payment_rpc',
  p_notes text default null,
  p_idempotency_key text default null
)
returns table (
  project_payment_id uuid,
  treasury_movement_id uuid,
  amount_paid_cached numeric,
  balance_cached numeric,
  finance_status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_project record;
  v_profile record;
  v_project_payment_id uuid;
  v_treasury_movement_id uuid;
  v_company_name text;
  v_bank text;
  v_branch text;
  v_subcategory text;
  v_idempotency_key text;
  v_amount_paid_cached numeric(14, 2);
  v_balance_cached numeric(14, 2);
  v_finance_status text;
begin
  -- Phase 1B relies on PostgreSQL transaction behavior. If any step fails,
  -- the payment event, treasury movement, and project cache updates roll back.
  -- Financial history is never deleted or overwritten by this RPC.

  if auth.uid() is null then
    raise exception 'register_project_payment requires an authenticated user';
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
    raise exception 'User is not allowed to register project payments'
      using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  v_idempotency_key := nullif(trim(p_idempotency_key), '');

  -- 1. Lock the project row FOR UPDATE.
  select *
    into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project % was not found', p_project_id;
  end if;

  if v_idempotency_key is not null then
    select
      pp.id,
      pp.treasury_movement_id,
      pr.amount_paid_cached,
      pr.balance_cached,
      pr.finance_status
      into
        project_payment_id,
        treasury_movement_id,
        amount_paid_cached,
        balance_cached,
        finance_status
    from public.project_payments pp
    join public.projects pr on pr.id = pp.project_id
    where pp.project_id = p_project_id
      and pp.idempotency_key = v_idempotency_key;

    if found then
      return next;
      return;
    end if;
  end if;

  v_company_name := coalesce(
    nullif(trim(p_company_name), ''),
    nullif(trim(v_project.company_name), ''),
    case
      when v_project.region_code = 'iquique' then 'Decosun Spa'
      else 'Decosun Group SpA'
    end
  );

  v_bank := coalesce(
    nullif(trim(p_bank), ''),
    nullif(trim(v_project.payment_bank), '')
  );

  if v_bank is null then
    raise exception 'Bank is required to register project payment';
  end if;

  v_branch := case
    when v_project.region_code = 'iquique' then 'Iquique'
    else 'Vina del Mar'
  end;

  v_subcategory := case p_payment_milestone
    when 'initial_50' then 'Abono inicial 50%'
    when 'final_50' then 'Pago final 50%'
    when 'partial' then 'Abono parcial'
    when 'full' then 'Pago total'
    when 'historical_migration' then 'Migracion historica'
    when 'adjustment' then 'Ajuste financiero'
    else 'Pago cliente'
  end;

  -- 2. Create the project_payments record first. Payment event is the source
  -- of truth for received customer money.
  insert into public.project_payments (
    project_id,
    payment_date,
    amount,
    company_name,
    bank,
    payment_method,
    payment_milestone,
    status,
    source,
    notes,
    created_by,
    idempotency_key,
    metadata
  )
  values (
    p_project_id,
    coalesce(p_payment_date, current_date),
    p_amount,
    v_company_name,
    v_bank,
    nullif(trim(p_payment_method), ''),
    coalesce(nullif(trim(p_payment_milestone), ''), 'manual'),
    'confirmed',
    coalesce(nullif(trim(p_source), ''), 'register_project_payment_rpc'),
    p_notes,
    auth.uid(),
    v_idempotency_key,
    jsonb_build_object(
      'phase', '1B',
      'legacy_amount_paid_current', v_project.amount_paid
    )
  )
  returning id into v_project_payment_id;

  -- 3. Create the related treasury_movements record second. Treasury keeps
  -- using the current application values ingreso/egreso.
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
    coalesce(p_payment_date, current_date),
    v_company_name,
    v_bank,
    'Pago cliente: ' || coalesce(v_project.title, 'Proyecto'),
    'ingreso',
    p_amount,
    'Ingreso cliente',
    v_subcategory,
    v_branch,
    coalesce(v_project.contact_name, v_project.title, ''),
    p_notes,
    'project_payment',
    p_project_id,
    'pendiente'
  )
  returning id into v_treasury_movement_id;

  -- 4. Link the payment event to its treasury movement.
  update public.project_payments
  set
    treasury_movement_id = v_treasury_movement_id,
    updated_at = now()
  where id = v_project_payment_id;

  -- 5. Recalculate project financial caches from confirmed payment events.
  select coalesce(sum(amount), 0)
    into v_amount_paid_cached
  from public.project_payments
  where project_id = p_project_id
    and status = 'confirmed';

  v_balance_cached := coalesce(v_project.sale_value, 0) - v_amount_paid_cached;

  v_finance_status := case
    when v_amount_paid_cached > coalesce(v_project.sale_value, 0) then 'overpaid'
    when v_amount_paid_cached = coalesce(v_project.sale_value, 0)
      and coalesce(v_project.sale_value, 0) > 0 then 'paid'
    when v_amount_paid_cached > 0 then 'partial'
    else 'pending'
  end;

  -- 6. Keep amount_paid unchanged in Phase 1B. It remains legacy until the
  -- Dashboard amount_paid delta logic is removed in a later phase.
  update public.projects
  set
    amount_paid_legacy = coalesce(amount_paid_legacy, amount_paid),
    amount_paid_cached = v_amount_paid_cached,
    balance_cached = v_balance_cached,
    finance_status = v_finance_status
  where id = p_project_id;

  project_payment_id := v_project_payment_id;
  treasury_movement_id := v_treasury_movement_id;
  amount_paid_cached := v_amount_paid_cached;
  balance_cached := v_balance_cached;
  finance_status := v_finance_status;

  return next;
end;
$$;

comment on function public.register_project_payment(
  uuid,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) is
  'DecoSun Financial Engine Phase 1B: transactional foundation for registering a real customer payment, creating the related treasury movement, and updating financial caches. This does not activate the new UI payment flow.';

revoke all on function public.register_project_payment(
  uuid,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

revoke all on function public.register_project_payment(
  uuid,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from anon;

grant execute on function public.register_project_payment(
  uuid,
  numeric,
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

-- Phase 1B intentionally does not:
-- - connect ProjectModal.jsx to register_project_payment
-- - remove Dashboard.jsx amount_paid delta logic
-- - migrate historical amount_paid values
-- - generate commissions
-- - delete, overwrite, or backfill historical financial events
-- - apply the migration to Supabase
