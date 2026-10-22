import { build } from "vite"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { pathToFileURL } from "node:url"
import { publicPages, getPageSeo, getStructuredData, SITE_URL } from "../src/lib/siteSeo.js"

await build()
await build({ build: { ssr: "src/entry-seo.jsx", outDir: "dist-ssr", emptyOutDir: true, rollupOptions: { output: { entryFileNames: "entry-seo.js" } } } })
const { renderPage } = await import(pathToFileURL(resolve("dist-ssr/entry-seo.js")))
const template = await readFile("dist/index.html", "utf8")
const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

function htmlFor(path, body = "") {
  const page = getPageSeo(path)
  const data = getStructuredData(path)
  const head = [
    `<meta name="description" content="${escape(page.description)}">`,
    `<meta name="robots" content="${page.index ? "index,follow" : "noindex,follow"}">`,
    `<meta property="og:title" content="${escape(page.title)}">`,
    `<meta property="og:description" content="${escape(page.description)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="es_CL">',
    '<meta name="twitter:card" content="summary">',
    ...(page.index ? [`<link rel="canonical" href="${SITE_URL}${page.path}">`, `<meta property="og:url" content="${SITE_URL}${page.path}">`] : []),
    ...(data ? [`<script id="decosun-structured-data" type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`] : []),
  ].join("\n    ")
  return template.replace(/<title>.*?<\/title>/s, `<title>${escape(page.title)}</title>`).replace("</head>", `    ${head}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

for (const path of Object.keys(publicPages)) {
  const filename = path === "/" ? "dist/index.html" : `dist${path}/index.html`
  await mkdir(dirname(filename), { recursive: true })
  await writeFile(filename, htmlFor(path, renderPage(path)))
  console.log(`SEO HTML: ${path}`)
}
// SPA shell stays separate from the indexable home document.
await writeFile("dist/app.html", htmlFor("/login"))
await writeFile("dist/404.html", htmlFor("/404", renderPage("/404")))
const urls = Object.keys(publicPages).map(path => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n")
await writeFile("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
