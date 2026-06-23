import { supabase } from "./supabase";

function getRegionName(regionCode) {
  const regions = {
    1: "tarapaca",
    2: "antofagasta",
    3: "atacama",
    4: "coquimbo",
    5: "quinta_region",
    6: "ohiggins",
    7: "maule",
    8: "biobio",
    9: "araucania",
    10: "los_lagos",
    11: "aysen",
    12: "magallanes",
    13: "metropolitana",
    14: "los_rios",
    15: "arica_parinacota",
    16: "nuble",
  };

  return regions[regionCode] || "metropolitana";
}

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function daysLeft(fechaCierre) {
  if (!fechaCierre) return null;

  const cierre = new Date(fechaCierre);
  const hoy = new Date();

  return Math.ceil(
    (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function extractVisitInfo(text = "") {
  const normalized = normalizeText(text);

  const hasSiteVisit =
    normalized.includes("visita tecnica") ||
    normalized.includes("visita en terreno") ||
    normalized.includes("visita a terreno") ||
    normalized.includes("visita obligatoria");

  const required =
    hasSiteVisit &&
    (normalized.includes("obligatoria") ||
      normalized.includes("obligatorio"));

  const hourMatch = text.match(/(\d{1,2}:\d{2})\s*(hrs|horas)?/i);

  return {
    hasSiteVisit,
    required,
    hour: hourMatch ? hourMatch[1] : null,
    notes: hasSiteVisit ? text : null,
  };
}

function detectProducts(text = "") {
  const normalized = normalizeText(text);
  const products = [];

  if (normalized.includes("roller")) {
    products.push("Cortinas Roller");
  }

  if (
    normalized.includes("blackout") ||
    normalized.includes("black out") ||
    normalized.includes("sun out")
  ) {
    products.push("Blackout");
  }

  if (normalized.includes("screen")) {
    products.push("Screen");
  }

  if (normalized.includes("persiana")) {
    products.push("Persianas");
  }

  if (normalized.includes("toldo")) {
    products.push("Toldos");
  }

  if (normalized.includes("control solar")) {
    products.push("Control Solar");
  }

  if (normalized.includes("cortina clinica")) {
    products.push("Cortinas Clínicas");
  }

  return [...new Set(products)];
}

function calculateMatchScore(products = [], matchedKeywords = []) {
  let score = 40;

  if (matchedKeywords.length > 0) score += 10;

  if (products.includes("Cortinas Roller")) score += 25;
  if (products.includes("Blackout")) score += 15;
  if (products.includes("Screen")) score += 10;
  if (products.includes("Control Solar")) score += 15;
  if (products.includes("Persianas")) score += 8;
  if (products.includes("Toldos")) score += 8;
  if (products.includes("Cortinas Clínicas")) score += 8;

  return Math.min(score, 100);
}

export async function scanCompraAgil(opportunities = []) {
  const { data: keywordsData, error: keywordsError } = await supabase
    .from("market_keywords")
    .select("keyword, priority")
    .eq("is_active", true);

  if (keywordsError) {
    console.error("Error cargando keywords:", keywordsError);
    return { ok: false, error: keywordsError };
  }

  const keywords = keywordsData || [];

  const registros = opportunities
    .map((item) => {
      const fullText = `${item.name || ""} ${item.description || ""}`;
      const texto = normalizeText(fullText);

      const siteVisit = extractVisitInfo(fullText);
      const products = detectProducts(fullText);

      const matchedKeywords = keywords
        .filter((k) => texto.includes(normalizeText(k.keyword)))
        .map((k) => k.keyword);

      if (matchedKeywords.length === 0 && products.length === 0) {
        return null;
      }

      const score = calculateMatchScore(products, matchedKeywords);

      const priority =
        score >= 80
          ? "alta"
          : score >= 60
            ? "media"
            : "baja";

      return {
        source: "mercado_publico",
        opportunity_type: item.mechanismCode === "CA" ? "compra_agil" : "licitacion",

        mechanism_code: item.mechanismCode || null,
        mechanism_description: item.mechanismDescription || null,

        external_id: item.code,
        title: item.name,
        description: item.description || null,

        institution_name: item.legalName || null,
        institution_code: item.legalNameCode || null,
        unit_name: item.orgName || null,
        buyer_name: item.legalName || null,

        budget_amount: item.estimatedAmount || 0,
        estimated_amount: item.estimatedAmount || 0,
        currency: item.currency || "CLP",

        published_at: item.openingDate || null,
        closing_at: item.receptionDate || null,
        days_left: daysLeft(item.receptionDate),

        region_code: item.regionCode || null,
        region: getRegionName(item.regionCode),
        guarantee: item.guarantee || null,
        is_public_budget: item.isPublicBudget ?? null,
        proposal_state: item.proposalState ?? null,

        status: item.documentStatus || item.mechanismDescription || "Compra Ágil",
        status_label: item.documentStatus || "Publicada",

        matched_keywords: matchedKeywords,
        priority,
        review_status: "nueva",

        has_site_visit: siteVisit.hasSiteVisit,
        site_visit_required: siteVisit.required,
        site_visit_notes: siteVisit.notes,

        ai_products: products,
        ai_match_score: score,

        raw_data: item,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  console.log("Compras Ágiles a guardar:", registros.length);
  console.log(registros);

  if (registros.length === 0) {
    return { ok: true, inserted: 0 };
  }

  const { data: saved, error } = await supabase
    .from("market_opportunities")
    .upsert(registros, { onConflict: "external_id" })
    .select();

  if (error) {
    console.error("Error guardando Compra Ágil:", error);
    return { ok: false, error };
  }

  return {
    ok: true,
    inserted: saved.length,
    data: saved,
  };
}