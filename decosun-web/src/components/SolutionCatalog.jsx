import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { FabricCTA } from "./FabricLibrary"
import "./FabricLibrary.css"
import honeycombPhoto from "../assets/images/systems/honeycomb-lateral-concept.jpg"
import catalogPhoto from "../assets/images/fabrics/sunscreen-concept.jpg"
import doublePhoto from "../assets/images/systems/roller-doble-real.jpg"
import duoPhoto from "../assets/images/systems/roller-duo-concept.jpg"
import verticalPhoto from "../assets/images/systems/persianas-verticales-concept.jpg"
import projectingAwningPhoto from "../assets/images/systems/toldos-proyectantes-concept.jpg"
import verticalAwningPhoto from "../assets/images/systems/toldos-verticales-concept.jpg"

const systemPhotos = {
  "cortinas-roller": { src: catalogPhoto, alt: "Ambiente conceptual con una cortina roller sunscreen en un living" },
  "roller-doble": { src: doublePhoto, alt: "Instalación real de roller doble con dos telas a distinta altura en ventanales de esquina", caption: "Fotografía real de instalación DecoSun." },
  "roller-duo": { src: duoPhoto, alt: "Imagen conceptual de cortina DÚO con franjas opacas y translúcidas superpuestas" },
  "persianas-verticales": { src: verticalPhoto, alt: "Imagen conceptual de persianas de láminas verticales orientables en una oficina" },
  "toldos-proyectantes": { src: projectingAwningPhoto, alt: "Imagen conceptual de toldo de brazos articulados que proyecta sombra sobre una terraza" },
  "toldos-verticales": { src: verticalAwningPhoto, alt: "Imagen conceptual de toldo exterior con lona que desciende verticalmente frente a una terraza" },
}

const systems = [
  { id: "cortinas-roller", name: "Cortinas roller", tag: "Una tela que se enrolla", description: "Un sistema de enrollado para evaluar con tela blackout, sunscreen o translúcida. La tela y el sistema cumplen funciones distintas.", link: "/guia-de-telas", cta: "Elegir la tela" },
  { id: "roller-doble", name: "Roller doble", tag: "Dos cortinas, dos funciones", description: "Permite evaluar dos telas en una misma ventana, por ejemplo para alternar filtrado de luz y oscurecimiento. Requiere espacio y montaje compatibles.", link: "/guia-de-telas", cta: "Comparar funciones de las telas" },
  { id: "roller-duo", name: "Cortinas DÚO", tag: "Regulación mediante franjas", description: "Alternan franjas de distinta transparencia para regular luz y privacidad. Es un sistema diferente de un roller doble. La referencia de tela y sus prestaciones se confirman con asesoría.", link: "/cotizar", cta: "Consultar por DÚO" },
  { id: "persianas-verticales", name: "Persianas verticales", tag: "Control direccional de la luz", description: "Orientan sus láminas para regular luz y vista. Se evalúan para oficinas y ventanales amplios según medidas, fijación y material disponible.", link: "/cotizar", cta: "Evaluar persianas verticales" },
  { id: "toldos-proyectantes", name: "Toldos proyectantes", tag: "Sombra hacia el exterior", description: "Un sistema que proyecta sombra sobre un espacio exterior. Si ya tienes un toldo con tela deteriorada, evaluamos su renovación con cambio de tela a medida y mantención del mecanismo.", link: "/cambio-tela-toldos-proyectantes", cta: "Conocer el cambio de tela" },
  { id: "toldos-verticales", name: "Toldos verticales", tag: "Protección en un plano vertical", description: "Una alternativa para evaluar protección solar exterior en sentido vertical. No debe asumirse que utiliza la misma tela que una cortina interior: se confirma aptitud y configuración.", link: "/cotizar", cta: "Consultar factibilidad" },
]

