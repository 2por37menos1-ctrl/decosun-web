import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function ProjectStatusPublic() {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProject()
  }, [token])

  async function loadProject() {
    setLoading(true)

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("public_token", token)
      .single()

    if (error) {
      console.error(error)
      setProject(null)
      setLoading(false)
      return
    }

    setProject(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Cargando estado del proyecto...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Proyecto no encontrado
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          DecoSun
        </p>

        <h1 className="mt-3 text-5xl font-bold">
          Estado de su proyecto
        </h1>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <div className="mb-8">
            <p className="text-slate-400">Cliente</p>
            <h2 className="text-3xl font-bold">
              {project.contact_name || "Cliente"}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-slate-400">Nº Cotización</p>
              <h3 className="text-xl font-semibold">
                {project.quote_number || "-"}
              </h3>
            </div>

            <div>
              <p className="text-slate-400">Ciudad</p>
              <h3 className="text-xl font-semibold">
                {project.city || "-"}
              </h3>
            </div>

            <div>
              <p className="text-slate-400">Estado actual</p>
              <h3 className="text-xl font-semibold text-amber-300">
                {project.client_visible_status || "En proceso"}
              </h3>
            </div>

            <div>
              <p className="text-slate-400">Valor proyecto</p>
              <h3 className="text-xl font-semibold">
                ${Number(project.sale_value || 0).toLocaleString("es-CL")}
              </h3>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/[0.04] p-6">
            <p className="mb-2 text-slate-400">Observaciones</p>
            <p className="leading-7 text-slate-200">
              {project.summary ||
                "Su proyecto se encuentra en proceso. Para más información contacte a DecoSun."}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-400">
          DecoSun · Decoración y Control Solar
        </div>
      </div>
    </main>
  )
}