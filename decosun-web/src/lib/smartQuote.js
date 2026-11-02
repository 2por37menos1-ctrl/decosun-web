export const needs = ["Controlar el sol", "Oscurecer una habitación", "Tener mayor privacidad", "Mejorar el confort térmico", "Decorar y renovar", "Automatizar cortinas existentes"]
export const rooms = ["Living", "Dormitorio", "Oficina", "Cocina", "Sala de reuniones", "Otro espacio"]

export function recommendations(control, selectedNeeds) {
  if (control === "existing") return [{ key: "motorizacionIndependiente", title: "Motorizar tus cortinas", reason: "Evaluaremos tubo, mecanismo, alimentación y dimensiones antes de confirmar compatibilidad." }]
  const options = [
    { key: "sunscreen", title: "Roller screen", reason: "Regula la luz y los reflejos; la privacidad depende de la iluminación interior y exterior." },
    { key: "blackout", title: "Roller blackout", reason: "Para oscurecer y mejorar la privacidad. El cierre de luz depende de la instalación." },
    { key: "translucido", title: "Roller translúcida", reason: "Difunde la luz para crear ambientes suaves y luminosos." },
    { key: "rollerDuo", title: "Roller DÚO", reason: "Permite alternar franjas para regular luz y privacidad." },
    { key: "rollerDoble", title: "Roller doble", reason: "Combina screen y blackout en una misma ventana." },
  ]
  if (selectedNeeds.includes(needs[1])) options.unshift(options.splice(1, 1)[0])
  if (control === "manual") options.push({ key: "honeycomb", title: "Plisadas Honeycomb", reason: "Estructura celular para explorar confort térmico y diseño. Configuración y valor mediante asesoría." })
  return options
}

export function validMeasurements(rows) {
  return rows.length > 0 && rows.every(row => Number.isFinite(Number(row.ancho)) && Number(row.ancho) > 0 && Number.isFinite(Number(row.alto)) && Number(row.alto) > 0 && Number.isInteger(Number(row.cantidad)) && Number(row.cantidad) > 0)
}

// A retry must reconcile before inserting again. A denied/ambiguous read never
// becomes permission to insert another copy of customer data.
export async function insertQuoteRows(client, table, rows, projectId, retry) {
  if (retry) {
    const check = await client.from(table).select(table === "projects" ? "id" : "project_id").eq(table === "projects" ? "id" : "project_id", projectId)
    if (check.error) return { error: new Error("No se pudo verificar el intento anterior. Reintenta sin cerrar esta página.") }
    if (check.data.length === rows.length) return { error: null }
    if (check.data.length) return { error: new Error("Registro parcial: requiere revisión antes de reintentar.") }
  }
  return client.from(table).insert(rows)
}
