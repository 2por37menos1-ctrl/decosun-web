-- DecoSun Mercado Publico v2 - Hito 3A.0
-- Unique index for safe opportunity upserts by source and external id.
--
-- This migration does not update, delete, or manually modify existing data.
--
-- If this migration fails because duplicates already exist, run this diagnostic
-- query manually in Supabase SQL Editor before deciding a cleanup strategy:
--
-- select source, external_id, count(*)
-- from public.market_opportunities
-- where source is not null and external_id is not null
-- group by source, external_id
-- having count(*) > 1;

create unique index if not exists idx_market_opportunities_source_external_id
on public.market_opportunities(source, external_id)
where source is not null and external_id is not null;
