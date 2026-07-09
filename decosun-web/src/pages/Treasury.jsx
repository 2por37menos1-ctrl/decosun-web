import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

import {
  canViewTreasuryTotals,
  canViewInternalLoans,
  canViewCommissionReports,
  canPayProjectCommissions,
} from "../lib/permissions"

import { useProfile } from "../hooks/useProfile"

const companies = ["Decosun Spa", "Decosun Group SpA"]

const categories = [
  "Ingreso cliente",
  "Mercadería",
  "Comisión",
  "Manejo gerencia",
  "Traslado",
  "Bencina",
  "Sueldos",
  "Arriendo",
  "Gastos legales",
  "Préstamos",
  "Pago por cuenta de otra empresa",
  "Gastos fijos",
  "Gastos variables",
  "Aporte socio",
  "Transferencia entre empresas",
  "Traspaso entre cuentas",

  "Otros",
]

const banks = [
  "BCI",
  "Scotiabank",
  "Santander",
  "BancoEstado",
  "Mercado Pago",
  "Efectivo",
  "Otro",
]

const commissionPaymentMethods = [
  "Transferencia",
  "Efectivo",
  "Mercado Pago",
  "Otro",
]

const commissionStatuses = [
  { value: "all", label: "Estados activos" },
  { value: "generated", label: "Generada" },
  { value: "partially_paid", label: "Parcialmente pagada" },
  { value: "paid", label: "Pagada" },
  { value: "voided", label: "Anulada" },
  { value: "reversed", label: "Reversada" },
]

const commissionRegions = [
  { value: "all", label: "Todas las regiones" },
  { value: "iquique", label: "Iquique" },
  { value: "quinta_region", label: "Quinta Region" },
  { value: "quinta_region_interior", label: "Quinta Region Interior" },
  { value: "santiago", label: "Santiago" },
  { value: "atacama", label: "Atacama" },
  { value: "iv_region_coquimbo", label: "IV Region Coquimbo" },
  { value: "la_serena", label: "La Serena" },
]

const financeToolTabs = [
  { id: "bankTransfer", label: "Traspaso cuentas" },
  { id: "companyTransfer", label: "Entre empresas" },
  { id: "intercompany", label: "Pago por cuenta" },
  { id: "loans", label: "Prestamos" },
]

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function formatDate(dateString) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("es-CL")
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}

function getProjectedReceivable(project) {
  if (project.balance_cached != null) {
    return Math.max(0, Number(project.balance_cached || 0))
  }

  if (project.amount_paid_cached != null) {
    return Math.max(
      0,
      Number(project.sale_value || 0) - Number(project.amount_paid_cached || 0)
    )
  }

  return 0
}

