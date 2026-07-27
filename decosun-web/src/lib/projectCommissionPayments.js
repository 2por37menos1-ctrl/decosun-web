import { supabase } from "./supabase"

export const commissionPaymentMethods = [
  "Transferencia",
  "Efectivo",
  "Mercado Pago",
  "Otro",
]

export const commissionPaymentCompanies = ["Decosun Spa", "Decosun Group SpA"]

export const commissionPaymentBanks = [
  "BCI",
  "Scotiabank",
  "Santander",
  "BancoEstado",
  "Mercado Pago",
  "Efectivo",
  "Otro",
]

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}

export function createCommissionPaymentIdempotencyKey(projectCommissionId) {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `commission-payment:${projectCommissionId}:${randomPart}`
}

export function getDefaultCommissionPaymentForm(commission) {
  const defaultCompany =
    commission?.payment_company_name ||
    commissionPaymentCompanies[1] ||
    commissionPaymentCompanies[0] ||
    ""

  const defaultBank =
    commission?.payment_bank ||
    commissionPaymentBanks[0] ||
    ""

  return {
    amount: String(Number(commission?.balance_cached || 0)),
    payment_date: currentDate(),
    company_name: defaultCompany,
    bank: defaultBank,
    payment_method: commissionPaymentMethods[0] || "",
    notes: "",
  }
}

export function validateCommissionPaymentForm({ commission, form }) {
  const amount = Number(form.amount || 0)
  const pending = Number(commission?.balance_cached || 0)

  if (amount <= 0) {
    return {
      valid: false,
      message: "El monto debe ser mayor que cero.",
    }
  }

  if (amount > pending) {
    return {
      valid: false,
      message: "El monto no puede superar el saldo pendiente.",
    }
  }

  if (!form.company_name?.trim()) {
    return {
      valid: false,
      message: "Selecciona una empresa.",
    }
  }

  if (!form.bank?.trim()) {
    return {
      valid: false,
      message: "Selecciona un banco.",
    }
  }

  return {
    valid: true,
    payload: {
      amount,
      payment_date: form.payment_date || currentDate(),
      company_name: form.company_name.trim(),
      bank: form.bank.trim(),
      payment_method: form.payment_method?.trim() || null,
      notes: form.notes?.trim() || null,
    },
  }
}

export async function payProjectCommission({
  projectCommissionId,
  amount,
  paymentDate,
  companyName,
  bank,
  paymentMethod,
  notes,
  idempotencyKey,
}) {
  if (!projectCommissionId) {
    throw new Error("Falta la comisión a pagar.")
  }

  if (!idempotencyKey?.trim()) {
    throw new Error("La clave de idempotencia es obligatoria.")
  }

  const { data, error } = await supabase.rpc("pay_project_commission", {
    p_project_commission_id: projectCommissionId,
    p_amount: amount,
    p_payment_date: paymentDate,
    p_company_name: companyName,
    p_bank: bank,
    p_payment_method: paymentMethod || null,
    p_notes: notes || null,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    throw new Error(error.message || "No se pudo pagar la comision.")
  }

  return Array.isArray(data) ? data[0] : data
}
