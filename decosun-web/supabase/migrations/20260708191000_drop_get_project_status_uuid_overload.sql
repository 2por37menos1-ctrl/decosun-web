-- DecoSun Public Status - RPC overload cleanup
-- Keep get_project_status(text) as the official frontend contract.

drop function if exists public.get_project_status(uuid);
