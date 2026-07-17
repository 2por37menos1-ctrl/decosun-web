import "../panel.css"
import { useEffect, useMemo, useState } from "react"

import DashboardLayout from "../layouts/DashboardLayout"
import ExecutiveMetricCard from "../components/ExecutiveMetricCard"
import StatCard from "../components/StatCard"
import KanbanBoard from "../components/KanbanBoard"
import ProjectModal from "../components/ProjectModal"

import CommercialFollowUp from "../components/CommercialFollowUp"
import CommercialArchived from "../components/CommercialArchived"
import CommercialInsights from "../components/CommercialInsights"
import OperationsPanel from "../components/OperationsPanel"

import AgendaPanel from "./AgendaPanel"
import PurchaseRequests from "./PurchaseRequests"
import Treasury from "./Treasury"
import RadarCompraAgil from "./RadarCompraAgil"

import { supabase } from "../lib/supabase"
import { createProjectHistory } from "../lib/projectHistory"

import {
  canViewAgenda,
  canViewKanbanMoney,
  canViewMoney,
  canViewPurchases,
  canViewTreasury,
  isGerencia,
  isJefaturaRegion,
  isAsesorComercial,
} from "../lib/permissions"

import { useProfile } from "../hooks/useProfile"
import { useProjects } from "../hooks/useProjects"
import { useArchivedProjects } from "../hooks/useArchivedProjects"

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
  { value: "agendado", label: "Agendado" },
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

function DonutChart({ items, total }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (!items.length || total <= 0) {
    return (
      <div className="donut-empty">
        Sin datos
      </div>
    )
  }

  return (
    <div className="donut-wrapper">
      <svg viewBox="0 0 120 120" className="donut-chart">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
        />

        {items.map((item, index) => {
          const percentage = item.sales / total
          const dash = percentage * circumference
          const currentOffset = offset
          offset += dash

          return (
            <circle
              key={item.region}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={`hsl(${210 + index * 35}, 65%, 38%)`}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          )
        })}

        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="donut-total-label"
        >
          Ventas
        </text>

        <text
          x="60"
          y="73"
          textAnchor="middle"
          className="donut-total-value"
        >
          {items.length}
        </text>
      </svg>
    </div>
  )
}

function GaugeChart({ percentage }) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100)

  return (
    <div className="gauge-wrapper">
      <div className="gauge">
        <div
          className="gauge-fill"
          style={{
            transform: `rotate(${safePercentage * 1.8}deg)`,
          }}
        />
        <div className="gauge-cover">
          <strong>{safePercentage.toFixed(0)}%</strong>
          <span>cobrado</span>
        </div>
      </div>
    </div>
  )
}

