export type JsonRecord = Record<string, unknown>;

export type RadarConfig = {
  search_terms: string[];
  product_terms: string[];
  region_codes: number[];
  minimum_budget: number | null;
};

export type OpportunityRecord = {
  external_id: string;
  title: string;
  description: string | null;
  status: string;
  call_number: number | null;
  first_call_closing_at: string | null;
  second_call_closing_at: string | null;
  closing_at: string | null;
  published_at: string | null;
  last_changed_at: string | null;
  institution_name: string | null;
  institution_rut: string | null;
  unit_name: string | null;
  region_code: number | null;
  region_name: string | null;
  budget_amount: number | null;
  currency: string | null;
  products: JsonRecord[];
  documents: JsonRecord[];
  delivery_address: string | null;
  delivery_days: number | null;
  offers_received: number | null;
  purchase_order_id: number | null;
  priority: "alta" | "media" | "baja";
  priority_score: number;
  matched_keywords: string[];
  matched_products: string[];
  is_relevant: boolean;
  review_status: string;
  exclusion_reason: string | null;
  match_evidence: JsonRecord;
  raw_data: JsonRecord;
  detail_fetched_at: string | null;
  scanned_at: string;
  updated_at: string;
};

const get = (value: unknown, path: string, fallback: unknown = null) => {
  const result = path.split(".").reduce<unknown>((current, part) =>
    current && typeof current === "object"
      ? (current as JsonRecord)[part]
      : undefined, value);
  return result === undefined || result === null || result === "" ? fallback : result;
};

