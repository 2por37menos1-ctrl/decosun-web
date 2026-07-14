export type IngestionChannel = "public_api" | "recommended_api";
type Json = Record<string, unknown>;
type Keyword = { keyword: string };

const REGIONS: Record<number, string> = {
  1: "tarapaca", 2: "antofagasta", 3: "atacama", 4: "coquimbo",
  5: "quinta_region", 6: "ohiggins", 7: "maule", 8: "biobio",
  9: "araucania", 10: "los_lagos", 11: "aysen", 12: "magallanes",
  13: "metropolitana", 14: "los_rios", 15: "arica_parinacota", 16: "nuble",
};
const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};
const PRIMARY_CLOSING = ["receptionDate", "closing_at", "FechaCierre", "Fechas.FechaCierre"];
const ORIGINAL_CLOSING = ["originalClosingDate", "original_closing_at", "FechaCierreOriginal", "Fechas.FechaCierreOriginal"];
const EXTENDED_CLOSING = ["extendedClosingDate", "extended_closing_at", "newClosingDate", "NuevaFechaCierre", "FechaCierreProrrogada", "Fechas.NuevaFechaCierre", "Fechas.FechaCierreProrrogada"];

export function normalizeText(value: unknown = "") {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getValue(item: Json, paths: string[], fallback: unknown = null) {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((current, part) =>
      current && typeof current === "object" ? (current as Json)[part] : undefined, item);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function iso(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const text = normalizeText(value).trim();
  if (["true", "si", "1", "obligatoria", "obligatorio"].includes(text)) return true;
  if (["false", "no", "0", "opcional"].includes(text)) return false;
  return null;
}

export function getEffectiveClosingAt(item: Json) {
  const primaryClosingAt = iso(getValue(item, PRIMARY_CLOSING));
  const originalClosingAt = iso(getValue(item, ORIGINAL_CLOSING));
  const extendedClosingAt = iso(getValue(item, EXTENDED_CLOSING));
  const explicitFlag = bool(getValue(item, ["closingWasExtended", "closing_was_extended", "PlazoExtendido", "EsProrroga", "Fechas.EsProrroga"]));
  return {
    closingAt: extendedClosingAt || primaryClosingAt || originalClosingAt,
    originalClosingAt,
    extendedClosingAt,
    // "2° llamado" and similar text is deliberately ignored.
    closingWasExtended: Boolean(extendedClosingAt && explicitFlag !== false),
  };
}

function chileIso(year: number, month: number, day: number, hour: number, minute: number) {
  if (year < 100) year += year >= 70 ? 1900 : 2000;
  const initial = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(initial)).map((part) => [part.type, part.value]));
  const represented = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(initial + initial - represented).toISOString();
}

export function parseChileanDateTime(value: unknown) {
  const text = normalizeText(value);
  const words = text.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{2,4})([\s\S]*)/);
  const numeric = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})([\s\S]*)/);
  if (!words && !numeric) return null;
  const day = +(words?.[1] || numeric?.[1] || 0);
  const month = words ? MONTHS[words[2]] : +(numeric?.[2] || 0);
  const year = +(words?.[3] || numeric?.[3] || 0);
  const rest = words?.[4] || numeric?.[4] || "";
  const time = rest.match(/(?:a\s+las?\s+|,?\s*)(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs?|horas?)?/);
  let hour = +(time?.[1] || 0);
  const minute = +(time?.[2] || 0);
  if (time?.[3] === "pm" && hour < 12) hour += 12;
  if (time?.[3] === "am" && hour === 12) hour = 0;
  if (!day || !month || month > 12 || day > 31 || hour > 23 || minute > 59) return null;
  return chileIso(year, month, day, hour, minute);
}

