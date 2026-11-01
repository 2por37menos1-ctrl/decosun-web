import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'

const vite = await createServer({ server: { middlewareMode:true }, appType:'custom' })
try {
  const { default:Cotizar } = await vite.ssrLoadModule('/src/pages/Cotizar.jsx')
  const html = renderToString(createElement(MemoryRouter, {initialEntries:['/cotizar']}, createElement(Cotizar)))
  assert.ok(html.includes('DecoSun Smart Quote'))
  assert.ok(html.includes('¿Cómo te gustaría controlar tus cortinas?'))
  assert.ok(html.includes('aria-valuemax="9"'))
  assert.ok(html.includes('Cortinas inteligentes'))
  assert.ok(html.includes('Motorizar mis cortinas actuales'))
  assert.ok(!html.includes('Volver al cotizador guiado'))
  console.log('OK: /cotizar opens the nine-step guided quote by default; no customer data submitted.')
} finally { await vite.close() }
