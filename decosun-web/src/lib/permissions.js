export function isGerencia(profile) {
  return profile?.role === "gerencia"
}

export function isJefaturaRegion(profile) {
  return profile?.role === "jefatura_region"
}

export function isAdministracionRegional(profile) {
  return profile?.role === "administracion_regional"
}

export function isAsesorComercial(profile) {
  return profile?.role === "asesor_comercial"
}

export function canViewAgenda(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile) ||
    isAdministracionRegional(profile) ||
    isAsesorComercial(profile)
  )
}

export function canViewPurchases(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile) ||
    isAdministracionRegional(profile)
  )
}

export function canViewTreasury(profile) {
  return canViewGlobalFinance(profile)
}

export function canCreateTreasuryMovement(profile) {
  return canViewGlobalFinance(profile)
}

export function canViewMoney(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile) ||
    isAsesorComercial(profile)
  )
}

export function canViewGlobalFinance(profile) {
  return isGerencia(profile)
}

export function canViewProjectFinance(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile)
  )
}

export function canViewKanbanMoney(profile) {
  return canViewMoney(profile)
}

export function canRegisterProjectPayment(profile) {
  return isGerencia(profile)
}

export function canRegisterProjectPaymentForProject(profile, project) {
  if (isGerencia(profile)) return true

  const projectRegion = project?.region_code || ""
  const profileName = String(profile?.full_name || "").trim()
  const isEdgarIquique =
    isJefaturaRegion(profile) &&
    profile?.region_code === "iquique" &&
    ["Edgar", "Edgar Leighton"].includes(profileName)

  const northProjectRegions = [
    "iquique",
    "norte",
    "arica",
    "tarapaca",
    "calama",
    "antofagasta",
  ]

  return isEdgarIquique && northProjectRegions.includes(projectRegion)
}

export function canViewTreasuryTotals(profile) {
  return isGerencia(profile)
}

export function canViewInternalLoans(profile) {
  return isGerencia(profile)
}

export function canViewBankReconciliation(profile) {
  return isGerencia(profile)
}

export function canViewSensitiveFinance(profile) {
  return canViewGlobalFinance(profile)
}

export function canViewCommissions(profile) {
  return isGerencia(profile)
}

export function canViewCommissionReports(profile) {
  return canViewCommissions(profile)
}

export function canPayProjectCommissions(profile) {
  return isGerencia(profile)
}

export function canEditOperationalCosts(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile)
  )
}

export function canViewOwnSales(profile) {
  return isAsesorComercial(profile)
}

export function canAccessAcademy(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile) ||
    isAdministracionRegional(profile) ||
    isAsesorComercial(profile)
  )
}
