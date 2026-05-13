import logo from "../assets/images/logo-horizontal.png"
import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

        {/* LOGO */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="Decosun"
            className="h-16 w-auto lg:h-20"
          />
        </Link>

        {/* MENU */}
        <nav className="hidden items-center gap-6 text-sm font-semibold tracking-wide text-white md:flex">
          
          <Link
            to="/"
            className="transition duration-300 hover:text-amber-300"
          >
            Inicio
          </Link>

          <Link
            to="/soluciones"
            className="transition duration-300 hover:text-amber-300"
          >
            Soluciones
          </Link>

          <Link
            to="/cotizar"
            className="transition duration-300 hover:text-amber-300"
          >
            Cotizador
          </Link>

          <Link
            to="/nosotros"
            className="transition duration-300 hover:text-amber-300"
          >
            Nosotros
          </Link>

          <Link
            to="/proyectos"
            className="transition duration-300 hover:text-amber-300"
          >
            Proyectos
          </Link>

          <Link
            to="/cotizar"
            className="rounded-2xl border border-amber-400/60 bg-amber-500/10 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-amber-500 hover:text-black"
          >
            Cotizar ahora
          </Link>

        </nav>
      </div>
    </header>
  )
}