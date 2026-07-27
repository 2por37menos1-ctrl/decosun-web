import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import {
  canAssignProjectAdvisor,
  canPayProjectCommissions,
  canViewProjectCommissionsForProject,
  canRegisterProjectPaymentForProject,
  canViewProjectFinanceForProject,
} from "../lib/permissions"
import CommissionPaymentModal from "./CommissionPaymentModal"
import { registerProjectPayment } from "../lib/projectPayments"
import { getTerritoryAssignment } from "../lib/territoryAssignment"

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
  "A la espera de abono del cliente",
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

const EDGAR_ADVISOR_ID = "4a84c0a5-184e-4ca1-8cd5-406a1e2a0301"
const EDGAR_ADVISOR_NAME = "Edgar Leighton"

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("es-CL")
}

function defaultCompanyName(project) {
  if (project?.company_name) return project.company_name
  return project?.region_code === "iquique" ? "Decosun Spa" : "Decosun Group SpA"
}

function getFinanceStatus(projectOrForm) {
  if (projectOrForm?.finance_status != null) return projectOrForm.finance_status

  return "pending"
}

function formatFinanceStatus(status) {
  if (status === "paid") return "Pagado"
  if (status === "partial") return "Pago parcial"
  if (status === "overpaid") return "Sobrepagado"
  if (status === "pending_reconciliation") return "Pendiente de reconciliación"
  return "Pendiente"
}

