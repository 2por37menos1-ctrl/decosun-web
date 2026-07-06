-- DecoSun finance reconciliation diagnostic - phase 2b.6 step 1
--
-- This file is diagnostic only.
-- It contains read-only select queries.
-- It does not contain write, schema, destructive, or automatic migration commands.
-- Do not run this as an automatic migration.
-- Run it manually in Supabase SQL Editor and review the results before any reconciliation work.
--
-- Purpose:
-- Classify historical projects according to legacy amount_paid, project_payments,
-- treasury_movements, and the project finance cache:
-- amount_paid_cached, balance_cached, finance_status.

-- 1. resumen general
with
project_payment_totals as (
  select
    pp.project_id,
    count(*) filter (where pp.status = 'confirmed') as confirmed_payment_count,
    coalesce(sum(pp.amount) filter (where pp.status = 'confirmed'), 0) as confirmed_payment_total
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    count(*) as treasury_income_count,
    coalesce(sum(tm.amount), 0) as treasury_income_total
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
)
select
  count(*) as total_projects,
  count(*) filter (where coalesce(p.sale_value, 0) > 0) as projects_with_sale_value,
  count(*) filter (where coalesce(p.amount_paid, 0) > 0) as projects_with_legacy_amount_paid,
  count(*) filter (where p.amount_paid_cached is not null) as projects_with_amount_paid_cached,
  count(*) filter (where p.balance_cached is not null) as projects_with_balance_cached,
  count(*) filter (
    where p.amount_paid_cached is null
      and p.balance_cached is null
      and p.finance_status is null
  ) as projects_without_finance_cache,
  count(*) filter (where coalesce(ppt.confirmed_payment_count, 0) > 0) as projects_with_project_payments,
  count(*) filter (where coalesce(tit.treasury_income_count, 0) > 0) as projects_with_linked_treasury_income
from public.projects p
left join project_payment_totals ppt on ppt.project_id = p.id
left join treasury_income_totals tit on tit.project_id = p.id;

-- 2. clasificacion por proyecto
with
project_payment_totals as (
  select
    pp.project_id,
    count(*) filter (where pp.status = 'confirmed') as confirmed_payment_count,
    coalesce(sum(pp.amount) filter (where pp.status = 'confirmed'), 0) as confirmed_payment_total
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    count(*) as treasury_income_count,
    coalesce(sum(tm.amount), 0) as treasury_income_total
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
),
classified_projects as (
  select
    p.id as project_id,
    p.quote_number,
    p.contact_name,
    p.status,
    p.sale_value,
    p.amount_paid as amount_paid_legacy,
    p.amount_paid_cached,
    p.balance_cached,
    p.finance_status,
    coalesce(ppt.confirmed_payment_count, 0) as confirmed_project_payment_count,
    coalesce(ppt.confirmed_payment_total, 0) as confirmed_project_payment_total,
    coalesce(tit.treasury_income_count, 0) as linked_treasury_income_count,
    coalesce(tit.treasury_income_total, 0) as linked_treasury_income_total,
    coalesce(p.amount_paid_cached, 0) - coalesce(ppt.confirmed_payment_total, 0)
      as cache_vs_project_payments_difference,
    coalesce(p.amount_paid, 0) - coalesce(ppt.confirmed_payment_total, 0)
      as legacy_vs_project_payments_difference
  from public.projects p
  left join project_payment_totals ppt on ppt.project_id = p.id
  left join treasury_income_totals tit on tit.project_id = p.id
)
select
  cp.*,
  case
    when coalesce(cp.sale_value, 0) <= 0
      and (
        coalesce(cp.amount_paid_legacy, 0) > 0
        or coalesce(cp.amount_paid_cached, 0) > 0
        or coalesce(cp.confirmed_project_payment_total, 0) > 0
        or coalesce(cp.linked_treasury_income_total, 0) > 0
      )
      then 'missing_sale_value'
    when coalesce(cp.amount_paid_cached, 0) > coalesce(cp.sale_value, 0)
      and coalesce(cp.sale_value, 0) > 0
      then 'overpaid'
    when cp.amount_paid_cached is not null
      and cp.balance_cached is not null
      and abs(cp.cache_vs_project_payments_difference) < 1
      and coalesce(cp.confirmed_project_payment_total, 0) > 0
      then 'ok_cache_matches_project_payments'
    when (cp.amount_paid_cached is null or cp.balance_cached is null)
      and coalesce(cp.confirmed_project_payment_total, 0) > 0
      then 'missing_cache_has_project_payments'
    when coalesce(cp.amount_paid_legacy, 0) > 0
      and coalesce(cp.confirmed_project_payment_total, 0) = 0
      and coalesce(cp.linked_treasury_income_total, 0) = 0
      then 'legacy_only_needs_manual_review'
    when coalesce(cp.linked_treasury_income_total, 0) > 0
      and coalesce(cp.confirmed_project_payment_total, 0) = 0
      then 'treasury_only_needs_review'
    when coalesce(cp.amount_paid_cached, 0) > 0
      and coalesce(cp.confirmed_project_payment_total, 0) = 0
      then 'cache_without_payments_needs_review'
    when coalesce(cp.sale_value, 0) = 0
      and coalesce(cp.amount_paid_legacy, 0) = 0
      and coalesce(cp.amount_paid_cached, 0) = 0
      and coalesce(cp.confirmed_project_payment_total, 0) = 0
      and coalesce(cp.linked_treasury_income_total, 0) = 0
      then 'no_financial_data'
    else 'other_review'
  end as suggested_category
