function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

function formatDate(dateString) {
  if (!dateString) return "-"

  return new Date(dateString).toLocaleDateString("es-CL")
}

export default function CommercialArchived({
  projects,
  onProjectClick,
}) {
  const archivedProjects = projects
    .filter((project) => project.archived)
    .sort(
      (a, b) =>
        new Date(b.archive_date || 0) -
        new Date(a.archive_date || 0)
    )

  const totalLost = archivedProjects.reduce(
    (acc, project) =>
      acc + Number(project.lost_amount || 0),
    0
  )

  const reasons = archivedProjects.reduce((acc, project) => {
    const reason =
      project.archive_reason || "Sin motivo"

    acc[reason] = (acc[reason] || 0) + 1

    return acc
  }, {})

  const statuses = archivedProjects.reduce((acc, project) => {
    const status =
      project.archive_status || "Sin estado"

    acc[status] = (acc[status] || 0) + 1

    return acc
  }, {})

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Clientes archivados</span>
          <strong>{archivedProjects.length}</strong>
        </div>

        <div className="stat-card">
          <span>Venta perdida</span>
          <strong>{money(totalLost)}</strong>
        </div>

        <div className="stat-card">
          <span>Ticket promedio</span>
          <strong>
            {money(
              archivedProjects.length
                ? totalLost /
                    archivedProjects.length
                : 0
            )}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div className="treasury-table">
          <div className="dashboard-header">
            <h2>Motivos</h2>
          </div>

          {Object.entries(reasons).map(
            ([reason, total]) => (
              <p key={reason}>
                <strong>{total}</strong> · {reason}
              </p>
            )
          )}
        </div>

        <div className="treasury-table">
          <div className="dashboard-header">
            <h2>Etapa de pérdida</h2>
          </div>

          {Object.entries(statuses).map(
            ([status, total]) => (
              <p key={status}>
                <strong>{total}</strong> · {status}
              </p>
            )
          )}
        </div>
      </div>

      <section className="treasury-table">
        <div className="dashboard-header">
          <div>
            <h2>Clientes Archivados</h2>
            <p>
              Historial de oportunidades
              perdidas.
            </p>
          </div>
        </div>

        {archivedProjects.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            No existen clientes archivados.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Motivo</th>
                <th>Monto</th>
                <th>Etapa</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {archivedProjects.map(
                (project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>
                        {project.title}
                      </strong>
                    </td>

                    <td>
                      {project.archive_reason ||
                        "-"}
                    </td>

                    <td>
                      {money(
                        project.lost_amount
                      )}
                    </td>

                    <td>
                      {project.archive_status ||
                        "-"}
                    </td>

                    <td>
                      {formatDate(
                        project.archive_date
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() =>
                          onProjectClick(
                            project
                          )
                        }
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}