function formatCommissionStatus(status) {
  if (status === "generated") return "Pendiente"
  if (status === "partially_paid") return "Parcialmente pagada"
  if (status === "paid") return "Pagada"
  if (status === "voided") return "Anulada"
  if (status === "reversed") return "Reversada"
  return status || "-"
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(0)}%`
}

function hasFinanceCache(projectOrForm) {
  return (
    projectOrForm?.amount_paid_cached != null &&
    projectOrForm?.balance_cached != null
  )
}

function getProjectFinanceStatus(projectOrForm) {
  if (!hasFinanceCache(projectOrForm)) {
    return "pending_reconciliation"
  }

  return getFinanceStatus(projectOrForm)
}

function getProjectPaymentProgress(projectOrForm) {
  const saleValue = Number(projectOrForm?.sale_value || 0)

  if (!saleValue || !hasFinanceCache(projectOrForm)) return 0

  return Math.max(
    0,
    Math.min(
      100,
      (Number(projectOrForm.amount_paid_cached || 0) / saleValue) * 100
    )
  )
}

function getPaymentReference(payment) {
  return (
    payment?.notes ||
    payment?.idempotency_key ||
    payment?.treasury_movement_id ||
    "-"
  )
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
  const [tab, setTab] = useState("resumen")
  const [form, setForm] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [advisors, setAdvisors] = useState([])
  const [projectPayments, setProjectPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [projectCommissions, setProjectCommissions] = useState([])
  const [projectCommissionPayments, setProjectCommissionPayments] = useState([])
  const [loadingCommissions, setLoadingCommissions] = useState(false)
  const [projectCommissionError, setProjectCommissionError] = useState("")
  const [selectedCommissionPayment, setSelectedCommissionPayment] = useState(null)
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
  const canAssignAdvisor = canAssignProjectAdvisor(profile, project)
  const canSeeAssignedAdvisor = canAssignAdvisor || (!isAdvisor && Boolean(project?.advisor_name))
  const canSeeFinance = canViewProjectFinanceForProject(profile, project)
  const canSeeProjectCommissions = canViewProjectCommissionsForProject(profile, project)
  const canPayProjectCommission = canPayProjectCommissions(profile)
  const canRegisterPayment = canRegisterProjectPaymentForProject(profile, project)

  useEffect(() => {
    if (!project) return

    setTab("resumen")

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
      amount_paid_cached: project.amount_paid_cached || 0,
      balance_cached: project.balance_cached || 0,
      finance_status: project.finance_status || "pending",

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
      bank: "",
      paymentMethod: "bank_transfer",
      paymentMilestone: "partial",
      notes: "",
    })

    loadProjectHistory(project.id)
    if (canSeeFinance) {
      loadProjectPayments(project.id)
    } else {
      setProjectPayments([])
    }

    if (canSeeProjectCommissions) {
      loadProjectCommissions(project.id)
    } else {
      setProjectCommissions([])
      setProjectCommissionPayments([])
      setProjectCommissionError("")
    }
  }, [project, canSeeFinance, canSeeProjectCommissions])

  useEffect(() => {
    loadAdvisors()
  }, [])

  useEffect(() => {
    if (!project?.id || !canSeeFinance) return

    loadProjectPayments(project.id)
  }, [project?.id, form?.amount_paid_cached, form?.balance_cached, form?.finance_status, canSeeFinance])

  useEffect(() => {
    if (!project?.id || !canSeeProjectCommissions) return

    loadProjectCommissions(project.id)
  }, [project?.id, canSeeProjectCommissions])

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
      .select("id, payment_date, amount, company_name, bank, payment_method, payment_milestone, status, notes, idempotency_key, treasury_movement_id, created_at")
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

  async function loadProjectCommissions(projectId) {
    setLoadingCommissions(true)
    setProjectCommissionError("")

    const [commissionsResponse, commissionPaymentsResponse] = await Promise.all([
      supabase.rpc("get_project_commissions_for_project", {
        p_project_id: projectId,
      }),
      supabase.rpc("get_project_commission_payments_for_project", {
        p_project_id: projectId,
      }),
    ])

    if (commissionsResponse.error || commissionPaymentsResponse.error) {
      console.error(commissionsResponse.error || commissionPaymentsResponse.error)
      setProjectCommissions([])
      setProjectCommissionPayments([])
      setProjectCommissionError(
        commissionsResponse.error?.message ||
          commissionPaymentsResponse.error?.message ||
          "No se pudo cargar el historial de comisiones del proyecto."
      )
      setLoadingCommissions(false)
      return
    }

    setProjectCommissions(commissionsResponse.data || [])
    setProjectCommissionPayments(commissionPaymentsResponse.data || [])
    setLoadingCommissions(false)
  }

  function canPayCommissionRow(commission) {
    return (
      canPayProjectCommission &&
      ["generated", "partially_paid"].includes(commission.status) &&
      Number(commission.balance_cached || 0) > 0
    )
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
    if (!canRegisterPayment) {
      alert("No tienes permiso para registrar pagos.")
      return
    }

    if (savingPayment) return

    const paymentAmount = Number(newPayment.amount || 0)
    const currentBalance = Number(project?.balance_cached || 0)

    if (paymentAmount <= 0) {
      alert("El monto debe ser mayor que cero.")
      return
    }

    if (!project?.sale_value || Number(project.sale_value || 0) <= 0) {
      alert("Este proyecto no tiene un valor de venta válido para registrar pagos.")
      return
    }

    if (hasFinanceCache(project) && paymentAmount > currentBalance) {
      alert("El monto no puede superar el saldo pendiente.")
      return
    }

    if (!newPayment.companyName?.trim()) {
      alert("Selecciona la empresa receptora antes de registrar el pago.")
      return
    }

    if (!newPayment.bank?.trim()) {
      alert("Selecciona o ingresa el banco receptor antes de registrar el pago.")
      return
    }

    setSavingPayment(true)

    try {
      const result = await registerProjectPayment({
        projectId: project.id,
        amount: paymentAmount,
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

      await loadProjectPayments(project.id)
      if (canSeeProjectCommissions) {
        await loadProjectCommissions(project.id)
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
    if (!canAssignAdvisor) return

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

  function applySuggestedAdvisor() {
    if (!canAssignAdvisor) return

    setForm((current) => {
      const territory = getTerritoryAssignment({
        city: current.city,
        regionCode: current.region_code,
      })

      return {
        ...current,
        advisor_id: territory.advisor_id || "",
        advisor_name: territory.advisor_name || "",
        advisor_email: "",
        advisor_region: territory.region_code || current.region_code || "",
      }
    })
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

      advisor_id:
        form.advisor_id ||
        (form.advisor_name === EDGAR_ADVISOR_NAME ? EDGAR_ADVISOR_ID : null),

      key_date: form.key_date || null,
      sale_date: form.sale_date || null,
      invoice_date: form.invoice_date || null,
      closed_date: form.closed_date || null,
      visit_date: form.visit_date || null,
      visit_time: form.visit_time || null,

      sale_value: Number(form.sale_value || 0),
      invoice_value: Number(form.invoice_value || 0),

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

  function hasShareablePublicStatusURL() {
    if (!savedPublicStatusURL) {
      alert("Este proyecto aún no tiene un enlace público guardado.")
      return false
    }

    if (hasUnsavedClientChanges) {
      alert(
        "Guarda los cambios antes de compartir el seguimiento para que el cliente vea la información actualizada."
      )
      return false
    }

    return true
  }

  function openPublicStatusURL() {
    if (!hasShareablePublicStatusURL()) {
      return
    }

    window.open(savedPublicStatusURL, "_blank", "noreferrer")
  }

  async function copyPublicStatusURL() {
    if (!hasShareablePublicStatusURL()) {
      return
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard no disponible")
      }

      await navigator.clipboard.writeText(savedPublicStatusURL)
      alert("Enlace copiado.")
    } catch (error) {
      console.error(error)
      window.prompt("Copia manualmente este enlace:", savedPublicStatusURL)
    }
  }

  function sendClientUpdateWhatsApp() {
    const phone = cleanPhone(form.contact_phone)

    if (!phone) {
      alert("Este proyecto no tiene teléfono registrado.")
      return
    }

    if (!hasShareablePublicStatusURL()) {
      return
    }

    const message = encodeURIComponent(
      [
        `Hola ${form.contact_name || ""}.`,
        "",
        `Queremos informarle que su proyecto DecoSun ha sido actualizado.`,
        "",
        `Estado actual: ${savedClientVisibleStatus}.`,
        "",
        `Puede revisar el avance aqui:\n${savedPublicStatusURL}`,
        "",
        "Muchas gracias por confiar en DecoSun.",
      ]
        .filter(Boolean)
        .join("\n")
    )

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  const savedPublicStatusURL = project?.public_token
    ? `${window.location.origin}/estado/${project.public_token}`
    : ""

  const savedClientVisibleStatus =
    project?.client_visible_status || "Cotizacion recibida"

  const hasUnsavedClientChanges =
    String(form?.client_visible_status || "") !==
    String(project?.client_visible_status || "") ||
    String(form?.public_token || "") !== String(project?.public_token || "") ||
    String(form?.summary || "") !== String(project?.summary || "")

  const suggestedTerritory = useMemo(
    () =>
      getTerritoryAssignment({
        city: form?.city,
        regionCode: form?.region_code,
      }),
    [form?.city, form?.region_code]
  )

  const advisorSelectValue =
    form?.advisor_id ||
    (form?.advisor_name === EDGAR_ADVISOR_NAME ? EDGAR_ADVISOR_ID : "")

  const suggestedAdvisorIsDifferent =
    Boolean(suggestedTerritory?.advisor_name) &&
    (
      suggestedTerritory.advisor_name !== form?.advisor_name ||
      suggestedTerritory.region_code !== form?.advisor_region
    )

  const summaryTitle =
    form?.source === "cotizador_web"
      ? "Detalle cotizacion / medidas"
      : form?.source === "agenda"
        ? "Observaciones agenda"
        : "Notas internas"

  const financeStatus = getProjectFinanceStatus(form)
  const financeProgress = getProjectPaymentProgress(form)
  const financePendingReconciliation = !hasFinanceCache(form)
  const financePaymentList = projectPayments.filter((payment) => payment.status !== "voided")
  const projectCommissionGeneratedTotal = projectCommissions.reduce(
    (total, item) => total + Number(item.commission_amount || 0),
    0
  )
  const projectCommissionPaidTotal = projectCommissions.reduce(
    (total, item) => total + Number(item.paid_amount_cached || 0),
    0
  )
  const projectCommissionPendingTotal = projectCommissions.reduce(
    (total, item) => total + Number(item.balance_cached || 0),
    0
  )

  async function handleCommissionPaidInProject() {
    if (!project?.id) return

    await loadProjectCommissions(project.id)
    alert("Pago de comisión registrado correctamente.")
  }

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
            className={tab === "resumen" ? "active" : ""}
            onClick={() => setTab("resumen")}
          >
            Resumen
          </button>

          <button
            type="button"
            className={tab === "operacion" ? "active" : ""}
            onClick={() => setTab("operacion")}
          >
            Operacion
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

          <button
            type="button"
            className={tab === "cliente" ? "active" : ""}
            onClick={() => setTab("cliente")}
          >
            Cliente
          </button>

          {canSeeFinance && (
            <button
              type="button"
              className={tab === "compras" ? "active" : ""}
              onClick={() => setTab("compras")}
            >
              Compras
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

        {tab === "resumen" && (
          <div className="project-summary-layout">
            <section className="summary-card summary-card-hero">
              <div className="summary-card-heading">
                <span>Cliente</span>
                <strong>{form.contact_name || "Sin contacto"}</strong>
              </div>

              <div className="summary-grid">
                <label>
                  Contacto
                  <input
                    value={form.contact_name}
                    onChange={(e) => updateField("contact_name", e.target.value)}
                  />
                </label>

                <label>
                  Telefono
                  <input
                    value={form.contact_phone}
                    onChange={(e) => updateField("contact_phone", e.target.value)}
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
                    <option value="Mercado Publico">Mercado Publico</option>
                  </select>
                </label>

                <label className="summary-wide">
                  Direccion
                  <input
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Direccion de visita o instalacion"
                  />
                </label>
              </div>

              <div className="summary-actions">
                <button type="button" className="secondary-btn" onClick={openCall}>
                  Llamar
                </button>

                <button type="button" className="secondary-btn" onClick={openWhatsApp}>
                  WhatsApp
                </button>

                <button type="button" className="secondary-btn" onClick={openMaps}>
                  Mapa
                </button>
              </div>
            </section>

            <section className="summary-card">
              <div className="summary-card-heading">
                <span>Proyecto</span>
                <strong>{form.title || "Proyecto sin nombre"}</strong>
              </div>

              <div className="summary-grid">
                <label className="summary-wide">
                  Proyecto
                  <input
                    value={form.title}
                    disabled={isAdvisor}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </label>

                <label>
                  Cotizacion
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

                <label>
                  Region
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
              </div>
            </section>

            {canSeeAssignedAdvisor && (
              <section className="summary-card">
                <div className="summary-card-heading">
                  <span>Responsable comercial</span>
                </div>

                <div className="assigned-owner">
                  <span>Asesor asignado</span>
                  <strong>{form.advisor_name || "Sin asesor asignado"}</strong>
                  {form.advisor_region && <small>{form.advisor_region}</small>}
                </div>

                {canAssignAdvisor && suggestedAdvisorIsDifferent && (
                  <div className="suggested-owner">
                    <span>Responsable sugerido</span>
                    <strong>{suggestedTerritory.advisor_name}</strong>
                    <small>{suggestedTerritory.region_code}</small>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={applySuggestedAdvisor}
                    >
                      Aplicar sugerencia
                    </button>
                  </div>
                )}

                {canAssignAdvisor && (
                  <div className="summary-grid">
                    <label className="summary-wide">
                      Asesor comercial
                      <select
                        value={advisorSelectValue}
                        onChange={(e) => handleAdvisorChange(e.target.value)}
                      >
                        <option value="">Sin asesor asignado</option>

                        {advisors.map((advisor) => (
                          <option key={advisor.id} value={advisor.id}>
                            {advisor.full_name} - {advisor.region_label || advisor.region_code}
                          </option>
                        ))}
                      </select>
                    </label>

                  </div>
                )}
              </section>
            )}

            <section className="summary-card">
              <div className="summary-card-heading">
                <span>Cotizacion / Medidas</span>
                <strong>{summaryTitle}</strong>
              </div>

              <label className="summary-notes">
                {summaryTitle}
                <textarea
                  rows="6"
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                />
              </label>
            </section>
          </div>

        )}

        {tab === "operacion" && (
          <div className="modal-grid">
            <div className="full-field modal-section-heading">
              <span>Instalacion y entrega</span>
              <strong>Compromisos operativos para coordinar mecanismos y cortinas.</strong>
            </div>

            <label>
              Fecha instalacion de mecanismos
              <input
                type="date"
                value={form.key_date || ""}
                disabled={isAdvisor}
                onChange={(e) => updateField("key_date", e.target.value)}
              />
            </label>

            <label>
              Fecha entrega / instalacion de cortinas
              <input
                type="date"
                value={form.visit_date || ""}
                onChange={(e) => updateField("visit_date", e.target.value)}
              />
            </label>

            <label>
              Hora compromiso
              <input
                type="time"
                value={form.visit_time || ""}
                onChange={(e) => updateField("visit_time", e.target.value)}
              />
            </label>

            <label className="full-field">
              Direccion instalacion / entrega
              <input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Direccion para Maps"
              />
            </label>

            <div className="full-field flex flex-wrap gap-3">
              <button type="button" className="secondary-btn" onClick={openMaps}>
                Maps
              </button>

              <button type="button" className="secondary-btn" onClick={openCalendar}>
                Calendar
              </button>
            </div>
          </div>
        )}

        {tab === "asesor" && canAssignAdvisor && (
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

          </div>
        )}

        {tab === "cliente" && (
          <div className="modal-grid">
            <div className="full-field client-visible-note">
              <strong>Esta informacion es visible para el cliente.</strong>
              <p>
                Revisa estado, enlace publico y mensaje antes de compartir el
                seguimiento.
              </p>
              <p>
                Los cambios del estado publico se reflejan en el enlace del
                cliente despues de guardar la ficha.
              </p>
            </div>

            <label>
              Estado comercial del cliente
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

            {!savedPublicStatusURL && (
              <div className="full-field legacy-panel">
                Este proyecto aún no tiene seguimiento público activo.
              </div>
            )}

            {savedPublicStatusURL && (
              <div className="full-field public-link-box">
                <span>Enlace publico</span>
                <strong>{savedPublicStatusURL}</strong>
              </div>
            )}

            {savedPublicStatusURL && (
              <div className="full-field flex flex-wrap gap-3">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={openPublicStatusURL}
                >
                  Abrir seguimiento
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={copyPublicStatusURL}
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
            <div className="full-field modal-section-heading">
              <span>Finance Engine</span>
              <strong>Abonos reales, saldo oficial y trazabilidad por proyecto.</strong>
            </div>

            {financePendingReconciliation && (
              <div className="full-field client-visible-note">
                <strong>Información financiera pendiente de reconciliación.</strong>
                <p>
                  Este proyecto todavía no tiene todo su historial financiero reconciliado en el Motor Financiero.
                  Se muestra únicamente información oficial del nuevo motor y no se usan campos legacy.
                </p>
              </div>
            )}

            <div className="balance-box finance-focus">
              <span>Valor venta</span>
              <strong>{money(form.sale_value)}</strong>
            </div>

            <div className="balance-box finance-focus">
              <span>Total abonado</span>
              <strong>{money(form.amount_paid_cached)}</strong>
            </div>

            <div className="balance-box finance-focus">
              <span>Saldo pendiente</span>
              <strong>{money(form.balance_cached)}</strong>
            </div>

            <div className="balance-box finance-focus">
              <span>Porcentaje pagado</span>
              <strong>{formatPercent(financeProgress)}</strong>
            </div>

            <div className="balance-box finance-focus">
              <span>Estado financiero</span>
              <strong>{formatFinanceStatus(financeStatus)}</strong>
            </div>

            <div className="full-field treasury-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Hito</th>
                    <th>Empresa</th>
                    <th>Banco / cuenta</th>
                    <th>Referencia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayments && (
                    <tr>
                      <td colSpan="7">Cargando abonos...</td>
                    </tr>
                  )}

                  {!loadingPayments && financePaymentList.length === 0 && (
                    <tr>
                      <td colSpan="7">Sin abonos registrados en el Motor Financiero.</td>
                    </tr>
                  )}

                  {!loadingPayments &&
                    financePaymentList.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.payment_date || "-"}</td>
                        <td>{money(payment.amount)}</td>
                        <td>{payment.payment_milestone || "-"}</td>
                        <td>{payment.company_name || "-"}</td>
                        <td>{payment.bank || "-"}</td>
                        <td>{getPaymentReference(payment)}</td>
                        <td>{payment.status || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {canSeeProjectCommissions && (
              <>
                <div className="full-field">
                  <h3>Comisiones del proyecto</h3>
                  <p className="muted-text">
                    Gerencia puede registrar pagos desde esta ficha. El pago usa el motor oficial y mantiene trazabilidad de Tesorería.
                  </p>
                </div>

                {projectCommissionError && (
                  <div className="full-field client-visible-note">
                    <strong>No se pudo cargar la trazabilidad de comisiones.</strong>
                    <p>{projectCommissionError}</p>
                  </div>
                )}

                <div className="balance-box finance-focus">
                  <span>Total comisión generada</span>
                  <strong>{money(projectCommissionGeneratedTotal)}</strong>
                </div>

                <div className="balance-box finance-focus">
                  <span>Total comisión pagada</span>
                  <strong>{money(projectCommissionPaidTotal)}</strong>
                </div>

                <div className="balance-box finance-focus">
                  <span>Total comisión pendiente</span>
                  <strong>{money(projectCommissionPendingTotal)}</strong>
                </div>

                <div className="full-field treasury-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha generación</th>
                        <th>Asesor</th>
                        <th>Tipo / tasa</th>
                        <th>Abono origen</th>
                        <th>Comisión</th>
                        <th>Pagado</th>
                        <th>Saldo</th>
                        <th>Último pago</th>
                        <th>Estado</th>
                        {canPayProjectCommission && <th>Acción</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCommissions && (
                        <tr>
                          <td colSpan={canPayProjectCommission ? "10" : "9"}>
                            Cargando comisiones del proyecto...
                          </td>
                        </tr>
                      )}

                      {!loadingCommissions && projectCommissions.length === 0 && (
                        <tr>
                          <td colSpan={canPayProjectCommission ? "10" : "9"}>
                            Sin comisiones generadas para este proyecto.
                          </td>
                        </tr>
                      )}

                      {!loadingCommissions &&
                        projectCommissions.map((commission) => (
                          <tr key={commission.project_commission_id}>
                            <td>{formatDate(commission.generated_at)}</td>
                            <td>{commission.advisor_name || "Sin asesor"}</td>
                            <td>
                              {commission.commission_type || "-"}
                              {commission.commission_rate
                                ? ` / ${Number(commission.commission_rate)}%`
                                : ""}
                            </td>
                            <td>
                              {formatDate(commission.payment_date)} · {money(commission.payment_amount)}
                            </td>
                            <td>{money(commission.commission_amount)}</td>
                            <td>{money(commission.paid_amount_cached)}</td>
                            <td>{money(commission.balance_cached)}</td>
                            <td>{formatDate(commission.last_payment_date)}</td>
                            <td>{formatCommissionStatus(commission.status)}</td>
                            {canPayProjectCommission && (
                              <td>
                                {canPayCommissionRow(commission) ? (
                                  <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={() =>
                                      setSelectedCommissionPayment(commission)
                                    }
                                  >
                                    Registrar pago
                                  </button>
                                ) : (
                                  "-"
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="full-field treasury-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha pago comisión</th>
                        <th>Monto</th>
                        <th>Empresa/Banco</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Referencia</th>
                        <th>Tesorería</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCommissions && (
                        <tr>
                          <td colSpan="7">Cargando pagos de comisión...</td>
                        </tr>
                      )}

                      {!loadingCommissions &&
                        projectCommissionPayments.length === 0 && (
                          <tr>
                            <td colSpan="7">Sin pagos de comisión registrados para este proyecto.</td>
                          </tr>
                        )}

                      {!loadingCommissions &&
                        projectCommissionPayments.map((payment) => (
                          <tr key={payment.project_commission_payment_id}>
                            <td>{formatDate(payment.payout_date)}</td>
                            <td>{money(payment.payout_amount)}</td>
                            <td>
                              {payment.payout_company_name || "-"}
                              {" / "}
                              {payment.payout_bank || "-"}
                            </td>
                            <td>{payment.payout_method || "-"}</td>
                            <td>{payment.payout_status || "-"}</td>
                            <td>{payment.payout_reference || "-"}</td>
                            <td>{payment.treasury_movement_id || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <CommissionPaymentModal
                  open={Boolean(selectedCommissionPayment)}
                  commission={selectedCommissionPayment}
                  title="Registrar pago de comisión"
                  subtitle="Pago desde la ficha del proyecto usando pay_project_commission."
                  confirmLabel="Registrar pago"
                  onClose={() => setSelectedCommissionPayment(null)}
                  onPaid={handleCommissionPaidInProject}
                />
              </>
            )}

            {canRegisterPayment && (
              <>
                <div className="full-field">
                  <h3>Registrar abono</h3>
                  <p className="muted-text">
                    El pago se registra como evento financiero trazable y crea su movimiento de Tesorería una sola vez.
                  </p>
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
                    min="1"
                    value={newPayment.amount}
                    onChange={(e) =>
                      updateNewPaymentField("amount", e.target.value)
                    }
                    disabled={savingPayment}
                  />
                </label>

                <label>
                  Empresa receptora
                  <select
                    value={newPayment.companyName}
                    onChange={(e) =>
                      updateNewPaymentField("companyName", e.target.value)
                    }
                    disabled={savingPayment}
                  >
                    <option value="">Seleccionar empresa</option>
                    <option value="Decosun Group SpA">Decosun Group SpA</option>
                    <option value="Decosun Spa">Decosun Spa</option>
                  </select>
                </label>

                <label>
                  Banco / cuenta
                  <select
                    value={newPayment.bank}
                    onChange={(e) =>
                      updateNewPaymentField("bank", e.target.value)
                    }
                    disabled={savingPayment}
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
                    disabled={savingPayment}
                  >
                    <option value="bank_transfer">Transferencia bancaria</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="mercado_pago">Mercado Pago</option>
                    <option value="other">Otro</option>
                  </select>
                </label>

                <label>
                  Hito / tipo de pago
                  <select
                    value={newPayment.paymentMilestone}
                    onChange={(e) =>
                      updateNewPaymentField("paymentMilestone", e.target.value)
                    }
                    disabled={savingPayment}
                  >
                    <option value="initial_50">initial_50</option>
                    <option value="final_50">final_50</option>
                    <option value="partial">partial</option>
                    <option value="full">full</option>
                    <option value="manual">manual</option>
                  </select>
                </label>

                <label className="full-field">
                  Referencia u observación
                  <textarea
                    rows="3"
                    value={newPayment.notes}
                    onChange={(e) =>
                      updateNewPaymentField("notes", e.target.value)
                    }
                    disabled={savingPayment}
                  />
                </label>

                <div className="full-field">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={submitNewPayment}
                    disabled={savingPayment}
                  >
                    {savingPayment ? "Registrando..." : "Registrar abono"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "compras" && (
          <div className="modal-grid">
            <div className="full-field client-visible-note">
              <strong>Compras asociadas proximamente.</strong>
              <p>
                En una siguiente fase esta ficha mostrara solicitudes,
                proveedor, monto, estado de aprobacion, pago y recepcion
                vinculados al proyecto.
              </p>
            </div>

            <div className="balance-box">
              <span>Fuente futura</span>
              <strong>Compras - Inventario - Proyecto</strong>
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