export function normalizeText(value: unknown = "") {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stringOrNull(value: unknown) {
  return value === undefined || value === null || value === "" ? null : String(value);
}

function numberOrNull(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isoOrNull(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function objectArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object")
    : [];
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function effectiveClosingAt(
  callNumber: number | null,
  current: unknown,
  firstCall: unknown,
  secondCall: unknown,
) {
  const currentClosing = isoOrNull(current);
  const firstClosing = isoOrNull(firstCall);
  const secondClosing = isoOrNull(secondCall);
  return {
    firstClosing,
    secondClosing,
    closingAt: currentClosing || (callNumber === 2 ? secondClosing : firstClosing) || secondClosing || firstClosing,
  };
}

function listBudget(item: unknown) {
  return numberOrNull(
    get(item, "montos.monto_disponible_clp") ??
      get(item, "montos.monto_disponible"),
  );
}

function detailBudget(item: unknown) {
  return numberOrNull(
    get(item, "presupuesto.monto_disponible_clp") ??
      get(item, "presupuesto.monto_disponible") ??
      get(item, "presupuesto.presupuesto_estimado"),
  );
}

export function normalizeListItem(
  item: JsonRecord,
  options: { scannedAt?: Date; discoveryTerms?: string[] } = {},
): OpportunityRecord | null {
  const externalId = stringOrNull(get(item, "codigo"));
  if (!externalId) return null;

  const scannedAt = options.scannedAt || new Date();
  const timestamp = scannedAt.toISOString();
  const callNumber = numberOrNull(get(item, "convocatoria.estado_convocatoria"));
  const closing = effectiveClosingAt(callNumber, get(item, "fechas.fecha_cierre"), null, null);
  const documents = objectArray(get(item, "documentos", []));

  return {
    external_id: externalId,
    title: String(get(item, "nombre", externalId)),
    description: null,
    status: normalizeText(get(item, "estado.codigo", "")),
    call_number: callNumber,
    first_call_closing_at: null,
    second_call_closing_at: null,
    closing_at: closing.closingAt,
    published_at: isoOrNull(get(item, "fechas.fecha_publicacion")),
    last_changed_at: isoOrNull(get(item, "fechas.fecha_ultimo_cambio")),
    institution_name: stringOrNull(get(item, "institucion.organismo_comprador")),
    institution_rut: stringOrNull(get(item, "institucion.rut")),
    unit_name: stringOrNull(get(item, "institucion.unidad_compra")),
    region_code: numberOrNull(get(item, "institucion.region")),
    region_name: stringOrNull(get(item, "institucion.nombre_region")),
    budget_amount: listBudget(item),
    currency: stringOrNull(get(item, "montos.moneda")),
    products: [],
    documents,
    delivery_address: null,
    delivery_days: null,
    offers_received: numberOrNull(get(item, "resumen.total_ofertas_recibidas")),
    purchase_order_id: null,
    priority: "baja",
    priority_score: 0,
    matched_keywords: unique(options.discoveryTerms || []),
    matched_products: [],
    is_relevant: false,
    review_status: "nueva",
    exclusion_reason: null,
    match_evidence: { discovery_terms: unique(options.discoveryTerms || []), detail_evaluated: false },
    raw_data: { list: item },
    detail_fetched_at: null,
    scanned_at: timestamp,
    updated_at: timestamp,
  };
}

export function mergeDetail(
  listRecord: OpportunityRecord,
  detail: JsonRecord,
  fetchedAt = new Date(),
): OpportunityRecord {
  const callNumber = numberOrNull(get(detail, "convocatoria.estado_convocatoria")) ?? listRecord.call_number;
  const closing = effectiveClosingAt(
    callNumber,
    get(detail, "fechas.fecha_cierre"),
    get(detail, "convocatoria.fecha_cierre_primer_llamado"),
    get(detail, "convocatoria.fecha_cierre_segundo_llamado"),
  );
  const products = objectArray(get(detail, "productos_solicitados", []));
  const documents = objectArray(get(detail, "documentos", listRecord.documents));
  const timestamp = fetchedAt.toISOString();

  return {
    ...listRecord,
    title: String(get(detail, "nombre", listRecord.title)),
    description: stringOrNull(get(detail, "descripcion")) ?? listRecord.description,
    status: normalizeText(get(detail, "estado.codigo", listRecord.status)),
    call_number: callNumber,
    first_call_closing_at: closing.firstClosing,
    second_call_closing_at: closing.secondClosing,
    closing_at: closing.closingAt,
    published_at: isoOrNull(get(detail, "fechas.fecha_publicacion")) ?? listRecord.published_at,
    last_changed_at: isoOrNull(get(detail, "fechas.fecha_ultimo_cambio")) ?? listRecord.last_changed_at,
    institution_name: stringOrNull(get(detail, "institucion.organismo_comprador")) ?? listRecord.institution_name,
    institution_rut: stringOrNull(get(detail, "institucion.rut")) ?? listRecord.institution_rut,
    unit_name: stringOrNull(get(detail, "institucion.unidad_compra")) ?? listRecord.unit_name,
    region_code: numberOrNull(get(detail, "institucion.region")) ?? listRecord.region_code,
    region_name: stringOrNull(get(detail, "institucion.nombre_region")) ?? listRecord.region_name,
    budget_amount: detailBudget(detail) ?? listRecord.budget_amount,
    currency: stringOrNull(get(detail, "presupuesto.moneda")) ?? listRecord.currency,
    products,
    documents,
    delivery_address: stringOrNull(get(detail, "entrega.direccion_entrega")),
    delivery_days: numberOrNull(get(detail, "entrega.plazo_entrega_dias")),
    offers_received: numberOrNull(get(detail, "resumen.total_ofertas_recibidas")) ?? listRecord.offers_received,
    purchase_order_id: numberOrNull(get(detail, "orden_compra.id_orden_compra")),
    raw_data: { ...listRecord.raw_data, detail },
    detail_fetched_at: timestamp,
    updated_at: timestamp,
    match_evidence: { ...listRecord.match_evidence, detail_evaluated: true },
  };
}

export function preliminaryExclusion(
  record: OpportunityRecord,
  config: RadarConfig,
  now = new Date(),
) {
  if (record.status !== "publicada") return "status_not_published";
  if (!record.closing_at) return "missing_closing_at";
  if (new Date(record.closing_at).getTime() <= now.getTime()) return "closing_not_future";
  if (config.region_codes.length && (!record.region_code || !config.region_codes.includes(record.region_code))) {
    return "region_outside_coverage";
  }
  if (config.minimum_budget !== null && (record.budget_amount ?? 0) < config.minimum_budget) {
    return "below_minimum_budget";
  }
  return null;
}

export function evaluateOpportunity(
  record: OpportunityRecord,
  config: RadarConfig,
  now = new Date(),
): OpportunityRecord {
  const preliminaryReason = preliminaryExclusion(record, config, now);
  const productText = record.products
    .map((product) => `${get(product, "nombre", "")} ${get(product, "descripcion", "")}`)
    .join(" ");
  const searchable = normalizeText(`${record.title} ${record.description || ""} ${productText}`);
  const matchedKeywords = unique([
    ...record.matched_keywords,
    ...config.search_terms.filter((term) => searchable.includes(normalizeText(term))),
  ]);
  const matchedProducts = unique(
    config.product_terms.filter((term) => searchable.includes(normalizeText(term))),
  );
  const noTextMatch = matchedKeywords.length === 0 && matchedProducts.length === 0;
  const exclusionReason = preliminaryReason || (noTextMatch ? "no_keyword_or_product_match" : null);

  const hoursToClose = record.closing_at
    ? (new Date(record.closing_at).getTime() - now.getTime()) / 3_600_000
    : Number.POSITIVE_INFINITY;
  const scoreComponents = {
    keyword_match: matchedKeywords.length ? 35 : 0,
    product_match: matchedProducts.length ? 25 : 0,
    urgent_closing: hoursToClose > 0 && hoursToClose <= 72 ? 25 : 0,
    second_call: record.call_number === 2 ? 10 : 0,
    budget_known: record.budget_amount !== null ? 5 : 0,
  };
  const score = Math.min(100, Object.values(scoreComponents).reduce((sum, value) => sum + value, 0));

  return {
    ...record,
    matched_keywords: matchedKeywords,
    matched_products: matchedProducts,
    is_relevant: !exclusionReason,
    exclusion_reason: exclusionReason,
    priority_score: score,
    priority: score >= 75 ? "alta" : score >= 50 ? "media" : "baja",
    match_evidence: {
      ...record.match_evidence,
      score_components: scoreComponents,
      evaluated_at: now.toISOString(),
      exclusion_reason: exclusionReason,
    },
  };
}

export function shouldFetchDetail(existing: JsonRecord | null, candidate: OpportunityRecord) {
  if (!existing) return true;
  if (!existing.detail_fetched_at) return true;
  const existingChangedAt = isoOrNull(existing.last_changed_at);
  return Boolean(candidate.last_changed_at && candidate.last_changed_at !== existingChangedAt);
}

export function preserveExistingRecord(
  existing: JsonRecord,
  candidate: OpportunityRecord,
): OpportunityRecord {
  const existingRaw = existing.raw_data && typeof existing.raw_data === "object"
    ? existing.raw_data as JsonRecord
    : {};
  return {
    ...(existing as unknown as OpportunityRecord),
    ...candidate,
    description: stringOrNull(existing.description) ?? candidate.description,
    first_call_closing_at: isoOrNull(existing.first_call_closing_at) ?? candidate.first_call_closing_at,
    second_call_closing_at: isoOrNull(existing.second_call_closing_at) ?? candidate.second_call_closing_at,
    products: objectArray(existing.products).length ? objectArray(existing.products) : candidate.products,
    documents: objectArray(existing.documents).length ? objectArray(existing.documents) : candidate.documents,
    delivery_address: stringOrNull(existing.delivery_address) ?? candidate.delivery_address,
    delivery_days: numberOrNull(existing.delivery_days) ?? candidate.delivery_days,
    purchase_order_id: numberOrNull(existing.purchase_order_id) ?? candidate.purchase_order_id,
    review_status: stringOrNull(existing.review_status) || "nueva",
    detail_fetched_at: isoOrNull(existing.detail_fetched_at),
    raw_data: { ...existingRaw, ...candidate.raw_data },
  };
}

export type CompraAgilErrorCode =
  | "invalid_ticket"
  | "ticket_forbidden"
  | "opportunity_not_found"
  | "quota_exhausted"
  | "upstream_error"
  | "service_unavailable"
  | "unexpected_upstream_status";

export function mapHttpError(status: number): CompraAgilErrorCode {
  if (status === 401) return "invalid_ticket";
  if (status === 403) return "ticket_forbidden";
  if (status === 404) return "opportunity_not_found";
  if (status === 429) return "quota_exhausted";
  if (status === 500) return "upstream_error";
  if (status === 503) return "service_unavailable";
  return "unexpected_upstream_status";
}

export function unwrapApiPayload(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("invalid_upstream_payload");
  const response = value as JsonRecord;
  if (response.success !== "OK" || !response.payload || typeof response.payload !== "object") {
    throw new Error("upstream_response_not_ok");
  }
  return response.payload as JsonRecord;
}
