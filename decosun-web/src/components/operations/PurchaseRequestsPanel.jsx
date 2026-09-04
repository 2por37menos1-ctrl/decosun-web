import { useMemo, useState } from "react"
import RequestDetail from "./requests/RequestDetail"
import RequestList from "./requests/RequestList"
import RequestWizard from "./requests/RequestWizard"
import { REQUEST_FILTERS, requestStage } from "./requests/requestPresentation"

export default function PurchaseRequestsPanel({ projects, profile, requests, items, loading, onReload, supabase }) {
  const [view, setView] = useState("list")
  const [filter, setFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [saving, setSaving] = useState(false)

  const groupedItems = useMemo(() => items.reduce((result, item) => {
    if (!result[item.purchase_request_id]) result[item.purchase_request_id] = []
    result[item.purchase_request_id].push(item)
    return result
  }, {}), [items])
  const materialNames = useMemo(() => [...new Set(items.map((item) => item.material_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")), [items])
  const filteredRequests = useMemo(() => filter === "all" ? requests : requests.filter((request) => requestStage(request) === filter), [filter, requests])
  const totals = useMemo(() => ({
    pending: requests.filter((request) => requestStage(request) === "pending").length,
    process: requests.filter((request) => ["review", "purchase"].includes(requestStage(request))).length,
    received: requests.filter((request) => requestStage(request) === "received").length,
    total: requests.length,
  }), [requests])

  function openDetail(request) {
    setSelectedRequest(request)
    setSelectedItems(groupedItems[request.id] || [])
    setView("detail")
  }

  async function createRequest(draft, destination) {
    setSaving(true)
    const { data: request, error } = await supabase.from("purchase_requests").insert({
      supplier_name: "Por definir",
      status: "solicitado",
      payment_status: "pendiente",
      reception_status: "pendiente",
      total_amount: 0,
      requested_by: profile?.full_name || profile?.email || "usuario",
      requested_region: profile?.region_code || "",
      notes: draft.notes || "",
    }).select().single()
    if (error) {
      console.error(error)
      alert("No se pudo crear la solicitud.")
      setSaving(false)
      return
    }
    const payload = draft.materials.map((material) => ({
      purchase_request_id: request.id,
      project_id: draft.projectId || null,
      item_type: draft.origin,
      material_name: material.material_name,
      description: material.description || "",
      quantity: Number(material.quantity),
      unit: material.unit || "unidad",
      unit_price: 0,
      line_total: 0,
      assigned_to: destination,
      notes: material.notes || "",
      inventory_quantity: Number(material.quantity),
      consumed_quantity: draft.projectId ? Number(material.quantity) : 0,
    }))
    const { data: createdItems, error: itemsError } = await supabase.from("purchase_request_items").insert(payload).select()
    if (itemsError) {
      console.error(itemsError)
      alert("La solicitud se creó, pero sus materiales no pudieron guardarse. Revisa la solicitud antes de reintentar.")
      setSaving(false)
      await onReload()
      setView("list")
      return
    }
    await onReload()
    setSelectedRequest(request)
    setSelectedItems(createdItems || payload)
    setSaving(false)
    setView("detail")
  }

  if (view === "wizard") return <RequestWizard projects={projects} materialNames={materialNames} saving={saving} onCancel={() => setView("list")} onCreate={createRequest} />
  if (view === "detail" && selectedRequest) return <RequestDetail request={selectedRequest} items={selectedItems} onBack={() => setView("list")} />

  return <div className="request-workspace">
    <header className="request-workspace-header"><div><h1>Solicitudes de material</h1><p>Registra y revisa las necesidades del equipo antes de gestionar su compra.</p></div><button type="button" className="primary-btn request-new-button" onClick={() => setView("wizard")}>+ Nueva solicitud</button></header>
    <div className="request-summary"><article><span>Pendientes</span><strong>{totals.pending}</strong></article><article><span>En proceso</span><strong>{totals.process}</strong></article><article><span>Recibidas</span><strong>{totals.received}</strong></article><article><span>Total solicitudes</span><strong>{totals.total}</strong></article></div>
    <nav className="request-filters" aria-label="Filtrar solicitudes">{REQUEST_FILTERS.map(([id, label]) => <button type="button" key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}<span>{id === "all" ? totals.total : requests.filter((request) => requestStage(request) === id).length}</span></button>)}</nav>
    <RequestList requests={filteredRequests} groupedItems={groupedItems} loading={loading} onOpen={openDetail} />
  </div>
}
