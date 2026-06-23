import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { testMercadoPublico } from "../lib/testMercadoPublico";
import { scanCompraAgil } from "../lib/compraAgilScanner";



export default function MercadoPublico() {
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [jsonInput, setJsonInput] = useState("");

  const [mpBearerToken, setMpBearerToken] = useState("");
  const [mpApiKey, setMpApiKey] = useState("");
  const [mpSettings, setMpSettings] = useState(null);

  async function loadOpportunities() {
    const { data, error } = await supabase
      .from("market_opportunities")
      .select("*")
      .gte("days_left", 0)
      .order("closing_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setOpportunities(data || []);
  }

  async function handleScan() {
    setLoading(true);
    const result = await testMercadoPublico();
    console.log("Resultado scanner:", result);
    await loadOpportunities();
    setLoading(false);
  }

  async function loadMarketPublicSettings() {
    const { data, error } = await supabase
      .from("market_public_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setMpSettings(data);
      setMpBearerToken(data.bearer_token || "");
      setMpApiKey(data.api_key || "");
    }
  }

  useEffect(() => {
    loadOpportunities();
    loadMarketPublicSettings();
  }, []);

  function getDeadlineLabel(days) {
    if (days === null || days === undefined) return "Sin fecha";
    if (days <= 3) return "🔴 Urgente";
    if (days <= 10) return "🟡 Próxima";
    return "🟢 Vigente";
  }

  function openMercadoPublico(code) {
    if (!code) return;

    window.open(
      `https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=${code}`,
      "_blank"
    );
  }

  async function testCompraAgil() {
    const ejemplo = [
      {
        code: "2626-294-COT26",
        isFollowed: null,
        name: "CORTINAS ROLLER BLACK OUT",
        description:
          "Visita tecnica obligatoria el dia 24 de junio a las 11:00 hrs. Adjuntar cotizacion formal y ficha tecnica",
        openingDate: "2026-06-22T16:54:19.350Z",
        receptionDate: "2026-06-24T16:00:00Z",
        mechanismCode: "CA",
        mechanismDescription: "Compra Ágil",
        estimatedAmount: 1000000,
        legalName: "I MUNICIPALIDAD DE PUTAENDO",
        legalNameCode: "98280",
        orgName: "OFICINA DE ADQUISICIONES",
        guarantee: "Sin garantías",
        currency: "CLP",
        regionCode: 5,
        isPublicBudget: true,
        proposalState: 1
      }
    ];

    const result = await scanCompraAgil(ejemplo);

    console.log(result);
  }

  async function importarJsonRecomendadas() {
    try {
      const parsed = JSON.parse(jsonInput);

      const oportunidades = Array.isArray(parsed)
        ? parsed
        : parsed.content || [];

      const result = await scanCompraAgil(oportunidades);

      console.log("Importación JSON recomendadas:", result);

      await loadOpportunities();

      setJsonInput("");
    } catch (error) {
      console.error(error);
      alert("El JSON no es válido o no tiene formato esperado.");
    }
  }

  async function actualizarRecomendadas() {
    try {
      const bearerToken = prompt("Bearer Token");
      const apiKey = prompt("x-api-key");

      if (!bearerToken || !apiKey) {
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "importar-recomendadas",
        {
          body: {
            bearerToken,
            apiKey,
          },
        }
      );

      console.log("Respuesta función:", data);

      if (error) {
        console.error(error);
        alert("Error consultando Mercado Público.");
        return;
      }

      const result = await scanCompraAgil(data.data.content || []);

      console.log("Importación automática recomendadas:", result);

      await loadOpportunities();

      alert(`${data.total} oportunidades revisadas. ${result.inserted || 0} guardadas/actualizadas.`);
    } catch (error) {
      console.error(error);
      alert("Error ejecutando función.");
    }
  }

  async function saveMarketPublicSettings() {
    const payload = {
      bearer_token: mpBearerToken.trim(),
      api_key: mpApiKey.trim(),
      status: "guardado",
      updated_at: new Date().toISOString(),
    };

    if (!payload.bearer_token || !payload.api_key) {
      alert("Debes ingresar Bearer Token y API Key.");
      return;
    }

    if (mpSettings?.id) {
      const { data, error } = await supabase
        .from("market_public_settings")
        .update(payload)
        .eq("id", mpSettings.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        alert("No se pudo guardar la configuración.");
        return;
      }

      setMpSettings(data);
      alert("Configuración guardada.");
      return;
    }

    const { data, error } = await supabase
      .from("market_public_settings")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("No se pudo guardar la configuración.");
      return;
    }

    setMpSettings(data);
    alert("Configuración guardada.");
  }

  async function copyCode(code) {
    if (!code) return;

    await navigator.clipboard.writeText(code);
    alert(`Código copiado: ${code}`);
  }

  function mapRegionCode(regionCode) {
    const regions = {
      1: "tarapaca",
      2: "antofagasta",
      3: "atacama",
      4: "coquimbo",
      5: "quinta_region",
      13: "metropolitana",
      15: "arica_parinacota",
      16: "nuble",

    };

    return regions[regionCode] || "metropolitana";
  }

  async function createProjectFromOpportunity(item) {
    if (!item) return;

    const resumen = [
      `Código Mercado Público: ${item.external_id}`,
      `Tipo: ${item.mechanism_description || item.opportunity_type || ""}`,
      `Institución: ${item.institution_name || item.buyer_name || ""}`,
      `Monto estimado: $${Number(
        item.budget_amount || item.estimated_amount || 0
      ).toLocaleString("es-CL")}`,
      `Cierre: ${item.closing_at
        ? new Date(item.closing_at).toLocaleString("es-CL")
        : "-"
      }`,
      `Palabras clave: ${(item.matched_keywords || []).join(", ")}`,
      `Productos detectados: ${(item.ai_products || []).join(", ")}`,
      `Compatibilidad DecoSun: ${item.ai_match_score || 0}%`,
      item.has_site_visit
        ? `Visita técnica: ${item.site_visit_required ? "Obligatoria" : "Detectada"
        }`
        : "Visita técnica: No detectada",
      item.description ? `Descripción:\n${item.description}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    console.log("Crear proyecto desde MP", {
      external_id: item.external_id,
      region: item.region,
      region_code: item.region_code,
      mapped_region: mapRegionCode(item.region_code),
    });

    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: item.title,
        client_type: "mercado_publico",
        status: "agendado",

        company_name:
          item.institution_name ||
          item.buyer_name ||
          "Institución Pública",

        contact_name:
          item.institution_name ||
          item.buyer_name ||
          "",

        sale_value:
          item.budget_amount ||
          item.estimated_amount ||
          0,

        estimated_total:
          item.budget_amount ||
          item.estimated_amount ||
          0,

        source: "mercado_publico",

        quote_origin: item.external_id,

        summary: resumen,

        address: item.site_visit_location || "",

        visit_date:
          item.site_visit_at
            ? item.site_visit_at.substring(0, 10)
            : null,

        region_code:
          item.region ||
          mapRegionCode(item.region_code),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("No se pudo crear el proyecto.");
      return;
    }

    alert("Proyecto creado correctamente.");
    console.log("Proyecto creado:", data);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mercado Público</h1>
          <p className="text-gray-500">
            Scanner de oportunidades para DecoSun
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
        >
          {loading ? "Escaneando..." : "Escanear Mercado Público"}
        </button>

        <button
          onClick={actualizarRecomendadas}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
        >
          Actualizar recomendadas
        </button>

        <button
          className="secondary-btn"
          onClick={testCompraAgil}
        >
          Importar Compra Ágil (Test)
        </button>


      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Oportunidades" value={opportunities.length} />
        <Card
          title="Nuevas"
          value={opportunities.filter(o => o.review_status === "nueva").length}
        />
        <Card
          title="Alta prioridad"
          value={opportunities.filter(o => o.priority === "alta").length}
        />
        <Card
          title="Por vencer"
          value={opportunities.filter(o => o.days_left !== null && o.days_left <= 5).length}
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-bold mb-2">Configuración Mercado Público</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Bearer Token</label>
            <input
              className="w-full border rounded-lg p-2 text-xs"
              type="password"
              value={mpBearerToken}
              onChange={(e) => setMpBearerToken(e.target.value)}
              placeholder="Pega aquí el Bearer Token"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">x-api-key</label>
            <input
              className="w-full border rounded-lg p-2 text-xs"
              type="password"
              value={mpApiKey}
              onChange={(e) => setMpApiKey(e.target.value)}
              placeholder="Pega aquí la API Key"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 items-center">
          <button
            className="px-4 py-2 rounded-lg bg-gray-800 text-white"
            onClick={saveMarketPublicSettings}
          >
            Guardar configuración
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
            onClick={actualizarRecomendadas}
          >
            🔄 Actualizar recomendadas
          </button>

          <span className="text-xs text-gray-500">
            Estado: {mpSettings?.status || "sin configurar"}
            {mpSettings?.last_sync_at
              ? ` · Última sync: ${new Date(mpSettings.last_sync_at).toLocaleString("es-CL")}`
              : ""}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-bold mb-2">
          Importar recomendadas desde JSON
        </h3>

        <textarea
          className="w-full border rounded-lg p-3 text-xs"
          rows={8}
          placeholder="Pega aquí el JSON de Mercado Público..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />

        <div className="mt-3">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            disabled={!jsonInput.trim()}
            onClick={importarJsonRecomendadas}
          >
            Importar JSON
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Región</th>
              <th className="p-3">Oportunidad</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Cierre</th>
              <th className="p-3">Días</th>
              <th className="p-3">Estado plazo</th>
              <th className="p-3">Prioridad</th>
              <th className="p-3">Palabras</th>
              <th className="p-3">Visita</th>
              <th className="p-3">Acciones</th>

            </tr>
          </thead>

          <tbody>
            {opportunities.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-mono text-xs">
                  {item.external_id}
                </td>

                <td className="p-3 text-sm">
                  {item.region || "-"}
                </td>

                <td className="p-3">
                  <div className="font-medium text-sm">
                    {item.title}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {item.institution_name || item.buyer_name}
                  </div>

                  <div className="text-xs text-blue-600 font-medium">
                    {item.mechanism_description}
                  </div>
                </td>

                <td className="p-3">
                  {item.budget_amount
                    ? `$${Number(item.budget_amount).toLocaleString("es-CL")}`
                    : "-"}
                </td>

                <td className="p-3">
                  {item.closing_at
                    ? new Date(item.closing_at).toLocaleDateString("es-CL")
                    : "-"}
                </td>

                <td className="p-3">
                  {item.days_left ?? "-"}
                </td>

                <td className="p-3">
                  {getDeadlineLabel(item.days_left)}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${item.priority === "alta"
                      ? "bg-red-100 text-red-700"
                      : item.priority === "media"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                      }`}
                  >
                    {item.priority}
                  </span>
                </td>

                <td className="p-3">
                  {(item.matched_keywords || []).join(", ")}
                </td>

                <td className="p-3">
                  {item.has_site_visit ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                      {item.site_visit_required
                        ? "🔴 Obligatoria"
                        : "🟡 Revisar"}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3">
                  <button
                    className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={() => openMercadoPublico(item.external_id)}
                  >
                    🔍 Ver
                  </button>

                  <button
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => copyCode(item.external_id)}
                  >
                    📋 Código
                  </button>

                  <button
                    className="px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                    onClick={() => createProjectFromOpportunity(item)}
                  >
                    ➕ Proyecto
                  </button>

                </td>

              </tr>
            ))}

            {opportunities.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan="11">
                  Aún no hay oportunidades guardadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}