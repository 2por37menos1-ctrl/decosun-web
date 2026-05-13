export default function WhatsAppButton() {
  const phone = "56929307614"
  const message = "Hola, me gustaría cotizar una solución con Decosun."
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-1"
    >
      <span className="text-lg">💬</span>
      WhatsApp
    </a>
  )
}