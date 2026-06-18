import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

const suppliers = [
  "Merigui",
  "IGEMI",
  "Linda Sabbat / Scarlett",
  "FlashRoller",
  "Otro",
]

const requestStatuses = [
  "solicitado",
  "aprobado",
  "pagado",
  "recibido",
  "anulado",
]

const itemTypes = [
  "cliente",
  "inventario",
  "garantia",
  "reposicion",
]

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function formatDate(dateString) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("es-CL")
}

export default function OperationsPanel({ projects, profile }) {
  const [requests, setRequests] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    supplier_name: "Merigui",
    notes: "",
  })

  const [itemForm, setItemForm] = useState({
    project_id: "",
    item_type: "cliente",
    material_name: "",
    description: "",
    quantity: 1,
    unit: "unidad",
    unit_price: 0,
    line_total: 0,
    notes: "",
  })

  const [draftItems, setDraftItems] = useState([])

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    setLoading(true)

    const { data: requestData, error: requestError } = await supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (requestError) {
      console.error(requestError)
      alert("No se pudieron cargar las solicitudes.")
      setLoading(false)
      return
    }

    const { data: itemData, error: itemError } = await supabase
      .from("purchase_request_items")
      .select("*")
      .order("created_at", { ascending: true })

    if (itemError) {
      console.error(itemError)
      alert("No se pudieron cargar los ítems.")
      setLoading(false)
      return
    }

    setRequests(requestData || [])
    setItems(itemData || [])
    setLoading(false)
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateItemForm(field, value) {
    setItemForm((current) => {
      const next = {
        ...current,
        [field]: value,
      }

      if (field === "quantity" || field === "unit_price") {
        next.line_total =
          Number(field === "quantity" ? value : next.quantity || 0) *
          Number(field === "unit_price" ? value : next.unit_price || 0)
      }

      return next
    })
  }

  function addDraftItem() {
    if (!itemForm.material_name.trim() && !itemForm.description.trim()) {
      alert("Debes ingresar el material o detalle.")
      return
    }

    const selectedProject = projects.find(
      (project) => project.id === itemForm.project_id
    )

    const lineTotal =
      Number(itemForm.line_total || 0) ||
      Number(itemForm.quantity || 0) * Number(itemForm.unit_price || 0)

    setDraftItems((current) => [
      ...current,
      {
        ...itemForm,
        project_title: selectedProject?.title || "",
        project_id: itemForm.project_id || null,
        item_type: itemForm.project_id ? "cliente" : itemForm.item_type,
        quantity: Number(itemForm.quantity || 1),
        unit_price: Number(itemForm.unit_price || 0),
        line_total: Number(lineTotal || 0),
      },
    ])

    setItemForm({
      project_id: "",
      item_type: "cliente",
      material_name: "",
      description: "",
      quantity: 1,
      unit: "unidad",
      unit_price: 0,
      line_total: 0,
      notes: "",
    })
  }

  function removeDraftItem(index) {
    setDraftItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function createRequest(event) {
    event.preventDefault()

    if (!form.supplier_name) {
      alert("Debes seleccionar proveedor.")
      return
    }

    if (draftItems.length === 0) {
      alert("Debes agregar al menos un ítem.")
      return
    }

    const totalAmount = draftItems.reduce(
      (acc, item) => acc + Number(item.line_total || 0),
      0
    )

    const { data: request, error: requestError } = await supabase
      .from("purchase_requests")
      .insert({
        supplier_name: form.supplier_name,
        status: "solicitado",
        payment_status: "pendiente",
        reception_status: "pendiente",
        total_amount: totalAmount,
        requested_by: profile?.full_name || profile?.email || "usuario",
        requested_region: profile?.region_code || "",
        notes: form.notes || "",
      })
      .select()
      .single()

    if (requestError) {
      console.error(requestError)
      alert("No se pudo crear la solicitud.")
      return
    }

    const payloadItems = draftItems.map((item) => ({
      purchase_request_id: request.id,
      project_id: item.project_id || null,
      item_type: item.item_type || "cliente",
      material_name: item.material_name || "",
      description: item.description || "",
      quantity: Number(item.quantity || 1),
      unit: item.unit || "unidad",
      unit_price: Number(item.unit_price || 0),
      line_total: Number(item.line_total || 0),
      assigned_to: item.project_title || item.item_type,
      notes: item.notes || "",
      inventory_quantity: Number(item.quantity || 0),
      consumed_quantity: item.project_id ? Number(item.quantity || 0) : 0,
    }))

    const { error: itemsError } = await supabase
      .from("purchase_request_items")
      .insert(payloadItems)

    if (itemsError) {
      console.error(itemsError)
      alert("La solicitud se creó, pero no se pudieron guardar los ítems.")
      return
    }

    setForm({
      supplier_name: "Merigui",
      notes: "",
    })

    setDraftItems([])
    loadRequests()
  }

  async function updateRequestStatus(requestId, status) {
    const payload = {
      status,
    }

    if (status === "pagado") {
      payload.payment_status = "pagado"
      payload.paid_at = new Date().toISOString()
    }

    if (status === "recibido") {
      payload.reception_status = "recibido"
      payload.received_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("purchase_requests")
      .update(payload)
      .eq("id", requestId)

    if (error) {
      console.error(error)
      alert("No se pudo actualizar la solicitud.")
      return
    }

    loadRequests()
  }

  const requestItemsByRequest = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.purchase_request_id]) acc[item.purchase_request_id] = []
      acc[item.purchase_request_id].push(item)
      return acc
    }, {})
  }, [items])

  const totals = useMemo(() => {
    const pendingRequests = requests.filter(
      (request) =>
        request.status !== "recibido" &&
        request.status !== "anulado"
    )

    return {
      total: requests.length,
      pending: pendingRequests.length,
      pendingAmount: pendingRequests.reduce(
        (acc, request) => acc + Number(request.total_amount || 0),
        0
      ),
      paid: requests.filter((request) => request.payment_status === "pagado").length,
      received: requests.filter((request) => request.reception_status === "recibido").length,
    }
  }, [requests])

  const draftTotal = draftItems.reduce(
    (acc, item) => acc + Number(item.line_total || 0),
    0
  )

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Solicitudes</span>
          <strong>{totals.total}</strong>
        </div>

        <div className="stat-card">
          <span>Pendientes</span>
          <strong>{totals.pending}</strong>
        </div>

        <div className="stat-card">
          <span>Monto pendiente</span>
          <strong>{money(totals.pendingAmount)}</strong>
        </div>

        <div className="stat-card">
          <span>Recibidas</span>
          <strong>{totals.received}</strong>
        </div>
      </div>

      <section className="treasury-table">
        <div className="dashboard-header">
          <div>
            <h2>Nueva solicitud de mercadería</h2>
            <p>
              Agrupa varios clientes o inventario en una sola solicitud por proveedor.
            </p>
          </div>
        </div>

        <form className="modal-grid" onSubmit={createRequest}>
          <label>
            Proveedor
            <select
              value={form.supplier_name}
              onChange={(event) =>
                updateForm("supplier_name", event.target.value)
              }
            >
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </label>

          <label className="full-field">
            Notas solicitud
            <textarea
              rows="2"
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Ej: Pedido consolidado para Iquique..."
            />
          </label>

          <div className="full-field">
            <h3>Agregar ítem</h3>
          </div>

          <label>
            Proyecto / Cliente
            <select
              value={itemForm.project_id}
              onChange={(event) =>
                updateItemForm("project_id", event.target.value)
              }
            >
              <option value="">Sin cliente asociado / Inventario</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title} · {project.region_code || "sin región"}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select
              value={itemForm.item_type}
              disabled={Boolean(itemForm.project_id)}
              onChange={(event) =>
                updateItemForm("item_type", event.target.value)
              }
            >
              {itemTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Material
            <input
              value={itemForm.material_name}
              onChange={(event) =>
                updateItemForm("material_name", event.target.value)
              }
              placeholder="Ej: Tubo 38 mm"
            />
          </label>

          <label>
            Cantidad
            <input
              type="number"
              value={itemForm.quantity}
              onChange={(event) =>
                updateItemForm("quantity", event.target.value)
              }
            />
          </label>

          <label>
            Unidad
            <input
              value={itemForm.unit}
              onChange={(event) =>
                updateItemForm("unit", event.target.value)
              }
              placeholder="unidad, paquete, rollo, ml..."
            />
          </label>

          <label>
            Precio unitario
            <input
              type="number"
              value={itemForm.unit_price}
              onChange={(event) =>
                updateItemForm("unit_price", event.target.value)
              }
            />
          </label>

          <label>
            Total línea
            <input
              type="number"
              value={itemForm.line_total}
              onChange={(event) =>
                updateItemForm("line_total", event.target.value)
              }
            />
          </label>

          <label className="full-field">
            Descripción / detalle
            <textarea
              rows="2"
              value={itemForm.description}
              onChange={(event) =>
                updateItemForm("description", event.target.value)
              }
              placeholder="Detalle del pedido, color, tela, observaciones..."
            />
          </label>

          <div className="full-field">
            <button
              type="button"
              className="secondary-btn"
              onClick={addDraftItem}
            >
              + Agregar ítem
            </button>
          </div>

          {draftItems.length > 0 && (
            <div className="full-field">
              <h3>Ítems de la solicitud</h3>

              <table>
                <thead>
                  <tr>
                    <th>Destino</th>
                    <th>Material</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {draftItems.map((item, index) => (
                    <tr key={`${item.material_name}-${index}`}>
                      <td>{item.project_title || item.item_type}</td>
                      <td>{item.material_name || item.description}</td>
                      <td>
                        {item.quantity} {item.unit}
                      </td>
                      <td>{money(item.line_total)}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => removeDraftItem(index)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="balance-box" style={{ marginTop: "12px" }}>
                <span>Total solicitud</span>
                <strong>{money(draftTotal)}</strong>
              </div>
            </div>
          )}

          <div className="full-field">
            <button type="submit" className="primary-btn">
              Crear solicitud
            </button>
          </div>
        </form>
      </section>

      <section className="treasury-table" style={{ marginTop: "24px" }}>
        <div className="dashboard-header">
          <div>
            <h2>Solicitudes de mercadería</h2>
            <p>
              Compras agrupadas por proveedor, asociadas a clientes o inventario.
            </p>
          </div>
        </div>

        {loading ? (
          <p>Cargando solicitudes...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            No existen solicitudes registradas.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Proveedor</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Recepción</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => {
                const requestItems =
                  requestItemsByRequest[request.id] || []

                return (
                  <tr key={request.id}>
                    <td>#{request.request_number || "-"}</td>
                    <td>
                      <strong>{request.supplier_name}</strong>
                      <br />
                      <small>{request.requested_by || ""}</small>
                    </td>
                    <td>
                      {requestItems.length}
                      <br />
                      <small>
                        {requestItems
                          .slice(0, 3)
                          .map((item) => item.assigned_to || item.item_type)
                          .join(", ")}
                      </small>
                    </td>
                    <td>{money(request.total_amount)}</td>
                    <td>{request.status}</td>
                    <td>{request.payment_status}</td>
                    <td>{request.reception_status}</td>
                    <td>{formatDate(request.created_at)}</td>
                    <td>
                      <select
                        value={request.status}
                        onChange={(event) =>
                          updateRequestStatus(request.id, event.target.value)
                        }
                      >
                        {requestStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}