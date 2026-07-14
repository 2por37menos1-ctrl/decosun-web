import { strict as assert } from "node:assert";
import test from "node:test";
import { extractSiteVisit, getEffectiveClosingAt, mergeMarketOpportunity, normalizeMarketOpportunity, parseChileanDateTime } from "./marketOpportunity.ts";

test("uses an explicit extension and ignores second-call wording", () => {
  const extended = getEffectiveClosingAt({ FechaCierre: "2026-07-01T12:00:00Z", FechaCierreOriginal: "2026-07-01T12:00:00Z", FechaCierreProrrogada: "2026-07-03T12:00:00Z" });
  assert.equal(extended.closingAt, "2026-07-03T12:00:00.000Z");
  assert.equal(extended.closingWasExtended, true);
  const secondCall = getEffectiveClosingAt({ Nombre: "2° llamado", FechaCierre: "2026-07-01T12:00:00Z" });
  assert.equal(secondCall.extendedClosingAt, null);
});

for (const value of [
  "Visita obligatoria 06 de julio de 2026, a las 10:00 hrs",
  "Visita técnica 26.06.26 a las 10AM",
  "Visita a terreno jueves 25.06.2026, 10:00 hrs",
  "Visita obligatoria 30.06.26 a las 10AM",
]) test(`parses ${value}`, () => assert.ok(parseChileanDateTime(value)));

test("structured site visit wins over description", () => {
  const visit = extractSiteVisit({ siteVisitDate: "2026-07-08T15:00:00Z", siteVisitLocation: "Av. Uno 123", siteVisitRequired: true }, "Visita técnica 06 de julio de 2026 a las 10:00 hrs");
  assert.equal(visit.siteVisitAt, "2026-07-08T15:00:00.000Z");
  assert.equal(visit.siteVisitLocation, "Av. Uno 123");
  assert.equal(visit.siteVisitRequired, true);
});

test("keeps an open opportunity with a past mandatory visit", () => {
  const { record } = normalizeMarketOpportunity({ CodigoExterno: "123-1-LP26", Nombre: "Cortinas roller", Descripcion: "Visita obligatoria 30.06.26 a las 10AM", FechaCierre: "2026-08-01T12:00:00Z" }, [{ keyword: "roller" }], "public_api", new Date("2026-07-13T12:00:00Z"));
  assert.equal(record?.site_visit_required, true);
  assert.ok(new Date(String(record?.site_visit_at)) < new Date("2026-07-13T12:00:00Z"));
  assert.ok(new Date(String(record?.closing_at)) > new Date("2026-07-13T12:00:00Z"));
});

test("merge preserves review status, rich values, raw payloads and channels", () => {
  const merged = mergeMarketOpportunity(
    { review_status: "revisada", description: "Completa", raw_data: { public_api: { CodigoExterno: "A" } }, ingestion_sources: ["public_api"] },
    { review_status: "nueva", description: null, raw_data: { recommended_api: { code: "A" } } },
    "recommended_api", new Date("2026-07-13T12:00:00Z"));
  assert.equal(merged.review_status, "revisada");
  assert.equal(merged.description, "Completa");
  assert.deepEqual(merged.ingestion_sources, ["public_api", "recommended_api"]);
  assert.ok((merged.raw_data as Record<string, unknown>).public_api);
  assert.ok((merged.raw_data as Record<string, unknown>).recommended_api);
});
