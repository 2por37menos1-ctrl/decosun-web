import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Sun, Eye, ShieldCheck, ArrowUpRight, Layers } from "lucide-react"
import { fabrics, fabricPages, fabricBreadcrumbs, FABRIC_GUIDE_PATH } from "../lib/fabricLibrary"
import blackout from "../assets/images/fabrics/blackout-concept.jpg"
import sunscreen from "../assets/images/fabrics/sunscreen-concept.jpg"
import translucentConcept from "../assets/images/fabrics/translucida-concept.jpg"
import blackoutReference from "../assets/images/fabrics/blackout-reference.jpg"
import sunscreenReference from "../assets/images/fabrics/sunscreen-reference.jpg"
import translucent from "../assets/images/fabrics/translucida-reference.jpg"
import "./FabricLibrary.css"

const images = { blackout, sunscreen, translucida: translucentConcept }
const referenceImages = { blackout: blackoutReference, sunscreen: sunscreenReference, translucida: translucent }
const photoDescriptions = { blackout: "Dormitorio conceptual con roller opaca: la tela bloquea luz y se aprecia entrada de luz por los bordes", sunscreen: "Living conceptual con roller sunscreen: luz filtrada y vista exterior atenuada a través del tejido", translucida: "Comedor conceptual con roller translúcida: luz difusa sin una vista exterior definida" }
const photoHeadlines = { blackout: "Oscurecer no es lo mismo que sellar la ventana.", sunscreen: "Filtrar la luz. Mantener la conexión con el exterior.", translucida: "Suavizar la luz. Cambiar la atmósfera." }

function useLibraryScroll() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return }
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }))
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])
}

export function FabricBreadcrumbs() {
  const { pathname } = useLocation()
  return <nav aria-label="Ruta de navegación" className="fabric-breadcrumbs"><ol>{fabricBreadcrumbs(pathname.replace(/\/+$/, "") || "/").map((crumb, index, list) => <li key={crumb.path}>{index === list.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link to={crumb.path}>{crumb.name}</Link>}</li>)}</ol></nav>
}

export function FabricCTA() {
  return <section className="fabric-cta" aria-label="Asesoría para elegir telas"><div><p className="fabric-eyebrow">Tu espacio es el punto de partida</p><h2>La mejor tela empieza<br />por entender tu espacio.</h2><p>Cuéntanos qué luz recibes y cuánta privacidad necesitas. Evaluaremos tela, sistema y montaje.</p></div><Link className="fabric-button" to="/cotizar">Solicitar asesoría ↗︎</Link></section>
}

export function FabricCards({ exclude }) {
  return <div className="fabric-cards">{fabrics.filter(fabric => fabric.slug !== exclude).map((fabric, index) => <article key={fabric.slug}><Link className="fabric-card" to={`/telas/${fabric.slug}`}><div className="fabric-card-photo"><img src={images[fabric.slug]} alt={photoDescriptions[fabric.slug]} loading="lazy" decoding="async" width="1536" height="1024" /><span className="fabric-photo-tag">{fabric.label}</span><span className="fabric-card-arrow" aria-hidden="true"><ArrowUpRight size={22} /></span></div><div className="fabric-card-content"><p className="fabric-eyebrow">{String(index + 1).padStart(2, "0")} · Control de la luz</p><h3>{fabric.name}</h3><p>{fabric.short}</p><span className="fabric-text-link">Explorar la tela ↗︎</span></div></Link></article>)}</div>
}

