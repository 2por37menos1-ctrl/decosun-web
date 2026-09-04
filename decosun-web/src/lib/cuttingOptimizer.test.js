import test from "node:test"
import assert from "node:assert/strict"
import {
  DEFAULT_PROFILE_LENGTH_CM,
  DEFAULT_ROLL_WIDTH_CM,
  calculateOrder,
  cmFromMetersOrCm,
  optimizeFabricByMode,
  optimizeProfiles,
  parseRows,
} from "./cuttingOptimizer.js"

test("normaliza 1.290 como 129 cm", () => assert.equal(cmFromMetersOrCm("1.290"), 129))
test("normaliza 1,290 como 129 cm", () => assert.equal(cmFromMetersOrCm("1,290"), 129))
test("normaliza 1.29 como 129 cm", () => assert.equal(cmFromMetersOrCm("1.29"), 129))
test("mantiene 129 como 129 cm", () => assert.equal(cmFromMetersOrCm("129"), 129))
test("mantiene 129,0 como 129 cm", () => assert.equal(cmFromMetersOrCm("129,0"), 129))

test("Roller DÚO de 170 cm corta 340 cm de alto", () => {
  const [piece] = calculateOrder(parseRows("1 | DÚO | 129 | 170"))
  assert.equal(piece.fabricHeight, 340)
})

test("usa 300 cm como ancho de rollo predeterminado", () => {
  assert.equal(DEFAULT_ROLL_WIDTH_CM, 300)
  assert.equal(optimizeFabricByMode([], undefined).width, 300)
})

test("usa 580 cm como largo de perfil predeterminado", () => {
  assert.equal(DEFAULT_PROFILE_LENGTH_CM, 580)
  const profiles = optimizeProfiles([{ id: "p", tube: 100, bottomBar: 0, valance: 0, round: 0, counterweight: 0 }])
  assert.equal(profiles[0].length, 580)
})

test("fila sin tipo utiliza el tipo predeterminado", () => {
  const [row] = parseRows("1 | 129 | 170 | V1 | Screen", { defaultType: "roller_duo" })
  assert.equal(row.type, "roller_duo")
  assert.equal(row.width, 129)
})

test("agrupa alturas redondeadas y procesa grupos de mayor a menor", () => {
  const pieces = [
    { id: "a", fabric: "Screen", fabricWidth: 100, fabricHeight: 340.4 },
    { id: "b", fabric: "Screen", fabricWidth: 100, fabricHeight: 340.49 },
    { id: "c", fabric: "Screen", fabricWidth: 100, fabricHeight: 342.1 },
  ]
  const result = optimizeFabricByMode(pieces, 300, "same-height")
  assert.deepEqual(result.rows.map((row) => row.height), [342, 340])
  assert.equal(result.rows[1].items.length, 2)
})

test("distingue Mecanismo MiniGap", () => {
  const [piece] = calculateOrder(parseRows("1 | simple | 129 | 170"))
  assert.equal(piece.mechanism, "Mecanismo MiniGap")
})

test("distingue Mecanismo DÚO", () => {
  const [piece] = calculateOrder(parseRows("1 | duo | 129 | 170"))
  assert.equal(piece.mechanism, "Mecanismo DÚO")
})

test("rechaza tela superior a 300 cm sin crear una pasada ficticia", () => {
  const result = optimizeFabricByMode([{ id: "wide", fabric: "Screen", fabricWidth: 301, fabricHeight: 200 }])
  assert.equal(result.rows.length, 0)
  assert.equal(result.rejected.length, 1)
  assert.equal(result.rejected[0].optimizationError, "Excede ancho disponible")
})

test("rechaza corte superior a 580 cm sin crear una barra ficticia", () => {
  const profiles = optimizeProfiles([{ id: "long", tube: 581, bottomBar: 0, valance: 0, round: 0, counterweight: 0 }])
  assert.equal(profiles[0].bars.length, 0)
  assert.equal(profiles[0].rejected.length, 1)
  assert.equal(profiles[0].rejected[0].optimizationError, "Excede largo de perfil")
})
