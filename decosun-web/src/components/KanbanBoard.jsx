const columns = [
  { id: "cotizado", label: "Cotizado", color: "#6b7280" },
  { id: "seguimiento", label: "Seguimiento", color: "#f59e0b" },
  { id: "aceptado", label: "Aceptado", color: "#10b981" },
  { id: "medicion", label: "Medición", color: "#06b6d4" },
  { id: "compras", label: "Compras", color: "#f97316" },
  { id: "produccion", label: "Producción", color: "#3b82f6" },
  { id: "instalacion", label: "Instalación", color: "#8b5cf6" },
  { id: "facturacion", label: "Facturación", color: "#ef4444" },
  { id: "cerrado", label: "Cerrado", color: "#166534" },
]

const publicStatusMap = {
  cotizado: "Cotización enviada",
  seguimiento: "En seguimiento",
  aceptado: "Pedido confirmado",
  medicion: "Preparación técnica",
  compras: "En preparación",
  produccion: "En producción",
  instalacion: "Instalación programada",
  facturacion: "Documento final",
  cerrado: "Finalizado",
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

export default function KanbanBoard({
  projects,
  onStatusChange,
  onProjectClick,
  onDeleteProject,
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

        return (
          <section
            key={column.id}
            className="kanban-column"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.id)}
          >
            <div
              className="column-header"
              style={{
                borderTop: `4px solid ${column.color}`,
              }}
            >
              <div>
                <h3>{column.label}</h3>
                <p>{money(columnTotal)}</p>
              </div>

              <span>{columnProjects.length}</span>
            </div>

            <div className="column-cards">
              {columnProjects.map((project) => {
                const balance =
                  Number(project.sale_value || 0) -
                  Number(project.amount_paid || 0)

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
                        <h4>{project.title || "Sin título"}</h4>
                        <p>{project.city || "Sin ciudad"}</p>
                      </div>

                      <div
                        className="status-dot"
                        style={{
                          background: column.color,
                        }}
                      />
                    </div>

                    <div className="public-status">
                      {publicStatusMap[project.status] || "Sin estado público"}
                    </div>

                    <div className="card-tags">
                      {project.client_type && <span>{project.client_type}</span>}
                      {project.priority && <span>{project.priority}</span>}
                      {project.region_code && <span>{project.region_code}</span>}
                    </div>

                    <div className="card-finance">
                      <div>
                        <small>Venta</small>
                        <strong>{money(project.sale_value)}</strong>
                      </div>

                      <div>
                        <small>Pagado</small>
                        <strong>{money(project.amount_paid)}</strong>
                      </div>
                    </div>

                    <div className="card-balance">
                      <small>Saldo</small>
                      <strong>{money(balance)}</strong>
                    </div>

                    <div className="card-footer">
                      <small>
                        {project.payment_status || "Sin estado pago"}
                      </small>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteProject(project.id)
                        }}
                        className="mt-2 rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                      >
                        Borrar
                      </button>
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