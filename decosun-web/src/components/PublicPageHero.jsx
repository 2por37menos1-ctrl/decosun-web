import { Link } from "react-router-dom"
import "./PublicPresentation.css"

export default function PublicPageHero({ page, eyebrow, titleId, highlight, title, media, caption, children }) {
  return <div className="public-page-top"><nav className="public-breadcrumbs" aria-label="Ruta de navegación"><ol><li><Link to="/">Inicio</Link></li><li><span aria-current="page">{page}</span></li></ol></nav><section className="public-hero" aria-labelledby={titleId}><div className="public-hero-copy"><p className="public-eyebrow">{eyebrow}</p><h1 id={titleId}><span>{highlight}</span><br />{title}</h1>{children}</div><figure className="public-hero-media">{media}<figcaption>{caption}</figcaption></figure></section></div>
}
