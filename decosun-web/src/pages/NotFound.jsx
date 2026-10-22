import { Link } from "react-router-dom"

export default function NotFound() {
  return <main className="mx-auto min-h-[60vh] max-w-4xl px-6 pb-20 pt-40"><p className="font-bold text-amber-700">404</p><h1 className="mt-4 text-4xl font-black">No encontramos esta página</h1><p className="mt-5 text-lg text-slate-600">Explora nuestras soluciones o consulta por la motorización de tus cortinas roller.</p><div className="mt-8 flex flex-wrap gap-6"><Link to="/motorizacion" className="font-bold text-amber-800 underline">Ver motorización</Link><Link to="/" className="font-bold underline">Volver al inicio</Link></div></main>
}