export function FabricComparison() {
  const [selected, setSelected] = useState("sunscreen")
  const fabric = fabrics.find(item => item.slug === selected)
  return <section id="comparacion-visual" className="fabric-comparison fabric-section" aria-labelledby="visual-comparison-title"><div className="fabric-section-heading"><div><p className="fabric-eyebrow">Mira lo que cambia</p><h2 id="visual-comparison-title">El mismo espacio.<br /><em>Una luz diferente.</em></h2></div><p>Tres referencias visuales para entender qué filtra, qué difunde y qué bloquea cada familia de telas.</p></div><div className="fabric-comparison-layout"><figure><div className="fabric-comparison-image"><img src={referenceImages[selected]} alt={`Comparación visual de referencia: ambiente con tela ${fabric.name.toLowerCase()}`} loading="lazy" decoding="async" width="960" height="960" /><span className="fabric-photo-tag">{fabric.name} · Ambiente de referencia</span></div><figcaption>Comparación conceptual. La referencia de tela y la instalación definen el resultado real.</figcaption></figure><div className="fabric-comparison-control"><div className="fabric-selectors" role="group" aria-label="Elegir tela para comparación visual">{fabrics.map(item => <button type="button" key={item.slug} aria-pressed={selected === item.slug} onClick={() => setSelected(item.slug)}>{item.name}</button>)}</div><div aria-live="polite"><p className="fabric-eyebrow">{fabric.label}</p><h3>{photoHeadlines[selected]}</h3><dl className="fabric-comparison-properties">{[[Sun, "Luz", fabric.light], [Eye, "Vista", fabric.view], [ShieldCheck, "Privacidad", fabric.privacy]].map(([Icon, label, text]) => <div key={label}><Icon size={21} aria-hidden="true" /><div><dt>{label}</dt><dd>{text}</dd></div></div>)}</dl><Link className="fabric-button" to={`/telas/${selected}`}>Conocer {fabric.name.toLowerCase()} <ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></div></section>
}

export function FabricHomeLinks() {
  return <section className="fabric-library fabric-home-links"><div className="fabric-wrap"><p className="fabric-eyebrow">Una decisión, tres puntos de partida</p><h2>Primero tu espacio.<br /><em>Después, la solución.</em></h2><div className="fabric-home-grid">{[["La tela", "Cómo entra la luz, qué vista mantienes y qué privacidad necesitas.", FABRIC_GUIDE_PATH, "Explorar guía de telas"], ["El sistema", "El mecanismo y la instalación: roller, roller doble, DÚO y otras soluciones.", "/soluciones", "Conocer los sistemas"], ["El servicio", "Evalúa motorización o mantención para las cortinas que ya tienes.", "/motorizacion", "Explorar motorización"]].map(([title, text, path, label]) => <article key={title}><h3>{title}</h3><p>{text}</p><Link className="fabric-text-link" to={path}>{label} ↗︎</Link>{title === "El servicio" && <Link className="fabric-text-link" to="/mantencion">Mantención y limpieza ↗︎</Link>}</article>)}</div></div></section>
}

