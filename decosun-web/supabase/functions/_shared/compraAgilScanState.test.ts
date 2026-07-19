import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
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
} from "./compraAgilScanState.ts";
import {
  executeCompraAgilScan,
  initialScanRequest,
  isResumableScan,
  scanButtonLabel,
} from "../../../src/lib/compraAgilScanClient.js";
import {
  clearedFailureColumns,
  failurePersistence,
  sanitizeScanFailure,
  ScanError,
} from "./compraAgilDiagnostics.ts";

const migrationUrl = new URL(
  "../../migrations/20260718120000_compra_agil_segmented_scans.sql",
  import.meta.url,
);
const detailMigrationUrl = new URL(
  "../../migrations/20260718130000_compra_agil_detail_timeout_attempts.sql",
  import.meta.url,
);
const edgeFunctionUrl = new URL(
  "../escanear-compra-agil/index.ts",
  import.meta.url,
);

Deno.test("external fetch timeout aborts without retrying", async () => {
  let calls = 0;
  const fetcher = ((_input: string | URL, init?: RequestInit) => {
    calls += 1;
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("aborted", "AbortError")),
      );
    });
  }) as typeof fetch;

  await assertRejects(
    () => fetchWithTimeout("https://example.invalid", {}, 5, fetcher),
    DOMException,
    "aborted",
  );
  assertEquals(calls, 1);
});

Deno.test("listing cursor persists the exact next page", () => {
  assertEquals(nextListingCursor(2, 3, 5, 8), {
    termIndex: 2,
    pageNumber: 4,
    phase: "listing",
  });
});

Deno.test("listing cursor moves to the next term after its final page", () => {
  assertEquals(nextListingCursor(2, 5, 5, 8), {
    termIndex: 3,
    pageNumber: 1,
    phase: "listing",
  });
});

Deno.test("listing cursor enters detail only after every term", () => {
  assertEquals(nextListingCursor(7, 1, 1, 8), {
    termIndex: 8,
    pageNumber: 1,
    phase: "detail",
  });
});

Deno.test("segment stops preventively at its request budget", () => {
  const policy = segmentPolicy({ segment_max_requests: 12 });
  assert(shouldStopSegment({
    requestsUsed: 12,
    startedAtMs: 1_000,
    nowMs: 2_000,
    policy,
  }));
});

Deno.test("segment stops preventively at its duration budget", () => {
  const policy = segmentPolicy({ segment_max_duration_ms: 90_000 });
  assert(shouldStopSegment({
    requestsUsed: 1,
    startedAtMs: 1_000,
    nowMs: 91_000,
    policy,
  }));
});

Deno.test("sanitized progress preserves the resumable cursor", () => {
  assertEquals(
    safeRunProgress({
      id: "4a0f618c-14da-4b23-baa2-8ccf9bf80b99",
      status: "running",
      phase: "listing",
      stage: "listing",
      term_index: 3,
      current_term: "persianas",
      page_number: 2,
      requests_used: 9,
      pages_consulted: 8,
      unique_candidates: 41,
    }),
    {
      scan_run_id: "4a0f618c-14da-4b23-baa2-8ccf9bf80b99",
      scan_completed: false,
      status: "running",
      phase: "listing",
      stage: "listing",
      term_index: 3,
      current_term: "persianas",
      page_number: 2,
      current_external_id: null,
      requests_used: 9,
      pages_consulted: 8,
      total_received: 0,
      unique_candidates: 41,
      details_consulted: 0,
      candidates_pending: 41,
      records_processed: 0,
      relevant: 0,
      excluded: 0,
      inserted: 0,
      updated: 0,
      heartbeat_at: null,
      cursor: null,
    },
  );
});

Deno.test("stale heartbeat is detected while a recent heartbeat is accepted", () => {
  const now = new Date("2026-07-18T12:10:00.000Z");
  assert(heartbeatIsStale("2026-07-18T12:00:00.000Z", now, 300));
  assertEquals(
    heartbeatIsStale("2026-07-18T12:09:00.000Z", now, 300),
    false,
  );
});

Deno.test("new run clears every diagnostic from the prior failure", () => {
  assertEquals(
    Object.values(clearedFailureColumns).every((value) => value === null),
    true,
  );
  assertEquals(Object.keys(clearedFailureColumns).length, 9);
});

Deno.test("failure persistence cannot advance the watermark", () => {
  const failure = sanitizeScanFailure(
    new ScanError("runtime_timeout", 500, { stage: "runtime" }),
    9,
  );
  const update = failurePersistence(failure, "2026-07-18T12:00:00.000Z");
  assertEquals("last_successful_change_at" in update, false);
  assertEquals(update.last_scan_status, "failed");
});

Deno.test("frontend continues the same run until the final segment", async () => {
  const bodies: unknown[] = [];
  const result = await executeCompraAgilScan({
    initialRequest: { action: "start" },
    invoke: (body: unknown) => {
      bodies.push(body);
      return Promise.resolve(
        bodies.length === 1
          ? {
            data: {
              success: true,
              scan_completed: false,
              scan_run_id: "run-1",
              progress: {},
            },
            error: null,
          }
          : {
            data: {
              success: true,
              scan_completed: true,
              scan_run_id: "run-1",
              progress: {},
            },
            error: null,
          },
      );
    },
  });
  assertEquals(result.error, null);
  assertEquals(bodies, [
    { action: "start" },
    { action: "continue", scan_run_id: "run-1" },
  ]);
});

Deno.test("frontend stops chaining immediately on a segment failure", async () => {
  let calls = 0;
  const result = await executeCompraAgilScan({
    initialRequest: { action: "start" },
    invoke: () => {
      calls += 1;
      return Promise.resolve({
        data: { success: false, error_code: "upstream_error" },
        error: new Error("FunctionsHttpError"),
      });
    },
  });
  assert(result.error);
  assertEquals(calls, 1);
});