from classified_projects cp
order by suggested_category, cp.status, cp.quote_number nulls last, cp.contact_name nulls last;

-- 3. posibles duplicados entre project_payments y treasury_movements
-- Compara por proyecto, monto exacto y fecha cercana de hasta 3 dias.
-- Si project_payments.treasury_movement_id ya apunta al movimiento, no se considera duplicado.
select
  pp.project_id,
  p.quote_number,
  p.contact_name,
  pp.id as project_payment_id,
  pp.payment_date as project_payment_date,
  pp.amount as project_payment_amount,
  pp.bank as project_payment_bank,
  pp.treasury_movement_id as linked_treasury_movement_id,
  tm.id as candidate_treasury_movement_id,
  tm.date as treasury_movement_date,
  tm.amount as treasury_movement_amount,
  tm.bank as treasury_movement_bank,
  tm.description as treasury_movement_description,
  abs(tm.date - pp.payment_date) as date_distance_days
from public.project_payments pp
join public.projects p on p.id = pp.project_id
join public.treasury_movements tm
  on tm.project_id = pp.project_id
  and tm.type = 'ingreso'
  and tm.amount = pp.amount
  and abs(tm.date - pp.payment_date) <= 3
where pp.status = 'confirmed'
  and (
    pp.treasury_movement_id is null
    or pp.treasury_movement_id <> tm.id
  )
order by pp.project_id, pp.payment_date, tm.date;

-- 4. casos para revision manual
with
project_payment_totals as (
  select
    pp.project_id,
    count(*) filter (where pp.status = 'confirmed') as confirmed_payment_count,
    coalesce(sum(pp.amount) filter (where pp.status = 'confirmed'), 0) as confirmed_payment_total
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    count(*) as treasury_income_count,
    coalesce(sum(tm.amount), 0) as treasury_income_total
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
),
manual_review as (
  select
    p.id as project_id,
    p.quote_number,
    p.contact_name,
    p.status,
    p.sale_value,
    p.amount_paid as amount_paid_legacy,
    p.amount_paid_cached,
    p.balance_cached,
    p.finance_status,
    coalesce(ppt.confirmed_payment_count, 0) as confirmed_project_payment_count,
    coalesce(ppt.confirmed_payment_total, 0) as confirmed_project_payment_total,
    coalesce(tit.treasury_income_count, 0) as linked_treasury_income_count,
    coalesce(tit.treasury_income_total, 0) as linked_treasury_income_total,
    array_remove(array[
      case
        when coalesce(p.amount_paid, 0) > 0
          and coalesce(ppt.confirmed_payment_total, 0) = 0
          then 'legacy amount_paid without project_payments'
      end,
      case
        when coalesce(tit.treasury_income_total, 0) > 0
          and coalesce(ppt.confirmed_payment_total, 0) = 0
          then 'treasury income linked to project without project_payments'
      end,
      case
        when p.amount_paid_cached is not null
          and abs(coalesce(p.amount_paid_cached, 0) - coalesce(ppt.confirmed_payment_total, 0)) >= 1
          then 'cache differs from confirmed project_payments'
      end,
      case
        when coalesce(p.balance_cached, 0) < 0
          then 'negative balance'
      end,
      case
        when coalesce(p.sale_value, 0) <= 0
          and (
            coalesce(p.amount_paid, 0) > 0
            or coalesce(p.amount_paid_cached, 0) > 0
            or coalesce(ppt.confirmed_payment_total, 0) > 0
            or coalesce(tit.treasury_income_total, 0) > 0
          )
          then 'sale_value missing or zero with payments'
      end,
      case
        when p.status in ('cerrado', 'facturacion')
          and (
            p.amount_paid_cached is null
            or p.balance_cached is null
            or p.finance_status is null
          )
          then 'closed or billing project without complete finance cache'
      end
    ], null) as review_reasons
  from public.projects p
  left join project_payment_totals ppt on ppt.project_id = p.id
  left join treasury_income_totals tit on tit.project_id = p.id
)
select *
from manual_review
where cardinality(review_reasons) > 0
order by cardinality(review_reasons) desc, status, quote_number nulls last, contact_name nulls last;

