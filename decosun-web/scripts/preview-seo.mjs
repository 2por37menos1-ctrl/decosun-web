import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { resolve, extname, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(fileURLToPath(new URL("../dist", import.meta.url)))
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"))
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webm": "video/webm", ".mp4": "video/mp4" }

async function existingFile(pathname) {
  let filename = resolve(root, `.${pathname}`)
  if (filename !== root && !filename.startsWith(root + sep)) return null
  try {
    if ((await stat(filename)).isDirectory()) filename = resolve(filename, "index.html")
    return (await stat(filename)).isFile() ? filename : null
  } catch { return null }
}

// Local smoke preview of the project's Vercel static routing; no backend mutation.
export function createPreviewServer() {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
      let filename, status = 200
      for (const rule of config.routes) {
        if (rule.handle === "filesystem") {
          filename = await existingFile(pathname)
          if (filename) break
        } else if (new RegExp(`^(?:${rule.src})$`).test(pathname)) {
          for (const [key, value] of Object.entries(rule.headers || {})) res.setHeader(key, value)
          if (!rule.continue) {
            filename = await existingFile(rule.dest)
            status = rule.status || 200
            break
          }
        }
      }
      if (!filename) { res.writeHead(404); res.end(); return }
      res.writeHead(status, { "Content-Type": types[extname(filename)] || "application/octet-stream" })
      res.end(await readFile(filename))
    } catch {
      res.writeHead(500)
      res.end("Preview error")
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173)
  createPreviewServer().listen(port, "127.0.0.1", () => console.log(`DecoSun preview: http://127.0.0.1:${port}`))
}
