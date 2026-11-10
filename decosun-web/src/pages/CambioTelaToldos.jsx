import { Link } from "react-router-dom"
import PublicPageHero from "../components/PublicPageHero"
import { AWNING_RENEWAL_PATH, awningRenewalFaqs } from "../lib/awningRenewal"
import { buildWhatsAppUrl } from "../lib/whatsappRouting"
import "./CambioTelaToldos.css"

const realPhoto = "/img/toldos-renovacion/toldo-instalado-real.jpg"
const heroPhoto = "/img/toldos-renovacion/terraza-renovada-concept.jpg"
const enquiryUrl = buildWhatsAppUrl({
  zone: "centro",
  pathname: AWNING_RENEWAL_PATH,
  message: "Hola DecoSun, quiero evaluar el cambio de tela y mantención de un toldo proyectante. Les compartiré fotos del toldo y sus soportes, ciudad, ancho y proyección aproximados, y cantidad de toldos. ¿Podemos revisar la factibilidad y cotización?",
})

function ContactLink({ children = "Cotizar cambio de tela" }) {
  return <a className="public-primary-button" href={enquiryUrl} target="_blank" rel="noopener noreferrer">{children} <span aria-hidden="true">↗</span></a>
}

export default function CambioTelaToldos() {
  return <main className="public-presentation awning-renewal">
    <PublicPageHero page="Cambio de tela de toldos" eyebrow="Renovación de toldos · V Región" titleId="awning-title" highlight="Renueva la tela." title="Recupera tu terraza." media={<img src={heroPhoto} alt="Referencia de toldo proyectante con tela clara en una terraza costera" width="1536" height="1024" fetchPriority="high" decoding="async" />} caption="Imagen de referencia generada con IA a partir de una instalación real.">
      <p className="public-hero-lede">Cambio de tela y mantención<br />de toldos proyectantes.</p>
      <p className="public-hero-description">Si la tela está rajada, deteriorada o ya fue retirada, evaluamos la estructura de tu toldo para renovarlo con una tela nueva a medida. Una nueva oportunidad para disfrutar la sombra en tu terraza.</p>
      <div className="public-hero-actions"><ContactLink /><a className="public-secondary-button" href="#como-renovamos">Conoce el proceso ↓</a></div>
      <p className="public-hero-meta">Departamentos · Casas · Edificios y comunidades</p>
    </PublicPageHero>

    <section className="awning-intro awning-wrap" aria-labelledby="awning-service-title">
      <div><p className="awning-eyebrow">Cuidar lo que ya tienes</p><h2 id="awning-service-title">Tu toldo puede tener<br />mucho por dar.</h2></div>
      <div><p>La tela y la estructura envejecen de forma distinta. Un cambio de tela, acompañado de la revisión del mecanismo, puede recuperar la presentación y el uso de un toldo existente.</p><p>Revisamos la factibilidad antes de definir el trabajo, especialmente en sistemas expuestos al ambiente costero.</p></div>
    </section>

    <section className="awning-cases awning-wrap" aria-label="Cuándo evaluar la renovación">
      {[["01", "Tela rajada o gastada", "Evaluamos el reemplazo de la tela cuando presenta roturas, desgaste o pérdida de su presentación."], ["02", "Estructura sin tela", "Si quedaron los brazos y soportes, revisamos el sistema para confirmar si puede volver a utilizarse."], ["03", "Terrazas de un edificio", "Coordinamos solicitudes individuales o de varios departamentos, considerando la estética de la fachada."]].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
    </section>

    <section className="awning-result" aria-labelledby="awning-result-title"><div className="awning-wrap awning-result-grid">
      <figure><img src={realPhoto} alt="Fotografía real de un toldo con tela clara instalado en una terraza frente al mar" width="1200" height="1600" loading="lazy" decoding="async" /><figcaption>Fotografía real de instalación compartida por DecoSun.</figcaption></figure>
      <div><p className="awning-eyebrow">Una terraza que vuelve a disfrutarse</p><h2 id="awning-result-title">Tela nueva.<br />Una nueva sensación.</h2><p>Renovar la tela transforma la presencia del toldo y de toda la terraza. Elegimos contigo una referencia para uso exterior y confirmamos su compatibilidad con el mecanismo.</p><ul><li>Tela confeccionada según las medidas del sistema.</li><li>Revisión de brazos, soportes y elementos de enrollado.</li><li>Montaje, ajuste y prueba de funcionamiento según el alcance acordado.</li><li>Color y terminación coordinados con el edificio cuando corresponde.</li></ul><ContactLink>Evaluar mi toldo</ContactLink></div>
    </div></section>

    <section id="como-renovamos" className="awning-process awning-wrap" aria-labelledby="awning-process-title"><p className="awning-eyebrow">Del diagnóstico a la renovación</p><h2 id="awning-process-title">Así recuperamos tu toldo.</h2><ol>
      {[["Compártenos tu terraza", "Envíanos fotos generales y detalles de los soportes, ciudad y medidas aproximadas. Cuéntanos si es un toldo o varios."], ["Evaluamos el sistema", "Revisamos estado, compatibilidad y acceso. Definimos qué elementos pueden conservarse y qué trabajos requiere el mecanismo."], ["Elegimos la nueva tela", "Confirmamos referencia exterior, color, confección y medidas. En edificios coordinamos las condiciones con la administración."], ["Instalamos y ajustamos", "Realizamos el cambio de tela y los trabajos acordados. Probamos apertura, recogida y ajuste del conjunto."]].map(([title, text], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></li>)}
    </ol></section>

    <section className="awning-building awning-wrap" aria-labelledby="awning-building-title"><div><p className="awning-eyebrow">Propietarios y administraciones</p><h2 id="awning-building-title">Una fachada más cuidada.<br />Terraza por terraza.</h2><p>¿Hay varios toldos deteriorados en tu edificio? Podemos evaluar una renovación coordinada, considerando las necesidades de cada departamento y la continuidad visual del conjunto.</p><p>Consultas para Viña del Mar, Reñaca, Concón, Valparaíso y otras localidades de la V Región. Confirmamos cobertura y programación al revisar la solicitud.</p><ContactLink>Consultar por mi edificio</ContactLink></div><aside><p className="awning-eyebrow">Para comenzar</p><h3>Con cuatro datos<br />podemos orientarte.</h3><ul><li>Ciudad y ubicación del proyecto.</li><li>Fotos del toldo completo y sus soportes.</li><li>Ancho y proyección aproximados.</li><li>Cantidad de toldos y estado de las telas.</li></ul><p>Si las medidas requieren acceso exterior, coordinamos su revisión con el equipo técnico.</p></aside></section>

    <section className="awning-faq awning-wrap" aria-labelledby="awning-faq-title"><p className="awning-eyebrow">Respuestas para decidir</p><h2 id="awning-faq-title">Antes de renovar.</h2>{awningRenewalFaqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>

    <section className="awning-last awning-wrap"><p className="awning-eyebrow">DecoSun · Renovación y servicio técnico</p><h2>Vuelve a disfrutar<br />tu terraza.</h2><p>Envíanos fotos de tu toldo. El equipo de zona centro te ayudará a evaluar el cambio de tela y los trabajos necesarios.</p><ContactLink>Enviar consulta por WhatsApp</ContactLink><Link to="/mantencion">Explorar mantención de cortinas roller →</Link></section>
  </main>
}
