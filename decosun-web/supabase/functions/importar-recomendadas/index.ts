// @ts-nocheck

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Permitir preflight del navegador (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const bearerToken = Deno.env.get("MERCADO_PUBLICO_BEARER_TOKEN");
    const apiKey = Deno.env.get("MERCADO_PUBLICO_API_KEY");

    if (!bearerToken || !apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "Faltan credenciales server-side de Mercado Publico. Configura MERCADO_PUBLICO_BEARER_TOKEN y MERCADO_PUBLICO_API_KEY como secrets.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // No es estrictamente necesario todavía,
    // pero lo dejamos listo para futuras inserciones
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

    // Si Mercado Público responde algo que no es JSON
    let json;

    try {
      json = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          status: response.status,
          error: "Mercado Público no devolvió JSON válido",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          status: response.status,
          error: "Error consultando Mercado Público",
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const items = json?.content || [];

    return new Response(
      JSON.stringify({
        ok: true,
        total: items.length,
        data: json,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
