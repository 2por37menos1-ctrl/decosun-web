// @ts-nocheck

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { bearerToken, apiKey } = await req.json();

    if (!bearerToken || !apiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Faltan bearerToken o apiKey",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (supabaseUrl && serviceRoleKey) {
      createClient(
        supabaseUrl,
        serviceRoleKey
      );
    }

    const response = await fetch(
      "https://ywri2h0ar5.execute-api.us-east-1.amazonaws.com/escritorio/oportunidades/recomendadas",
      {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${bearerToken}`,
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
          body: responseText,
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
          body: json,
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