export function extractSiteVisit(item: Json, description: unknown = "") {
  const structuredAt = iso(getValue(item, ["siteVisitDate", "site_visit_at", "FechaVisitaTerreno", "Fechas.FechaVisitaTerreno"]));
  const structuredLocation = getValue(item, ["siteVisitLocation", "site_visit_location", "DireccionVisita", "DireccionVisitaTerreno"]);
  const structuredRequired = bool(getValue(item, ["siteVisitRequired", "site_visit_required", "VisitaObligatoria", "EsVisitaObligatoria"]));
  const text = String(description ?? "");
  const normalized = normalizeText(text);
  const textHasVisit = /visita\s+(?:tecnica|en\s+terreno|a\s+terreno|obligatoria)/.test(normalized);
  const location = text.match(/(?:direcci[oó]n|lugar|ubicaci[oó]n)\s*(?:de\s+la\s+visita)?\s*[:\-]\s*([^.;\n]+)/i)?.[1]?.trim();
  const hasSiteVisit = Boolean(structuredAt || structuredLocation || structuredRequired !== null || textHasVisit);
  return {
    hasSiteVisit,
    siteVisitAt: structuredAt || (textHasVisit ? parseChileanDateTime(text) : null),
    siteVisitLocation: structuredLocation ? String(structuredLocation) : location || null,
    siteVisitRequired: hasSiteVisit ? structuredRequired ?? /obligatori[oa]/.test(normalized) : false,
    siteVisitNotes: textHasVisit ? text : null,
  };
}

function products(text: string) {
  const value = normalizeText(text);
  const rules: Array<[string, string[]]> = [
    ["Cortinas Roller", ["roller"]], ["Blackout", ["blackout", "black out", "sun out"]],
    ["Screen", ["screen"]], ["Persianas", ["persiana"]], ["Toldos", ["toldo"]],
    ["Control Solar", ["control solar"]], ["Cortinas Clinicas", ["cortina clinica"]],
    ["Cierres de Cristal", ["cierre de cristal", "cerramiento"]],
  ];
  return rules.filter(([, terms]) => terms.some((term) => value.includes(term))).map(([name]) => name);
}

function matchScore(detectedProducts: string[], matchedKeywords: string[]) {
  const weights: Record<string, number> = {
    "Cortinas Roller": 25,
    Blackout: 15,
    Screen: 10,
    Persianas: 8,
    Toldos: 8,
    "Control Solar": 15,
    "Cortinas Clinicas": 8,
    "Cierres de Cristal": 12,
  };
  return Math.min(
    40 + (matchedKeywords.length ? 10 : 0) +
      detectedProducts.reduce((total, product) => total + (weights[product] || 0), 0),
    100,
  );
}

function opportunityType(mechanismCode: unknown, mechanismDescription: unknown) {
  const mechanism = normalizeText(`${mechanismCode ?? ""} ${mechanismDescription ?? ""}`);
  if (mechanismCode === "CA" || mechanism.includes("compra agil")) return "compra_agil";
  if (mechanism.includes("trato directo")) return "trato_directo";
  if (mechanism.includes("convenio marco")) return "convenio_marco";
  return "licitacion";
}

export function daysLeft(closingAt: unknown, now = new Date()) {
  const closing = iso(closingAt);
  return closing ? Math.ceil((new Date(closing).getTime() - now.getTime()) / 86_400_000) : null;
}

