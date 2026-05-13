import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-20">
      <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500 flex justify-between">
        <p>© 2026 Decosun</p>

        <div className="flex gap-6">
          <Link to="/soluciones">Soluciones</Link>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/cotizar">Cotizar</Link>
        </div>
      </div>
    </footer>
  )
}