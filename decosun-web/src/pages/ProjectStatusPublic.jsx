import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

const progressMap = {
  "Cotización recibida": 10,
  "Cotización enviada": 20,
  "En seguimiento": 30,
  "Pedido confirmado": 40,
  "Preparación técnica": 55,
  "En preparación": 65,
  "En producción": 75,
  "Instalación programada": 90,
  "Documento final": 95,
  "Finalizado": 100,
}

const timeline = [
  "Cotización recibida",
  "Pedido confirmado",
  "En producción",
  "Instalación programada",
  "Finalizado",
]

const timelineProgress = [10, 40, 75, 90, 100]

function formatCLP(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function formatFinanceStatus(status) {
  if (status === "paid") return "Pagado"
  if (status === "partial") return "Pago parcial"
  if (status === "overpaid") return "Sobrepagado"

  return "Pendiente"
}

function getPublicFinance(project) {
  const saleValue = Math.max(0, Number(project.sale_value || 0))

  const amountPaid =
    project.amount_paid_cached != null
      ? Math.max(0, Number(project.amount_paid_cached || 0))
      : 0

  const balance =
    project.balance_cached != null
      ? Math.max(0, Number(project.balance_cached || 0))
      : Math.max(saleValue - amountPaid, 0)

  return {
    saleValue,
    amountPaid,
    balance,
    financeStatus: project.finance_status || "pending",
  }
}

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
      .rpc("get_project_status", {
        p_token: token,
      })
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        Cargando estado del proyecto...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        Proyecto no encontrado
      </div>
    )
  }

  const currentStatus = project.client_visible_status || "Cotización recibida"
  const progress = progressMap[currentStatus] || 10
  const { saleValue, amountPaid, balance, financeStatus } =
    getPublicFinance(project)

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
          DecoSun
        </p>

        <h1 className="mt-3 text-4xl font-bold md:text-6xl">
          Estado de su proyecto
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Revise el avance general de su solicitud o proyecto DecoSun. Esta
          información se actualiza desde nuestro panel interno.
        </p>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-slate-400">Cliente</p>
              <h2 className="mt-1 text-3xl font-bold">
                {project.contact_name || "Cliente"}
              </h2>

              <p className="mt-3 text-slate-400">
                {project.city || "Ciudad no registrada"}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-300 px-5 py-4 text-slate-950">
              <p className="text-xs font-bold uppercase tracking-wide">
                Estado actual
              </p>
              <p className="mt-1 text-lg font-black">
                {currentStatus}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex justify-between text-sm text-slate-400">
              <span>Avance del proyecto</span>
              <span>{progress}%</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-300 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mt-8 grid gap-6 md:grid-cols-4">
              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Nº Cotización</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {project.quote_number || "-"}
                </h3>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Valor proyecto</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {formatCLP(saleValue)}
                </h3>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Abonado</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {formatCLP(amountPaid)}
                </h3>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
                  {formatFinanceStatus(financeStatus)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">Saldo pendiente</p>
                <h3 className="mt-2 text-xl font-semibold">
                  {formatCLP(balance)}
                </h3>
              </div>
            </div>

            <div className="mt-10">
              <h3 className="mb-6 text-2xl font-bold">
                Seguimiento
              </h3>

              <div className="space-y-4">
                {timeline.map((step, index) => {
                  const completed = progress >= timelineProgress[index]
                  const isCurrent =
                    step === currentStatus ||
                    (!completed &&
                      progress < timelineProgress[index] &&
                      progress >= (timelineProgress[index - 1] || 0))

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-4 rounded-2xl p-4 ${completed
                        ? "bg-white/[0.06]"
                        : isCurrent
                          ? "bg-amber-300/10"
                          : "bg-white/[0.03]"
                        }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${completed
                          ? "bg-amber-300 text-slate-950"
                          : isCurrent
                            ? "border border-amber-300 text-amber-300"
                            : "bg-white/10 text-slate-400"
                          }`}
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {step}
                        </p>

                        <p className="text-sm text-slate-400">
                          {completed
                            ? "Etapa completada o en curso."
                            : isCurrent
                              ? "Etapa actual del proyecto."
                              : "Próxima etapa."}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-10 rounded-2xl bg-white/[0.04] p-6">
              <p className="mb-2 text-slate-400">Observaciones</p>
              <p className="leading-7 text-slate-200">
                {project.summary ||
                  "Su proyecto se encuentra en proceso. Para más información contacte a DecoSun."}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="text-sm leading-7 text-amber-100">
                Si necesita actualizar información, coordinar una visita o hacer
                una consulta adicional, comuníquese con su asesor DecoSun.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-400">
            DecoSun · Decoración y Control Solar
          </div>
        </div>
      </div>
    </main>
  )
}
