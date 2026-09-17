import { useEffect } from "react"
import { Link } from "react-router-dom"
import WhatsAppButton from "../components/WhatsAppButton"

const steps = [
  {
    title: "Desmontaje", width: 1145, height: 1374,
    alt: "Técnico DecoSun desmontando manualmente una cortina Roller Screen en una oficina",
    text: "Retiramos cuidadosamente las cortinas desde tus instalaciones, resguardando sus telas y componentes.",
  },
  {
    title: "Traslado al taller", width: 1145, height: 1374,
    alt: "Técnico DecoSun trasladando cortinas Roller enrolladas y aseguradas desde un edificio",
    text: "Las trasladamos enrolladas y aseguradas a nuestro taller para realizar el servicio técnico.",
  },
  {
    title: "Limpieza profunda", width: 1312, height: 1199,
    alt: "Limpieza con agua de una tela Screen vertical y barra inferior separada en el taller DecoSun",
    text: "Limpiamos en profundidad la tela Screen con agua y equipo profesional, y la barra inferior por separado.",
  },
  {
    title: "Revisión y ajuste", width: 1312, height: 1199,
    alt: "Técnico revisando mecanismos, cadenas y componentes sobre un mesón del taller DecoSun",
    text: "Revisamos, ajustamos y reemplazamos componentes cuando corresponde. Probamos la subida, bajada y funcionamiento en el probador de pared.",
  },
  {
    title: "Reinstalación", width: 1312, height: 1199,
    alt: "Técnico DecoSun reinstalando una cortina Roller limpia en una sala de reuniones corporativa",
    text: "Devolvemos e instalamos nuevamente las cortinas, limpias y mantenidas, listas para seguir funcionando.",
  },
]

const workshopServices = [
  "Limpieza de telas Screen y barras inferiores",
  "Revisión de mecanismos y cambio de cadenas",
  "Reemplazo de componentes defectuosos",
  "Instalación de zunchos de agarre",
  "Fabricación o reemplazo de barras inferiores",
  "Ajuste y prueba de funcionamiento",
]

function ServicePhoto({ step, priority = false, sizes = "(min-width: 1024px) 600px, calc(100vw - 48px)" }) {
  const photo = steps[step - 1]
  return (
    <img
      src={`/img/mantencion/${step}M-1280.jpg`}
      srcSet={`/img/mantencion/${step}M-640.jpg 640w, /img/mantencion/${step}M-1280.jpg 1280w`}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className="block h-auto w-full rounded-[28px] bg-slate-100 lg:rounded-[36px]"
    />
  )
}

function QuoteButton() {
  return (
    <WhatsAppButton inline message="Hola DecoSun, quiero cotizar el servicio de mantención de cortinas Roller para un espacio profesional. Les comparto fotografías, ubicación y cantidad aproximada de cortinas para su evaluación.">
      Cotiza tu servicio
    </WhatsAppButton>
  )
}

