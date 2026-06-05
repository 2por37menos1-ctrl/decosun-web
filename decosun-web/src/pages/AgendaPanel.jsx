import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import { useProfile } from "../hooks/useProfile"

const estadosAgenda = [
  "Pendiente",
  "Agendada",
  "Confirmado",
  "En ruta",
  "Medición realizada",
  "Producción",
  "Instalación agendada",
  "Finalizado",
  "Convertido",
]

export default function AgendaPanel() {
  const { profile, loading: profileLoading } = useProfile()

  const [agenda, setAgenda] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("all")

  useEffect(() => {
    if (profileLoading) return

    if (!profile) {
      setAgenda([])
      setLoading(false)
      return
    }

    fetchAgenda()
  }, [profileLoading, profile?.id, profile?.role, profile?.region_code, profile?.advisor_id])

  async function fetchAgenda() {
    if (!profile) return

    setLoading(true)

    let query = supabase
      .from("agenda")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (profile.role === "asesor_comercial") {
      if (!profile.advisor_id) {
        setAgenda([])
        setLoading(false)
        return
      }

      query = query.eq("advisor_id", profile.advisor_id)
    } else if (
      profile.role !== "gerencia" &&
      profile.region_code
    ) {
      query = query.eq("region_code", profile.region_code)
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      alert("No se pudo cargar la agenda")
      setLoading(false)
      return
    }

    setAgenda(data || [])
    setLoading(false)
  }

  async function updateEstado(id, estado) {
    const { error } = await supabase
      .from("agenda")
      .update({ estado })
      .eq("id", id)

    if (error) {
      console.error(error)
      alert("No se pudo actualizar el estado")
      return
    }

    setAgenda((current) =>
      current.map((item) =>
        item.id === id ? { ...item, estado } : item
      )
    )
  }

  async function deleteAgendaItem(id) {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas borrar esta agenda?"
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from("agenda")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error(error)
      alert("No se pudo borrar la agenda")
      return
    }

    setAgenda((current) => current.filter((item) => item.id !== id))
  }

  async function convertToProject(item) {
    const confirmConvert = window.confirm(
      "¿Convertir esta agenda en proyecto?"
    )

    if (!confirmConvert) return

    const projectId = crypto.randomUUID()

    const { error: projectError } = await supabase
      .from("projects")
      .insert([
        {
          id: projectId,
          title: `${item.nombre || "Cliente"} · Agenda`,
          contact_name: item.nombre || "",
          contact_phone: item.telefono || "",
          city: item.ciudad || "",
          summary: item.observaciones || "",
          visit_date: item.fecha || null,
          visit_time: item.horario || null,
          sale_value: 0,
          amount_paid: 0,
          status: "agendado",
          payment_status: "pendiente",
          payment_type: "pendiente",
          region_code: item.region_code || profile?.region_code || "quinta_region",
          address: item.address || "",
          client_type: "Residencial",
          company_name: "Decosun Group SpA",
          source: "agenda",
          client_visible_status: "Visita coordinada",
          public_token: crypto.randomUUID(),

          advisor_id: item.advisor_id || profile?.advisor_id || null,
          advisor_name: item.advisor_name || profile?.full_name || "",
          advisor_email: item.advisor_email || profile?.email || "",
          advisor_region: item.advisor_region || profile?.region_code || "",
          advisor_commission_rate: 20,
          advisor_commission_type: "base",
          advisor_commission_amount: 0,
          advisor_commission_status: "pendiente",
        },
      ])

    if (projectError) {
      console.error(projectError)
      alert("No se pudo convertir en proyecto")
      return
    }

    const { error: agendaError } = await supabase
      .from("agenda")
      .update({
        estado: "Convertido",
      })
      .eq("id", item.id)

    if (agendaError) {
      console.error(agendaError)
      alert("El proyecto fue creado, pero no se pudo actualizar la agenda")
      return
    }

    setAgenda((current) =>
      current.map((agendaItem) =>
        agendaItem.id === item.id
          ? { ...agendaItem, estado: "Convertido" }
          : agendaItem
      )
    )

    alert("Agenda convertida en proyecto")
  }

  const filteredAgenda = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return agenda.filter((item) => {
      const matchesSearch =
        !search ||
        item.nombre?.toLowerCase().includes(search) ||
        item.telefono?.toLowerCase().includes(search) ||
        item.ciudad?.toLowerCase().includes(search) ||
        item.tipo?.toLowerCase().includes(search) ||
        item.observaciones?.toLowerCase().includes(search)

      const matchesEstado =
        estadoFilter === "all" || item.estado === estadoFilter

      return matchesSearch && matchesEstado
    })
  }, [agenda, searchTerm, estadoFilter])

  if (loading || profileLoading) {
    return (
      <div className="p-10 text-white bg-slate-950 min-h-screen">
        Cargando agenda...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Panel DecoSun
          </p>

          <h1 className="mt-3 text-5xl font-bold">
            Agenda de visitas
          </h1>

          <p className="mt-3 text-slate-400">
            {filteredAgenda.length} agenda(s) visibles
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAgenda}
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
        >
          Actualizar
        </button>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_260px]">
        <input
          type="text"
          placeholder="Buscar por cliente, teléfono, ciudad, tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
        />

        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 text-white outline-none focus:border-amber-300"
        >
          <option value="all">Todos los estados</option>

          {estadosAgenda.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      </div>

      {filteredAgenda.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
          No hay agendas visibles con los filtros actuales.
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAgenda.map((item) => {
            const alreadyConverted = item.estado === "Convertido"

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {item.nombre || "Sin nombre"}
                      </h2>

                      <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                        {item.estado || "Pendiente"}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      {item.tipo || "Sin tipo"} · {item.ciudad || "Sin ciudad"}
                    </p>

                    <p className="text-slate-400">
                      {item.telefono || "Sin teléfono"}
                    </p>

                    <p className="text-slate-400">
                      {item.fecha || "Sin fecha"} ·{" "}
                      {item.horario || "Sin horario"}
                    </p>

                    {item.address && (
                      <p className="text-slate-400">
                        {item.address}
                      </p>
                    )}

                    {item.observaciones && (
                      <p className="mt-4 max-w-3xl rounded-2xl bg-white/[0.04] p-4 text-sm text-slate-300">
                        {item.observaciones}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-[230px] flex-col gap-3">
                    <select
                      value={item.estado || "Pendiente"}
                      onChange={(e) =>
                        updateEstado(item.id, e.target.value)
                      }
                      className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
                    >
                      {estadosAgenda.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => convertToProject(item)}
                      disabled={alreadyConverted}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {alreadyConverted
                        ? "Ya convertido"
                        : "Convertir en proyecto"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAgendaItem(item.id)}
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Borrar agenda
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}