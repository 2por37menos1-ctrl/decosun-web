import test from "node:test"
import assert from "node:assert/strict"
import { createQuotePdf } from "./quotePdf.js"

function sampleQuote(count) {
  return {
    quoteNumber: "COT-PRUEBA",
    date: "09-11-2026",
    customer: { nombre: "Cliente de prueba", telefono: "Por indicar" },
    city: "Iquique",
    seller: { sucursal: "DecoSun Iquique", nombre: "Asesor DecoSun", telefono: "+56 9 9215 6733", email: "ventas@decosun.cl" },
    conditions: Array.from({ length: 6 }, (_, index) => `Condición comercial ${index + 1} del proyecto a medida.`),
    result: {
      validRows: Array.from({ length: count }, (_, index) => ({ index: index + 1, productKey: "honeycombBlackout", productLabel: "Plisada blackout", ubicacion: `Ambiente ${index + 1}`, ancho: 2, alto: 2, cantidad: 1, category: "calculable", total: 277556, note: "Valor por tramo de hasta 2 × 2 m. IVA incluido." })),
      subtotalGeneral: 277556 * count,
      recargoGeneral: 0,
      discountGeneral: 0,
      hasRequestRows: false,
    },
    totalLabel: "$277.556",
  }
}

test("The generated quote is US Letter and six normal product rows fit one page", () => {
  const pdf = createQuotePdf(sampleQuote(6))
  assert.equal(pdf.getNumberOfPages(), 1)
  assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - 215.9) < .01)
  assert.ok(Math.abs(pdf.internal.pageSize.getHeight() - 279.4) < .01)
})

test("A long quote automatically continues to further Letter pages", () => {
  const pdf = createQuotePdf(sampleQuote(18))
  assert.equal(pdf.getNumberOfPages(), 2)
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page)
    assert.ok(Math.abs(pdf.internal.pageSize.getHeight() - 279.4) < .01)
  }
})
