import { useCallback, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import InventoryPanel from "./operations/InventoryPanel"
import MaterialCalculator from "./operations/MaterialCalculator"
import OperationsSummary from "./operations/OperationsSummary"
import ProductionOptimizer from "./operations/ProductionOptimizer"
import PurchaseRequestsPanel from "./operations/PurchaseRequestsPanel"

const sections = [["summary", "Resumen"], ["requests", "Solicitudes"], ["inventory", "Inventario"], ["calculator", "Calculador"], ["production", "Fabricación"]]

export default function OperationsPanel({ projects = [], profile }) {
  const [section, setSection] = useState("summary")
  const [requests, setRequests] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculation, setCalculation] = useState({ rows: [], pieces: [], fabricOptimization: { rows: [], rejected: [] }, materials: [], input: "", projectId: "" })

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const [requestResult, itemResult] = await Promise.all([
      supabase.from("purchase_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("purchase_request_items").select("*").order("created_at", { ascending: true }),
    ])
    if (requestResult.error || itemResult.error) {
      console.error(requestResult.error || itemResult.error)
      alert("No se pudieron cargar las solicitudes de materiales.")
    } else {
      setRequests(requestResult.data || [])
      setItems(itemResult.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // The first request synchronizes this panel with Supabase on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests()
  }, [loadRequests])

  return <section className="operations-shell">
    <div className="dashboard-header operations-heading"><div><h1>Operaciones</h1><p>Solicitudes, materiales y preparación de fabricación en un solo flujo.</p></div></div>
    <nav className="operations-tabs" aria-label="Secciones de operaciones">{sections.map(([id, label]) => <button key={id} type="button" className={section === id ? "active" : ""} onClick={() => setSection(id)}>{label}</button>)}</nav>
    {section === "summary" && <OperationsSummary requests={requests} items={items} onOpenRequests={() => setSection("requests")} />}
    {section === "requests" && <PurchaseRequestsPanel projects={projects} profile={profile} requests={requests} items={items} loading={loading} onReload={loadRequests} supabase={supabase} />}
    {section === "inventory" && <InventoryPanel />}
    {section === "calculator" && <MaterialCalculator projects={projects} calculation={calculation} onCalculate={setCalculation} />}
    {section === "production" && <ProductionOptimizer calculation={calculation} />}
  </section>
}
