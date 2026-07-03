-- DecoSun Financial Engine - Phase 1A
-- This migration creates the first project_payments foundation only.
-- It does not activate the new payment flow, does not backfill historical
-- payments, and does not change current application behavior.
-- amount_paid remains in projects as the current legacy/cache field during
-- the transition.

create extension if not exists pgcrypto;

alter table public.projects
  add column if not exists amount_paid_legacy numeric(14, 2),
  add column if not exists amount_paid_cached numeric(14, 2),
  add column if not exists balance_cached numeric(14, 2),
  add column if not exists finance_status text;

comment on column public.projects.amount_paid_legacy is
  'DecoSun Financial Engine Phase 1A: preserves the legacy amount_paid value during migration. This column is not populated or activated by this migration.';

comment on column public.projects.amount_paid_cached is
  'DecoSun Financial Engine Phase 1A: future cache for the sum of valid project_payments. Current behavior still uses amount_paid.';

comment on column public.projects.balance_cached is
  'DecoSun Financial Engine Phase 1A: future cache for sale_value minus valid received payments. Current behavior is unchanged.';

comment on column public.projects.finance_status is
  'DecoSun Financial Engine Phase 1A: future managerial finance status. Current payment_status behavior is unchanged.';

create table if not exists public.project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  treasury_movement_id uuid references public.treasury_movements(id) on delete set null,
  payment_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  company_name text not null,
  bank text not null,
  payment_milestone text not null default 'manual',
  status text not null default 'pending',
  source text not null default 'manual',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint project_payments_status_check check (
    status in (
      'pending',
      'confirmed',
      'voided',
      'corrected',
      'reversed'
    )
  ),
  constraint project_payments_milestone_check check (
    payment_milestone in (
      'initial_50',
      'final_50',
      'partial',
      'full',
      'manual',
      'historical_migration',
      'adjustment'
    )
  )
);

comment on table public.project_payments is
  'DecoSun Financial Engine Phase 1A: stores every real customer payment as an independent traceable financial event. This table is foundational only and does not activate the new payment flow yet.';

comment on column public.project_payments.project_id is
  'Related customer project. A financial sale is recognized from received money, not from a quote alone.';

comment on column public.project_payments.treasury_movement_id is
  'Optional relation to the bank-facing treasury movement that explains where the money entered.';

comment on column public.project_payments.payment_date is
  'Real date of the customer payment or bank movement.';

comment on column public.project_payments.amount is
  'Received payment amount for this independent event. Multiple events can complete the same milestone.';

comment on column public.project_payments.company_name is
  'Company that received the money. Finance is organized first by company and then by bank.';

comment on column public.project_payments.bank is
  'Bank or cash account that received the money.';

comment on column public.project_payments.payment_milestone is
  'Managerial payment milestone, such as initial 50%, final 50%, partial, full, or historical migration.';

comment on column public.project_payments.status is
  'Traceable lifecycle status. Errors must be voided, corrected, or reversed instead of deleting history.';

comment on column public.project_payments.source is
  'Origin of the event, for example manual, project_modal_future, dashboard_legacy, migration, or treasury.';

comment on column public.project_payments.created_by is
  'User who registered the payment event when available.';

create index if not exists idx_project_payments_project_id
  on public.project_payments(project_id);

create index if not exists idx_project_payments_treasury_movement_id
  on public.project_payments(treasury_movement_id);

create index if not exists idx_project_payments_payment_date
  on public.project_payments(payment_date);

create index if not exists idx_project_payments_company_bank_date
  on public.project_payments(company_name, bank, payment_date);

create index if not exists idx_project_payments_status
  on public.project_payments(status);

create index if not exists idx_project_payments_milestone
  on public.project_payments(payment_milestone);

create index if not exists idx_project_payments_source
  on public.project_payments(source);

create index if not exists idx_project_payments_created_by
  on public.project_payments(created_by);

create unique index if not exists idx_project_payments_treasury_movement_unique
  on public.project_payments(treasury_movement_id)
  where treasury_movement_id is not null;

-- Phase 1A intentionally does not:
-- - copy amount_paid into amount_paid_legacy
-- - calculate amount_paid_cached or balance_cached
-- - create treasury movements
-- - generate commissions
-- - modify ProjectModal.jsx, Dashboard.jsx, Treasury.jsx, or any current flow
-- - apply Supabase RLS policies, which must be audited before production usage
