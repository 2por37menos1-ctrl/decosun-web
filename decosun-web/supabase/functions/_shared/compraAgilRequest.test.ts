import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { sanitizeScanFailure, ScanError } from "./compraAgilDiagnostics.ts";
import { fetchCompraAgilWithRetry } from "./compraAgilRequest.ts";

const url = new URL(
  "https://api2.mercadopublico.cl/v2/compra-agil?estado=publicada&q=cortinas+roller&tamano_pagina=50&numero_pagina=1",
);
const context = {
  stage: "list" as const,
  requestType: "listing" as const,
  searchTerm: "cortinas roller",
  pageNumber: 1,
};

function sequence(statuses: number[]) {
  let calls = 0;
  const fetcher = (() => {
    const status = statuses[calls] ?? statuses.at(-1) ?? 500;
    calls += 1;
    return Promise.resolve(new Response("{}", { status }));
  }) as typeof fetch;
  return { fetcher, calls: () => calls };
}

function options(fetcher: typeof fetch, logs: unknown[] = []) {
  let requestNumber = 0;
  return {
    url,
    headers: { accept: "application/json", ticket: "TOP-SECRET-TICKET" },
    context,
    timeoutMs: 100,
    fetcher,
    beforeAttempt: () => Promise.resolve(++requestNumber),
    sleep: () => Promise.resolve(),
    log: (entry: unknown) => logs.push(entry),
  };
}

Deno.test("HTTP 500 seguido de 200 se recupera", async () => {
  const mock = sequence([500, 200]);
  const result = await fetchCompraAgilWithRetry(options(mock.fetcher));
  assertEquals(result.response.status, 200);
  assertEquals(result.retryCount, 1);
  assertEquals(mock.calls(), 2);
});

Deno.test("HTTP 503 seguido de 200 se recupera", async () => {
  const mock = sequence([503, 200]);
  const result = await fetchCompraAgilWithRetry(options(mock.fetcher));
  assertEquals(result.retryCount, 1);
  assertEquals(mock.calls(), 2);
});

Deno.test("tres HTTP 500 terminan en upstream_error", async () => {
  const mock = sequence([500, 500, 500]);
  const error = await assertRejects(
    () => fetchCompraAgilWithRetry(options(mock.fetcher)),
    ScanError,
    "upstream_error",
  );
  assertEquals(mock.calls(), 3);
  assertEquals(error.context.upstreamStatus, 500);
  assertEquals(error.context.retryCount, 2);
  assertEquals(error.context.requestNumber, 3);
  const failure = sanitizeScanFailure(error, 3);
  assertEquals(failure.retry_count, 2);
  assertEquals(failure.request_number, 3);
});

for (const status of [400, 401]) {
  Deno.test(`HTTP ${status} no se reintenta`, async () => {
    const mock = sequence([status, 200]);
    await assertRejects(
      () => fetchCompraAgilWithRetry(options(mock.fetcher)),
      ScanError,
    );
    assertEquals(mock.calls(), 1);
  });
}

Deno.test("timeout mantiene error existente y no se reintenta", async () => {
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
  const error = await assertRejects(
    () => fetchCompraAgilWithRetry({ ...options(fetcher), timeoutMs: 5 }),
    ScanError,
    "upstream_request_timeout",
  );
  assertEquals(calls, 1);
  assertEquals(error.context.requestNumber, 1);
});

Deno.test("ticket nunca aparece en logs ni errores", async () => {
  const logs: unknown[] = [];
  const mock = sequence([500, 500, 500]);
  let failure: unknown;
  try {
    await fetchCompraAgilWithRetry(options(mock.fetcher, logs));
  } catch (error) {
    failure = error;
  }
  const serialized = JSON.stringify({
    logs,
    failure: failure instanceof ScanError
      ? { message: failure.message, context: failure.context }
      : failure,
  });
  assert(!serialized.includes("TOP-SECRET-TICKET"));
  assert(!serialized.toLowerCase().includes("authorization"));
  assertEquals(logs.length, 5);
});
