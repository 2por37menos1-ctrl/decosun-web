import test from "node:test"
import assert from "node:assert/strict"
import { readFile, access } from "node:fs/promises"
import { fabricPages, fabricBreadcrumbs, FABRIC_GUIDE_PATH } from "../src/lib/fabricLibrary.js"
import { publicPages, SITE_URL } from "../src/lib/siteSeo.js"

const readHtml = path => readFile(path === "/" ? "dist/index.html" : `dist${path}/index.html`, "utf8")
const newPaths = [FABRIC_GUIDE_PATH, ...Object.keys(fabricPages)]

test("Fabric guide and every detail expose their own educational content without JavaScript", async () => {
  const guide = await readHtml(FABRIC_GUIDE_PATH)
  assert.match(guide, /La tela no es el sistema/)
  assert.match(guide, /<table>/)
  assert.match(guide, /Privacidad y límites/)
  for (const [path, fabric] of Object.entries(fabricPages)) {
    const html = await readHtml(path)
    assert.ok(html.includes(fabric.definition), `${path}: definition missing from initial HTML`)
    assert.ok(html.includes(fabric.limits), `${path}: limitations missing`)
    for (const [question, answer] of fabric.faqs) {
      assert.ok(html.includes(question), `${path}: FAQ missing`)
      assert.ok(html.includes(answer), `${path}: FAQ answer missing`)
    }
    assert.match(html, /Imagen de referencia/)
    assert.doesNotMatch(html, /data:image\//)
    assert.ok(guide.includes(`href="${path}"`))
    assert.ok(html.includes(`href="${FABRIC_GUIDE_PATH}"`))
  }
})

test("Breadcrumb JSON-LD describes the visible breadcrumb and never asserts undocumented products or prices", async () => {
  for (const path of newPaths) {
    const html = await readHtml(path)
    const data = JSON.parse(html.match(/<script id="decosun-structured-data" type="application\/ld\+json">(.*?)<\/script>/s)[1])
    const breadcrumb = data["@graph"].find(item => item["@type"] === "BreadcrumbList")
    assert.deepEqual(breadcrumb.itemListElement.map(item => ({ name: item.name, path: item.item.replace(SITE_URL, "") })), fabricBreadcrumbs(path))
    for (const crumb of fabricBreadcrumbs(path)) assert.ok(html.includes(crumb.name))
    assert.ok(!data["@graph"].some(item => ["Offer", "Product", "AggregateRating", "FAQPage"].includes(item["@type"])))
  }
})

test("New pages contain resolvable internal links and fragments; future catalogue URLs are not invented", async () => {
  const appRoutes = new Set(["/cotizar", "/agenda", "/login"])
  for (const path of [...newPaths, "/soluciones", "/"]) {
    const html = await readHtml(path)
    for (const match of html.matchAll(/href="([^"?]+)"/g)) {
      const href = match[1]
      if (!href.startsWith("/") && !href.startsWith("#")) continue
      if (/\.(?:png|ico|svg|css|js)$/.test(href) || href.startsWith("/assets/")) { await access(`dist${href}`); continue }
      const [targetPath, fragment] = href.split("#")
      const target = targetPath || path
      assert.ok(publicPages[target] || appRoutes.has(target), `${path} links to unregistered ${href}`)
      if (fragment) assert.ok((await readHtml(target)).includes(`id="${fragment}"`), `Unresolved fragment: ${path} → ${href}`)
    }
  }
})

test("Catalogue preserves legacy anchors and excludes deferred product families", async () => {
  const html = await readHtml("/soluciones")
  for (const id of ["roller-blackout", "roller-sunscreen", "roller-duo", "persianas-verticales", "tipos-telas"]) assert.ok(html.includes(`id="${id}"`), id)
  assert.doesNotMatch(html, /pérgola|cierres de cristal/i)
  assert.ok(html.includes('href="/cortinas-plisadas-honeycomb"'))
  const nav = html.match(/<nav[^>]+aria-label="Navegación principal"[^>]*>(.*?)<\/nav>/s)[1]
  assert.equal((nav.match(/href="\/soluciones"/g) || []).length, 1)
  assert.equal((nav.match(/href="\/cotizar"/g) || []).length, 1)
  for (const route of ["/mantencion", "/garantia", "/agenda", "/login"]) assert.ok(html.includes(`href="${route}"`))
})
