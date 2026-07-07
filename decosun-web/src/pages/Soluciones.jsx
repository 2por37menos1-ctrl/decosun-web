import { Link } from "react-router-dom"
import screenImg from "../assets/images/screen-02.jpeg"
import blackoutImg from "../assets/images/black-outcalido.jpg"
import duoImg from "../assets/images/duo-03.jpg"
import verticalImg from "../assets/images/persiana-vertical-living.jpeg"
import toldoImg from "../assets/images/toldo-proyectante-premium.png"
import pergolaImg from "../assets/images/pergola-premium.png"
import sucursalImg from "../assets/images/sucursal-iquique.jpeg"
import telasImg from "../assets/images/telas-textura.jpg"
import cierreCristalImg from "../assets/images/cierres-cristal/cierre-cristal-balcon-04.jpeg"

export default function Soluciones() {
  const soluciones = [
    {
      title: "Cortinas Roller Screen",
      category: "Interior · Control solar",
      text: "Permiten regular la entrada de luz, reducir reflejos y mantener una conexión visual con el exterior. Son ideales para livings, terrazas cerradas, oficinas y espacios con vista.",
      image: screenImg,
      points: [
        "Control solar sin perder luminosidad",
        "Privacidad durante el día",
        "Terminación moderna y minimalista",
        "Opción de motorización",
      ],
    },
    {
      title: "Roller Blackout",
      category: "Interior · Privacidad",
      text: "Diseñadas para oscurecer ambientes y entregar mayor privacidad. Son una excelente alternativa para dormitorios, salas de reuniones, home office y espacios que requieren control total de luz.",
      image: blackoutImg,
      points: [
        "Oscuridad y confort visual",
        "Mayor privacidad",
        "Ideal para descanso y concentración",
        "Instalación a medida",
      ],
    },
    {
      title: "Roller DÚO",
      category: "Diseño · Regulación de luz",
      text: "Un sistema decorativo y funcional que alterna franjas translúcidas y opacas, permitiendo regular luz y privacidad con una estética contemporánea.",
      image: duoImg,
      points: [
        "Diseño elegante y moderno",
        "Regulación flexible de luz",
        "Perfecta para espacios sociales",
        "Disponible en distintos tonos",
      ],
    },
    {
      title: "Persianas Verticales",
      category: "Corporativo · Grandes ventanales",
      text: "Una solución práctica para ventanales amplios, oficinas, consultas, salas de reuniones e instituciones. Permiten orientar la luz y mantener una imagen sobria y profesional.",
      image: verticalImg,
      points: [
        "Control direccional de luz",
        "Ideal para oficinas",
        "Buena cobertura en grandes paños",
        "Estilo corporativo",
      ],
    },
    {
      title: "Toldos Proyectantes",
      category: "Exterior · Protección solar",
      text: "Soluciones exteriores para terrazas, balcones y fachadas. Ayudan a generar sombra, mejorar el confort térmico y ampliar el uso de espacios al aire libre.",
      image: toldoImg,
      points: [
        "Sombra regulable",
        "Mayor confort en terrazas",
        "Protección solar exterior",
        "Diseño limpio y funcional",
      ],
    },
    {
      title: "Pérgolas Bioclimáticas",
      category: "Exterior · Alto valor",
      text: "Estructuras premium para transformar terrazas y espacios exteriores. Integran diseño arquitectónico, sombra, ventilación y una experiencia de uso superior.",
      image: pergolaImg,
      points: [
        "Diseño arquitectónico",
        "Control de sombra y ventilación",
        "Ideal para terrazas premium",
        "Proyección de alto valor inmobiliario",
      ],
    },
    {
      title: "Cierres de cristal para balcones y terrazas",
      category: "Exterior · Cerramientos",
      text: "Sistema transparente para balcones, terrazas y quinchos, pensado para extender el uso de espacios exteriores con protección, luminosidad y una vista despejada.",
      image: cierreCristalImg,
      note: "Producto comercializado bajo marca DecoSun.",
      cta: "Cotizar cierre de cristal",
      points: [
        "Protección contra viento, polvo y lluvia ligera",
        "Vista despejada y estética moderna",
        "Mayor confort para terrazas y balcones",
        "Instalación coordinada bajo respaldo DecoSun",
      ],
    },
  ]

  return (
    <main className="bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-900" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-amber-400">
              Soluciones Decosun
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Diseño, control solar y tecnología para cada espacio.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Desarrollamos soluciones para interior y exterior, combinando
              estética, funcionalidad, protección solar y asesoría técnica.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/cotizar"
                className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-bold uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
              >
                Cotizar solución
              </Link>

              <Link to="/nosotros"
                className="rounded-2xl border border-white/20 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Conocer Decosun
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <img
              src={screenImg}
              alt="Cortinas roller screen"
              className="h-64 w-full rounded-[32px] object-cover shadow-2xl"
            />
            <img
              src={toldoImg}
              alt="Toldo proyectante"
              className="h-64 w-full rounded-[32px] object-cover shadow-2xl sm:mt-12"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
            Líneas de producto
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Soluciones que se adaptan a hogares, oficinas y exteriores
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {soluciones.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-5 top-5 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white backdrop-blur">
                  {item.category}
                </div>
              </div>

              <div className="p-7">
                <h3 className="text-2xl font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-4 min-h-[112px] leading-7 text-slate-600">
                  {item.text}
                </p>

                <ul className="mt-5 space-y-2">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-slate-700">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                {item.note && (
                  <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    {item.note}
                  </p>
                )}

                <Link to="/cotizar"
                  className="mt-7 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-amber-500 hover:text-black"
                >
                  {item.cta || "Cotizar"}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
              Servicio técnico y fabricación
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Soluciones a medida con respaldo operativo
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              En Decosun combinamos asesoría comercial, toma de medidas,
              fabricación, instalación y seguimiento de proyectos. Esto nos
              permite atender desde clientes residenciales hasta empresas,
              instituciones y licitaciones.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Medición y asesoría",
                "Fabricación a medida",
                "Instalación profesional",
                "Seguimiento del proyecto",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                >
                  <p className="font-bold text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <img
            src={sucursalImg}
            alt="Sucursal Decosun Iquique"
            className="h-[460px] w-full rounded-[36px] object-cover shadow-2xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid overflow-hidden rounded-[36px] border border-slate-200 bg-amber-50 shadow-xl lg:grid-cols-2">
          <img
            src={telasImg}
            alt="Telas y texturas"
            className="h-full min-h-[420px] w-full object-cover"
          />

          <div className="flex flex-col justify-center p-8 lg:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">
              Materiales y terminaciones
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Cada proyecto requiere una solución adecuada
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-700">
              La elección de tela, color, sistema y tipo de instalación influye
              directamente en el resultado final. Por eso orientamos cada
              proyecto según luz, privacidad, uso del espacio y estética.
            </p>

            <Link to="/cotizar"
              className="mt-8 inline-flex w-fit rounded-2xl bg-slate-950 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-amber-500 hover:text-black"
            >
              Solicitar asesoría
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
