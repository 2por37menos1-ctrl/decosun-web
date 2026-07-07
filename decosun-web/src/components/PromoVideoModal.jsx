import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const STORAGE_KEY = "decosun_motorization_promo_seen"
const DAY_IN_MS = 24 * 60 * 60 * 1000

export default function PromoVideoModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const lastSeen = Number(localStorage.getItem(STORAGE_KEY) || 0)
    const shouldShow = !lastSeen || Date.now() - lastSeen > DAY_IN_MS

    if (shouldShow) {
      setOpen(true)
    }
  }, [])

  function closeModal() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-video-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] bg-slate-950 shadow-2xl ring-1 ring-white/10">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-2xl leading-none text-white transition hover:bg-black/75"
          aria-label="Cerrar promoción"
        >
          x
        </button>

        <div>
          <div className="relative aspect-video rounded-t-[28px] bg-black">
            <video
              className="absolute inset-0 h-full w-full rounded-t-[28px] object-contain"
              autoPlay
              muted
              loop
              playsInline
              poster="/images/motorizacion-cortinas-promo.jpg"
            >
              <source
                src="/videos/motorizacion-cortinas-promo.webm"
                type="video/webm"
              />
              <source
                src="/videos/motorizacion-cortinas-promo.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          <div className="bg-slate-950 p-6 text-white sm:p-8 lg:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-400">
              Motorización DecoSun
            </p>

            <h2
              id="promo-video-title"
              className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl"
            >
              Controla tus cortinas con un toque
            </h2>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Motorización premium para espacios modernos con respaldo DecoSun.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/cotizar"
                onClick={closeModal}
                className="inline-flex justify-center rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
              >
                Cotizar motorización
              </Link>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