export function FabricGuide() {
  useLibraryScroll()
  return <main id="fabric-content" className="fabric-library"><div className="fabric-wrap">
    <FabricBreadcrumbs /><header className="fabric-page-heading fabric-guide-hero"><img src={sunscreen} alt={photoDescriptions.sunscreen} width="1536" height="1024" fetchPriority="high" decoding="async" /><div className="fabric-hero-copy"><p className="fabric-eyebrow">Diseño · Tecnología · Control solar</p><h1>Elige cómo<br /><em>vivir la luz.</em></h1><p className="fabric-lede">Blackout, sunscreen o translúcida. Descubre la tela que acompaña tu espacio, tu vista y tu forma de vivir.</p><div className="fabric-hero-actions"><a className="fabric-button" href="#explorar-telas">Explorar las telas <ArrowUpRight size={18} aria-hidden="true" /></a><a className="fabric-hero-link" href="#comparacion-visual">Comparar la luz ↓</a></div><p className="fabric-hero-note">Ambiente conceptual generado con IA.</p></div></header>
    <section id="explorar-telas" className="fabric-section"><div className="fabric-section-heading"><div><p className="fabric-eyebrow">Guía de telas DecoSun</p><h2>Tres formas de transformar<br /><em>tu espacio.</em></h2></div><p>La luz que entra. La vista que mantienes. La privacidad que necesitas. Empieza por lo que importa para ti.</p></div><FabricCards /><p className="fabric-caption">Imágenes conceptuales generadas con IA. Ilustran ambientes; no representan proyectos ejecutados ni referencias técnicas homologadas.</p></section>
    <FabricComparison />
    <section className="fabric-section" aria-labelledby="compare-heading"><p className="fabric-eyebrow">Luz · Vista · Privacidad</p><h2 id="compare-heading">¿Qué tela responde a tu prioridad?</h2><div className="fabric-table-wrap" role="region" aria-label="Comparación de telas" tabIndex={0}><table><caption>Comparación general. La referencia y la instalación definen el resultado.</caption><thead><tr><th scope="col">Tela</th><th scope="col">Luz</th><th scope="col">Vista exterior</th><th scope="col">Privacidad y límites</th></tr></thead><tbody>{fabrics.map(fabric => <tr key={fabric.slug}><th scope="row"><Link to={`/telas/${fabric.slug}`}>{fabric.name} ↗︎</Link></th><td>{fabric.light}</td><td>{fabric.view}</td><td>{fabric.privacy}</td></tr>)}</tbody></table></div></section>
    <section className="fabric-answer"><div className="fabric-answer-icon" aria-hidden="true"><Layers size={28} /></div><p className="fabric-eyebrow">Dos decisiones que se complementan</p><h2>La tela no es el sistema.</h2><p>La tela define cómo se filtra o bloquea la luz. El sistema define cómo se mueve y se instala la cortina. Roller enrolla una tela; roller doble combina dos cortinas. DÚO utiliza franjas para regular luz y privacidad y es un sistema diferente.</p><Link className="fabric-text-link" to="/soluciones">Conocer sistemas y mecanismos ↗︎</Link></section>
    <section className="fabric-section"><h2>Observa tu espacio antes de elegir.</h2><ol className="fabric-checks"><li><span>01</span><div><h3>Cuándo recibes la luz</h3><p>Identifica la orientación, los horarios de uso y los reflejos sobre pantallas.</p></div></li><li><span>02</span><div><h3>Qué privacidad necesitas</h3><p>Considera día y noche. La iluminación interior puede cambiar lo que se ve desde fuera.</p></div></li><li><span>03</span><div><h3>Cómo se puede instalar</h3><p>Medidas, fijación y espacio disponible ayudan a definir el sistema y su operación.</p></div></li></ol></section>
    <section className="fabric-section"><h2>Preguntas para elegir con criterio.</h2><div className="fabric-faq"><h3>¿Puedo combinar dos telas en una ventana?</h3><p>Un roller doble permite evaluar dos telas con funciones distintas. La compatibilidad, las dimensiones y el espacio de montaje requieren revisión del proyecto.</p><h3>¿Una tela garantiza privacidad en cualquier condición?</h3><p>No. Apertura, transparencia, iluminación y montaje influyen. En sunscreen y translúcidas, evalúa especialmente el uso nocturno y la percepción de siluetas.</p><h3>¿Dónde veo colores, texturas y referencias disponibles?</h3><p>Solicita una muestra y la ficha de la referencia que se evalúe para tu proyecto. Las imágenes de esta guía son orientativas y no confirman stock, composición ni prestaciones específicas.</p></div></section>
    <FabricCTA />
  </div></main>
}

