import { useEffect, useState } from "react"
import {
  commissionPaymentBanks,
  commissionPaymentCompanies,
  commissionPaymentMethods,
  createCommissionPaymentIdempotencyKey,
  getDefaultCommissionPaymentForm,
  payProjectCommission,
  validateCommissionPaymentForm,
} from "../lib/projectCommissionPayments"

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("es-CL")
}

export default function CommissionPaymentModal({
  commission,
  open,
  title,
  subtitle,
  confirmLabel,
  onClose,
  onPaid,
}) {
  const [form, setForm] = useState(getDefaultCommissionPaymentForm(null))
  const [idempotencyKey, setIdempotencyKey] = useState("")
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !commission) return

    setError("")
    setPaying(false)
    setForm(getDefaultCommissionPaymentForm(commission))
    setIdempotencyKey(
      createCommissionPaymentIdempotencyKey(commission.project_commission_id)
    )
  }, [open, commission])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function submitPayment() {
    if (!commission || paying) return

    const validation = validateCommissionPaymentForm({ commission, form })

    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setPaying(true)
    setError("")

    try {
      const result = await payProjectCommission({
        projectCommissionId: commission.project_commission_id,
        amount: validation.payload.amount,
        paymentDate: validation.payload.payment_date,
        companyName: validation.payload.company_name,
        bank: validation.payload.bank,
        paymentMethod: validation.payload.payment_method,
        notes: validation.payload.notes,
        idempotencyKey,
      })

      if (onPaid) {
        await onPaid(result)
      }

      onClose?.()
    } catch (submitError) {
      console.error(submitError)
      setError(submitError.message || "No se pudo pagar la comision.")
    } finally {
      setPaying(false)
    }
  }

  if (!open || !commission) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 60,
      }}
    >
      <section
        className="treasury-table"
        style={{
          width: "min(720px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
        }}
      >
        <div className="dashboard-header">
          <div>
            <h2>{title || "Pagar comisión generada"}</h2>
            <p>{subtitle || "Pago controlado desde comisiones generadas."}</p>
          </div>

          <button
            className="secondary-btn"
            type="button"
            onClick={onClose}
            disabled={paying}
          >
            Cerrar
          </button>
        </div>

        <div className="treasury-summary" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <span>Beneficiario</span>
            <h2>{commission.advisor_name || "Sin asesor"}</h2>
          </div>

          <div className="stat-card">
            <span>Proyecto</span>
            <h2>{commission.project_title || commission.project_id}</h2>
          </div>

          <div className="stat-card">
            <span>Concepto</span>
            <h2>
              {commission.commission_type || "Comisión"}
              {commission.commission_rate
                ? ` / ${Number(commission.commission_rate)}%`
                : ""}
            </h2>
          </div>
        </div>

        <div className="treasury-summary" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <span>Comisión generada</span>
            <h2>{money(commission.commission_amount)}</h2>
          </div>

          <div className="stat-card">
            <span>Pagado</span>
            <h2>{money(commission.paid_amount_cached)}</h2>
          </div>

          <div className="stat-card">
            <span>Saldo pendiente</span>
            <h2>{money(commission.balance_cached)}</h2>
          </div>
        </div>

        <div className="treasury-summary" style={{ marginBottom: "24px" }}>
          <div className="stat-card">
            <span>Abono origen</span>
            <h2>
              {formatDate(commission.payment_date)} · {money(commission.payment_amount)}
            </h2>
          </div>

          <div className="stat-card">
            <span>Empresa/Banco origen</span>
            <h2>
              {commission.payment_company_name || "-"}
              {" / "}
              {commission.payment_bank || "-"}
            </h2>
          </div>

          <div className="stat-card">
            <span>Estado comisión</span>
            <h2>{commission.status || "-"}</h2>
          </div>
        </div>

        {error && (
          <p style={{ color: "#dc2626", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        <div className="treasury-form">
          <label>
            Monto
            <input
              type="number"
              min="1"
              max={Number(commission.balance_cached || 0)}
              step="1"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              disabled={paying}
              required
            />
          </label>

          <label>
            Fecha de pago
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) => updateField("payment_date", e.target.value)}
              disabled={paying}
              required
            />
          </label>

          <label>
            Empresa pagadora
            <select
              value={form.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
              disabled={paying}
              required
            >
              {commissionPaymentCompanies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </label>

          <label>
            Banco / cuenta
            <select
              value={form.bank}
              onChange={(e) => updateField("bank", e.target.value)}
              disabled={paying}
              required
            >
              {commissionPaymentBanks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>

          <label>
            Metodo de pago
            <select
              value={form.payment_method}
              onChange={(e) => updateField("payment_method", e.target.value)}
              disabled={paying}
            >
              {commissionPaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label>
            Clave idempotente
            <input value={idempotencyKey} readOnly disabled={paying} />
          </label>

          <label className="full-field">
            Referencia / observación
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              disabled={paying}
              rows="3"
            />
          </label>

          <button
            className="primary-btn"
            type="button"
            disabled={paying}
            onClick={submitPayment}
          >
            {paying ? "Pagando..." : confirmLabel || "Confirmar pago"}
          </button>
        </div>
      </section>
    </div>
  )
}
