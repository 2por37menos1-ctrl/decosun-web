import { supabase } from "./supabase";

function createIdempotencyKey(projectId) {
  const randomId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `project_payment:${projectId}:${randomId}`;
}

function normalizeDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

export async function registerProjectPayment({
  projectId,
  amount,
  paymentDate,
  companyName,
  bank,
  paymentMethod,
  paymentMilestone = "manual",
  notes,
}) {
  if (!projectId) {
    throw new Error("No se puede registrar el pago: falta el proyecto.");
  }

  const paymentAmount = Number(amount || 0);

  if (paymentAmount <= 0) {
    throw new Error("No se puede registrar el pago: el monto debe ser mayor a cero.");
  }

  const idempotencyKey = createIdempotencyKey(projectId);

  const { data, error } = await supabase.rpc("register_project_payment", {
    p_project_id: projectId,
    p_amount: paymentAmount,
    p_payment_date: normalizeDate(paymentDate),
    p_company_name: companyName || null,
    p_bank: bank || null,
    p_payment_method: paymentMethod || null,
    p_payment_milestone: paymentMilestone || "manual",
    p_source: "react_project_payments_service",
    p_notes: notes || null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error("[registerProjectPayment]", error);
    throw new Error(
      error.message || "No se pudo registrar el pago del proyecto."
    );
  }

  return data;
}
