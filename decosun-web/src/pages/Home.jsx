import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

import heroLogo from "../assets/images/logo-horizontal.png"

import hero1 from "../assets/images/home-03.jpg"
import hero2 from "../assets/images/black-outcalido.jpg"
import hero3 from "../assets/images/home-02.jpg"
import hero4 from "../assets/images/home-sunscreen-comedor.jpg"
import hero5 from "../assets/images/home-sunscreen-terraza.jpg"
import hero6 from "../assets/images/roller-doble02.jpg"
import hero7 from "../assets/images/screen-02.jpeg"

import rollerImg from "../assets/images/screen-02.jpeg"
import toldoImg from "../assets/images/toldo-proyectante-premium.png"
import duoImg from "../assets/images/duo-03.jpg"
import pergolaImg from "../assets/images/pergola-premium.png"
import redImg from "../assets/images/sucursal-iquique03.jpg"

export default function Home() {
  const heroImages = [hero1, hero2, hero3, hero4, hero5, hero6, hero7]
  const [currentHero, setCurrentHero] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) =>
        prev === heroImages.length - 1 ? 0 : prev + 1
      )
    }, 6500)

    return () => clearInterval(interval)
  }, [heroImages.length])

  const soluciones = [
    {
      title: "Cortinas Roller Screen",
      text: "Control solar, privacidad y luminosidad natural para espacios modernos.",
      image: rollerImg,
    },
    {
      title: "Toldos Proyectantes",
      text: "Protección exterior para terrazas, balcones y espacios al aire libre.",
      image: toldoImg,
    },
    {
      title: "Roller DÚO",
      text: "Diseño decorativo y regulación flexible de luz en un solo sistema.",
      image: duoImg,
    },
    {
      title: "Pérgolas Bioclimáticas",
      text: "Diseño exterior premium para terrazas de alto valor.",
      image: pergolaImg,
    },
  ]

  return (
    <main className="bg-white text-slate-950">
      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden bg-slate-950">
        {heroImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt="Decosun control solar"
            className={`absolute inset-0 h-full w-full object-cover scale-[1.03] transition-all duration-[7000ms] ${index === currentHero
              ? "opacity-75 scale-100"
              : "opacity-0 scale-105"
              }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="max-w-3xl lg:ml-4"
          >
            <div className="mb-10 flex justify-center lg:justify-start">
              <img
                src={heroLogo}
                alt="Decosun"
                className="h-28 w-auto lg:h-40"
              />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.35em] text-amber-400">
              Control solar premium · Presencia regional
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
              Soluciones premium
              <span className="block text-amber-400">
                de control solar
              </span>
              para proyectos en Chile.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              DecoSun integra asesoría, fabricación, instalación y
              soporte técnico a través de sucursales y representantes
              regionales, entregando productos bien terminados para hogares,
              empresas e instituciones.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/cotizar"
                className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-amber-400"
              >
                Cotizar ahora
              </Link>

              <Link
                to="/soluciones"
                className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-md transition duration-300 hover:bg-white/20"
              >
                Ver soluciones
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-4">
              {[
                ["Calidad premium", "Materiales seleccionados"],
                ["Tecnología", "Automatización disponible"],
                ["Diseño a medida", "Soluciones personalizadas"],
                ["Asesoría", "Acompañamiento técnico"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/5 bg-white/[0.06] p-5 shadow-xl backdrop-blur-xl transition duration-300 hover:bg-white/[0.08]"
                >
                  <p className="text-sm font-bold text-white">
                    {title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOLUCIONES */}
      <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              Diseño · tecnología · confort
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Soluciones diseñadas para habitar mejor los espacios
            </h2>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {soluciones.map((item) => (
              <motion.article
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                key={item.title}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg transition duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-56 w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="p-6">
                  <h3 className="text-lg font-black text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>

                  <Link
                    to="/soluciones"
                    className="mt-5 inline-flex text-sm font-bold uppercase tracking-wide text-amber-700"
                  >
                    Ver más →
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="bg-slate-950 px-6 py-20 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Presencia DecoSun
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Una red preparada para ejecutar proyectos.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Nuestra presencia se construye mediante sucursales,
              asesores regionales y soporte técnico coordinado,
              permitiendo atender proyectos residenciales,
              corporativos e institucionales en distintas zonas del país.
            </p>

            <Link
              to="/nosotros"
              className="mt-8 inline-flex rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 transition duration-300 hover:-translate-y-1 hover:bg-amber-400"
            >
              Conoce más
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["+10", "años de experiencia"],
              ["2", "sucursales activas"],
              ["3ª", "sucursal en proyección"],
              ["+10", "zonas con presencia comercial"],
            ].map(([number, label]) => (

              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="rounded-[32px] border border-white/5 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <p className="text-5xl font-black tracking-tight text-amber-400">
                  {number}
                </p>

                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-200">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COTIZADOR */}
      <section className="bg-amber-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              Nuestro proceso
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Transformamos tu proyecto de principio a fin
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Desde la primera visita hasta la instalación final, acompañamos cada etapa
              para entregar soluciones de control solar bien ejecutadas, con respaldo y
              atención profesional.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [
                "1",
                "Agenda una visita",
                "Coordinamos una evaluación comercial o técnica según las necesidades de tu espacio.",
              ],
              [
                "2",
                "Recibe tu propuesta",
                "Diseñamos una solución personalizada y preparamos una cotización clara y profesional.",
              ],
              [
                "3",
                "Fabricamos e instalamos",
                "Nuestro equipo produce, instala y entrega un proyecto terminado con respaldo DecoSun.",
              ],
            ].map(([num, title, text]) => (
              <div
                key={title}
                className="rounded-[30px] border border-amber-100 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white">
                  {num}
                </div>

                <h3 className="mt-6 text-2xl font-black text-slate-950">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/cotizar"
              className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-amber-400"
            >
              Cotizar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* RED DECOSUN */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[36px] bg-slate-950 shadow-2xl lg:grid-cols-2">
          <img
            src={redImg}
            alt="Red Decosun"
            className="h-full min-h-[420px] w-full object-cover opacity-90"
          />

          <div className="flex flex-col justify-center p-8 lg:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Red DecoSun
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
              Presencia regional con respaldo DecoSun.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              DecoSun expande su presencia mediante sucursales y
              asesores regionales, entregando soporte técnico, garantías,
              herramientas de venta y productos fabricados con terminaciones
              profesionales.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Arica",
                "Iquique",
                "Calama",
                "Tocopilla",
                "Antofagasta",
                "Copiapó",
                "Vallenar",
                "La Serena",
                "V Región",
                "Santiago",
                "Temuco",
              ].map((city) => (
                <span
                  key={city}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-md"
                >
                  {city}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/nosotros"
                className="inline-flex rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 transition duration-300 hover:-translate-y-1 hover:bg-amber-400"
              >
                Conoce más
              </Link>

              <Link
                to="/cotizar"
                className="inline-flex rounded-2xl border border-white/20 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition duration-300 hover:bg-white/10"
              >
                Solicitar cotización
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}