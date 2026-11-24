import test from "node:test"
import assert from "node:assert/strict"
import { getAwningPrice } from "./awningPricing.js"

test("Fabric renewal uses actual area, quantity and IVA exactly once", () => {
  assert.equal(getAwningPrice("cambioTelaToldo", 4.85, 2.5, 2).subtotal, 808010)
  assert.equal(getAwningPrice("cambioTelaToldo", 4.85, 2.5, 1).subtotal, 404005)
  assert.equal(getAwningPrice("cambioTelaToldo", .11, .11, 3).subtotal, 1210)
})

test("New awnings use the approved gross sale values for each mechanism", () => {
  assert.equal(getAwningPrice("toldoVinciManual", 4.8, 2.5, 1).subtotal, 2042904)
  assert.equal(getAwningPrice("toldoVinciMotorizado", 4.8, 2.5, 1).subtotal, 2164413)
  assert.equal(getAwningPrice("toldoMonoblockMotorizado", 4.8, 4, 1).subtotal, Math.round(((1471545 + 206500) * .65 + 282000) * 1.19 * 2.3))
})

test("Unlisted intermediate dimensions remain an assessment request", () => {
  assert.equal(getAwningPrice("toldoVinciManual", 4.85, 2.5, 1).requiresAssessment, true)
  assert.equal(getAwningPrice("toldoVinciManual", 2.4, 2, 1).requiresAssessment, true)
  assert.equal(getAwningPrice("toldoVinciManual", 4.8001, 2.5, 1).requiresAssessment, true)
})

test("Invalid dimensions and quantities never create a price", () => {
  for (const [width, projection, quantity] of [[0, 2, 1], [2, -1, 1], [Infinity, 2, 1], [2, 2, 1.5], [2, 2, 0], [2, 2, Infinity], [1e200, 2, 1]]) {
    assert.equal(getAwningPrice("cambioTelaToldo", width, projection, quantity).valid, false)
  }
  assert.equal(getAwningPrice("blackout", 2, 2, 1), null)
})
