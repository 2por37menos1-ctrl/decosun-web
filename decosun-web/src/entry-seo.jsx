import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import WhatsAppButton from "./components/WhatsAppButton"
import Home from "./pages/Home"
import Soluciones from "./pages/Soluciones"
import Motorizacion from "./pages/Motorizacion"
import Mantencion from "./pages/Mantencion"
import Proyectos from "./pages/Proyectos"
import Nosotros from "./pages/Nosotros"
import Garantia from "./pages/Garantia"
import NotFound from "./pages/NotFound"

const pages = { "/": Home, "/soluciones": Soluciones, "/motorizacion": Motorizacion, "/mantencion": Mantencion, "/proyectos": Proyectos, "/nosotros": Nosotros, "/garantia": Garantia }

// Only commercial pages are rendered at build time: no auth, ERP or client data.
export function renderPage(path) {
  return renderToString(<MemoryRouter initialEntries={[path]}><div className="min-h-screen bg-white text-slate-800"><Navbar />{createElement(pages[path] || NotFound)}<Footer /><WhatsAppButton /></div></MemoryRouter>)
}
