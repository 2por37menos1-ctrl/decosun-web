-- DecoSun finance reconciliation summary - manual SQL Editor version
--
-- Diagnostic only.
-- Read-only select statements.
-- Do not run as a migration.
-- Each block can be copied and executed independently in Supabase SQL Editor.

-- BLOQUE 1: resumen general
with
project_payment_totals as (
  select
    pp.project_id,
    count(*) filter (where pp.status = 'confirmed') as confirmed_payment_count
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    count(*) as treasury_income_count
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
),
summary as (
  select
    count(*) as total_proyectos,
    count(*) filter (where coalesce(p.sale_value, 0) > 0) as proyectos_con_sale_value,
    count(*) filter (where coalesce(p.amount_paid, 0) > 0) as proyectos_con_amount_paid_legacy,
    count(*) filter (where p.amount_paid_cached is not null) as proyectos_con_amount_paid_cached,
    count(*) filter (where p.balance_cached is not null) as proyectos_con_balance_cached,
    count(*) filter (
      where p.amount_paid_cached is null
        and p.balance_cached is null
        and p.finance_status is null
    ) as proyectos_sin_cache_financiero,
    count(*) filter (where coalesce(ppt.confirmed_payment_count, 0) > 0) as proyectos_con_project_payments,
    count(*) filter (where coalesce(tit.treasury_income_count, 0) > 0) as proyectos_con_treasury_vinculada
  from public.projects p
  left join project_payment_totals ppt on ppt.project_id = p.id
  left join treasury_income_totals tit on tit.project_id = p.id
)
select 'RESUMEN GENERAL' as section, metric, value
from summary
cross join lateral (
  values
    ('total proyectos', total_proyectos),
    ('proyectos con sale_value', proyectos_con_sale_value),
    ('proyectos con amount_paid legacy', proyectos_con_amount_paid_legacy),
    ('proyectos con amount_paid_cached', proyectos_con_amount_paid_cached),
    ('proyectos con balance_cached', proyectos_con_balance_cached),
    ('proyectos sin cache financiero', proyectos_sin_cache_financiero),
    ('proyectos con registros en project_payments', proyectos_con_project_payments),
    ('proyectos con movimientos treasury vinculados', proyectos_con_treasury_vinculada)
) as metrics(metric, value);

-- BLOQUE 2: categorias de reconciliacion
with
project_payment_totals as (
  select
    pp.project_id,
    coalesce(sum(pp.amount) filter (where pp.status = 'confirmed'), 0) as confirmed_payment_total
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    coalesce(sum(tm.amount), 0) as treasury_income_total
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
),
classified as (
  select
    case
      when coalesce(p.sale_value, 0) <= 0
        and (
          coalesce(p.amount_paid, 0) > 0
          or coalesce(p.amount_paid_cached, 0) > 0
          or coalesce(ppt.confirmed_payment_total, 0) > 0
          or coalesce(tit.treasury_income_total, 0) > 0
        )
        then 'missing_sale_value'
      when coalesce(p.amount_paid_cached, 0) > coalesce(p.sale_value, 0)
        and coalesce(p.sale_value, 0) > 0
        then 'overpaid'
      when p.amount_paid_cached is not null
        and p.balance_cached is not null
        and abs(coalesce(p.amount_paid_cached, 0) - coalesce(ppt.confirmed_payment_total, 0)) < 1
        and coalesce(ppt.confirmed_payment_total, 0) > 0
        then 'ok_cache_matches_project_payments'
      when (p.amount_paid_cached is null or p.balance_cached is null)
        and coalesce(ppt.confirmed_payment_total, 0) > 0
        then 'missing_cache_has_project_payments'
      when coalesce(p.amount_paid, 0) > 0
        and coalesce(ppt.confirmed_payment_total, 0) = 0
        and coalesce(tit.treasury_income_total, 0) = 0
        then 'legacy_only_needs_manual_review'
      when coalesce(tit.treasury_income_total, 0) > 0
        and coalesce(ppt.confirmed_payment_total, 0) = 0
        then 'treasury_only_needs_review'
      when coalesce(p.amount_paid_cached, 0) > 0
        and coalesce(ppt.confirmed_payment_total, 0) = 0
        then 'cache_without_payments_needs_review'
      when coalesce(p.sale_value, 0) = 0
        and coalesce(p.amount_paid, 0) = 0
        and coalesce(p.amount_paid_cached, 0) = 0
        and coalesce(ppt.confirmed_payment_total, 0) = 0
        and coalesce(tit.treasury_income_total, 0) = 0
        then 'no_financial_data'
      else 'other_review'
    end as categoria
  from public.projects p
  left join project_payment_totals ppt on ppt.project_id = p.id
  left join treasury_income_totals tit on tit.project_id = p.id
)
select
  'CATEGORIAS DE RECONCILIACION' as section,
  categoria,
  count(*) as cantidad
