export type ScanPhase = "listing" | "detail" | "finalize";

export type SegmentPolicy = {
  maxRequests: number;
  maxDurationMs: number;
  listingTimeoutMs: number;
  detailTimeoutMs: number;
  maxDetailAttempts: number;
  staleHeartbeatSeconds: number;
};

export type ListingCursor = {
  termIndex: number;
  pageNumber: number;
  phase: ScanPhase;
};

export const DEFAULT_SEGMENT_POLICY: SegmentPolicy = {
  maxRequests: 12,
  maxDurationMs: 90_000,
  listingTimeoutMs: 15_000,
  detailTimeoutMs: 30_000,
  maxDetailAttempts: 2,
  staleHeartbeatSeconds: 300,
};

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

export function segmentPolicy(config: Record<string, unknown>): SegmentPolicy {
  return {
    maxRequests: boundedInteger(
      config.segment_max_requests,
      DEFAULT_SEGMENT_POLICY.maxRequests,
      1,
      100,
    ),
    maxDurationMs: boundedInteger(
      config.segment_max_duration_ms,
      DEFAULT_SEGMENT_POLICY.maxDurationMs,
      10_000,
      120_000,
    ),
    listingTimeoutMs: boundedInteger(
      config.external_request_timeout_ms,
      DEFAULT_SEGMENT_POLICY.listingTimeoutMs,
      1_000,
      60_000,
    ),
    detailTimeoutMs: boundedInteger(
      config.detail_request_timeout_ms,
      DEFAULT_SEGMENT_POLICY.detailTimeoutMs,
      1_000,
      60_000,
    ),
    maxDetailAttempts: boundedInteger(
      config.max_detail_attempts,
      DEFAULT_SEGMENT_POLICY.maxDetailAttempts,
      1,
      5,
    ),
    staleHeartbeatSeconds: boundedInteger(
      config.stale_heartbeat_seconds,
      DEFAULT_SEGMENT_POLICY.staleHeartbeatSeconds,
      60,
      3_600,
    ),
  };
}

export function requestTimeoutMs(
  requestType: "listing" | "detail" | undefined,
  policy: SegmentPolicy,
) {
  return requestType === "detail"
    ? policy.detailTimeoutMs
    : policy.listingTimeoutMs;
}

export function detailAttemptState(
  attemptCount: unknown,
  maxAttempts: unknown,
) {
  const attempts = Math.max(0, Number(attemptCount) || 0);
  const maximum = Math.max(1, Number(maxAttempts) || 2);
  return {
    attempts,
    maximum,
    canAttempt: attempts < maximum,
    nextAttempt: attempts + 1,
  };
}

export function requestFailureCode(options: {
  timedOut: boolean;
  requestType: "listing" | "detail" | undefined;
  detailAttemptNumber?: number;
  maxDetailAttempts: number;
}) {
  if (!options.timedOut) return "upstream_request_failed";
  if (
    options.requestType === "detail" &&
    Number(options.detailAttemptNumber || 0) >= options.maxDetailAttempts
  ) {
    return "detail_attempt_limit_reached";
  }
  return "upstream_request_timeout";
}

export function shouldStopSegment(options: {
  requestsUsed: number;
  startedAtMs: number;
  nowMs: number;
  policy: SegmentPolicy;
}) {
  const { requestsUsed, startedAtMs, nowMs, policy } = options;
  return requestsUsed >= policy.maxRequests ||
    nowMs - startedAtMs >= policy.maxDurationMs;
}

export function nextListingCursor(
  termIndex: number,
  pageNumber: number,
  totalPages: number,
  termCount: number,
): ListingCursor {
  if (pageNumber < totalPages) {
    return { termIndex, pageNumber: pageNumber + 1, phase: "listing" };
  }
  if (termIndex + 1 < termCount) {
    return { termIndex: termIndex + 1, pageNumber: 1, phase: "listing" };
  }
  return { termIndex: termCount, pageNumber: 1, phase: "detail" };
}

export function heartbeatIsStale(
  heartbeatAt: string | null | undefined,
  now: Date,
  staleHeartbeatSeconds: number,
) {
  if (!heartbeatAt) return true;
  const heartbeatMs = new Date(heartbeatAt).getTime();
  if (Number.isNaN(heartbeatMs)) return true;
  return now.getTime() - heartbeatMs > staleHeartbeatSeconds * 1_000;
}

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit,
  timeoutMs: number,
  fetcher: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function safeRunProgress(run: Record<string, unknown>) {
  return {
    scan_run_id: String(run.id || ""),
    scan_completed: run.status === "success",
    status: String(run.status || "running"),
    phase: String(run.phase || "listing"),
    stage: String(run.current_stage || run.phase || "listing"),
    term_index: Math.max(0, Number(run.term_index) || 0),
    current_term: typeof run.current_term === "string"
      ? run.current_term.slice(0, 120)
      : null,
    page_number: Math.max(1, Number(run.page_number) || 1),
    current_external_id: typeof run.current_external_id === "string"
      ? run.current_external_id.slice(0, 100)
      : null,
    requests_used: Math.max(0, Number(run.requests_used) || 0),
    pages_consulted: Math.max(0, Number(run.pages_consulted) || 0),
    total_received: Math.max(0, Number(run.total_received) || 0),
    unique_candidates: Math.max(0, Number(run.unique_candidates) || 0),
    details_consulted: Math.max(0, Number(run.details_consulted) || 0),
    candidates_pending: Math.max(
      0,
      (Number(run.unique_candidates) || 0) -
        (Number(run.records_processed) || 0),
    ),
    records_processed: Math.max(0, Number(run.records_processed) || 0),
    relevant: Math.max(0, Number(run.relevant) || 0),
    excluded: Math.max(0, Number(run.excluded) || 0),
    inserted: Math.max(0, Number(run.inserted) || 0),
    updated: Math.max(0, Number(run.updated) || 0),
    heartbeat_at: run.heartbeat_at || null,
    cursor: run.cursor && typeof run.cursor === "object" ? run.cursor : null,
  };
}
