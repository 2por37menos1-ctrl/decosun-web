// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { requireAuthorizedMarketUser } from "../_shared/marketOpportunity.ts";
import { normalizeAndSaveOpportunities } from "../_shared/marketSync.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const formatDate = (date: Date) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.day}${parts.month}${parts.year}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error_code: "method_not_allowed" }, 405);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ticket = Deno.env.get("MERCADO_PUBLICO_TICKET");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ ok: false, error_code: "missing_supabase_secrets" }, 500);
    const authorization = await requireAuthorizedMarketUser(req, supabaseUrl, anonKey);
    if (!authorization.ok) return json({ ok: false, error_code: authorization.errorCode }, authorization.status);
    if (!ticket) return json({ ok: false, error_code: "missing_mercado_publico_ticket" }, 500);

    const body = await req.json().catch(() => ({}));
    const requestedDate = body?.date ? new Date(`${body.date}T12:00:00`) : new Date();
    if (Number.isNaN(requestedDate.getTime())) return json({ ok: false, error_code: "invalid_date" }, 400);
    const fecha = formatDate(requestedDate);
    const url = new URL("https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json");
    url.searchParams.set("fecha", fecha);
    url.searchParams.set("estado", "publicada");
    url.searchParams.set("ticket", ticket);
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) return json({ ok: false, error_code: "mercado_publico_request_failed", status: response.status }, response.status);
    const payload = await response.json();
    const items = Array.isArray(payload?.Listado) ? payload.Listado : [];
    const stats = await normalizeAndSaveOpportunities({ items, channel: "public_api", supabaseUrl, serviceRoleKey });
    return json({ ok: true, fecha, ...stats, errors: 0 });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "internal_scan_error";
    return json({ ok: false, error_code: errorCode, errors: 1 }, 500);
  }
});
