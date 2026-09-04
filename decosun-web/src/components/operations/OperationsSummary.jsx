function Metric({ label, value, unavailable }) {
  return <div className="stat-card"><span>{label}</span><strong>{unavailable ? "Próximamente" : value}</strong></div>
}

export default function OperationsSummary({ requests, items, onOpenRequests }) {
  const active = requests.filter((request) => !["recibido", "anulado"].includes(request.status))
  const pending = requests.filter((request) => request.status === "solicitado")
  const approved = requests.filter((request) => request.status === "aprobado")
  const awaitingReception = requests.filter((request) => request.reception_status !== "recibido" && request.status !== "anulado")
  const projectIds = new Set(items.filter((item) => item.project_id).map((item) => item.project_id))

  return <>
    <div className="stats-grid operations-stats">
      <Metric label="Solicitudes pendientes" value={pending.length} />
      <Metric label="Solicitudes aprobadas" value={approved.length} />
      <Metric label="Pendientes de recepción" value={awaitingReception.length} />
      <Metric label="Proyectos con requerimientos" value={projectIds.size} />
      <Metric label="Inventario disponible" unavailable />
      <Metric label="Órdenes listas para fabricación" unavailable />
    </div>
    <section className="treasury-table operations-section">
      <div className="section-heading">
        <div><h2>Pendientes operacionales</h2><p>Solicitudes reales que todavía requieren gestión o recepción.</p></div>
        <button className="secondary-btn" onClick={onOpenRequests}>Ver solicitudes</button>
      </div>
      {active.length === 0 ? <div className="operations-empty">No hay solicitudes operacionales pendientes.</div> :
        <div className="operations-pending-list">{active.slice(0, 6).map((request) => <article key={request.id}>
          <div><strong>Solicitud #{request.request_number || "—"}</strong><span>{request.supplier_name || "Proveedor por definir"}</span></div>
          <span className="operations-status">{request.status}</span>
        </article>)}</div>}
    </section>
  </>
}
