// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireCompraAgilGerencia } from "../_shared/compraAgilAuth.ts";
import {
  clearedFailureColumns,
  failurePersistence,
  sanitizeScanFailure,
  type ScanContext,
  ScanError,
  upstreamScanError,
} from "../_shared/compraAgilDiagnostics.ts";
import {
  evaluateOpportunity,
  mapHttpError,
  mergeDetail,
  normalizeListItem,
  preliminaryExclusion,
  preserveExistingRecord,
  shouldFetchDetail,
  unwrapApiPayload,
} from "../_shared/compraAgilV2.ts";

const API_BASE = "https://api2.mercadopublico.cl/v2/compra-agil";
const PAGE_SIZE = 50;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function chunks<T>(values: T[], size = 100) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function safeConfig(row: Record<string, unknown>) {
  return {
    search_terms: Array.isArray(row.search_terms)
      ? row.search_terms.map(String).filter(Boolean)
      : [],
    product_terms: Array.isArray(row.product_terms)
      ? row.product_terms.map(String).filter(Boolean)
      : [],
    region_codes: Array.isArray(row.region_codes)
      ? row.region_codes.map(Number).filter(Number.isFinite)
      : [],
    minimum_budget:
      row.minimum_budget === null || row.minimum_budget === undefined
        ? null
        : Number(row.minimum_budget),
  };
}

