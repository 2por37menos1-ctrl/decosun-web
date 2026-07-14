import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type IngestionChannel, mergeMarketOpportunity, normalizeMarketOpportunity } from "./marketOpportunity.ts";

export async function normalizeAndSaveOpportunities(options: {
  items: Record<string, unknown>[];
  channel: IngestionChannel;
  supabaseUrl: string;
  serviceRoleKey: string;
}) {
  const { items, channel, supabaseUrl, serviceRoleKey } = options;
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const now = new Date();
  const { data: keywords, error: keywordsError } = await supabase
    .from("market_keywords").select("keyword, priority").eq("is_active", true);
  if (keywordsError) throw new Error("keywords_load_failed");

  const results = items.map((item) => normalizeMarketOpportunity(item, keywords || [], channel, now));
  const candidates = results.flatMap((result) => result.record ? [result.record] : []);
  const existingById = new Map<string, Record<string, unknown>>();
  if (candidates.length) {
    const { data: existing, error } = await supabase.from("market_opportunities").select("*")
      .eq("source", "mercado_publico").in("external_id", candidates.map((item) => item.external_id));
    if (error) throw new Error("opportunities_read_failed");
    for (const item of existing || []) existingById.set(String(item.external_id), item);
  }

  const records = candidates.map((record) =>
    mergeMarketOpportunity(existingById.get(String(record.external_id)) || null, record, channel, now));
  if (records.length) {
    const { error } = await supabase.from("market_opportunities")
      .upsert(records, { onConflict: "source,external_id" });
    if (error) throw new Error("opportunities_save_failed");
  }

  return {
    total: items.length,
    inserted_or_updated: records.length,
    nuevas: records.filter((item) => !existingById.has(String(item.external_id))).length,
    actualizadas: records.filter((item) => existingById.has(String(item.external_id))).length,
    irrelevant_skipped: results.filter((item) => item.reason === "not_relevant").length,
    missing_external_id_skipped: results.filter((item) => item.reason === "missing_external_id").length,
    // Closed and undated relevant records remain stored for audit/history.
    expired_skipped: 0,
    missing_closing_date_skipped: 0,
    missing_closing_date_detected: records.filter((item) => !item.closing_at).length,
    open_opportunities: records.filter((item) => item.closing_at && new Date(String(item.closing_at)) > now).length,
    closed_opportunities: records.filter((item) => item.closing_at && new Date(String(item.closing_at)) <= now).length,
    extended_closing_used: records.filter((item) => item.closing_was_extended).length,
    site_visits_detected: records.filter((item) => item.has_site_visit).length,
  };
}
