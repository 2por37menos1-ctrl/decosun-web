import { useMemo, useState } from "react"
import RequestMaterialsStep from "./RequestMaterialsStep"
import RequestOriginStep from "./RequestOriginStep"
import RequestReviewStep from "./RequestReviewStep"

const initialDraft = { origin: "", projectId: "", generation: "manual", materials: [], notes: "" }
const originLabels = { cliente: "Proyecto / cliente", inventario: "Stock", garantia: "Garantía", reposicion: "Reposición" }

export default function RequestWizard({ projects, materialNames, saving, onCancel, onCreate }) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(initialDraft)
  const project = useMemo(() => projects.find((entry) => entry.id === draft.projectId), [projects, draft.projectId])
  const destination = project?.title || originLabels[draft.origin] || "Destino general"
  const updateDraft = (changes) => setDraft((current) => ({ ...current, ...changes }))

  function next() {
    if (step === 1 && !draft.origin) return alert("Selecciona para qué necesitas material.")
    if (step === 1 && draft.origin === "cliente" && !draft.projectId) return alert("Selecciona el proyecto asociado.")
    if (step === 2 && !draft.materials.length) return alert("Agrega al menos un material.")
    setStep((current) => Math.min(3, current + 1))
  }

  return <section className="request-wizard treasury-table">
    <header className="request-wizard-header"><div><button type="button" className="operations-link-btn" onClick={onCancel}>← Volver a solicitudes</button><h1>Nueva solicitud</h1></div><div className="request-progress" aria-label={`Paso ${step} de 3`}>{[1, 2, 3].map((number) => <span key={number} className={number <= step ? "active" : ""}>{number}</span>)}</div></header>
    {step === 1 && <RequestOriginStep projects={projects} draft={draft} onChange={updateDraft} />}
    {step === 2 && <RequestMaterialsStep draft={draft} destination={destination} materialNames={materialNames} onChange={updateDraft} />}
    {step === 3 && <RequestReviewStep draft={draft} destination={destination} onChange={updateDraft} />}
    <footer className="request-wizard-footer"><button type="button" className="secondary-btn" onClick={step === 1 ? onCancel : () => setStep((current) => current - 1)}>{step === 1 ? "Cancelar" : "Volver"}</button>{step < 3 ? <button type="button" className="primary-btn" onClick={next}>Continuar</button> : <button type="button" className="primary-btn" disabled={saving} onClick={() => onCreate(draft, destination)}>{saving ? "Creando…" : "Crear solicitud"}</button>}</footer>
  </section>
}
