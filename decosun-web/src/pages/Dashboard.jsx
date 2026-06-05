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
  isAsesorComercial,
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

export default function Dashboard() {
  const [view, setView] = useState("dashboard")
  const [selectedProject, setSelectedProject] = useState(null)
  const [regionFilter, setRegionFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { profile, loading: profileLoading } = useProfile()
  const isAdvisor = isAsesorComercial(profile)

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
          <h1>Panel de Gestión</h1>

          <p>
            {profile?.full_name}
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

          {isAdvisor && (
            <button
              className="secondary-btn"
              onClick={() => window.open("/academia", "_blank")}
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

      {view === "dashboard" && (
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
                  title="Mi comisión"
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
                      Ventas y comisiones por asesor.
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