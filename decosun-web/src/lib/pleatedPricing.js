import { getPleatedOption } from "./pleatedSystems.js"
import { pleatedSaleTables } from "./pleatedSaleTables.js"

export const pleatedSizeBands = [1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3]

export function getPleatedPrice(productKey, rawWidth, rawHeight, rawQuantity) {
  const option = getPleatedOption(productKey)
  if (!option) return null

  const width = Number(rawWidth)
  const height = Number(rawHeight)
  const quantity = Number(rawQuantity)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
    return { valid: false }
  }

  const widthIndex = pleatedSizeBands.findIndex(limit => width <= limit)
  const heightIndex = pleatedSizeBands.findIndex(limit => height <= limit)
  if (widthIndex === -1 || heightIndex === -1) {
    return { valid: true, requiresAssessment: true, width, height, quantity }
  }

  const unitPrice = pleatedSaleTables[option.group][heightIndex][widthIndex]
  const subtotal = unitPrice * quantity
  if (!Number.isSafeInteger(subtotal)) return { valid: false }
  return {
    valid: true,
    requiresAssessment: false,
    width,
    height,
    quantity,
    unitPrice,
    subtotal,
    bandWidth: pleatedSizeBands[widthIndex],
    bandHeight: pleatedSizeBands[heightIndex],
  }
}
