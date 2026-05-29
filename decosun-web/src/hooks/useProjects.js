import { createProjectHistory } from "../lib/projectHistory"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export function useProjects(profile) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [profile?.role, profile?.region_code])

  async function loadProjects() {
    setLoading(true)

    let query = supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (
      profile?.role !== "gerencia" &&
      profile?.region_code
    ) {
      query = query.eq("region_code", profile.region_code)
    }

    const { data, error } = await query

    if (error) {
      console.error(error)
      alert("No se pudieron cargar los proyectos.")
      setLoading(false)
      return
    }

    setProjects(data || [])
    setLoading(false)
  }

  async function updateProjectStatus(projectId, newStatus) {
    const previousProject = projects.find(
      (p) => p.id === projectId
    )

    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", projectId)

    if (error) {
      console.error(error)
      alert("No se pudo actualizar el estado.")
      return false
    }

    await createProjectHistory({
      projectId,
      type: "status_change",
      description: `Estado cambiado de ${
        previousProject?.status || "-"
      } a ${newStatus}`,
      createdBy: "sistema",
      metadata: {
        from: previousProject?.status,
        to: newStatus,
      },
    })

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, status: newStatus }
          : project
      )
    )

    return true
  }

  async function updateProject(projectId, payload) {
  const previousProject = projects.find(
    (p) => p.id === projectId
  )

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId)
    .select()
    .single()

  if (error) {
    console.error(error)
    alert("No se pudo guardar el proyecto.")
    return false
  }

  const historyEvents = []

  // Estado interno
  if (
    payload.status &&
    payload.status !== previousProject?.status
  ) {
    historyEvents.push({
      type: "status_change",
      description: `Estado cambiado de ${
        previousProject?.status || "-"
      } a ${payload.status}`,
      metadata: {
        from: previousProject?.status,
        to: payload.status,
      },
    })
  }

  // Estado cliente
  if (
    payload.client_visible_status &&
    payload.client_visible_status !==
      previousProject?.client_visible_status
  ) {
    historyEvents.push({
      type: "client_status",
      description: `Estado cliente actualizado: ${payload.client_visible_status}`,
      metadata: {
        previous:
          previousProject?.client_visible_status,
        new: payload.client_visible_status,
      },
    })
  }

  // Pago
  if (
    Number(payload.amount_paid || 0) !==
    Number(previousProject?.amount_paid || 0)
  ) {
    const difference =
      Number(payload.amount_paid || 0) -
      Number(previousProject?.amount_paid || 0)

    historyEvents.push({
      type: "payment",
      description: `Pago registrado por ${difference.toLocaleString(
        "es-CL"
      )}`,
      metadata: {
        previous: previousProject?.amount_paid,
        new: payload.amount_paid,
        difference,
      },
    })
  }

  // Venta
  if (
    Number(payload.sale_value || 0) !==
    Number(previousProject?.sale_value || 0)
  ) {
    historyEvents.push({
      type: "sale_value",
      description: `Valor proyecto actualizado`,
      metadata: {
        previous: previousProject?.sale_value,
        new: payload.sale_value,
      },
    })
  }

  // Prioridad
  if (
    payload.priority &&
    payload.priority !== previousProject?.priority
  ) {
    historyEvents.push({
      type: "priority_change",
      description: `Prioridad cambiada a ${payload.priority}`,
      metadata: {
        previous: previousProject?.priority,
        new: payload.priority,
      },
    })
  }

  // Técnico
  if (
    payload.technician_assigned &&
    payload.technician_assigned !==
      previousProject?.technician_assigned
  ) {
    historyEvents.push({
      type: "technician_change",
      description: `Técnico asignado: ${payload.technician_assigned}`,
      metadata: {
        previous:
          previousProject?.technician_assigned,
        new: payload.technician_assigned,
      },
    })
  }

  // Registro genérico
if (Object.keys(payload).length > 0) {
  historyEvents.push({
    type: "project_updated",
    description: "Proyecto actualizado",
    metadata: {
      updated_fields: Object.keys(payload),
    },
  })
}

  for (const event of historyEvents) {
    await createProjectHistory({
      projectId,
      type: event.type,
      description: event.description,
      createdBy: "sistema",
      metadata: event.metadata,
    })
  }

  setProjects((current) =>
    current.map((project) =>
      project.id === projectId ? data : project
    )
  )

  return true
}

  async function deleteProject(projectId) {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas borrar este proyecto?"
    )

    if (!confirmDelete) return false

    const previousProject = projects.find(
      (p) => p.id === projectId
    )

    const { error } = await supabase
      .from("projects")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", projectId)

    if (error) {
      console.error(error)
      alert("No se pudo borrar el proyecto.")
      return false
    }

    await createProjectHistory({
      projectId,
      type: "project_deleted",
      description: `Proyecto borrado: ${
        previousProject?.title || projectId
      }`,
      createdBy: "sistema",
      metadata: {
        deleted_at: new Date().toISOString(),
      },
    })

    setProjects((current) =>
      current.filter((project) => project.id !== projectId)
    )

    return true
  }

  return {
    projects,
    loading,
    reloadProjects: loadProjects,
    updateProjectStatus,
    updateProject,
    deleteProject,
  }
}