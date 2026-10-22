import { createElement, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Link } from "react-router-dom"
import BrandSupport from "../components/BrandSupport"
import WhatsAppButton from "../components/WhatsAppButton"
import {
  BatteryCharging,
  ChevronDown,
  CircleCheck,
  Radio,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react"
import officeImage from "../assets/images/corporativo-oficina.jpeg"

const MotionDiv = motion.div

const integrationFeatures = [
  [Settings2, "Motor integrado"],
  [BatteryCharging, "Batería recargable según sistema"],
  [Radio, "Control remoto"],
]

const steps = [
  {
    title: "Conversión a motor",
    text: "Retiramos el mecanismo manual e integramos el motor tubular dentro del tubo de la cortina.",
    alt: "Técnico DecoSun integrando un motor tubular en el tubo de una cortina Roller existente",
  },
  {
    title: "Reinstalación",
    text: "Volvemos a instalar la Roller con un sistema limpio y sin cadena.",
    alt: "Técnico DecoSun reinstalando una cortina Roller motorizada sin cadena manual",
  },
  {
    title: "Configuración",
    text: "Configuramos el sistema y su conectividad cuando la solución instalada lo permite.",
    alt: "Técnico DecoSun vinculando una cortina Roller desde un smartphone durante la configuración",
  },
  {
    title: "Disfruta el control",
    text: "Controla tus cortinas de forma cómoda mediante control remoto o las opciones disponibles para tu sistema.",
    alt: "Persona usando un control remoto para accionar cortinas Roller en un living con vista al mar",
  },
]

const benefits = [
  ["Control remoto", "Sube, detén o baja tu cortina cómodamente mediante un mando."],
  ["Control desde smartphone", "Disponible cuando la solución instalada permite conectividad WiFi."],
  ["Motor integrado", "El motor tubular queda alojado dentro del tubo de la cortina."],
  ["Sin cadena", "La motorización reemplaza el mecanismo manual para un resultado visual más limpio."],
  ["Automatización", "Mayor comodidad en el control de la entrada de luz, según las opciones de tu sistema."],
]

// Funciones ya descritas en esta landing: su disponibilidad depende del sistema.
const configurationFeatures = ["Posición favorita", "Control individual o conjunto", "Velocidades y modo por impulsos", "Memoria de límites y posiciones"]

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
      initial={false}
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
    <WhatsAppButton
      inline
      message="Hola DecoSun, quiero saber si mis cortinas pueden motorizarse. Les envío una fotografía para evaluación."
      className={className}
    >
      {children}
    </WhatsAppButton>
  )
}

