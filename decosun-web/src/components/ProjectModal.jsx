import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

const statuses = [
  "cotizado",
  "seguimiento",
  "aceptado",
  "medicion",
  "compras",
  "produccion",
  "instalacion",
  "facturacion",
  "cerrado",
]

const publicStatuses = [
  "Cotización recibida",
  "Cotización enviada",
  "En seguimiento",
  "Pedido confirmado",
  "Preparación técnica",
  "En preparación",
  "En producción",
  "Instalación programada",
  "Documento final",
  "Finalizado",
]

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function getHistoryIcon(type) {
  switch (type) {
    case "status_change":
      return "🟢"

    case "payment":
      return "💰"

    case "technician_change":
      return "👷"

    case "priority_change":
      return "⚡"

    case "client_status":
      return "📣"

    case "sale_value":
      return "📄"

    case "project_deleted":
      return "🗑️"

    default:
      return "📝"
  }
}

function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return "Hace unos segundos"
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`

  return date.toLocaleDateString("es-CL")
}

export default function ProjectModal({ project, onClose, onSave }) {
  const [tab, setTab] = useState("general")
  const [form, setForm] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!project) return

    setTab("general")

    setForm({
      title: project.title || "",
      city: project.city || "",
      contact_name: project.contact_name || "",
      contact_phone: project.contact_phone || "",
      client_type: project.client_type || "",
      region_code: project.region_code || "",
      status: project.status || "cotizado",
      priority: project.priority || "Media",

      source: project.source || "manual",
      quote_number: project.quote_number || "",
      public_token: project.public_token || "",
      client_visible_status:
        project.client_visible_status || "Cotización recibida",

      sale_value: project.sale_value || 0,
      invoice_value: project.invoice_value || 0,
      amount_paid: project.amount_paid || 0,
      payment_status: project.payment_status || "pendiente",
      payment_type: project.payment_type || "pendiente",
      payment_bank: project.payment_bank || "",

      technician_assigned: project.technician_assigned || "",
      key_date: project.key_date || "",
      sale_date: project.sale_date || "",
      invoice_date: project.invoice_date || "",
      closed_date: project.closed_date || "",

      capital_contribution: project.capital_contribution || 0,
      capital_partner: project.capital_partner || "",
      capital_notes: project.capital_notes || "",
      management_fee_rate: project.management_fee_rate || 20,

      fabric_cost: project.fabric_cost || 0,
      motor_cost: project.motor_cost || 0,
      mechanism_cost: project.mechanism_cost || 0,
      installation_cost: project.installation_cost || 0,
      transport_cost: project.transport_cost || 0,
      other_costs: project.other_costs || 0,

      summary: project.summary || "",
    })

    loadProjectHistory(project.id)
  }, [project])

  async function loadProjectHistory(projectId) {
    setLoadingHistory(true)

    const { data, error } = await supabase
      .from("project_history")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setHistory([])
      setLoadingHistory(false)
      return
    }

    setHistory(data || [])
    setLoadingHistory(false)
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(project.id, form)
  }

  const balance = useMemo(() => {
    return Number(form?.sale_value || 0) - Number(form?.amount_paid || 0)
  }, [form?.sale_value, form?.amount_paid])

  const totalCosts = useMemo(() => {
    if (!form) return 0

    return (
      Number(form.fabric_cost || 0) +
      Number(form.motor_cost || 0) +
      Number(form.mechanism_cost || 0) +
      Number(form.installation_cost || 0) +
      Number(form.transport_cost || 0) +
      Number(form.other_costs || 0)
    )
  }, [
    form?.fabric_cost,
    form?.motor_cost,
    form?.mechanism_cost,
    form?.installation_cost,
    form?.transport_cost,
    form?.other_costs,
  ])

  const estimatedMargin = Number(form?.sale_value || 0) - totalCosts

  const managementFee =
    Number(form?.sale_value || 0) *
    (Number(form?.management_fee_rate || 0) / 100)

  const whatsappURL = form?.contact_phone
    ? `https://wa.me/${String(form.contact_phone).replace(/\D/g, "")}`
    : ""

  const publicStatusURL = form?.public_token
    ? `/estado/${form.public_token}`
    : ""

  if (!project || !form) return null

  return (
    <div className="modal-backdrop">
      <form className="project-modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <h2>Ficha del proyecto</h2>
            <p>
              {form.quote_number
                ? `${form.quote_number} · ${form.title}`
                : form.title || "Proyecto sin nombre"}
            </p>
          </div>

          <button type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={tab === "general" ? "active" : ""}
            onClick={() => setTab("general")}
          >
            General
          </button>

          <button
            type="button"
            className={tab === "cliente" ? "active" : ""}
            onClick={() => setTab("cliente")}
          >
            Vista cliente
          </button>

          <button
            type="button"
            className={tab === "finanzas" ? "active" : ""}
            onClick={() => setTab("finanzas")}
          >
            Finanzas
          </button>

          <button
            type="button"
            className={tab === "comisiones" ? "active" : ""}
            onClick={() => setTab("comisiones")}
          >
            Comisiones / Capital
          </button>

          <button
            type="button"
            className={tab === "produccion" ? "active" : ""}
            onClick={() => setTab("produccion")}
          >
            Producción
          </button>

          <button
            type="button"
            className={tab === "costos" ? "active" : ""}
            onClick={() => setTab("costos")}
          >
            Costos
          </button>

          <button
            type="button"
            className={tab === "historial" ? "active" : ""}
            onClick={() => setTab("historial")}
          >
            Historial
          </button>
        </div>

        {tab === "general" && (
          <div className="modal-grid">
            <label>
              Cliente / Proyecto
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </label>

            <label>
              N° cotización
              <input
                value={form.quote_number}
                onChange={(e) => updateField("quote_number", e.target.value)}
              />
            </label>

            <label>
              Origen
              <input
                value={form.source}
                onChange={(e) => updateField("source", e.target.value)}
              />
            </label>

            <label>
              Ciudad
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </label>

            <label>
              Región
              <select
                value={form.region_code}
                onChange={(e) => updateField("region_code", e.target.value)}
              >
                <option value="">Sin región</option>
                <option value="iquique">Iquique</option>
                <option value="quinta_region">Quinta Región</option>
              </select>
            </label>

            <label>
              Contacto
              <input
                value={form.contact_name}
                onChange={(e) => updateField("contact_name", e.target.value)}
              />
            </label>

            <label>
              Teléfono
              <input
                value={form.contact_phone}
                onChange={(e) => updateField("contact_phone", e.target.value)}
              />
            </label>

            <label>
              Tipo cliente
              <select
                value={form.client_type}
                onChange={(e) => updateField("client_type", e.target.value)}
              >
                <option value="">Sin tipo</option>
                <option value="Residencial">Residencial</option>
                <option value="Empresa">Empresa</option>
                <option value="Institucional">Institucional</option>
                <option value="Mercado Público">Mercado Público</option>
              </select>
            </label>

            <label>
              Estado interno
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Prioridad
              <select
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
              >
                <option>Alta</option>
                <option>Media</option>
                <option>Baja</option>
              </select>
            </label>

            {whatsappURL && (
              <a
                href={whatsappURL}
                target="_blank"
                rel="noreferrer"
                className="secondary-btn"
              >
                Abrir WhatsApp cliente
              </a>
            )}

            <label className="full-field">
              Observaciones internas
              <textarea
                rows="4"
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "cliente" && (
          <div className="modal-grid">
            <label>
              Estado visible para cliente
              <select
                value={form.client_visible_status}
                onChange={(e) =>
                  updateField("client_visible_status", e.target.value)
                }
              >
                {publicStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Token público
              <input
                value={form.public_token}
                onChange={(e) => updateField("public_token", e.target.value)}
              />
            </label>

            <div className="balance-box">
              <span>Estado visible actual</span>
              <strong>{form.client_visible_status}</strong>
            </div>

            <div className="balance-box">
              <span>Ruta pública futura</span>
              <strong>{publicStatusURL || "Sin token público"}</strong>
            </div>

            <label className="full-field">
              Mensaje visible / resumen para cliente
              <textarea
                rows="4"
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "finanzas" && (
          <div className="modal-grid">
            <label>
              Valor venta / OC
              <input
                type="number"
                value={form.sale_value}
                onChange={(e) => updateField("sale_value", e.target.value)}
              />
            </label>

            <label>
              Valor factura
              <input
                type="number"
                value={form.invoice_value}
                onChange={(e) => updateField("invoice_value", e.target.value)}
              />
            </label>

            <label>
              Pagado
              <input
                type="number"
                value={form.amount_paid}
                onChange={(e) => updateField("amount_paid", e.target.value)}
              />
            </label>

            <div className="balance-box">
              <span>Saldo pendiente operacional</span>
              <strong>{money(balance)}</strong>
            </div>

            <label>
              Estado pago
              <select
                value={form.payment_status}
                onChange={(e) =>
                  updateField("payment_status", e.target.value)
                }
              >
                <option value="pendiente">Pendiente</option>
                <option value="abonado">Abonado</option>
                <option value="facturado">Facturado</option>
                <option value="pagado">Pagado</option>
              </select>
            </label>

            <label>
              Tipo pago
              <select
                value={form.payment_type}
                onChange={(e) => updateField("payment_type", e.target.value)}
              >
                <option value="pendiente">Pendiente</option>
                <option value="abono_saldo">Abono + saldo</option>
                <option value="contado">Contado</option>
                <option value="orden_compra">Orden de compra</option>
                <option value="factura_30">Factura 30 días</option>
              </select>
            </label>

            <label>
              Banco receptor
              <input
                value={form.payment_bank}
                onChange={(e) => updateField("payment_bank", e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "comisiones" && (
          <div className="modal-grid">
            <label>
              % manejo gerencia
              <input
                type="number"
                value={form.management_fee_rate}
                onChange={(e) =>
                  updateField("management_fee_rate", e.target.value)
                }
              />
            </label>

            <div className="balance-box">
              <span>Manejo gerencia estimado</span>
              <strong>{money(managementFee)}</strong>
            </div>

            <label>
              Capital aportado
              <input
                type="number"
                value={form.capital_contribution}
                onChange={(e) =>
                  updateField("capital_contribution", e.target.value)
                }
              />
            </label>

            <label>
              Origen capital
              <input
                value={form.capital_partner}
                onChange={(e) =>
                  updateField("capital_partner", e.target.value)
                }
              />
            </label>

            <label className="full-field">
              Notas capital / comisiones
              <textarea
                rows="4"
                value={form.capital_notes}
                onChange={(e) => updateField("capital_notes", e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "produccion" && (
          <div className="modal-grid">
            <label>
              Técnico asignado
              <input
                value={form.technician_assigned}
                onChange={(e) =>
                  updateField("technician_assigned", e.target.value)
                }
              />
            </label>

            <label>
              Fecha clave
              <input
                type="date"
                value={form.key_date || ""}
                onChange={(e) => updateField("key_date", e.target.value)}
              />
            </label>

            <label>
              Fecha venta / OC
              <input
                type="date"
                value={form.sale_date || ""}
                onChange={(e) => updateField("sale_date", e.target.value)}
              />
            </label>

            <label>
              Fecha factura
              <input
                type="date"
                value={form.invoice_date || ""}
                onChange={(e) => updateField("invoice_date", e.target.value)}
              />
            </label>

            <label>
              Fecha cierre
              <input
                type="date"
                value={form.closed_date || ""}
                onChange={(e) => updateField("closed_date", e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "costos" && (
          <div className="modal-grid">
            <label>
              Tela
              <input
                type="number"
                value={form.fabric_cost}
                onChange={(e) => updateField("fabric_cost", e.target.value)}
              />
            </label>

            <label>
              Motores
              <input
                type="number"
                value={form.motor_cost}
                onChange={(e) => updateField("motor_cost", e.target.value)}
              />
            </label>

            <label>
              Mecanismos
              <input
                type="number"
                value={form.mechanism_cost}
                onChange={(e) => updateField("mechanism_cost", e.target.value)}
              />
            </label>

            <label>
              Instalación
              <input
                type="number"
                value={form.installation_cost}
                onChange={(e) => updateField("installation_cost", e.target.value)}
              />
            </label>

            <label>
              Transporte
              <input
                type="number"
                value={form.transport_cost}
                onChange={(e) => updateField("transport_cost", e.target.value)}
              />
            </label>

            <label>
              Otros costos
              <input
                type="number"
                value={form.other_costs}
                onChange={(e) => updateField("other_costs", e.target.value)}
              />
            </label>

            <div className="balance-box">
              <span>Total costos</span>
              <strong>{money(totalCosts)}</strong>
            </div>

            <div className="balance-box">
              <span>Margen estimado</span>
              <strong>{money(estimatedMargin)}</strong>
            </div>
          </div>
        )}

        {tab === "historial" && (
          <div className="history-list">
            {loadingHistory ? (
              <p className="empty-history">Cargando historial...</p>
            ) : history.length === 0 ? (
              <p className="empty-history">
                Este proyecto aún no tiene historial registrado.
              </p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <div
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                      }}
                    >
                      {getHistoryIcon(item.event_type || item.type)}
                    </div>

                    <div>
                      <strong>{item.description}</strong>

                      <p>
                        {item.event_type || item.type || "evento"}
                        {" · "}
                        {item.created_by || "sistema"}
                      </p>
                    </div>
                  </div>

                  <span>{timeAgo(item.created_at)}</span>
                </div>
              ))
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancelar
          </button>

          <button type="submit" className="primary-btn">
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  )
}