import { useEffect, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import logo from "../assets/images/seo/logo-horizontal.png"

const links = [["/", "Inicio"], ["/soluciones", "Soluciones"], ["/guia-de-telas", "Guía de telas"], ["/motorizacion", "Motorización"], ["/proyectos", "Proyectos"], ["/nosotros", "Nosotros"]]

export default function PublicNavigation() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    const onEscape = event => { if (event.key === "Escape") { setOpen(false); document.getElementById("public-menu-toggle")?.focus() } }
    if (open) window.addEventListener("keydown", onEscape)
    return () => window.removeEventListener("keydown", onEscape)
  }, [open])
  const linkClass = ({ isActive }) => `min-h-11 flex items-center transition hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-amber-400 ${isActive ? "text-amber-300" : "text-white/90"}`
  return <header className="fixed left-0 top-0 z-50 w-full px-4"><div className="mx-auto mt-3 flex h-16 max-w-7xl items-center justify-between rounded-full border border-white/10 bg-slate-950/90 px-5 backdrop-blur-xl lg:mt-4 lg:h-20 lg:px-8"><Link to="/" onClick={() => setOpen(false)} aria-label="DecoSun · Inicio"><img src={logo} alt="DecoSun" className="h-10 w-auto lg:h-14" /></Link><nav className="hidden items-center gap-6 text-sm font-semibold xl:flex" aria-label="Navegación principal">{links.map(([path, label]) => <NavLink key={path} to={path} end={path === "/"} className={linkClass} aria-current={path === "/guia-de-telas" && pathname.startsWith("/telas/") ? "page" : undefined}>{label}</NavLink>)}<Link to="/cotizar" className="rounded-full bg-amber-400 px-6 py-3 text-slate-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-white">Cotizar</Link></nav><button id="public-menu-toggle" type="button" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-xl text-white focus-visible:outline-2 focus-visible:outline-amber-400 xl:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-controls="public-mobile-menu" aria-expanded={open} onClick={() => setOpen(current => !current)}>{open ? "×" : "☰"}</button></div>{open && <nav id="public-mobile-menu" aria-label="Navegación principal móvil" className="mx-auto mt-3 flex max-h-[75svh] max-w-7xl flex-col gap-1 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-5 text-sm font-semibold xl:hidden">{links.map(([path, label]) => <NavLink key={path} to={path} end={path === "/"} className={linkClass} onClick={() => setOpen(false)}>{label}</NavLink>)}<Link to="/cotizar" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-amber-400 px-6 py-3 text-center text-slate-950">Cotizar</Link></nav>}</header>
}
