-- DecoSun Financial Engine - Phase 2B.5
-- Version public project status RPC to expose finance cache fields.
--
-- This migration does not modify project data, does not reconcile historical
-- payments, and does not remove legacy amount_paid from the public contract.
-- The public status page uses this RPC with /estado/:token links.

drop function if exists public.get_project_status(text);

create function public.get_project_status(p_token text)
returns table (
  client_visible_status text,
  contact_name text,
  city text,
  quote_number text,
  sale_value numeric,
  amount_paid numeric,
  amount_paid_cached numeric,
  balance_cached numeric,
  finance_status text,
  summary text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or nullif(trim(p_token), '') is null then
    return;
  end if;

  return query
  select
    p.client_visible_status::text,
    p.contact_name::text,
    p.city::text,
    p.quote_number::text,
    p.sale_value::numeric,
    p.amount_paid::numeric,
    p.amount_paid_cached::numeric,
    p.balance_cached::numeric,
    p.finance_status::text,
    p.summary::text
  from public.projects p
  where p.public_token = trim(p_token)
    and p.deleted_at is null
  limit 1;
end;
$$;

comment on function public.get_project_status(text) is
  'DecoSun Phase 2B.5: public project status by token. Returns only public customer fields plus Finance Engine cache fields; does not expose costs, commissions, bank data, users, or internal notes.';

revoke all on function public.get_project_status(text) from public;
revoke all on function public.get_project_status(text) from anon;
revoke all on function public.get_project_status(text) from authenticated;

grant execute on function public.get_project_status(text) to anon;
grant execute on function public.get_project_status(text) to authenticated;
