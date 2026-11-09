import { fabricSeoPages, fabricBreadcrumbs } from "./fabricLibrary.js"
import { PLEATED_PATH, pleatedFaqs } from "./pleatedSystems.js"
export const SITE_URL = "https://www.decosun.cl"

export const coverageCities = ["Iquique", "Región de Valparaíso", "Santiago", "Arica", "Copiapó", "Vallenar", "La Serena", "Concepción", "Temuco"]

export const publicPages = {
  ...fabricSeoPages,
  [PLEATED_PATH]: { title: "Cortinas Honeycomb y mosquiteros plisados | DecoSun", description: "Cortinas plisadas Honeycomb blackout, translúcidas, screen y mosquiteros a medida. Compara sistemas laterales y cotiza tu proyecto con DecoSun en Chile." },
  "/": { title: "Motorización y cortinas roller a medida | DecoSun", description: "Motorización de cortinas roller, confección a medida y servicio técnico DecoSun. Atención en Iquique, Región de Valparaíso, Santiago y red regional." },
  "/motorizacion": { title: "Motorización de cortinas roller | Garantía 5 años | DecoSun", description: "Motoriza tus cortinas roller previa evaluación técnica. Motores con garantía DecoSun de 5 años e instalación de 1 año. Iquique, V Región y Santiago." },
  "/soluciones": { title: "Sistemas de cortinas y control solar a medida | DecoSun", description: "Explora sistemas roller, roller doble, DÚO, persianas verticales y toldos. Distingue sistema y tela, y solicita asesoría DecoSun." },
  "/mantencion": { title: "Mantención de roller y limpieza de sunscreen | DecoSun", description: "Mantención y reparación de cortinas roller, limpieza de telas sunscreen, retiro y reinstalación según evaluación. Consulta cobertura con DecoSun." },
  "/proyectos": { title: "Proyectos de cortinas y control solar | DecoSun", description: "Conoce soluciones DecoSun para hogares, oficinas y terrazas: cortinas roller, sistemas dúo y protección solar a medida." },
  "/nosotros": { title: "Fabricación y red de técnicos DecoSun | Cobertura", description: "Tienda DecoSun en Iquique, taller sin atención al público en la V Región y fábrica principal en Santiago. Red de técnicos certificados por DecoSun." },
  "/garantia": { title: "Garantía DecoSun: cortinas, motores e instalación", description: "Garantía DecoSun: 5 años en cortinas, 5 años en motores y 1 año en instalación. El mismo respaldo en las ciudades atendidas por nuestra red." },
}

export function getPageSeo(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/"
  if (publicPages[path]) return { ...publicPages[path], path, index: true }
  const title = path === "/cotizar" ? "Cotizar cortinas y motorización | DecoSun" : path === "/agenda" ? "Agenda tu atención | DecoSun" : path === "/login" || path.startsWith("/panel") ? "Acceso equipo DecoSun" : path.startsWith("/estado/") ? "Estado de proyecto | DecoSun" : "Página no encontrada | DecoSun"
  return { title, description: "Atención y gestión de proyectos DecoSun.", path, index: false }
}

export function getStructuredData(pathname) {
  const page = getPageSeo(pathname)
  if (!page.index) return null
  const organization = { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "DecoSun", url: SITE_URL, telephone: "+56 9 2930 7614", areaServed: coverageCities.map(name => ({ "@type": "Place", name })) }
  const webpage = { "@type": "WebPage", "@id": `${SITE_URL}${page.path}#webpage`, url: `${SITE_URL}${page.path}`, name: page.title, description: page.description, inLanguage: "es-CL", publisher: { "@id": organization["@id"] } }
  const graph = [organization, webpage]
  const crumbs = page.path === PLEATED_PATH
    ? [{ name: "Inicio", path: "/" }, { name: "Cortinas plisadas Honeycomb", path: PLEATED_PATH }]
    : fabricBreadcrumbs(page.path)
  if (crumbs.length) graph.push({ "@type": "BreadcrumbList", "@id": `${SITE_URL}${page.path}#breadcrumbs`, itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${SITE_URL}${crumb.path}` })) })
  if (page.path === "/motorizacion" || page.path === "/mantencion") graph.push({ "@type": "Service", "@id": `${SITE_URL}${page.path}#service`, name: page.path === "/motorizacion" ? "Motorización de cortinas roller" : "Mantención de roller y limpieza de sunscreen", provider: { "@id": organization["@id"] }, url: webpage.url, areaServed: organization.areaServed })
  if (page.path === PLEATED_PATH) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${SITE_URL}${page.path}#faq`,
      mainEntity: pleatedFaqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    })
    graph.push({
      "@type": "Service",
      "@id": `${SITE_URL}${page.path}#service`,
      name: "Cortinas plisadas Honeycomb y mosquiteros a medida",
      provider: { "@id": organization["@id"] },
      url: webpage.url,
      description: page.description,
    })
  }
  return { "@context": "https://schema.org", "@graph": graph }
}