export function FabricDetail() {
  useLibraryScroll()
  const { pathname } = useLocation()
  const fabric = fabricPages[pathname.replace(/\/+$/, "")]
  if (!fabric) return null
  return <main id="fabric-content" className="fabric-library"><div className="fabric-wrap"><FabricBreadcrumbs />
    <header className="fabric-detail-hero"><div className="fabric-detail-copy"><p className="fabric-eyebrow">Guía de telas · {fabric.label}</p><h1>Tela <em>{fabric.name.toLowerCase()}</em><br />para cortinas roller.</h1><p className="fabric-lede">{fabric.headline}</p><div className="fabric-hero-actions"><Link className="fabric-button" to="/cotizar">Cotizar mi proyecto <ArrowUpRight size={18} aria-hidden="true" /></Link><a className="fabric-hero-link" href="#que-es">Conocer la tela ↓</a></div></div><figure><img src={images[fabric.slug]} alt={photoDescriptions[fabric.slug]} width="1536" height="1024" fetchPriority="high" decoding="async" /><figcaption>Imagen conceptual generada con IA. Configuración y material sujetos a evaluación.</figcaption></figure></header>
    <section id="que-es" className="fabric-answer"><p className="fabric-eyebrow">La respuesta breve</p><h2>¿Qué es una tela {fabric.name.toLowerCase()}?</h2><p>{fabric.definition}</p></section>
    <section className="fabric-section"><h2>Lo que cambia en tu espacio.</h2><dl className="fabric-properties">{[["Luz", fabric.light], ["Vista", fabric.view], ["Privacidad", fabric.privacy]].map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl></section>
    <section className="fabric-photo-story fabric-section"><figure><img src={referenceImages[fabric.slug]} alt={`Imagen de referencia para apreciar el efecto de la tela ${fabric.name.toLowerCase()} sobre la luz de un living`} loading="lazy" decoding="async" width="960" height="960" /><figcaption>Imagen de referencia del archivo DecoSun. No identifica una instalación documentada.</figcaption></figure><div><p className="fabric-eyebrow">Entender la tela en un ambiente</p><h2>{photoHeadlines[fabric.slug]}</h2><p>{fabric.light}</p><p>{fabric.privacy}</p><Link className="fabric-text-link" to="/guia-de-telas#comparacion-visual">Comparar las tres telas en un mismo espacio ↗︎</Link></div></section>
    <div className="fabric-two-columns"><section><h2>¿Dónde conviene evaluarla?</h2><p>{fabric.uses}</p></section><section><h2>Lo que debes considerar.</h2><p>{fabric.limits}</p></section></div>
    <section className="fabric-material"><p className="fabric-eyebrow">De la imagen a la muestra</p><h2>El material se elige de cerca.</h2><p>Revisa una muestra real, su textura y la ficha de la referencia propuesta. Confirma color, composición, disponibilidad y las prestaciones que importan para tu espacio antes de cerrar la configuración.</p><Link className="fabric-text-link" to="/cotizar">Solicitar orientación sobre muestras ↗︎</Link></section>
    <section className="fabric-section"><h2>Sistema y forma de control.</h2><p>{fabric.system}</p><p>La motorización se evalúa según tubo, dimensiones, peso y mecanismo compatible. Smartphone y automatizaciones dependen de motor, conectividad y accesorios disponibles; no se promete compatibilidad universal.</p><div className="fabric-related-links"><Link to="/soluciones">Ver sistemas ↗︎</Link><Link to="/motorizacion">Evaluar motorización ↗︎</Link><Link to="/proyectos">Explorar la galería DecoSun ↗︎</Link></div><p className="fabric-caption">La galería ofrece contexto de soluciones; no se atribuye una referencia de tela concreta a un proyecto sin documentación.</p></section>
    <section className="fabric-section"><h2>Preguntas sobre {fabric.name.toLowerCase()}.</h2><div className="fabric-faq">{fabric.faqs.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div></section>
    <section className="fabric-section"><p className="fabric-eyebrow">Compara antes de decidir</p><h2>Otras formas de vivir la luz.</h2><FabricCards exclude={fabric.slug} /><Link className="fabric-text-link" to={FABRIC_GUIDE_PATH}>Volver a la guía y su comparación ↗︎</Link></section><FabricCTA />
  </div></main>
}
