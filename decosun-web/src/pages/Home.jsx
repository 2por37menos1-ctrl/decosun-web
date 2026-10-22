import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

import { supabase } from "../lib/supabase"
import BrandSupport from "../components/BrandSupport"
import { coverageCities } from "../lib/siteSeo"

import heroLogo from "../assets/images/seo/logo-horizontal.png"

import hero2 from "../assets/images/seo/black-outcalido.jpg"

import rollerImg from "../assets/images/screen-02.jpeg"
import verticalImg from "../assets/images/persiana-vertical-living.jpeg"
import duoImg from "../assets/images/seo/duo-03.jpg"

import redImg from "../assets/images/seo/sucursal-iquique03.jpg"

const MotionDiv = motion.div
const MotionArticle = motion.article

export default function Home() {
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadActivity() {
      const { data, error } = await supabase.from("public_site_activity").select("*").single()
      if (!cancelled && !error && data) setActivity(data)
    }
    loadActivity()
    return () => { cancelled = true }
  }, [])

  const soluciones = [
    { title: "Motorización de cortinas roller", text: "Transforma tus cortinas existentes o encarga nuevas roller motorizadas. Compatibilidad sujeta a evaluación técnica.", image: "/img/motorizacion/4MT-640.jpg", to: "/motorizacion", cta: "Conocer motorización →" },
    { title: "Roller blackout a medida", text: "Oscurecimiento y privacidad para dormitorios y espacios de descanso.", image: hero2, to: "/soluciones#roller-blackout" },
    { title: "Roller sunscreen a medida", text: "Control de luz y reflejos, con conexión visual al exterior.", image: rollerImg, to: "/soluciones#roller-sunscreen" },
    { title: "Cortinas roller DÚO", text: "Franjas translúcidas y opacas para regular la luz y la privacidad.", image: duoImg, to: "/soluciones#roller-duo" },
    { title: "Persianas verticales", text: "Control direccional de luz para oficinas y grandes ventanales.", image: verticalImg, to: "/soluciones#persianas-verticales" },
    { title: "Mantención y limpieza de roller", text: "Revisión de mecanismos y limpieza de telas sunscreen, con retiro y reinstalación según evaluación.", image: "/img/mantencion/3M-640.jpg", to: "/mantencion" },
  ]

  return (
    <main className="bg-white text-slate-950">


      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden bg-slate-950">
        <img
          src="/img/motorizacion/4MT-1280.jpg"
          srcSet="/img/motorizacion/4MT-640.jpg 640w, /img/motorizacion/4MT-1280.jpg 1280w"
          sizes="100vw"
          width="1536" height="1024" fetchPriority="high" decoding="async"
          alt="Control remoto de cortinas roller motorizadas en un living"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-20 lg:px-8">
          <MotionDiv
            initial={false}
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
              CONTROL SOLAR · AUTOMATIZACIÓN · CONFORT
            </p>

            <h1 className="mt-6 text-[clamp(2rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight text-white">
              Motorización de cortinas
              <span className="block text-amber-400">
                y roller a medida.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Motoriza tus cortinas o elige roller blackout, sunscreen y DÚO
              confeccionadas a medida. Atención en Iquique, la Región de
              Valparaíso y Santiago, con respaldo técnico regional DecoSun.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/motorizacion"
                className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-amber-400"
              >
                Conocer motorización
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
                ["Soluciones a medida", "Diseñadas para cada espacio y necesidad."],
                ["Automatización inteligente", "Control, comodidad y tecnología integrada."],
                ["Terminaciones premium", "Materiales seleccionados y diseño profesional."],
                ["Acompañamiento experto", "Asesoría, instalación y soporte DecoSun."],
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
          </MotionDiv>
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

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {soluciones.map((item) => (
              <MotionArticle
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                key={item.title}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg transition duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy" decoding="async"
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
                    to={item.to || "/soluciones"}
                    className="mt-5 inline-flex text-sm font-bold uppercase tracking-wide text-amber-700"
                  >
                    {item.cta || "Ver más →"}
                  </Link>
                </div>
              </MotionArticle>
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

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["+10", "años de experiencia"],
              ["Iquique", "tienda con atención al público"],
              ["V Región", "taller y atención en terreno"],
              ["Santiago", "fábrica principal"],
            ].map(([number, label]) => (
              <MotionDiv
                key={label}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="rounded-[32px] border border-white/5 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <p className="text-2xl font-black tracking-tight text-amber-400">
                  {number}
                </p>

                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-200">
                  {label}
                </p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* DECOSUN EN MOVIMIENTO */}
      {activity && <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              DecoSun en movimiento
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Actividad real de nuestra red comercial
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Nuestro equipo trabaja diariamente en distintas regiones del país,
              coordinando visitas, fabricación e instalación de proyectos con respaldo técnico DecoSun.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              [activity.active_projects, "proyectos activos"],
              [activity.active_regions, "regiones activas"],
              [activity.closed_last_30_days, "proyectos finalizados en los últimos 30 días"],
              [activity.scheduled_visits, "visitas programadas"],
            ].map(([number, label]) => (
              <MotionDiv
                key={label}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <p className="text-5xl font-black tracking-tight text-amber-600">
                  {number}
                </p>

                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {label}
                </p>
              </MotionDiv>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500">
            Información resumida desde nuestro sistema interno de gestión. No se muestran datos de clientes,
            valores comerciales ni información privada de proyectos.
          </p>
        </div>
      </section>

      }
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
              Tienda en Iquique, taller sin atención al público en la V Región
              y fábrica principal en Santiago. Nuestra red de técnicos
              certificados por DecoSun cuenta con formación, pruebas en terreno
              y respaldo continuo de la marca.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {coverageCities.map((city) => (
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
      <BrandSupport />
    </main>
  )
}
