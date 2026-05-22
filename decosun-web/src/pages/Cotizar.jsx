import { Link } from "react-router-dom"
import bgCotizador from "../assets/images/telas-textura01.jpg"
import { supabase } from "../lib/supabase"
import logoSolo from "../assets/images/logo-vertical.png"
import { useMemo, useState } from "react"
import emailjs from "@emailjs/browser"

function formatCLP(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

const calculableProducts = {
  rollerSimple: "Roller simple",
  rollerDuo: "Roller DÚO",
  rollerDoble: "Roller doble",
  persianaVertical: "Persiana vertical",
  darkBlackout: "Dark Blackout",
}

const requestOnlyProducts = {
  toldoProyectante: "Toldo proyectante",
  toldoVertical: "Toldo vertical",
  cierreTerraza: "Cierre de terraza",
  pergolaBioclimatica: "Pérgola bioclimática",
}

const motorProducts = {
  motorizacionIndependiente: "Motorización independiente",
  motorizacionDual: "Motorización dual",
  motorizacionIntegrada: "Motorización integrada al producto",
}

const productLabels = {
  ...calculableProducts,
  ...requestOnlyProducts,
  ...motorProducts,
}

function getProductCategory(tipo) {
  if (Object.keys(calculableProducts).includes(tipo)) return "calculable"
  if (Object.keys(requestOnlyProducts).includes(tipo)) return "solicitud"
  if (Object.keys(motorProducts).includes(tipo)) return "motor"
  return "calculable"
}

function createMeasureRow(tipo = "rollerSimple") {
  return {
    id: crypto.randomUUID(),
    tipo,
    ubicacion: "",
    ancho: "",
    alto: "",
    cantidad: 1,
  }
}

export default function Cotizar() {
  const phone = "56929307614"

  const emailServiceId = "service_tbteogn"
  const emailTemplateId = "template_g9wrxn9"
  const emailPublicKey = "yvSj2jG3OXRmtB5aS"

  const vendedores = {
    iquique: {
      nombre: "Edgar Leighton",
      telefono: "+56 9 9215 6733",
      email: "ventas@decosun.cl",
      sucursal: "Decosun Iquique",
    },
    vina: {
      nombre: "Carlos Leighton",
      telefono: "+56 9 2930 7614",
      email: "contacto@decosun.cl",
      sucursal: "Decosun Viña del Mar",
    },
  }

  const condiciones = {
    iquique: [
      "Inicio con aceptación de cotización y anticipo del 50%.",
      "Fabricación a medida en Iquique según medidas confirmadas.",
      "Plazo estimado de entrega: 5 a 7 días hábiles.",
      "Saldo restante contra entrega o previo a instalación.",
      "Garantía de servicio hasta 4 años bajo condiciones normales de uso.",
      "Cotización válida por 5 días corridos.",
    ],
    vina: [
      "Inicio con recepción de Orden de Compra o aprobación formal.",
      "Incluye visita técnica para verificar medidas y condiciones en terreno.",
      "Plazo estimado de entrega: 6 días hábiles, sujeto a disponibilidad.",
      "Instalación incluida salvo indicación contraria.",
      "Facturación posterior a recepción conforme.",
      "Cotización válida por 5 días corridos.",
    ],
  }

  const prices = {
  iquique: {
    rollerSimple: 35000,

    blackout: 35000,
    sunscreen: 35000,
    translucido: 35000,

    rollerCenefa: 35000,

    rollerDuo: 55000,

    rollerDuoTranslucido: 55000,
    rollerDuoSunOut: 55000,

    dobleCenefa: 55000,

    persianaVertical: 70000,
    darkBlackout: 45000,

    motorizacionIntegrada: 130000,
  },

  vina: {
    rollerSimple: 30000,

    blackout: 30000,
    sunscreen: 30000,
    translucido: 30000,

    rollerCenefa: 30000,

    rollerDuo: 50000,

    rollerDuoTranslucido: 50000,
    rollerDuoSunOut: 50000,

    dobleCenefa: 50000,

    persianaVertical: 60000,
    darkBlackout: 40000,

    motorizacionIntegrada: 100000,
  },
}

  const promoCodes = {
    DSNVDM: {
      label: "DSNVDM",
      percent: 10,
    },
    DSNNT: {
      label: "DSNNT",
      percent: 5,
    },
    DSNIQQ: {
      label: "DSNIQQ",
      percent: 15,
    },
  }

  const [quoteNumber, setQuoteNumber] = useState("COT-PENDIENTE")

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    sucursal: "iquique",
    zona: "",
    ciudadExtra: "",
    promoCode: "",
  })

  const [measures, setMeasures] = useState([createMeasureRow()])

  const vendedor = vendedores[form.sucursal]
  const condicionesSucursal = condiciones[form.sucursal]

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "promoCode" ? value.toUpperCase() : value,
    }))
  }

  function handleMeasureChange(id, field, value) {
    setMeasures((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item

        if (field === "tipo") {
          const category = getProductCategory(value)
          return {
            ...item,
            tipo: value,
            ancho: category === "calculable" ? item.ancho : "",
            alto: category === "calculable" ? item.alto : "",
          }
        }

        return { ...item, [field]: value }
      })
    )
  }

  function addMeasureRow(tipo = "rollerSimple") {
    setMeasures((prev) => [...prev, createMeasureRow(tipo)])
  }

  function removeMeasureRow(id) {
    setMeasures((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((item) => item.id !== id)
    })
  }

  function getRecargoPorUnidad() {
    if (form.sucursal === "iquique") {
      if (form.zona === "iquique") return 0
      if (form.zona === "segunda") return 10000
      if (form.zona === "otra") return 10000
    }

    if (form.sucursal === "vina") {
      if (form.zona === "vina") return 0
      if (form.zona === "santiago") return 0
      if (form.zona === "otra") return 10000
    }

    return 0
  }

  const zoneLabel =
    form.sucursal === "iquique"
      ? form.zona === "iquique"
        ? "Iquique"
        : form.zona === "segunda"
        ? "Otra ciudad II Región"
        : form.zona === "otra"
        ? form.ciudadExtra || "Otra ciudad de Chile"
        : "-"
      : form.zona === "vina"
      ? "Viña del Mar"
      : form.zona === "santiago"
      ? "Santiago"
      : form.zona === "otra"
      ? form.ciudadExtra || "Otra ciudad"
      : "-"

  const result = useMemo(() => {
    const recargoUnit = getRecargoPorUnidad()
    const normalizedCode = form.promoCode.trim().toUpperCase()
    const promo = promoCodes[normalizedCode] || null

    const rows = measures.map((item, index) => {
      const category = getProductCategory(item.tipo)
      const cantidad = Number(item.cantidad)
      const price = prices[form.sucursal]?.[item.tipo] ?? 0
      const baseRow = {
        index: index + 1,
        valid: false,
        category,
        productKey: item.tipo,
        productLabel: productLabels[item.tipo],
        ubicacion: item.ubicacion,
        ancho: item.ancho,
        alto: item.alto,
        cantidad: item.cantidad,
        subtotal: 0,
        recargo: 0,
        discount: 0,
        total: 0,
        note: "",
      }

      if (category === "solicitud") {
        const valid = cantidad > 0
        return {
          ...baseRow,
          valid,
          cantidad,
          note: "Solicitar valores a DecoSun",
        }
      }

      if (category === "motor") {
        const valid = cantidad > 0
        if (!valid) return baseRow

        const subtotal = price * cantidad

        return {
          ...baseRow,
          valid: true,
          cantidad,
          subtotal,
          total: subtotal,
          note: "Valor referencial de motorización",
        }
      }

      const ancho = Number(item.ancho)
      const alto = Number(item.alto)

      const valid =
        !Number.isNaN(ancho) &&
        !Number.isNaN(alto) &&
        !Number.isNaN(cantidad) &&
        ancho > 0 &&
        alto > 0 &&
        cantidad > 0

      if (!valid) return baseRow

      const area = ancho * alto
      const subtotal = area * price * cantidad

const cenefaExtra =
  item.tipo === "rollerCenefa" ||
  item.tipo === "dobleCenefa"
    ? 25000 * cantidad
    : 0

const recargo = recargoUnit * cantidad

const subtotalConCenefa = subtotal + cenefaExtra

const discount = promo
  ? Math.round(subtotalConCenefa * (promo.percent / 100))
  : 0

const total = subtotalConCenefa + recargo - discount

      return {
        ...baseRow,
        valid: true,
        ancho,
        alto,
        cantidad,
        subtotal: subtotalConCenefa,
        recargo,
        discount,
        total,
      }
    })

    const validRows = rows.filter((row) => row.valid)
    const calculableRows = validRows.filter((row) => row.category === "calculable")
    const requestRows = validRows.filter((row) => row.category === "solicitud")

    const subtotalGeneral = validRows.reduce((acc, row) => acc + row.subtotal, 0)
    const recargoGeneral = validRows.reduce((acc, row) => acc + row.recargo, 0)
    const discountGeneral = validRows.reduce((acc, row) => acc + row.discount, 0)
    const totalGeneral = validRows.reduce((acc, row) => acc + row.total, 0)

    return {
      rows,
      validRows,
      calculableRows,
      requestRows,
      recargoUnit,
      subtotalGeneral,
      recargoGeneral,
      discountGeneral,
      totalGeneral,
      promo,
      hasValidRows: validRows.length > 0,
      hasRequestRows: requestRows.length > 0,
      hasOnlyRequestRows: validRows.length > 0 && totalGeneral === 0,
    }
  }, [form, measures])

  async function saveQuoteToSupabase() {
    try {
      const validRows = result.rows.filter((row) => row.valid)

      if (validRows.length === 0) {
        alert("Debes ingresar al menos un producto válido.")
        return false
      }

      const branch = form.sucursal === "iquique" ? "iquique" : "vina"

      const { data: realQuoteNumber, error: quoteError } = await supabase.rpc(
        "next_quote_number",
        { p_branch: branch }
      )

      if (quoteError) {
        console.error(quoteError)
        alert("Error generando correlativo")
        return false
      }

      setQuoteNumber(realQuoteNumber)

      const summary = validRows
        .map((row) => {
          const locationText = row.ubicacion ? ` · Ubicación: ${row.ubicacion}` : ""
          const measureText =
            row.category === "calculable"
              ? ` · ${row.ancho}x${row.alto}`
              : ""
          const valueText =
            row.category === "solicitud"
              ? " · Solicitar valores a DecoSun"
              : ` · Total: ${formatCLP(row.total)}`

          return `${row.productLabel}${measureText} · Cant: ${row.cantidad}${locationText}${valueText}`
        })
        .join(" | ")

      const region = form.sucursal === "iquique" ? "iquique" : "quinta_region"
      const city = form.zona === "otra" ? form.ciudadExtra : zoneLabel
      const projectId = crypto.randomUUID()

      const { error: projectError } = await supabase.from("projects").insert([
        {
          id: projectId,
          title: `${realQuoteNumber} · ${form.nombre || "Cliente web"}`,
          contact_name: form.nombre || null,
          contact_phone: form.telefono || null,
          city: city || null,
          summary,
          sale_value: result.totalGeneral || 0,
          status: "cotizado",
          payment_status: "pendiente",
          payment_type: "pendiente",
          region_code: region,
          client_type: "Residencial",
          company_name:
            form.sucursal === "iquique" ? "Decosun Spa" : "Decosun Group SpA",
        },
      ])

      if (projectError) {
        console.error(projectError)
        alert("Error guardando proyecto")
        return false
      }

      const measurementRows = validRows.map((row) => ({
        project_id: projectId,
        product_type: row.productKey,
        width: row.category === "calculable" ? row.ancho : null,
        height: row.category === "calculable" ? row.alto : null,
        quantity: row.cantidad,
        fabric: row.ubicacion || null,
      }))

      const { error: measurementError } = await supabase
        .from("project_measurements")
        .insert(measurementRows)

      if (measurementError) {
        console.error(measurementError)
        alert("Proyecto creado, pero hubo error guardando medidas")
        return false
      }

      return realQuoteNumber
    } catch (err) {
      console.error(err)
      alert("Error conectando con Supabase")
      return false
    }
  }

  async function sendQuoteEmail() {
    if (!result.hasValidRows) return

    const savedQuoteNumber = await saveQuoteToSupabase()
    if (!savedQuoteNumber) return

    const details = result.rows
      .filter((row) => row.valid)
      .map((row, index) => {
        const locationText = row.ubicacion ? ` · Ubicación: ${row.ubicacion}` : ""
        const measureText =
          row.category === "calculable"
            ? ` · ${row.ancho}m x ${row.alto}m`
            : ""
        const valueText =
          row.category === "solicitud"
            ? " · Solicitar valores a DecoSun"
            : ` · Total: ${formatCLP(row.total)}`

        return `${index + 1}. ${row.productLabel}${measureText} · Cantidad: ${
          row.cantidad
        }${locationText}${valueText}`
      })
      .join("\n")

    emailjs
      .send(
        emailServiceId,
        emailTemplateId,
        {
          quoteNumber: savedQuoteNumber,
          date: new Date().toLocaleDateString("es-CL"),
          name: form.nombre || "Sin nombre",
          phone: form.telefono || "Sin teléfono",
          city: zoneLabel,
          details,
          subtotal: formatCLP(result.subtotalGeneral),
          discount: formatCLP(result.discountGeneral),
          total: formatCLP(result.totalGeneral),
          promoCode: result.promo ? result.promo.label : "Sin código",
          sellerName: vendedor.nombre,
          sellerPhone: vendedor.telefono,
          sellerEmail: vendedor.email,
          sellerBranch: vendedor.sucursal,
        },
        emailPublicKey
      )
      .then(() => {
        alert("Cotización enviada a Decosun")
      })
      .catch((error) => {
        console.error(error)
        alert("Cotización guardada, pero hubo error al enviar correo")
      })
  }

  const whatsappText = result.hasValidRows
    ? [
        "Hola Decosun, quiero solicitar una cotización.",
        `Nº Cotización: ${quoteNumber}`,
        "",
        `Cliente: ${form.nombre || "-"}`,
        `Teléfono: ${form.telefono || "-"}`,
        `Sucursal: ${form.sucursal === "iquique" ? "Iquique" : "Viña del Mar"}`,
        `Ciudad/Zona: ${zoneLabel}`,
        `Vendedor asignado: ${vendedor.nombre}`,
        "",
        "Productos:",
        ...result.rows
          .filter((row) => row.valid)
          .map((row, index) => {
            const locationText = row.ubicacion ? ` · Ubicación: ${row.ubicacion}` : ""
            const measureText =
              row.category === "calculable"
                ? ` · ${row.ancho} m x ${row.alto} m`
                : ""
            const valueText =
              row.category === "solicitud"
                ? " · Solicitar valores a DecoSun"
                : ` · Total: ${formatCLP(row.total)}`

            return `${index + 1}. ${row.productLabel}${measureText} · Cantidad: ${
              row.cantidad
            }${locationText}${valueText}`
          }),
        "",
        result.discountGeneral > 0
          ? `Código aplicado: ${result.promo?.label} (-${formatCLP(
              result.discountGeneral
            )})`
          : "",
        `Subtotal base: ${formatCLP(result.subtotalGeneral)}`,
        `Recargo total: ${formatCLP(result.recargoGeneral)}`,
        `Total estimado: ${formatCLP(result.totalGeneral)}`,
        result.hasRequestRows
          ? "Nota: algunos productos requieren evaluación técnica y confirmación de valores."
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "Hola Decosun, quiero solicitar una cotización."

  const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}`

  return (
    <main className="relative overflow-hidden bg-slate-950">
      <img
        src={bgCotizador}
        alt="Cotizador Decosun"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />

      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
            Cotizar
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Cotizador online · Decosun
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-200">
            Ingresa productos, medidas y ubicación. Las motorizaciones se agregan
            como artículos independientes para mantener una cotización más limpia.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="rounded-[30px] border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nombre del cliente
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Nombre del cliente"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="+56..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sucursal
                </label>
                <select
                  name="sucursal"
                  value={form.sucursal}
                  onChange={handleFormChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                >
                  <option value="iquique">Iquique</option>
                  <option value="vina">Viña del Mar</option>
                </select>
              </div>

              {form.sucursal === "iquique" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ciudad / zona
                  </label>
                  <select
                    name="zona"
                    value={form.zona}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="iquique">Iquique</option>
                    <option value="segunda">Otra ciudad II Región</option>
                    <option value="otra">Otra ciudad de Chile</option>
                  </select>
                </div>
              )}

              {form.sucursal === "vina" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ciudad / zona
                  </label>
                  <select
                    name="zona"
                    value={form.zona}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="vina">Viña del Mar</option>
                    <option value="santiago">Santiago</option>
                    <option value="otra">Otra ciudad</option>
                  </select>
                </div>
              )}

              {form.zona === "otra" && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Escribe tu ciudad
                  </label>
                  <input
                    name="ciudadExtra"
                    value={form.ciudadExtra}
                    onChange={handleFormChange}
                    type="text"
                    placeholder="Ej. La Serena"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Código promocional
                </label>
                <input
                  name="promoCode"
                  value={form.promoCode}
                  onChange={handleFormChange}
                  type="text"
                  placeholder=""
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none transition focus:border-slate-400"
                />

                {form.promoCode && result.promo && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    Código aplicado: {result.promo.label} · {result.promo.percent}% de descuento
                  </p>
                )}

                {form.promoCode && !result.promo && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    Código no válido.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-slate-950">
                  Productos a cotizar
                </h2>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addMeasureRow("rollerSimple")}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    + Producto
                  </button>

                  <button
                    type="button"
                    onClick={() => addMeasureRow("motorizacionIndependiente")}
                    className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    + Motorización
                  </button>

                  <button
                    type="button"
                    onClick={() => addMeasureRow("toldoProyectante")}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5"
                  >
                    + Solicitud especial
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {measures.map((item) => {
                  const category = getProductCategory(item.tipo)

                  return (
                    <div
                      key={item.id}
                      className="rounded-[24px] border border-slate-200 p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {productLabels[item.tipo]}
                          </p>
                          {category === "solicitud" && (
                            <p className="mt-1 text-sm text-amber-700">
                              Este producto requiere evaluación técnica.
                            </p>
                          )}
                          {category === "motor" && (
                            <p className="mt-1 text-sm text-slate-600">
                              Artículo independiente, no requiere medidas.
                            </p>
                          )}
                        </div>

                        {measures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMeasureRow(item.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Tipo de producto
                          </label>
                          <select
                            value={item.tipo}
                            onChange={(event) =>
                              handleMeasureChange(item.id, "tipo", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                          >
                            <optgroup label="Roller simple">
  <option value="rollerSimple">Roller simple</option>
  <option value="blackout">Black out</option>
  <option value="sunscreen">Sun Screen</option>
  <option value="translucido">Translúcido</option>
  <option value="rollerCenefa">Roller / Cenefa</option>
</optgroup>

<optgroup label="Roller DÚO / Doble">
  <option value="rollerDuo">Roller DÚO</option>
  <option value="rollerDuoTranslucido">DÚO translúcido</option>
  <option value="rollerDuoSunOut">DÚO Sun Out</option>
  <option value="dobleCenefa">Doble / Cenefa</option>
</optgroup>

                            <optgroup label="Solicitar valores a DecoSun">
                              <option value="toldoProyectante">Toldo proyectante</option>
                              <option value="toldoVertical">Toldo vertical</option>
                              <option value="cierreTerraza">Cierre de terraza</option>
                              <option value="pergolaBioclimatica">
                                Pérgola bioclimática
                              </option>
                            </optgroup>
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Ubicación
                          </label>
                          <input
                            type="text"
                            value={item.ubicacion}
                            onChange={(event) =>
                              handleMeasureChange(
                                item.id,
                                "ubicacion",
                                event.target.value
                              )
                            }
                            placeholder="Ej. Living, Oficina 1, Dormitorio principal"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                          />
                        </div>

                        {category === "calculable" && (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Ancho (m)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.ancho}
                                onChange={(event) =>
                                  handleMeasureChange(
                                    item.id,
                                    "ancho",
                                    event.target.value
                                  )
                                }
                                placeholder="1.80"
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Alto (m)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.alto}
                                onChange={(event) =>
                                  handleMeasureChange(
                                    item.id,
                                    "alto",
                                    event.target.value
                                  )
                                }
                                placeholder="2.20"
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(event) =>
                              handleMeasureChange(
                                item.id,
                                "cantidad",
                                event.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <aside
            id="print-area"
            className="print-area rounded-[30px] border border-amber-100 bg-amber-50 p-8 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Resultado estimado
            </p>

            <div className="mb-6 border-b border-slate-200 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Decosun
                  </h2>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                    Decoración y control solar
                  </p>

                  <div className="mt-2 text-sm text-slate-600">
                    <p>
                      <strong>N° Cotización:</strong> {quoteNumber} {form.nombre ? `· ${form.nombre}` : ""}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {new Date().toLocaleDateString("es-CL")}
                    </p>
                    <p>
                      <strong>Cliente:</strong> {form.nombre || "-"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {form.telefono || "-"}
                    </p>
                    <p>
                      <strong>Ciudad:</strong> {zoneLabel}
                    </p>
                  </div>
                </div>

                <img src={logoSolo} alt="Decosun" className="h-16 w-auto" />
              </div>

              <div className="mt-5 rounded-2xl border border-white/20 bg-white/90 p-4 text-sm text-slate-700 backdrop-blur-md">
                <p className="font-semibold text-slate-900">Vendedor asignado</p>
                <p className="mt-1">{vendedor.nombre}</p>
                <p>{vendedor.sucursal}</p>
                <p>{vendedor.telefono}</p>
                <p>{vendedor.email}</p>
              </div>
            </div>

            {result.hasValidRows ? (
              <>
                <h2 className="mt-3 text-3xl font-bold text-slate-950">
                  {formatCLP(result.totalGeneral)}
                </h2>

                {result.hasRequestRows && (
                  <p className="mt-2 rounded-xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
                    Esta cotización incluye productos que requieren evaluación técnica.
                  </p>
                )}

                <div className="mt-6 rounded-[24px] border border-amber-200/50 bg-white/90 p-5 shadow-xl backdrop-blur-md">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Detalle
                  </p>

                  <div className="space-y-3 print:hidden">
                    {result.rows
                      .filter((row) => row.valid)
                      .map((row) => (
                        <div
                          key={row.index}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {row.productLabel}
                              </p>

                              {row.ubicacion && (
                                <p className="text-sm text-slate-600">
                                  Ubicación: {row.ubicacion}
                                </p>
                              )}

                              <p className="text-sm text-slate-600">
                                {row.category === "calculable" &&
                                  `${row.ancho} m × ${row.alto} m · `}
                                Cantidad: {row.cantidad}
                              </p>

                              {row.category === "solicitud" && (
                                <p className="mt-1 text-sm font-medium text-amber-700">
                                  Solicitar valores a DecoSun
                                </p>
                              )}

                              {row.discount > 0 && (
                                <p className="mt-1 text-sm text-green-700">
                                  Descuento aplicado: -{formatCLP(row.discount)}
                                </p>
                              )}
                            </div>

                            <p className="font-semibold text-slate-900">
                              {row.category === "solicitud"
                                ? "Por evaluar"
                                : formatCLP(row.total)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <table className="hidden w-full text-sm print:table">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100">
                        <th className="p-2 text-left">Producto</th>
                        <th className="p-2 text-left">Ubicación</th>
                        <th className="p-2 text-left">Medidas</th>
                        <th className="p-2 text-left">Cant.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows
                        .filter((row) => row.valid)
                        .map((row) => (
                          <tr key={row.index} className="border-b border-slate-200">
                            <td className="p-2">{row.productLabel}</td>
                            <td className="p-2">{row.ubicacion || "-"}</td>
                            <td className="p-2">
                              {row.category === "calculable"
                                ? `${row.ancho} m × ${row.alto} m`
                                : "-"}
                            </td>
                            <td className="p-2">{row.cantidad}</td>
                            <td className="p-2 text-right">
                              {row.category === "solicitud"
                                ? "Solicitar valores"
                                : formatCLP(row.total)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-4">
                    <span>Subtotal base</span>
                    <span className="font-semibold">
                      {formatCLP(result.subtotalGeneral)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span>Recargo total</span>
                    <span className="font-semibold">
                      {formatCLP(result.recargoGeneral)}
                    </span>
                  </div>

                  {result.discountGeneral > 0 && (
                    <div className="flex justify-between gap-4 text-green-700">
                      <span>Descuento {result.promo?.label}</span>
                      <span className="font-semibold">
                        -{formatCLP(result.discountGeneral)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4 border-t border-amber-200 pt-3 text-base">
                    <span className="font-semibold text-slate-950">
                      Total estimado
                    </span>
                    <span className="font-bold text-slate-950">
                      {formatCLP(result.totalGeneral)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/20 bg-white/90 p-5 text-xs leading-6 text-slate-600 shadow-lg backdrop-blur-md">
                  <p className="font-semibold text-slate-900">
                    Condiciones comerciales - {vendedor.sucursal}
                  </p>

                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {condicionesSucursal.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 print:hidden"
                >
                  Generar PDF
                </button>

                <button
                  type="button"
                  onClick={sendQuoteEmail}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-amber-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 print:hidden"
                >
                  Guardar y enviar copia a Decosun
                </button>

                <a
                  href={whatsappURL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-green-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 print:hidden"
                >
                  Enviar cotización por WhatsApp
                </a>

                <p className="mt-6 text-xs text-slate-500">
                  Esta cotización es referencial y puede ajustarse según condiciones
                  de instalación y evaluación técnica en terreno. En Decosun diseñamos
                  soluciones a medida para cada espacio.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-2xl font-bold text-slate-950">
                  Ingresa productos para calcular
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  Completa al menos un producto válido para ver el valor estimado.
                  Los productos especiales se enviarán como solicitud de valores.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
