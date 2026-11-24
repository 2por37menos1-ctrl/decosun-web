import saleTables from "./awningSaleTables.json" with { type: "json" }

export const awningRenewalNetRate = 28000
export const awningOptions = [
  { key: "cambioTelaToldo", name: "Cambio de tela de toldo proyectante", renewal: true },
  { key: "toldoVinciManual", name: "Toldo Vinci manual" },
  { key: "toldoVinciMotorizado", name: "Toldo Vinci motorizado" },
  { key: "toldoMonoblockManual", name: "Toldo Monoblock manual" },
  { key: "toldoMonoblockMotorizado", name: "Toldo Monoblock motorizado" },
]

export function getAwningOption(productKey) {
  return awningOptions.find(option => option.key === productKey)
}

export function getAwningPrice(productKey, rawWidth, rawProjection, rawQuantity) {
  const option = getAwningOption(productKey)
  if (!option) return null
  const width = Number(rawWidth)
  const projection = Number(rawProjection)
  const quantity = Number(rawQuantity)
  if (!Number.isFinite(width) || !Number.isFinite(projection) || width <= 0 || projection <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
    return { valid: false }
  }

  const dimensions = { width, projection, quantity }
  let subtotal
  if (option.renewal) {
    // Round once, after applying area, quantity and IVA.
    subtotal = Math.round(width * projection * quantity * awningRenewalNetRate * 1.19)
  } else {
    // Intermediate sizes require supplier confirmation. Do not invent a band price.
    const configuration = saleTables[productKey].find(([tableWidth, tableProjection]) => Math.abs(width - tableWidth) < 1e-9 && Math.abs(projection - tableProjection) < 1e-9)
    if (!configuration) return { valid: true, requiresAssessment: true, ...dimensions }
    subtotal = Math.round(configuration[2] * quantity)
  }

  if (!Number.isSafeInteger(subtotal) || subtotal <= 0) return { valid: false }
  return { valid: true, requiresAssessment: false, ...dimensions, subtotal }
}
