const advisors = {
  janai: {
    advisor_id: "5caae3ef-ad78-4391-94cb-6f0e49bb4f58",
    advisor_name: "Janaí Suárez",
    owner_profile_name: "Janaí Suárez",
  },
  miro: {
    advisor_id: "c94aa53f-907f-439a-9e06-b4bcd58bb960",
    advisor_name: "Miró Miranda",
    owner_profile_name: "Miró Miranda",
  },
  marisel: {
    advisor_id: "455d30a8-8e09-4224-a725-4e9f1c592a72",
    advisor_name: "Marisel Morales",
    owner_profile_name: "Marisel Morales",
  },
  juanFrancisco: {
    advisor_id: "c62d0095-d427-4d25-903c-9c5dc74e3393",
    advisor_name: "Juan Francisco Palma",
    owner_profile_name: "Juan Francisco Palma",
  },
  edgar: {
    advisor_id: null,
    advisor_name: "Edgar Leighton",
    owner_profile_name: "Edgar Leighton",
  },
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function hasAny(value, terms) {
  return terms.some((term) => value.includes(term))
}

function buildAssignment(region_code, branch, advisor) {
  return {
    region_code,
    advisor_id: advisor.advisor_id,
    advisor_name: advisor.advisor_name,
    owner_profile_name: advisor.owner_profile_name,
    branch,
  }
}

export function getTerritoryAssignment({ city, regionCode, sucursal } = {}) {
  const normalizedCity = normalize(city)
  const normalizedRegion = normalize(regionCode)
  const normalizedBranch = normalize(sucursal)
  const text = [normalizedCity, normalizedRegion, normalizedBranch]
    .filter(Boolean)
    .join(" ")

  if (
    normalizedRegion === "atacama" ||
    hasAny(text, ["copiapo", "vallenar", "atacama"])
  ) {
    return buildAssignment("atacama", "Atacama", advisors.miro)
  }

  if (
    ["coquimbo", "iv_region_coquimbo", "la_serena"].includes(normalizedRegion) ||
    hasAny(text, ["la serena", "coquimbo", "iv region", "region de coquimbo"])
  ) {
    return buildAssignment("coquimbo", "Coquimbo", advisors.marisel)
  }

  if (
    normalizedRegion === "quinta_region_interior" ||
    hasAny(text, ["quillota", "la calera", "limache", "interior"])
  ) {
    return buildAssignment(
      "quinta_region_interior",
      "Quinta Region Interior",
      advisors.juanFrancisco
    )
  }

  if (
    normalizedRegion === "metropolitana" ||
    hasAny(text, ["region metropolitana", "metropolitana"])
  ) {
    return buildAssignment("metropolitana", "Santiago", advisors.janai)
  }

  if (
    normalizedRegion === "santiago" ||
    hasAny(text, ["santiago"])
  ) {
    return buildAssignment("santiago", "Santiago", advisors.janai)
  }

  if (
    normalizedRegion === "quinta_region" ||
    hasAny(text, ["vina", "v del mar", "valparaiso", "concon", "quilpue", "villa alemana"])
  ) {
    return buildAssignment("quinta_region", "Viña del Mar", advisors.janai)
  }

  if (
    normalizedRegion === "iquique" ||
    normalizedBranch === "iquique" ||
    hasAny(text, [
      "iquique",
      "tarapaca",
      "arica",
      "antofagasta",
      "calama",
      "alto hospicio",
      "segunda region",
      "ii region",
    ])
  ) {
    return buildAssignment("iquique", "Iquique", advisors.edgar)
  }

  return buildAssignment("quinta_region", "Viña del Mar", advisors.janai)
}
