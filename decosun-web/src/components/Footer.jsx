import logo from "../assets/images/logo-horizontal.png"
import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        
        {/* MARCA */}
        <div>
          <img
            src={logo}
            alt="Decosun"
            className="h-14 w-auto"
          />

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
            DecoSun desarrolla soluciones premium de control solar,
            automatización y diseño para hogares, oficinas e instituciones,
            integrando soporte técnico y presencia regional.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {[
              "Arica",
              "Iquique",
              "Antofagasta",
              "La Serena",
              "V región",
              "Santiago",
              "Temuco",
            ].map((city) => (
              <span
                key={city}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-md"
              >
                {city}
              </span>
            ))}
          </div>
        </div>

        {/* LINKS */}
        <div className="grid grid-cols-2 gap-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              Navegación
            </p>

            <div className="mt-5 flex flex-col gap-4 text-sm text-slate-300">
              <Link
                to="/"
                className="transition hover:text-amber-300"
              >
                Inicio
              </Link>

              <Link
                to="/soluciones"
                className="transition hover:text-amber-300"
              >
                Soluciones
              </Link>

              <Link
                to="/proyectos"
                className="transition hover:text-amber-300"
              >
                Proyectos
              </Link>

              <Link
                to="/nosotros"
                className="transition hover:text-amber-300"
              >
                Nosotros
              </Link>

              <Link
                to="/cotizar"
                className="transition hover:text-amber-300"
              >
                Cotizar
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
              DecoSun
            </p>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
              <p>
                Control solar premium
              </p>

              <p>
                Automatización y soluciones arquitectónicas
              </p>

              <p>
                Soporte técnico y presencia regional
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            © 2026 DecoSun · Decoración y control solar
          </p>

          <p>
            Diseño premium · Tecnología · Presencia regional
          </p>
        </div>
      </div>
    </footer>
  )
}
