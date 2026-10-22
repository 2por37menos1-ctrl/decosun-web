import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { getPageSeo, getStructuredData, SITE_URL } from "../lib/siteSeo"

export default function Seo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const page = getPageSeo(pathname)
    document.documentElement.lang = "es-CL"
    document.title = page.title
    function meta(attribute, name, content) {
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement("meta")
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.content = content
    }
    meta("name", "description", page.description)
    meta("name", "robots", page.index ? "index,follow" : "noindex,follow")
    meta("property", "og:title", page.title)
    meta("property", "og:description", page.description)
    meta("property", "og:type", "website")
    meta("property", "og:locale", "es_CL")
    meta("name", "twitter:card", "summary")
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (page.index) {
      if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical) }
      canonical.href = `${SITE_URL}${page.path}`
      meta("property", "og:url", canonical.href)
    } else {
      canonical?.remove()
      document.head.querySelector('meta[property="og:url"]')?.remove()
    }
    document.getElementById("decosun-structured-data")?.remove()
    const data = getStructuredData(pathname)
    if (data) {
      const script = document.createElement("script")
      script.id = "decosun-structured-data"
      script.type = "application/ld+json"
      script.textContent = JSON.stringify(data)
      document.head.appendChild(script)
    }
  }, [pathname])
  return null
}
