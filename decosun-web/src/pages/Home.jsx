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
import blackoutImg from "../assets/images/black-outcalido.jpg"
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
      <section className="relative min-h-screen overflow-hidden bg-slate-950">
        {heroImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt="Decosun control solar"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2200ms] ${
              index === currentHero ? "opacity-75" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-20 lg:px-8">
          <div className="max-w-3xl lg:ml-4">
            <div className="mb-10 flex justify-center lg:justify-start">
              <img
                src={heroLogo}
                alt="Decosun"
                className="h-32 w-auto lg:h-44"
              />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.35em] text-amber-400">
              Diseño · confort · tecnología
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
              Diseño, confort
              <span className="block text-amber-400">y control solar</span>
              para tus espacios.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              Soluciones premium en cortinas roller, toldos, persianas,
              automatización y proyectos a medida para hogares, oficinas e
              instituciones.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/cotizar"
                className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-400"
              >
                Cotizar ahora
              </a>

              <a
                href="/soluciones"
                className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Ver soluciones
              </a>
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
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
                >
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              Soluciones que se adaptan a ti
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Control solar con diseño y funcionalidad
            </h2>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {soluciones.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-56 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-black text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                  <a
                    href="/soluciones"
                    className="mt-5 inline-flex text-sm font-bold uppercase tracking-wide text-amber-700"
                  >
                    Ver más →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              ¿Por qué Decosun?
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Experiencia que genera confianza
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Combinamos asesoría, fabricación, instalación y seguimiento para
              entregar soluciones claras, duraderas y estéticamente cuidadas.
            </p>

            <a
              href="/nosotros"
              className="mt-8 inline-flex rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-400"
            >
              Conoce más
            </a>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["+10", "años de experiencia"],
              ["+5.000", "proyectos ejecutados"],
              ["+3.000", "clientes satisfechos"],
              ["Chile", "cobertura en expansión"],
            ].map(([number, label]) => (
              <div
                key={label}
                className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-center backdrop-blur-md"
              >
                <p className="text-4xl font-black text-amber-400">{number}</p>
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-200">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-amber-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              Cotiza en 3 simples pasos
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Transforma tu espacio hoy
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Mide", "Ingresa las medidas aproximadas de tus espacios."],
              ["2", "Elige", "Selecciona producto, zona y cantidad."],
              ["3", "Recibe", "Envía tu solicitud y queda registrada en Decosun."],
            ].map(([num, title, text]) => (
              <div
                key={title}
                className="rounded-[30px] border border-amber-100 bg-white p-8 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white">
                  {num}
                </div>
                <h3 className="mt-6 text-2xl font-black text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="/cotizar"
              className="inline-flex rounded-2xl bg-slate-950 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:-translate-y-0.5"
            >
              Ir al cotizador
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[36px] bg-slate-950 shadow-2xl lg:grid-cols-2">
          <img
            src={redImg}
            alt="Red Decosun"
            className="h-full min-h-[420px] w-full object-cover opacity-90"
          />

          <div className="flex flex-col justify-center p-8 lg:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Red Decosun
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
              Una marca preparada para crecer
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Estamos desarrollando una red de representantes comerciales con
              soporte técnico, plataforma interna, seguimiento de proyectos y
              visualización de comisiones proyectadas.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/nosotros"
                className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
              >
                Conocer modelo
              </a>
              <a
                href="/cotizar"
                className="rounded-2xl border border-white/20 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Solicitar cotización
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}