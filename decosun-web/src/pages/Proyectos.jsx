import PublicPageHero from "../components/PublicPageHero"
import "../components/ProjectPresentation.css"
import { Link } from "react-router-dom"
import heroImg from "../assets/images/sucursal-iquique.jpeg"
import residencialImg from "../assets/images/home-03.jpg"
import corporativoImg from "../assets/images/corporativo-DUO.jpeg"
import oficinaImg from "../assets/images/corporativo-oficina.jpeg"
import rollerImg from "../assets/images/roller-doble02.jpg"
import toldoImg from "../assets/images/toldo-proyectante1.jpeg"
import exteriorImg from "../assets/images/toldo-exterior.jpg"

export default function Proyectos() {
  const proyectos = [
    {
      titulo: "Proyecto residencial premium",
      descripcion:
        "Soluciones roller screen y blackout para espacios modernos con control solar, privacidad y diseño minimalista.",
      imagen: residencialImg,
      categoria: "Residencial",
    },
    {
      titulo: "Espacios corporativos con sistema DÚO",
      descripcion:
        "Instalaciones para oficinas y salas de reuniones con regulación flexible de luz y terminación profesional.",
      imagen: corporativoImg,
      categoria: "Corporativo",
    },
    {
      titulo: "Oficinas modernas y espacios ejecutivos",
      descripcion:
        "Sistemas DÚO y blackout pensados para privacidad, regulación de luz y diseño contemporáneo.",
      imagen: oficinaImg,
      categoria: "Oficinas",
    },
    {
      titulo: "Roller doble y control de privacidad",
      descripcion:
        "Combinación de screen y blackout para lograr luminosidad durante el día y privacidad total cuando se requiere.",
      imagen: rollerImg,
      categoria: "Roller doble",
    },
    {
      titulo: "Toldos proyectantes exteriores",
      descripcion:
        "Protección solar exterior para terrazas, balcones y fachadas, mejorando el confort de espacios abiertos.",
      imagen: toldoImg,
      categoria: "Exterior",
    },
    {
      titulo: "Terrazas y espacios exteriores",
      descripcion:
        "Soluciones pensadas para ampliar el uso de patios, terrazas y espacios sociales al aire libre.",
      imagen: exteriorImg,
      categoria: "Terrazas",
    },
  ]

  return <main className="public-presentation projects-page">
    <PublicPageHero page="Proyectos" eyebrow="Proyectos DecoSun" titleId="projects-title" highlight="Espacios transformados." title="Diseño y control solar." media={<img src={heroImg} alt="Sucursal DecoSun" />} caption="Soluciones para hogares, oficinas y exteriores.">
      <p className="public-hero-description">Cada proyecto representa una combinación entre funcionalidad, estética y soluciones técnicas adaptadas a hogares, oficinas, espacios corporativos y exteriores.</p>
      <div className="public-hero-actions"><a className="public-primary-button" href="#galeria">Explorar proyectos ↓</a><Link className="public-secondary-button" to="/cotizar">Cotizar mi proyecto ↗</Link></div>
    </PublicPageHero>
    <section id="galeria" className="projects-gallery">
      <p className="public-eyebrow">Galería de trabajos</p><h2>Soluciones instaladas en distintos tipos de espacios</h2>
      <p className="projects-intro">Trabajamos con soluciones a medida para mejorar el confort, la privacidad y la estética de cada ambiente.</p>
      <div className="projects-grid">{proyectos.map(proyecto => <article className="project-card" key={proyecto.titulo}>
        <div className="project-photo"><img src={proyecto.imagen} alt={proyecto.titulo} loading="lazy" decoding="async" /><span>{proyecto.categoria}</span></div>
        <div className="project-copy"><h3>{proyecto.titulo}</h3><p>{proyecto.descripcion}</p></div>
      </article>)}</div>
    </section>
    <section className="projects-cta"><p className="public-eyebrow">Tu próximo proyecto</p><h2>Diseñamos soluciones para tu espacio.</h2><p>Cada proyecto es desarrollado de manera personalizada, considerando estética, funcionalidad, privacidad, protección solar y condiciones reales de instalación.</p><Link className="public-primary-button" to="/cotizar">Solicitar cotización ↗</Link></section>
  </main>
}
