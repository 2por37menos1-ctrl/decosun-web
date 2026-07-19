// @ts-nocheck: Supabase client rows are generated dynamically in the Edge runtime.
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
  detailAttemptState,
  fetchWithTimeout,
  heartbeatIsStale,
  nextListingCursor,
  requestFailureCode,
  requestTimeoutMs,
  safeRunProgress,
  segmentPolicy,
  shouldStopSegment,
} from "../_shared/compraAgilScanState.ts";
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

type ScanAction = "start" | "continue" | "resume";

function safeAction(
  body: unknown,
): { action: ScanAction; runId: string | null } {
  const value = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  const action = value.action === "continue" || value.action === "resume"
    ? value.action
    : "start";
  const runId = typeof value.scan_run_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(value.scan_run_id)
    ? value.scan_run_id
    : null;
  return { action, runId };
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

function runConfig(run: Record<string, unknown>) {
  return safeConfig(run);
}

function dateWindow(config: Record<string, unknown>, scanUntil: Date) {
  const lastSuccessful = config.last_successful_change_at
    ? new Date(String(config.last_successful_change_at))
    : null;
  if (lastSuccessful && !Number.isNaN(lastSuccessful.getTime())) {
    const overlapMs = Number(config.overlap_minutes || 10) * 60_000;
    return {
      mode: "incremental",
      from: new Date(lastSuccessful.getTime() - overlapMs).toISOString(),
      to: scanUntil.toISOString(),
    };
  }
  const lookbackMs = Number(config.initial_lookback_days || 14) * 86_400_000;
  return {
    mode: "initial",
    from: new Date(scanUntil.getTime() - lookbackMs).toISOString(),
    to: scanUntil.toISOString(),
  };
}

function listingUrl(
  run: Record<string, unknown>,
  term: string,
  pageNumber: number,
) {
  const url = new URL(API_BASE);
  url.searchParams.set("estado", "publicada");
  url.searchParams.set("q", term);
  url.searchParams.set("tamano_pagina", String(PAGE_SIZE));
  url.searchParams.set("numero_pagina", String(pageNumber));
  url.searchParams.set("ordenar_por", "FechaUltimaModificacion");
  const regions = Array.isArray(run.region_codes) ? run.region_codes : [];
  if (regions.length) url.searchParams.set("region", regions.join(","));
  if (run.window_mode === "incremental") {
    url.searchParams.set("cambio_desde", String(run.window_from));
    url.searchParams.set("cambio_hasta", String(run.window_to));
  } else {
    url.searchParams.set("publicado_desde", String(run.window_from));
    url.searchParams.set("publicado_hasta", String(run.window_to));
  }
  return url;
}

function scanStats(run: Record<string, unknown>) {
  return {
    mode: run.window_mode,
    window_from: run.window_from,
    window_to: run.window_to,
    pages_consulted: Number(run.pages_consulted) || 0,
    requests_used: Number(run.requests_used) || 0,
    total_received: Number(run.total_received) || 0,
    unique_candidates: Number(run.unique_candidates) || 0,
    details_consulted: Number(run.details_consulted) || 0,
    details_reused: Number(run.details_reused) || 0,
    detail_not_found: Number(run.detail_not_found) || 0,
    records_processed: Number(run.records_processed) || 0,
    relevant: Number(run.relevant) || 0,
    excluded: Number(run.excluded) || 0,
    inserted: Number(run.inserted) || 0,
    updated: Number(run.updated) || 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return json({ success: false, error_code: "method_not_allowed" }, 405);
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
  const requestBody = await req.json().catch(() => ({}));
  const requested = safeAction(requestBody);
  let runId: string | null = requested.runId;
  let run: Record<string, unknown> | null = null;
  let leaseToken: string | null = null;
  let leaseClaimed = false;
  let requestCount = 0;

  const loadRun = async (id: string) => {
    const { data, error } = await supabase
      .from("compra_agil_scan_runs")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      throw new ScanError("scan_run_not_found", 404, { stage: "config" });
    }
    return data as Record<string, unknown>;
  };

  const persistFailure = async (
    id: string,
    failure: ReturnType<typeof sanitizeScanFailure>,
  ) => {
    const completedAt = new Date().toISOString();
    const diagnostics = {
      last_error_code: failure.error_code,
      last_error_stage: failure.stage,
      last_error_request_number: failure.request_number,
      last_error_request_type: failure.request_type,
      last_error_search_term: failure.search_term,
      last_error_page_number: failure.page_number,
      last_error_external_id: failure.external_id,
      last_upstream_status: failure.upstream_status,
      last_error_message: failure.message,
    };
    await supabase.from("compra_agil_scan_runs").update({
      status: "failed",
      completed_at: completedAt,
      lease_token: null,
      lease_expires_at: null,
      heartbeat_at: completedAt,
      ...diagnostics,
      updated_at: completedAt,
    }).eq("id", id);
    await supabase.from("compra_agil_radar_config").update({
      ...failurePersistence(failure, completedAt),
      current_scan_run_id: id,
    }).eq("id", 1);
  };

  try {
    const { data: config, error: configError } = await supabase
      .from("compra_agil_radar_config")
      .select("*")
      .eq("id", 1)
      .single();
    if (configError || !config) {
      throw new ScanError("radar_config_load_failed", 500, { stage: "config" });
    }
    let policy = segmentPolicy(config);

    if (requested.action === "start") {
      if (config.current_scan_run_id) {
        const { data: current } = await supabase
          .from("compra_agil_scan_runs")
          .select("*")
          .eq("id", config.current_scan_run_id)
          .maybeSingle();
        if (current?.status === "running") {
          if (
            heartbeatIsStale(
              current.heartbeat_at,
              new Date(),
              segmentPolicy(current).staleHeartbeatSeconds,
            )
          ) {
            const staleError = new ScanError("runtime_timeout", 409, {
              stage: "runtime",
            });
            const failure = sanitizeScanFailure(
              staleError,
              Number(current.requests_used) || 0,
            );
            await persistFailure(String(current.id), failure);
            return json({
              ...failure,
              scan_run_id: current.id,
              resumable: true,
            }, 409);
          }
          const activeError = new ScanError("scan_already_running", 409, {
            stage: "runtime",
          });
          return json({
            ...sanitizeScanFailure(
              activeError,
              Number(current.requests_used) || 0,
            ),
            scan_run_id: current.id,
            progress: safeRunProgress(current),
          }, 409);
        }
        if (current?.status === "failed") {
          const resumable = current.last_error_code !==
            "detail_attempt_limit_reached";
          const resumeError = new ScanError(
            resumable ? "scan_resume_required" : "detail_attempt_limit_reached",
            409,
            {
              stage: resumable ? "runtime" : "detail",
              requestType: resumable ? undefined : "detail",
              externalId: current.last_error_external_id ||
                current.current_external_id || undefined,
            },
          );
          return json({
            ...sanitizeScanFailure(
              resumeError,
              Number(current.requests_used) || 0,
            ),
            scan_run_id: current.id,
            resumable,
            progress: safeRunProgress(current),
          }, 409);
        }
      }

      const radarConfig = safeConfig(config);
      if (!radarConfig.search_terms.length) {
        throw new ScanError("radar_search_terms_empty", 400, {
          stage: "config",
        });
      }
      const scanUntil = new Date();
      const window = dateWindow(config, scanUntil);
      const { data: created, error: createError } = await supabase
        .from("compra_agil_scan_runs")
        .insert({
          status: "running",
          phase: "listing",
          scan_until: scanUntil.toISOString(),
          window_mode: window.mode,
          window_from: window.from,
          window_to: window.to,
          ...radarConfig,
          max_requests_per_scan: Number(config.max_requests_per_scan || 500),
          external_request_timeout_ms: policy.listingTimeoutMs,
          detail_request_timeout_ms: policy.detailTimeoutMs,
          max_detail_attempts: policy.maxDetailAttempts,
          segment_max_requests: policy.maxRequests,
          segment_max_duration_ms: policy.maxDurationMs,
          stale_heartbeat_seconds: policy.staleHeartbeatSeconds,
          current_term: radarConfig.search_terms[0],
        })
        .select("*")
        .single();
      if (createError || !created) {
        const code = createError?.code === "23505"
          ? "scan_already_running"
          : "scan_run_create_failed";
        throw new ScanError(code, code === "scan_already_running" ? 409 : 500, {
          stage: code === "scan_already_running" ? "runtime" : "database",
        });
      }
      run = created;
      runId = String(created.id);
      const startedAt = new Date().toISOString();
      const { error: startError } = await supabase
        .from("compra_agil_radar_config")
        .update({
          current_scan_run_id: runId,
          last_scan_started_at: startedAt,
          last_scan_completed_at: null,
          last_scan_status: "running",
          last_scan_stats: safeRunProgress(created),
          ...clearedFailureColumns,
          updated_at: startedAt,
        })
        .eq("id", 1);
      if (startError) {
        throw new ScanError("radar_scan_state_update_failed", 500, {
          stage: "database",
        });
      }
    } else {
      if (!runId) {
        throw new ScanError("scan_run_id_required", 400, { stage: "config" });
      }
      run = await loadRun(runId);
      if (
        config.current_scan_run_id &&
        String(config.current_scan_run_id) !== runId
      ) {
        throw new ScanError("scan_run_not_current", 409, {
          stage: "runtime",
        });
      }
      if (run.status === "success") {
        return json({
          success: true,
          ok: true,
          scan_completed: true,
          ...scanStats(run),
          progress: safeRunProgress(run),
        });
      }
      if (run.status === "failed") {
        if (requested.action !== "resume") {
          throw new ScanError("scan_resume_required", 409, {
            stage: "runtime",
          });
        }
        if (run.last_error_code === "detail_attempt_limit_reached") {
          const limitError = new ScanError(
            "detail_attempt_limit_reached",
            409,
            {
              stage: "detail",
              requestType: "detail",
              externalId: String(
                run.last_error_external_id || run.current_external_id || "",
              ) || undefined,
            },
          );
          return json({
            ...sanitizeScanFailure(
              limitError,
              Number(run.requests_used) || 0,
            ),
            scan_run_id: runId,
            resumable: false,
            progress: safeRunProgress(run),
          }, 409);
        }
        const resumedAt = new Date().toISOString();
        const { error: resumeError } = await supabase
          .from("compra_agil_scan_runs")
          .update({
            status: "running",
            completed_at: null,
            heartbeat_at: resumedAt,
            ...clearedFailureColumns,
            updated_at: resumedAt,
          })
          .eq("id", runId)
          .eq("status", "failed");
        if (resumeError) {
          throw new ScanError("scan_resume_failed", 409, { stage: "runtime" });
        }
        await supabase.from("compra_agil_radar_config").update({
          current_scan_run_id: runId,
          last_scan_status: "running",
          last_scan_completed_at: null,
          last_scan_stats: safeRunProgress({
            ...run,
            status: "running",
            heartbeat_at: resumedAt,
          }),
          ...clearedFailureColumns,
          updated_at: resumedAt,
        }).eq("id", 1);
        run = await loadRun(runId);
      } else if (
        heartbeatIsStale(
          run.heartbeat_at as string,
          new Date(),
          segmentPolicy(run).staleHeartbeatSeconds,
        )
      ) {
        const staleError = new ScanError("runtime_timeout", 409, {
          stage: "runtime",
        });
        const failure = sanitizeScanFailure(
          staleError,
          Number(run.requests_used) || 0,
        );
        await persistFailure(runId, failure);
        return json({ ...failure, scan_run_id: runId, resumable: true }, 409);
      }
    }

    if (!run || !runId) {
      throw new ScanError("scan_run_not_found", 404, { stage: "config" });
    }
    policy = segmentPolicy(run);
    requestCount = Number(run.requests_used) || 0;
    leaseToken = crypto.randomUUID();
    const leaseSeconds = Math.ceil(
      (policy.maxDurationMs +
        Math.max(policy.listingTimeoutMs, policy.detailTimeoutMs) + 30_000) /
        1_000,
    );
    const { data: claimed, error: claimError } = await supabase.rpc(
      "compra_agil_claim_segment",
      {
        p_run_id: runId,
        p_lease_token: leaseToken,
        p_lease_seconds: leaseSeconds,
      },
    );
    if (claimError || !claimed) {
      throw new ScanError("scan_segment_busy", 409, { stage: "runtime" });
    }
    leaseClaimed = true;
    run = await loadRun(runId);
    const segmentStartedAt = Date.now();
    let segmentRequests = 0;
    const maximumTotalRequests = Number(run.max_requests_per_scan || 500);

    const apiGet = async (
      url: URL,
      context: ScanContext,
      detailAttemptNumber = 0,
    ) => {
      if (requestCount >= maximumTotalRequests) {
        throw new ScanError("request_budget_exhausted", 429, context);
      }
      const { data: number, error: beginError } = await supabase.rpc(
        "compra_agil_begin_request",
        {
          p_run_id: runId,
          p_lease_token: leaseToken,
          p_stage: context.stage,
          p_request_type: context.requestType,
          p_search_term: context.searchTerm || null,
          p_page_number: context.pageNumber || null,
          p_external_id: context.externalId || null,
        },
      );
      if (beginError || !Number.isInteger(number)) {
        throw new ScanError("scan_progress_update_failed", 500, {
          stage: "database",
        });
      }
      requestCount = Number(number);
      segmentRequests += 1;
      let response: Response;
      const timeoutMs = requestTimeoutMs(context.requestType, policy);
      try {
        response = await fetchWithTimeout(url, {
          headers: { accept: "application/json", ticket },
        }, timeoutMs);
      } catch (error) {
        const timeout = error instanceof DOMException &&
          error.name === "AbortError";
        throw new ScanError(
          requestFailureCode({
            timedOut: timeout,
            requestType: context.requestType,
            detailAttemptNumber,
            maxDetailAttempts: policy.maxDetailAttempts,
          }),
          timeout ? 504 : 502,
          { ...context, requestNumber: requestCount },
        );
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
        const errorCode = error instanceof Error &&
            error.message === "upstream_response_not_ok"
          ? "upstream_response_not_ok"
          : "invalid_upstream_payload";
        throw new ScanError(errorCode, 502, {
          ...context,
          requestNumber: requestCount,
          upstreamStatus: response.status,
        });
      }
    };

    while (
      !shouldStopSegment({
        requestsUsed: segmentRequests,
        startedAtMs: segmentStartedAt,
        nowMs: Date.now(),
        policy,
      })
    ) {
      if (run.phase === "listing") {
        const searchTerms = Array.isArray(run.search_terms)
          ? run.search_terms.map(String)
          : [];
        const termIndex = Number(run.term_index) || 0;
        if (termIndex >= searchTerms.length) {
          const { error } = await supabase.from("compra_agil_scan_runs")
            .update({
              phase: "detail",
              current_stage: "detail",
              page_number: 1,
              cursor: { phase: "detail" },
            })
            .eq("id", runId).eq("lease_token", leaseToken);
          if (error) {
            throw new ScanError("scan_progress_update_failed", 500, {
              stage: "database",
            });
          }
          run = await loadRun(runId);
          continue;
        }
        const term = searchTerms[termIndex];
        const pageNumber = Number(run.page_number) || 1;
        const payload = await apiGet(listingUrl(run, term, pageNumber), {
          stage: "list",
          requestType: "listing",
          searchTerm: term,
          pageNumber,
        });
        const items = Array.isArray(payload.items) ? payload.items : [];
        const pagination = payload.paginacion &&
            typeof payload.paginacion === "object"
          ? payload.paginacion as Record<string, unknown>
          : {};
        const totalPages = Math.max(1, Number(pagination.total_paginas || 1));
        if (!Number.isFinite(totalPages) || totalPages > 10_000) {
          throw new ScanError("invalid_pagination_metadata", 502, {
            stage: "list",
            requestType: "listing",
            requestNumber: requestCount,
            searchTerm: term,
            pageNumber,
          });
        }
        const normalizedCandidates = [];
        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const record = normalizeListItem(item, {
            scannedAt: new Date(String(run.scan_until)),
            discoveryTerms: [term],
          });
          if (!record) continue;
          normalizedCandidates.push({
            external_id: record.external_id,
            list_item: item,
            discovery_term: term,
            preliminary_reason: preliminaryExclusion(
              record,
              runConfig(run),
              new Date(String(run.scan_until)),
            ),
          });
        }
        const cursor = nextListingCursor(
          termIndex,
          pageNumber,
          totalPages,
          searchTerms.length,
        );
        const { error: persistError } = await supabase.rpc(
          "compra_agil_persist_listing_page",
          {
            p_run_id: runId,
            p_lease_token: leaseToken,
            p_candidates: normalizedCandidates,
            p_received: items.length,
            p_next_term_index: cursor.termIndex,
            p_next_page_number: cursor.pageNumber,
            p_next_phase: cursor.phase,
          },
        );
        if (persistError) {
          throw new ScanError("scan_progress_update_failed", 500, {
            stage: "database",
          });
        }
        run = await loadRun(runId);
        continue;
      }

      if (run.phase === "detail") {
        const { data: candidate, error: candidateError } = await supabase
          .from("compra_agil_scan_candidates")
          .select("*")
          .eq("scan_run_id", runId)
          .eq("processed", false)
          .order("external_id", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (candidateError) {
          throw new ScanError("scan_candidates_load_failed", 500, {
            stage: "database",
          });
        }
        if (!candidate) {
          const { error } = await supabase.from("compra_agil_scan_runs")
            .update({
              phase: "finalize",
              current_stage: "finalize",
              current_external_id: null,
              cursor: { phase: "finalize" },
            })
            .eq("id", runId).eq("lease_token", leaseToken);
          if (error) {
            throw new ScanError("scan_progress_update_failed", 500, {
              stage: "database",
            });
          }
          run = await loadRun(runId);
          continue;
        }

        const externalId = String(candidate.external_id);
        const { data: existing, error: existingError } = await supabase
          .from("compra_agil_opportunities")
          .select("*")
          .eq("external_id", externalId)
          .maybeSingle();
        if (existingError) {
          throw new ScanError("existing_opportunities_load_failed", 500, {
            stage: "database",
          });
        }
        let wasExisting = candidate.was_existing;
        if (wasExisting === null || wasExisting === undefined) {
          wasExisting = Boolean(existing);
          const { error } = await supabase
            .from("compra_agil_scan_candidates")
            .update({
              was_existing: wasExisting,
              updated_at: new Date().toISOString(),
            })
            .eq("scan_run_id", runId)
            .eq("external_id", externalId)
            .is("was_existing", null);
          if (error) {
            throw new ScanError("scan_progress_update_failed", 500, {
              stage: "database",
            });
          }
        }

        if (existing?.scanned_at === run.scan_until) {
          const { data: completed, error } = await supabase.rpc(
            "compra_agil_complete_candidate",
            {
              p_run_id: runId,
              p_lease_token: leaseToken,
              p_external_id: externalId,
              p_relevant: Boolean(existing.is_relevant),
              p_inserted: !wasExisting,
              p_detail_consulted: Boolean(candidate.detail_requested),
              p_detail_reused: false,
              p_detail_not_found: Boolean(candidate.detail_not_found),
            },
          );
          if (error || !completed) {
            throw new ScanError("scan_progress_update_failed", 500, {
              stage: "database",
            });
          }
          run = await loadRun(runId);
          continue;
        }

        let record = normalizeListItem(candidate.list_item, {
          scannedAt: new Date(String(run.scan_until)),
          discoveryTerms: candidate.discovery_terms || [],
        });
        if (!record) {
          throw new ScanError("invalid_stored_candidate", 500, {
            stage: "database",
          });
        }
        const radarConfig = runConfig(run);
        const scanUntil = new Date(String(run.scan_until));
        const preliminaryReason = preliminaryExclusion(
          record,
          radarConfig,
          scanUntil,
        );
        let detailConsulted = false;
        let detailReused = false;
        let detailNotFound = false;

        if (!preliminaryReason && shouldFetchDetail(existing, record)) {
          const attempt = detailAttemptState(
            candidate.detail_attempt_count,
            policy.maxDetailAttempts,
          );
          if (!attempt.canAttempt) {
            throw new ScanError("detail_attempt_limit_reached", 409, {
              stage: "detail",
              requestType: "detail",
              externalId,
            });
          }
          const detailUrl = new URL(
            `${API_BASE}/${encodeURIComponent(externalId)}`,
          );
          try {
            const detail = await apiGet(detailUrl, {
              stage: "detail",
              requestType: "detail",
              externalId,
            }, attempt.nextAttempt);
            record = mergeDetail(record, detail, scanUntil);
            if (existing) record = preserveExistingRecord(existing, record);
            detailConsulted = true;
          } catch (error) {
            if (
              error instanceof ScanError &&
              error.message === "opportunity_not_found"
            ) {
              detailNotFound = true;
              await supabase.from("compra_agil_scan_candidates").update({
                detail_not_found: true,
                updated_at: new Date().toISOString(),
              }).eq("scan_run_id", runId).eq("external_id", externalId);
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
        } else if (existing) {
          record = preserveExistingRecord(existing, record);
          if (!preliminaryReason) detailReused = true;
        }

        if (record.exclusion_reason !== "detail_not_found") {
          record = evaluateOpportunity(record, radarConfig, scanUntil);
        }
        if (existing?.review_status) {
          record.review_status = String(existing.review_status);
        }
        const { error: saveError } = await supabase
          .from("compra_agil_opportunities")
          .upsert(record, { onConflict: "external_id" });
        if (saveError) {
          throw new ScanError("opportunities_save_failed", 500, {
            stage: "database",
          });
        }
        const { data: completed, error: completeError } = await supabase.rpc(
          "compra_agil_complete_candidate",
          {
            p_run_id: runId,
            p_lease_token: leaseToken,
            p_external_id: externalId,
            p_relevant: Boolean(record.is_relevant),
            p_inserted: !wasExisting,
            p_detail_consulted: detailConsulted,
            p_detail_reused: detailReused,
            p_detail_not_found: detailNotFound,
          },
        );
        if (completeError || !completed) {
          throw new ScanError("scan_progress_update_failed", 500, {
            stage: "database",
          });
        }
        run = await loadRun(runId);
        continue;
      }

      if (run.phase === "finalize") {
        const stats = scanStats(run);
        const { error: finalizeError } = await supabase.rpc(
          "compra_agil_finalize_scan",
          { p_run_id: runId, p_lease_token: leaseToken, p_stats: stats },
        );
        if (finalizeError) {
          throw new ScanError("radar_watermark_update_failed", 500, {
            stage: "database",
          });
        }
        leaseClaimed = false;
        run = await loadRun(runId);
        return json({
          success: true,
          ok: true,
          scan_completed: true,
          scan_run_id: runId,
          ...stats,
          progress: safeRunProgress(run),
        });
      }
    }

    const { error: releaseError } = await supabase.rpc(
      "compra_agil_release_segment",
      { p_run_id: runId, p_lease_token: leaseToken },
    );
    if (releaseError) {
      throw new ScanError("scan_progress_update_failed", 500, {
        stage: "database",
      });
    }
    leaseClaimed = false;
    run = await loadRun(runId);
    await supabase.from("compra_agil_radar_config").update({
      last_scan_status: "running",
      last_scan_stats: safeRunProgress(run),
      updated_at: new Date().toISOString(),
    }).eq("id", 1).eq("current_scan_run_id", runId);
    return json({
      success: true,
      ok: true,
      scan_completed: false,
      scan_run_id: runId,
      ...scanStats(run),
      progress: safeRunProgress(run),
    });
  } catch (error) {
    const status = error instanceof ScanError ? error.status : 500;
    const failure = sanitizeScanFailure(error, requestCount);
    if (runId && failure.error_code !== "scan_segment_busy") {
      await persistFailure(runId, failure);
      leaseClaimed = false;
    }
    return json({
      ...failure,
      scan_run_id: runId,
      resumable: Boolean(runId) &&
        failure.error_code !== "detail_attempt_limit_reached",
    }, status);
  } finally {
    if (leaseClaimed && runId && leaseToken) {
      await supabase.rpc("compra_agil_release_segment", {
        p_run_id: runId,
        p_lease_token: leaseToken,
      });
    }
  }
});
