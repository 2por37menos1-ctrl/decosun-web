const columns = [
  { id: "agendado", label: "Agendado", color: "#0ea5e9" },
  { id: "cotizado", label: "Cotizado", color: "#7c3aed" },
  { id: "seguimiento", label: "Seguimiento", color: "#f59e0b" },
  { id: "aceptado", label: "Aceptado", color: "#10b981" },
  { id: "medicion", label: "Medicion", color: "#06b6d4" },
  { id: "compras", label: "Compras", color: "#f97316" },
  { id: "produccion", label: "Produccion", color: "#8b5cf6" },
  { id: "instalacion", label: "Instalacion", color: "#22c55e" },
  { id: "facturacion", label: "Facturacion", color: "#1e3a8a" },
  { id: "cerrado", label: "Cerrado", color: "#64748b" },
]

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function compactMoney(value) {
  const amount = Number(value || 0)

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toLocaleString("es-CL", {
      maximumFractionDigits: 1,
    })}M`
  }

  if (Math.abs(amount) >= 1000) {
    return `$${Math.round(amount / 1000).toLocaleString("es-CL")}k`
  }

  return money(amount)
}

function timeAgo(dateString) {
  if (!dateString) return "Sin fecha"

  const now = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return "Hoy"
  if (diff < 3600) return `${Math.floor(diff / 60)} min`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias`

  return date.toLocaleDateString("es-CL")
}

function getProjectPaid(project) {
  return Number(
    project.amount_paid_cached != null
      ? project.amount_paid_cached
      : project.amount_paid || 0
  )
}

function getProjectBalance(project) {
  const paid = getProjectPaid(project)

  return Number(
    project.balance_cached != null
      ? project.balance_cached
      : Number(project.sale_value || 0) - paid
  )
}

function getFinanceStatus(project) {
  if (project.finance_status != null) return project.finance_status

  if (project.payment_status === "pagado") return "paid"
  if (
    project.payment_status === "parcial" ||
    project.payment_status === "abonado"
  ) {
    return "partial"
  }

  return "pending"
}

function formatFinanceStatus(status) {
  if (status === "paid") return "Pagado"
  if (status === "partial") return "Parcial"
  if (status === "overpaid") return "Overpaid"
  return "Pendiente"
}

function getBalanceTone(financeStatus, balance) {
  if (financeStatus === "paid" || Number(balance || 0) <= 0) return "paid"
  if (financeStatus === "partial") return "partial"
  if (financeStatus === "overpaid") return "paid"
  return "neutral"
}

export default function KanbanBoard({
  projects,
  onStatusChange,
  onProjectClick,
  onArchiveProject,
}) {
  function handleDragStart(event, projectId) {
    event.dataTransfer.setData("projectId", projectId)
  }

  function handleDrop(event, newStatus) {
    event.preventDefault()

    const projectId = event.dataTransfer.getData("projectId")

    if (!projectId) return

    onStatusChange(projectId, newStatus)
  }

  return (
    <div className="kanban-wrapper">
      {columns.map((column) => {
        const columnProjects = projects.filter(
          (project) => project.status === column.id
        )

        const columnTotal = columnProjects.reduce(
          (acc, project) => acc + Number(project.sale_value || 0),
          0
        )

        const columnBalance = columnProjects.reduce(
          (acc, project) => acc + getProjectBalance(project),
          0
        )

        return (
          <section
            key={column.id}
            className="kanban-column"
            style={{
              "--stage-color": column.color,
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.id)}
          >
            <div
              className="column-header"
              style={{
                borderTop: `2px solid ${column.color}`,
              }}
            >
              <div className="column-title">
                <h3>
                  {column.label}
                  <span>{columnProjects.length}</span>
                </h3>
                <div className="column-kpis">
                  <div>
                    <small>Venta</small>
                    <strong>{compactMoney(columnTotal)}</strong>
                  </div>

                  <div>
                    <small>Pendiente</small>
                    <strong>{compactMoney(columnBalance)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="column-cards">
              {columnProjects.map((project) => {
                const paid = getProjectPaid(project)
                const balance = getProjectBalance(project)
                const financeStatus = getFinanceStatus(project)
                const balanceTone = getBalanceTone(financeStatus, balance)
                const advisor = project.advisor_name?.trim() || "Sin asesor"
                const primaryName =
                  project.contact_name || project.title || "Sin cliente"
                const quoteLabel =
                  project.quote_number || project.title || "Sin cotizacion"

                return (
                  <article
                    key={project.id}
                    className="kanban-card"
                    draggable
                    onClick={() => onProjectClick(project)}
                    onDragStart={(event) =>
                      handleDragStart(event, project.id)
                    }
                  >
                    <div className="card-top">
                      <div>
                        <h4>{primaryName}</h4>
                        <p>{quoteLabel}</p>
                      </div>

                      <div
                        className="status-dot"
                        style={{
                          background: column.color,
                        }}
                      />
                    </div>

                    <div className="kanban-card-meta">
                      <span>{project.region_code || "Sin region"}</span>
                      <span>{advisor}</span>
                      <span>{timeAgo(project.updated_at)}</span>
                    </div>

                    <div className="card-finance">
                      <div className="sale-amount">
                        <small>Venta</small>
                        <strong>{compactMoney(project.sale_value)}</strong>
                      </div>

                      <div className={`balance-amount is-${balanceTone}`}>
                        <small>Saldo</small>
                        <strong>{compactMoney(balance)}</strong>
                      </div>
                    </div>

                    <div className="card-footer">
                      <small
                        className={`finance-badge is-${financeStatus || "pending"}`}
                      >
                        {formatFinanceStatus(financeStatus)}
                      </small>

                      <small>{compactMoney(paid)} cobrado</small>

                      {onArchiveProject && (
                        <button
                          type="button"
                          className="archive-link"
                          onClick={(event) => {
                            event.stopPropagation()

                            const archive_reason = window.prompt(
                              "Motivo de archivo: sin_respuesta, precio_elevado, competencia, sin_presupuesto, postergado, fuera_cobertura, duplicado, otro",
                              "sin_respuesta"
                            )

                            if (!archive_reason) return

                            const lost_amount = window.prompt(
                              "Monto de oportunidad perdida",
                              project.sale_value || 0
                            )

                            const archive_notes = window.prompt(
                              "Notas del archivo / seguimiento",
                              ""
                            )

                            onArchiveProject(project.id, {
                              archive_reason,
                              lost_amount: Number(lost_amount || project.sale_value || 0),
                              archive_notes,
                            })
                          }}
                        >
                          Archivar
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
