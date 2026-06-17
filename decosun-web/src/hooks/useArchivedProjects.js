import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export function useArchivedProjects(profile) {
  const [archivedProjects, setArchivedProjects] = useState([])
  const [loadingArchived, setLoadingArchived] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadArchivedProjects()
  }, [profile?.id, profile?.role, profile?.region_code, profile?.advisor_id])

  async function loadArchivedProjects() {
    if (!profile) return

    setLoadingArchived(true)

    let query = supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .eq("archived", true)
      .order("archive_date", { ascending: false })

    if (profile.role === "asesor_comercial") {
      if (!profile.advisor_id) {
        setArchivedProjects([])
        setLoadingArchived(false)
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
      alert("No se pudieron cargar los clientes archivados.")
      setLoadingArchived(false)
      return
    }

    setArchivedProjects(data || [])
    setLoadingArchived(false)
  }

  return {
    archivedProjects,
    loadingArchived,
    reloadArchivedProjects: loadArchivedProjects,
  }
}