from classified
group by categoria
order by cantidad desc, categoria;

-- BLOQUE 3: primeros 20 casos para revision
with
project_payment_totals as (
  select
    pp.project_id,
    coalesce(sum(pp.amount) filter (where pp.status = 'confirmed'), 0) as confirmed_payment_total
  from public.project_payments pp
  group by pp.project_id
),
treasury_income_totals as (
  select
    tm.project_id,
    coalesce(sum(tm.amount), 0) as treasury_income_total
  from public.treasury_movements tm
  where tm.project_id is not null
    and tm.type = 'ingreso'
  group by tm.project_id
),
review as (
  select
    p.id as project_id,
    coalesce(p.quote_number, p.id::text) as proyecto,
    coalesce(p.contact_name, '-') as cliente,
    coalesce(p.sale_value, 0) as venta,
    coalesce(p.amount_paid, 0) as legacy,
    coalesce(p.amount_paid_cached, 0) as cache,
    coalesce(ppt.confirmed_payment_total, 0) as pagos_nuevos,
    coalesce(tit.treasury_income_total, 0) as treasury_vinculada,
    coalesce(p.amount_paid_cached, 0) - coalesce(ppt.confirmed_payment_total, 0) as diferencia_cache_vs_pagos,
    array_remove(array[
      case
        when coalesce(p.amount_paid, 0) > 0
          and coalesce(ppt.confirmed_payment_total, 0) = 0
          then 'legacy sin project_payments'
      end,
      case
        when coalesce(tit.treasury_income_total, 0) > 0
          and coalesce(ppt.confirmed_payment_total, 0) = 0
          then 'tesoreria vinculada sin project_payments'
      end,
      case
        when p.amount_paid_cached is not null
          and abs(coalesce(p.amount_paid_cached, 0) - coalesce(ppt.confirmed_payment_total, 0)) >= 1
          then 'cache distinto a project_payments'
      end,
      case
        when coalesce(p.balance_cached, 0) < 0
          then 'saldo negativo'
      end,
      case
        when coalesce(p.sale_value, 0) <= 0
          and (
            coalesce(p.amount_paid, 0) > 0
            or coalesce(p.amount_paid_cached, 0) > 0
            or coalesce(ppt.confirmed_payment_total, 0) > 0
            or coalesce(tit.treasury_income_total, 0) > 0
          )
          then 'pagos sin venta'
      end
    ], null) as motivos
  from public.projects p
  left join project_payment_totals ppt on ppt.project_id = p.id
  left join treasury_income_totals tit on tit.project_id = p.id
)
select
  'PRIMEROS 20 CASOS PARA REVISION' as section,
  proyecto,
  cliente,
  venta,
  legacy,
  cache,
  pagos_nuevos,
  treasury_vinculada,
  diferencia_cache_vs_pagos as diferencia,
  array_to_string(motivos, '; ') as motivo_revision
from review
where cardinality(motivos) > 0
order by cardinality(motivos) desc, abs(diferencia_cache_vs_pagos) desc, proyecto
limit 20;
