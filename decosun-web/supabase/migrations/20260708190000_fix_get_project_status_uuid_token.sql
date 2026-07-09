-- DecoSun Public Status - UUID token fix
-- Recreate get_project_status(text) so projects.public_token (uuid) is compared
-- with a safely validated UUID token. Invalid tokens return zero rows.

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
declare
  v_token text;
begin
  v_token := trim(p_token);

  if v_token is null or v_token = '' then
    return;
  end if;

  if v_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
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
  where p.public_token = v_token::uuid
    and p.deleted_at is null
  limit 1;
end;
$$;

comment on function public.get_project_status(text) is
  'DecoSun public project status by UUID token. Returns only public customer fields plus finance cache fields; invalid tokens return zero rows.';

revoke all on function public.get_project_status(text) from public;
revoke all on function public.get_project_status(text) from anon;
revoke all on function public.get_project_status(text) from authenticated;

grant execute on function public.get_project_status(text) to anon;
grant execute on function public.get_project_status(text) to authenticated;
