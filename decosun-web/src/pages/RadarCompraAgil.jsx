import { useCallback, useEffect, useMemo, useState } from "react"
import { useProfile } from "../hooks/useProfile"
import { formatCompraAgilScanError, structuredFunctionError } from "../lib/compraAgilError"
import { isGerencia } from "../lib/permissions"
import { supabase } from "../lib/supabase"

const PAGE_SIZE = 25
const CHILE_REGION_OPTIONS = [
  { value: 15, label: "Arica y Parinacota (XV)" },
  { value: 1, label: "Tarapacá (I)" },
  { value: 2, label: "Antofagasta (II)" },
  { value: 3, label: "Atacama (III)" },
  { value: 4, label: "Coquimbo (IV)" },
  { value: 5, label: "Valparaíso (V)" },
  { value: 13, label: "Región Metropolitana (RM)" },
  { value: 6, label: "O'Higgins (VI)" },
  { value: 7, label: "Maule (VII)" },
  { value: 16, label: "Ñuble (XVI)" },
  { value: 8, label: "Biobío (VIII)" },
  { value: 9, label: "La Araucanía (IX)" },
  { value: 14, label: "Los Ríos (XIV)" },
  { value: 10, label: "Los Lagos (X)" },
  { value: 11, label: "Aysén (XI)" },
  { value: 12, label: "Magallanes (XII)" },
]
const EMPTY_FILTERS = {
  region: "",
  word: "",
  product: "",
  priority: "",
  closingBefore: "",
  audit: "included",
}

function formatMoney(value, currency = "CLP") {
  if (value === null || value === undefined) return "-"
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency || "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function formatDateTime(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(date)
}

function parseCsv(value) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]
}

function safeSearch(value) {
  return value.replace(/[%_(),.]/g, " ").replace(/\s+/g, " ").trim()
}

function chileEndOfDayIso(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number)
  const probe = new Date(Date.UTC(year, month - 1, day, 12))
  const zoneName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    timeZoneName: "longOffset",
  }).formatToParts(probe).find((part) => part.type === "timeZoneName")?.value || "GMT-04:00"
  const match = zoneName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  const direction = match?.[1] === "+" ? 1 : -1
  const offsetMinutes = direction * (Number(match?.[2] || 4) * 60 + Number(match?.[3] || 0))
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMinutes * 60_000).toISOString()
}

function errorMessage(error, fallback) {
  const message = String(error?.message || "")
  if (message.includes("compra_agil") || message.includes("schema cache")) {
    return "El nuevo Radar esta construido localmente, pero su migracion aun no ha sido desplegada."
  }
  return fallback
}

