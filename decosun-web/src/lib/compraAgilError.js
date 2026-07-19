const STAGE_LABELS = {
  list: "listado",
  detail: "detalle",
  database: "base de datos",
  authorization: "autorización",
  config: "configuración",
  runtime: "ejecución",
}

export function formatCompraAgilScanError(details) {
  if (!details || typeof details !== "object" || !details.message) {
    return "No se pudo ejecutar el escaneo Compra Ágil."
  }

  const lines = ["No se pudo completar el escaneo.", String(details.message)]
  if (details.stage) lines.push(`Etapa: ${STAGE_LABELS[details.stage] || details.stage}.`)
  if (details.search_term) lines.push(`Término: ${details.search_term}.`)
  if (details.page_number) lines.push(`Página: ${details.page_number}.`)
  if (details.external_id) lines.push(`Código: ${details.external_id}.`)
  if (details.request_number) lines.push(`Request: ${details.request_number}.`)
  return lines.join("\n")
}

export async function structuredFunctionError(data, invokeError) {
  if (data && typeof data === "object" && data.error_code) return data
  const response = invokeError?.context
  if (!response || typeof response.clone !== "function") return null
  try {
    const body = await response.clone().json()
    return body && typeof body === "object" && body.error_code ? body : null
  } catch {
    return null
  }
}
