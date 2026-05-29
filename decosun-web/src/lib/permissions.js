export function isGerencia(profile) {
  return profile?.role === "gerencia"
}

export function isJefaturaRegion(profile) {
  return profile?.role === "jefatura_region"
}

export function isAdministracionRegional(profile) {
  return profile?.role === "administracion_regional"
}

export function canViewAgenda(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile) ||
    isAdministracionRegional(profile)
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
  return isGerencia(profile)
}

export function canViewSensitiveFinance(profile) {
  return isGerencia(profile)
}

export function canViewCommissions(profile) {
  return isGerencia(profile)
}

export function canEditOperationalCosts(profile) {
  return (
    isGerencia(profile) ||
    isJefaturaRegion(profile)
  )
}