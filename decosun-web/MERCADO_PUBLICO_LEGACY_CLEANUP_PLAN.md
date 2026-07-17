# Mercado Publico legacy cleanup - prepared, not executed

This checklist belongs to Stage 4 and requires a new approval plus a fresh local/remote audit.

## Remote objects

1. Verify `importar-recomendadas` remains absent.
2. Recount legacy tables and recheck foreign keys, views, triggers, policies and SQL functions.
3. Execute `supabase/cleanup/market_publico_legacy_cleanup.sql` only after review.
4. Remove only these source-specific Secrets:
   - `MERCADO_PUBLICO_BEARER_TOKEN`
   - `MERCADO_PUBLICO_API_KEY`
5. Preserve `MERCADO_PUBLICO_TICKET` for `escanear-compra-agil`.
6. Preserve all projects with `source = 'mercado_publico'` or `client_type = 'mercado_publico'`.

## Local legacy files

- `supabase/functions/importar-recomendadas/`
- `supabase/functions/escanear-mercado-publico/`
- `supabase/functions/_shared/marketOpportunity.ts`
- `supabase/functions/_shared/marketOpportunity.test.ts`
- `supabase/functions/_shared/marketSync.ts`
- `src/lib/mercadoPublicoScanner.ts`
- `src/lib/compraAgilScanner.js`
- `src/lib/testMercadoPublico.js`
- `supabase/migrations/20260706170000_market_opportunities_unique_source_external_id.sql`
- `supabase/migrations/20260706180000_fix_market_opportunities_unique_upsert.sql`
- `supabase/migrations/20260713120000_market_opportunity_ingestion_metadata.sql`

## Transitional frontend cleanup

- Remove the `/panel/mercado-publico` compatibility route.
- Remove the temporary `MercadoPublico.jsx` reconstruction page.
- Keep `/panel/radar-compra-agil`, `RadarCompraAgil.jsx` and the gerencia-only Dashboard/Sidebar entry.
- Remove the legacy function declarations from `supabase/config.toml` while preserving `escanear-compra-agil` with `verify_jwt = true`.