export function normalizeMarketOpportunity(item: Json, keywords: Keyword[], channel: IngestionChannel, now = new Date()) {
  const externalId = getValue(item, ["code", "external_id", "CodigoExterno", "codigo", "id"]);
  if (!externalId) return { record: null, reason: "missing_external_id" };
  const title = String(getValue(item, ["name", "title", "Nombre"], ""));
  const description = String(getValue(item, ["description", "Descripcion"], ""));
  const fullText = `${title} ${description}`;
  const detectedProducts = products(fullText);
  const matched = keywords.filter((key) => normalizeText(fullText).includes(normalizeText(key.keyword))).map((key) => key.keyword);
  if (!matched.length && !detectedProducts.length) return { record: null, reason: "not_relevant" };
  const closing = getEffectiveClosingAt(item);
  const visit = extractSiteVisit(item, description);
  const mechanismCode = getValue(item, ["mechanismCode", "mechanism_code", "CodigoTipo"]);
  const mechanismDescription = getValue(item, ["mechanismDescription", "mechanism_description", "Tipo"]);
  const score = matchScore(detectedProducts, matched);
  const regionCode = getValue(item, ["regionCode", "region_code", "CodigoRegion"]);
  const amount = Number(getValue(item, ["estimatedAmount", "budget_amount", "estimated_amount", "MontoEstimado"], 0));
  const timestamp = now.toISOString();
  const id = String(externalId);
  return { reason: null, record: {
    source: "mercado_publico", external_id: id,
    opportunity_type: opportunityType(mechanismCode, mechanismDescription),
    mechanism_code: mechanismCode || null, mechanism_description: mechanismDescription || null,
    title: title || id, description: description || null,
    institution_name: getValue(item, ["legalName", "institution_name", "Comprador.NombreOrganismo"]),
    institution_code: getValue(item, ["legalNameCode", "institution_code", "Comprador.CodigoOrganismo"]),
    unit_name: getValue(item, ["orgName", "unit_name", "Comprador.NombreUnidad"]),
    buyer_name: getValue(item, ["legalName", "buyer_name", "Comprador.NombreOrganismo"]),
    budget_amount: Number.isFinite(amount) ? amount : 0, estimated_amount: Number.isFinite(amount) ? amount : 0,
    currency: getValue(item, ["currency", "Moneda"], "CLP"),
    published_at: iso(getValue(item, ["openingDate", "published_at", "FechaPublicacion", "Fechas.FechaPublicacion"])),
    closing_at: closing.closingAt, original_closing_at: closing.originalClosingAt,
    extended_closing_at: closing.extendedClosingAt, closing_was_extended: closing.closingWasExtended,
    days_left: daysLeft(closing.closingAt, now), region_code: regionCode || null,
    region: getValue(item, ["region", "Comprador.RegionUnidad"], REGIONS[Number(regionCode)] || "metropolitana"),
    guarantee: getValue(item, ["guarantee", "Garantia"]), is_public_budget: getValue(item, ["isPublicBudget", "is_public_budget"]),
    proposal_state: getValue(item, ["proposalState", "proposal_state"]),
    status: getValue(item, ["documentStatus", "status", "Estado"], mechanismDescription || "Publicada"),
    status_label: getValue(item, ["documentStatus", "status_label", "Estado"], "Publicada"),
    source_url: `https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=${encodeURIComponent(id)}`,
    matched_keywords: matched, priority: score >= 80 ? "alta" : score >= 60 ? "media" : "baja",
    review_status: "nueva", has_site_visit: visit.hasSiteVisit, site_visit_at: visit.siteVisitAt,
    site_visit_location: visit.siteVisitLocation, site_visit_required: visit.siteVisitRequired,
    site_visit_notes: visit.siteVisitNotes, ai_products: detectedProducts, ai_match_score: score,
    raw_data: { [channel]: item }, ingestion_sources: [channel],
    last_public_scan_at: channel === "public_api" ? timestamp : null,
    last_recommended_sync_at: channel === "recommended_api" ? timestamp : null, updated_at: timestamp,
  }};
}

const NULL_SAFE = ["mechanism_code", "mechanism_description", "description", "institution_name", "institution_code", "unit_name", "buyer_name", "published_at", "closing_at", "original_closing_at", "extended_closing_at", "region_code", "region", "guarantee", "is_public_budget", "proposal_state", "site_visit_at", "site_visit_location", "site_visit_notes"];
function envelope(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const value = raw as Json;
  return "public_api" in value || "recommended_api" in value || "legacy" in value ? value : { legacy: value };
}

export function mergeMarketOpportunity(existing: Json | null, incoming: Json, channel: IngestionChannel, now = new Date()) {
  if (!existing) return incoming;
  const merged: Json = { ...existing, ...incoming };
  for (const key of NULL_SAFE) if (incoming[key] === null || incoming[key] === undefined || incoming[key] === "") merged[key] = existing[key];
  merged.review_status = existing.review_status || incoming.review_status || "nueva";
  merged.ingestion_sources = [...new Set([...(Array.isArray(existing.ingestion_sources) ? existing.ingestion_sources : []), channel])];
  merged.raw_data = { ...envelope(existing.raw_data), ...envelope(incoming.raw_data) };
  merged.last_public_scan_at = channel === "public_api" ? now.toISOString() : existing.last_public_scan_at;
  merged.last_recommended_sync_at = channel === "recommended_api" ? now.toISOString() : existing.last_recommended_sync_at;
  merged.updated_at = now.toISOString();
  delete merged.id; delete merged.created_at;
  return merged;
}

export async function requireAuthorizedMarketUser(req: Request, url: string, anonKey: string) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false as const, status: 401, errorCode: "missing_authorization" };
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  if (!userResponse.ok) return { ok: false as const, status: 401, errorCode: "invalid_authorization" };
  const user = await userResponse.json();
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  return profiles?.[0]?.role === "gerencia"
    ? { ok: true as const, userId: user.id }
    : { ok: false as const, status: 403, errorCode: "insufficient_permissions" };
}
