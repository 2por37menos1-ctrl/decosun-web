import { getTerritoryAssignment } from "./territoryAssignment.js"
import { getPageSeo, publicPages, SITE_URL } from "./siteSeo.js"

export const whatsappContacts = {
  iquique: { name: "Iquique", phone: "56992156733", displayPhone: "+56 9 9215 6733", description: "Proyectos en Iquique y Tarapacá" },
  centro: { name: "Zona centro", phone: "56929307614", displayPhone: "+56 9 2930 7614", description: "Región de Valparaíso y Santiago" },
}

export function getQuoteWhatsAppZone({ city, sucursal }) {
  const cityAssignment = getTerritoryAssignment({ city })
  const assignment = cityAssignment.region_code === "quinta_region"
    ? getTerritoryAssignment({ city, sucursal })
    : cityAssignment
  return assignment.region_code === "iquique" ? "iquique" : "centro"
}

export function buildWhatsAppUrl({ zone, message, pathname = "/" }) {
  const contact = whatsappContacts[zone]
  if (!contact) throw new Error("Selecciona una zona de atención válida.")

  const cleanPath = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/"
  const sourcePath = Object.hasOwn(publicPages, cleanPath) || ["/cotizar", "/agenda"].includes(cleanPath) ? cleanPath : "/"
  const sourceTitle = getPageSeo(sourcePath).title.replace(/\s*\|\s*DecoSun.*$/, "")
  const text = [
    message.trim(),
    "",
    `Solicito atención del equipo de ${contact.name}.`,
    `Consulta desde ${sourceTitle}.`,
    `${SITE_URL}${sourcePath}`,
  ].join("\n")

  return `https://wa.me/${contact.phone}?text=${encodeURIComponent(text)}`
}
