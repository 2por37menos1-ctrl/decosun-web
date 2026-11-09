import test from "node:test"
import assert from "node:assert/strict"
import { buildWhatsAppUrl, getQuoteWhatsAppZone } from "./whatsappRouting.js"

test("Direct enquiries select the correct contact and include the commercial source page", () => {
  const north = new URL(buildWhatsAppUrl({ zone: "iquique", message: "Hola, quiero cotizar.", pathname: "/cortinas-plisadas-honeycomb" }))
  assert.equal(north.pathname, "/56992156733")
  assert.match(north.searchParams.get("text"), /equipo de Iquique/)
  assert.match(north.searchParams.get("text"), /https:\/\/www.decosun.cl\/cortinas-plisadas-honeycomb/)
  const central = new URL(buildWhatsAppUrl({ zone: "centro", message: "Consulta por mantención.", pathname: "/mantencion" }))
  assert.equal(central.pathname, "/56929307614")
  assert.match(central.searchParams.get("text"), /mantención/i)
})

test("Quote routing follows the existing territory assignment, including explicit city before branch", () => {
  assert.equal(getQuoteWhatsAppZone({ city: "Iquique", sucursal: "iquique" }), "iquique")
  assert.equal(getQuoteWhatsAppZone({ city: "Alto Hospicio", sucursal: "vina" }), "iquique")
  assert.equal(getQuoteWhatsAppZone({ city: "Santiago", sucursal: "iquique" }), "centro")
  assert.equal(getQuoteWhatsAppZone({ city: "Viña del Mar", sucursal: "vina" }), "centro")
  assert.equal(getQuoteWhatsAppZone({ city: "", sucursal: "iquique" }), "iquique")
})

test("Source attribution excludes query strings, fragments and private status paths", () => {
  const quote = new URL(buildWhatsAppUrl({ zone: "centro", message: "Hola", pathname: "/cotizar?nombre=private#form" }))
  assert.match(quote.searchParams.get("text"), /https:\/\/www.decosun.cl\/cotizar$/)
  assert.doesNotMatch(quote.searchParams.get("text"), /private|nombre|#form/)
  const status = new URL(buildWhatsAppUrl({ zone: "centro", message: "Hola", pathname: "/estado/private-token" }))
  assert.doesNotMatch(status.searchParams.get("text"), /private-token|\/estado/)
  assert.throws(() => buildWhatsAppUrl({ zone: "invalid", message: "Hola" }), /zona/)
})