function MotorizationPhoto({ step, priority = false, sizes = "(min-width: 1280px) 608px, (min-width: 1024px) calc((100vw - 112px) / 2), calc(100vw - 48px)" }) {
  return (
    <img
      src={`/img/motorizacion/${step}MT-1280.jpg`}
      srcSet={`/img/motorizacion/${step}MT-640.jpg 640w, /img/motorizacion/${step}MT-1280.jpg 1280w`}
      sizes={sizes}
      width="1536"
      height="1024"
      alt={steps[step - 1].alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className="block h-auto w-full rounded-[28px] bg-slate-100 lg:rounded-[36px]"
    />
  )
}

export default function Motorizacion() {
  const [showSpecs, setShowSpecs] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <main className="bg-white text-slate-950">
      <section aria-labelledby="motorizacion-title" className="bg-slate-950 px-6 pb-16 pt-28 text-white lg:px-8 lg:pb-20 lg:pt-36">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 sm:text-sm">Tecnología para tu espacio · DecoSun</p>
            <h1 id="motorizacion-title" className="mt-5 text-[clamp(1.875rem,4.4vw,3.75rem)] font-black uppercase leading-[1.03] tracking-tight">
              <span className="text-amber-400">Motorización</span><br />de cortinas Roller
            </h1>
            <p className="mt-7 text-xl font-semibold leading-snug sm:text-2xl">Motoriza tus cortinas actuales<br />o elige nuevas roller a medida.</p>
            <p className="mt-5 text-base leading-7 text-slate-300">Motor tubular integrado · Control remoto · WiFi</p>
            <p className="mt-2 text-base font-semibold text-white">5 años de garantía en motores · 1 año en instalación.</p>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">Evaluamos la compatibilidad de tu Roller existente. Las opciones WiFi dependen de la solución instalada.</p>
            <WhatsAppLink className="mt-7 w-full sm:w-auto">Cotiza tu motorización</WhatsAppLink>
            <a href="#proceso-motorizacion" className="mt-5 flex min-h-11 w-fit items-center gap-3 text-sm font-bold text-white underline decoration-amber-400 underline-offset-8 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">De manual a motorizada <span aria-hidden="true">↓</span></a>
          </div>
          <figure className="min-w-0">
            <MotorizationPhoto step={4} priority sizes="(min-width: 1280px) 650px, (min-width: 1024px) 50vw, calc(100vw - 48px)" />
            <figcaption className="mt-4 border-l-2 border-amber-400 pl-4 text-sm leading-6 text-slate-300">Más comodidad. El control de la luz, en tus manos.</figcaption>
          </figure>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal><p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Comodidad cotidiana</p><h2 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">Beneficios que cambian tu día</h2></Reveal>
          <dl className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([title, text]) => (
              <div key={title} className="border-t border-slate-200 py-6">
                <dt className="text-lg font-black uppercase">{title}</dt>
                <dd className="mt-3 leading-7 text-slate-600">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="proceso-motorizacion" aria-labelledby="proceso-title" className="scroll-mt-28 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Tu cortina actual. Una nueva experiencia.</p>
            <h2 id="proceso-title" className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">De manual a motorizada</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Transformamos tu Roller existente en un sistema más cómodo e inteligente. El primer paso es evaluar su compatibilidad técnica.</p>
          </Reveal>
          <ol className="mt-12 grid gap-x-12 gap-y-14 lg:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.title}>
                <MotorizationPhoto step={index + 1} />
                <div className="mt-6 flex items-start gap-5">
                  <span className="text-3xl font-black sm:text-4xl tracking-tight text-amber-600" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight sm:text-2xl">{step.title}</h3>
                    <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-amber-700">Integración discreta</p>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl leading-tight tracking-tight md:text-5xl">
              La tecnología se integra en la cortina.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              El motor tubular queda alojado dentro del tubo de tu Roller, manteniendo una apariencia limpia y eliminando la cadena manual.
            </p>

            <p className="mt-4 text-sm leading-6 text-slate-500">La alimentación y las opciones de control se definen según el sistema compatible con tu cortina.</p>
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

          <Reveal delay={0.08}>
            <MotorizationPhoto step={1} sizes="(min-width: 1280px) 740px, (min-width: 1024px) 60vw, calc(100vw - 48px)" />
          </Reveal>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 text-white lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal><p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">Hogar + oficinas</p><h2 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">El control se adapta a tu espacio</h2></Reveal>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <article>
              <MotorizationPhoto step={4} />
              <h3 className="mt-6 text-2xl font-black uppercase">Hogar</h3>
              <p className="mt-3 max-w-xl text-lg leading-8 text-slate-300">En el living, dormitorio o departamento: ajusta la luz sin levantarte y disfruta de una integración discreta en tus espacios cotidianos.</p>
            </article>
            <article>
              <img src={officeImage} alt="Cortina Roller Dúo instalada en una oficina" width="960" height="1280" loading="lazy" decoding="async" className="aspect-[3/2] h-auto w-full rounded-[28px] object-cover lg:rounded-[36px]" />
              <h3 className="mt-6 text-2xl font-black uppercase">Oficinas / proyectos</h3>
              <p className="mt-3 max-w-xl text-lg leading-8 text-slate-300">Control de la luz para espacios de trabajo. Evaluamos las cortinas existentes y las opciones de accionamiento individual o conjunto según el sistema.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Reveal><p className="text-sm font-black uppercase tracking-[0.3em] text-amber-700">Servicio integral</p><h2 className="mt-4 text-3xl font-black sm:text-4xl uppercase tracking-tight md:text-5xl">La solución DecoSun</h2><p className="mt-4 text-lg text-slate-600">Respaldo, experiencia y servicio profesional.</p></Reveal>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {servicePillars.map(([Icon, title, text]) => <Reveal key={title} className="rounded-3xl bg-slate-50 p-6">{createElement(Icon, { className: "h-6 w-6 text-amber-600", "aria-hidden": true })}<h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></Reveal>)}
            </div>
          </div>
          <Reveal>
            <MotorizationPhoto step={2} />
          </Reveal>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-7 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Información técnica</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">Datos esenciales de la solución</h2><p className="mt-3 text-slate-600">Solución con batería recargable. Confirmamos la compatibilidad y las prestaciones según tela, peso, tubo y sistema instalado. Las opciones WiFi pueden tener especificaciones diferentes.</p></div>
            <button type="button" onClick={() => setShowSpecs((current) => !current)} aria-expanded={showSpecs} aria-controls="motorization-specs" className="inline-flex min-h-12 w-full min-w-0 items-center sm:w-auto sm:max-w-xs justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-wide transition-colors hover:border-amber-500 hover:text-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300/40">
              {showSpecs ? "Ocultar especificaciones" : "Ver especificaciones técnicas"}<ChevronDown className={`h-4 w-4 shrink-0 transition motion-reduce:transition-none ${showSpecs ? "rotate-180" : ""}`} />
            </button>
          </div>
          {showSpecs && (
            <div id="motorization-specs" className="mt-8">
              <dl className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
                {technicalSpecs.map(([label, value]) => <div key={label} className="flex flex-col gap-2 bg-white p-4 text-sm"><dt className="font-semibold text-slate-600">{label}</dt><dd className="font-black text-slate-900">{value}</dd></div>)}
              </dl>
              <h3 className="mt-6 font-black">Opciones de configuración</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Disponibilidad según la solución instalada. La conectividad WiFi se evalúa por separado.</p>
              <ul className="mt-3 grid list-inside list-disc gap-3 text-sm text-slate-600 sm:grid-cols-2">{configurationFeatures.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-5xl overflow-hidden rounded-[36px] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-10 lg:py-20">
          <Link to="/" aria-label="DecoSun.cl — ir al inicio" className="inline-block text-3xl font-black tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 sm:text-4xl">DECO<span className="text-amber-400">SUN</span>.CL</Link>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black sm:text-4xl uppercase tracking-tight md:text-5xl">¿Tu cortina puede motorizarse?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Envíanos una fotografía por WhatsApp y evaluamos la mejor solución para tu caso.</p>
          <WhatsAppLink className="mt-8 w-full sm:w-auto">Cotiza tu motorización</WhatsAppLink>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">Si puedes, incluye una fotografía completa de la cortina y otra del mecanismo lateral.</p>
        </Reveal>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-16" aria-labelledby="motorization-faq-title">
        <h2 id="motorization-faq-title" className="text-3xl font-black">Preguntas sobre motorización de cortinas roller</h2>
        <div className="mt-8 divide-y divide-slate-200">
          {[
            ["¿Se puede motorizar una cortina que ya tengo?", "Evaluamos la tela, el peso, el tubo y los componentes de tu roller para confirmar si es compatible y qué adaptación necesita. Puedes enviarnos fotografías para iniciar la evaluación."],
            ["¿Puedo encargar cortinas nuevas motorizadas?", "Sí. También confeccionamos cortinas roller a medida y evaluamos la motorización compatible con el producto elegido."],
            ["¿Todas las cortinas se controlan por WiFi?", "No. El control remoto y las opciones de conectividad dependen del motor y de la solución instalada. Confirmamos las funciones disponibles antes de preparar tu propuesta."],
            ["¿Qué garantía tiene la motorización?", "Los motores suministrados por DecoSun tienen 5 años de garantía y la instalación, 1 año. Al intervenir una cortina existente, estos plazos no otorgan una nueva garantía a la cortina anterior."],
            ["¿Dónde puedo solicitar el servicio?", "Atendemos en Iquique, la Región de Valparaíso y Santiago. También contamos con técnicos certificados por DecoSun en Arica, Copiapó, Vallenar, La Serena, Concepción y Temuco. Consulta disponibilidad para tu ubicación."],
          ].map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer text-lg font-bold">{question}</summary><p className="mt-4 leading-7 text-slate-600">{answer}</p></details>)}
        </div>
      </section>
      <BrandSupport motorization />
    </main>
  )
}
