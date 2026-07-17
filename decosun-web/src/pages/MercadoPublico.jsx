import { useProfile } from "../hooks/useProfile"
import { isGerencia } from "../lib/permissions"

export default function MercadoPublico() {
  const { profile, loading } = useProfile()

  if (loading) return <div className="p-6 text-slate-500">Validando acceso...</div>

  if (!isGerencia(profile)) {
    return <div className="p-6"><div className="max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">No tienes permiso para acceder a este modulo.</div></div>
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Modulo heredado desactivado</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Radar Compra Agil en reconstruccion</h1>
        <p className="mt-3 leading-6 text-slate-600">La sincronizacion anterior fue retirada. El nuevo Radar utiliza la API publica Compra Agil V2 y estara disponible solo para gerencia.</p>
        <a href="/panel/radar-compra-agil" className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Abrir nuevo Radar</a>
      </div>
    </div>
  )
}