function dateWindow(config: Record<string, unknown>, scanUntil: Date) {
  const lastSuccessful = config.last_successful_change_at
    ? new Date(String(config.last_successful_change_at))
    : null;
  if (lastSuccessful && !Number.isNaN(lastSuccessful.getTime())) {
    const overlapMs = Number(config.overlap_minutes || 10) * 60_000;
    return {
      mode: "incremental",
      cambio_desde: new Date(lastSuccessful.getTime() - overlapMs)
        .toISOString(),
      cambio_hasta: scanUntil.toISOString(),
    };
  }
  const lookbackMs = Number(config.initial_lookback_days || 14) * 86_400_000;
  return {
    mode: "initial",
    publicado_desde: new Date(scanUntil.getTime() - lookbackMs).toISOString(),
    publicado_hasta: scanUntil.toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return json({ ok: false, error_code: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    const error = new ScanError("missing_supabase_secrets", 500, {
      stage: "config",
    });
    return json(sanitizeScanFailure(error, 0), error.status);
  }

  const authorization = await requireCompraAgilGerencia(
    req,
    supabaseUrl,
    anonKey,
  );
  if (!authorization.ok) {
    const error = new ScanError(authorization.errorCode, authorization.status, {
      stage: "authorization",
    });
    return json(sanitizeScanFailure(error, 0), error.status);
  }

  const ticket = Deno.env.get("MERCADO_PUBLICO_TICKET");
  if (!ticket) {
    const error = new ScanError("missing_mercado_publico_ticket", 500, {
      stage: "config",
    });
    return json(sanitizeScanFailure(error, 0), error.status);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const scanStartedAt = new Date();
  const scanUntil = new Date();
  let requestCount = 0;
  let configLoaded = false;

  try {
    const { data: config, error: configError } = await supabase
      .from("compra_agil_radar_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (configError || !config) {
      throw new ScanError("radar_config_load_failed", 500, { stage: "config" });
    }
    configLoaded = true;

    const radarConfig = safeConfig(config);
    if (!radarConfig.search_terms.length) {
      throw new ScanError("radar_search_terms_empty", 400, { stage: "config" });
    }
    const maxRequests = Number(config.max_requests_per_scan || 500);
    const window = dateWindow(config, scanUntil);

    const { error: runningError } = await supabase
      .from("compra_agil_radar_config")
      .update({
        last_scan_started_at: scanStartedAt.toISOString(),
        last_scan_status: "running",
        updated_at: scanStartedAt.toISOString(),
      })
      .eq("id", 1);
    if (runningError) {
      throw new ScanError("radar_scan_state_update_failed", 500, {
        stage: "database",
      });
    }

    const apiGet = async (url: URL, context: ScanContext) => {
      requestCount += 1;
      if (requestCount > maxRequests) {
        throw new ScanError("request_budget_exhausted", 429, {
          ...context,
          requestNumber: requestCount,
        });
      }
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { accept: "application/json", ticket },
        });
      } catch {
        throw new ScanError("upstream_request_failed", 502, {
          ...context,
          requestNumber: requestCount,
        });
      }
      if (!response.ok) {
        throw upstreamScanError(
          mapHttpError(response.status),
          response.status,
          requestCount,
          context,
        );
      }
      const payload = await response.json().catch(() => null);
      try {
        return unwrapApiPayload(payload);
      } catch (error) {
        const errorCode =
          error instanceof Error && error.message === "upstream_response_not_ok"
            ? "upstream_response_not_ok"
            : "invalid_upstream_payload";
        throw new ScanError(errorCode, 502, {
          ...context,
          requestNumber: requestCount,
          upstreamStatus: response.status,
        });
      }
    };

    const candidates = new Map<
      string,
      { item: Record<string, unknown>; terms: Set<string> }
    >();
    let pagesConsulted = 0;
    let totalReceived = 0;

    for (const term of radarConfig.search_terms) {
      let page = 1;
      let totalPages = 1;
      do {
        const url = new URL(API_BASE);
        url.searchParams.set("estado", "publicada");
        url.searchParams.set("q", term);
        url.searchParams.set("tamano_pagina", String(PAGE_SIZE));
        url.searchParams.set("numero_pagina", String(page));
        url.searchParams.set("ordenar_por", "FechaUltimaModificacion");
        if (radarConfig.region_codes.length) {
          url.searchParams.set("region", radarConfig.region_codes.join(","));
        }
        for (const [key, value] of Object.entries(window)) {
          if (key !== "mode") url.searchParams.set(key, String(value));
        }

        const payload = await apiGet(url, {
          stage: "list",
          requestType: "listing",
          searchTerm: term,
          pageNumber: page,
        });
        const items = Array.isArray(payload.items) ? payload.items : [];
        const pagination =
          payload.paginacion && typeof payload.paginacion === "object"
            ? payload.paginacion as Record<string, unknown>
            : {};
        totalPages = Math.max(1, Number(pagination.total_paginas || 1));
        if (!Number.isFinite(totalPages) || totalPages > 10_000) {
          throw new ScanError("invalid_pagination_metadata", 502);
        }
        pagesConsulted += 1;
        totalReceived += items.length;

        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const code = String((item as Record<string, unknown>).codigo || "")
            .trim();
          if (!code) continue;
          const existing = candidates.get(code);
          if (existing) existing.terms.add(term);
          else {candidates.set(code, {
              item: item as Record<string, unknown>,
              terms: new Set([term]),
            });}
        }
        page += 1;
      } while (page <= totalPages);
    }

    const candidateIds = [...candidates.keys()];
    const existingById = new Map<string, Record<string, unknown>>();
    for (const idChunk of chunks(candidateIds)) {
      const { data, error } = await supabase
        .from("compra_agil_opportunities")
        .select("*")
        .in("external_id", idChunk);
      if (error) {
        throw new ScanError("existing_opportunities_load_failed", 500, {
          stage: "database",
        });
      }
      for (const row of data || []) {
        existingById.set(String(row.external_id), row);
      }
    }

    const records: Record<string, unknown>[] = [];
    let detailsConsulted = 0;
    let detailsReused = 0;
    let detailNotFound = 0;
    for (const [externalId, candidate] of candidates) {
      let record = normalizeListItem(candidate.item, {
        scannedAt: scanUntil,
        discoveryTerms: [...candidate.terms],
      });
      if (!record) continue;
      const existing = existingById.get(externalId) || null;
      const preliminaryReason = preliminaryExclusion(
        record,
        radarConfig,
        scanUntil,
      );

      if (!preliminaryReason && shouldFetchDetail(existing, record)) {
        const detailUrl = new URL(
          `${API_BASE}/${encodeURIComponent(externalId)}`,
        );
        try {
          const detail = await apiGet(detailUrl, {
            stage: "detail",
            requestType: "detail",
            externalId,
          });
          record = mergeDetail(record, detail, scanUntil);
          detailsConsulted += 1;
        } catch (error) {
          if (
            error instanceof ScanError &&
            error.message === "opportunity_not_found"
          ) {
            detailNotFound += 1;
            if (existing) record = preserveExistingRecord(existing, record);
            record = evaluateOpportunity(record, radarConfig, scanUntil);
            record.is_relevant = false;
            record.exclusion_reason = "detail_not_found";
            record.match_evidence = {
              ...record.match_evidence,
              exclusion_reason: "detail_not_found",
            };
          } else {
            throw error;
          }
        }
      } else if (!preliminaryReason && existing) {
        record = preserveExistingRecord(existing, record);
        detailsReused += 1;
      }

      if (record.exclusion_reason !== "detail_not_found") {
        record = evaluateOpportunity(record, radarConfig, scanUntil);
      }
      if (existing?.review_status) {
        record.review_status = String(existing.review_status);
      }
      records.push(record as unknown as Record<string, unknown>);
    }

    for (const recordChunk of chunks(records)) {
      const { error } = await supabase
        .from("compra_agil_opportunities")
        .upsert(recordChunk, { onConflict: "external_id" });
      if (error) {
        throw new ScanError("opportunities_save_failed", 500, {
          stage: "database",
        });
      }
    }

    const stats = {
      mode: window.mode,
      window_from: window.cambio_desde || window.publicado_desde,
      window_to: window.cambio_hasta || window.publicado_hasta,
      search_terms: radarConfig.search_terms.length,
      pages_consulted: pagesConsulted,
      requests_used: requestCount,
      total_received: totalReceived,
      unique_candidates: candidates.size,
      details_consulted: detailsConsulted,
      details_reused: detailsReused,
      detail_not_found: detailNotFound,
      inserted_or_updated: records.length,
      relevant: records.filter((record) => record.is_relevant).length,
      excluded: records.filter((record) => !record.is_relevant).length,
    };
    const completedAt = new Date();
    const { error: completionError } = await supabase
      .from("compra_agil_radar_config")
      .update({
        last_successful_change_at: scanUntil.toISOString(),
        last_scan_completed_at: completedAt.toISOString(),
        last_scan_status: "success",
        last_scan_stats: stats,
        ...clearedFailureColumns,
        updated_at: completedAt.toISOString(),
      })
      .eq("id", 1);
    if (completionError) {
      throw new ScanError("radar_watermark_update_failed", 500, {
        stage: "database",
      });
    }

    return json({ success: true, ok: true, ...stats });
  } catch (error) {
    const status = error instanceof ScanError ? error.status : 500;
    const failure = sanitizeScanFailure(error, requestCount);
    if (configLoaded) {
      const completedAt = new Date().toISOString();
      await supabase
        .from("compra_agil_radar_config")
        .update(failurePersistence(failure, completedAt))
        .eq("id", 1);
    }
    return json(failure, status);
  }
});
