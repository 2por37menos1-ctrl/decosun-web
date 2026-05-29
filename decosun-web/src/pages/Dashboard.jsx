import "../panel.css"
import { useMemo, useState } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import StatCard from "../components/StatCard"
import KanbanBoard from "../components/KanbanBoard"
import ProjectModal from "../components/ProjectModal"

import AgendaPanel from "./AgendaPanel"
import PurchaseRequests from "./PurchaseRequests"
import Treasury from "./Treasury"

import { supabase } from "../lib/supabase"
import { createProjectHistory } from "../lib/projectHistory"

import {
  canViewAgenda,
  canViewPurchases,
  canViewTreasury,
  isGerencia,
  isJefaturaRegion,
} from "../lib/permissions"

import { useProfile } from "../hooks/useProfile"
import { useProjects } from "../hooks/useProjects"

const saleStatuses = [
  "aceptado",
  "medicion",
  "compras",
  "produccion",
  "instalacion",
  "facturacion",
  "cerrado",
]

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "cotizado", label: "Cotizado" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "aceptado", label: "Aceptado" },
  { value: "medicion", label: "Medición" },
  { value: "compras", label: "Compras" },
  { value: "produccion", label: "Producción" },
  { value: "instalacion", label: "Instalación" },
  { value: "facturacion", label: "Facturación" },
  { value: "cerrado", label: "Cerrado" },
]

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`
}

export default function Dashboard() {
  const [view, setView] = useState("dashboard")
  const [selectedProject, setSelectedProject] = useState(null)
  const [regionFilter, setRegionFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { profile, loading: profileLoading } = useProfile()

  const {
    projects,
    loading: projectsLoading,
    updateProjectStatus,
    updateProject,
    deleteProject,
  } = useProjects(profile)

  const availableProjects = useMemo(() => {
    if (profile?.role !== "gerencia") return projects

    return projects.filter((project) =>
      regionFilter === "all"
        ? true
        : project.region_code === regionFilter
    )
  }, [projects, profile?.role, regionFilter])

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return availableProjects.filter((project) => {
      const matchesSearch =
        !search ||
        project.title?.toLowerCase().includes(search) ||
        project.contact_name?.toLowerCase().includes(search) ||
        project.contact_phone?.toLowerCase().includes(search) ||
        project.city?.toLowerCase().includes(search) ||
        project.summary?.toLowerCase().includes(search)

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [availableProjects, searchTerm, statusFilter])

  const visibleSalesProjects = useMemo(
    () =>
      filteredProjects.filter((project) =>
        saleStatuses.includes(project.status)
      ),
    [filteredProjects]
  )

  const visibleTotalSold = visibleSalesProjects.reduce(
    (acc, project) => acc + Number(project.sale_value || 0),
    0
  )

  const visibleTotalPaid = visibleSalesProjects.reduce(
    (acc, project) => acc + Number(project.amount_paid || 0),
    0
  )

  const visibleBalance = visibleTotalSold - visibleTotalPaid

  const iquiqueSalesProjects = projects.filter(
    (project) =>
      project.region_code === "iquique" &&
      saleStatuses.includes(project.status)
  )

  const iquiqueSold = iquiqueSalesProjects.reduce(
    (acc, project) => acc + Number(project.sale_value || 0),
    0
  )

  let edgarCommission = 0
  let edgarCommissionLabel = "15%"

  if (iquiqueSold >= 10000000) {
  edgarCommission = 2000000
  edgarCommissionLabel = "Tope $2.000.000"
} else {
  edgarCommission = iquiqueSold * 0.15
}

  async function handleSaveProject(projectId, payload) {
  const cleanDate = (value) => {
    if (!value) return null
    if (String(value).trim() === "") return null
    return value
  }

  const cleanNumber = (value) => {
    if (value === "" || value === null || value === undefined) return 0
    return Number(value)
  }

  const cleanPayload = {
    ...payload,

    key_date: cleanDate(payload.key_date),
    sale_date: cleanDate(payload.sale_date),
    invoice_date: cleanDate(payload.invoice_date),
    closed_date: cleanDate(payload.closed_date),

    sale_value: cleanNumber(payload.sale_value),
    invoice_value: cleanNumber(payload.invoice_value),
    amount_paid: cleanNumber(payload.amount_paid),

    capital_contribution: cleanNumber(payload.capital_contribution),
    management_fee_rate: cleanNumber(payload.management_fee_rate),

    fabric_cost: cleanNumber(payload.fabric_cost),
    motor_cost: cleanNumber(payload.motor_cost),
    mechanism_cost: cleanNumber(payload.mechanism_cost),
    installation_cost: cleanNumber(payload.installation_cost),
    transport_cost: cleanNumber(payload.transport_cost),
    other_costs: cleanNumber(payload.other_costs),
  }

  const previousProject = projects.find((p) => p.id === projectId)

  const previousPaid = Number(previousProject?.amount_paid || 0)
  const newPaid = Number(cleanPayload.amount_paid || 0)
  const paymentDifference = newPaid - previousPaid

  const ok = await updateProject(projectId, cleanPayload)

  if (!ok) return

  if (paymentDifference > 0) {
    await createTreasuryIncome(previousProject, paymentDifference)

    await createProjectHistory({
      projectId,
      type: "payment",
      description: `Pago registrado por ${formatMoney(paymentDifference)}`,
      createdBy: profile?.full_name || "usuario",
      metadata: {
        amount: paymentDifference,
      },
    })
  }

  setSelectedProject(null)
}

  async function createTreasuryIncome(project, amount) {
    if (!project || amount <= 0) return

    const { error } = await supabase.from("treasury_movements").insert({
      date: new Date().toISOString().slice(0, 10),
      bank: "BCI",
      description: `Pago cliente: ${project.title || "Proyecto"}`,
      type: "ingreso",
      amount,
      category: "Ingreso cliente",
      subcategory: project.payment_status || "Abono",
      branch:
        project.region_code === "iquique"
          ? "Iquique"
          : "Viña del Mar",
      project_id: project.id,
      person_name: project.contact_name || project.title || "",
      notes: "Ingreso generado desde ficha de proyecto",
    })

    if (error) {
      console.error(error)
      alert(
        "El proyecto se guardó, pero no se pudo crear el ingreso en Tesorería."
      )
    }
  }

  if (profileLoading || projectsLoading) {
    return <div className="loading-screen">Cargando DecoSun...</div>
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <div>
          <h1>Bienvenido {profile?.full_name}</h1>
          <p>
            {profile?.role} · {profile?.region_code}
          </p>
        </div>

        <div className="view-actions">
          <button
            className={view === "dashboard" ? "primary-btn" : "secondary-btn"}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>

          {canViewAgenda(profile) && (
            <button
              className={view === "agenda" ? "primary-btn" : "secondary-btn"}
              onClick={() => setView("agenda")}
            >
              Agenda
            </button>
          )}

          {canViewPurchases(profile) && (
            <button
              className={view === "purchase" ? "primary-btn" : "secondary-btn"}
              onClick={() => setView("purchase")}
            >
              Mercadería
            </button>
          )}

          {canViewTreasury(profile) && (
            <button
              className={view === "treasury" ? "primary-btn" : "secondary-btn"}
              onClick={() => setView("treasury")}
            >
              Tesorería
            </button>
          )}

          {isGerencia(profile) && (
            <select
              className="region-filter"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="all">Todas las regiones</option>
              <option value="iquique">Iquique</option>
              <option value="quinta_region">Quinta Región</option>
            </select>
          )}
        </div>
      </div>

      {view === "dashboard" && (
        <>
          <div className="dashboard-filters">
            <input
              placeholder="Buscar por cliente, código, ciudad, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="stats-grid">
            <StatCard title="Proyectos" value={filteredProjects.length} />

            <StatCard
              title="Venta comprometida"
              value={formatMoney(visibleTotalSold)}
            />

            <StatCard
              title="Pagado"
              value={formatMoney(visibleTotalPaid)}
            />

            <StatCard
              title="Saldo pendiente"
              value={formatMoney(visibleBalance)}
            />

            {isGerencia(profile) && (
  <StatCard
    title={`Comisión Edgar · ${edgarCommissionLabel}`}
    value={formatMoney(edgarCommission)}
  />
)}

{isJefaturaRegion(profile) && profile?.region_code === "iquique" && (
  <StatCard
    title={`Mi comisión estimada · ${edgarCommissionLabel}`}
    value={formatMoney(edgarCommission)}
  />
)}
          </div>

          <KanbanBoard
            projects={filteredProjects}
            onStatusChange={updateProjectStatus}
            onProjectClick={setSelectedProject}
            onDeleteProject={deleteProject}
          />
        </>
      )}

      {view === "agenda" && canViewAgenda(profile) && <AgendaPanel />}

      {view === "purchase" && canViewPurchases(profile) && (
        <PurchaseRequests />
      )}

      {view === "treasury" && canViewTreasury(profile) && <Treasury />}

      <ProjectModal
  project={selectedProject}
  profile={profile}
  onClose={() => setSelectedProject(null)}
  onSave={handleSaveProject}
/>
    </DashboardLayout>
  )
}