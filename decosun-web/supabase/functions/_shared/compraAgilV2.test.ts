import { assert, assertEquals } from "jsr:@std/assert@1";
import listFixture from "./fixtures/compraAgilList.json" with { type: "json" };
import detailFixture from "./fixtures/compraAgilDetail.json" with { type: "json" };
import {
  evaluateOpportunity,
  mapHttpError,
  mergeDetail,
  normalizeListItem,
  preliminaryExclusion,
  preserveExistingRecord,
  shouldFetchDetail,
  unwrapApiPayload,
} from "./compraAgilV2.ts";

const NOW = new Date("2026-07-16T12:00:00Z");
const config = {
  search_terms: ["cortinas", "blackout"],
  product_terms: ["roller", "blackout", "screen"],
  region_codes: [5, 13],
  minimum_budget: 500000,
};

Deno.test("normalizes paginated listing and first call", () => {
  const payload = unwrapApiPayload(listFixture);
  const items = payload.items as Record<string, unknown>[];
  const record = normalizeListItem(items[0], { scannedAt: NOW, discoveryTerms: ["cortinas"] });
  assert(record);
  assertEquals(record.external_id, "1057539-228-COT26");
  assertEquals(record.call_number, 1);
  assertEquals(record.closing_at, "2026-07-20T18:00:00.000Z");
  assertEquals(record.budget_amount, 1500000);
  assertEquals(record.institution_name, "Servicio de Prueba");
  assertEquals(record.region_code, 13);
  assertEquals(record.documents, [{ id: "doc-1", nombre: "requisitos.pdf" }]);
});

Deno.test("normalizes second call detail and effective closing", () => {
  const listPayload = unwrapApiPayload(listFixture);
  const detailPayload = unwrapApiPayload(detailFixture);
  const listed = normalizeListItem(
    (listPayload.items as Record<string, unknown>[])[1],
    { scannedAt: NOW, discoveryTerms: ["blackout"] },
  );
  assert(listed);
  const detailed = mergeDetail(listed, detailPayload, NOW);
  assertEquals(detailed.call_number, 2);
  assertEquals(detailed.first_call_closing_at, "2026-07-15T16:30:00.000Z");
  assertEquals(detailed.second_call_closing_at, "2026-07-19T16:30:00.000Z");
  assertEquals(detailed.closing_at, "2026-07-19T16:30:00.000Z");
  assertEquals(detailed.delivery_address, "Avenida Central 123");
  assertEquals(detailed.delivery_days, 12);
  assertEquals(detailed.offers_received, 0);
  assertEquals(detailed.purchase_order_id, 987654);
  assertEquals(detailed.budget_amount, 900000);
  assertEquals(detailed.currency, "CLP");
  assertEquals(detailed.institution_rut, "69.000.000-1");
  assertEquals(detailed.region_name, "Valparaiso");
  assertEquals(detailed.products[0].nombre, "Cortinas blackout");
  assertEquals(detailed.documents[0].nombre, "especificaciones.pdf");
});

Deno.test("evaluates relevance, priority and audit evidence", () => {
  const listPayload = unwrapApiPayload(listFixture);
  const detailPayload = unwrapApiPayload(detailFixture);
  const listed = normalizeListItem(
    (listPayload.items as Record<string, unknown>[])[1],
    { scannedAt: NOW, discoveryTerms: ["blackout"] },
  );
  assert(listed);
  const evaluated = evaluateOpportunity(mergeDetail(listed, detailPayload, NOW), config, NOW);
  assertEquals(evaluated.is_relevant, true);
  assertEquals(evaluated.exclusion_reason, null);
  assert(evaluated.matched_keywords.includes("blackout"));
  assert(evaluated.matched_products.includes("roller"));
  assertEquals(evaluated.priority, "alta");
  assertEquals(evaluated.match_evidence.detail_evaluated, true);
});

Deno.test("rejects closed, uncovered and low-budget opportunities", () => {
  const payload = unwrapApiPayload(listFixture);
  const base = normalizeListItem(
    (payload.items as Record<string, unknown>[])[0],
    { scannedAt: NOW, discoveryTerms: ["cortinas"] },
  );
  assert(base);
  assertEquals(preliminaryExclusion({ ...base, closing_at: "2026-07-15T12:00:00Z" }, config, NOW), "closing_not_future");
  assertEquals(preliminaryExclusion({ ...base, region_code: 8 }, config, NOW), "region_outside_coverage");
  assertEquals(preliminaryExclusion({ ...base, budget_amount: 10 }, config, NOW), "below_minimum_budget");
});

Deno.test("fetches detail only for new or changed candidates", () => {
  const payload = unwrapApiPayload(listFixture);
  const candidate = normalizeListItem(
    (payload.items as Record<string, unknown>[])[0],
    { scannedAt: NOW, discoveryTerms: ["cortinas"] },
  );
  assert(candidate);
  assertEquals(shouldFetchDetail(null, candidate), true);
  assertEquals(shouldFetchDetail({ detail_fetched_at: NOW.toISOString(), last_changed_at: candidate.last_changed_at }, candidate), false);
  assertEquals(shouldFetchDetail({ detail_fetched_at: NOW.toISOString(), last_changed_at: "2026-07-14T00:00:00Z" }, candidate), true);
});

Deno.test("preserves rich detail and review state when listing is unchanged", () => {
  const payload = unwrapApiPayload(listFixture);
  const candidate = normalizeListItem(
    (payload.items as Record<string, unknown>[])[1],
    { scannedAt: NOW, discoveryTerms: ["blackout"] },
  );
  assert(candidate);
  const preserved = preserveExistingRecord({
    ...candidate,
    description: "Descripcion rica",
    first_call_closing_at: "2026-07-15T16:30:00.000Z",
    second_call_closing_at: "2026-07-19T16:30:00.000Z",
    products: [{ nombre: "Blackout" }],
    review_status: "revisada",
    detail_fetched_at: NOW.toISOString(),
    raw_data: { detail: { codigo: candidate.external_id } },
  }, candidate);
  assertEquals(preserved.description, "Descripcion rica");
  assertEquals(preserved.first_call_closing_at, "2026-07-15T16:30:00.000Z");
  assertEquals(preserved.second_call_closing_at, "2026-07-19T16:30:00.000Z");
  assertEquals(preserved.products, [{ nombre: "Blackout" }]);
  assertEquals(preserved.review_status, "revisada");
  assert(preserved.raw_data.detail);
  assert(preserved.raw_data.list);
});

for (const [status, expected] of [
  [401, "invalid_ticket"],
  [404, "opportunity_not_found"],
  [429, "quota_exhausted"],
  [500, "upstream_error"],
  [503, "service_unavailable"],
] as const) {
  Deno.test(`maps HTTP ${status} without exposing upstream payloads`, () => {
    assertEquals(mapHttpError(status), expected);
  });
}
