import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  failurePersistence,
  sanitizeScanFailure,
  upstreamScanError,
} from "./compraAgilDiagnostics.ts";
import { formatCompraAgilScanError } from "../../../src/lib/compraAgilError.js";

Deno.test("HTTP 500 listing failure is sanitized with precise request context", () => {
  const error = upstreamScanError("upstream_error", 500, 9, {
    stage: "list",
    requestType: "listing",
    searchTerm: "cortina roller",
    pageNumber: 1,
  });
  const failure = sanitizeScanFailure(error, 9);

  assertEquals(failure.error_code, "upstream_error");
  assertEquals(failure.stage, "list");
  assertEquals(failure.request_type, "listing");
  assertEquals(failure.request_number, 9);
  assertEquals(failure.search_term, "cortina roller");
  assertEquals(failure.page_number, 1);
  assertEquals(failure.external_id, null);
  assertEquals(failure.upstream_status, 500);
  assertEquals(failure.requests_used, 9);
  assertEquals(
    failure.message,
    "Mercado Público respondió HTTP 500 durante el escaneo.",
  );
});

Deno.test("HTTP 500 detail failure is sanitized with external id", () => {
  const error = upstreamScanError("upstream_error", 500, 12, {
    stage: "detail",
    requestType: "detail",
    externalId: "1057539-228-COT26",
  });
  const failure = sanitizeScanFailure(error, 12);

  assertEquals(failure.stage, "detail");
  assertEquals(failure.request_type, "detail");
  assertEquals(failure.request_number, 12);
  assertEquals(failure.external_id, "1057539-228-COT26");
  assertEquals(failure.search_term, null);
  assertEquals(failure.page_number, null);
  assertEquals(failure.upstream_status, 500);
});

Deno.test("failure persistence contains no watermark or credential fields", () => {
  const failure = sanitizeScanFailure(
    upstreamScanError("upstream_error", 500, 9, {
      stage: "list",
      requestType: "listing",
      searchTerm: "blackout",
      pageNumber: 2,
    }),
    9,
  );
  const persistence = failurePersistence(failure, "2026-07-17T12:00:00.000Z");
  const serialized = JSON.stringify({ failure, persistence });

  assert(!("last_successful_change_at" in persistence));
  assert(!serialized.toLowerCase().includes("authorization"));
  assert(!serialized.toLowerCase().includes("service_role"));
  assert(!serialized.toLowerCase().includes("headers"));
  assert(!serialized.toLowerCase().includes("jwt"));
  assert(!serialized.toLowerCase().includes("ticket"));
  assert(!serialized.includes("https://"));
});

Deno.test("frontend formats structured listing failure", () => {
  const message = formatCompraAgilScanError({
    message: "Mercado Público respondió HTTP 500 durante el escaneo.",
    stage: "list",
    search_term: "cortina roller",
    page_number: 1,
    request_number: 9,
  });

  assertEquals(
    message,
    [
      "No se pudo completar el escaneo.",
      "Mercado Público respondió HTTP 500 durante el escaneo.",
      "Etapa: listado.",
      "Término: cortina roller.",
      "Página: 1.",
      "Request: 9.",
    ].join("\n"),
  );
});

Deno.test("frontend retains a generic fallback without structured details", () => {
  assertEquals(
    formatCompraAgilScanError(null),
    "No se pudo ejecutar el escaneo Compra Ágil.",
  );
});
