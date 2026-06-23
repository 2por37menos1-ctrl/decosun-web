import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const serviceKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const ticket =
  import.meta.env.VITE_MERCADO_PUBLICO_TICKET;

const supabase = createClient(supabaseUrl, serviceKey);

function formatDateDDMMYYYY(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function daysLeft(closingDate?: string | null) {
  if (!closingDate) return null;
  const close = new Date(closingDate);
  const now = new Date();
  const diff = close.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function normalizeText(text?: string | null) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function scanMercadoPublico(date = new Date()) {
  if (!ticket) throw new Error("Falta MERCADO_PUBLICO_TICKET");

  const fecha = formatDateDDMMYYYY(date);

  const { data: keywordsData, error: keywordsError } = await supabase
    .from("market_keywords")
    .select("keyword, priority")
    .eq("is_active", true);

  if (keywordsError) throw keywordsError;

  const keywords = keywordsData || [];

  const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${fecha}&estado=publicada&ticket=${ticket}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error Mercado Público: ${response.status}`);
  }

  const json = await response.json();
  const listado = json?.Listado || [];

  const matches = listado
    .map((item: any) => {
      const title = item?.Nombre || "";
      const description = item?.Descripcion || "";
      const combined = normalizeText(`${title} ${description}`);

      const matchedKeywords = keywords
        .filter((k) => combined.includes(normalizeText(k.keyword)))
        .map((k) => k.keyword);

      if (matchedKeywords.length === 0) return null;

      const closingAt = item?.FechaCierre || null;

      return {
        source: "mercado_publico",
        external_id: item?.CodigoExterno,
        title,
        buyer_name: item?.Comprador?.NombreOrganismo || null,
        status: item?.Estado || String(item?.CodigoEstado || ""),
        published_at: item?.Fechas?.FechaPublicacion || null,
        closing_at: closingAt,
        days_left: daysLeft(closingAt),
        description,
        region: item?.Comprador?.RegionUnidad || null,
        estimated_amount: item?.MontoEstimado || null,
        source_url: item?.CodigoExterno
          ? `https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=${item.CodigoExterno}`
          : null,
        matched_keywords: matchedKeywords,
        raw_data: item,
        review_status: "nueva",
        priority: matchedKeywords.some((k) =>
          ["roller", "blackout", "screen", "cortinas roller", "control solar"].includes(
            normalizeText(k)
          )
        )
          ? "alta"
          : "media",
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (matches.length === 0) {
    return { inserted: 0, message: "Sin coincidencias para la fecha consultada" };
  }

  const { error } = await supabase
    .from("market_opportunities")
    .upsert(matches, { onConflict: "external_id" });

  if (error) throw error;

  return {
    inserted: matches.length,
    fecha,
    opportunities: matches,
  };
}