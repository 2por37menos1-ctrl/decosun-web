import test from "node:test"
import assert from "node:assert/strict"
import { recommendations, needs, validMeasurements, insertQuoteRows } from "./smartQuote.js"
import { getTerritoryAssignment } from "./territoryAssignment.js"

test("Honeycomb is assisted and never offered with unverified motor compatibility", () => {
  assert.ok(recommendations("manual", [needs[3]]).some(row => row.key === "honeycomb"))
  assert.ok(!recommendations("smart", [needs[3]]).some(row => row.key === "honeycomb"))
  assert.deepEqual(recommendations("existing", []).map(row => row.key), ["motorizacionIndependiente"])
})
test("Blackout recommendation responds to darkness need without hiding alternatives", () => {
  const options = recommendations("manual", [needs[1]])
  assert.equal(options[0].key, "blackout")
  for (const key of ["sunscreen", "translucido", "rollerDuo", "rollerDoble"]) assert.ok(options.some(row => row.key === key))
})
test("Measurements reject empty, nonfinite, nonpositive and fractional quantities", () => {
  const row = { ancho: "1.5", alto: "2", cantidad: "2" }
  assert.ok(validMeasurements([row, { ...row, ancho: 3 }]))
  for (const bad of [{ ancho: "" }, { alto: -2 }, { ancho: Infinity }, { cantidad: 1.5 }, { cantidad: 0 }]) assert.ok(!validMeasurements([{ ...row, ...bad }]))
  assert.ok(!validMeasurements([]))
})
test("Regional assignment keeps current ERP mapping, including accented city names", () => {
  assert.equal(getTerritoryAssignment({ city: "Copiapó", sucursal: "iquique" }).region_code, "atacama")
  assert.equal(getTerritoryAssignment({ city: "Vallenar" }).region_code, "atacama")
  assert.equal(getTerritoryAssignment({ city: "La Serena" }).region_code, "coquimbo")
  assert.equal(getTerritoryAssignment({ city: "Santiago" }).region_code, "santiago")
  assert.equal(getTerritoryAssignment({ city: "Quillota" }).region_code, "quinta_region_interior")
})

test("Retry reconciliation preserves completed records and never inserts after denied or partial reads", async () => {
  for (const [data, readError, expectedInserts, expectedError] of [[[], null, 1, false], [[{}], null, 0, false], [[], new Error("RLS"), 0, true], [[{}, {}], null, 0, true]]) {
    let inserts = 0
    const client = { from: () => ({ select: () => ({ eq: async () => ({ data, error: readError }) }), insert: async () => { inserts++; return { error: null } } }) }
    const response = await insertQuoteRows(client, "project_measurements", [{ project_id: "same-project" }], "same-project", true)
    assert.equal(inserts, expectedInserts)
    assert.equal(Boolean(response.error), expectedError)
  }
})
test("First submission propagates write failure instead of confirming success", async () => {
  const failure = new Error("network")
  const client = { from: () => ({ insert: async () => ({ error: failure }) }) }
  assert.equal((await insertQuoteRows(client, "projects", [{}], "id", false)).error, failure)
})