export default function RadarCompraAgil() {
  const { profile, loading: profileLoading } = useProfile()
  const [opportunities, setOpportunities] = useState([])
  const [metrics, setMetrics] = useState({ active: 0, urgent: 0, secondCall: 0 })
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [config, setConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
    searchTerms: "",
    productTerms: "",
    regionCodes: "",
    minimumBudget: "",
  })
  const allowed = isGerencia(profile)

  const loadConfig = useCallback(async () => {
    if (!allowed) return
    const { data, error: configError } = await supabase
      .from("compra_agil_radar_config")
      .select("*")
      .eq("id", 1)
      .single()
    if (configError) {
      setError(errorMessage(configError, "No se pudo cargar la configuracion del Radar."))
      return
    }
    setConfig(data)
    setConfigForm({
      searchTerms: (data.search_terms || []).join(", "),
      productTerms: (data.product_terms || []).join(", "),
      regionCodes: (data.region_codes || []).join(", "),
      minimumBudget: data.minimum_budget ?? "",
    })
  }, [allowed])

  const loadMetrics = useCallback(async () => {
    if (!allowed) return
    const now = new Date()
    const urgentUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000)
    const base = () => supabase
      .from("compra_agil_opportunities")
      .select("id", { count: "exact", head: true })
      .eq("is_relevant", true)
      .eq("status", "publicada")
      .gt("closing_at", now.toISOString())
    const [active, urgent, secondCall] = await Promise.all([
      base(),
      base().lte("closing_at", urgentUntil.toISOString()),
      base().eq("call_number", 2),
    ])
    const metricError = active.error || urgent.error || secondCall.error
    if (metricError) {
      setError(errorMessage(metricError, "No se pudieron calcular las metricas del Radar."))
      return
    }
    setMetrics({ active: active.count || 0, urgent: urgent.count || 0, secondCall: secondCall.count || 0 })
  }, [allowed])

  const loadOpportunities = useCallback(async () => {
    if (!allowed) return
    setLoading(true)
    setError("")
    try {
      let query = supabase.from("compra_agil_opportunities").select("*", { count: "exact" })
      if (filters.audit === "included") {
        query = query
          .eq("is_relevant", true)
          .eq("status", "publicada")
          .gt("closing_at", new Date().toISOString())
      } else if (filters.audit === "excluded") {
        query = query.eq("is_relevant", false)
      }
      if (filters.region) query = query.eq("region_code", Number(filters.region))
      if (filters.priority) query = query.eq("priority", filters.priority)
      if (filters.product) query = query.contains("matched_products", [filters.product])
      if (filters.closingBefore) query = query.lte("closing_at", chileEndOfDayIso(filters.closingBefore))
      const word = safeSearch(filters.word)
      if (word) query = query.or(`title.ilike.%${word}%,description.ilike.%${word}%`)

      const from = (page - 1) * PAGE_SIZE
      const { data, count, error: listError } = await query
        .order("closing_at", { ascending: true, nullsFirst: false })
        .range(from, from + PAGE_SIZE - 1)
      if (listError) throw listError
      setOpportunities(data || [])
      setTotal(count || 0)
    } catch (loadError) {
      setOpportunities([])
      setTotal(0)
      setError(errorMessage(loadError, "No se pudieron cargar las oportunidades."))
    } finally {
      setLoading(false)
    }
  }, [allowed, filters, page])

  useEffect(() => {
    if (!allowed) return
    loadConfig()
    loadMetrics()
  }, [allowed, loadConfig, loadMetrics])

  useEffect(() => {
    loadOpportunities()
  }, [loadOpportunities])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const regionOptions = useMemo(() => {
    const configured = config?.region_codes || []
    if (!configured.length) return CHILE_REGION_OPTIONS
    const configuredValues = new Set(configured.map(Number))
    return CHILE_REGION_OPTIONS.filter((region) => configuredValues.has(region.value))
  }, [config])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(1)
  }

  async function handleScan() {
    setScanning(true)
    setError("")
    setNotice("")
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("escanear-compra-agil", { body: {} })
      if (invokeError || data?.success === false || data?.ok === false) {
        const details = await structuredFunctionError(data, invokeError)
        setError(formatCompraAgilScanError(details))
        return
      }
      setNotice(`Escaneo completado: ${data.unique_candidates || 0} candidatos, ${data.relevant || 0} incluidos y ${data.excluded || 0} excluidos.`)
      await Promise.all([loadOpportunities(), loadMetrics(), loadConfig()])
    } catch (scanError) {
      setError(errorMessage(scanError, "No se pudo ejecutar el escaneo Compra Agil."))
    } finally {
      setScanning(false)
    }
  }

  async function saveConfig() {
    const searchTerms = parseCsv(configForm.searchTerms)
    const productTerms = parseCsv(configForm.productTerms)
    const regionCodes = parseCsv(configForm.regionCodes)
      .map(Number)
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= 16)
    if (!searchTerms.length) {
      setError("Debes configurar al menos un termino de busqueda.")
      return
    }
    setSavingConfig(true)
    setError("")
    const { error: updateError } = await supabase
      .from("compra_agil_radar_config")
      .update({
        search_terms: searchTerms,
        product_terms: productTerms,
        region_codes: regionCodes,
        minimum_budget: configForm.minimumBudget === "" ? null : Number(configForm.minimumBudget),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
    setSavingConfig(false)
    if (updateError) {
      setError(errorMessage(updateError, "No se pudo guardar la configuracion."))
      return
    }
    setNotice("Configuracion del Radar guardada.")
    await loadConfig()
  }

  if (profileLoading) return <div className="p-6 text-slate-500">Validando acceso...</div>
  if (!allowed) {
    return <div className="p-6"><div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">No tienes permiso para acceder al Radar Compra Agil.</div></div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Mercado Publico</p>
          <h1 className="text-2xl font-bold text-slate-900">Radar Compra Agil</h1>
          <p className="mt-1 text-sm text-slate-500">API publica Compra Agil V2 · acceso exclusivo gerencia</p>
        </div>
        <button type="button" onClick={handleScan} disabled={scanning || Boolean(error && !config)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {scanning ? "Escaneando..." : "Escanear Compra Agil"}
        </button>
      </div>

      {error && <div className="mb-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric title="Vigentes" value={metrics.active} />
        <Metric title="Urgentes · 72 horas" value={metrics.urgent} tone="red" />
        <Metric title="Segundo llamado" value={metrics.secondCall} tone="amber" />
      </div>

      <details className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer font-semibold text-slate-800">Configuracion de cobertura</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Terminos de busqueda, separados por coma"><textarea value={configForm.searchTerms} onChange={(event) => setConfigForm((current) => ({ ...current, searchTerms: event.target.value }))} className="min-h-20 w-full rounded-lg border border-slate-300 p-2 text-sm" /></Field>
          <Field label="Productos y sinonimos, separados por coma"><textarea value={configForm.productTerms} onChange={(event) => setConfigForm((current) => ({ ...current, productTerms: event.target.value }))} className="min-h-20 w-full rounded-lg border border-slate-300 p-2 text-sm" /></Field>
          <Field label="Codigos de region; vacio significa todas"><input value={configForm.regionCodes} onChange={(event) => setConfigForm((current) => ({ ...current, regionCodes: event.target.value }))} className="w-full rounded-lg border border-slate-300 p-2 text-sm" /></Field>
          <Field label="Presupuesto minimo opcional"><input type="number" min="0" value={configForm.minimumBudget} onChange={(event) => setConfigForm((current) => ({ ...current, minimumBudget: event.target.value }))} className="w-full rounded-lg border border-slate-300 p-2 text-sm" /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveConfig} disabled={savingConfig} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{savingConfig ? "Guardando..." : "Guardar configuracion"}</button>
          <span className="text-xs text-slate-500">Ultimo estado: {config?.last_scan_status || "-"} · watermark: {formatDateTime(config?.last_successful_change_at)}</span>
        </div>
      </details>

      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-6">
        <select value={filters.audit} onChange={(event) => updateFilter("audit", event.target.value)} className="rounded-lg border border-slate-300 p-2 text-sm"><option value="included">Incluidas vigentes</option><option value="excluded">Excluidas · auditor</option><option value="all">Todas las evaluadas</option></select>
        <div>
          <select value={filters.region} onChange={(event) => updateFilter("region", event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm"><option value="">Chile completo</option>{regionOptions.map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}</select>
          <p className="mt-1 text-xs text-slate-500">La región solo filtra la visualización. El Radar continúa evaluando oportunidades de todo Chile.</p>
        </div>
        <input placeholder="Palabra" value={filters.word} onChange={(event) => updateFilter("word", event.target.value)} className="rounded-lg border border-slate-300 p-2 text-sm" />
        <select value={filters.product} onChange={(event) => updateFilter("product", event.target.value)} className="rounded-lg border border-slate-300 p-2 text-sm"><option value="">Todos los productos</option>{(config?.product_terms || []).map((product) => <option key={product} value={product}>{product}</option>)}</select>
        <select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)} className="rounded-lg border border-slate-300 p-2 text-sm"><option value="">Toda prioridad</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select>
        <input type="date" title="Cierre hasta" value={filters.closingBefore} onChange={(event) => updateFilter("closingBefore", event.target.value)} className="rounded-lg border border-slate-300 p-2 text-sm" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="p-3">Codigo</th><th className="p-3">Oportunidad</th><th className="p-3">Region</th><th className="p-3">Presupuesto</th><th className="p-3">Cierre</th><th className="p-3">Llamado</th><th className="p-3">Prioridad</th><th className="p-3">Auditoria</th><th className="p-3">Accion</th></tr></thead>
            <tbody>
              {opportunities.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="p-3 font-mono text-xs">{item.external_id}</td>
                  <td className="p-3"><div className="font-medium text-slate-900">{item.title}</div><div className="mt-1 text-xs text-slate-500">{item.institution_name || "-"}</div></td>
                  <td className="p-3">{item.region_name || item.region_code || "-"}</td><td className="p-3">{formatMoney(item.budget_amount, item.currency)}</td><td className="p-3">{formatDateTime(item.closing_at)}</td><td className="p-3">{item.call_number === 2 ? "Segundo" : "Primero"}</td>
                  <td className="p-3"><Priority value={item.priority} score={item.priority_score} /></td><td className="p-3 text-xs">{item.is_relevant ? (item.matched_keywords || []).join(", ") || "Incluida" : item.exclusion_reason || "Excluida"}</td><td className="p-3"><button type="button" onClick={() => setSelected(item)} className="rounded-lg bg-indigo-50 px-3 py-1 text-indigo-700">Detalle</button></td>
                </tr>
              ))}
              {!loading && opportunities.length === 0 && <tr><td colSpan="9" className="p-8 text-center text-slate-500">No hay oportunidades para los filtros seleccionados.</td></tr>}
              {loading && <tr><td colSpan="9" className="p-8 text-center text-slate-500">Cargando oportunidades...</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-3 text-sm"><span>{total} registros · pagina {page} de {totalPages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Anterior</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Siguiente</button></div></div>
      </div>

      {selected && <OpportunityDetail item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Metric({ title, value, tone = "indigo" }) {
  const tones = { indigo: "border-indigo-200 bg-indigo-50", red: "border-red-200 bg-red-50", amber: "border-amber-200 bg-amber-50" }
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}><div className="text-sm text-slate-600">{title}</div><div className="mt-1 text-3xl font-bold text-slate-900">{value}</div></div>
}

function Field({ label, children }) {
  return <label className="text-sm text-slate-600"><span className="mb-1 block font-medium">{label}</span>{children}</label>
}

function Priority({ value, score }) {
  const colors = value === "alta" ? "bg-red-100 text-red-700" : value === "media" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors}`}>{value} · {score}</span>
}

function OpportunityDetail({ item, onClose }) {
  const products = Array.isArray(item.products) ? item.products : []
  const documents = Array.isArray(item.documents) ? item.documents : []
  const evidence = item.match_evidence && typeof item.match_evidence === "object" ? item.match_evidence : {}
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" onMouseDown={onClose}>
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs text-slate-500">{item.external_id}</p><h2 className="mt-1 text-xl font-bold">{item.title}</h2></div><button type="button" onClick={onClose} className="rounded border px-3 py-1">Cerrar</button></div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description || "Sin descripcion detallada."}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Detail label="Institucion" value={item.institution_name} /><Detail label="Unidad" value={item.unit_name} /><Detail label="Region" value={item.region_name || item.region_code} /><Detail label="Presupuesto" value={formatMoney(item.budget_amount, item.currency)} />
          <Detail label="Primer cierre" value={formatDateTime(item.first_call_closing_at)} /><Detail label="Segundo cierre" value={formatDateTime(item.second_call_closing_at)} /><Detail label="Cierre vigente" value={formatDateTime(item.closing_at)} /><Detail label="Ofertas recibidas" value={item.offers_received ?? "-"} />
          <Detail label="Direccion entrega" value={item.delivery_address} /><Detail label="Plazo entrega" value={item.delivery_days === null ? "-" : `${item.delivery_days} dias`} /><Detail label="Orden de compra" value={item.purchase_order_id} /><Detail label="Ultimo cambio" value={formatDateTime(item.last_changed_at)} />
        </div>
        <Section title="Productos">{products.length ? products.map((product, index) => <div key={`${product.codigo_producto || "p"}-${index}`} className="border-b py-2 text-sm"><strong>{product.nombre || "Producto"}</strong><div className="text-slate-500">{product.descripcion || ""}</div></div>) : <Empty />}</Section>
        <Section title="Documentos">{documents.length ? documents.map((document, index) => <div key={`${document.id || "d"}-${index}`} className="border-b py-2 text-sm">{document.nombre || document.id || "Documento"}</div>) : <Empty />}</Section>
        <Section title="Auditor de inclusion / exclusion"><div className="grid gap-3 sm:grid-cols-2"><Detail label="Resultado" value={item.is_relevant ? "Incluida" : `Excluida: ${item.exclusion_reason || "sin motivo"}`} /><Detail label="Keywords" value={(item.matched_keywords || []).join(", ") || "-"} /><Detail label="Productos coincidentes" value={(item.matched_products || []).join(", ") || "-"} /><Detail label="Detalle evaluado" value={evidence.detail_evaluated ? "Si" : "No; solo listado"} /></div><pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(evidence.score_components || {}, null, 2)}</pre></Section>
      </aside>
    </div>
  )
}

function Detail({ label, value }) {
  return <div className="text-sm"><div className="text-xs uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-slate-800">{value ?? "-"}</div></div>
}

function Section({ title, children }) {
  return <section className="mt-6"><h3 className="mb-2 font-semibold text-slate-900">{title}</h3><div className="rounded-xl border border-slate-200 p-4">{children}</div></section>
}

function Empty() {
  return <p className="text-sm text-slate-500">Sin informacion.</p>
}
