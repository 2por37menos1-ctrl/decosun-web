import { useState } from "react"
import logo from "../assets/images/logo-horizontal.png"
import { Link, NavLink } from "react-router-dom"

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `transition duration-300 hover:text-amber-300 ${
      isActive ? "text-amber-300" : "text-white/85"
    }`

  function closeMenu() {
    setOpen(false)
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

          <NavLink to="/soluciones" className={linkClass}>
            Soluciones
          </NavLink>

          <NavLink to="/cotizar" className={linkClass}>
            Cotizador
          </NavLink>

          <NavLink to="/nosotros" className={linkClass}>
            Nosotros
          </NavLink>

          <NavLink to="/proyectos" className={linkClass}>
            Proyectos
          </NavLink>
            <NavLink to="/login" className={linkClass}>
            
            <NavLink to="/agenda" className={linkClass}>
  Agenda
</NavLink>
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
          <span className="text-xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="mx-auto mt-3 max-w-7xl rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold uppercase tracking-wide text-white">
            <NavLink to="/" onClick={closeMenu} className={linkClass}>
              Inicio
            </NavLink>

            <NavLink to="/soluciones" onClick={closeMenu} className={linkClass}>
              Soluciones
            </NavLink>

            <NavLink to="/cotizar" onClick={closeMenu} className={linkClass}>
              Cotizador
            </NavLink>

            <NavLink to="/nosotros" onClick={closeMenu} className={linkClass}>
              Nosotros
            </NavLink>

            <NavLink to="/proyectos" onClick={closeMenu} className={linkClass}>
              Proyectos
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