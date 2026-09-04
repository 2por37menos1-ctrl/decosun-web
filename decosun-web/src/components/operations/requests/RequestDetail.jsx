import { formatRequestDate, requestDestination, requestNumber, requestStage, requestStageLabel } from "./requestPresentation"

const progress = [["pending", "Solicitada"], ["review", "Revisada"], ["purchase", "En compra"], ["received", "Recibida"], ["closed", "Cerrada"]]
const money = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`

export default function RequestDetail({ request, items, onBack }) {
  const currentStage = requestStage(request)
  const currentIndex = progress.findIndex(([id]) => id === currentStage)
  const amount = Number(request.total_amount || request.estimated_amount || 0)
  return <section className="request-detail treasury-table">
    <header className="request-detail-header"><div><button type="button" className="operations-link-btn" onClick={onBack}>← Volver a solicitudes</button><div className="request-detail-title"><div><h1>{requestNumber(request)}</h1><p>{requestDestination(items)}</p></div><span className={`request-badge is-${currentStage}`}>{requestStageLabel(request)}</span></div></div></header>
    <div className="request-timeline">{progress.map(([id, label], index) => <div key={id} className={index <= currentIndex ? "active" : ""}><span></span><small>{label}</small></div>)}</div>
    <div className="request-detail-grid">
      <section><header><span>Solicitud</span><h2>Qué se pidió</h2></header><dl><div><dt>Solicitante</dt><dd>{request.requested_by || "—"}</dd></div><div><dt>Fecha</dt><dd>{formatRequestDate(request.created_at)}</dd></div>{(request.priority || request.urgency) && <div><dt>Prioridad</dt><dd>{request.priority || request.urgency}</dd></div>}</dl><div className="request-detail-materials">{items.map((item, index) => <article key={item.id || `${item.material_name}-${index}`}><div><strong>{item.material_name || item.description || "Material"}</strong>{item.description && item.material_name && <small>{item.description}</small>}</div><span>{item.quantity} {item.unit}</span></article>)}</div>{request.notes && <div className="request-detail-note"><span>Observaciones</span><p>{request.notes}</p></div>}</section>
      <section><header><span>Compra</span><h2>Gestión de compra</h2></header>{request.supplier_name && request.supplier_name !== "Por definir" ? <dl><div><dt>Proveedor</dt><dd>{request.supplier_name}</dd></div>{amount > 0 && <div><dt>Monto estimado</dt><dd>{money(amount)}</dd></div>}<div><dt>Estado de pago</dt><dd>{request.payment_status || "Sin información"}</dd></div></dl> : <div className="request-detail-empty"><strong>Compra aún no gestionada</strong><span>El proveedor, precio y orden de compra se definirán en una etapa posterior.</span></div>}</section>
      <section><header><span>Recepción</span><h2>Material recibido</h2></header>{request.reception_status === "recibido" ? <dl><div><dt>Estado</dt><dd>Recibido</dd></div><div><dt>Fecha</dt><dd>{formatRequestDate(request.received_at || request.received_date)}</dd></div></dl> : <div className="request-detail-empty"><strong>Pendiente de recepción</strong><span>Aún no existe información de materiales recibidos.</span></div>}</section>
    </div>
  </section>
}
