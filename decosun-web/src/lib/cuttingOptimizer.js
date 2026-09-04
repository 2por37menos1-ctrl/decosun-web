export const DEFAULT_ROLL_WIDTH_CM = 300
export const DEFAULT_PROFILE_LENGTH_CM = 580
export const FABRIC_ROLL_LENGTH_METERS = 30
export const PROFILE_PACKAGE_SIZE = 10

export const DEFAULT_CUTTING_SETTINGS = Object.freeze({
  tubeDiscount: 2.5,
  fabricGap: 0.5,
  simpleExtraHeight: 20,
  duoExtraHeight: 0,
  duoFabricDiscount: 3,
  duoValanceDiscount: 1,
  duoTubeDiscount: 2.5,
  duoRoundDiscount: 2.5,
  duoCounterweightDiscount: 2,
})

export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  let normalized = String(value ?? "").trim().replace(/\s/g, "")
  if (!normalized) return 0
  normalized = normalized.replace(/[^\d,.-]/g, "")
  const dots = (normalized.match(/\./g) || []).length
  const commas = (normalized.match(/,/g) || []).length
  if (dots > 1 && commas === 0) normalized = normalized.replace(/\./g, "")
  else if (commas > 1 && dots === 0) normalized = normalized.replace(/,/g, "")
  else if (commas === 1 && dots === 0) normalized = normalized.replace(",", ".")
  else if (commas && dots) return 0
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function cmFromMetersOrCm(value) {
  const number = parseNumber(value)
  return number > 0 && number <= 10 ? number * 100 : number
}

export function normalizeProductType(value) {
  const normalized = String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (normalized.includes("duo")) return "roller_duo"
  if (normalized.includes("simple") || normalized.includes("mini")) return "roller_simple"
  return null
}

export function productLabel(type) {
  return type === "roller_duo" ? "Roller DÚO" : "Roller simple MiniGap"
}

export function splitInputLine(line) {
  if (line.includes("\t")) return line.split("\t").map((value) => value.trim())
  if (line.includes("|")) return line.split("|").map((value) => value.trim())
  return line.split(";").map((value) => value.trim())
}

export function parseRows(text, options = {}) {
  const defaultType = normalizeProductType(options.defaultType) || "roller_simple"
  const defaultFabric = String(options.defaultFabric || "Tela sin definir").trim()
  return String(text || "").replaceAll("\r", "").split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const columns = splitInputLine(line)
    const explicitType = normalizeProductType(columns[1])
    const offset = explicitType ? 2 : 1
    return {
      id: `row-${index + 1}`,
      quantity: Math.trunc(parseNumber(columns[0])),
      type: explicitType || defaultType,
      width: cmFromMetersOrCm(columns[offset]),
      height: cmFromMetersOrCm(columns[offset + 1]),
      opening: columns[offset + 2] || "",
      fabric: columns[offset + 3] || defaultFabric,
      place: columns[offset + 4] || "",
      drop: columns[offset + 5] || "",
      side: columns[offset + 6] || "",
      source: line,
    }
  }).filter((row) => row.quantity > 0 && row.width > 0 && row.height > 0)
}

export function calculateRollerSimple(row, settings = {}) {
  const config = { ...DEFAULT_CUTTING_SETTINGS, ...settings }
  const tube = Math.max(0, row.width - config.tubeDiscount)
  return { ...row, productLabel: productLabel(row.type), fabricWidth: Math.max(0, tube - config.fabricGap), fabricHeight: row.height + config.simpleExtraHeight, tube, bottomBar: tube, valance: 0, round: 0, counterweight: 0, mechanism: "Mecanismo MiniGap" }
}

export function calculateRollerDuo(row, settings = {}) {
  const config = { ...DEFAULT_CUTTING_SETTINGS, ...settings }
  return { ...row, productLabel: productLabel(row.type), fabricWidth: Math.max(0, row.width - config.duoFabricDiscount), fabricHeight: row.height * 2 + config.duoExtraHeight, tube: Math.max(0, row.width - config.duoTubeDiscount), bottomBar: 0, valance: Math.max(0, row.width - config.duoValanceDiscount), round: Math.max(0, row.width - config.duoRoundDiscount), counterweight: Math.max(0, row.width - config.duoCounterweightDiscount), mechanism: "Mecanismo DÚO" }
}

export function calculateRow(row, settings = {}) {
  return row.type === "roller_duo" ? calculateRollerDuo(row, settings) : calculateRollerSimple(row, settings)
}

export function calculateOrder(rows, settings = {}) {
  let sequence = 1
  return rows.flatMap((row) => Array.from({ length: row.quantity }, (_, copyIndex) => calculateRow({ ...row, id: `${row.id}-${copyIndex + 1}`, number: sequence++, sourceQuantity: row.quantity, quantity: 1 }, settings)))
}

export function firstFitDecreasing(values, capacity, getSize = (value) => value) {
  const bins = []
  const rejected = []
  ;[...values].filter((value) => getSize(value) > 0).sort((a, b) => getSize(b) - getSize(a)).forEach((value) => {
    const size = getSize(value)
    if (size > capacity) { rejected.push(value); return }
    const bin = bins.find((candidate) => candidate.used + size <= capacity)
    if (bin) { bin.items.push(value); bin.used += size }
    else bins.push({ items: [value], used: size })
  })
  return { bins: bins.map((bin) => ({ ...bin, remaining: capacity - bin.used })), rejected }
}

