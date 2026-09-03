import { useState } from "react"
import logo from "../assets/images/logo-horizontal.png"
import { Link, NavLink, useLocation } from "react-router-dom"
import { ChevronDown } from "lucide-react"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false)
  const location = useLocation()
  const solutionsActive = location.pathname === "/soluciones" || location.pathname === "/motorizacion"

  const linkClass = ({ isActive }) =>
    `transition duration-300 hover:text-amber-300 ${
      isActive ? "text-amber-300" : "text-white/85"
    }`

  function closeMenu() {
    setOpen(false)
    setMobileSolutionsOpen(false)
  }

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4">
      <div className="mx-auto mt-3 flex h-16 max-w-7xl items-center justify-between rounded-full border border-white/10 bg-slate-950/70 px-5 shadow-2xl backdrop-blur-2xl lg:mt-4 lg:h-20 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex items-center">
          <img src={logo} alt="Decosun" className="h-10 w-auto lg:h-16" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold tracking-wide md:flex">
          <NavLink to="/" className={linkClass}>
            Inicio
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
            onFocus={() => setSolutionsOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSolutionsOpen(false)
            }}
          >
            <button
              type="button"
              onClick={() => setSolutionsOpen((current) => !current)}
              className={`flex items-center gap-1.5 transition duration-300 hover:text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${solutionsActive ? "text-amber-300" : "text-white/85"}`}
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
            >
              Soluciones
              <ChevronDown className={`h-4 w-4 transition ${solutionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            {solutionsOpen && (
              <div className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-5">
                <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-2xl">
                  <NavLink to="/soluciones" onClick={() => setSolutionsOpen(false)} className="block rounded-2xl px-4 py-3 text-white/85 transition hover:bg-white/10 hover:text-amber-300">
                    <span className="block font-bold">Ver todas las soluciones</span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-400">Explora el catálogo DecoSun</span>
                  </NavLink>
                  <NavLink to="/soluciones" onClick={() => setSolutionsOpen(false)} className="block rounded-2xl px-4 py-3 text-white/85 transition hover:bg-white/10 hover:text-amber-300">
                    Cortinas y control solar
                  </NavLink>
                  <NavLink to="/motorizacion" onClick={() => setSolutionsOpen(false)} className="block rounded-2xl px-4 py-3 text-white/85 transition hover:bg-white/10 hover:text-amber-300">
                    Motorización
                  </NavLink>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-slate-500" aria-disabled="true">
                    <span>Mantención y reparación</span>
                    <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide">Próximamente</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/cotizar" className={linkClass}>
            Cotizador
          </NavLink>

          <NavLink to="/nosotros" className={linkClass}>
            Nosotros
          </NavLink>

          <NavLink to="/proyectos" className={linkClass}>
            Proyectos
          </NavLink>

          <NavLink to="/agenda" className={linkClass}>
            Agenda
          </NavLink>

          <NavLink to="/login" className={linkClass}>
            Acceso equipo
          </NavLink>

          <Link
            to="/cotizar"
            className="rounded-full border border-amber-400/60 bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-400"
          >
            Cotizar
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
          aria-label="Abrir menú"
        >
          <span className="text-xl leading-none">
            {open ? "×" : "☰"}
          </span>
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold uppercase tracking-wide text-white">
            <NavLink to="/" onClick={closeMenu} className={linkClass}>
              Inicio
            </NavLink>

            <div>
              <button
                type="button"
                onClick={() => setMobileSolutionsOpen((current) => !current)}
                className={`flex min-h-11 w-full items-center justify-between text-left transition hover:text-amber-300 ${solutionsActive ? "text-amber-300" : "text-white"}`}
                aria-expanded={mobileSolutionsOpen}
              >
                Soluciones
                <ChevronDown className={`h-4 w-4 transition ${mobileSolutionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {mobileSolutionsOpen && (
                <div className="mt-2 flex flex-col gap-1 border-l border-amber-400/40 pl-4 text-xs normal-case tracking-normal">
                  <NavLink to="/soluciones" onClick={closeMenu} className="min-h-11 rounded-xl px-3 py-3 text-white/80 transition hover:bg-white/5 hover:text-amber-300">Ver todas las soluciones</NavLink>
                  <NavLink to="/soluciones" onClick={closeMenu} className="min-h-11 rounded-xl px-3 py-3 text-white/80 transition hover:bg-white/5 hover:text-amber-300">Cortinas y control solar</NavLink>
                  <NavLink to="/motorizacion" onClick={closeMenu} className="min-h-11 rounded-xl px-3 py-3 text-white/80 transition hover:bg-white/5 hover:text-amber-300">Motorización</NavLink>
                  <div className="flex min-h-11 items-center justify-between rounded-xl px-3 py-3 text-slate-500">
                    <span>Mantención y reparación</span><span className="text-[10px] uppercase">Próximamente</span>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to="/cotizar"
              onClick={closeMenu}
              className={linkClass}
            >
              Cotizador
            </NavLink>

            <NavLink
              to="/nosotros"
              onClick={closeMenu}
              className={linkClass}
            >
              Nosotros
            </NavLink>

            <NavLink
              to="/proyectos"
              onClick={closeMenu}
              className={linkClass}
            >
              Proyectos
            </NavLink>

            <NavLink
              to="/agenda"
              onClick={closeMenu}
              className={linkClass}
            >
              Agenda
            </NavLink>

            <NavLink
              to="/login"
              onClick={closeMenu}
              className={linkClass}
            >
              Acceso equipo
            </NavLink>

            <Link
              to="/cotizar"
              onClick={closeMenu}
              className="mt-2 rounded-2xl bg-amber-500 px-5 py-3 text-center text-sm font-black uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
            >
              Cotizar ahora
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
