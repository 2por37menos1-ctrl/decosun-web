import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowUpRight, MoveHorizontal, Moon, Sun, Wind, Layers } from "lucide-react"
import PublicPageHero from "../components/PublicPageHero"
import { pleatedOptions, pleatedFaqs, pleatedQuoteLink } from "../lib/pleatedSystems"
import { getPleatedPrice } from "../lib/pleatedPricing"
import honeycombPhoto from "../assets/images/systems/honeycomb-lateral-concept.jpg"
import meshPhoto from "../assets/images/systems/mosquitero-plisado-concept.jpg"
import "../components/PleatedPresentation.css"

const materialIcons = [Moon, Sun, Sun, Wind]
const priceExamples = ["mosquiteroPlisado", "honeycombBlackout", "honeycombBlackoutMosquitero", "honeycombDoble"]
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })

export default function Plisadas() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" })
    else window.scrollTo(0, 0)
  }, [hash])

  return (
    <main className="public-presentation pleated-page">
      <PublicPageHero
        page="Cortinas plisadas Honeycomb"
        eyebrow="Sistemas plisados a medida"
        titleId="pleated-title"
        highlight="Cortinas plisadas Honeycomb."
        title="Abre tu espacio a otra forma de vivir."
        media={<img src={honeycombPhoto} alt="Cortina Honeycomb blanca con pliegues verticales, barra de accionamiento y apertura lateral" width="1280" height="853" fetchPriority="high" />}
        caption="Imagen conceptual generada con IA. La configuración final se confirma con asesoría."
      >
        <p className="public-hero-lede">Blackout, translúcida, screen y mosquitero.</p>
        <p className="public-hero-description">Controla la luz, cuida tu privacidad o incorpora una malla para ventilar. Explora las configuraciones laterales y encuentra la alternativa para tus ventanas y puertas.</p>
        <div className="public-hero-actions">
          <a className="public-primary-button" href="#configuraciones">Elegir mi sistema ↓</a>
          <Link className="public-secondary-button" to="/cotizar?producto=honeycombBlackout">Cotizar a medida <ArrowUpRight size={17} /></Link>
        </div>
      </PublicPageHero>

      <section className="pleated-section pleated-definition" aria-labelledby="pleated-definition-title">
        <div>
          <p className="pleated-eyebrow">Pliegues que se desplazan contigo</p>
          <h2 id="pleated-definition-title">¿Qué es un sistema plisado lateral?</h2>
          <p>Es una solución que recoge su tela o malla mediante pliegues y se desplaza horizontalmente por sus guías. Una barra vertical permite mover el panel y regular la parte cubierta del vano.</p>
          <p>En las telas Honeycomb, la estructura celular forma cavidades similares a un panal. El material elegido define la función del conjunto, desde el oscurecimiento hasta la luz difusa o la malla mosquitera.</p>
        </div>
        <aside className="pleated-key-points" aria-label="Elementos del sistema lateral">
          <MoveHorizontal size={36} aria-hidden="true" />
          <h3>Un movimiento lateral.</h3>
          <ol>
            <li><strong>Guías</strong> que acompañan el recorrido.</li>
            <li><strong>Pliegues</strong> que permiten recoger el material.</li>
            <li><strong>Barra vertical</strong> para desplazar el panel.</li>
          </ol>
          <p>Espacio de recogida, fijaciones y forma de apertura se revisan en cada proyecto.</p>
        </aside>
      </section>

      <section id="configuraciones" className="pleated-section" aria-labelledby="pleated-materials-title">
        <p className="pleated-eyebrow">Empieza por lo que necesitas</p>
        <h2 id="pleated-materials-title">Una función para cada momento.</h2>
        <p className="pleated-intro">Elige el material según la luz, la privacidad y el uso del espacio. Después podrás indicar las medidas y la cantidad en el cotizador.</p>
        <div className="pleated-material-grid">
          {pleatedOptions.slice(0, 4).map((option, index) => {
            const Icon = materialIcons[index]
            return (
              <article key={option.key}>
                <Icon className="pleated-material-icon" size={30} aria-hidden="true" />
                <p className="pleated-eyebrow">{option.purpose}</p>
                <h3>{option.name}</h3>
                <p>{option.description}</p>
                <Link className="pleated-text-link" to={pleatedQuoteLink(option.key)}>Cotizar esta opción <ArrowUpRight size={17} /></Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="pleated-section pleated-mesh" aria-labelledby="pleated-mesh-title">
        <figure>
          <img src={meshPhoto} alt="Mosquitero plisado de malla oscura con apertura lateral y vista al jardín" width="1280" height="853" loading="lazy" decoding="async" />
          <figcaption>Imagen conceptual generada con IA.</figcaption>
        </figure>
        <div>
          <p className="pleated-eyebrow">Una malla para tu ventana o puerta</p>
          <h2 id="pleated-mesh-title">Ventila con mosquitero plisado.</h2>
          <p>La malla permite evaluar ventilación y protección frente al paso de insectos con un sistema que se recoge lateralmente. Para elegirla se revisan el ajuste al vano, el recorrido de la puerta y los encuentros con sus guías.</p>
          <p>También puedes solicitar una configuración combinada con cortina blackout, translúcida o screen para atender distintas necesidades en el mismo espacio.</p>
          <Link className="public-primary-button" to={pleatedQuoteLink("mosquiteroPlisado")}>Cotizar mosquitero <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <section className="pleated-section pleated-combinations" aria-labelledby="pleated-combinations-title">
        <p className="pleated-eyebrow">Combina funciones</p>
        <h2 id="pleated-combinations-title">Tu espacio cambia durante el día.</h2>
        <div className="pleated-combination-grid">
          <article>
            <Layers size={32} aria-hidden="true" />
            <h3>Cortina plisada + mosquitero</h3>
            <p>Elige la tela para controlar la luz y añade la función de malla. La combinación requiere confirmar espacio disponible, guías y apertura.</p>
            <div className="pleated-option-links">
              {pleatedOptions.filter(option => option.group === "combinado").map(option => <Link key={option.key} to={pleatedQuoteLink(option.key)}>{option.name} <ArrowUpRight size={17} /></Link>)}
            </div>
          </article>
          <article>
            <Moon size={32} aria-hidden="true" />
            <h3>Doble blackout + screen</h3>
            <p>Dos materiales con funciones distintas para alternar oscurecimiento y luz filtrada. Se confirma el montaje adecuado para las medidas de tu ventana o puerta.</p>
            <Link className="public-primary-button" to={pleatedQuoteLink("honeycombDoble")}>Cotizar sistema doble <ArrowUpRight size={17} /></Link>
          </article>
        </div>
      </section>

      <section className="pleated-section" aria-labelledby="pleated-comparison-title">
        <p className="pleated-eyebrow">Decide con claridad</p>
        <h2 id="pleated-comparison-title">¿Qué sistema se adapta a tu proyecto?</h2>
        <div className="pleated-table-wrap" tabIndex={0} role="region" aria-label="Comparación de sistemas plisados">
          <table className="pleated-table">
            <thead><tr><th scope="col">Sistema</th><th scope="col">Función principal</th><th scope="col">Qué revisar</th></tr></thead>
            <tbody>
              <tr><th scope="row">Blackout</th><td>Oscurecimiento y privacidad</td><td>Cobertura, bordes y guías</td></tr>
              <tr><th scope="row">Translúcida</th><td>Luz natural difusa sin vista exterior</td><td>Muestra y nivel de difusión de luz</td></tr>
              <tr><th scope="row">Screen</th><td>Paso de luz difusa sin vista exterior</td><td>Muestra y nivel de difusión de luz</td></tr>
              <tr><th scope="row">Mosquitero</th><td>Malla para ventilar</td><td>Ajuste al vano y recorrido</td></tr>
              <tr><th scope="row">Plisada + mosquitero</th><td>Control de luz y función de malla</td><td>Espacio y compatibilidad del conjunto</td></tr>
              <tr><th scope="row">Doble blackout + screen</th><td>Alternar oscurecimiento y luz filtrada</td><td>Montaje y manejo de ambos materiales</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="pleated-section pleated-prices" aria-labelledby="pleated-prices-title">
        <p className="pleated-eyebrow">Prepara tu presupuesto</p>
        <h2 id="pleated-prices-title">Un valor para cada configuración.</h2>
        <p className="pleated-intro">Estos ejemplos corresponden a una unidad de 2 × 2 m e incluyen IVA. Indica tus propias medidas en el cotizador para consultar el tramo correspondiente. La ubicación y los códigos promocionales pueden ajustar el total.</p>
        <div className="pleated-price-grid">
          {priceExamples.map(key => {
            const option = pleatedOptions.find(item => item.key === key)
            const price = getPleatedPrice(key, 2, 2, 1)
            return <article key={key}><h3>{option.name}</h3><p className="pleated-price">{money.format(price.unitPrice)}</p><p>Por unidad de 2 × 2 m · IVA incluido</p><Link className="pleated-text-link" to={pleatedQuoteLink(key)}>Cotizar mis medidas <ArrowUpRight size={17} /></Link></article>
          })}
        </div>
        <p className="pleated-price-note">Para medidas intermedias se utiliza el tramo superior de ancho y alto. Tramo mínimo de 1 × 1 m. Medidas superiores a 3 m en cualquiera de sus lados pasan a cotización asistida. El equipo confirma la factibilidad y el valor final del proyecto.</p>
      </section>

      <section className="pleated-section pleated-steps" aria-labelledby="pleated-measures-title">
        <p className="pleated-eyebrow">De tu idea a la configuración</p>
        <h2 id="pleated-measures-title">Cotiza en tres pasos.</h2>
        <ol>
          <li><span>01</span><h3>Elige el sistema</h3><p>Selecciona la tela, la malla o la combinación que necesitas.</p></li>
          <li><span>02</span><h3>Indica tus medidas</h3><p>Ancho y alto en metros, cantidad y ambiente. 150 cm equivalen a 1,50 m.</p></li>
          <li><span>03</span><h3>Confirma con asesoría</h3><p>El equipo revisa medidas finales, referencia, apertura y condiciones de instalación.</p></li>
        </ol>
      </section>

      <section className="pleated-section pleated-local" aria-labelledby="pleated-local-title">
        <div>
          <p className="pleated-eyebrow">Atención DecoSun</p>
          <h2 id="pleated-local-title">Cuéntanos en qué ciudad está tu proyecto.</h2>
          <p>Puedes gestionar tu solicitud con las sucursales de Iquique o Viña del Mar. Para proyectos en la Región de Valparaíso, Santiago u otras ciudades, indica tu ubicación para confirmar disponibilidad y condiciones del sistema plisado.</p>
          <Link className="pleated-text-link" to="/nosotros">Conoce nuestra red y formas de atención <ArrowUpRight size={17} /></Link>
        </div>
        <Link className="public-primary-button" to="/cotizar?producto=honeycombBlackout">Preparar mi cotización <ArrowUpRight size={17} /></Link>
      </section>

      <section className="pleated-section pleated-faq" aria-labelledby="pleated-faq-title">
        <p className="pleated-eyebrow">Preguntas frecuentes</p>
        <h2 id="pleated-faq-title">Antes de elegir tu sistema plisado.</h2>
        {pleatedFaqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
      </section>

      <section className="pleated-section pleated-final">
        <p className="pleated-eyebrow">Una solución a tu medida</p>
        <h2>Luz, privacidad y apertura.<br />Elige cómo vivir tu espacio.</h2>
        <p>Explora la configuración que necesitas y comparte tu proyecto con DecoSun.</p>
        <div className="public-hero-actions">
          <Link className="public-primary-button" to="/cotizar?producto=honeycombTranslucida">Cotizar sistema plisado <ArrowUpRight size={17} /></Link>
          <Link className="public-secondary-button" to="/guia-de-telas">Comparar funciones de las telas <ArrowUpRight size={17} /></Link>
        </div>
      </section>
    </main>
  )
}
