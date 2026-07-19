export const DEFAULT_MAX_SCAN_SEGMENTS = 100;

export function isResumableScan(config, run) {
  const runId = config?.current_scan_run_id || null;
  const failed = config?.last_scan_status === "failed" ||
    run?.status === "failed";
  const errorCode = run?.last_error_code || config?.last_error_code || null;
  return Boolean(
    runId && failed && errorCode !== "detail_attempt_limit_reached",
  );
}

export function scanButtonLabel(config, run, scanning = false) {
  if (scanning) return "Escaneando...";
  if (isResumableScan(config, run)) return "Reanudar escaneo";
  if (
    config?.current_scan_run_id &&
    config?.last_scan_status === "failed" &&
    (run?.last_error_code || config?.last_error_code) ===
      "detail_attempt_limit_reached"
  ) {
    return "Revisión requerida";
  }
  return "Escanear Compra Ágil";
}

export function initialScanRequest(config, run) {
  const runId = config?.current_scan_run_id || null;
  if (runId && config?.last_scan_status === "failed") {
    if (!isResumableScan(config, run)) {
      return { action: "blocked", scan_run_id: runId };
    }
    return { action: "resume", scan_run_id: runId };
  }
  if (runId && config?.last_scan_status === "running") {
    return { action: "continue", scan_run_id: runId };
  }
  return { action: "start" };
}

export async function executeCompraAgilScan(options) {
  const {
    invoke,
    initialRequest,
    onProgress = () => {},
    maxSegments = DEFAULT_MAX_SCAN_SEGMENTS,
  } = options;
  let request = initialRequest;

  if (request?.action === "blocked") {
    return {
      data: null,
      error: new Error("detail_attempt_limit_reached"),
      segment: 0,
    };
  }

  for (let segment = 1; segment <= maxSegments; segment += 1) {
    const result = await invoke(request);
    const data = result?.data;
    if (result?.error || data?.success === false || data?.ok === false) {
      return { ...result, segment };
    }
    if (!data || typeof data !== "object") {
      return {
        data: null,
        error: new Error("invalid_segment_response"),
        segment,
      };
    }

    onProgress({ ...data.progress, segment });
    if (data.scan_completed === true) return { data, error: null, segment };
    if (!data.scan_run_id) {
      return {
        data,
        error: new Error("missing_scan_run_id"),
        segment,
      };
    }
    request = { action: "continue", scan_run_id: data.scan_run_id };
  }

  return {
    data: null,
    error: new Error("scan_segment_limit_reached"),
    segment: maxSegments,
  };
}
