import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import "./HomeIntro.css"

const SESSION_KEY = "decosun-light-intro-v1"

export default function HomeIntro({ children }) {
  const { pathname, hash } = useLocation()
  const [playing, setPlaying] = useState(false)
  const skipRef = useRef(null)
  const active = playing && pathname === "/" && !hash

  useEffect(() => {
    if (pathname !== "/" || hash) return
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (preference.matches) return
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return
    } catch { /* Storage can be unavailable in private or restricted browsers. */ }

    const frame = window.requestAnimationFrame(() => {
      setPlaying(true)
      try { window.sessionStorage.setItem(SESSION_KEY, "seen") } catch { /* Still show only on this mount. */ }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash])

  useEffect(() => {
    if (!active) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = "hidden"
    skipRef.current?.focus({ preventScroll: true })
    const finish = () => setPlaying(false)
    const onKey = event => { if (event.key === "Escape") finish() }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onPreference = event => { if (event.matches) finish() }
    // Release the page even if animation events do not arrive.
    const timeout = window.setTimeout(finish, 4600)
    window.addEventListener("keydown", onKey)
    preference.addEventListener("change", onPreference)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener("keydown", onKey)
      preference.removeEventListener("change", onPreference)
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [active])

  return (
    <>
      <div inert={active ? true : undefined}>{children}</div>
      {active && (
        <section className="decosun-intro" aria-label="Bienvenida a DecoSun">
          <div className="decosun-intro__panels" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <i key={index} style={{ "--panel": index }} />)}
          </div>
          <div className="decosun-intro__top">
            <span className="decosun-intro__brand">DECO<span>SUN</span></span>
            <button ref={skipRef} type="button" onClick={() => setPlaying(false)}>Saltar intro ↗</button>
          </div>
          <div className="decosun-intro__message">
            <p>NO ES SOLO UNA CORTINA.</p>
            <div className="decosun-intro__headline" aria-label="La luz lo cambia todo">
              <span aria-hidden="true">LA LUZ</span>
              <span aria-hidden="true">LO CAMBIA</span>
              <span aria-hidden="true">TODO<span className="decosun-intro__period">.</span></span>
            </div>
          </div>
          <div className="decosun-intro__flash" aria-hidden="true" />
          <div className="decosun-intro__bottom" aria-hidden="true">
            <span>AHORA, DÉJALA ENTRAR.</span><span>DECO SUN · TU ESPACIO, OTRA LUZ.</span>
          </div>
        </section>
      )}
    </>
  )
}
