import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import { canViewCommissions } from "../lib/permissions"
import { registerProjectPayment } from "../lib/projectPayments"

const statuses = [
  "agendado",
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

const regionOptions = [
  { value: "", label: "Sin región" },
  { value: "iquique", label: "Iquique" },
  { value: "quinta_region", label: "Quinta Región" },
  { value: "quinta_region_interior", label: "Quinta Región Interior" },
  { value: "santiago", label: "Santiago" },
  { value: "atacama", label: "Atacama" },
  { value: "iv_region_coquimbo", label: "IV Región Coquimbo" },
  { value: "la_serena", label: "La Serena" },
]

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function defaultCompanyName(project) {
  if (project?.company_name) return project.company_name
  return project?.region_code === "iquique" ? "Decosun Spa" : "Decosun Group SpA"
}

function getFinanceStatus(projectOrForm) {
  if (projectOrForm?.finance_status != null) return projectOrForm.finance_status

  if (projectOrForm?.payment_status === "pagado") return "paid"
  if (
    projectOrForm?.payment_status === "parcial" ||
    projectOrForm?.payment_status === "abonado"
  ) {
    return "partial"
  }

  return "pending"
}

function formatFinanceStatus(status) {
  if (status === "paid") return "Pagado"
  if (status === "partial") return "Pago parcial"
  return "Pendiente"
}

function cleanPhone(phone) {
  const onlyNumbers = String(phone || "").replace(/\D/g, "")

  if (!onlyNumbers) return ""
  if (onlyNumbers.startsWith("56")) return onlyNumbers
  if (onlyNumbers.startsWith("9")) return `56${onlyNumbers}`

  return onlyNumbers
}

function getProjectAddress(form) {
  return [form?.address, form?.city, form?.region_code, "Chile"]
    .filter(Boolean)
    .join(", ")
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

export default function ProjectModal({ project, profile, onClose, onSave }) {
  const [tab, setTab] = useState("general")
  const [form, setForm] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [advisors, setAdvisors] = useState([])
  const [projectPayments, setProjectPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [newPayment, setNewPayment] = useState({
    paymentDate: todayDate(),
    amount: "",
    companyName: "",
    bank: "",
    paymentMethod: "bank_transfer",
    paymentMilestone: "partial",
    notes: "",
  })
  const [savingPayment, setSavingPayment] = useState(false)

  const isAdvisor = profile?.role === "asesor_comercial"
  const isGerencia = profile?.role === "gerencia"
  const isJefatura = profile?.role === "jefatura_region"
  const isAdminRegional = profile?.role === "administracion_regional"

  const canEditInternal = isGerencia || isJefatura || isAdminRegional
  const canSeeAdvisorTab = !isAdvisor
  const canSeeFinance = !isAdvisor
  const canSeeCosts = isGerencia || isJefatura
  const canSeeCommissions = canViewCommissions(profile)

  useEffect(() => {
    if (!project) return

    setTab("general")

    setForm({
      title: project.title || "",
      city: project.city || "",
      address: project.address || "",
      contact_name: project.contact_name || "",
      contact_phone: project.contact_phone || "",
      client_type: project.client_type || "",
      region_code: project.region_code || "",

      advisor_id: project.advisor_id || "",
      advisor_name: project.advisor_name || "",
      advisor_email: project.advisor_email || "",
      advisor_region: project.advisor_region || "",
      advisor_commission_rate: project.advisor_commission_rate || 20,
      advisor_commission_type: project.advisor_commission_type || "base",
      advisor_commission_amount: project.advisor_commission_amount || 0,
      advisor_commission_status: project.advisor_commission_status || "pendiente",

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
      amount_paid_cached: project.amount_paid_cached || 0,
      balance_cached: project.balance_cached || 0,
      finance_status: project.finance_status || "pending",
      payment_status: project.payment_status || "pendiente",
      payment_type: project.payment_type || "pendiente",
      payment_bank: project.payment_bank || "",

      technician_assigned: project.technician_assigned || "",
      key_date: project.key_date || "",
      sale_date: project.sale_date || "",
      invoice_date: project.invoice_date || "",
      closed_date: project.closed_date || "",
      visit_date: project.visit_date || "",
      visit_time: project.visit_time || "",

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

    setNewPayment({
      paymentDate: todayDate(),
      amount: "",
      companyName: defaultCompanyName(project),
      bank: project.payment_bank || "",
      paymentMethod: "bank_transfer",
      paymentMilestone: "partial",
      notes: "",
    })

    loadProjectHistory(project.id)
    loadProjectPayments(project.id)
  }, [project])

  useEffect(() => {
    loadAdvisors()
  }, [])

  useEffect(() => {
    if (!project?.id || !form) return

    loadProjectPayments(project.id)
  }, [project?.id, form?.amount_paid_cached, form?.balance_cached, form?.finance_status])

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

  async function loadProjectPayments(projectId) {
    setLoadingPayments(true)

    const { data, error } = await supabase
      .from("project_payments")
      .select("id, payment_date, amount, bank, payment_method, payment_milestone, status, created_at")
      .eq("project_id", projectId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setProjectPayments([])
      setLoadingPayments(false)
      return
    }

    setProjectPayments(data || [])
    setLoadingPayments(false)
  }

  async function loadAdvisors() {
    const { data, error } = await supabase
      .from("advisors")
      .select("*")
      .eq("active", true)
      .order("full_name", { ascending: true })

    if (error) {
      console.error(error)
      setAdvisors([])
      return
    }

    setAdvisors(data || [])
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateNewPaymentField(field, value) {
    setNewPayment((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function submitNewPayment() {
    if (savingPayment) return

    if (!newPayment.bank?.trim()) {
      alert("Selecciona o ingresa el banco receptor antes de registrar el pago.")
      return
    }

    setSavingPayment(true)

    try {
      const result = await registerProjectPayment({
        projectId: project.id,
        amount: newPayment.amount,
        paymentDate: newPayment.paymentDate,
        companyName: newPayment.companyName,
        bank: newPayment.bank,
        paymentMethod: newPayment.paymentMethod,
        paymentMilestone: newPayment.paymentMilestone,
        notes: newPayment.notes,
      })

      const paymentResult = Array.isArray(result) ? result[0] : result

      if (paymentResult) {
        setForm((current) => ({
          ...current,
          amount_paid_cached: paymentResult.amount_paid_cached,
          balance_cached: paymentResult.balance_cached,
          finance_status: paymentResult.finance_status,
        }))
      }

      setNewPayment((current) => ({
        ...current,
        amount: "",
        notes: "",
      }))

      alert("Pago registrado correctamente.")
    } catch (error) {
      console.error(error)
      alert(error.message || "No se pudo registrar el pago.")
    } finally {
      setSavingPayment(false)
    }
  }

  function handleAdvisorChange(advisorId) {
    const advisor = advisors.find((item) => item.id === advisorId)

    if (!advisor) {
      setForm((current) => ({
        ...current,
        advisor_id: "",
        advisor_name: "",
        advisor_email: "",
        advisor_region: "",
        advisor_commission_rate: 20,
        advisor_commission_type: "base",
        advisor_commission_amount: 0,
        advisor_commission_status: "pendiente",
      }))

      return
    }

    setForm((current) => ({
      ...current,
      advisor_id: advisor.id,
      advisor_name: advisor.full_name || "",
      advisor_email: advisor.email || "",
      advisor_region: advisor.region_label || advisor.region_code || "",
      advisor_commission_rate: advisor.commission_rate || 20,
      advisor_commission_type: "base",
      advisor_commission_amount: 0,
      advisor_commission_status: "pendiente",
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    const baseSafePayload = {
      contact_name: form.contact_name || "",
      contact_phone: form.contact_phone || "",
      city: form.city || "",
      address: form.address || "",
      visit_date: form.visit_date || null,
      visit_time: form.visit_time || null,
      client_visible_status: form.client_visible_status || "Cotización recibida",
      summary: form.summary || "",
    }

    if (isAdvisor) {
      onSave(project.id, baseSafePayload)
      return
    }

    const cleanPayload = {
      ...form,

      advisor_id: form.advisor_id || null,

      key_date: form.key_date || null,
      sale_date: form.sale_date || null,
      invoice_date: form.invoice_date || null,
      closed_date: form.closed_date || null,
      visit_date: form.visit_date || null,
      visit_time: form.visit_time || null,

      sale_value: Number(form.sale_value || 0),
      invoice_value: Number(form.invoice_value || 0),
      amount_paid: Number(form.amount_paid || 0),

      capital_contribution: Number(form.capital_contribution || 0),
      management_fee_rate: Number(form.management_fee_rate || 0),

      advisor_commission_rate: Number(form.advisor_commission_rate || 0),
      advisor_commission_amount: Number(form.advisor_commission_amount || 0),

      fabric_cost: Number(form.fabric_cost || 0),
      motor_cost: Number(form.motor_cost || 0),
      mechanism_cost: Number(form.mechanism_cost || 0),
      installation_cost: Number(form.installation_cost || 0),
      transport_cost: Number(form.transport_cost || 0),
      other_costs: Number(form.other_costs || 0),
    }

    onSave(project.id, cleanPayload)
  }

  function openMaps() {
    const address = getProjectAddress(form)

    if (!address.trim()) {
      alert("Este proyecto no tiene dirección registrada.")
      return
    }

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`,
      "_blank"
    )
  }

  function openCall() {
    const phone = cleanPhone(form.contact_phone)

    if (!phone) {
      alert("Este proyecto no tiene teléfono registrado.")
      return
    }

    window.location.href = `tel:+${phone}`
  }

  function openWhatsApp() {
    const phone = cleanPhone(form.contact_phone)

    if (!phone) {
      alert("Este proyecto no tiene teléfono registrado.")
      return
    }

    const message = encodeURIComponent(
      `Hola ${form.contact_name || ""}, soy de DecoSun. Le escribo por su proyecto ${form.title || ""
      }.`
    )

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  function openCalendar() {
    const title = encodeURIComponent(
      `Visita DecoSun - ${form.contact_name || form.title || "Cliente"}`
    )

    const location = encodeURIComponent(getProjectAddress(form))

    const details = encodeURIComponent(
      [
        `Cliente: ${form.contact_name || ""}`,
        `Proyecto: ${form.title || ""}`,
        `Ciudad: ${form.city || ""}`,
        `Dirección: ${form.address || ""}`,
        `Teléfono: ${form.contact_phone || ""}`,
        `Fecha visita: ${form.visit_date || "Sin fecha"}`,
        `Hora visita: ${form.visit_time || "Sin hora"}`,
        "",
        "Evento creado desde el panel DecoSun.",
      ].join("\n")
    )

    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`,
      "_blank"
    )
  }

  function sendClientUpdateWhatsApp() {
    const phone = cleanPhone(form.contact_phone)

    if (!phone) {
      alert("Este proyecto no tiene teléfono registrado.")
      return
    }

    const message = encodeURIComponent(
      [
        `Hola ${form.contact_name || ""}.`,
        "",
        `Queremos informarle que su proyecto DecoSun ha sido actualizado.`,
        "",
        `Estado actual: ${form.client_visible_status || "En revisión"}.`,
        "",
        publicStatusURL
          ? `Puede revisar el avance aquí:\n${publicStatusURL}`
          : "",
        "",
        "Muchas gracias por confiar en DecoSun.",
      ]
        .filter(Boolean)
        .join("\n")
    )

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  const balance = useMemo(() => {
    return Math.max(
      Number(form?.sale_value || 0) - Number(form?.amount_paid || 0),
      0
    )
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

  function savePaymentAmount(amount, status, type) {
    const saleValue = Number(form.sale_value || 0)
    const paymentAmount = Number(amount || 0)

    if (saleValue <= 0) {
      alert("Primero ingresa el valor del proyecto.")
      return
    }

    if (paymentAmount < 0) {
      alert("El abono no puede ser negativo.")
      return
    }

    if (paymentAmount > saleValue) {
      alert("El abono no puede superar el valor del proyecto.")
      return
    }

    setForm((current) => ({
      ...current,
      amount_paid: paymentAmount,
      payment_status: status,
      payment_type: type,
    }))

    onSave(project.id, {
      ...form,
      amount_paid: paymentAmount,
      payment_status: status,
      payment_type: type,

      key_date: form.key_date || null,
      sale_date: form.sale_date || null,
      invoice_date: form.invoice_date || null,
      closed_date: form.closed_date || null,
      visit_date: form.visit_date || null,
      visit_time: form.visit_time || null,
    })
  }

  function registerInitialPayment() {
    const saleValue = Number(form.sale_value || 0)
    const initialPayment = Math.round(saleValue * 0.5)

    savePaymentAmount(initialPayment, "abonado", "abono_50")
  }

  function registerManualPayment() {
    savePaymentAmount(
      Number(form.amount_paid || 0),
      Number(form.amount_paid || 0) >= Number(form.sale_value || 0)
        ? "pagado"
        : "abonado",
      "abono_manual"
    )
  }

  function registerFinalPayment() {
    const saleValue = Number(form.sale_value || 0)

    savePaymentAmount(saleValue, "pagado", "pagado_total")
  }

  function calculateAdvisorCommission() {
    if (form.advisor_commission_type === "sin_comision") return 0

    if (form.advisor_commission_type === "especial") {
      return Number(form.advisor_commission_amount || 0)
    }

    return Math.round(
      Number(form.sale_value || 0) *
      (Number(form.advisor_commission_rate || 0) / 100)
    )
  }

  async function registerCommissionInTreasury() {
    const commissionAmount = calculateAdvisorCommission()

    if (!form.advisor_name) {
      alert("Primero asigna un asesor comercial.")
      return
    }

    if (commissionAmount <= 0) {
      alert("La comisión calculada debe ser mayor a cero.")
      return
    }

    const confirmRegister = window.confirm(
      `¿Registrar comisión de ${form.advisor_name} por ${money(
        commissionAmount
      )} en Tesorería?`
    )

    if (!confirmRegister) return

    const { error: movementError } = await supabase
      .from("treasury_movements")
      .insert({
        date: new Date().toISOString().slice(0, 10),
        company_name: form.region_code === "iquique" ? "Decosun Spa" : "Decosun Group SpA",
        bank: form.payment_bank || "BCI",
        description: `Comisión asesor - ${form.title || "Proyecto"}`,
        type: "egreso",
        amount: commissionAmount,
        category: "Comisión",
        subcategory: "Comisión asesor comercial",
        branch: form.region_code === "iquique" ? "Iquique" : "Viña del Mar",
        person_name: form.advisor_name,
        notes: `Proyecto: ${form.quote_number || project.id}`,
        source_module: "project_commission",
        project_id: project.id,
        reconciliation_status: "pendiente",
      })

    if (movementError) {
      console.error(movementError)
      alert("No se pudo registrar la comisión en Tesorería.")
      return
    }

    const { error: projectError } = await supabase
      .from("projects")
      .update({
        commission_registered: true,
        advisor_commission_status: "registrada",
        advisor_commission_amount: commissionAmount,
      })
      .eq("id", project.id)

    if (projectError) {
      console.error(projectError)
      alert("La comisión se registró en Tesorería, pero no se pudo marcar el proyecto.")
      return
    }

    setForm((current) => ({
      ...current,
      commission_registered: true,
      advisor_commission_status: "registrada",
      advisor_commission_amount: commissionAmount,
    }))

    alert("Comisión registrada en Tesorería.")
  }

  const publicStatusURL = form?.public_token
    ? `${window.location.origin}/estado/${form.public_token}`
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
            className={tab === "visita" ? "active" : ""}
            onClick={() => setTab("visita")}
          >
            Visita
          </button>

          {canSeeAdvisorTab && (
            <button
              type="button"
              className={tab === "asesor" ? "active" : ""}
              onClick={() => setTab("asesor")}
            >
              Asesor comercial
            </button>
          )}

          <button
            type="button"
            className={tab === "cliente" ? "active" : ""}
            onClick={() => setTab("cliente")}
          >
            Vista cliente
          </button>

          {canSeeFinance && (
            <button
              type="button"
              className={tab === "finanzas" ? "active" : ""}
              onClick={() => setTab("finanzas")}
            >
              Finanzas
            </button>
          )}

          {canSeeCommissions && (
            <button
              type="button"
              className={tab === "comisiones" ? "active" : ""}
              onClick={() => setTab("comisiones")}
            >
              Config. comisión estimada / Capital
            </button>
          )}

          {canSeeCosts && (
            <button
              type="button"
              className={tab === "costos" ? "active" : ""}
              onClick={() => setTab("costos")}
            >
              Costos
            </button>
          )}

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
                disabled={isAdvisor}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </label>

            <label>
              N° cotización
              <input
                value={form.quote_number}
                disabled={isAdvisor}
                onChange={(e) => updateField("quote_number", e.target.value)}
              />
            </label>

            <label>
              Origen
              <input
                value={form.source}
                disabled={isAdvisor}
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
                disabled={!canEditInternal}
                onChange={(e) => updateField("region_code", e.target.value)}
              >
                {regionOptions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
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

            <label className="full-field">
              Dirección
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Dirección de visita o instalación"
              />
            </label>

            <label>
              Tipo cliente
              <select
                value={form.client_type}
                disabled={isAdvisor}
                onChange={(e) => updateField("client_type", e.target.value)}
              >
                <option value="">Sin tipo</option>
                <option value="Residencial">Residencial</option>
                <option value="Empresa">Empresa</option>
                <option value="Institucional">Institucional</option>
                <option value="Mercado Público">Mercado Público</option>
              </select>
            </label>

            {!isAdvisor && (
              <>
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
              </>
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

        {tab === "visita" && (
          <div className="modal-grid">
            <label>
              Fecha visita
              <input
                type="date"
                value={form.visit_date || ""}
                onChange={(e) => updateField("visit_date", e.target.value)}
              />
            </label>

            <label>
              Hora visita
              <input
                type="time"
                value={form.visit_time || ""}
                onChange={(e) => updateField("visit_time", e.target.value)}
              />
            </label>

            <label className="full-field">
              Dirección visita
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Dirección para Maps"
              />
            </label>

            <div className="full-field flex flex-wrap gap-3">
              <button type="button" className="secondary-btn" onClick={openMaps}>
                📍 Maps
              </button>

              <button type="button" className="secondary-btn" onClick={openCalendar}>
                📅 Calendar
              </button>

              <button type="button" className="secondary-btn" onClick={openCall}>
                📞 Llamar
              </button>

              <button type="button" className="secondary-btn" onClick={openWhatsApp}>
                💬 WhatsApp
              </button>
            </div>
          </div>
        )}

        {tab === "asesor" && canSeeAdvisorTab && (
          <div className="modal-grid">
            <label>
              Asesor comercial
              <select
                value={form.advisor_id || ""}
                onChange={(e) => handleAdvisorChange(e.target.value)}
              >
                <option value="">Sin asesor asignado</option>

                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.full_name} · {advisor.region_label || advisor.region_code}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nombre asesor
              <input
                value={form.advisor_name}
                onChange={(e) => updateField("advisor_name", e.target.value)}
              />
            </label>

            <label>
              Correo asesor
              <input
                value={form.advisor_email}
                onChange={(e) => updateField("advisor_email", e.target.value)}
              />
            </label>

            <label>
              Región asesor
              <input
                value={form.advisor_region}
                onChange={(e) => updateField("advisor_region", e.target.value)}
              />
            </label>

            {canSeeCommissions && (
              <>
                <div className="full-field balance-box">
                  <span>Configuración de comisión estimada</span>
                  <strong>El pago real de comisiones se gestiona desde Finanzas &gt; Comisiones.</strong>
                </div>

                <label>
                  % comisión base estimada
                  <input
                    type="number"
                    value={form.advisor_commission_rate}
                    onChange={(e) =>
                      updateField("advisor_commission_rate", e.target.value)
                    }
                  />
                </label>

                <label>
                  Tipo de comisión estimada
                  <select
                    value={form.advisor_commission_type}
                    onChange={(e) =>
                      updateField("advisor_commission_type", e.target.value)
                    }
                  >
                    <option value="base">Base</option>
                    <option value="especial">Especial</option>
                    <option value="sin_comision">Sin comisión</option>
                  </select>
                </label>

                <label>
                  Monto especial estimado
                  <input
                    type="number"
                    value={form.advisor_commission_amount}
                    onChange={(e) =>
                      updateField("advisor_commission_amount", e.target.value)
                    }
                  />
                </label>

                <label>
                  Estado legacy no financiero
                  <small>Legacy no financiero. El pago real se gestiona desde Finanzas &gt; Comisiones.</small>
                  <select
                    value={form.advisor_commission_status}
                    disabled
                  >
                    <option value="pendiente">Pendiente legacy</option>
                    <option value="pagada">Pagada legacy</option>
                  </select>
                </label>

                <div className="balance-box">
                  <span>Comisión estimada</span>
                  <strong>
                    {money(
                      form.advisor_commission_type === "sin_comision"
                        ? 0
                        : form.advisor_commission_type === "base"
                          ? Number(form.sale_value || 0) *
                          (Number(form.advisor_commission_rate || 0) / 100)
                          : Number(form.advisor_commission_amount || 0)
                    )}
                  </strong>
                </div>
              </>
            )}
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

            {!isAdvisor && (
              <label>
                Token público
                <input
                  value={form.public_token}
                  onChange={(e) => updateField("public_token", e.target.value)}
                />
              </label>
            )}

            {publicStatusURL && (
              <div className="full-field flex flex-wrap gap-3">
                <a
                  href={publicStatusURL}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-btn"
                >
                  Abrir seguimiento
                </a>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(publicStatusURL)
                    alert("Enlace copiado")
                  }}
                >
                  Copiar enlace
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={sendClientUpdateWhatsApp}
                >
                  Enviar actualización por WhatsApp
                </button>
              </div>
            )}

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

        {tab === "finanzas" && canSeeFinance && (
          <div className="modal-grid">
            <label>
              Valor aceptado / OC
              <input
                type="number"
                value={form.sale_value}
                onChange={(e) => updateField("sale_value", e.target.value)}
              />
            </label>

            <div className="balance-box">
              <span>Abono sugerido 50%</span>
              <strong>{money(Number(form.sale_value || 0) * 0.5)}</strong>
            </div>

            <div className="full-field balance-box">
              <span>Información histórica de pagos</span>
              <strong>Los nuevos pagos se registran desde Nuevo registro de pagos.</strong>
            </div>

            <label>
              Abono registrado anteriormente
              <input
                type="number"
                value={form.amount_paid}
                onChange={(e) => updateField("amount_paid", e.target.value)}
                disabled
              />
            </label>

            <div className="balance-box">
              <span>Saldo pendiente</span>
              <strong>{money(balance)}</strong>
            </div>

            <label>
              Estado anterior
              <select
                value={form.payment_status}
                onChange={(e) => updateField("payment_status", e.target.value)}
                disabled
              >
                <option value="pendiente">Pendiente</option>
                <option value="abonado">Abonado</option>
                <option value="pagado">Pagado</option>
                <option value="orden_compra">Orden de compra</option>
              </select>
            </label>

            <label>
              Banco registrado anteriormente
              <input
                value={form.payment_bank}
                onChange={(e) => updateField("payment_bank", e.target.value)}
                disabled
              />
            </label>

            <div className="full-field flex flex-wrap gap-3">
              <button
                type="button"
                className="secondary-btn"
                onClick={registerInitialPayment}
                disabled
              >
                Registrar abono 50%
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={registerManualPayment}
                disabled
              >
                Guardar abono manual
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={registerFinalPayment}
                disabled
              >
                Registrar saldo final
              </button>
            </div>

            <div className="full-field">
              <h3>Cartola financiera (Beta)</h3>
            </div>

            <div className="balance-box">
              <span>Valor venta</span>
              <strong>{money(form.sale_value)}</strong>
            </div>

            <div className="balance-box">
              <span>Pagado confirmado</span>
              <strong>{money(form.amount_paid_cached)}</strong>
            </div>

            <div className="balance-box">
              <span>Saldo pendiente</span>
              <strong>{money(form.balance_cached)}</strong>
            </div>

            <div className="balance-box">
              <span>Estado financiero</span>
              <strong>{formatFinanceStatus(getFinanceStatus(form))}</strong>
            </div>

            <div className="full-field treasury-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Banco</th>
                    <th>Metodo</th>
                    <th>Hito</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayments && (
                    <tr>
                      <td colSpan="6">Cargando pagos...</td>
                    </tr>
                  )}

                  {!loadingPayments && projectPayments.length === 0 && (
                    <tr>
                      <td colSpan="6">Sin pagos registrados en el motor financiero.</td>
                    </tr>
                  )}

                  {!loadingPayments &&
                    projectPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.payment_date || "-"}</td>
                        <td>{money(payment.amount)}</td>
                        <td>{payment.bank || "-"}</td>
                        <td>{payment.payment_method || "-"}</td>
                        <td>{payment.payment_milestone || "-"}</td>
                        <td>{payment.status || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="full-field">
              <h3>Nuevo registro de pagos</h3>
              <p className="muted-text">Beta - registra pagos como eventos financieros trazables.</p>
            </div>

            <label>
              Fecha de pago
              <input
                type="date"
                value={newPayment.paymentDate}
                onChange={(e) =>
                  updateNewPaymentField("paymentDate", e.target.value)
                }
              />
            </label>

            <label>
              Monto
              <input
                type="number"
                value={newPayment.amount}
                onChange={(e) =>
                  updateNewPaymentField("amount", e.target.value)
                }
              />
            </label>

            <label>
              Empresa
              <select
                value={newPayment.companyName}
                onChange={(e) =>
                  updateNewPaymentField("companyName", e.target.value)
                }
              >
                <option value="Decosun Group SpA">Decosun Group SpA</option>
                <option value="Decosun Spa">Decosun Spa</option>
              </select>
            </label>

            <label>
              Banco
              <select
                value={newPayment.bank}
                onChange={(e) =>
                  updateNewPaymentField("bank", e.target.value)
                }
              >
                <option value="">Seleccionar banco</option>
                <option value="BCI">BCI</option>
                <option value="Scotiabank">Scotiabank</option>
                <option value="Santander">Santander</option>
                <option value="BancoEstado">BancoEstado</option>
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Otro">Otro</option>
              </select>
            </label>

            <label>
              Metodo de pago
              <select
                value={newPayment.paymentMethod}
                onChange={(e) =>
                  updateNewPaymentField("paymentMethod", e.target.value)
                }
              >
                <option value="bank_transfer">Transferencia bancaria</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="other">Otro</option>
              </select>
            </label>

            <label>
              Hito de pago
              <select
                value={newPayment.paymentMilestone}
                onChange={(e) =>
                  updateNewPaymentField("paymentMilestone", e.target.value)
                }
              >
                <option value="initial_50">initial_50</option>
                <option value="final_50">final_50</option>
                <option value="partial">partial</option>
                <option value="full">full</option>
              </select>
            </label>

            <label className="full-field">
              Notas
              <textarea
                rows="3"
                value={newPayment.notes}
                onChange={(e) =>
                  updateNewPaymentField("notes", e.target.value)
                }
              />
            </label>

            <div className="full-field">
              <button
                type="button"
                className="primary-btn"
                onClick={submitNewPayment}
                disabled={savingPayment}
              >
                {savingPayment ? "Registrando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        )}

        {tab === "comisiones" && canSeeCommissions && (
          <div className="modal-grid">
            <div className="full-field balance-box">
              <span>Comisiones estimadas</span>
              <strong>El pago real de comisiones se gestiona desde Finanzas &gt; Comisiones.</strong>
            </div>

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
                onChange={(e) => updateField("capital_partner", e.target.value)}
              />
            </label>

            <label className="full-field">
              Notas capital / comisiones estimadas
              <textarea
                rows="4"
                value={form.capital_notes}
                onChange={(e) => updateField("capital_notes", e.target.value)}
              />
            </label>
          </div>
        )}

        {tab === "costos" && canSeeCosts && (
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
                    <div style={{ fontSize: "24px" }}>
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
