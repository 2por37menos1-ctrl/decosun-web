const originLabels = { cliente: "Proyecto / cliente", inventario: "Reponer stock", garantia: "Garantía", reposicion: "Reposición" }

export default function RequestReviewStep({ draft, destination, onChange }) {
  return <div className="request-step"><div className="request-step-heading"><span>Paso 3 de 3</span><h2>Revisa la solicitud</h2><p>La necesidad se guardará solamente cuando confirmes.</p></div>
    <div className="request-review-grid"><section><span>Destino</span><strong>{destination}</strong></section><section><span>Origen</span><strong>{originLabels[draft.origin]}</strong></section><section className="request-review-materials"><span>Materiales</span>{draft.materials.map((item, index) => <div key={`${item.material_name}-${index}`}><strong>{item.material_name}</strong><span>{item.quantity} {item.unit}</span>{item.description && <small>{item.description}</small>}</div>)}</section><section className="request-review-notes"><label>Observaciones<textarea rows="3" value={draft.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Información útil para revisar la necesidad" /></label></section></div>
    <div className="request-schema-note">Prioridad y fecha requerida se incorporarán cuando exista persistencia compatible. No se guardan valores temporales que puedan perderse.</div>
  </div>
}
