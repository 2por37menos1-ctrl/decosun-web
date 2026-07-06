const columns = [
  { id: "agendado", label: "Agendado", color: "#0ea5e9" },
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
  agendado: "Visita coordinada",
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

function cleanPhone(phone) {
  const onlyNumbers = String(phone || "").replace(/\D/g, "")

  if (!onlyNumbers) return ""

  if (onlyNumbers.startsWith("56")) return onlyNumbers

  if (onlyNumbers.startsWith("9")) return `56${onlyNumbers}`

  return onlyNumbers
}

function timeAgo(dateString) {
  if (!dateString) return "Sin fecha"

  const now = new Date()
  const date = new Date(dateString)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return "Hace unos segundos"
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`

  return date.toLocaleDateString("es-CL")
}

function getActivityStatus(updatedAt) {
  if (!updatedAt) {
    return {
      label: "Sin actividad registrada",
      background: "#f1f5f9",
      color: "#475569",
    }
  }

  const now = new Date()
  const date = new Date(updatedAt)
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

  if (diffDays <= 1) {
    return {
      label: "Activo hoy",
      background: "#dcfce7",
      color: "#166534",
    }
  }

  if (diffDays <= 3) {
    return {
      label: `Sin movimiento hace ${diffDays} días`,
      background: "#fef9c3",
      color: "#854d0e",
    }
  }

  if (diffDays <= 7) {
    return {
      label: `Sin movimiento hace ${diffDays} días`,
      background: "#ffedd5",
      color: "#9a3412",
    }
  }

  return {
    label: `⚠️ Requiere seguimiento · ${diffDays} días`,
    background: "#fee2e2",
    color: "#991b1b",
  }
}

function getProjectAddress(project) {
  return [
    project.address,
    project.city,
    project.region_code,
    "Chile",
  ]
    .filter(Boolean)
    .join(", ")
}

function openMaps(project) {
  const address = getProjectAddress(project)

  if (!address.trim()) {
    alert("Este proyecto no tiene dirección o ciudad registrada.")
    return
  }

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`,
    "_blank"
  )
}

function openWhatsApp(project) {
  const phone = cleanPhone(project.contact_phone)

  if (!phone) {
    alert("Este proyecto no tiene teléfono registrado.")
    return
  }

  const message = encodeURIComponent(
    `Hola ${project.contact_name || ""}, soy de DecoSun. Le escribo por el proyecto ${project.title || ""
    }.`
  )

  window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
}

function openCall(project) {
  const phone = cleanPhone(project.contact_phone)

  if (!phone) {
    alert("Este proyecto no tiene teléfono registrado.")
    return
  }

  window.location.href = `tel:+${phone}`
}

function openCalendar(project) {
  const title = encodeURIComponent(
    `Visita DecoSun - ${project.contact_name || project.title || "Cliente"}`
  )

  const location = encodeURIComponent(getProjectAddress(project))

  const details = encodeURIComponent(
    [
      `Cliente: ${project.contact_name || ""}`,
      `Proyecto: ${project.title || ""}`,
      `Ciudad: ${project.city || ""}`,
      `Teléfono: ${project.contact_phone || ""}`,
      `Estado: ${publicStatusMap[project.status] || ""}`,
      "",
      "Evento creado desde el panel DecoSun.",
    ].join("\n")
  )

  window.open(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`,
    "_blank"
  )
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
                const paid = getProjectPaid(project)
                const balance = getProjectBalance(project)

                const activityStatus = getActivityStatus(project.updated_at)

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

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>🕒</span>
                      <span>
                        Ingresado {timeAgo(project.created_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        marginBottom: "8px",
                        fontSize: "12px",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>🔄</span>
                      <span>
                        Actualizado {timeAgo(project.updated_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: activityStatus.background,
                        color: activityStatus.color,
                        marginBottom: "10px",
                      }}
                    >
                      {activityStatus.label}
                    </div>

                    <div className="card-finance">
                      <div>
                        <small>Venta</small>
                        <strong>{money(project.sale_value)}</strong>
                      </div>

                      <div>
                        <small>Pagado</small>
                        <strong>{money(paid)}</strong>
                      </div>
                    </div>

                    <div className="card-balance">
                      <small>Saldo</small>
                      <strong>{money(balance)}</strong>
                    </div>

                    <div className="card-actions">
                      <button
                        type="button"
                        title="Abrir en Google Maps"
                        onClick={(event) => {
                          event.stopPropagation()
                          openMaps(project)
                        }}
                      >
                        📍
                      </button>

                      <button
                        type="button"
                        title="Agendar en Google Calendar"
                        onClick={(event) => {
                          event.stopPropagation()
                          openCalendar(project)
                        }}
                      >
                        📅
                      </button>

                      <button
                        type="button"
                        title="Llamar"
                        onClick={(event) => {
                          event.stopPropagation()
                          openCall(project)
                        }}
                      >
                        📞
                      </button>

                      <button
                        type="button"
                        title="Abrir WhatsApp"
                        onClick={(event) => {
                          event.stopPropagation()
                          openWhatsApp(project)
                        }}
                      >
                        💬
                      </button>
                    </div>

                    <div className="card-footer">
                      <small>
                        {project.payment_status || "Sin estado pago"}
                      </small>

                      <button
                        type="button"
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
                        className="mt-2 rounded-xl bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-700"
                      >
                        Archivar
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
