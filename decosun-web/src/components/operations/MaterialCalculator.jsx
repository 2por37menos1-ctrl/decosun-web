import { useMemo, useState } from "react"
import { DEFAULT_ROLL_WIDTH_CM, calculateOrder, optimizeFabricByMode, parseRows, summarizeMaterials } from "../../lib/cuttingOptimizer"

const example = "2 | Roller Simple | 120 | 180 | V1 | Screen 5% | Living | Normal | Der\n1 | Roller Dúo | 150 | 200 | V2 | Dúo gris | Dormitorio | Normal | Izq"

export default function MaterialCalculator({ projects, calculation, onCalculate }) {
  const [projectId, setProjectId] = useState(calculation.projectId || "")
  const [input, setInput] = useState(calculation.input || "")
  const [defaultType, setDefaultType] = useState(calculation.defaultType || "roller_simple")
  const [defaultFabric, setDefaultFabric] = useState(calculation.defaultFabric || "Tela sin definir")
  const [error, setError] = useState("")
  const previewCount = useMemo(() => parseRows(input, { defaultType, defaultFabric }).reduce((sum, row) => sum + row.quantity, 0), [input, defaultType, defaultFabric])

  function calculate() {
    const rows = parseRows(input, { defaultType, defaultFabric })
    if (!rows.length) { setError("No se encontraron filas válidas. Revisa cantidad, ancho y alto."); return }
    const pieces = calculateOrder(rows)
    const fabricOptimization = optimizeFabricByMode(pieces, DEFAULT_ROLL_WIDTH_CM, "same-height")
    onCalculate({ projectId, input, defaultType, defaultFabric, rows, pieces, fabricOptimization, materials: summarizeMaterials(pieces, fabricOptimization) })
    setError("")
  }

  return <div className="operations-calculator-grid">
    <section className="treasury-table operations-section">
      <div className="section-heading"><div><h2>Ingreso de medidas</h2><p>Selecciona un proyecto y/o pega una orden en formato masivo.</p></div></div>
      <div className="operations-form-stack">
        <label>Proyecto (opcional)<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Sin proyecto seleccionado</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        <label>Tipo predeterminado<select value={defaultType} onChange={(event) => setDefaultType(event.target.value)}><option value="roller_simple">Roller simple MiniGap</option><option value="roller_duo">Roller DÚO</option></select></label>
        <label>Tela predeterminada<input value={defaultFabric} onChange={(event) => setDefaultFabric(event.target.value)} /></label>
        <label>Medidas<textarea rows="10" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Cantidad | Tipo | Ancho | Alto | Vano | Tela | Lugar | Caída | Izq/Der" /></label>
        <div className="operations-inline-actions"><button type="button" className="secondary-btn" onClick={() => setInput(example)}>Cargar ejemplo no persistente</button><button type="button" className="primary-btn" onClick={calculate}>Calcular materiales</button></div>
        {error && <p className="operations-error">{error}</p>}<small>{previewCount} cortina(s) reconocida(s). Se aceptan filas con o sin tipo. `1.290`, `1,290` y `1.29` se interpretan como 1,29 m; `129` y `129,0`, como 129 cm.</small>
      </div>
    </section>
    <section className="treasury-table operations-section">
      <div className="section-heading"><div><h2>Requerimientos</h2><p>Cálculo real; stock disponible y faltantes esperan integración con inventario.</p></div></div>
      {calculation.fabricOptimization?.rejected?.length > 0 && <div className="operations-warning"><strong>Excede ancho disponible</strong><span>{calculation.fabricOptimization.rejected.length} pieza(s) superan el rollo predeterminado de {DEFAULT_ROLL_WIDTH_CM} cm. El requerimiento se muestra, pero no se optimiza.</span></div>}
      {!calculation.materials?.length ? <div className="operations-empty">Ingresa medidas para calcular la orden.</div> : <div className="operations-table-scroll"><table><thead><tr><th>Material</th><th>Requerido</th><th>Compra informativa</th><th>Disponible</th><th>Faltante</th></tr></thead><tbody>{calculation.materials.map((row) => <tr key={row.material} className={row.status?.startsWith("Excede") ? "operations-invalid-row" : ""}><td>{row.material}{row.status?.startsWith("Excede") && <small className="operations-cell-detail">{row.status}</small>}</td><td><strong>{row.required}</strong></td><td>{row.purchase}</td><td>—</td><td>—</td></tr>)}</tbody></table></div>}
      <div className="operations-inline-actions operations-disabled-actions"><button className="secondary-btn" disabled>Reservar stock</button><button className="secondary-btn" disabled>Generar solicitud por faltantes</button></div>
    </section>
  </div>
}
