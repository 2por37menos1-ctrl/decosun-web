import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'

const vite = await createServer({ server: { middlewareMode:true }, appType:'custom' })
try {
  const { default:Cotizar } = await vite.ssrLoadModule('/src/pages/Cotizar.jsx')
  const html = renderToString(createElement(MemoryRouter, {initialEntries:['/cotizar']}, createElement(Cotizar)))
  const { quoteFamilies } = await vite.ssrLoadModule('/src/components/QuoteProductGallery.jsx')
  assert.ok(html.includes('Explorar galería de productos'))
  assert.ok(html.includes('quote-products'))
  assert.ok(html.includes('quote-nombre'))
  assert.ok(!html.includes('DecoSun Smart Quote'))
  assert.ok(!html.includes('aria-valuemax="9"'))
  assert.ok(!html.includes('Volver al cotizador guiado'))
  const variants = quoteFamilies.flatMap(family => family.variants.map(([key]) => key))
  const expected = ['rollerSimple','blackout','sunscreen','translucido','rollerCenefa','rollerDoble','rollerDobleCenefa','rollerDuo','rollerDuoTranslucido','rollerDuoSunOut','persianaVertical','darkBlackout','honeycomb','toldoProyectante','toldoVertical','cierreTerraza','pergolaBioclimatica','motorizacionIndependiente','motorizacionDual','motorizacionIntegrada','honeycombBlackout','honeycombTranslucida','honeycombScreen','mosquiteroPlisado','honeycombBlackoutMosquitero','honeycombTranslucidaMosquitero','honeycombScreenMosquitero','honeycombDoble']
  assert.deepEqual(variants.sort(), expected.sort(), 'Each original product must be offered exactly once in the visual selector')
  const { pleatedOptions } = await vite.ssrLoadModule('/src/lib/pleatedSystems.js')
  for (const option of pleatedOptions) {
    const linkedHtml = renderToString(createElement(MemoryRouter, { initialEntries: [`/cotizar?producto=${option.key}`] }, createElement(Cotizar)))
    assert.ok(linkedHtml.includes(`<h3>${option.name}</h3>`), `Missing selected product: ${option.key}`)
    assert.ok(linkedHtml.includes('Ancho (m)'))
    assert.ok(linkedHtml.includes('Alto (m)'))
  }
  const unknownHtml = renderToString(createElement(MemoryRouter, { initialEntries: ['/cotizar?producto=unknown'] }, createElement(Cotizar)))
  assert.ok(unknownHtml.includes('Explorar galería de productos'))
  console.log('OK: /cotizar opens the original quote with a visual gallery covering all 28 product variants.')
} finally { await vite.close() }
