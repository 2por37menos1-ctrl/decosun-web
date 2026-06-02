import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

import {
  canViewTreasuryTotals,
  canViewInternalLoans,
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
  "Aporte capital",
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

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export default function Treasury() {
  const [view, setView] = useState("movements")
  const [movements, setMovements] = useState([])
  const [loans, setLoans] = useState([])
  const [intercompanyPayments, setIntercompanyPayments] = useState([])
  const [editingMovement, setEditingMovement] = useState(null)

  const [filters, setFilters] = useState({
    company_name: "all",
    bank: "all",
    type: "all",
    month: currentMonth(),
  })

  const [form, setForm] = useState({
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
    date: new Date().toISOString().slice(0, 10),
    company_name: "Decosun Group SpA",
    from_bank: "Mercado Pago",
    to_bank: "BCI",
    amount: "",
    notes: "",
  })

  const { profile } = useProfile()

  useEffect(() => {
    loadMovements()
    loadLoans()
    loadIntercompanyPayments()
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


  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      if (movement.is_void) return false
      const matchesCompany =
        filters.company_name === "all" ||
        movement.company_name === filters.company_name

      const matchesBank =
        filters.bank === "all" || movement.bank === filters.bank

      const matchesType =
        filters.type === "all" || movement.type === filters.type

      const matchesMonth =
        !filters.month || movement.date?.startsWith(filters.month)

      return matchesCompany && matchesBank && matchesType && matchesMonth
    })
  }, [movements, filters])

  const totalIncome = filteredMovements
    .filter((m) => m.type === "ingreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const totalExpense = filteredMovements
    .filter((m) => m.type === "egreso")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0)

  const balance = totalIncome - totalExpense

  const openLoans = loans.filter((loan) => loan.status !== "cerrado")

  const openLoanBalance = openLoans.reduce(
    (acc, loan) =>
      acc +
      (Number(loan.amount || 0) - Number(loan.returned_amount || 0)),
    0
  )

  return (
    <section className="treasury-page">
      <div className="dashboard-header">
        <div>
          <h2>Tesorería</h2>
          <p>Flujo de caja, empresas, bancos y préstamos internos.</p>
        </div>

        <div className="view-actions">
          <button
            className={view === "movements" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("movements")}
          >
            Movimientos
          </button>

          <button
            className={view === "transfers" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("transfers")}
          >
            Traspasos
          </button>

          <button
            className={view === "intercompany" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("intercompany")}
          >
            Pagos por cuenta
          </button>

          {canViewInternalLoans(profile) && (
            <button
              className={view === "loans" ? "primary-btn" : "secondary-btn"}
              onClick={() => setView("loans")}
            >
              Préstamos internos
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-filters">
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

        <input
          type="month"
          value={filters.month}
          onChange={(e) => updateFilter("month", e.target.value)}
        />
      </div>

      {canViewTreasuryTotals(profile) && (
        <div className="treasury-summary">
          <div className="stat-card">
            <span>Ingresos filtrados</span>
            <h2>{money(totalIncome)}</h2>
          </div>

          <div className="stat-card">
            <span>Egresos filtrados</span>
            <h2>{money(totalExpense)}</h2>
          </div>

          <div className="stat-card">
            <span>Saldo filtrado</span>
            <h2>{money(balance)}</h2>
          </div>

          <div className="stat-card">
            <span>Préstamos abiertos</span>
            <h2>{money(openLoanBalance)}</h2>
          </div>
        </div>
      )}

      {view === "movements" && (
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

          <div className="treasury-table">
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

      {view === "transfers" && (
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

      {view === "intercompany" && (
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

      {view === "loans" &&
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