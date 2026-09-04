import RequestCard from "./RequestCard"

export default function RequestList({ requests, groupedItems, loading, onOpen }) {
  if (loading) return <div className="operations-empty">Cargando solicitudes…</div>
  if (!requests.length) return <div className="operations-empty"><strong>No hay solicitudes en esta vista.</strong><span>Crea una nueva necesidad o selecciona otro filtro.</span></div>
  return <div className="request-list">{requests.map((request) => <RequestCard key={request.id} request={request} items={groupedItems[request.id] || []} onOpen={onOpen} />)}</div>
}