export default function SolutionCatalog() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" }))
    return () => cancelAnimationFrame(frame)
  }, [hash])
  return <main className="fabric-library"><div className="fabric-wrap"><nav className="fabric-breadcrumbs" aria-label="Ruta de navegación"><ol><li><Link to="/">Inicio</Link></li><li><span aria-current="page">Soluciones</span></li></ol></nav><header className="fabric-page-heading fabric-guide-hero"><img src={catalogPhoto} alt="Ambiente conceptual con cortinas roller sunscreen" width="1536" height="1024" fetchPriority="high" decoding="async" /><div className="fabric-hero-copy"><p className="fabric-eyebrow">Sistemas · Mecanismos · Instalación</p><h1>Cada espacio.<br /><em>Su forma de vivir la luz.</em></h1><p className="fabric-lede">El sistema define cómo se mueve y se instala tu cortina. La tela define cómo recibes la luz. Explora las alternativas y elige con asesoría.</p><Link className="fabric-text-link" to="/guia-de-telas">¿Quieres comparar telas? Empieza por la guía ↗︎</Link><p className="fabric-hero-note">Imagen conceptual generada con IA.</p></div></header>
    <section className="catalog-systems" aria-label="Catálogo de sistemas">{systems.map((system, index) => <article id={system.id} key={system.id}><figure className="catalog-system-photo"><img src={systemPhotos[system.id].src} alt={systemPhotos[system.id].alt} width="1280" height="853" loading="lazy" decoding="async" /><figcaption>{systemPhotos[system.id].caption || "Imagen conceptual generada con IA."}</figcaption></figure><div className="catalog-system-copy"><p className="fabric-eyebrow">{String(index + 1).padStart(2, "0")} · {system.tag}</p><h2>{system.name}</h2><p>{system.description}</p><Link className="fabric-text-link" to={system.link}>{system.cta} ↗︎</Link></div></article>)}</section>
    <section className="catalog-pleated" aria-labelledby="catalog-pleated-title">
      <figure><img src={honeycombPhoto} alt="Cortina plisada Honeycomb con apertura lateral" width="1280" height="853" loading="lazy" decoding="async" /><figcaption>Imagen conceptual generada con IA.</figcaption></figure>
      <div><p className="fabric-eyebrow">Honeycomb · Plisadas · Mosquiteros</p><h2 id="catalog-pleated-title">Luz, privacidad y apertura lateral.</h2><p>Explora cortinas plisadas blackout, translúcidas y screen, mallas mosquiteras y sistemas combinados para tus ventanas y puertas.</p><Link className="fabric-text-link" to="/cortinas-plisadas-honeycomb">Conocer sistemas y configuraciones ↗</Link></div>
    </section>
    <section id="tipos-telas" className="fabric-section"><p className="fabric-eyebrow">Tipos de telas y estilos</p><h2>La tela merece su propia decisión.</h2><p>La guía reúne la comparación de luz, vista y privacidad. Estas son las tres familias iniciales para explorar con un sistema roller.</p><div className="fabric-home-grid"><article id="roller-blackout"><h3>Tela blackout en roller</h3><p>Para evaluar oscurecimiento; el resultado también depende de bordes e instalación.</p><Link className="fabric-text-link" to="/telas/blackout">Conocer blackout ↗︎</Link></article><article id="roller-sunscreen"><h3>Tela sunscreen en roller</h3><p>Para filtrar luz y conservar vista según referencia. Revisa especialmente la privacidad nocturna.</p><Link className="fabric-text-link" to="/telas/sunscreen">Conocer sunscreen ↗︎</Link></article><article><h3>Tela translúcida en roller</h3><p>Para luz difusa. La transparencia y las siluetas dependen de la tela y la iluminación.</p><Link className="fabric-text-link" to="/telas/translucida">Conocer translúcida ↗︎</Link></article></div><Link className="fabric-text-link" to="/guia-de-telas">Ver guía y comparación completa ↗︎</Link></section>
    <section className="fabric-answer"><p className="fabric-eyebrow">Servicios para tus cortinas</p><h2>También puedes cuidar<br />y modernizar lo que ya tienes.</h2><p>Evalúa la motorización de sistemas compatibles o consulta por mantención y limpieza. El equipo revisará el estado y las condiciones de instalación.</p><div className="fabric-related-links"><Link to="/motorizacion">Motorización ↗︎</Link><Link to="/mantencion">Mantención y limpieza ↗︎</Link><Link to="/garantia">Garantía y postventa ↗︎</Link><Link to="/agenda">Coordinar atención ↗︎</Link></div></section><FabricCTA />
  </div></main>
}