export function groupBy(values, getKey) {
  return values.reduce((groups, value) => { const key = getKey(value) || "Sin definir"; if (!groups[key]) groups[key] = []; groups[key].push(value); return groups }, {})
}

export function optimizeFabricByMode(pieces, rollWidth = DEFAULT_ROLL_WIDTH_CM, mode = "same-height") {
  const width = cmFromMetersOrCm(rollWidth)
  if (!width) return { rows: [], rejected: [...pieces], width: 0 }
  const rejected = pieces.filter((piece) => piece.fabricWidth > width).map((piece) => ({ ...piece, optimizationError: "Excede ancho disponible" }))
  const valid = pieces.filter((piece) => piece.fabricWidth > 0 && piece.fabricWidth <= width)
  const byFabric = groupBy(valid, (piece) => piece.fabric)
  const rows = Object.entries(byFabric).flatMap(([fabric, fabricPieces]) => {
    if (["max-width", "width"].includes(mode)) {
      return firstFitDecreasing(fabricPieces, width, (piece) => piece.fabricWidth).bins.map((bin, index) => ({ ...bin, id: `${fabric}-${index + 1}`, fabric, label: "Mixto", height: Math.max(...bin.items.map((piece) => piece.fabricHeight)) }))
    }
    const byRoundedHeight = groupBy(fabricPieces, (piece) => Math.round(piece.fabricHeight))
    return Object.entries(byRoundedHeight).sort(([a], [b]) => Number(b) - Number(a)).flatMap(([height, heightPieces]) => firstFitDecreasing(heightPieces, width, (piece) => piece.fabricWidth).bins.map((bin, index) => ({ ...bin, id: `${fabric}-${height}-${index + 1}`, fabric, label: `Alto ${height} cm`, height: Number(height) })))
  })
  return { rows, rejected, width }
}

export function optimizeProfiles(pieces, profileLength = DEFAULT_PROFILE_LENGTH_CM) {
  const length = cmFromMetersOrCm(profileLength)
  const definitions = [["Tubo Ø38", "tube"], ["Barra inferior", "bottomBar"], ["Cenefa DÚO", "valance"], ["Redondo / tubo interior DÚO", "round"], ["Contrapeso DÚO", "counterweight"]]
  return definitions.map(([name, field]) => {
    const result = firstFitDecreasing(pieces, length, (piece) => piece[field])
    return { name, bars: result.bins, rejected: result.rejected.map((piece) => ({ ...piece, optimizationError: "Excede largo de perfil" })), field, length, packages: Math.ceil(result.bins.length / PROFILE_PACKAGE_SIZE) }
  }).filter((profile) => profile.bars.length || profile.rejected.length)
}

export function rollPurchaseText(meters, rollMeters = FABRIC_ROLL_LENGTH_METERS) {
  const full = Math.floor(meters / rollMeters)
  const remainder = meters - full * rollMeters
  if (meters <= 0) return "0 rollos"
  if (full === 0) return `${remainder.toFixed(2)} ml`
  if (remainder < 0.01) return `${full} rollo${full === 1 ? " exacto" : "s exactos"}`
  return `${full} rollo${full === 1 ? "" : "s"} + ${remainder.toFixed(2)} ml`
}

export function summarizeMaterials(pieces, fabricOptimization = { rows: [], rejected: [] }) {
  const materials = []
  const fabricRows = fabricOptimization.rows || fabricOptimization
  const rejected = fabricOptimization.rejected || []
  const fabrics = groupBy(fabricRows, (row) => row.fabric)
  Object.entries(fabrics).forEach(([fabric, rows]) => {
    const meters = rows.reduce((sum, row) => sum + row.height, 0) / 100
    materials.push({ material: `Tela · ${fabric}`, required: `${meters.toFixed(2)} ml`, purchase: rollPurchaseText(meters), status: "optimizable" })
  })
  Object.entries(groupBy(rejected, (piece) => piece.fabric)).forEach(([fabric, fabricPieces]) => {
    const meters = fabricPieces.reduce((sum, piece) => sum + piece.fabricHeight, 0) / 100
    materials.push({ material: `Tela · ${fabric} (fuera de ancho)`, required: `${meters.toFixed(2)} ml`, purchase: "Requiere otra materia prima", status: "Excede ancho disponible" })
  })
  const mechanisms = groupBy(pieces, (piece) => piece.mechanism)
  Object.entries(mechanisms).forEach(([mechanism, mechanismPieces]) => materials.push({ material: mechanism, required: `${mechanismPieces.length} un`, purchase: "—", status: "calculado" }))
  const totals = [["Tubo Ø38", "tube"], ["Barra inferior", "bottomBar"], ["Cenefa DÚO", "valance"], ["Redondo DÚO", "round"], ["Contrapeso DÚO", "counterweight"]]
  totals.forEach(([material, field]) => { const value = pieces.reduce((sum, piece) => sum + piece[field], 0) / 100; if (value > 0) materials.push({ material, required: `${value.toFixed(2)} ml`, purchase: "Ver optimización", status: "calculado" }) })
  return materials
}
