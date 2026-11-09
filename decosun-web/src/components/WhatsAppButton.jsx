import { useEffect, useId, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { ArrowUpRight } from "lucide-react"
import { buildWhatsAppUrl, whatsappContacts } from "../lib/whatsappRouting"
import "./WhatsAppContact.css"

export default function WhatsAppButton({
  inline = false,
  message = "Hola, me gustaría cotizar una solución con Decosun.",
  children,
  className = "",
}) {
  const [open, setOpen] = useState(false)
  const dialog = useRef(null)
  const titleId = useId()
  const { pathname } = useLocation()

  useEffect(() => {
    if (open) dialog.current.showModal()
    else dialog.current.close()
  }, [open])

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`${inline
        ? "inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-500 px-7 py-4 text-center text-sm font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
        : "fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1 motion-reduce:transform-none"} ${className}`}
      aria-label={inline && typeof children === "string" ? `${children}. Elegir zona para WhatsApp` : "WhatsApp. Elegir zona del trabajo"}
      aria-haspopup="dialog"
    >
      {inline ? children : <><span className="text-lg">💬</span>WhatsApp</>}
    </button>
    <dialog ref={dialog} className="whatsapp-contact-dialog" aria-labelledby={titleId} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <header>
        <div><p>Conversemos sobre tu proyecto</p><h2 id={titleId}>¿Dónde necesitas el trabajo?</h2></div>
        <button type="button" className="whatsapp-contact-close" aria-label="Cerrar selección de zona" onClick={() => setOpen(false)}>✕</button>
      </header>
      <p>Elige la zona del proyecto para hablar con el equipo correspondiente.</p>
      <div className="whatsapp-contact-zones">
        {Object.entries(whatsappContacts).map(([zone, contact]) => (
          <a key={zone} href={buildWhatsAppUrl({ zone, message, pathname })} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            <strong>{contact.name} <ArrowUpRight size={20} aria-hidden="true" /></strong>
            <span>{contact.description}</span>
            <small>{contact.displayPhone} · Abre WhatsApp</small>
          </a>
        ))}
      </div>
      <p className="whatsapp-contact-note">Si tu proyecto está en otra ciudad, consulta la cobertura con el equipo de zona centro. El mensaje incluirá la página desde la que nos contactas.</p>
    </dialog>
    </>
  )
}