Deno.test("frontend resumes the persisted run after reload", () => {
  assertEquals(
    initialScanRequest({
      current_scan_run_id: "run-2",
      last_scan_status: "failed",
    }),
    { action: "resume", scan_run_id: "run-2" },
  );
  assertEquals(
    initialScanRequest({
      current_scan_run_id: "run-2",
      last_scan_status: "running",
    }),
    { action: "continue", scan_run_id: "run-2" },
  );
});

Deno.test("migration makes listing persistence atomic and candidate keys idempotent", async () => {
  const sql = await Deno.readTextFile(migrationUrl);
  assert(sql.includes("primary key (scan_run_id, external_id)"));
  assert(sql.includes("on conflict (scan_run_id, external_id) do update"));
  assert(sql.includes("compra_agil_persist_listing_page"));
});

Deno.test("migration rejects concurrent active runs and segment leases", async () => {
  const sql = await Deno.readTextFile(migrationUrl);
  assert(sql.includes("idx_compra_agil_scan_runs_single_active"));
  assert(sql.includes("lease_expires_at < clock_timestamp()"));
  assert(sql.includes("scan_segment_lease_lost"));
});

Deno.test("watermark is updated only by the atomic finalizer", async () => {
  const sql = await Deno.readTextFile(migrationUrl);
  const occurrences = sql.match(/last_successful_change_at\s*=/g) || [];
  assertEquals(occurrences.length, 1);
  assert(sql.includes("compra_agil_finalize_scan"));
  assert(sql.includes("phase = 'finalize'"));
});

Deno.test("listing timeout remains 15 seconds and detail timeout is 30 seconds", () => {
  const policy = segmentPolicy({
    external_request_timeout_ms: 15_000,
    detail_request_timeout_ms: 30_000,
  });
  assertEquals(requestTimeoutMs("listing", policy), 15_000);
  assertEquals(requestTimeoutMs("detail", policy), 30_000);
  assertEquals(policy.maxDurationMs, 90_000);
  assertEquals(policy.maxRequests, 12);
});

Deno.test("detail attempt state permits only the second manual attempt", () => {
  assertEquals(detailAttemptState(1, 2), {
    attempts: 1,
    maximum: 2,
    canAttempt: true,
    nextAttempt: 2,
  });
  assertEquals(detailAttemptState(2, 2).canAttempt, false);
});

Deno.test("second detail timeout becomes a review-required failure", () => {
  assertEquals(
    requestFailureCode({
      timedOut: true,
      requestType: "detail",
      detailAttemptNumber: 2,
      maxDetailAttempts: 2,
    }),
    "detail_attempt_limit_reached",
  );
  assertEquals(
    requestFailureCode({
      timedOut: true,
      requestType: "listing",
      maxDetailAttempts: 2,
    }),
    "upstream_request_timeout",
  );
});

Deno.test("detail migration backfills the failed attempt and increments before fetch", async () => {
  const sql = await Deno.readTextFile(detailMigrationUrl);
  assert(sql.includes("candidate.external_id = run.last_error_external_id"));
  assert(sql.includes("detail_attempt_count = 1"));
  assert(sql.includes("detail_attempt_count = detail_attempt_count + 1"));
  assert(sql.includes("candidate.processed = false"));
});

Deno.test("resume selects pending candidates and preserves completed work", async () => {
  const source = await Deno.readTextFile(edgeFunctionUrl);
  assert(source.includes('.eq("processed", false)'));
  assert(source.includes('.order("external_id", { ascending: true })'));
  assert(source.includes('requested.action !== "resume"'));
  assert(source.includes("current_scan_run_id"));
});

Deno.test("failed resumable run shows one explicit resume action", () => {
  const config = {
    current_scan_run_id: "run-failed",
    last_scan_status: "failed",
    last_error_code: "upstream_request_timeout",
  };
  const run = {
    status: "failed",
    last_error_code: "upstream_request_timeout",
  };
  assert(isResumableScan(config, run));
  assertEquals(scanButtonLabel(config, run), "Reanudar escaneo");
  assertEquals(initialScanRequest(config, run), {
    action: "resume",
    scan_run_id: "run-failed",
  });
});

Deno.test("review-required run cannot start a replacement scan", async () => {
  const config = {
    current_scan_run_id: "run-failed",
    last_scan_status: "failed",
    last_error_code: "detail_attempt_limit_reached",
  };
  const run = {
    status: "failed",
    last_error_code: "detail_attempt_limit_reached",
  };
  assertEquals(scanButtonLabel(config, run), "Revisión requerida");
  const request = initialScanRequest(config, run);
  assertEquals(request, { action: "blocked", scan_run_id: "run-failed" });
  let calls = 0;
  const result = await executeCompraAgilScan({
    initialRequest: request,
    invoke: () => {
      calls += 1;
      return Promise.resolve({ data: null, error: null });
    },
  });
  assertEquals(calls, 0);
  assertEquals(result.error?.message, "detail_attempt_limit_reached");
});

Deno.test("detail failure leaves cursor and watermark untouched and releases lease", async () => {
  const segmentedSql = await Deno.readTextFile(migrationUrl);
  const detailSql = await Deno.readTextFile(detailMigrationUrl);
  assertEquals(detailSql.includes("last_successful_change_at"), false);
  assertEquals(detailSql.includes("cursor ="), false);
  assert(segmentedSql.includes("lease_token = null"));
  assert(segmentedSql.includes("lease_expires_at = null"));
});
