import { formatRequestDate, requestDestination, requestNumber, requestStage, requestStageLabel } from "./requestPresentation"

const money = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

export default function RequestCard({ request, items, onOpen }) {
  const materialCount = new Set(items.map((item) => item.material_name || item.description).filter(Boolean)).size
  const priority = request.priority || request.urgency
  const hasAmount = Number(request.total_amount || request.estimated_amount || 0) > 0
  return <article className="request-card">
    <div className="request-card-main">
      <div className="request-card-title"><strong>{requestNumber(request)}</strong><span className={`request-badge is-${requestStage(request)}`}>{requestStageLabel(request)}</span>{priority && <span className="request-priority">Prioridad {priority}</span>}</div>
      <h3>{requestDestination(items)}</h3>
      <p>{items.length} material{items.length === 1 ? "" : "es"}{materialCount !== items.length && ` · ${materialCount} tipos`}</p>
      <small>Solicitado por {request.requested_by || "usuario"} · {formatRequestDate(request.created_at)}</small>
    </div>
    <div className="request-card-actions">{hasAmount && <strong>{money(request.total_amount || request.estimated_amount)}</strong>}<button type="button" className="secondary-btn" onClick={() => onOpen(request)}>Ver solicitud</button></div>
  </article>
}
