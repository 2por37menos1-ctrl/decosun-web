export function isGerencia(profile) {
  return profile?.role === "gerencia"
}

export function isSucursal(profile) {
  return ["gerente_sucursal", "sucursal"].includes(profile?.role)
}

export function isVendedor(profile) {
  return profile?.role === "vendedor"
}

export function isAsistente(profile) {
  return profile?.role === "asistente"
}

export function canViewAgenda(profile) {
  return (
    isGerencia(profile) ||
    isSucursal(profile) ||
    isVendedor(profile) ||
    isAsistente(profile)
  )
}

export function canViewPurchases(profile) {
  return (
    isGerencia(profile) ||
    isSucursal(profile) ||
    isAsistente(profile)
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
  return isGerencia(profile) || isSucursal(profile)
}