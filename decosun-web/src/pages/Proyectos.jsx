import { Link } from "react-router-dom"
import heroImg from "../assets/images/sucursal-iquique.jpeg"
import residencialImg from "../assets/images/home-03.jpg"
import corporativoImg from "../assets/images/corporativo-DUO.jpeg"
import oficinaImg from "../assets/images/corporativo-oficina.jpeg"
import rollerImg from "../assets/images/roller-doble02.jpg"
import toldoImg from "../assets/images/toldo-proyectante1.jpeg"
import exteriorImg from "../assets/images/toldo-exterior.jpg"

export default function Proyectos() {
  const proyectos = [
    {
      titulo: "Proyecto residencial premium",
      descripcion:
        "Soluciones roller screen y blackout para espacios modernos con control solar, privacidad y diseño minimalista.",
      imagen: residencialImg,
      categoria: "Residencial",
    },
    {
      titulo: "Espacios corporativos con sistema DÚO",
      descripcion:
        "Instalaciones para oficinas y salas de reuniones con regulación flexible de luz y terminación profesional.",
      imagen: corporativoImg,
      categoria: "Corporativo",
    },
    {
      titulo: "Oficinas modernas y espacios ejecutivos",
      descripcion:
        "Sistemas DÚO y blackout pensados para privacidad, regulación de luz y diseño contemporáneo.",
      imagen: oficinaImg,
      categoria: "Oficinas",
    },
    {
      titulo: "Roller doble y control de privacidad",
      descripcion:
        "Combinación de screen y blackout para lograr luminosidad durante el día y privacidad total cuando se requiere.",
      imagen: rollerImg,
      categoria: "Roller doble",
    },
    {
      titulo: "Toldos proyectantes exteriores",
      descripcion:
        "Protección solar exterior para terrazas, balcones y fachadas, mejorando el confort de espacios abiertos.",
      imagen: toldoImg,
      categoria: "Exterior",
    },
    {
      titulo: "Terrazas y espacios exteriores",
      descripcion:
        "Soluciones pensadas para ampliar el uso de patios, terrazas y espacios sociales al aire libre.",
      imagen: exteriorImg,
      categoria: "Terrazas",
    },
  ]

  return (
    <main className="bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src={heroImg}
          alt="Sucursal Decosun"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />

        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
              Proyectos Decosun
            </p>

            <h1 className="mt-5 text-5xl font-bold tracking-tight lg:text-6xl">
              Espacios transformados
              <span className="text-amber-400">
                {" "}
                con diseño y control solar.
              </span>
            </h1>

            <p className="mt-8 text-lg leading-8 text-slate-300">
              Cada proyecto representa una combinación entre funcionalidad,
              estética y soluciones técnicas adaptadas a hogares, oficinas,
              espacios corporativos y exteriores.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Galería de trabajos
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">
            Soluciones instaladas en distintos tipos de espacios
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Trabajamos con soluciones a medida para mejorar el confort, la
            privacidad y la estética de cada ambiente.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto) => (
            <article
              key={proyecto.titulo}
              className="group overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-white/10"
            >
              <div className="relative h-[320px] overflow-hidden">
                <img
                  src={proyecto.imagen}
                  alt={proyecto.titulo}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  {proyecto.categoria}
                </span>
              </div>

              <div className="p-8">
                <h2 className="text-2xl font-bold text-white">
                  {proyecto.titulo}
                </h2>

                <p className="mt-4 leading-7 text-slate-300">
                  {proyecto.descripcion}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Decosun
          </p>

          <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight">
            Diseñamos soluciones para hogares, oficinas y espacios exteriores.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Cada proyecto es desarrollado de manera personalizada, considerando
            estética, funcionalidad, privacidad, protección solar y condiciones
            reales de instalación.
          </p>

          <Link to="/cotizar"
            className="mt-10 rounded-2xl bg-amber-500 px-8 py-4 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Solicitar cotización
          </Link>
        </div>
      </section>
    </main>
  )
}