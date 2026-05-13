import React from "react";

export default function Nosotros() {
  const heroImage = "/img/roller-sunscreen-dormitorio.jpg";

  return (
    <main className="bg-[#f6f3ee] text-slate-900">
      {/* HERO */}
      <section className="relative min-h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/20" />

        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl items-center px-6 py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
              Sobre DecoSun
            </p>

            <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
              Decoración, control solar y soluciones técnicas para espacios reales.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              En DecoSun diseñamos, fabricamos e instalamos soluciones de control
              solar con una mirada técnica, estética y funcional. Nuestro trabajo
              une precisión, experiencia en terreno y cuidado por cada detalle.
            </p>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Nuestra esencia
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Más que cortinas: soluciones pensadas para habitar mejor.
          </h2>
        </div>

        <div className="space-y-5 text-lg leading-8 text-slate-700">
          <p>
            DecoSun nace desde la experiencia práctica en fabricación,
            instalación y atención directa a clientes. Entendemos que cada
            proyecto tiene condiciones distintas: orientación solar, uso del
            espacio, privacidad, estética, presupuesto y tiempos de ejecución.
          </p>

          <p>
            Por eso trabajamos con una visión integral: evaluamos, proponemos,
            medimos, fabricamos e instalamos buscando que cada solución funcione
            bien desde el primer día.
          </p>
        </div>
      </section>

      {/* CARDS */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Mirada técnica",
              text: "Cada proyecto se evalúa considerando medidas reales, tipo de instalación, mecanismos, telas y uso diario del espacio.",
            },
            {
              title: "Diseño funcional",
              text: "Buscamos equilibrio entre estética, privacidad, control de luz, temperatura y comodidad para quienes usan el lugar.",
            },
            {
              title: "Ejecución responsable",
              text: "Coordinamos compras, fabricación, instalación y postventa con procesos claros y seguimiento interno.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* BLOQUE OSCURO */}
      <section className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
              Cómo trabajamos
            </p>

            <h2 className="mt-4 text-3xl font-semibold md:text-5xl">
              Un proceso ordenado para proyectos pequeños, medianos y grandes.
            </h2>
          </div>

          <div className="space-y-6">
            {[
              "Visita técnica o revisión de requerimientos.",
              "Levantamiento de medidas y condiciones del espacio.",
              "Propuesta de producto, materialidad y solución adecuada.",
              "Fabricación con control de medidas y componentes.",
              "Instalación y revisión final del funcionamiento.",
            ].map((step, index) => (
              <div key={step} className="flex gap-4 border-b border-white/10 pb-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-950">
                  {index + 1}
                </span>
                <p className="text-lg leading-7 text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
{/* INTRANET REPRESENTANTES */}
<section className="relative overflow-hidden bg-[#f6f3ee] px-6 py-24">
  <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[0.95fr_1.05fr]">
    <div className="overflow-hidden rounded-[2rem] shadow-xl">
      <img
        src={heroImage}
        alt="Cortinas roller sunscreen DecoSun"
        className="h-[520px] w-full object-cover"
      />
    </div>

    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
        Sistema interno
      </p>

      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
        Portal interno para representantes y operaciones regionales.
      </h2>

      <p className="mt-6 text-lg leading-8 text-slate-700">
        DecoSun integra herramientas internas para seguimiento operativo,
        control de proyectos y coordinación entre representantes,
        administración y producción.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">
            Proyectos en ejecución
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Visualización de trabajos activos por región, responsable y estado
            operativo.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">
            Coordinación regional
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Seguimiento de etapas como compras, medición, producción,
            instalación y facturación.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href="/panel"
          className="rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Acceder al sistema interno
        </a>

        <a
          href="/proyectos"
          className="rounded-full border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          Ver proyectos recientes
        </a>
      </div>
    </div>
  </div>
</section>
      {/* VALORES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Nuestro enfoque
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Precisión, confianza y una estética que acompaña el espacio.
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-700">
            Queremos que cada cliente sienta que está trabajando con un equipo
            que entiende tanto el producto como el espacio donde será instalado.
            Nuestra meta es entregar soluciones duraderas, bien terminadas y
            coherentes con el estilo de cada proyecto.
          </p>
        </div>
      </section>
    </main>
  );
}