export default function Mantencion() {
  useEffect(() => {
    const previousTitle = document.title
    const existingMeta = document.querySelector('meta[name="description"]')
    const meta = existingMeta || document.createElement("meta")
    const previousDescription = meta.getAttribute("content")
    document.title = "Mantención de Cortinas Roller | DecoSun"
    meta.setAttribute("name", "description")
    meta.setAttribute("content", "Servicio profesional de mantención, limpieza y reparación de cortinas Roller para oficinas, edificios e instituciones. DecoSun.")
    if (!existingMeta) document.head.appendChild(meta)
    window.scrollTo(0, 0)

    return () => {
      document.title = previousTitle
      if (!existingMeta) meta.remove()
      else if (previousDescription === null) meta.removeAttribute("content")
      else meta.setAttribute("content", previousDescription)
    }
  }, [])

  return (
    <main className="bg-white text-slate-950">
      <section aria-labelledby="mantencion-title" className="bg-slate-950 px-6 pb-16 pt-28 text-white lg:px-8 lg:pb-20 lg:pt-36">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-400 sm:text-sm">Servicio técnico · DecoSun</p>
            <h1 id="mantencion-title" className="mt-6 text-[clamp(2rem,5vw,4.5rem)] font-black uppercase leading-[1.03] tracking-tight">
              <span className="text-amber-400">Mantención</span><br />de cortinas Roller
            </h1>
            <p className="mt-7 text-xl font-semibold leading-snug sm:text-2xl">Tu espacio siempre<br />en las mejores condiciones.</p>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Servicio profesional de limpieza, revisión y mantención para oficinas, edificios y espacios corporativos.</p>
            <div className="mt-8 flex flex-col items-stretch gap-5 sm:items-start">
              <QuoteButton />
              <a href="#proceso-mantencion" className="inline-flex min-h-11 items-center justify-center gap-4 text-sm font-bold uppercase tracking-wide text-white underline decoration-amber-400 underline-offset-8 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">Conoce el proceso <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <ServicePhoto step={5} priority />
        </div>
      </section>

      <section aria-label="Beneficios de la mantención" className="border-b border-slate-200 px-6 py-10 lg:px-8">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {["Más higiene", "Mayor vida útil", "Espacios profesionales", "Mejor funcionamiento"].map((benefit) => (
            <li key={benefit} className="border-l-2 border-amber-500 pl-4 text-base font-bold sm:text-lg">{benefit}</li>
          ))}
        </ul>
      </section>

      <section id="proceso-mantencion" aria-labelledby="proceso-title" className="scroll-mt-28 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">De tus instalaciones a nuestro taller. Y de vuelta.</p>
          <h2 id="proceso-title" className="mt-4 max-w-3xl text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl lg:text-5xl">Un proceso completo<br />de principio a fin</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Nos hacemos cargo de cada etapa para recuperar la limpieza, presentación y funcionamiento de tus cortinas.</p>
          <ol className="mt-14 space-y-16 lg:space-y-20">
            {steps.map((step, index) => (
              <li key={step.title} className="grid items-center gap-7 border-t border-slate-200 pt-10 lg:grid-cols-2 lg:gap-20 lg:pt-16">
                <div className={index % 2 ? "lg:order-2" : ""}>
                  <ServicePhoto step={index + 1} />
                </div>
                <div className={`max-w-lg ${index % 2 ? "lg:order-1" : ""}`}>
                  <span className="text-5xl font-black tracking-tight text-amber-600 lg:text-7xl" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-4 text-2xl font-black uppercase tracking-tight sm:text-3xl">{step.title}</h3>
                  <p className="mt-4 text-lg leading-8 text-slate-600">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="taller-title" className="bg-slate-950 px-6 py-20 text-white lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-400">Capacidad técnica</p>
            <h2 id="taller-title" className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">Qué hacemos<br />en el taller</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Cada cortina tiene necesidades distintas. Los trabajos se realizan según evaluación y necesidad; no todos son obligatorios en cada mantención.</p>
            <ul className="mt-7 divide-y divide-white/15">
              {workshopServices.map((service) => <li key={service} className="flex gap-3 py-4 leading-6"><span className="text-amber-400" aria-hidden="true">—</span>{service}</li>)}
            </ul>
          </div>
          <ServicePhoto step={4} />
        </div>
      </section>

      <section aria-labelledby="espacios-title" className="px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Empresas e instituciones</p>
            <h2 id="espacios-title" className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">Pensado para espacios profesionales</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">En DecoSun integramos control solar, fabricación, mantención, reparación y recuperación de cortinas Roller. Coordinamos el retiro y la reinstalación considerando las necesidades de tu espacio.</p>
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {["Oficinas corporativas", "Edificios y administraciones", "Instituciones y universidades", "Clínicas y centros de salud", "Espacios comerciales"].map((segment) => <li key={segment} className="py-5 text-lg font-bold sm:text-xl">{segment}</li>)}
          </ul>
        </div>
      </section>

      <section aria-labelledby="continuidad-title" className="bg-slate-50 px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl border-l-4 border-amber-500 pl-6 sm:pl-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">Cuidar lo que ya tienes</p>
          <h2 id="continuidad-title" className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">Cortinas que siguen trabajando por tu espacio</h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">Mantener los sistemas existentes puede ayudar a prolongar su vida útil y conservar su funcionamiento. La limpieza, los ajustes y la reparación según evaluación contribuyen a cuidar la presentación de tu espacio y acompañar su operación diaria.</p>
        </div>
      </section>

      <section aria-labelledby="cotiza-title" className="px-6 pt-20 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-slate-950 px-6 py-14 text-center text-white sm:px-12 lg:py-20">
          <Link to="/" className="inline-block text-3xl font-black tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 sm:text-5xl" aria-label="DecoSun.cl — ir al inicio">DECO<span className="text-amber-400">SUN</span>.CL</Link>
          <h2 id="cotiza-title" className="mx-auto mt-8 max-w-3xl text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">¿Necesitas mantención para tus cortinas Roller?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">Conversemos sobre tu espacio. Envíanos fotografías, ubicación y cantidad aproximada de cortinas para evaluar el servicio.</p>
          <div className="mt-8"><QuoteButton /></div>
        </div>
      </section>
    </main>
  )
}
