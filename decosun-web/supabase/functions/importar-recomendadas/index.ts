// @ts-nocheck

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

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

  return regions[Number(regionCode)] || "metropolitana";
}

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function daysLeft(closingAt) {
  if (!closingAt) return null;

  const closingDate = new Date(closingAt);

  if (Number.isNaN(closingDate.getTime())) {
    return null;
  }

  const today = new Date();
  return Math.ceil(
    (closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
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

  const hourMatch = String(text).match(/(\d{1,2}:\d{2})\s*(hrs|horas)?/i);

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

  if (normalized.includes("roller")) products.push("Cortinas Roller");

  if (
    normalized.includes("blackout") ||
    normalized.includes("black out") ||
    normalized.includes("sun out")
  ) {
    products.push("Blackout");
  }

  if (normalized.includes("screen")) products.push("Screen");
  if (normalized.includes("persiana")) products.push("Persianas");
  if (normalized.includes("toldo")) products.push("Toldos");
  if (normalized.includes("control solar")) products.push("Control Solar");
  if (normalized.includes("cortina clinica")) products.push("Cortinas Clinicas");
  if (normalized.includes("cierre de cristal")) products.push("Cierres de Cristal");
  if (normalized.includes("cerramiento")) products.push("Cierres de Cristal");

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
  if (products.includes("Cortinas Clinicas")) score += 8;
  if (products.includes("Cierres de Cristal")) score += 12;

  return Math.min(score, 100);
}

function getValue(item, keys, fallback = null) {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((current, part) => current?.[part], item);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function getOpportunityType(item, mechanismCode, mechanismDescription) {
  const mechanism = normalizeText(`${mechanismCode || ""} ${mechanismDescription || ""}`);

  if (mechanism.includes("ca") || mechanism.includes("compra agil")) {
    return "compra_agil";
  }

  if (mechanism.includes("trato directo")) {
    return "trato_directo";
  }

  if (mechanism.includes("convenio marco")) {
    return "convenio_marco";
  }

  return "licitacion";
}

function normalizeOpportunity(item, keywords, existingReviewStatusByExternalId) {
  const externalId = getValue(item, [
    "code",
    "external_id",
    "CodigoExterno",
    "codigo",
    "id",
  ]);

  if (!externalId) {
    return null;
  }

  const title = getValue(item, ["name", "title", "Nombre"], "");
  const description = getValue(item, ["description", "Descripcion"], "");
  const fullText = `${title || ""} ${description || ""}`;
  const normalizedText = normalizeText(fullText);
  const products = detectProducts(fullText);
  const matchedKeywords = keywords
    .filter((keyword) => normalizedText.includes(normalizeText(keyword.keyword)))
    .map((keyword) => keyword.keyword);

  if (matchedKeywords.length === 0 && products.length === 0) {
    return null;
  }

  const mechanismCode = getValue(item, ["mechanismCode", "mechanism_code", "CodigoTipo"]);
  const mechanismDescription = getValue(item, [
    "mechanismDescription",
    "mechanism_description",
    "Tipo",
  ]);
  const closingAt = getValue(item, [
    "receptionDate",
    "closing_at",
    "FechaCierre",
    "Fechas.FechaCierre",
  ]);
  const publishedAt = getValue(item, [
    "openingDate",
    "published_at",
    "FechaPublicacion",
    "Fechas.FechaPublicacion",
  ]);
  const regionCode = getValue(item, ["regionCode", "region_code", "CodigoRegion"]);
  const budgetAmount = Number(
    getValue(item, ["estimatedAmount", "budget_amount", "estimated_amount", "MontoEstimado"], 0)
  );
  const score = calculateMatchScore(products, matchedKeywords);
  const priority = score >= 80 ? "alta" : score >= 60 ? "media" : "baja";
  const siteVisit = extractVisitInfo(fullText);
  const externalIdText = String(externalId);

  return {
    source: "mercado_publico",
    opportunity_type: getOpportunityType(item, mechanismCode, mechanismDescription),
    mechanism_code: mechanismCode || null,
    mechanism_description: mechanismDescription || null,
    external_id: externalIdText,
    title: title || externalIdText,
    description: description || null,
    institution_name: getValue(item, [
      "legalName",
      "institution_name",
      "Comprador.NombreOrganismo",
    ]),
    institution_code: getValue(item, [
      "legalNameCode",
      "institution_code",
      "Comprador.CodigoOrganismo",
    ]),
    unit_name: getValue(item, ["orgName", "unit_name", "Comprador.NombreUnidad"]),
    buyer_name: getValue(item, ["legalName", "buyer_name", "Comprador.NombreOrganismo"]),
    budget_amount: Number.isFinite(budgetAmount) ? budgetAmount : 0,
    estimated_amount: Number.isFinite(budgetAmount) ? budgetAmount : 0,
    currency: getValue(item, ["currency", "Moneda"], "CLP"),
    published_at: publishedAt || null,
    closing_at: closingAt || null,
    days_left: daysLeft(closingAt),
    region_code: regionCode || null,
    region: getRegionName(regionCode),
    guarantee: getValue(item, ["guarantee", "Garantia"]),
    is_public_budget: getValue(item, ["isPublicBudget", "is_public_budget"]),
    proposal_state: getValue(item, ["proposalState", "proposal_state"]),
    status: getValue(item, ["documentStatus", "status"], mechanismDescription || "Publicada"),
    status_label: getValue(item, ["documentStatus", "status_label"], "Publicada"),
    matched_keywords: matchedKeywords,
    priority,
    review_status: existingReviewStatusByExternalId.get(externalIdText) || "nueva",
    has_site_visit: siteVisit.hasSiteVisit,
    site_visit_required: siteVisit.required,
    site_visit_notes: siteVisit.notes,
    ai_products: products,
    ai_match_score: score,
    raw_data: item,
    updated_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const bearerToken = Deno.env.get("MERCADO_PUBLICO_BEARER_TOKEN");
    const apiKey = Deno.env.get("MERCADO_PUBLICO_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!bearerToken || !apiKey) {
      return jsonResponse(
        {
          ok: false,
          total: 0,
          inserted_or_updated: 0,
          skipped: 0,
          errors: 1,
          error:
            "Faltan credenciales server-side de Mercado Publico. Configura MERCADO_PUBLICO_BEARER_TOKEN y MERCADO_PUBLICO_API_KEY como secrets.",
        },
        400
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          ok: false,
          total: 0,
          inserted_or_updated: 0,
          skipped: 0,
          errors: 1,
          error:
            "Faltan credenciales server-side de Supabase para guardar oportunidades.",
        },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const cleanBearer = bearerToken.startsWith("Bearer ")
      ? bearerToken.replace("Bearer ", "").trim()
      : bearerToken.trim();

    const response = await fetch(
      "https://ywri2h0ar5.execute-api.us-east-1.amazonaws.com/escritorio/oportunidades/recomendadas",
      {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${cleanBearer}`,
          "x-api-key": apiKey,
          origin: "https://proveedor.mercadopublico.cl",
          referer: "https://proveedor.mercadopublico.cl/",
        },
      }
    );

    const responseText = await response.text();
    let payload;

    try {
      payload = JSON.parse(responseText);
    } catch {
      return jsonResponse(
        {
          ok: false,
          status: response.status,
          total: 0,
          inserted_or_updated: 0,
          skipped: 0,
          errors: 1,
          error: "Mercado Publico no devolvio JSON valido.",
        },
        502
      );
    }

    if (!response.ok) {
      return jsonResponse(
        {
          ok: false,
          status: response.status,
          total: 0,
          inserted_or_updated: 0,
          skipped: 0,
          errors: 1,
          error: "Error consultando Mercado Publico.",
        },
        response.status
      );
    }

    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload?.data?.content)
          ? payload.data.content
          : [];

    const { data: keywordsData, error: keywordsError } = await supabase
      .from("market_keywords")
      .select("keyword, priority")
      .eq("is_active", true);

    if (keywordsError) {
      return jsonResponse(
        {
          ok: false,
          total: items.length,
          inserted_or_updated: 0,
          skipped: items.length,
          errors: 1,
          error: "No se pudieron cargar keywords de Mercado Publico.",
        },
        500
      );
    }

    const keywords = keywordsData || [];
    const candidateExternalIds = items
      .map((item) =>
        getValue(item, ["code", "external_id", "CodigoExterno", "codigo", "id"])
      )
      .filter(Boolean)
      .map(String);

    const existingReviewStatusByExternalId = new Map();

    if (candidateExternalIds.length > 0) {
      const { data: existingData, error: existingError } = await supabase
        .from("market_opportunities")
        .select("external_id, review_status")
        .eq("source", "mercado_publico")
        .in("external_id", candidateExternalIds);

      if (existingError) {
        return jsonResponse(
          {
            ok: false,
            total: items.length,
            inserted_or_updated: 0,
            skipped: items.length,
            errors: 1,
            error: "No se pudieron leer oportunidades existentes.",
          },
          500
        );
      }

      for (const opportunity of existingData || []) {
        existingReviewStatusByExternalId.set(
          String(opportunity.external_id),
          opportunity.review_status
        );
      }
    }

    const records = items
      .map((item) =>
        normalizeOpportunity(item, keywords, existingReviewStatusByExternalId)
      )
      .filter(Boolean);
    const skipped = Math.max(items.length - records.length, 0);

    if (records.length === 0) {
      return jsonResponse({
        ok: true,
        total: items.length,
        nuevas: 0,
        actualizadas: 0,
        inserted_or_updated: 0,
        skipped,
        errors: 0,
      });
    }

    const nuevas = records.filter(
      (record) => !existingReviewStatusByExternalId.has(record.external_id)
    ).length;
    const actualizadas = records.length - nuevas;

    const { error: upsertError } = await supabase
      .from("market_opportunities")
      .upsert(records, { onConflict: "source,external_id" });

    if (upsertError) {
      return jsonResponse(
        {
          ok: false,
          total: items.length,
          nuevas: 0,
          actualizadas: 0,
          inserted_or_updated: 0,
          skipped,
          errors: 1,
          error: "No se pudieron guardar oportunidades.",
        },
        500
      );
    }

    return jsonResponse({
      ok: true,
      total: items.length,
      nuevas,
      actualizadas,
      inserted_or_updated: records.length,
      skipped,
      errors: 0,
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        total: 0,
        inserted_or_updated: 0,
        skipped: 0,
        errors: 1,
        error: "Error interno sincronizando Mercado Publico.",
      },
      500
    );
  }
});
