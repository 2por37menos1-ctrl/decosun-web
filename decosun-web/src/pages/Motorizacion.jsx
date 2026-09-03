import { createElement, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  BatteryCharging,
  ChevronDown,
  CircleCheck,
  Gauge,
  Heart,
  Layers3,
  Radio,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from "lucide-react"
import bedroomImage from "../assets/images/roller-blackout-dormitorio.jpg"
import apartmentImage from "../assets/images/home-sunscreen-comedor.jpg"
import officeImage from "../assets/images/corporativo-oficina.jpeg"
import windowsImage from "../assets/images/roller-sunscreen-vista.jpg"
import secondHomeImage from "../assets/images/home-sunscreen-terraza2.jpg"
import technicianPlaceholder from "../assets/images/sucursal-iquique03.jpg"

const MotionDiv = motion.div

const heroOptions = [
  { id: 1, label: "Coastal Kitchen", src: "/img/motorizacion-hero/motorization-hero-01-coastal-kitchen.png", objectPosition: "center center" },
  { id: 2, label: "Coastal Living", src: "/img/motorizacion-hero/motorization-hero-02-coastal-living.png", objectPosition: "center center" },
  { id: 3, label: "Real Balcony", src: "/img/motorizacion-hero/motorization-hero-03-real-balcony.png", objectPosition: "center center" },
  { id: 4, label: "Urban Balcony", src: "/img/motorizacion-hero/motorization-hero-04-urban-balcony.png", objectPosition: "center center" },
  { id: 5, label: "Bedroom Ocean", src: "/img/motorizacion-hero/motorization-hero-05-bedroom-ocean.png", objectPosition: "center center" },
  { id: 6, label: "Ocean Living", src: "/img/motorizacion-hero/motorization-hero-06-ocean-living.png", objectPosition: "center center" },
  { id: 7, label: "Corner Ocean", src: "/img/motorizacion-hero/motorization-hero-07-corner-ocean.png", objectPosition: "center center" },
]

const whatsappUrl = `https://wa.me/56929307614?text=${encodeURIComponent(
  "Hola DecoSun, quiero saber si mis cortinas pueden motorizarse. Les envío una fotografía para evaluación.",
)}`

const heroBenefits = [
  [BatteryCharging, "Batería recargable"],
  [Radio, "Control remoto"],
  [Heart, "Posición favorita"],
  [Layers3, "Una o varias cortinas"],
  [SlidersHorizontal, "Movimiento configurable"],
]

const integrationFeatures = [
  [Settings2, "Motor integrado"],
  [BatteryCharging, "Batería recargable"],
  [Radio, "Control remoto"],
]

const steps = [
  "Evaluamos tu cortina",
  "Instalamos el motor dentro del tubo",
  "Configuramos límites y posición favorita",
  "Controlas mediante control remoto",
  "Disfrutas mayor comodidad cada día",
]

const benefits = [
  [Radio, "Control sin esfuerzo", "Sube, detén o baja tu cortina con un toque."],
  [Heart, "Tu posición favorita", "Guarda una posición intermedia para volver a ella fácilmente."],
  [Layers3, "Una o varias cortinas", "Control individual o conjunto según la configuración."],
  [Gauge, "Movimiento configurable", "Diferentes velocidades y modo por impulsos permiten un ajuste más preciso."],
  [BatteryCharging, "Batería recargable", "Motor con batería integrada y sistema de carga."],
  [Settings2, "Configuración que permanece", "Los límites y posiciones configuradas quedan almacenados en el sistema."],
]

const applications = [
  [windowsImage, "Grandes ventanales", "Comodidad en cortinas de mayores dimensiones."],
  [bedroomImage, "Dormitorios", "Apertura y cierre sin tener que levantarte."],
  [apartmentImage, "Departamentos", "Control práctico y elegante para el uso diario."],
  [officeImage, "Oficinas", "Acciona múltiples cortinas de forma coordinada."],
  [secondHomeImage, "Segunda vivienda", "Mayor comodidad y una experiencia de uso más simple."],
]

const servicePillars = [
  [CircleCheck, "Evaluación técnica", "Revisamos tu cortina y recomendamos la solución adecuada."],
  [Wrench, "Instalación profesional", "Montaje, configuración y prueba completa del sistema."],
  [ShieldCheck, "Garantía y postventa", "Respaldo DecoSun en instalación y productos suministrados."],
  [Sparkles, "Asesoría personalizada", "Te acompañamos desde la evaluación hasta el uso del sistema."],
]

const technicalSpecs = [
  ["Torque nominal", "1,1 N·m"],
  ["Capacidad indicada", "Hasta 5,5 kg, sujeta a evaluación"],
  ["Velocidades", "20 / 24 / 28 rpm"],
  ["Carga", "USB 5V"],
  ["Radiofrecuencia", "433,92 MHz"],
  ["Operación continua máxima", "6 minutos"],
  ["Temperatura de trabajo", "-10 °C a +60 °C"],
  ["Alimentación", "Batería de litio integrada"],
]

function Reveal({ children, className = "", delay = 0 }) {
  const reduceMotion = useReducedMotion()
  return (
    <MotionDiv
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </MotionDiv>
  )
}

function WhatsAppLink({ children, className = "" }) {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-500 px-7 py-4 text-center text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-300/50 ${className}`}
      aria-label={`${children} (abre WhatsApp en una pestaña nueva)`}
    >
      {children}
    </a>
  )
}

export default function Motorizacion() {
  const [showSpecs, setShowSpecs] = useState(false)
  const [selectedHero, setSelectedHero] = useState(3)
  const activeHero = heroOptions.find((option) => option.id === selectedHero) || heroOptions[2]

  useEffect(() => {
    const previousTitle = document.title
    const description = "Motorización de cortinas roller DecoSun. Transforma tus cortinas manuales con control remoto, batería recargable, instalación profesional y soporte especializado."
    let meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute("content") || ""

    document.title = "Motorización de Cortinas Roller | DecoSun"
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "description")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", description)

    return () => {
      document.title = previousTitle
      if (meta) meta.setAttribute("content", previousDescription)
    }
  }, [])

  return (
    <main className="overflow-x-clip bg-white text-slate-950">
      <section className="relative min-h-[88svh] overflow-hidden bg-slate-950 px-6 pb-16 pt-28 text-white lg:px-8 lg:pb-20 lg:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(245,158,11,0.12),transparent_36%)]" />
        <div className="relative mx-auto grid min-h-[calc(88svh-9rem)] max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-400 sm:text-sm">Motorización DecoSun</p>
            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Tu cortina actual.<br /><span className="text-amber-400">Ahora motorizada.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              La solución DecoSun para transformar cortinas roller manuales en sistemas motorizados con control remoto, batería recargable y configuración profesional.
            </p>
            <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
              {heroBenefits.map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-200 sm:text-sm">
                  {createElement(Icon, { className: "h-4 w-4 shrink-0 text-amber-400", "aria-hidden": true })}{label}
                </div>
              ))}
            </div>
            <WhatsAppLink className="mt-9 w-full sm:w-auto">Quiero motorizar mis cortinas</WhatsAppLink>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">Envíanos una foto de tu cortina y evaluamos la solución adecuada.</p>
          </Reveal>

          <Reveal className="relative" delay={0.12}>
            <div className="absolute -inset-4 rounded-[42px] bg-amber-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 shadow-2xl lg:rounded-[42px]">
              <img
                src={activeHero.src}
                alt={`Ambiente ${activeHero.label} con cortinas roller motorizadas`}
                className="h-[420px] w-full object-cover sm:h-[560px] lg:h-[650px]"
                style={{ objectPosition: activeHero.objectPosition }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 right-5 text-sm font-semibold text-white/90">Comodidad integrada, sin alterar la estética de tu espacio.</p>
            </div>

            {/* TEMP HERO REVIEW SELECTOR */}
            {/* Remove before production once final hero is approved. */}
            <div className="relative mt-4" aria-label="Selector temporal de imagen principal">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Revisión de hero · {activeHero.label}</p>
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Opciones de imagen del hero">
                {heroOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedHero(option.id)}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                      selectedHero === option.id
                        ? "border-amber-400 bg-amber-400 text-slate-950"
                        : "border-white/15 bg-white/5 text-slate-300 hover:border-amber-400/70 hover:text-amber-300"
                    }`}
                    aria-label={`Mostrar opción ${String(option.id).padStart(2, "0")}: ${option.label}`}
                    aria-pressed={selectedHero === option.id}
                    title={option.label}
                  >
                    {String(option.id).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-700">Un proceso claro</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">¿Cómo funciona?</h2>
            <p className="mt-4 text-lg text-slate-600">Tecnología que se adapta a tu cortina actual.</p>
          </Reveal>
          <div className="relative mt-14 grid gap-5 lg:grid-cols-5">
            <div className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-amber-300 lg:block" />
            {steps.map((step, index) => (
              <Reveal key={step} className="relative flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 lg:block lg:border-0 lg:p-0" delay={index * 0.05}>
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-amber-400 ring-8 ring-white">{String(index + 1).padStart(2, "0")}</span>
                <p className="self-center font-bold leading-6 text-slate-800 lg:mt-6 lg:pr-5">{step}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-700">Integración discreta</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              La tecnología queda oculta.<br />La comodidad, no.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              El motor se instala dentro del tubo de tu cortina roller, manteniendo prácticamente intacta su apariencia.
            </p>

            <div className="mt-9 space-y-4">
              {integrationFeatures.map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-4 border-b border-slate-200 pb-4 last:border-0 last:pb-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    {createElement(Icon, { className: "h-5 w-5", "aria-hidden": true })}
                  </span>
                  <span className="font-black text-slate-900">{label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="relative overflow-hidden rounded-[32px] bg-slate-900 shadow-xl lg:rounded-[40px]" delay={0.08}>
            <img
              src="/img/roller-sunscreen-dormitorio.jpg"
              alt="Cortinas roller instaladas en un dormitorio con vista al mar"
              className="h-[380px] w-full object-cover sm:h-[500px] lg:h-[590px]"
              style={{ objectPosition: "68% center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/10" />

            <div className="absolute right-[7%] top-[19%] flex max-w-[12rem] items-start gap-2 sm:right-[10%] sm:top-[16%] sm:max-w-none">
              <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400 ring-4 ring-slate-950/30" />
              <div>
                <div className="h-px w-12 bg-amber-400/90 sm:w-20" />
                <p className="mt-2 rounded-lg bg-slate-950/80 px-3 py-2 text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-white backdrop-blur-sm sm:text-xs">
                  Motor integrado dentro del tubo
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center"><p className="text-sm font-black uppercase tracking-[0.3em] text-amber-700">Comodidad cotidiana</p><h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">Beneficios que cambian tu día</h2></Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([Icon, title, text], index) => (
              <Reveal key={title} className="rounded-[28px] border border-slate-200 p-7" delay={(index % 3) * 0.05}>
                {createElement(Icon, { className: "h-7 w-7 text-amber-600", "aria-hidden": true })}<h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 text-white lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal><p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">Aplicaciones</p><h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">Especialmente útil en</h2></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {applications.map(([image, title, text], index) => (
              <Reveal key={title} className={`group overflow-hidden rounded-[26px] border border-white/10 bg-white/5 ${index === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`} delay={index * 0.04}>
                <img src={image} alt={`${title}: aplicación de cortinas roller motorizables`} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-5"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Reveal><p className="text-sm font-black uppercase tracking-[0.3em] text-amber-700">Servicio integral</p><h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">La solución DecoSun</h2><p className="mt-4 text-lg text-slate-600">Respaldo, experiencia y servicio profesional.</p></Reveal>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {servicePillars.map(([Icon, title, text]) => <Reveal key={title} className="rounded-3xl bg-slate-50 p-6">{createElement(Icon, { className: "h-6 w-6 text-amber-600", "aria-hidden": true })}<h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></Reveal>)}
            </div>
          </div>
          <Reveal className="overflow-hidden rounded-[36px] bg-slate-100">
            {/* TODO: reemplazar con fotografía oficial de un técnico DecoSun instalando una motorización. */}
            <img src={technicianPlaceholder} alt="Espacio de referencia para futura fotografía oficial del servicio técnico DecoSun" className="h-[480px] w-full object-cover" />
            <p className="px-5 py-4 text-xs text-slate-500">Imagen referencial. Pendiente fotografía oficial del servicio de motorización.</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-7 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Información técnica</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">Datos esenciales de la solución</h2><p className="mt-3 text-slate-600">Capacidad sujeta a evaluación técnica según tela, peso, tubo y configuración.</p></div>
            <button type="button" onClick={() => setShowSpecs((current) => !current)} aria-expanded={showSpecs} aria-controls="motorization-specs" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-wide transition hover:border-amber-500 hover:text-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300/40">
              {showSpecs ? "Ocultar especificaciones" : "Ver especificaciones técnicas"}<ChevronDown className={`h-4 w-4 transition ${showSpecs ? "rotate-180" : ""}`} />
            </button>
          </div>
          {showSpecs && <div id="motorization-specs" className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">{technicalSpecs.map(([label, value]) => <div key={label} className="flex justify-between gap-4 bg-white p-4 text-sm"><span className="font-semibold text-slate-600">{label}</span><span className="text-right font-black text-slate-900">{value}</span></div>)}</div>}
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-5xl overflow-hidden rounded-[36px] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-10 lg:py-20">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">Evaluación sin compromiso</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black uppercase tracking-tight md:text-5xl">¿Tu cortina puede motorizarse?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Envíanos una fotografía por WhatsApp y evaluamos la mejor solución para tu caso.</p>
          <WhatsAppLink className="mt-8 w-full sm:w-auto">Enviar foto por WhatsApp</WhatsAppLink>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">Si puedes, incluye una fotografía completa de la cortina y otra del mecanismo lateral.</p>
        </Reveal>
      </section>
    </main>
  )
}
