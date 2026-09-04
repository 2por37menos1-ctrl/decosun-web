import { useState } from "react"

const emptyMaterial = { material_name: "", description: "", quantity: 1, unit: "unidad", notes: "" }

export default function RequestMaterialsStep({ draft, destination, materialNames, onChange }) {
  const [material, setMaterial] = useState(emptyMaterial)
  const [creatingMaterial, setCreatingMaterial] = useState(false)
  const [localName, setLocalName] = useState("")

  function addMaterial() {
    if (!material.material_name.trim()) return alert("Indica el material que necesitas.")
    if (Number(material.quantity) <= 0) return alert("La cantidad debe ser mayor que cero.")
    onChange({ materials: [...draft.materials, { ...material, quantity: Number(material.quantity) }] })
    setMaterial(emptyMaterial)
  }

  return <div className="request-step"><div className="request-step-heading"><span>Paso 2 de 3</span><h2>¿Qué materiales necesitas?</h2><p>Agrega materiales como en un carrito interno. No necesitas conocer proveedor ni precio.</p></div>
    <div className="request-material-entry">
      <label>Material<input list="request-material-catalog" value={material.material_name} onChange={(event) => setMaterial((current) => ({ ...current, material_name: event.target.value }))} placeholder="Buscar o escribir material" /><datalist id="request-material-catalog">{materialNames.map((name) => <option key={name} value={name} />)}</datalist><button type="button" className="operations-link-btn" onClick={() => setCreatingMaterial(true)}>+ Crear material</button></label>
      <label>Cantidad<input type="number" min="0.01" step="any" value={material.quantity} onChange={(event) => setMaterial((current) => ({ ...current, quantity: event.target.value }))} /></label>
      <label>Unidad<input value={material.unit} onChange={(event) => setMaterial((current) => ({ ...current, unit: event.target.value }))} placeholder="unidad, ml, barra…" /></label>
      <label className="request-material-notes">Detalle opcional<input value={material.description} onChange={(event) => setMaterial((current) => ({ ...current, description: event.target.value }))} placeholder="Color, medida o especificación" /></label>
      <button type="button" className="primary-btn request-add-material" onClick={addMaterial}>Agregar material</button>
    </div>
    {creatingMaterial && <div className="operations-inline-editor"><input autoFocus value={localName} onChange={(event) => setLocalName(event.target.value)} placeholder="Nombre del nuevo material" /><button type="button" className="primary-btn" onClick={() => { if (localName.trim()) setMaterial((current) => ({ ...current, material_name: localName.trim() })); setLocalName(""); setCreatingMaterial(false) }}>Usar material</button><button type="button" className="secondary-btn" onClick={() => setCreatingMaterial(false)}>Cancelar</button><small>Se usará en esta solicitud. No crea todavía un registro permanente de catálogo.</small></div>}
    {draft.materials.length === 0 ? <div className="request-cart-empty">Aún no agregas materiales.</div> : <div className="request-cart"><div className="request-cart-head"><span>Material</span><span>Cantidad</span><span>Destino</span><span></span></div>{draft.materials.map((item, index) => <div className="request-cart-row" key={`${item.material_name}-${index}`}><div><strong>{item.material_name}</strong>{item.description && <small>{item.description}</small>}</div><span>{item.quantity} {item.unit}</span><span>{destination}</span><button type="button" className="operations-link-btn" onClick={() => onChange({ materials: draft.materials.filter((_, itemIndex) => itemIndex !== index) })}>Quitar</button></div>)}</div>}
  </div>
}
