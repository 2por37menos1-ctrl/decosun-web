import { createProjectHistory } from "../lib/projectHistory"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export function useProjects(profile) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadProjects()
  }, [profile?.id, profile?.role, profile?.region_code, profile?.advisor_id])

  async function loadProjects() {
    if (!profile) return

    setLoading(true)

    let query = supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .eq("archived", false)
      .order("created_at", { ascending: false })

    if (profile.role === "asesor_comercial") {
      if (!profile.advisor_id) {
        setProjects([])
        setLoading(false)
        return
      }

      query = query.eq("advisor_id", profile.advisor_id)
    } else if (
      profile.role !== "gerencia" &&
      profile.region_code
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
    const previousProject = projects.find((p) => p.id === projectId)

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
      description: `Estado cambiado de ${previousProject?.status || "-"} a ${newStatus}`,
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
    const previousProject = projects.find((p) => p.id === projectId)

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

    if (payload.status && payload.status !== previousProject?.status) {
      historyEvents.push({
        type: "status_change",
        description: `Estado cambiado de ${previousProject?.status || "-"} a ${payload.status}`,
        metadata: {
          from: previousProject?.status,
          to: payload.status,
        },
      })
    }

    if (
      payload.client_visible_status &&
      payload.client_visible_status !== previousProject?.client_visible_status
    ) {
      historyEvents.push({
        type: "client_status",
        description: `Estado cliente actualizado: ${payload.client_visible_status}`,
        metadata: {
          previous: previousProject?.client_visible_status,
          new: payload.client_visible_status,
        },
      })
    }

    if (
      Number(payload.amount_paid || 0) !==
      Number(previousProject?.amount_paid || 0)
    ) {
      const difference =
        Number(payload.amount_paid || 0) -
        Number(previousProject?.amount_paid || 0)

      historyEvents.push({
        type: "payment",
        description: `Pago registrado por ${difference.toLocaleString("es-CL")}`,
        metadata: {
          previous: previousProject?.amount_paid,
          new: payload.amount_paid,
          difference,
        },
      })
    }

    if (
      Number(payload.sale_value || 0) !==
      Number(previousProject?.sale_value || 0)
    ) {
      historyEvents.push({
        type: "sale_value",
        description: "Valor proyecto actualizado",
        metadata: {
          previous: previousProject?.sale_value,
          new: payload.sale_value,
        },
      })
    }

    if (payload.priority && payload.priority !== previousProject?.priority) {
      historyEvents.push({
        type: "priority_change",
        description: `Prioridad cambiada a ${payload.priority}`,
        metadata: {
          previous: previousProject?.priority,
          new: payload.priority,
        },
      })
    }

    if (
      payload.technician_assigned &&
      payload.technician_assigned !== previousProject?.technician_assigned
    ) {
      historyEvents.push({
        type: "technician_change",
        description: `Técnico asignado: ${payload.technician_assigned}`,
        metadata: {
          previous: previousProject?.technician_assigned,
          new: payload.technician_assigned,
        },
      })
    }

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

  async function archiveProject(projectId, archiveData = {}) {
    const previousProject = projects.find((p) => p.id === projectId)

    const payload = {
      archived: true,
      archive_reason: archiveData.archive_reason || "otro",
      archive_notes: archiveData.archive_notes || "",
      archive_date: new Date().toISOString(),
      lost_amount: Number(
        archiveData.lost_amount ?? previousProject?.sale_value ?? 0
      ),
      lost_to_company: archiveData.lost_to_company || "",
      follow_up_date: archiveData.follow_up_date || null,
      archive_status: previousProject?.status || "",
    }

    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", projectId)

    if (error) {
      console.error(error)
      alert("No se pudo archivar el proyecto.")
      return false
    }

    await createProjectHistory({
      projectId,
      type: "project_archived",
      description: `Proyecto archivado: ${previousProject?.title || projectId
        }`,
      createdBy: "sistema",
      metadata: payload,
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
    archiveProject,
  }
}