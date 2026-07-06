-- DecoSun Financial Engine - Phase 2B.6
-- Historical customer payment reconciliation from Treasury.
--
-- Purpose:
-- Convert confirmed historical customer income movements from treasury_movements
-- into traceable project_payments events, then rebuild project finance caches
-- from confirmed project_payments.
--
-- Safety rules:
-- - Does not use projects.amount_paid legacy to create payments.
-- - Does not modify treasury_movements.
-- - Does not delete data.
-- - Inserts historical project_payments only from treasury income rows with a
--   valid project_id.
-- - Idempotent: running this migration more than once must not duplicate
--   project_payments for the same treasury_movement.

create extension if not exists pgcrypto;

-- 1. Create historical project payment events from linked Treasury income.
insert into public.project_payments (
  project_id,
  treasury_movement_id,
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
select
  tm.project_id,
  tm.id as treasury_movement_id,
  coalesce(tm.date, current_date) as payment_date,
  tm.amount,
  coalesce(
    nullif(trim(tm.company_name), ''),
    nullif(trim(p.company_name), ''),
    case
      when p.region_code = 'iquique' then 'Decosun Spa'
      else 'Decosun Group SpA'
    end
  ) as company_name,
  coalesce(
    nullif(trim(tm.bank), ''),
    nullif(trim(p.payment_bank), ''),
    'No especificado'
  ) as bank,
  'historical_treasury' as payment_method,
  'historical_migration' as payment_milestone,
  'confirmed' as status,
  'historical_reconciliation_treasury' as source,
  concat(
    'Pago historico creado desde Tesoreria. Movimiento: ',
    tm.id::text
  ) as notes,
  null as created_by,
  concat('historical_treasury:', tm.id::text) as idempotency_key,
  jsonb_build_object(
    'phase', '2B.6',
    'source', 'historical_reconciliation_treasury',
    'origin_table', 'treasury_movements',
    'treasury_movement_id', tm.id,
    'migration_date', now(),
    'original_date', tm.date,
    'original_amount', tm.amount,
    'original_category', tm.category,
    'original_subcategory', tm.subcategory,
    'original_description', tm.description
  ) as metadata
from public.treasury_movements tm
join public.projects p on p.id = tm.project_id
where tm.project_id is not null
  and tm.type = 'ingreso'
  and coalesce(tm.amount, 0) > 0
  and not exists (
    select 1
    from public.project_payments pp
    where pp.treasury_movement_id = tm.id
  )
on conflict do nothing;

-- 2. Rebuild finance caches for every project from confirmed payment events.
with confirmed_payment_totals as (
  select
    pp.project_id,
    coalesce(sum(pp.amount), 0) as amount_paid_cached
  from public.project_payments pp
  where pp.status = 'confirmed'
  group by pp.project_id
),
project_finance as (
  select
    p.id as project_id,
    coalesce(cpt.amount_paid_cached, 0) as amount_paid_cached,
    coalesce(p.sale_value, 0) - coalesce(cpt.amount_paid_cached, 0) as balance_cached
  from public.projects p
  left join confirmed_payment_totals cpt on cpt.project_id = p.id
)
update public.projects p
set
  amount_paid_legacy = coalesce(p.amount_paid_legacy, p.amount_paid),
  amount_paid_cached = pf.amount_paid_cached,
  balance_cached = pf.balance_cached,
  finance_status = case
    when pf.balance_cached < 0 then 'overpaid'
    when pf.balance_cached = 0 and coalesce(p.sale_value, 0) > 0 then 'paid'
    when pf.amount_paid_cached > 0 and pf.balance_cached > 0 then 'partial'
    else 'pending'
  end
from project_finance pf
where p.id = pf.project_id;

-- Notes:
-- Legacy-only payments in projects.amount_paid are intentionally left for
-- manual review. This migration only trusts Treasury income movements that are
-- already linked to a project.
