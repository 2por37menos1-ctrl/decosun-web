const origins = [
  ["cliente", "Proyecto / Cliente", "Material para ejecutar un proyecto existente."],
  ["inventario", "Reponer stock", "Necesidad general para mantener disponibilidad."],
  ["garantia", "Garantía", "Material para resolver una garantía de cliente."],
  ["reposicion", "Reposición", "Reemplazo por daño, pérdida u otra incidencia."],
]

export default function RequestOriginStep({ projects, draft, onChange }) {
  return <div className="request-step"><div className="request-step-heading"><span>Paso 1 de 3</span><h2>¿Para qué necesitas material?</h2><p>Elige el origen de la necesidad. La compra se gestionará después.</p></div>
    <div className="request-origin-grid">{origins.map(([value, title, description]) => <button type="button" key={value} className={draft.origin === value ? "active" : ""} onClick={() => onChange({ origin: value, projectId: value === "cliente" ? draft.projectId : "", generation: "manual" })}><strong>{title}</strong><span>{description}</span></button>)}</div>
    {draft.origin === "cliente" && <div className="request-origin-project"><label>Proyecto<select value={draft.projectId} onChange={(event) => onChange({ projectId: event.target.value })}><option value="">Selecciona un proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><div><span>¿Cómo quieres generar la solicitud?</span><div className="request-generation-options"><button type="button" disabled title="Integración preparada para una fase posterior">Desde medidas / cálculo del proyecto <small>Próximamente</small></button><button type="button" className="active" onClick={() => onChange({ generation: "manual" })}>Ingresar materiales manualmente</button></div></div></div>}
  </div>
}
