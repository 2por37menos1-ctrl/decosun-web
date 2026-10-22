import { Link } from "react-router-dom"
import { coverageCities } from "../lib/siteSeo"

export default function BrandSupport({ motorization = false }) {
  return (
    <section className="bg-amber-50 px-6 py-16 lg:px-8" aria-labelledby="respaldo-decosun-title">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">Respaldo de marca y atención regional</p>
        <h2 id="respaldo-decosun-title" className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Garantía DecoSun, también en tu ciudad</h2>
        <dl className="mt-8 grid gap-5 sm:grid-cols-3">
          {(motorization ? [["5 años", "Motores suministrados por DecoSun"], ["1 año", "Instalación"], ["Evaluación", "Compatibilidad de tu cortina existente"]] : [["5 años", "Cortinas suministradas por DecoSun"], ["5 años", "Motores suministrados por DecoSun"], ["1 año", "Instalación"]]).map(([term, label]) => (
            <div key={label} className="rounded-2xl border border-amber-100 bg-white p-6"><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-2 text-3xl font-black text-slate-950">{term}</dd></div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-6 text-slate-700">Estos plazos corresponden a las cortinas y motores suministrados por DecoSun y a su instalación.</p>
        {motorization && <p className="mt-5 text-sm leading-6 text-slate-700">Al motorizar una cortina existente, la garantía corresponde al motor suministrado y a la instalación; no incorpora una nueva garantía para la cortina anterior.</p>}
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div><h3 className="font-black">Iquique</h3><p className="mt-2 leading-7 text-slate-700">Tienda física con atención al público.</p></div>
          <div><h3 className="font-black">Región de Valparaíso</h3><p className="mt-2 leading-7 text-slate-700">Taller de fabricación sin atención al público. Atención en terreno coordinada con nuestro técnico encargado, radicado en Valparaíso.</p></div>
          <div><h3 className="font-black">Santiago</h3><p className="mt-2 leading-7 text-slate-700">Fábrica principal y respaldo para la atención regional y las licitaciones públicas.</p></div>
        </div>
        <p className="mt-8 leading-7 text-slate-700">En Arica, Copiapó, Vallenar, La Serena, Concepción y Temuco contamos con técnicos certificados por DecoSun: formación propia, pruebas en terreno y respaldo continuo de la marca. Se mantiene la misma garantía DecoSun. Consulta disponibilidad y coordinación del servicio para tu ubicación.</p>
        <p className="mt-4 text-sm text-slate-600">Cobertura: {coverageCities.join(" · ")}.</p>
        <Link to="/garantia" className="mt-6 inline-flex min-h-11 items-center font-bold text-amber-800 underline underline-offset-4">Conoce nuestra garantía y solicita atención →</Link>
      </div>
    </section>
  )
}
