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
  const expected = ['rollerSimple','blackout','sunscreen','translucido','rollerCenefa','rollerDoble','rollerDobleCenefa','rollerDuo','rollerDuoTranslucido','rollerDuoSunOut','persianaVertical','darkBlackout','honeycomb','toldoProyectante','toldoVertical','cierreTerraza','pergolaBioclimatica','motorizacionIndependiente','motorizacionDual','motorizacionIntegrada']
  assert.deepEqual(variants.sort(), expected.sort(), 'Each original product must be offered exactly once in the visual selector')
  console.log('OK: /cotizar opens the original quote with a visual gallery covering all 20 product variants.')
} finally { await vite.close() }