function daysSince(dateString) {
  if (!dateString) return null

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return null

  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

function isMissingDate(value) {
  return !value || String(value).trim() === ""
}

export default function Dashboard() {
  const [view, setView] = useState("inicio")
  const [commercialView, setCommercialView] = useState("pipeline")
  const [selectedProject, setSelectedProject] = useState(null)
  const [regionFilter, setRegionFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { profile, loading: profileLoading } = useProfile()
  const isAdvisor = isAsesorComercial(profile)
  const canSeeMoney = canViewMoney(profile)
  const canSeeKanbanMoney = canViewKanbanMoney(profile)

  const {
    projects,
    loading,
    reloadProjects,
    updateProjectStatus,
    updateProject,
    archiveProject,
  } = useProjects(profile)

  const {
    archivedProjects,
    loadingArchived,
    reloadArchivedProjects,
  } = useArchivedProjects(profile)

  function navigatePanel(nextView) {
    if (nextView === "proyectos") {
      alert("Proyectos dedicado estará disponible pronto. Abriendo Comercial.")
      setView("comercial")
      setCommercialView("pipeline")
      return
    }

    if (nextView === "clientes") {
      alert("Clientes estará disponible pronto. Abriendo Seguimiento comercial.")
      setView("comercial")
      setCommercialView("seguimiento")
      return
    }

    if (nextView === "configuracion") {
      alert("Configuración estará disponible pronto.")
      setView("inicio")
      return
    }

    if (nextView === "agenda" && !canViewAgenda(profile)) {
      alert("No tienes permiso para ver Agenda.")
      return
    }

    if (nextView === "operaciones" && !canViewPurchases(profile)) {
      alert("No tienes permiso para ver Operaciones.")
      return
    }

    if (nextView === "finanzas" && !canViewTreasury(profile)) {
      alert("No tienes permiso para ver Finanzas.")
      return
    }

    setView(nextView)
  }

  useEffect(() => {
    function handlePanelNavigation(event) {
      navigatePanel(event.detail?.view || "inicio")
    }

    window.addEventListener("decosun:panel-navigate", handlePanelNavigation)

    return () => {
      window.removeEventListener("decosun:panel-navigate", handlePanelNavigation)
    }
  }, [profile])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("decosun:panel-view-changed", {
        detail: { view },
      })
    )
  }, [view])

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

  function getProjectPaid(project) {
    return Number(
      project.amount_paid_cached != null
        ? project.amount_paid_cached
        : project.amount_paid || 0
    )
  }

  function getProjectBalance(project) {
    const paid = getProjectPaid(project)

    return Number(
      project.balance_cached != null
        ? project.balance_cached
        : Number(project.sale_value || 0) - paid
    )
  }

  const visibleTotalSold = visibleSalesProjects.reduce(
    (acc, project) => acc + Number(project.sale_value || 0),
    0
  )

  const visibleTotalPaid = visibleSalesProjects.reduce(
    (acc, project) => acc + getProjectPaid(project),
    0
  )

  const visibleBalance = visibleSalesProjects.reduce(
    (acc, project) => acc + getProjectBalance(project),
    0
  )

  const advisorCommission = visibleSalesProjects.reduce(
    (acc, project) => {
      const saleValue = Number(project.sale_value || 0)

      const commission =
        saleValue *
        (Number(project.advisor_commission_rate || 20) / 100)

      return acc + commission
    },
    0
  )

  const advisorPendingVisits = filteredProjects.filter(
    (project) =>
      project.status === "agendado" ||
      project.status === "medicion"
  ).length

  const advisorStats = useMemo(() => {
    const map = {}

    visibleSalesProjects.forEach((project) => {
      const advisor =
        project.advisor_name?.trim() || "Sin asesor"

      if (!map[advisor]) {
        map[advisor] = {
          advisor,
          sales: 0,
          commission: 0,
          projects: 0,
        }
      }

      const saleValue = Number(project.sale_value || 0)

      let commission = 0

      if (
        project.advisor_commission_type === "especial"
      ) {
        commission = Number(
          project.advisor_commission_amount || 0
        )
      } else if (
        project.advisor_commission_type !== "sin_comision"
      ) {
        commission =
          saleValue *
          (Number(project.advisor_commission_rate || 0) / 100)
      }

      map[advisor].sales += saleValue
      map[advisor].commission += commission
      map[advisor].projects += 1
    })

    return Object.values(map).sort(
      (a, b) => b.sales - a.sales
    )
  }, [visibleSalesProjects])

  const commercialTotals = useMemo(() => {
    const totalSales = advisorStats.reduce(
      (acc, item) => acc + Number(item.sales || 0),
      0
    )

    const totalCommissions = advisorStats.reduce(
      (acc, item) => acc + Number(item.commission || 0),
      0
    )

    const activeAdvisors = advisorStats.filter(
      (item) => item.advisor !== "Sin asesor"
    ).length

    const withoutAdvisor = advisorStats.find(
      (item) => item.advisor === "Sin asesor"
    )

    return {
      totalSales,
      totalCommissions,
      activeAdvisors,
      withoutAdvisorProjects:
        withoutAdvisor?.projects || 0,
    }
  }, [advisorStats])

  const statusStats = useMemo(() => {
    return statusOptions
      .filter((option) => option.value !== "all")
      .map((option) => {
        const count = filteredProjects.filter(
          (project) => project.status === option.value
        ).length

        const percentage =
          filteredProjects.length > 0
            ? (count / filteredProjects.length) * 100
            : 0

        return {
          label: option.label,
          count,
          percentage,
        }
      })
      .filter((item) => item.count > 0)
  }, [filteredProjects])

  const regionSalesStats = useMemo(() => {
    const map = {}

    visibleSalesProjects.forEach((project) => {
      const region = project.region_code || "sin_region"

      if (!map[region]) {
        map[region] = {
          region,
          sales: 0,
        }
      }

      map[region].sales += Number(project.sale_value || 0)
    })

    return Object.values(map).sort((a, b) => b.sales - a.sales)
  }, [visibleSalesProjects])

  const paymentProgress =
    visibleTotalSold > 0
      ? Math.min((visibleTotalPaid / visibleTotalSold) * 100, 100)
      : 0

  const activeProjectsCount = filteredProjects.filter(
    (project) => project.status !== "cerrado"
  ).length

  const opportunityProjects = filteredProjects.filter((project) =>
    ["agendado", "cotizado", "seguimiento"].includes(project.status)
  )

  const followUpProjects = filteredProjects.filter(
    (project) => project.status === "seguimiento"
  )

  const productionProjects = filteredProjects.filter(
    (project) => project.status === "produccion"
  )

  const purchaseProjects = filteredProjects.filter(
    (project) => project.status === "compras"
  )

  const installationProjects = filteredProjects.filter(
    (project) => project.status === "instalacion"
  )

  const installationsWithoutDate = installationProjects.filter(
    (project) => isMissingDate(project.key_date)
  )

  const projectsWithoutMovement = filteredProjects.filter((project) => {
    const inactiveDays = daysSince(project.updated_at)

    return inactiveDays != null && inactiveDays >= 7
  })

  const pendingBalanceProjects = visibleSalesProjects.filter(
    (project) => getProjectBalance(project) > 0
  )

  const closedSalesProjects = visibleSalesProjects.filter(
    (project) => project.status === "cerrado"
  )

  const closedSalesTotal = closedSalesProjects.reduce(
    (acc, project) => acc + Number(project.sale_value || 0),
    0
  )

  const mainRegion = regionSalesStats[0]

  const executiveAttentionItems = [
    ...projectsWithoutMovement.slice(0, 2).map((project) => ({
      type: "Cliente sin movimiento",
      title: project.title || project.contact_name || "Proyecto sin nombre",
      detail: `${daysSince(project.updated_at)} dias sin actualizacion`,
      status: "warning",
    })),
    ...installationsWithoutDate.slice(0, 1).map((project) => ({
      type: "Instalacion pendiente",
      title: project.title || project.contact_name || "Proyecto sin nombre",
      detail: "Sin fecha definida",
      status: "critical",
    })),
    ...(canSeeMoney
      ? pendingBalanceProjects.slice(0, 1).map((project) => ({
        type: "Pago pendiente",
        title: project.title || project.contact_name || "Proyecto sin nombre",
        detail: formatMoney(getProjectBalance(project)),
        status: "warning",
      }))
      : []),
    ...purchaseProjects.slice(0, 1).map((project) => ({
      type: "Compra pendiente",
      title: project.title || project.contact_name || "Proyecto sin nombre",
      detail: "En etapa compras",
      status: "neutral",
    })),
  ].slice(0, 5)

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

    // Legacy amount_paid no longer creates treasury income.
    // Real payments must use register_project_payment.

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

  if (profileLoading || loading) {
    return <div className="loading-screen">Cargando DecoSun...</div>
  }

  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <div>
          <h1>Panel de Gestión</h1>

          <p>
            {profile?.full_name}
          </p>
        </div>

        <div className="view-actions">
          <button
            className={view === "inicio" ? "primary-btn" : "secondary-btn"}
            onClick={() => navigatePanel("inicio")}
          >
            Inicio
          </button>

          <button
            className={view === "comercial" ? "primary-btn" : "secondary-btn"}
            onClick={() => navigatePanel("comercial")}
          >
            Comercial
          </button>

          {canViewAgenda(profile) && (
            <button
              className={view === "agenda" ? "primary-btn" : "secondary-btn"}
              onClick={() => navigatePanel("agenda")}
            >
              Agenda
            </button>
          )}

          {canViewPurchases(profile) && (
            <button
              className={view === "operaciones" ? "primary-btn" : "secondary-btn"}
              onClick={() => navigatePanel("operaciones")}
            >
              Operaciones
            </button>
          )}

          {canViewTreasury(profile) && (
            <button
              className={view === "finanzas" ? "primary-btn" : "secondary-btn"}
              onClick={() => navigatePanel("finanzas")}
            >
              Finanzas
            </button>
          )}

          {isGerencia(profile) && (
            <button
              className={
                view === "radar_compra_agil"
                  ? "primary-btn"
                  : "secondary-btn"
              }
              onClick={() => navigatePanel("radar_compra_agil")}
            >
              Radar Compra Ágil
            </button>
          )}

          {isAdvisor && (
            <button
              className="secondary-btn"
              onClick={() => window.open("/Academy", "_blank")}
            >
              Academia DecoSun
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

      {view === "comercial" && (
        <div className="view-actions" style={{ marginBottom: "20px" }}>
          <button
            className={
              commercialView === "pipeline"
                ? "primary-btn"
                : "secondary-btn"
            }
            onClick={() => setCommercialView("pipeline")}
          >
            Pipeline
          </button>

          <button
            className={
              commercialView === "seguimiento"
                ? "primary-btn"
                : "secondary-btn"
            }
            onClick={() => setCommercialView("seguimiento")}
          >
            Seguimiento
          </button>

          <button
            className={
              commercialView === "archivados"
                ? "primary-btn"
                : "secondary-btn"
            }
            onClick={() => setCommercialView("archivados")}
          >
            Archivados
          </button>

          <button
            className={
              commercialView === "inteligencia"
                ? "primary-btn"
                : "secondary-btn"
            }
            onClick={() => setCommercialView("inteligencia")}
          >
            Inteligencia
          </button>
        </div>
      )}

      {view === "comercial" &&
        commercialView === "seguimiento" && (
          <CommercialFollowUp
            projects={filteredProjects}
            onProjectClick={setSelectedProject}
            onArchiveProject={
              profile?.role === "asesor_comercial"
                ? null
                : archiveProject
            }
          />
        )}

      {view === "comercial" &&
        commercialView === "archivados" && (
          <CommercialArchived
            projects={archivedProjects}
            onProjectClick={setSelectedProject}
          />
        )}

      {view === "comercial" &&
        commercialView === "inteligencia" && (
          <CommercialInsights
            projects={projects}
            archivedProjects={archivedProjects}
          />
        )}

      {view === "inicio" && (
        <>
          <section className="executive-compact-hero">
            <div>
              <span>Dashboard ejecutivo</span>
              <h2>Resumen Julio 2026</h2>
              <p>Vista compacta para decidir; el analisis vive en los modulos.</p>
            </div>

            <div className="executive-compact-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigatePanel("comercial")}
              >
                Ver Comercial
              </button>

              {canViewTreasury(profile) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigatePanel("finanzas")}
                >
                  Ver Finanzas
                </button>
              )}
            </div>
          </section>

          {canSeeMoney && (
            <>
          <section className="dashboard-section dashboard-section-compact">
            <div className="section-heading compact">
              <div>
                <h2>Salud financiera</h2>
                <p>Cuatro senales para entender caja y cobranza sin entrar al detalle.</p>
              </div>
            </div>

            <div className="executive-metric-grid executive-metric-grid-primary">
              <ExecutiveMetricCard
                title="Venta mes"
                value={formatMoney(visibleTotalSold)}
                description="Venta comprometida actual."
                status="neutral"
                indicator="Venta"
                compact
              />

              <ExecutiveMetricCard
                title="Cobrado"
                value={formatMoney(visibleTotalPaid)}
                description={`${paymentProgress.toFixed(0)}% de avance.`}
                status="positive"
                indicator="Caja"
                compact
              />

              <ExecutiveMetricCard
                title="Pendiente cobrar"
                value={formatMoney(visibleBalance)}
                description={`${pendingBalanceProjects.length} proyectos con saldo.`}
                status={visibleBalance > 0 ? "warning" : "positive"}
                indicator="Saldo"
                compact
              />

              <ExecutiveMetricCard
                title="Caja proyectada"
                value="Sin datos"
                description="Pendiente de configurar desde Finanzas."
                status="neutral"
                indicator="Futuro"
                compact
              />
            </div>
          </section>

          <div className="executive-mini-grid">
            <section className="executive-mini-panel">
              <div className="mini-panel-header">
                <h3>Comercial</h3>
                <span>{opportunityProjects.length} oportunidades</span>
              </div>

              <dl>
                <div>
                  <dt>Proyectos activos</dt>
                  <dd>{activeProjectsCount}</dd>
                </div>

                <div>
                  <dt>Oportunidades</dt>
                  <dd>{opportunityProjects.length}</dd>
                </div>

                <div>
                  <dt>Region principal</dt>
                  <dd>{mainRegion?.region || "Sin datos"}</dd>
                </div>
              </dl>
            </section>

            <section className="executive-mini-panel">
              <div className="mini-panel-header">
                <h3>Operaciones</h3>
                <span>{productionProjects.length + purchaseProjects.length} pendientes</span>
              </div>

              <dl>
                <div>
                  <dt>Produccion</dt>
                  <dd>{productionProjects.length}</dd>
                </div>

                <div>
                  <dt>Compras</dt>
                  <dd>{purchaseProjects.length}</dd>
                </div>

                <div>
                  <dt>Instalaciones</dt>
                  <dd>{installationProjects.length}</dd>
                </div>
              </dl>
            </section>

            <section className="executive-mini-panel">
              <div className="mini-panel-header">
                <h3>Finanzas</h3>
                <span>{pendingBalanceProjects.length} saldos</span>
              </div>

              <dl>
                <div>
                  <dt>Compromisos</dt>
                  <dd>Sin datos</dd>
                </div>

                <div>
                  <dt>Alertas</dt>
                  <dd>{executiveAttentionItems.length}</dd>
                </div>

                <div>
                  <dt>Saldo pendiente</dt>
                  <dd>{formatMoney(visibleBalance)}</dd>
                </div>
              </dl>
            </section>
          </div>
            </>
          )}

          {!canSeeMoney && (
            <>
              <section className="dashboard-section dashboard-section-compact">
                <div className="section-heading compact">
                  <div>
                    <h2>Panel operativo</h2>
                    <p>Seguimiento de clientes, agenda y estados sin montos.</p>
                  </div>
                </div>

                <div className="executive-metric-grid executive-metric-grid-primary">
                  <ExecutiveMetricCard
                    title="Clientes activos"
                    value={activeProjectsCount}
                    description="Proyectos abiertos en el flujo actual."
                    status="neutral"
                    indicator="Clientes"
                    compact
                  />

                  <ExecutiveMetricCard
                    title="Agenda pendiente"
                    value={advisorPendingVisits}
                    description="Visitas o mediciones por coordinar."
                    status={advisorPendingVisits > 0 ? "warning" : "positive"}
                    indicator="Agenda"
                    compact
                  />

                  <ExecutiveMetricCard
                    title="Instalaciones"
                    value={installationProjects.length}
                    description="Proyectos en etapa de instalacion."
                    status="neutral"
                    indicator="Operacion"
                    compact
                  />

                  <ExecutiveMetricCard
                    title="Sin movimiento"
                    value={projectsWithoutMovement.length}
                    description="Casos sin actualizacion hace 7 dias o mas."
                    status={projectsWithoutMovement.length > 0 ? "warning" : "positive"}
                    indicator="Gestion"
                    compact
                  />
                </div>
              </section>

              <div className="executive-mini-grid">
                <section className="executive-mini-panel">
                  <div className="mini-panel-header">
                    <h3>Clientes</h3>
                    <span>{filteredProjects.length} visibles</span>
                  </div>

                  <dl>
                    <div>
                      <dt>Activos</dt>
                      <dd>{activeProjectsCount}</dd>
                    </div>

                    <div>
                      <dt>Oportunidades</dt>
                      <dd>{opportunityProjects.length}</dd>
                    </div>

                    <div>
                      <dt>Seguimiento</dt>
                      <dd>{followUpProjects.length}</dd>
                    </div>
                  </dl>
                </section>

                <section className="executive-mini-panel">
                  <div className="mini-panel-header">
                    <h3>Operaciones</h3>
                    <span>{productionProjects.length + purchaseProjects.length} pendientes</span>
                  </div>

                  <dl>
                    <div>
                      <dt>Produccion</dt>
                      <dd>{productionProjects.length}</dd>
                    </div>

                    <div>
                      <dt>Compras</dt>
                      <dd>{purchaseProjects.length}</dd>
                    </div>

                    <div>
                      <dt>Instalaciones</dt>
                      <dd>{installationProjects.length}</dd>
                    </div>
                  </dl>
                </section>

                <section className="executive-mini-panel">
                  <div className="mini-panel-header">
                    <h3>Estados</h3>
                    <span>{statusStats.length} con actividad</span>
                  </div>

                  <dl>
                    {statusStats.slice(0, 3).map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.count}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            </>
          )}

          <section className="executive-attention-panel">
            <div className="section-heading compact">
              <div>
                <h2>Requieren atencion</h2>
                <p>Maximo 5 senales para decidir la siguiente accion.</p>
              </div>
            </div>

            {executiveAttentionItems.length > 0 ? (
              <div className="attention-list">
                {executiveAttentionItems.map((item, index) => (
                  <article
                    key={`${item.type}-${item.title}-${index}`}
                    className={`attention-item is-${item.status}`}
                  >
                    <span>{item.type}</span>

                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="attention-empty">
                Sin alertas gerenciales relevantes con los datos actuales.
              </div>
            )}
          </section>

          <div className="dashboard-legacy-detail" hidden>
          <div className="executive-filters">
            <div className="filter-field wide">
              <label>Buscar proyecto</label>
              <input
                placeholder="Cliente, ciudad, teléfono o detalle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Estado</label>
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
          </div>

          <div className="stats-grid">
            <StatCard title="Proyectos" value={filteredProjects.length} />

            {isAdvisor && (
              <>
                <StatCard
                  title="Mis ventas"
                  value={formatMoney(visibleTotalSold)}
                />

                <StatCard
                  title="Mi comisión estimada"
                  value={formatMoney(advisorCommission)}
                />

                <StatCard
                  title="Visitas pendientes"
                  value={advisorPendingVisits}
                />
              </>
            )}

            {(isGerencia(profile) || isJefaturaRegion(profile)) && (
              <>
                <StatCard
                  title={
                    isGerencia(profile)
                      ? "Venta comprometida"
                      : "Ventas sucursal"
                  }
                  value={formatMoney(visibleTotalSold)}
                />

                <StatCard
                  title="Pagado / recibido"
                  value={formatMoney(visibleTotalPaid)}
                />

                <StatCard
                  title="Saldo por cobrar"
                  value={formatMoney(visibleBalance)}
                />
              </>
            )}

            {isGerencia(profile) && (
              <StatCard
                title={`Comisión estimada Edgar · ${edgarCommissionLabel}`}
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

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Salud financiera</h2>
                <p>Resumen gerencial con datos de proyectos ya cargados.</p>
              </div>
            </div>

            <div className="executive-metric-grid">
              <ExecutiveMetricCard
                title="Venta comprometida"
                value={formatMoney(visibleTotalSold)}
                description="Base comercial vigente del periodo filtrado."
                status="neutral"
                indicator="Venta"
              />

              <ExecutiveMetricCard
                title="Venta cerrada"
                value={formatMoney(closedSalesTotal)}
                description="Proyectos marcados como cerrados."
                status="positive"
                indicator="Cierre"
              />

              <ExecutiveMetricCard
                title="Cobrado"
                value={formatMoney(visibleTotalPaid)}
                description="Pagos confirmados o cache financiero disponible."
                status="positive"
                indicator="Caja"
              />

              <ExecutiveMetricCard
                title="Pendiente por cobrar"
                value={formatMoney(visibleBalance)}
                description={`${pendingBalanceProjects.length} proyectos con saldo.`}
                status={visibleBalance > 0 ? "warning" : "positive"}
                indicator="Saldo"
              />

              <ExecutiveMetricCard
                title="Caja proyectada"
                value="Pendiente de configurar"
                description="Disponible gerencial debe venir desde Finanzas."
                status="neutral"
                indicator="Futuro"
              />

              <ExecutiveMetricCard
                title="Compromisos proximos"
                value="Sin datos"
                description="Se conectara cuando el modulo exponga vencimientos."
                status="neutral"
                indicator="Agenda"
              />
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Comercial</h2>
                <p>Indicadores de pipeline sin mostrar el tablero operativo.</p>
              </div>
            </div>

            <div className="executive-metric-grid">
              <ExecutiveMetricCard
                title="Proyectos activos"
                value={activeProjectsCount}
                description="Proyectos abiertos en el flujo comercial."
                status="neutral"
                indicator="Activos"
              />

              <ExecutiveMetricCard
                title="Oportunidades"
                value={opportunityProjects.length}
                description="Agendados, cotizados o en seguimiento."
                status="positive"
                indicator="Pipeline"
              />

              <ExecutiveMetricCard
                title="Sin movimiento"
                value={projectsWithoutMovement.length}
                description="Casos sin actualizacion hace 7 dias o mas."
                status={projectsWithoutMovement.length > 0 ? "warning" : "positive"}
                indicator="Follow-up"
              />

              <ExecutiveMetricCard
                title="Regiones con venta"
                value={regionSalesStats.length || "Sin datos"}
                description="Lectura disponible desde ventas por region."
                status="neutral"
                indicator="Region"
              />
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Operaciones</h2>
                <p>Lectura rapida de estados operativos actuales.</p>
              </div>
            </div>

            <div className="executive-metric-grid">
              <ExecutiveMetricCard
                title="Produccion pendiente"
                value={productionProjects.length}
                description="Proyectos actualmente en estado produccion."
                status={productionProjects.length > 0 ? "warning" : "positive"}
                indicator="Produccion"
              />

              <ExecutiveMetricCard
                title="Compras pendientes"
                value={purchaseProjects.length}
                description="Proyectos en etapa compras."
                status={purchaseProjects.length > 0 ? "warning" : "positive"}
                indicator="Compras"
              />

              <ExecutiveMetricCard
                title="Instalaciones proximas"
                value={installationProjects.length}
                description="Proyectos listos para coordinar o ejecutar."
                status="neutral"
                indicator="Agenda"
              />

              <ExecutiveMetricCard
                title="Instalaciones sin fecha"
                value={installationsWithoutDate.length}
                description="Requieren fecha operativa visible."
                status={installationsWithoutDate.length > 0 ? "critical" : "positive"}
                indicator="Fecha"
              />
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Alertas gerenciales</h2>
                <p>Senales simples para priorizar revision del dia.</p>
              </div>
            </div>

            <div className="executive-alert-grid">
              <ExecutiveMetricCard
                title="Saldos pendientes"
                value={pendingBalanceProjects.length}
                description={`${formatMoney(visibleBalance)} pendiente por cobrar.`}
                status={visibleBalance > 0 ? "warning" : "positive"}
                indicator="Cobranza"
              />

              <ExecutiveMetricCard
                title="Clientes sin movimiento"
                value={projectsWithoutMovement.length}
                description="Ayuda a priorizar llamadas y seguimiento."
                status={projectsWithoutMovement.length > 0 ? "warning" : "positive"}
                indicator="Gestion"
              />

              <ExecutiveMetricCard
                title="Fechas criticas"
                value={installationsWithoutDate.length}
                description="Instalaciones en curso sin fecha definida."
                status={installationsWithoutDate.length > 0 ? "critical" : "positive"}
                indicator="Operacion"
              />

              <ExecutiveMetricCard
                title="Compromisos proximos"
                value="Pendiente de configurar"
                description="No hay vencimientos disponibles en esta vista."
                status="neutral"
                indicator="Finanzas"
              />
            </div>
          </section>

          {isGerencia(profile) && (
            <>
              <section className="executive-grid executive-grid-premium">
                <div className="executive-card">
                  <div className="executive-card-header">
                    <h3>Ventas por región</h3>
                    <span>{formatMoney(visibleTotalSold)}</span>
                  </div>

                  <div className="donut-layout">
                    <DonutChart
                      items={regionSalesStats}
                      total={visibleTotalSold}
                    />

                    <div className="donut-legend">
                      {regionSalesStats.map((item, index) => {
                        const percentage =
                          visibleTotalSold > 0
                            ? (item.sales / visibleTotalSold) * 100
                            : 0

                        return (
                          <div className="legend-row" key={item.region}>
                            <span
                              className="legend-dot"
                              style={{
                                background: `hsl(${210 + index * 35}, 65%, 38%)`,
                              }}
                            />

                            <div>
                              <strong>{item.region}</strong>
                              <small>
                                {formatMoney(item.sales)} · {percentage.toFixed(1)}%
                              </small>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="executive-card">
                  <div className="executive-card-header">
                    <h3>Avance de cobro</h3>
                    <span>{formatMoney(visibleTotalPaid)}</span>
                  </div>

                  <GaugeChart percentage={paymentProgress} />

                  <div className="gauge-footer">
                    <div>
                      <span>Comprometido</span>
                      <strong>{formatMoney(visibleTotalSold)}</strong>
                    </div>

                    <div>
                      <span>Pendiente</span>
                      <strong>{formatMoney(visibleBalance)}</strong>
                    </div>
                  </div>
                </div>

                <div className="executive-card executive-card-wide">
                  <div className="executive-card-header">
                    <h3>Embudo comercial</h3>
                    <span>{filteredProjects.length} proyectos</span>
                  </div>

                  <div className="funnel-list">
                    {statusStats.map((item) => (
                      <div className="funnel-row" key={item.label}>
                        <div className="funnel-label">
                          <span>{item.label}</span>
                          <strong>{item.count}</strong>
                        </div>

                        <div className="funnel-track">
                          <div
                            className="funnel-bar"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="treasury-table">
                <div className="dashboard-header">
                  <div>
                    <h2>Equipo Comercial</h2>
                    <p>
                      Ventas y comisiones estimadas por asesor.
                    </p>
                  </div>
                </div>

                <div className="stats-grid">
                  <StatCard
                    title="Ventas comerciales"
                    value={formatMoney(commercialTotals.totalSales)}
                  />

                  <StatCard
                    title="Comisiones estimadas"
                    value={formatMoney(commercialTotals.totalCommissions)}
                  />

                  <StatCard
                    title="Asesores activos"
                    value={commercialTotals.activeAdvisors}
                  />

                  <StatCard
                    title="Proyectos sin asesor"
                    value={commercialTotals.withoutAdvisorProjects}
                  />
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Asesor</th>
                      <th>Proyectos</th>
                      <th>Ventas</th>
                      <th>Comisión estimada</th>
                    </tr>
                  </thead>

                  <tbody>
                    {advisorStats.map((advisor) => (
                      <tr key={advisor.advisor}>
                        <td>{advisor.advisor}</td>

                        <td>{advisor.projects}</td>

                        <td>{formatMoney(advisor.sales)}</td>

                        <td>
                          {formatMoney(advisor.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}

          </div>
        </>
      )}

      {view === "comercial" &&
        commercialView === "pipeline" && (
          <>
            <div className="executive-filters">
              <div className="filter-field wide">
                <label>Buscar proyecto</label>

                <input
                  placeholder="Cliente, ciudad, teléfono o detalle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label>Estado</label>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <KanbanBoard
              projects={filteredProjects}
              onStatusChange={updateProjectStatus}
              onProjectClick={setSelectedProject}
              canViewMoney={canSeeKanbanMoney}
              onArchiveProject={
                profile?.role === "asesor_comercial"
                  ? null
                  : archiveProject
              }
            />
          </>
        )}

      {view === "agenda" && canViewAgenda(profile) && <AgendaPanel />}

      {view === "operaciones" && canViewPurchases(profile) && (
        <OperationsPanel
          projects={projects}
          profile={profile}
        />
      )}

      {view === "finanzas" && canViewTreasury(profile) && (
        <Treasury />
      )}

      {view === "radar_compra_agil" && isGerencia(profile) && (
        <RadarCompraAgil />
      )}

      <ProjectModal
        project={selectedProject}
        profile={profile}
        onClose={() => setSelectedProject(null)}
        onSave={handleSaveProject}
      />
    </DashboardLayout>
  )
}
