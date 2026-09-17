export default function WhatsAppButton({
  inline = false,
  message = "Hola, me gustaría cotizar una solución con Decosun.",
  children,
  className = "",
}) {
  const phone = "56929307614"
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`${inline
        ? "inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-500 px-7 py-4 text-center text-sm font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
        : "fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1 motion-reduce:transform-none"} ${className}`}
      aria-label={inline && typeof children === "string" ? `${children} (abre WhatsApp en una pestaña nueva)` : undefined}
    >
      {inline ? children : <><span className="text-lg">💬</span>WhatsApp</>}
    </a>
  )
}
