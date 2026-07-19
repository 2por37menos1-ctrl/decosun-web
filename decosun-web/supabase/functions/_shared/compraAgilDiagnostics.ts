export type ScanStage =
  | "list"
  | "detail"
  | "database"
  | "authorization"
  | "config"
  | "runtime";
export type RequestType = "listing" | "detail";

export type ScanContext = {
  stage: ScanStage;
  requestType?: RequestType;
  requestNumber?: number;
  searchTerm?: string;
  pageNumber?: number;
  externalId?: string;
  upstreamStatus?: number;
};

export type SanitizedScanFailure = {
  success: false;
  ok: false;
  error_code: string;
  message: string;
  stage: ScanStage;
  request_number: number | null;
  request_type: RequestType | null;
  search_term: string | null;
  page_number: number | null;
  external_id: string | null;
  upstream_status: number | null;
  requests_used: number;
};

function safeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  // deno-lint-ignore no-control-regex
  const sanitized = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(
    /\s+/g,
    " ",
  ).trim();
  return sanitized ? sanitized.slice(0, maxLength) : null;
}

export function publicErrorMessage(errorCode: string, upstreamStatus?: number) {
  if (upstreamStatus && upstreamStatus >= 400) {
    return `Mercado Público respondió HTTP ${upstreamStatus} durante el escaneo.`;
  }
  const messages: Record<string, string> = {
    missing_authorization: "La solicitud no incluye una sesión válida.",
    invalid_authorization: "La sesión no es válida o expiró.",
    insufficient_permissions:
      "El usuario no tiene permisos para ejecutar el escaneo.",
    missing_mercado_publico_ticket:
      "El ticket de Mercado Público no está configurado.",
    radar_config_load_failed: "No se pudo cargar la configuración del Radar.",
    radar_search_terms_empty:
      "El Radar no tiene términos de búsqueda configurados.",
    radar_scan_state_update_failed:
      "No se pudo iniciar el registro del escaneo.",
    existing_opportunities_load_failed:
      "No se pudieron leer las oportunidades existentes.",
    opportunities_save_failed:
      "No se pudieron guardar las oportunidades normalizadas.",
    radar_watermark_update_failed:
      "El escaneo terminó, pero no se pudo actualizar su estado final.",
    request_budget_exhausted:
      "El escaneo alcanzó su límite interno de solicitudes.",
    upstream_request_failed:
      "No fue posible completar la solicitud a Mercado Público.",
    upstream_request_timeout:
      "Mercado Público no respondió dentro del tiempo permitido.",
    runtime_timeout: "La ejecución terminó antes de completar el escaneo.",
    scan_segment_busy: "Otro segmento del escaneo sigue en ejecución.",
    stale_scan_requires_resume:
      "La ejecución anterior quedó interrumpida y requiere reanudación explícita.",
    detail_attempt_limit_reached:
      "El detalle alcanzó el máximo de intentos manuales y requiere revisión.",
    scan_resume_required:
      "Existe un escaneo fallido reanudable. Debe continuarse de forma explícita.",
    invalid_upstream_payload:
      "Mercado Público devolvió una respuesta no interpretable.",
    upstream_response_not_ok:
      "Mercado Público devolvió una respuesta de aplicación no exitosa.",
  };
  return messages[errorCode] || "No se pudo completar el escaneo Compra Ágil.";
}

export class ScanError extends Error {
  status: number;
  context: ScanContext;

  constructor(
    errorCode: string,
    status = 500,
    context: ScanContext = { stage: "database" },
  ) {
    super(errorCode);
    this.name = "ScanError";
    this.status = status;
    this.context = context;
  }
}

export function upstreamScanError(
  errorCode: string,
  upstreamStatus: number,
  requestNumber: number,
  context: Omit<ScanContext, "requestNumber" | "upstreamStatus">,
) {
  return new ScanError(errorCode, upstreamStatus, {
    ...context,
    requestNumber,
    upstreamStatus,
  });
}

export function sanitizeScanFailure(
  error: unknown,
  requestsUsed: number,
): SanitizedScanFailure {
  const scanError = error instanceof ScanError ? error : null;
  const errorCode = scanError?.message || "internal_scan_error";
  const context = scanError?.context || { stage: "database" as const };
  const upstreamStatus = Number.isInteger(context.upstreamStatus)
    ? Number(context.upstreamStatus)
    : null;
  return {
    success: false,
    ok: false,
    error_code: errorCode,
    message: publicErrorMessage(errorCode, upstreamStatus || undefined),
    stage: context.stage,
    request_number: Number.isInteger(context.requestNumber)
      ? Number(context.requestNumber)
      : null,
    request_type: context.requestType || null,
    search_term: safeText(context.searchTerm, 120),
    page_number: Number.isInteger(context.pageNumber)
      ? Number(context.pageNumber)
      : null,
    external_id: safeText(context.externalId, 100),
    upstream_status: upstreamStatus,
    requests_used: Math.max(0, Number(requestsUsed) || 0),
  };
}

export function failurePersistence(
  failure: SanitizedScanFailure,
  completedAt: string,
) {
  return {
    last_scan_completed_at: completedAt,
    last_scan_status: "failed",
    last_scan_stats: {
      error_code: failure.error_code,
      stage: failure.stage,
      request_number: failure.request_number,
      request_type: failure.request_type,
      search_term: failure.search_term,
      page_number: failure.page_number,
      external_id: failure.external_id,
      upstream_status: failure.upstream_status,
      message: failure.message,
      requests_used: failure.requests_used,
    },
    last_error_code: failure.error_code,
    last_error_stage: failure.stage,
    last_error_request_number: failure.request_number,
    last_error_request_type: failure.request_type,
    last_error_search_term: failure.search_term,
    last_error_page_number: failure.page_number,
    last_error_external_id: failure.external_id,
    last_upstream_status: failure.upstream_status,
    last_error_message: failure.message,
    updated_at: completedAt,
  };
}

export const clearedFailureColumns = {
  last_error_code: null,
  last_error_stage: null,
  last_error_request_number: null,
  last_error_request_type: null,
  last_error_search_term: null,
  last_error_page_number: null,
  last_error_external_id: null,
  last_upstream_status: null,
  last_error_message: null,
};
