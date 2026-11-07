import PublicPageHero from "./PublicPageHero"
import "../smartQuote.css"
import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { getTerritoryAssignment } from "../lib/territoryAssignment"
import { needs, rooms, recommendations, validMeasurements } from "../lib/smartQuote"

const steps = ["Control", "Necesidad", "Ambiente", "Solución", "Medidas", "Comparación", "Ubicación", "Resumen", "Envío"]
const money = value => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)

export default function SmartQuote({ form, measures, result, changeForm, changeMeasure, addRow, removeRow, configure, save, saving, locked, savedProject, advanced, prices }) {
  const [step, setStep] = useState(0)
  const [control, setControl] = useState("")
  const [selectedNeeds, setNeeds] = useState([])
  const [room, setRoom] = useState("")
  const [product, setProduct] = useState("sunscreen")
  const [error, setError] = useState("")
  const [consent, setConsent] = useState(false)
  const heading = useRef(null)
  const options = recommendations(control, selectedNeeds)
  const windows = measures.filter(row => !row.tipo.startsWith("motorizacion"))
  const city = form.zona === "otra" ? form.ciudadExtra : form.zona === "vina" ? "Viña del Mar" : form.zona === "santiago" ? "Santiago" : form.zona === "iquique" ? "Iquique" : ""
  const advisor = getTerritoryAssignment({ city, sucursal: form.sucursal })
  const setField = (name, value) => changeForm({ target: { name, value } })
  const titles = ["¿Cómo te gustaría controlar tus cortinas?", "¿Qué quieres mejorar en tu espacio?", "¿Dónde instalarás tus cortinas?", "Una solución para tu forma de vivir.", "Cada ventana tiene su medida.", "Elige cómo vivir tu confort.", "¿Dónde está tu proyecto?", "Tu espacio, tu solución.", "Conversemos sobre tu proyecto."]

  function go(next) {
    setError("")
    setStep(next)
    requestAnimationFrame(() => heading.current?.focus())
  }
  function next() {
    if (step === 0 && !control) return setError("Elige cómo quieres controlar tus cortinas.")
    if (step === 1 && !selectedNeeds.length) return setError("Selecciona al menos una necesidad.")
    if (step === 2 && !room) return setError("Selecciona un ambiente.")
    if (step === 3) configure(product, control, room)
    if (step === 4 && control !== "existing" && !validMeasurements(windows)) return setError("Ingresa ancho y alto positivos en metros y una cantidad entera para cada ventana.")
    if (step === 4 && control === "existing" && (!Number.isInteger(Number(measures[0].cantidad)) || Number(measures[0].cantidad) < 1)) return setError("Ingresa una cantidad entera mayor que cero.")
    if (step === 6 && !city.trim()) return setError("Indica la ciudad de instalación.")
    go(step + 1)
  }
  const choose = (value, label, detail, selected, onClick) => <button key={value} type="button" className="premium-choice" aria-pressed={selected} onClick={onClick}><span>{label}</span><small>{detail}</small></button>
  const motorCost = windows.reduce((sum, row) => sum + Number(row.cantidad || 0), 0) * prices[form.sucursal].motorizacionIntegrada

  return <main className="premium quote-shell public-presentation">
    <PublicPageHero page="Cotizar" eyebrow="DecoSun Smart Quote" titleId="quote-title" highlight="Diseña tu" title="solución ideal." media={<img src="/img/motorizacion/4MT-640.jpg" alt="Concepto de control remoto de cortinas roller" />} caption="Imagen conceptual de ambiente."><p className="public-hero-description">Te ayudamos a encontrar las cortinas perfectas para tu espacio.</p></PublicPageHero>
    <div className="premium-wrap">

      <div className="quote-progress" role="progressbar" aria-label="Progreso de cotización" aria-valuemin={1} aria-valuemax={9} aria-valuenow={step + 1} aria-valuetext={`Paso ${step + 1} de 9: ${steps[step]}`}><span style={{ width: `${(step + 1) / 9 * 100}%` }} /></div>
      <p className="eyebrow">{String(step + 1).padStart(2, "0")} / 09 · {steps[step]}</p>
      <div className="quote-layout"><section className="quote-stage" aria-busy={saving}>
        <h2 ref={heading} tabIndex={-1}>{titles[step]}</h2>
        {locked && !savedProject && !saving && <p role="status">Conservamos los datos del intento anterior para evitar duplicados. Reintenta el envío sin cerrar esta página; si el problema persiste, contacta al equipo.</p>}
        <fieldset disabled={saving || locked || Boolean(savedProject)}>
        {step === 0 && <><div className="quote-options">{[
          ["smart", "Cortinas inteligentes", "Control remoto, smartphone y automatizaciones según motor y accesorios compatibles."],
          ["manual", "Cortinas manuales", "Control tradicional mediante cadena."],
          ["existing", "Motorizar mis cortinas actuales", "Conversión sujeta a evaluación técnica."],
        ].map(([value, title, detail]) => choose(value, title, detail, control === value, () => { setControl(value); setProduct(value === "existing" ? "motorizacionIndependiente" : "sunscreen") }))}</div></>}
        {step === 1 && <><p>Puedes seleccionar más de una.</p><div className="quote-options">{needs.map(value => choose(value, value, "", selectedNeeds.includes(value), () => setNeeds(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])))}</div></>}
        {step === 2 && <div className="quote-options">{rooms.map(value => choose(value, value, "", room === value, () => setRoom(value)))}</div>}
        {step === 3 && <><p>La primera opción responde a tus preferencias. Puedes elegir otra; confirmaremos viabilidad técnica antes de fabricar.</p><div className="quote-options">{options.map(({ key, title, reason }) => choose(key, title, reason, product === key, () => setProduct(key)))}</div>{control === "smart" && <p>No se ofrece motorización Honeycomb sin verificar compatibilidad.</p>}</>}
        {step === 4 && <>{control === "existing" ? <><p>Evaluaremos las cortinas actuales antes de confirmar el motor.</p><label>Cantidad de cortinas<input type="number" min="1" step="1" value={measures[0].cantidad} onChange={e => changeMeasure(measures[0].id, "cantidad", e.target.value)} /></label></> : <><div className="measure-guide" aria-label="Guía de medidas"><span>← Ancho →</span><div>Ventana <span>↕ Alto</span></div></div><p>Ingresa medidas aproximadas en <strong>metros</strong> (150 cm = 1,50 m). Mide ancho y alto del espacio a cubrir. Las medidas finales y los límites del sistema se confirman en evaluación técnica.</p>{windows.map((row, index) => <div className="quote-window" key={row.id}><h3>Ventana {index + 1}</h3><label>Ambiente<input maxLength={120} value={row.ubicacion} onChange={e => changeMeasure(row.id, "ubicacion", e.target.value)} /></label><div className="quote-fields">{[["ancho", "Ancho (m)"], ["alto", "Alto (m)"], ["cantidad", "Cantidad"]].map(([field, label]) => <label key={field}>{label}<input type="number" min={field === "cantidad" ? "1" : "0.01"} step={field === "cantidad" ? "1" : "0.01"} value={row[field]} onChange={e => changeMeasure(row.id, field, e.target.value)} /></label>)}</div>{windows.length > 1 && <button type="button" className="premium-text-button" onClick={() => removeRow(row.id)}>Quitar ventana {index + 1}</button>}</div>)}<button type="button" className="premium-button secondary" onClick={() => addRow(product)}>Añadir otra ventana</button></>}</>}
        {step === 5 && <>{product === "honeycomb" || control === "existing" ? <p>Tu configuración necesita evaluación técnica y cotización asistida. No hay un valor definitivo disponible en línea.</p> : <div className="quote-options"><article className="comparison"><h3>Tu cortina manual</h3><p>Control mediante cadena.</p><strong>{money(control === "smart" ? Math.max(0, result.totalGeneral - motorCost) : result.totalGeneral)}</strong></article><article className="comparison"><h3>Tu cortina motorizada</h3><p>Sin cadena; conectividad y accesorios sujetos a confirmación.</p><strong>{money(control === "smart" ? result.totalGeneral : result.totalGeneral + motorCost)}</strong><p>Diferencia referencial: {money(motorCost)}.</p></article></div>}<p>Estimaciones con la tarifa vigente de la sucursal seleccionada. La ubicación puede cambiar el cálculo. No constituye cotización definitiva.</p><button type="button" className="premium-text-button" onClick={() => go(0)}>Cambiar forma de control</button></>}
        {step === 6 && <><p>Selecciona la oficina que gestionará tu solicitud. Confirmaremos disponibilidad y condiciones en tu ciudad.</p><label>Oficina de gestión<select value={form.sucursal} onChange={e => { setField("sucursal", e.target.value); setField("zona", ""); setField("ciudadExtra", "") }}><option value="iquique">Iquique</option><option value="vina">Viña del Mar</option></select></label><label>Zona<select value={form.zona} onChange={e => setField("zona", e.target.value)}><option value="">Selecciona una zona</option>{form.sucursal === "iquique" ? <option value="iquique">Iquique</option> : <><option value="vina">Viña del Mar</option><option value="santiago">Santiago</option></>}<option value="otra">Otra ciudad</option></select></label>{form.zona === "otra" && <label>Ciudad<input maxLength={100} value={form.ciudadExtra} onChange={e => setField("ciudadExtra", e.target.value)} /></label>}<p>Asesor asignado: {advisor.advisor_name}. La asignación comercial no confirma cobertura de instalación.</p></>}
        {step === 7 && <><p>Revisa cada configuración antes de enviar.</p>{result.rows.map((row, index) => <article className="quote-window" key={index}><h3>{row.productLabel}</h3><p>{row.ubicacion} · {row.cantidad} unidad(es){row.ancho && ` · ${row.ancho} × ${row.alto} m`}</p><p>{row.category === "solicitud" ? "Cotización asistida" : money(row.total)}</p></article>)}<p>Ciudad: {city || "Por indicar"}. Control: {control === "manual" ? "Manual" : control === "smart" ? "Motorizado" : "Conversión de cortinas actuales"}.</p><p>Accesorios y compatibilidad por confirmar. El control desde smartphone puede requerir accesorios adicionales.</p><label>Código promocional (opcional)<input value={form.promoCode} maxLength={30} onChange={e => setField("promoCode", e.target.value)} /></label><button type="button" className="premium-text-button" onClick={advanced}>Abrir configuración detallada y condiciones comerciales</button></>}
        {step === 8 && <><p>Usaremos estos datos para gestionar tu cotización y contactarte.</p><label>Nombre<input autoComplete="name" maxLength={120} value={form.nombre} onChange={e => setField("nombre", e.target.value)} /></label><label>Teléfono<input type="tel" autoComplete="tel" maxLength={30} value={form.telefono} onChange={e => setField("telefono", e.target.value)} /></label><label className="quote-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Autorizo el uso de mis datos para gestionar esta solicitud.</label></>}
        </fieldset>
        {error && <p role="alert" className="quote-error">{error}</p>}
        {savedProject && <div role="status" className="quote-success"><h3>Solicitud recibida</h3><p>Número: {savedProject.quoteNumber}</p><Link to={`/estado/${savedProject.publicToken}`}>Consultar estado de mi solicitud →</Link></div>}
        {!savedProject && <div className="quote-actions"><button type="button" className="premium-button secondary" disabled={step === 0 || saving} onClick={() => go(step - 1)}>Atrás</button>{step < 8 ? <button type="button" className="premium-button" disabled={saving} onClick={next}>Continuar →</button> : <button type="button" className="premium-button" disabled={saving} onClick={async () => { if (!consent || !form.nombre.trim() || form.telefono.replace(/\D/g, "").length < 8) return setError("Ingresa tu nombre, un teléfono válido y autoriza el uso de los datos."); setError(""); const saved = await save(); if (!saved) setError("No se pudo completar el registro. Reintenta sin cerrar esta página.") }}>{saving ? "Enviando…" : "Enviar mi solicitud"}</button>}</div>}
      </section><aside className="quote-summary"><p className="eyebrow">Tu proyecto</p><h3>{room || "Un espacio por transformar"}</h3><p>{options.find(option => option.key === product)?.title || "Solución a medida"}</p><p>{selectedNeeds.join(" · ") || "Cuéntanos qué necesitas."}</p><p>{city || "Ubicación por definir"}</p><hr /><p>{result.hasRequestRows ? "Valor parcial estimado" : "Valor estimado"}</p><strong>{result.hasValidRows && result.totalGeneral > 0 ? money(result.totalGeneral) : "Cotización asistida"}</strong><p>Medidas, configuración, disponibilidad y valor sujetos a evaluación. Sin registro obligatorio.</p><Link to="/mantencion">¿Necesitas mantención? →</Link></aside></div>
    </div>
  </main>
}
