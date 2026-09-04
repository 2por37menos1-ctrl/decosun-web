import {
  type ScanContext,
  ScanError,
  upstreamScanError,
} from "./compraAgilDiagnostics.ts";
import { mapHttpError } from "./compraAgilV2.ts";
import { fetchWithTimeout, requestFailureCode } from "./compraAgilScanState.ts";

export const TRANSIENT_UPSTREAM_STATUSES = new Set([500, 502, 503, 504]);
export const MAX_UPSTREAM_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = [500, 1_500] as const;

type SafeLog = {
  event: "compra_agil_upstream_request" | "compra_agil_upstream_retry";
  endpoint: string;
  query_params: Record<string, string>;
  stage: ScanContext["stage"];
  request_type: ScanContext["requestType"] | null;
  search_term: string | null;
  page_number: number | null;
  external_id: string | null;
  request_number: number;
  attempt: number;
  retry_count: number;
  upstream_status?: number;
  backoff_ms?: number;
};

type RetryOptions = {
  url: URL;
  headers: HeadersInit;
  context: ScanContext;
  timeoutMs: number;
  beforeAttempt: (attempt: number) => Promise<number>;
  detailAttemptNumber?: number;
  maxDetailAttempts?: number;
  fetcher?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  log?: (entry: SafeLog) => void;
};

const SAFE_QUERY_PARAMETERS = new Set([
  "estado",
  "q",
  "tamano_pagina",
  "numero_pagina",
  "ordenar_por",
  "region",
  "cambio_desde",
  "cambio_hasta",
  "publicado_desde",
  "publicado_hasta",
]);

export function safeUpstreamRequestLog(
  url: URL,
  context: ScanContext,
  requestNumber: number,
  attempt: number,
): SafeLog {
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (SAFE_QUERY_PARAMETERS.has(key)) queryParams[key] = value;
  });
  return {
    event: "compra_agil_upstream_request",
    endpoint: `${url.origin}${url.pathname}`,
    query_params: queryParams,
    stage: context.stage,
    request_type: context.requestType || null,
    search_term: context.searchTerm || null,
    page_number: context.pageNumber || null,
    external_id: context.externalId || null,
    request_number: requestNumber,
    attempt,
    retry_count: attempt - 1,
  };
}

export async function fetchCompraAgilWithRetry(options: RetryOptions) {
  const fetcher = options.fetcher || fetch;
  const sleep = options.sleep ||
    ((milliseconds) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const log = options.log || ((entry) => console.info(JSON.stringify(entry)));

  for (let attempt = 1; attempt <= MAX_UPSTREAM_ATTEMPTS; attempt += 1) {
    const requestNumber = await options.beforeAttempt(attempt);
    const requestLog = safeUpstreamRequestLog(
      options.url,
      options.context,
      requestNumber,
      attempt,
    );
    log(requestLog);

    let response: Response;
    try {
      response = await fetchWithTimeout(
        options.url,
        { headers: options.headers },
        options.timeoutMs,
        fetcher,
      );
    } catch (error) {
      const timeout = error instanceof DOMException &&
        error.name === "AbortError";
      throw new ScanError(
        requestFailureCode({
          timedOut: timeout,
          requestType: options.context.requestType,
          detailAttemptNumber: options.detailAttemptNumber,
          maxDetailAttempts: options.maxDetailAttempts ?? 2,
        }),
        timeout ? 504 : 502,
        { ...options.context, requestNumber },
      );
    }

    if (response.ok) {
      return { response, requestNumber, retryCount: attempt - 1 };
    }

    const canRetry = TRANSIENT_UPSTREAM_STATUSES.has(response.status) &&
      attempt < MAX_UPSTREAM_ATTEMPTS;
    if (!canRetry) {
      throw upstreamScanError(
        mapHttpError(response.status),
        response.status,
        requestNumber,
        { ...options.context, retryCount: attempt - 1 },
      );
    }

    const backoffMs = RETRY_BACKOFF_MS[attempt - 1];
    log({
      ...requestLog,
      event: "compra_agil_upstream_retry",
      upstream_status: response.status,
      backoff_ms: backoffMs,
    });
    await sleep(backoffMs);
  }

  throw new ScanError("upstream_error", 500, options.context);
}
