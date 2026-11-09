import test from "node:test"
import assert from "node:assert/strict"
import { getPleatedPrice } from "./pleatedPricing.js"

test("Approved matrix prices include doubling and 19% VAT, rounded per unit", () => {
  const references = [
    ["mosquiteroPlisado", 35700, 82110, 130900],
    ["honeycombBlackout", 41650, 116620, 208250],
    ["honeycombBlackoutMosquitero", 59500, 136850, 242760],
    ["honeycombDoble", 66640, 167790, 312970],
  ]
  for (const [key, first, middle, last] of references) {
    for (const [size, reference] of [[1, first], [2, middle], [3, last]]) {
      const quote = getPleatedPrice(key, size, size, 1)
      assert.equal(quote.unitPrice, Math.round(reference * 2 * 1.19), `${key}, ${size} m`)
      assert.equal(quote.requiresAssessment, false)
    }
  }
})

test("Widths use columns, heights use rows, and intermediate sizes round up independently", () => {
  assert.equal(getPleatedPrice("mosquiteroPlisado", 1.2, 1, 1).unitPrice, Math.round(45220 * 2 * 1.19))
  assert.equal(getPleatedPrice("mosquiteroPlisado", 1, 1.2, 1).unitPrice, Math.round(42840 * 2 * 1.19))
  const quote = getPleatedPrice("mosquiteroPlisado", 1.01, 1.21, 2)
  assert.equal(quote.bandWidth, 1.2)
  assert.equal(quote.bandHeight, 1.4)
  assert.equal(quote.unitPrice, Math.round(51170 * 2 * 1.19))
  assert.equal(quote.subtotal, quote.unitPrice * 2)
  assert.equal(getPleatedPrice("mosquiteroPlisado", .5, .8, 1).unitPrice, Math.round(35700 * 2 * 1.19))
})

test("Material variants share the approved table for their system", () => {
  const single = getPleatedPrice("honeycombBlackout", 1.6, 2.4, 1)
  for (const key of ["honeycombTranslucida", "honeycombScreen"]) {
    assert.deepEqual(getPleatedPrice(key, 1.6, 2.4, 1), single)
  }
  const combined = getPleatedPrice("honeycombBlackoutMosquitero", 2.2, 1.8, 1)
  for (const key of ["honeycombTranslucidaMosquitero", "honeycombScreenMosquitero"]) {
    assert.deepEqual(getPleatedPrice(key, 2.2, 1.8, 1), combined)
  }
})

test("Invalid measures are rejected and dimensions outside the matrix require assessment", () => {
  for (const [width, height, quantity] of [["", 2, 1], [0, 2, 1], [-1, 2, 1], [Infinity, 2, 1], [2, NaN, 1], [2, 2, 0], [2, 2, 1.5], [2, 2, Infinity], [2, 2, 1e20], [2, 2, Number.MAX_SAFE_INTEGER]]) {
    assert.equal(getPleatedPrice("honeycombBlackout", width, height, quantity).valid, false)
  }
  const oversized = getPleatedPrice("honeycombBlackout", 3.01, 2.4, 2)
  assert.equal(oversized.valid, true)
  assert.equal(oversized.requiresAssessment, true)
  assert.equal(oversized.width, 3.01)
  assert.equal(oversized.height, 2.4)
  assert.equal(oversized.quantity, 2)
  assert.equal(oversized.unitPrice, undefined)
  assert.equal(getPleatedPrice("rollerSimple", 2, 2, 1), null)
  assert.equal(getPleatedPrice("honeycomb", 2, 2, 1), null)
})
