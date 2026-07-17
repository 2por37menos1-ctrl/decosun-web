-- PREPARED ONLY. DO NOT EXECUTE WITHOUT A NEW APPROVAL AND A FRESH REMOTE AUDIT.
-- The eight ERP projects whose source/client_type is mercado_publico are out of scope.
-- No CASCADE is intentional: a newly introduced dependency must stop this cleanup.

begin;

drop table if exists public.market_public_settings;
drop table if exists public.market_keywords;
drop table if exists public.market_opportunities;

commit;
