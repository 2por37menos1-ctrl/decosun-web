export const REQUEST_FILTERS = [
  ["all", "Todas"],
  ["pending", "Pendientes"],
  ["review", "En revisión"],
  ["purchase", "En compra"],
  ["received", "Recibidas"],
  ["closed", "Cerradas"],
]

export function requestStage(request) {
  const status = String(request?.status || "solicitado").toLowerCase()
  if (["anulado", "rechazado", "cerrado"].includes(status)) return "closed"
  if (status === "recibido" || request?.reception_status === "recibido") return "received"
  if (["pagado", "pedido_realizado", "en_compra"].includes(status)) return "purchase"
  if (["aprobado", "revision", "en_revision"].includes(status)) return "review"
  return "pending"
}

export function requestStageLabel(request) {
  return {
    pending: "Pendiente",
    review: "En revisión",
    purchase: "En compra",
    received: "Recibida",
    closed: "Cerrada",
  }[requestStage(request)]
}

export function requestNumber(request) {
  return `SOL-${String(request?.request_number || request?.id?.slice?.(0, 6) || "—").padStart(4, "0")}`
}

export function requestDestination(requestItems = []) {
  return requestItems.find((item) => item.project_id)?.assigned_to || requestItems[0]?.assigned_to || "Destino general"
}

export function formatRequestDate(value) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return "Hoy"
  return date.toLocaleDateString("es-CL")
}
