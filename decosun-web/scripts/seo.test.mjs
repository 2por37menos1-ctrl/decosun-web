import test from "node:test"
import assert from "node:assert/strict"
import { readFile, access } from "node:fs/promises"
import { resolve } from "node:path"
import { publicPages, SITE_URL } from "../src/lib/siteSeo.js"
import { createPreviewServer } from "./preview-seo.mjs"

test("Commercial HTML is complete, unique and has valid local assets before JavaScript", async () => {
  const titles = new Set()
  for (const [path, page] of Object.entries(publicPages)) {
    const html = await readFile(path === "/" ? "dist/index.html" : `dist${path}/index.html`, "utf8")
    assert.equal((html.match(/<h1\b/g) || []).length, 1, path)
    assert.ok(html.includes(`<title>${page.title}</title>`), path)
    assert.ok(!titles.has(page.title), `Duplicate title: ${path}`)
    titles.add(page.title)
    assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}${path}">`), path)
    assert.ok(html.includes('content="index,follow"'), path)
    assert.ok(html.includes('<html lang="es-CL">'), path)
    assert.ok(!html.includes('style="opacity:0'), `Content hidden before JS: ${path}`)
    const schema = JSON.parse(html.match(/<script id="decosun-structured-data" type="application\/ld\+json">(.*?)<\/script>/s)[1])
    assert.equal(schema["@graph"][0].name, "DecoSun")
    for (const match of html.matchAll(/(?:src|href)="(\/(?:assets|img)\/[^"?#]+)"/g)) await access(resolve(`dist${match[1]}`))
  }
})

test("Warranty, coverage and product navigation reflect the approved business facts", async () => {
  const motor = await readFile("dist/motorizacion/index.html", "utf8")
  const home = await readFile("dist/index.html", "utf8")
  const solutions = await readFile("dist/soluciones/index.html", "utf8")
  assert.match(motor, /5 años de garantía en motores/)
  assert.match(motor, /1 año en instalación/)
  assert.match(motor, /no incorpora una nueva garantía para la cortina anterior/)
  assert.match(motor, /Taller de fabricación sin atención al público/)
  assert.match(motor, /técnicos certificados por DecoSun/)
  assert.match(motor, /Concepción/)
  assert.ok(!home.includes('role="dialog"'), "Home must not interrupt discovery with the promotion")
  assert.ok(!home.includes("proyectos finalizados"), "Do not bake live operational statistics into public HTML")
  for (const id of ["roller-blackout", "roller-sunscreen", "roller-duo", "persianas-verticales"]) {
    assert.ok(home.includes(`href="/soluciones#${id}"`), id)
    assert.ok(solutions.includes(`id="${id}"`), id)
  }
})

test("HTTP routing serves robots, sitemap, public pages, private shells and real 404 separately", async () => {
  const server = createPreviewServer()
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const robots = await fetch(`${base}/robots.txt`)
    assert.match(robots.headers.get("content-type"), /text\/plain/)
    assert.match(await robots.text(), /Sitemap: https:\/\/www.decosun.cl\/sitemap.xml/)
    const sitemapResponse = await fetch(`${base}/sitemap.xml`)
    assert.match(sitemapResponse.headers.get("content-type"), /application\/xml/)
    const sitemap = await sitemapResponse.text()
    assert.equal((sitemap.match(/<loc>/g) || []).length, Object.keys(publicPages).length)
    assert.doesNotMatch(sitemap, /cotizar|agenda|panel|login|estado/)
    for (const [path, page] of Object.entries(publicPages)) {
      const response = await fetch(`${base}${path}`)
      assert.equal(response.status, 200, path)
      assert.ok((await response.text()).includes(`<title>${page.title}</title>`), path)
    }
    for (const path of ["/cotizar", "/agenda", "/login", "/panel", "/panel/academy", "/panel/academy/comercial", "/panel/mercado-publico", "/panel/radar-compra-agil", "/estado/test-token"]) {
      const response = await fetch(`${base}${path}`)
      const html = await response.text()
      assert.equal(response.status, 200, path)
      assert.match(response.headers.get("x-robots-tag"), /noindex/)
      assert.ok(html.includes('content="noindex,follow"'), path)
      assert.ok(html.includes('<div id="root"></div>'), `No ERP or project content may be baked into ${path}`)
      assert.ok(!html.includes('rel="canonical"'), path)
    }
    const missing = await fetch(`${base}/pagina-inexistente-seo`)
    assert.equal(missing.status, 404)
    assert.match(await missing.text(), /No encontramos esta página/)
    const missingAsset = await fetch(`${base}/assets/no-existe.js`)
    assert.equal(missingAsset.status, 404)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