export default function Treasury() {
  const [view, setView] = useState("cartola")
  const [activeTool, setActiveTool] = useState("bankTransfer")
  const [movements, setMovements] = useState([])
  const [loans, setLoans] = useState([])
  const [intercompanyPayments, setIntercompanyPayments] = useState([])
  const [commitments, setCommitments] = useState([])
  const [projects, setProjects] = useState([])
  const [financialGroups, setFinancialGroups] = useState([])
  const [financialConcepts, setFinancialConcepts] = useState([])
  const [commissionSummary, setCommissionSummary] = useState([])
  const [commissionDetail, setCommissionDetail] = useState([])
  const [loadingCommissions, setLoadingCommissions] = useState(false)
  const [commissionError, setCommissionError] = useState("")
  const [selectedCommissionPayment, setSelectedCommissionPayment] = useState(null)
  const [payingCommission, setPayingCommission] = useState(false)
  const [commissionPaymentError, setCommissionPaymentError] = useState("")
  const [commissionPaymentIdempotencyKey, setCommissionPaymentIdempotencyKey] =
    useState("")

  const [editingMovement, setEditingMovement] = useState(null)

  const [filters, setFilters] = useState({
    company_name: "all",
    bank: "all",
    type: "all",
    category: "all",
    financial_group: "all",
    month: currentMonth(),
    search: "",
  })

  const [commissionFilters, setCommissionFilters] = useState({
    from_date: "",
    to_date: "",
    advisor_id: "all",
    status: "all",
    region: "all",
  })

  const [commissionPaymentForm, setCommissionPaymentForm] = useState({
    amount: "",
    payment_date: currentDate(),
    company_name: "Decosun Group SpA",
    bank: "BCI",
    payment_method: "Transferencia",
    notes: "",
  })

  const [form, setForm] = useState({
    date: currentDate(),
    company_name: "Decosun Group SpA",
    bank: "BCI",
    description: "",
    type: "egreso",
    amount: "",
    category: "Otros",
    subcategory: "",
    branch: "Viña del Mar",
    person_name: "",
    notes: "",
    reconciliation_status: "pendiente",
    source_module: "manual",
  })

  const [loanForm, setLoanForm] = useState({
    from_company: "Decosun Group SpA",
    from_bank: "BCI",
    to_company: "Decosun Spa",
    to_bank: "BCI",
    amount: "",
    reason: "",
    notes: "",
  })

  const [intercompanyForm, setIntercompanyForm] = useState({
    payer_company: "Decosun Group SpA",
    payer_bank: "BCI",
    beneficiary_company: "Decosun Spa",
    amount: "",
    reason: "",
    notes: "",
  })

  const [transferForm, setTransferForm] = useState({
    date: currentDate(),
    company_name: "Decosun Group SpA",
    from_bank: "Mercado Pago",
    to_bank: "BCI",
    amount: "",
    notes: "",
  })

  const [companyTransferForm, setCompanyTransferForm] = useState({
    date: currentDate(),
    from_company: "Decosun Group SpA",
    from_bank: "BCI",
    to_company: "Decosun Spa",
    to_bank: "BCI",
    amount: "",
    notes: "",
  })

  const { profile } = useProfile()

  useEffect(() => {
    loadMovements()
    loadLoans()
    loadIntercompanyPayments()
    loadCommitments()
    loadProjects()
    loadFinancialGroups()
    loadFinancialConcepts()

  }, [])

  async function loadMovements() {
    const { data, error } = await supabase
      .from("treasury_movements")
      .select("*")
      .order("date", { ascending: false })

    if (error) {
      console.error(error)
      alert("No se pudieron cargar los movimientos.")
      return
    }

    setMovements(data || [])
  }

  async function loadLoans() {
    const { data, error } = await supabase
      .from("internal_loans")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setLoans(data || [])
  }

  async function loadIntercompanyPayments() {
    const { data, error } = await supabase
      .from("intercompany_payments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setIntercompanyPayments(data || [])
  }

  async function loadCommitments() {
    const { data, error } = await supabase
      .from("financial_commitments")
      .select("*")

    if (error) {
      console.error(error)
      return
    }

    setCommitments(data || [])
  }

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select(`
      id,
      status,
      sale_value,
      amount_paid_cached,
      balance_cached,
      finance_status
    `)

    if (error) {
      console.error(error)
      return
    }

    setProjects(data || [])
  }

  async function loadFinancialGroups() {
    const { data, error } = await supabase
      .from("financial_groups")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setFinancialGroups(data || [])
  }

  async function loadFinancialConcepts() {
    const { data, error } = await supabase
      .from("financial_concepts")
      .select(`
      *,
      financial_groups(*)
    `)
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setFinancialConcepts(data || [])
  }

  const loadCommissionReports = useCallback(async () => {
    setLoadingCommissions(true)
    setCommissionError("")

    const rpcFilters = {
      p_from_date: commissionFilters.from_date || null,
      p_to_date: commissionFilters.to_date || null,
      p_advisor_id:
        commissionFilters.advisor_id === "all"
          ? null
          : commissionFilters.advisor_id,
      p_status:
        commissionFilters.status === "all"
          ? null
          : commissionFilters.status,
      p_region:
        commissionFilters.region === "all"
          ? null
          : commissionFilters.region,
    }

    const [summaryResponse, detailResponse] = await Promise.all([
      supabase.rpc("get_project_commissions_summary", rpcFilters),
      supabase.rpc("get_project_commissions_detail", rpcFilters),
    ])

    if (summaryResponse.error || detailResponse.error) {
      const message =
        summaryResponse.error?.message ||
        detailResponse.error?.message ||
        "No se pudieron cargar las comisiones."

      console.error(summaryResponse.error || detailResponse.error)
      setCommissionSummary([])
      setCommissionDetail([])
      setCommissionError(message)
      setLoadingCommissions(false)
      return
    }

    setCommissionSummary(summaryResponse.data || [])
    setCommissionDetail(detailResponse.data || [])
    setLoadingCommissions(false)
  }, [
    commissionFilters.from_date,
    commissionFilters.to_date,
    commissionFilters.advisor_id,
    commissionFilters.status,
    commissionFilters.region,
  ])

  useEffect(() => {
    if (view !== "commissions") return
    if (!canViewCommissionReports(profile)) return

    loadCommissionReports()
  }, [
    view,
    profile,
    profile?.id,
    profile?.role,
    profile?.region_code,
    loadCommissionReports,
  ])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateLoanField(field, value) {
    setLoanForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateTransferField(field, value) {
    setTransferForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateCompanyTransferField(field, value) {
    setCompanyTransferForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateIntercompanyField(field, value) {
    setIntercompanyForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateCommissionFilter(field, value) {
    setCommissionFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateCommissionPaymentField(field, value) {
    setCommissionPaymentForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function createCommissionPaymentIdempotencyKey(projectCommissionId) {
    const randomPart =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`

    return `commission-payment:${projectCommissionId}:${randomPart}`
  }

  function openCommissionPaymentModal(commission) {
    setSelectedCommissionPayment(commission)
    setCommissionPaymentError("")
    setCommissionPaymentIdempotencyKey("")
    setCommissionPaymentForm({
      amount: String(Number(commission.balance_cached || 0)),
      payment_date: currentDate(),
      company_name: companies[1] || companies[0] || "",
      bank: banks[0] || "",
      payment_method: commissionPaymentMethods[0] || "",
      notes: "",
    })
  }

  function closeCommissionPaymentModal() {
    if (payingCommission) return

    setSelectedCommissionPayment(null)
    setCommissionPaymentError("")
    setCommissionPaymentIdempotencyKey("")
    setCommissionPaymentForm({
      amount: "",
      payment_date: currentDate(),
      company_name: "Decosun Group SpA",
      bank: "BCI",
      payment_method: "Transferencia",
      notes: "",
    })
  }

  async function submitCommissionPayment(e) {
    e.preventDefault()

    if (!selectedCommissionPayment || payingCommission) return

    const amount = Number(commissionPaymentForm.amount || 0)
    const pending = Number(selectedCommissionPayment.balance_cached || 0)

    if (amount <= 0) {
      setCommissionPaymentError("El monto debe ser mayor que cero.")
      return
    }

    if (amount > pending) {
      setCommissionPaymentError("El monto no puede superar el saldo pendiente.")
      return
    }

    if (!commissionPaymentForm.company_name) {
      setCommissionPaymentError("Selecciona una empresa.")
      return
    }

    if (!commissionPaymentForm.bank) {
      setCommissionPaymentError("Selecciona un banco.")
      return
    }

    setPayingCommission(true)
    setCommissionPaymentError("")

    const idempotencyKey =
      commissionPaymentIdempotencyKey ||
      createCommissionPaymentIdempotencyKey(
        selectedCommissionPayment.project_commission_id
      )

    setCommissionPaymentIdempotencyKey(idempotencyKey)

    const { error } = await supabase.rpc("pay_project_commission", {
      p_project_commission_id:
        selectedCommissionPayment.project_commission_id,
      p_amount: amount,
      p_payment_date: commissionPaymentForm.payment_date,
      p_company_name: commissionPaymentForm.company_name,
      p_bank: commissionPaymentForm.bank,
      p_payment_method: commissionPaymentForm.payment_method || null,
      p_notes: commissionPaymentForm.notes || null,
      p_idempotency_key: idempotencyKey,
    })

    if (error) {
      console.error(error)
      setCommissionPaymentError(
        error.message || "No se pudo pagar la comision."
      )
      setPayingCommission(false)
      return
    }

    await loadCommissionReports()
    await loadMovements()

    setPayingCommission(false)
    closeCommissionPaymentModal()
  }

  function canPayCommissionRow(commission) {
    return (
      canPayProjectCommissions(profile) &&
      ["generated", "partially_paid"].includes(commission.status) &&
      Number(commission.balance_cached || 0) > 0
    )
  }

  async function createIntercompanyPayment(e) {
    e.preventDefault()

    const amount = Number(intercompanyForm.amount || 0)

    if (amount <= 0) {
      alert("Ingresa un monto válido.")
      return
    }

    if (intercompanyForm.payer_company === intercompanyForm.beneficiary_company) {
      alert("La empresa que paga y la beneficiada no pueden ser la misma.")
      return
    }

    const { data: payment, error: paymentError } = await supabase
      .from("intercompany_payments")
      .insert({
        payer_company: intercompanyForm.payer_company,
        payer_bank: intercompanyForm.payer_bank,
        beneficiary_company: intercompanyForm.beneficiary_company,
        amount,
        returned_amount: 0,
        status: "pendiente",
        reason: intercompanyForm.reason,
        notes: intercompanyForm.notes,
      })
      .select()
      .single()

    if (paymentError) {
      console.error(paymentError)
      alert("No se pudo crear el pago por cuenta de otra empresa.")
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const { error: movementError } = await supabase
      .from("treasury_movements")
      .insert({
        date: today,
        company_name: intercompanyForm.payer_company,
        bank: intercompanyForm.payer_bank,
        description: `Pago por cuenta de ${intercompanyForm.beneficiary_company}`,
        type: "egreso",
        amount,
        category: "Pago por cuenta de otra empresa",
        subcategory: "Cuenta por cobrar interempresa",
        branch: "General",
        person_name: intercompanyForm.beneficiary_company,
        notes:
          intercompanyForm.reason ||
          "Pago realizado por una empresa, correspondiente a otra",
        source_module: "intercompany_payment",
        intercompany_payment_id: payment.id,
        reconciliation_status: "pendiente",
      })

    if (movementError) {
      console.error(movementError)
      alert("Se creó el registro, pero no se pudo crear el movimiento.")
    }

    setIntercompanyForm({
      payer_company: "Decosun Group SpA",
      payer_bank: "BCI",
      beneficiary_company: "Decosun Spa",
      amount: "",
      reason: "",
      notes: "",
    })

    loadIntercompanyPayments()
    loadMovements()
  }

  async function saveMovement(e) {
    e.preventDefault()

    const payload = {
      ...form,
      amount: Number(form.amount || 0),
      company_name: form.company_name || "Decosun Group SpA",
      reconciliation_status: form.reconciliation_status || "pendiente",
      source_module: form.source_module || "manual",
    }

    let error

    if (editingMovement) {
      const response = await supabase
        .from("treasury_movements")
        .update(payload)
        .eq("id", editingMovement.id)

      error = response.error
    } else {
      const response = await supabase
        .from("treasury_movements")
        .insert(payload)

      error = response.error
    }

    if (error) {
      console.error(error)
      alert("No se pudo guardar el movimiento.")
      return
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      company_name: "Decosun Group SpA",
      bank: "BCI",
      description: "",
      type: "egreso",
      amount: "",
      category: "Otros",
      subcategory: "",
      branch: "Viña del Mar",
      person_name: "",
      notes: "",
      reconciliation_status: "pendiente",
      source_module: "manual",
    })

    setEditingMovement(null)

    loadMovements()
  }

  async function createInternalLoan(e) {
    e.preventDefault()

    const amount = Number(loanForm.amount || 0)

    if (amount <= 0) {
      alert("Ingresa un monto válido.")
      return
    }

    const { data: loan, error: loanError } = await supabase
      .from("internal_loans")
      .insert({
        from_company: loanForm.from_company,
        from_bank: loanForm.from_bank,
        to_company: loanForm.to_company,
        to_bank: loanForm.to_bank,
        amount,
        returned_amount: 0,
        status: "pendiente",
        reason: loanForm.reason,
        notes: loanForm.notes,
      })
      .select()
      .single()

    if (loanError) {
      console.error(loanError)
      alert("No se pudo crear el préstamo interno.")
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const movementsPayload = [
      {
        date: today,
        company_name: loanForm.from_company,
        bank: loanForm.from_bank,
        description: `Préstamo interno a ${loanForm.to_company}`,
        type: "egreso",
        amount,
        category: "Préstamos",
        subcategory: "Salida préstamo interno",
        branch: "General",
        person_name: loanForm.to_company,
        notes: loanForm.reason || "Préstamo interno entre empresas",
        source_module: "internal_loan",
        loan_id: loan.id,
        reconciliation_status: "pendiente",
      },
      {
        date: today,
        company_name: loanForm.to_company,
        bank: loanForm.to_bank,
        description: `Préstamo recibido desde ${loanForm.from_company}`,
        type: "ingreso",
        amount,
        category: "Préstamos",
        subcategory: "Ingreso préstamo interno",
        branch: "General",
        person_name: loanForm.from_company,
        notes: loanForm.reason || "Préstamo interno entre empresas",
        source_module: "internal_loan",
        loan_id: loan.id,
        reconciliation_status: "pendiente",
      },
    ]

    const { error: movementsError } = await supabase
      .from("treasury_movements")
      .insert(movementsPayload)

    if (movementsError) {
      console.error(movementsError)
      alert("Se creó el préstamo, pero no se pudieron crear los movimientos.")
    }

    setLoanForm({
      from_company: "Decosun Group SpA",
      from_bank: "BCI",
      to_company: "Decosun Spa",
      to_bank: "BCI",
      amount: "",
      reason: "",
      notes: "",
    })

    loadLoans()
    loadMovements()
  }

  async function registerLoanReturn(loan) {
    const rawAmount = window.prompt(
      `Monto a devolver. Saldo pendiente: ${money(
        Number(loan.amount || 0) - Number(loan.returned_amount || 0)
      )}`
    )

    if (!rawAmount) return

    const amount = Number(rawAmount)

    if (amount <= 0) {
      alert("Ingresa un monto válido.")
      return
    }

    const pending =
      Number(loan.amount || 0) - Number(loan.returned_amount || 0)

    if (amount > pending) {
      alert("El monto supera el saldo pendiente.")
      return
    }

    const newReturned = Number(loan.returned_amount || 0) + amount
    const newStatus = newReturned >= Number(loan.amount || 0) ? "cerrado" : "parcial"

    const { error: updateError } = await supabase
      .from("internal_loans")
      .update({
        returned_amount: newReturned,
        status: newStatus,
      })
      .eq("id", loan.id)

    if (updateError) {
      console.error(updateError)
      alert("No se pudo actualizar el préstamo.")
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const movementsPayload = [
      {
        date: today,
        company_name: loan.to_company,
        bank: loan.to_bank || "BCI",
        description: `Devolución préstamo a ${loan.from_company}`,
        type: "egreso",
        amount,
        category: "Préstamos",
        subcategory: "Devolución préstamo interno",
        branch: "General",
        person_name: loan.from_company,
        notes: loan.reason || "Devolución préstamo interno",
        source_module: "internal_loan_return",
        loan_id: loan.id,
        reconciliation_status: "pendiente",
      },
      {
        date: today,
        company_name: loan.from_company,
        bank: loan.from_bank || "BCI",
        description: `Devolución recibida desde ${loan.to_company}`,
        type: "ingreso",
        amount,
        category: "Préstamos",
        subcategory: "Retorno préstamo interno",
        branch: "General",
        person_name: loan.to_company,
        notes: loan.reason || "Retorno préstamo interno",
        source_module: "internal_loan_return",
        loan_id: loan.id,
        reconciliation_status: "pendiente",
      },
    ]

    const { error: movementsError } = await supabase
      .from("treasury_movements")
      .insert(movementsPayload)

    if (movementsError) {
      console.error(movementsError)
      alert("El préstamo se actualizó, pero no se crearon los movimientos.")
    }

    loadLoans()
    loadMovements()
  }

  async function voidMovement(movement) {
    const reason = window.prompt(
      "Motivo de anulación:",
      "Error digitación"
    )

    if (!reason) return

    const { error } = await supabase
      .from("treasury_movements")
      .update({
        is_void: true,
        void_reason: reason,
      })
      .eq("id", movement.id)

    if (error) {
      console.error(error)
      alert("No se pudo anular.")
      return
    }

    loadMovements()
  }

  async function voidTransfer(movement) {
    const reason = window.prompt(
      "Motivo de anulación:",
      "Error digitación"
    )

    if (!reason) return

    const { error } = await supabase
      .from("treasury_movements")
      .update({
        is_void: true,
        void_reason: reason,
      })
      .eq("transfer_group_id", movement.transfer_group_id)

    if (error) {
      console.error(error)
      alert("No se pudo anular el traspaso.")
      return
    }

    loadMovements()
  }



  async function createCompanyTransfer(e) {
    e.preventDefault()

    const amount = Number(companyTransferForm.amount || 0)

    if (amount <= 0) {
      alert("Ingresa un monto válido.")
      return
    }

    if (companyTransferForm.from_company === companyTransferForm.to_company) {
      alert("La empresa origen y destino no pueden ser la misma.")
      return
    }

    const transferGroupId = crypto.randomUUID()

    const payload = [
      {
        date: companyTransferForm.date,
        company_name: companyTransferForm.from_company,
        bank: companyTransferForm.from_bank,
        description: `Transferencia a ${companyTransferForm.to_company}`,
        type: "egreso",
        amount,
        category: "Transferencia entre empresas",
        subcategory: "Salida transferencia interempresa",
        branch: "General",
        person_name: companyTransferForm.to_company,
        notes: companyTransferForm.notes,
        reconciliation_status: "pendiente",
        source_module: "company_transfer",
        transfer_group_id: transferGroupId,
      },
      {
        date: companyTransferForm.date,
        company_name: companyTransferForm.to_company,
        bank: companyTransferForm.to_bank,
        description: `Transferencia desde ${companyTransferForm.from_company}`,
        type: "ingreso",
        amount,
        category: "Transferencia entre empresas",
        subcategory: "Ingreso transferencia interempresa",
        branch: "General",
        person_name: companyTransferForm.from_company,
        notes: companyTransferForm.notes,
        reconciliation_status: "pendiente",
        source_module: "company_transfer",
        transfer_group_id: transferGroupId,
      },
    ]

    const { error } = await supabase
      .from("treasury_movements")
      .insert(payload)

    if (error) {
      console.error(error)
      alert("No se pudo crear la transferencia entre empresas.")
      return
    }

    setCompanyTransferForm({
      date: new Date().toISOString().slice(0, 10),
      from_company: "Decosun Group SpA",
      from_bank: "BCI",
      to_company: "Decosun Spa",
      to_bank: "BCI",
      amount: "",
      notes: "",
    })

    loadMovements()
  }
  async function createBankTransfer(e) {
    e.preventDefault()

    const amount = Number(transferForm.amount || 0)

    if (amount <= 0) {
      alert("Ingresa un monto válido.")
      return
    }

    if (transferForm.from_bank === transferForm.to_bank) {
      alert("El banco origen y destino no pueden ser el mismo.")
      return
    }

    const transferGroupId = crypto.randomUUID()

    const payload = [
      {
        date: transferForm.date,
        company_name: transferForm.company_name,
        bank: transferForm.from_bank,
        description: `Traspaso a ${transferForm.to_bank}`,
        type: "egreso",
        amount,
        category: "Traspaso entre cuentas",
        subcategory: "Salida traspaso",
        branch: "General",
        person_name: "",
        notes: transferForm.notes,
        reconciliation_status: "pendiente",
        source_module: "bank_transfer",
        transfer_group_id: transferGroupId,
      },
      {
        date: transferForm.date,
        company_name: transferForm.company_name,
        bank: transferForm.to_bank,
        description: `Traspaso desde ${transferForm.from_bank}`,
        type: "ingreso",
        amount,
        category: "Traspaso entre cuentas",
        subcategory: "Ingreso traspaso",
        branch: "General",
        person_name: "",
        notes: transferForm.notes,
        reconciliation_status: "pendiente",
        source_module: "bank_transfer",
        transfer_group_id: transferGroupId,
      },
    ]

    const { error } = await supabase
      .from("treasury_movements")
      .insert(payload)

    if (error) {
      console.error(error)
      alert("No se pudo crear el traspaso.")
      return
    }

    setTransferForm({
      date: new Date().toISOString().slice(0, 10),
      company_name: "Decosun Group SpA",
      from_bank: "Mercado Pago",
      to_bank: "BCI",
      amount: "",
      notes: "",
    })

    loadMovements()
  }

  const financialConceptMap = useMemo(() => {
    return financialConcepts.reduce((acc, concept) => {
      acc[concept.name] = concept.financial_groups?.name || null
      return acc
    }, {})
  }, [financialConcepts])

  const filteredMovements = movements.filter((movement) => {
    if (movement.is_void) return false

    const matchesCompany =
      filters.company_name === "all" ||
      movement.company_name === filters.company_name

    const matchesBank =
      filters.bank === "all" ||
      movement.bank === filters.bank

    const matchesType =
      filters.type === "all" ||
      movement.type === filters.type

    const matchesCategory =
      filters.category === "all" ||
      movement.category === filters.category

    const conceptGroup = financialConceptMap[movement.category]

    const matchesFinancialGroup =
      filters.financial_group === "all" ||
      conceptGroup === filters.financial_group

    const matchesMonth =
      !filters.month ||
      movement.date?.startsWith(filters.month)

    const searchText = String(filters.search || "").trim().toLowerCase()
    const matchesSearch =
      !searchText ||
      [
        movement.description,
        movement.category,
        movement.subcategory,
        movement.company_name,
        movement.bank,
        movement.person_name,
        movement.notes,
        movement.source_module,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText)

    return (
      matchesCompany &&
      matchesBank &&
      matchesType &&
      matchesCategory &&
      matchesFinancialGroup &&
      matchesMonth &&
      matchesSearch
    )
  })

  const cashIncome = filteredMovements
    .filter((m) => m.type === "ingreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const cashExpense = filteredMovements
    .filter((m) => m.type === "egreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const cashBalance = cashIncome - cashExpense

  const operationalIncome = filteredMovements
    .filter(
      (m) =>
        m.type === "ingreso" &&
        m.category === "Ingreso cliente"
    )
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const nonOperationalIncome = filteredMovements
    .filter(
      (m) =>
        m.type === "ingreso" &&
        m.category !== "Ingreso cliente"
    )
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const realExpense = filteredMovements
    .filter(
      (m) =>
        m.type === "egreso" &&
        ![
          "Traspaso entre cuentas",
          "Transferencia entre empresas",
          "Préstamos",
        ].includes(m.category)
    )
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const operationalResult = operationalIncome - realExpense

  const openLoans = loans.filter(
    (loan) => loan.status !== "cerrado"
  )

  const openLoanBalance = openLoans.reduce(
    (acc, loan) =>
      acc +
      (
        Number(loan.amount || 0) -
        Number(loan.returned_amount || 0)
      ),
    0
  )

  const monthIncomeMovements = filteredMovements.filter(
    (movement) => movement.type === "ingreso"
  )

  const monthExpenseMovements = filteredMovements.filter(
    (movement) => movement.type === "egreso"
  )

  const unreconciledIncome = monthIncomeMovements.filter(
    (movement) => movement.reconciliation_status !== "conciliado"
  )

  const unreconciledExpense = monthExpenseMovements.filter(
    (movement) => movement.reconciliation_status !== "conciliado"
  )

  const expectedIncome = projects
    .filter((project) =>
      [
        "aceptado",
        "medicion",
        "compras",
        "produccion",
        "instalacion",
        "facturacion",
      ].includes(project.status)
    )
    .reduce((acc, project) => {
      return acc + getProjectedReceivable(project)
    }, 0)

  const pendingCommitments = commitments
    .filter((c) => c.status === "pendiente")
    .reduce(
      (acc, c) => acc + Number(c.amount || 0),
      0
    )

  const projectedCash =
    cashBalance +
    expectedIncome -
    pendingCommitments

  const committedPercentage =
    cashBalance > 0
      ? (pendingCommitments / cashBalance) * 100
      : 0

  const upcomingCommitments = [...commitments]
    .filter((commitment) => commitment.status !== "pagado" && commitment.status !== "anulado")
    .sort((a, b) =>
      String(a.due_date || a.date || a.created_at || "").localeCompare(
        String(b.due_date || b.date || b.created_at || "")
      )
    )
    .slice(0, 8)

  const commissionTotals = useMemo(() => {
    const totals = commissionSummary.reduce(
      (acc, item) => ({
        generated: acc.generated + Number(item.total_generated || 0),
        paid: acc.paid + Number(item.total_paid || 0),
        pending: acc.pending + Number(item.total_pending || 0),
        projects: acc.projects,
      }),
      {
        generated: 0,
        paid: 0,
        pending: 0,
        projects: 0,
      }
    )

    totals.projects = new Set(
      commissionDetail
        .map((item) => item.project_id)
        .filter(Boolean)
    ).size

    return totals
  }, [commissionSummary, commissionDetail])

  const commissionAdvisorOptions = useMemo(() => {
    const map = new Map()

    commissionSummary.forEach((item) => {
      if (!item.advisor_id) return
      map.set(item.advisor_id, item.advisor_name || "Sin asesor")
    })

    commissionDetail.forEach((item) => {
      if (!item.advisor_id) return
      map.set(item.advisor_id, item.advisor_name || "Sin asesor")
    })

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [commissionSummary, commissionDetail])

  async function markAsReconciled(movement) {
    const { error } = await supabase
      .from("treasury_movements")
      .update({
        reconciliation_status: "conciliado",
      })
      .eq("id", movement.id)

    if (error) {
      console.error(error)
      alert("No se pudo conciliar el movimiento.")
      return
    }

    loadMovements()
  }

  return (
    <section className="treasury-page">
      <div className="dashboard-header">
        <div>
          <h2>Finanzas</h2>
          <p>Cartola gerencial, caja real y proyección operativa.</p>
        </div>

        <div className="view-actions">
          <button
            className={view === "cartola" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("cartola")}
          >
            Cartola
          </button>

          {canViewCommissionReports(profile) && (
            <button
              className={view === "commissions" ? "primary-btn" : "secondary-btn"}
              onClick={() => setView("commissions")}
            >
              Comisiones
            </button>
          )}

          <button
            className={view === "commitments" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("commitments")}
          >
            Compromisos
          </button>

          <button
            className={view === "tools" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("tools")}
          >
            Herramientas
          </button>
        </div>
      </div>

      {(view === "cartola" || view === "tools") && (
        <>
      <div className="finance-filter-panel">
        <div className="finance-filter-row finance-filter-row-primary">
        <input
          type="month"
          value={filters.month}
          onChange={(e) => updateFilter("month", e.target.value)}
        />

        <select
          value={filters.company_name}
          onChange={(e) => updateFilter("company_name", e.target.value)}
        >
          <option value="all">Todas las empresas</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>

        <select
          value={filters.bank}
          onChange={(e) => updateFilter("bank", e.target.value)}
        >
          <option value="all">Todos los bancos</option>
          {banks.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => updateFilter("type", e.target.value)}
        >
          <option value="all">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="egreso">Egresos</option>
        </select>
        </div>

        <div className="finance-filter-row finance-filter-row-secondary">
        <select
          value={filters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="all">Todos los conceptos</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filters.financial_group}
          onChange={(e) => updateFilter("financial_group", e.target.value)}
        >
          <option value="all">Todos los grupos</option>
          {financialGroups.map((group) => (
            <option key={group.id} value={group.name}>
              {group.icon} {group.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Buscar movimiento, origen o nota"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        </div>
      </div>

      <div className="finance-overview">
        <section className="finance-overview-group">
          <div className="finance-overview-heading">
            <span>Caja Real</span>
            <strong>Solo movimientos reales registrados</strong>
          </div>

          <div className="treasury-summary finance-summary-grid">
            <div className="stat-card">
              <span>Ingresos caja</span>
              <h2>{money(cashIncome)}</h2>
            </div>

            <div className="stat-card">
              <span>Egresos caja</span>
              <h2>{money(cashExpense)}</h2>
            </div>

            <div className="stat-card">
              <span>Resultado caja</span>
              <h2>{money(cashBalance)}</h2>
            </div>
          </div>
        </section>

        <section className="finance-overview-group is-projected">
          <div className="finance-overview-heading">
            <span>Proyeccion Gerencial</span>
            <strong>Proyectado no es saldo banco</strong>
          </div>

          <div className="treasury-summary finance-summary-grid">
            <div className="stat-card">
              <span>Por cobrar clientes</span>
              <h2>{money(expectedIncome)}</h2>
            </div>

            <div className="stat-card">
              <span>Compromisos pendientes</span>
              <h2>{money(pendingCommitments)}</h2>
            </div>

            <div className="stat-card">
              <span>Caja proyectada</span>
              <h2>{money(projectedCash)}</h2>
            </div>
          </div>
        </section>
      </div>

      {canViewTreasuryTotals(profile) && (
        <div className="treasury-summary finance-legacy-summary">
          <div className="stat-card">
            <span>Ventas reales</span>
            <h2>{money(operationalIncome)}</h2>
          </div>

          <div className="stat-card">
            <span>Resultado operacional</span>
            <h2>{money(operationalResult)}</h2>
          </div>

          <div className="stat-card">
            <span>Prestamos abiertos</span>
            <h2>{money(openLoanBalance)}</h2>
          </div>

          <div className="stat-card">
            <span>Dinero comprometido</span>
            <h2>{committedPercentage.toFixed(0)}%</h2>
          </div>
        </div>
      )}

      <div
        className="treasury-summary finance-hidden"
        style={{ marginBottom: "24px" }}
      >
        <div className="stat-card">
          <span>💰 Saldo Bancos</span>
          <h2>{money(cashBalance)}</h2>
        </div>

        <div className="stat-card">
          <span>📥 Cobros Esperados</span>
          <h2>{money(expectedIncome)}</h2>
        </div>

        <div className="stat-card">
          <span>📤 Compromisos</span>
          <h2>{money(pendingCommitments)}</h2>
        </div>

        <div className="stat-card">
          <span>🏦 Caja Disponible</span>
          <h2>{money(projectedCash)}</h2>
        </div>

        <div className="stat-card">
          <span>⚠️ Dinero comprometido</span>
          <h2>
            {committedPercentage.toFixed(0)}%
          </h2>
        </div>
      </div>

      {canViewTreasuryTotals(profile) && (
        <div className="treasury-summary finance-hidden">
          <div className="stat-card">
            <span>Ingresos de caja</span>
            <h2>{money(cashIncome)}</h2>
          </div>

          <div className="stat-card">
            <span>Egresos de caja</span>
            <h2>{money(cashExpense)}</h2>
          </div>

          <div className="stat-card">
            <span>Saldo caja</span>
            <h2>{money(cashBalance)}</h2>
          </div>

          <div className="stat-card">
            <span>Ventas reales</span>
            <h2>{money(operationalIncome)}</h2>
          </div>

          <div className="stat-card">
            <span>Resultado operacional</span>
            <h2>{money(operationalResult)}</h2>
          </div>

          <div className="stat-card">
            <span>Préstamos abiertos</span>
            <h2>{money(openLoanBalance)}</h2>
          </div>
        </div>
      )}

        </>
      )}

      {view === "commitments" && (
        <section className="treasury-table finance-commitments-panel">
          <div className="dashboard-header">
            <div>
              <h2>Compromisos</h2>
              <p>Lectura simple de compromisos financieros. No afecta caja real hasta pagarse.</p>
            </div>
          </div>

          <div className="treasury-summary finance-summary-grid">
            <div className="stat-card">
              <span>Total pendiente</span>
              <h2>{money(pendingCommitments)}</h2>
            </div>

            <div className="stat-card">
              <span>PrÃ³ximos compromisos</span>
              <h2>{upcomingCommitments.length}</h2>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Vencimiento</th>
                <th>Tipo</th>
                <th>Empresa</th>
                <th>Detalle</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {upcomingCommitments.length === 0 && (
                <tr>
                  <td colSpan="6">Sin compromisos pendientes cargados.</td>
                </tr>
              )}

              {upcomingCommitments.map((commitment) => (
                <tr key={commitment.id}>
                  <td>{commitment.due_date || commitment.date || "-"}</td>
                  <td>{commitment.type || commitment.category || "-"}</td>
                  <td>{commitment.company_name || "-"}</td>
                  <td>{commitment.description || commitment.notes || "-"}</td>
                  <td>{money(commitment.amount)}</td>
                  <td>{commitment.status || "pendiente"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {view === "commissions" && canViewCommissionReports(profile) && (
        <>
          <div className="dashboard-filters">
            <input
              type="date"
              value={commissionFilters.from_date}
              onChange={(e) => updateCommissionFilter("from_date", e.target.value)}
            />

            <input
              type="date"
              value={commissionFilters.to_date}
              onChange={(e) => updateCommissionFilter("to_date", e.target.value)}
            />

            <select
              value={commissionFilters.status}
              onChange={(e) => updateCommissionFilter("status", e.target.value)}
            >
              {commissionStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={commissionFilters.advisor_id}
              onChange={(e) => updateCommissionFilter("advisor_id", e.target.value)}
            >
              <option value="all">Todos los asesores</option>
              {commissionAdvisorOptions.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </select>

            {profile?.role === "gerencia" && (
              <select
                value={commissionFilters.region}
                onChange={(e) => updateCommissionFilter("region", e.target.value)}
              >
                {commissionRegions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            className="treasury-summary"
            style={{ marginBottom: "24px" }}
          >
            <div className="stat-card">
              <span>Total comisión generada</span>
              <h2>{money(commissionTotals.generated)}</h2>
            </div>

            <div className="stat-card">
              <span>Total comisión pagada</span>
              <h2>{money(commissionTotals.paid)}</h2>
            </div>

            <div className="stat-card">
              <span>Total comisión pendiente</span>
              <h2>{money(commissionTotals.pending)}</h2>
            </div>

            <div className="stat-card">
              <span>Proyectos asociados</span>
              <h2>{commissionTotals.projects}</h2>
            </div>
          </div>

          {commissionError && (
            <section className="treasury-table" style={{ marginBottom: "24px" }}>
              <p style={{ color: "#dc2626" }}>{commissionError}</p>
            </section>
          )}

          <section className="treasury-table" style={{ marginBottom: "24px" }}>
            <div className="dashboard-header">
              <div>
                <h2>Comisiones por asesor</h2>
                <p>Lectura financiera desde comisiones generadas. No registra pagos.</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Advisor</th>
                  <th>Region</th>
                  <th>Generada</th>
                  <th>Pagada</th>
                  <th>Pendiente</th>
                  <th>Projects</th>
                  <th>Pagos cliente origen</th>
                </tr>
              </thead>

              <tbody>
                {loadingCommissions && (
                  <tr>
                    <td colSpan="7">Cargando comisiones...</td>
                  </tr>
                )}

                {!loadingCommissions && commissionSummary.length === 0 && (
                  <tr>
                    <td colSpan="7">Sin comisiones generadas para los filtros seleccionados.</td>
                  </tr>
                )}

                {!loadingCommissions &&
                  commissionSummary.map((advisor) => (
                    <tr key={advisor.advisor_id || advisor.advisor_name}>
                      <td>{advisor.advisor_name || "Sin asesor"}</td>
                      <td>{advisor.advisor_region || "-"}</td>
                      <td>{money(advisor.total_generated)}</td>
                      <td>{money(advisor.total_paid)}</td>
                      <td>{money(advisor.total_pending)}</td>
                      <td>{advisor.project_count}</td>
                      <td>{advisor.payment_count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>

          <section className="treasury-table">
            <div className="dashboard-header">
              <div>
                <h2>Detalle de comisiones</h2>
                <p>Detalle read-only de comisiones generadas por pagos de cliente.</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Customer</th>
                  <th>Advisor</th>
                  <th>Pago cliente origen</th>
                  <th>Tipo/tasa comisión</th>
                  <th>Comisión generada</th>
                  <th>Pagado comisión</th>
                  <th>Saldo comisión</th>
                  <th>Estado comisión</th>
                  {canPayProjectCommissions(profile) && (
                    <th>Accion</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loadingCommissions && (
                  <tr>
                    <td colSpan={canPayProjectCommissions(profile) ? 11 : 10}>
                      Cargando detalle...
                    </td>
                  </tr>
                )}

                {!loadingCommissions && commissionDetail.length === 0 && (
                  <tr>
                    <td colSpan={canPayProjectCommissions(profile) ? 11 : 10}>
                      Sin detalle de comisiones para los filtros seleccionados.
                    </td>
                  </tr>
                )}

                {!loadingCommissions &&
                  commissionDetail.map((commission) => (
                    <tr key={commission.project_commission_id}>
                      <td>{formatDate(commission.payment_date || commission.created_at)}</td>
                      <td>{commission.project_title || commission.project_id}</td>
                      <td>{commission.customer_name || "-"}</td>
                      <td>{commission.advisor_name || "Sin asesor"}</td>
                      <td>{money(commission.payment_amount)}</td>
                      <td>
                        {commission.commission_type || "-"}
                        {commission.commission_rate
                          ? ` / ${Number(commission.commission_rate)}%`
                          : ""}
                      </td>
                      <td>{money(commission.commission_amount)}</td>
                      <td>{money(commission.paid_amount_cached)}</td>
                      <td>{money(commission.balance_cached)}</td>
                      <td>{commission.status || "-"}</td>
                      {canPayProjectCommissions(profile) && (
                        <td>
                          {canPayCommissionRow(commission) ? (
                            <button
                              className="secondary-btn"
                              type="button"
                              onClick={() => openCommissionPaymentModal(commission)}
                            >
                              Pagar comisión
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
          </section>
        </>
      )}

      {selectedCommissionPayment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 50,
          }}
        >
          <section
            className="treasury-table"
            style={{
              width: "min(680px, 100%)",
              maxHeight: "90vh",
              overflow: "auto",
              background: "#fff",
            }}
          >
            <div className="dashboard-header">
              <div>
                <h2>Pagar comisión generada</h2>
                <p>Pago controlado desde comisiones generadas.</p>
              </div>

              <button
                className="secondary-btn"
                type="button"
                onClick={closeCommissionPaymentModal}
                disabled={payingCommission}
              >
                Cerrar
              </button>
            </div>

            <div
              className="treasury-summary"
              style={{ marginBottom: "24px" }}
            >
              <div className="stat-card">
                <span>Asesor</span>
                <h2>{selectedCommissionPayment.advisor_name || "Sin asesor"}</h2>
              </div>

              <div className="stat-card">
                <span>Proyecto</span>
                <h2>
                  {selectedCommissionPayment.project_title ||
                    selectedCommissionPayment.project_id}
                </h2>
              </div>

              <div className="stat-card">
                <span>Cliente</span>
                <h2>{selectedCommissionPayment.customer_name || "-"}</h2>
              </div>
            </div>

            <div
              className="treasury-summary"
              style={{ marginBottom: "24px" }}
            >
              <div className="stat-card">
                <span>Comision generada</span>
                <h2>{money(selectedCommissionPayment.commission_amount)}</h2>
              </div>

              <div className="stat-card">
                <span>Pagado</span>
                <h2>{money(selectedCommissionPayment.paid_amount_cached)}</h2>
              </div>

              <div className="stat-card">
                <span>Pendiente</span>
                <h2>{money(selectedCommissionPayment.balance_cached)}</h2>
              </div>
            </div>

            {commissionPaymentError && (
              <p style={{ color: "#dc2626", marginBottom: "16px" }}>
                {commissionPaymentError}
              </p>
            )}

            <form className="treasury-form" onSubmit={submitCommissionPayment}>
              <label>
                Monto
                <input
                  type="number"
                  min="1"
                  max={Number(selectedCommissionPayment.balance_cached || 0)}
                  step="1"
                  value={commissionPaymentForm.amount}
                  onChange={(e) =>
                    updateCommissionPaymentField("amount", e.target.value)
                  }
                  disabled={payingCommission}
                  required
                />
              </label>

              <label>
                Fecha de pago
                <input
                  type="date"
                  value={commissionPaymentForm.payment_date}
                  onChange={(e) =>
                    updateCommissionPaymentField("payment_date", e.target.value)
                  }
                  disabled={payingCommission}
                  required
                />
              </label>

              <label>
                Empresa
                <select
                  value={commissionPaymentForm.company_name}
                  onChange={(e) =>
                    updateCommissionPaymentField("company_name", e.target.value)
                  }
                  disabled={payingCommission}
                  required
                >
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Banco
                <select
                  value={commissionPaymentForm.bank}
                  onChange={(e) =>
                    updateCommissionPaymentField("bank", e.target.value)
                  }
                  disabled={payingCommission}
                  required
                >
                  {banks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Metodo de pago
                <select
                  value={commissionPaymentForm.payment_method}
                  onChange={(e) =>
                    updateCommissionPaymentField(
                      "payment_method",
                      e.target.value
                    )
                  }
                  disabled={payingCommission}
                >
                  {commissionPaymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Notas
                <textarea
                  value={commissionPaymentForm.notes}
                  onChange={(e) =>
                    updateCommissionPaymentField("notes", e.target.value)
                  }
                  disabled={payingCommission}
                  rows="3"
                />
              </label>

              <button
                className="primary-btn"
                type="submit"
                disabled={payingCommission}
              >
                {payingCommission ? "Pagando..." : "Confirmar pago"}
              </button>
            </form>
          </section>
        </div>
      )}

      {view === "cartola" && (
        <section className="treasury-table finance-ledger">
          <div className="dashboard-header">
            <div>
              <h2>Cartola inteligente</h2>
              <p>
                Movimientos reales comparables por empresa, banco, origen y estado.
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Empresa</th>
                <th>Banco</th>
                <th>Categoría</th>
                <th>Cargo</th>
                <th>Abono</th>
                <th>Estado</th>
                <th>Origen</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.map((m) => (
                <tr key={m.id}>
                  <td>{m.date}</td>
                  <td>{m.description}</td>
                  <td>{m.company_name || "-"}</td>
                  <td>{m.bank}</td>
                  <td>{m.category || "-"}</td>

                  <td
                    style={{
                      color: m.type === "egreso" ? "#dc2626" : undefined,
                      fontWeight: m.type === "egreso" ? 800 : 400,
                    }}
                  >
                    {m.type === "egreso"
                      ? money(m.amount)
                      : ""}
                  </td>

                  <td
                    style={{
                      color: m.type === "ingreso" ? "#16a34a" : undefined,
                      fontWeight: m.type === "ingreso" ? 800 : 400,
                    }}
                  >
                    {m.type === "ingreso"
                      ? money(m.amount)
                      : ""}
                  </td>

                  <td>{m.reconciliation_status || "pendiente"}</td>
                  <td>{m.source_module || "manual"}</td>

                  <td>
                    <div className="finance-ledger-actions">
                    {m.reconciliation_status !== "conciliado" && (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => markAsReconciled(m)}
                      >
                        Conciliar
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setEditingMovement(m)
                        setForm({
                          ...m,
                          amount: Number(m.amount || 0),
                        })
                      }}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => voidMovement(m)}
                    >
                      Anular
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="treasury-summary"
            style={{ marginTop: "24px" }}
          >
            <div className="stat-card">
              <span>Ingresos sin conciliar</span>
              <h2>{unreconciledIncome.length}</h2>
            </div>

            <div className="stat-card">
              <span>Egresos sin conciliar</span>
              <h2>{unreconciledExpense.length}</h2>
            </div>

            <div className="stat-card">
              <span>Total ingresos</span>
              <h2>
                {money(
                  monthIncomeMovements.reduce(
                    (acc, m) => acc + Number(m.amount || 0),
                    0
                  )
                )}
              </h2>
            </div>

            <div className="stat-card">
              <span>Total egresos</span>
              <h2>
                {money(
                  monthExpenseMovements.reduce(
                    (acc, m) => acc + Number(m.amount || 0),
                    0
                  )
                )}
              </h2>
            </div>
          </div>
        </section>
      )}

      {view === "cartola" && (
        <>
          <form className="treasury-form" onSubmit={saveMovement}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              required
            />

            <select
              value={form.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
            >
              {companies.map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>

            <select
              value={form.bank}
              onChange={(e) => updateField("bank", e.target.value)}
            >
              {banks.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>

            <input
              placeholder="Glosa / descripción"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              required
            />

            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>

            <input
              type="number"
              placeholder="Monto"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              required
            />

            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <input
              placeholder="Subcategoría"
              value={form.subcategory}
              onChange={(e) => updateField("subcategory", e.target.value)}
            />

            <select
              value={form.branch}
              onChange={(e) => updateField("branch", e.target.value)}
            >
              <option>Viña del Mar</option>
              <option>Iquique</option>
              <option>General</option>
            </select>

            <input
              placeholder="Nombre / proveedor"
              value={form.person_name}
              onChange={(e) => updateField("person_name", e.target.value)}
            />

            <input
              placeholder="Comentario"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />

            <button className="primary-btn">
              {editingMovement
                ? "Actualizar movimiento"
                : "Guardar movimiento"}
            </button>
          </form>

          <div className="treasury-table finance-hidden">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empresa</th>
                  <th>Banco</th>
                  <th>Glosa</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Categoría</th>
                  <th>Conciliación</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredMovements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.date}</td>
                    <td>{m.company_name || "-"}</td>
                    <td>{m.bank}</td>
                    <td>{m.description}</td>
                    <td>{m.type}</td>
                    <td>{money(m.amount)}</td>
                    <td>{m.category}</td>
                    <td>{m.reconciliation_status || "pendiente"}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => {
                            setEditingMovement(m)
                            setForm({
                              ...m,
                              amount: Number(m.amount || 0),
                            })
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => voidMovement(m)}
                        >
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "tools" && (
        <section className="finance-tool-panel">
          <div className="finance-tool-tabs">
            {financeToolTabs.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={activeTool === tool.id ? "primary-btn" : "secondary-btn"}
                onClick={() => setActiveTool(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {view === "tools" && activeTool === "bankTransfer" && (
        <>
          <form className="treasury-form" onSubmit={createBankTransfer}>
            <input
              type="date"
              value={transferForm.date}
              onChange={(e) => updateTransferField("date", e.target.value)}
              required
            />

            <select
              value={transferForm.company_name}
              onChange={(e) =>
                updateTransferField("company_name", e.target.value)
              }
            >
              {companies.map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>

            <select
              value={transferForm.from_bank}
              onChange={(e) => updateTransferField("from_bank", e.target.value)}
            >
              {banks.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>

            <select
              value={transferForm.to_bank}
              onChange={(e) => updateTransferField("to_bank", e.target.value)}
            >
              {banks.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Monto traspaso"
              value={transferForm.amount}
              onChange={(e) => updateTransferField("amount", e.target.value)}
              required
            />

            <input
              placeholder="Comentario"
              value={transferForm.notes}
              onChange={(e) => updateTransferField("notes", e.target.value)}
            />

            <button className="primary-btn">Crear traspaso</button>
          </form>

          <div className="treasury-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Empresa</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Monto</th>
                  <th>Comentario</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredMovements
                  .filter(
                    (movement) =>
                      movement.source_module === "bank_transfer" &&
                      movement.type === "egreso"
                  )
                  .map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.date}</td>
                      <td>{movement.company_name}</td>
                      <td>{movement.bank}</td>
                      <td>{movement.description?.replace("Traspaso a ", "")}</td>
                      <td>{money(movement.amount)}</td>
                      <td>{movement.notes || "-"}</td>

                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => voidTransfer(movement)}
                        >
                          Anular
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "tools" && activeTool === "companyTransfer" && (
        <>
          <form className="treasury-form" onSubmit={createCompanyTransfer}>
            <input
              type="date"
              value={companyTransferForm.date}
              onChange={(e) =>
                updateCompanyTransferField("date", e.target.value)
              }
              required
            />

            <select
              value={companyTransferForm.from_company}
              onChange={(e) =>
                updateCompanyTransferField("from_company", e.target.value)
              }
            >
              {companies.map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>

            <select
              value={companyTransferForm.from_bank}
              onChange={(e) =>
                updateCompanyTransferField("from_bank", e.target.value)
              }
            >
              {banks.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>

            <select
              value={companyTransferForm.to_company}
              onChange={(e) =>
                updateCompanyTransferField("to_company", e.target.value)
              }
            >
              {companies.map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>

            <select
              value={companyTransferForm.to_bank}
              onChange={(e) =>
                updateCompanyTransferField("to_bank", e.target.value)
              }
            >
              {banks.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Monto transferencia"
              value={companyTransferForm.amount}
              onChange={(e) =>
                updateCompanyTransferField("amount", e.target.value)
              }
              required
            />

            <input
              placeholder="Motivo / comentario"
              value={companyTransferForm.notes}
              onChange={(e) =>
                updateCompanyTransferField("notes", e.target.value)
              }
            />

            <button className="primary-btn">
              Crear transferencia entre empresas
            </button>
          </form>
        </>
      )}

      {view === "tools" && activeTool === "intercompany" && (
        <>
          <form className="treasury-form" onSubmit={createIntercompanyPayment}>
            <select
              value={intercompanyForm.payer_company}
              onChange={(e) =>
                updateIntercompanyField("payer_company", e.target.value)
              }
            >
              {companies.map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>

            <select
              value={intercompanyForm.payer_bank}
              onChange={(e) =>
                updateIntercompanyField("payer_bank", e.target.value)
              }
            >
              {banks.map((bank) => (
                <option key={bank}>{bank}</option>
              ))}
            </select>

            <select
              value={intercompanyForm.beneficiary_company}
              onChange={(e) =>
                updateIntercompanyField("beneficiary_company", e.target.value)
              }
            >
              {companies.map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Monto pagado"
              value={intercompanyForm.amount}
              onChange={(e) =>
                updateIntercompanyField("amount", e.target.value)
              }
              required
            />

            <input
              placeholder="Motivo / proveedor / factura"
              value={intercompanyForm.reason}
              onChange={(e) =>
                updateIntercompanyField("reason", e.target.value)
              }
            />

            <input
              placeholder="Notas"
              value={intercompanyForm.notes}
              onChange={(e) =>
                updateIntercompanyField("notes", e.target.value)
              }
            />

            <button className="primary-btn">
              Registrar pago por cuenta
            </button>
          </form>

          <div className="treasury-table">
            <table>
              <thead>
                <tr>
                  <th>Empresa que pagó</th>
                  <th>Banco</th>
                  <th>Empresa beneficiada</th>
                  <th>Monto</th>
                  <th>Devuelto</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                </tr>
              </thead>

              <tbody>
                {intercompanyPayments.map((payment) => {
                  const pending =
                    Number(payment.amount || 0) -
                    Number(payment.returned_amount || 0)

                  return (
                    <tr key={payment.id}>
                      <td>{payment.payer_company}</td>
                      <td>{payment.payer_bank}</td>
                      <td>{payment.beneficiary_company}</td>
                      <td>{money(payment.amount)}</td>
                      <td>{money(payment.returned_amount)}</td>
                      <td>{money(pending)}</td>
                      <td>{payment.status}</td>
                      <td>{payment.reason || "-"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "tools" &&
        activeTool === "loans" &&
        canViewInternalLoans(profile) && (
          <>
            <form className="treasury-form" onSubmit={createInternalLoan}>
              <select
                value={loanForm.from_company}
                onChange={(e) => updateLoanField("from_company", e.target.value)}
              >
                {companies.map((company) => (
                  <option key={company}>{company}</option>
                ))}
              </select>

              <select
                value={loanForm.from_bank}
                onChange={(e) => updateLoanField("from_bank", e.target.value)}
              >
                {banks.map((bank) => (
                  <option key={bank}>{bank}</option>
                ))}
              </select>

              <select
                value={loanForm.to_company}
                onChange={(e) => updateLoanField("to_company", e.target.value)}
              >
                {companies.map((company) => (
                  <option key={company}>{company}</option>
                ))}
              </select>

              <select
                value={loanForm.to_bank}
                onChange={(e) => updateLoanField("to_bank", e.target.value)}
              >
                {banks.map((bank) => (
                  <option key={bank}>{bank}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Monto préstamo"
                value={loanForm.amount}
                onChange={(e) => updateLoanField("amount", e.target.value)}
                required
              />

              <input
                placeholder="Motivo"
                value={loanForm.reason}
                onChange={(e) => updateLoanField("reason", e.target.value)}
              />

              <input
                placeholder="Notas"
                value={loanForm.notes}
                onChange={(e) => updateLoanField("notes", e.target.value)}
              />

              <button className="primary-btn">Crear préstamo</button>
            </form>

            <div className="treasury-table">
              <table>
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Monto</th>
                    <th>Devuelto</th>
                    <th>Pendiente</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {loans.map((loan) => {
                    const pending =
                      Number(loan.amount || 0) -
                      Number(loan.returned_amount || 0)

                    return (
                      <tr key={loan.id}>
                        <td>
                          {loan.from_company}
                          <br />
                          <small>{loan.from_bank}</small>
                        </td>

                        <td>
                          {loan.to_company}
                          <br />
                          <small>{loan.to_bank}</small>
                        </td>

                        <td>{money(loan.amount)}</td>
                        <td>{money(loan.returned_amount)}</td>
                        <td>{money(pending)}</td>
                        <td>{loan.status}</td>

                        <td>
                          {loan.status !== "cerrado" && (
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => registerLoanReturn(loan)}
                            >
                              Registrar devolución
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
    </section>
  )
}
