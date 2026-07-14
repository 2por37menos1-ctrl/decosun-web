import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MercadoPublico() {
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);

  async function loadOpportunities() {
    const { data, error } = await supabase
      .from("market_opportunities")
      .select("*")
      .gt("closing_at", new Date().toISOString())
      .order("closing_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setOpportunities(data || []);
  }

  async function handleScan() {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "escanear-mercado-publico"
      );

      if (error || data?.ok === false) {
        console.error(error || data);
        alert("No se pudo escanear Mercado Público desde el backend seguro.");
        return;
      }

      await loadOpportunities();
      alert(
        `${data?.total || 0} oportunidades revisadas. ${data?.inserted_or_updated || 0} guardadas/actualizadas.`
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo escanear Mercado Público desde el backend seguro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  function getDeadlineLabel(days) {
    if (days === null || days === undefined) return "Sin fecha";
    if (days <= 3) return "Urgente";
    if (days <= 10) return "Proxima";
    return "Vigente";
  }

  function openMercadoPublico(code) {
    if (!code) return;

    window.open(
      `https://www.mercadopublico.cl/fichaLicitacion.html?idLicitacion=${code}`,
      "_blank"
    );
  }

  async function readSyncErrorPayload(error) {
    const context = error?.context;

    if (context && typeof context.json === "function") {
      try {
        return await context.json();
      } catch {
        return null;
      }
    }

    return null;
  }

  function showSafeSyncError(payload) {
    if (payload?.error_code === "token_expired_or_unauthorized") {
      alert(
        "La sesión segura de Mercado Público expiró. Actualiza el bearer en Supabase Secrets y vuelve a sincronizar."
      );
      return;
    }

    alert(
      "No se pudo sincronizar Mercado Público. El Radar sigue disponible en modo lectura."
    );
  }

  async function syncRecommendedOpportunities() {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "importar-recomendadas"
      );

      if (error) {
        console.error(error);
        const payload = await readSyncErrorPayload(error);
        showSafeSyncError(payload);
        return;
      }

      if (data?.ok === false) {
        showSafeSyncError(data);
        return;
      }

      await loadOpportunities();

      const saved =
        data?.inserted_or_updated ??
        Number(data?.nuevas || 0) + Number(data?.actualizadas || 0);
      const errors = data?.errors ?? data?.errores ?? 0;

      alert(
        `${data?.total || 0} oportunidades revisadas. ${saved || 0} guardadas/actualizadas. Errores: ${errors}.`
      );
    } catch (error) {
      console.error(error);
      showSafeSyncError(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code) {
    if (!code) return;

    await navigator.clipboard.writeText(code);
    alert(`Codigo copiado: ${code}`);
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
      `Codigo Mercado Publico: ${item.external_id}`,
      `Tipo: ${item.mechanism_description || item.opportunity_type || ""}`,
      `Institucion: ${item.institution_name || item.buyer_name || ""}`,
      `Monto estimado: $${Number(
        item.budget_amount || item.estimated_amount || 0
      ).toLocaleString("es-CL")}`,
      `Cierre: ${
        item.closing_at
          ? new Date(item.closing_at).toLocaleString("es-CL")
          : "-"
      }`,
      `Palabras clave: ${(item.matched_keywords || []).join(", ")}`,
      `Productos detectados: ${(item.ai_products || []).join(", ")}`,
      `Compatibilidad DecoSun: ${item.ai_match_score || 0}%`,
      item.has_site_visit
        ? `Visita tecnica: ${
            item.site_visit_required ? "Obligatoria" : "Detectada"
          }`
        : "Visita tecnica: No detectada",
      item.description ? `Descripcion:\n${item.description}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const { error } = await supabase
      .from("projects")
      .insert({
        title: item.title,
        client_type: "mercado_publico",
        status: "agendado",
        company_name:
          item.institution_name ||
          item.buyer_name ||
          "Institucion Publica",
        contact_name: item.institution_name || item.buyer_name || "",
        sale_value: item.budget_amount || item.estimated_amount || 0,
        estimated_total: item.budget_amount || item.estimated_amount || 0,
        source: "mercado_publico",
        quote_origin: item.external_id,
        summary: resumen,
        address: item.site_visit_location || "",
        visit_date: item.site_visit_at
          ? item.site_visit_at.substring(0, 10)
          : null,
        region_code: item.region || mapRegionCode(item.region_code),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("No se pudo crear el proyecto.");
      return;
    }

    alert("Proyecto creado correctamente.");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mercado Publico</h1>
          <p className="text-gray-500">
            Scanner de oportunidades para DecoSun
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
        >
          {loading ? "Sincronizando..." : "Escanear Mercado Publico"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Oportunidades" value={opportunities.length} />
        <Card
          title="Nuevas"
          value={opportunities.filter((o) => o.review_status === "nueva").length}
        />
        <Card
          title="Alta prioridad"
          value={opportunities.filter((o) => o.priority === "alta").length}
        />
        <Card
          title="Por vencer"
          value={
            opportunities.filter(
              (o) => o.days_left !== null && o.days_left <= 5
            ).length
          }
        />
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-bold mb-2">Sincronizacion Mercado Publico</h3>

        <p className="text-sm leading-6 text-gray-600">
          La sincronizacion segura de Mercado Publico se ejecuta desde
          backend/Edge Function con credenciales protegidas.
        </p>

        <div className="mt-3 flex gap-2 items-center">
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
            onClick={syncRecommendedOpportunities}
            disabled={loading}
          >
            {loading ? "Sincronizando..." : "Actualizar recomendadas"}
          </button>

          <span className="text-xs text-gray-500">
            Las credenciales no se muestran ni se editan desde el navegador.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Codigo</th>
              <th className="p-3">Region</th>
              <th className="p-3">Oportunidad</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Cierre</th>
              <th className="p-3">Dias</th>
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
                <td className="p-3 font-mono text-xs">{item.external_id}</td>

                <td className="p-3 text-sm">{item.region || "-"}</td>

                <td className="p-3">
                  <div className="font-medium text-sm">{item.title}</div>

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

                <td className="p-3">{item.days_left ?? "-"}</td>

                <td className="p-3">{getDeadlineLabel(item.days_left)}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.priority === "alta"
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
                      {item.site_visit_required ? "Obligatoria" : "Revisar"}
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
                    Ver
                  </button>

                  <button
                    className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={() => copyCode(item.external_id)}
                  >
                    Codigo
                  </button>

                  <button
                    className="px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                    onClick={() => createProjectFromOpportunity(item)}
                  >
                    Proyecto
                  </button>
                </td>
              </tr>
            ))}

            {opportunities.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan="11">
                  Aun no hay oportunidades guardadas.
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