-- 5. resumen de categorias sugeridas
with
project_payment_totals as (
  select
    pp.project_id,
    count(*) filter (where pp.status = 'confirmed') as confirmed_payment_count,
    coalesce(sum(pp.amount) filter (where pp.status = 'confirmed'), 0) as confirmed_payment_total
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    count(*) as treasury_income_count,
    coalesce(sum(tm.amount), 0) as treasury_income_total
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
),
classified_projects as (
  select
    p.id as project_id,
    p.sale_value,
    p.amount_paid as amount_paid_legacy,
    p.amount_paid_cached,
    p.balance_cached,
    p.finance_status,
    coalesce(ppt.confirmed_payment_total, 0) as confirmed_project_payment_total,
    coalesce(tit.treasury_income_total, 0) as linked_treasury_income_total
  from public.projects p
  left join project_payment_totals ppt on ppt.project_id = p.id
  left join treasury_income_totals tit on tit.project_id = p.id
),
categorized as (
  select
    case
      when coalesce(cp.sale_value, 0) <= 0
        and (
          coalesce(cp.amount_paid_legacy, 0) > 0
          or coalesce(cp.amount_paid_cached, 0) > 0
          or coalesce(cp.confirmed_project_payment_total, 0) > 0
          or coalesce(cp.linked_treasury_income_total, 0) > 0
        )
        then 'missing_sale_value'
      when coalesce(cp.amount_paid_cached, 0) > coalesce(cp.sale_value, 0)
        and coalesce(cp.sale_value, 0) > 0
        then 'overpaid'
      when cp.amount_paid_cached is not null
        and cp.balance_cached is not null
        and abs(coalesce(cp.amount_paid_cached, 0) - coalesce(cp.confirmed_project_payment_total, 0)) < 1
        and coalesce(cp.confirmed_project_payment_total, 0) > 0
        then 'ok_cache_matches_project_payments'
      when (cp.amount_paid_cached is null or cp.balance_cached is null)
        and coalesce(cp.confirmed_project_payment_total, 0) > 0
        then 'missing_cache_has_project_payments'
      when coalesce(cp.amount_paid_legacy, 0) > 0
        and coalesce(cp.confirmed_project_payment_total, 0) = 0
        and coalesce(cp.linked_treasury_income_total, 0) = 0
        then 'legacy_only_needs_manual_review'
      when coalesce(cp.linked_treasury_income_total, 0) > 0
        and coalesce(cp.confirmed_project_payment_total, 0) = 0
        then 'treasury_only_needs_review'
      when coalesce(cp.amount_paid_cached, 0) > 0
        and coalesce(cp.confirmed_project_payment_total, 0) = 0
        then 'cache_without_payments_needs_review'
      when coalesce(cp.sale_value, 0) = 0
        and coalesce(cp.amount_paid_legacy, 0) = 0
        and coalesce(cp.amount_paid_cached, 0) = 0
        and coalesce(cp.confirmed_project_payment_total, 0) = 0
        and coalesce(cp.linked_treasury_income_total, 0) = 0
        then 'no_financial_data'
      else 'other_review'
    end as suggested_category
  from classified_projects cp
)
select
  suggested_category,
  count(*) as project_count
from categorized
group by suggested_category
order by project_count desc, suggested_category;
