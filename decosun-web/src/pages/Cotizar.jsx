import PublicPageHero from "../components/PublicPageHero"
import { supabase } from "../lib/supabase"
import { getTerritoryAssignment } from "../lib/territoryAssignment"
import logoSolo from "../assets/images/logo-vertical.png"
import QuoteProductGallery, { getQuoteFamily, getQuoteProductImage, QuoteProductImage } from "../components/QuoteProductGallery"
import "../components/QuoteExperience.css"
import { insertQuoteRows } from "../lib/smartQuote"
import { useEffect, useMemo, useState, useRef } from "react"
import emailjs from "@emailjs/browser"
import { Link, useSearchParams } from "react-router-dom"
import { getPleatedOption, pleatedOptions, PLEATED_PATH } from "../lib/pleatedSystems"
import { getPleatedPrice } from "../lib/pleatedPricing"
import { buildWhatsAppUrl, getQuoteWhatsAppZone } from "../lib/whatsappRouting"
import quoteLogo from "../assets/images/seo/logo-horizontal.png"

function formatCLP(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

const calculableProducts = {
  ...Object.fromEntries(pleatedOptions.map(option => [option.key, option.name])),
  rollerSimple: "Roller simple",
  blackout: "Black out",
  sunscreen: "Sun Screen",
  translucido: "Translúcido",
  rollerCenefa: "Roller / Cenefa",
  rollerDoble: "Roller doble SC + BO",
  rollerDobleCenefa: "Roller doble SC + BO / Cenefa",
  rollerDuo: "DÚO",
  rollerDuoTranslucido: "DÚO translúcido",
  rollerDuoSunOut: "DÚO Sun Out",
  persianaVertical: "Persiana vertical",
  darkBlackout: "Dark Black Out",
}

const requestOnlyProducts = {
  honeycomb: "Cortinas Plisadas Honeycomb",
  toldoProyectante: "Toldo proyectante",
  toldoVertical: "Toldo vertical",
  cierreTerraza: "Cierres de cristal para terrazas y balcones",
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
  const [searchParams] = useSearchParams()

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
      rollerDoble: 70000,
      rollerDobleCenefa: 70000,
      rollerDuo: 60000,
      rollerDuoTranslucido: 60000,
      rollerDuoSunOut: 60000,
      persianaVertical: 75000,
      darkBlackout: 55000,
      motorizacionIndependiente: 130000,
      motorizacionDual: 130000,
      motorizacionIntegrada: 130000,
    },
    vina: {
      rollerSimple: 30000,
      blackout: 30000,
      sunscreen: 30000,
      translucido: 30000,
      rollerCenefa: 30000,
      rollerDoble: 55000,
      rollerDobleCenefa: 55000,
      rollerDuo: 50000,
      rollerDuoTranslucido: 50000,
      rollerDuoSunOut: 50000,
      persianaVertical: 60000,
      darkBlackout: 55000,
      motorizacionIndependiente: 100000,
      motorizacionDual: 100000,
      motorizacionIntegrada: 100000,
    },
  }

  const promoCodes = {
    DSNVDM: { label: "DSNVDM", percent: 10 },
    DSNNT: { label: "DSNNT", percent: 5 },
    DSNIQQ: { label: "DSNIQQ", percent: 15 },
  }

  const [galleryTarget, setGalleryTarget] = useState(null)
  const savePending = useRef(null)
  const pendingProject = useRef(null)
  const [quoteNumber, setQuoteNumber] = useState("COT-PENDIENTE")
  const [savedProject, setSavedProject] = useState(null)
  const [saving, setSaving] = useState(false)
  const [preparingPdf, setPreparingPdf] = useState(false)
  const [pdfError, setPdfError] = useState("")

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    sucursal: "iquique",
    zona: "",
    ciudadExtra: "",
    promoCode: "",
  })

  const [measures, setMeasures] = useState(() => {
    const productKey = searchParams.get("producto")
    return getPleatedOption(productKey) ? [createMeasureRow(productKey)] : []
  })

  useEffect(() => {
    if (!getPleatedOption(searchParams.get("producto"))) return
    const card = document.querySelector(".quote-config-card")
    card?.focus({ preventScroll: true })
    card?.scrollIntoView({ block: "start" })
  }, [searchParams])

  const vendedor = vendedores[form.sucursal]
  const condicionesSucursal = condiciones[form.sucursal]

  function handleFormChange(event) {
    if (pendingProject.current) return
    const { name, value } = event.target

    setSavedProject(null)
    setQuoteNumber("COT-PENDIENTE")

    setForm((prev) => ({
      ...prev,
      [name]: name === "promoCode" ? value.toUpperCase() : value,
    }))
  }

  function handleMeasureChange(id, field, value) {
    if (pendingProject.current) return
    setSavedProject(null)
    setQuoteNumber("COT-PENDIENTE")

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

  function addMeasureRow(tipo = "rollerSimple", ubicacion = "") {
    if (pendingProject.current) return
    setSavedProject(null)
    setQuoteNumber("COT-PENDIENTE")
    const row = { ...createMeasureRow(tipo), ubicacion }
    setMeasures((prev) => [...prev, row])
    return row.id
  }

  function removeMeasureRow(id) {
    if (pendingProject.current) return
    setSavedProject(null)
    setQuoteNumber("COT-PENDIENTE")

    setMeasures((prev) => {
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
        productLabel: productLabels[item.tipo] || item.tipo,
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

      const pleatedPrice = getPleatedPrice(item.tipo, item.ancho, item.alto, cantidad)
      if (pleatedPrice) {
        if (!pleatedPrice.valid) return baseRow
        if (pleatedPrice.requiresAssessment) {
          return {
            ...baseRow,
            valid: true,
            category: "solicitud",
            ancho: pleatedPrice.width,
            alto: pleatedPrice.height,
            cantidad,
            note: "Medida fuera de la tabla de precios en línea. Solicita evaluación técnica.",
          }
        }

        const subtotal = pleatedPrice.subtotal
        const recargo = recargoUnit * cantidad
        const discount = promo ? Math.round(subtotal * (promo.percent / 100)) : 0
        return {
          ...baseRow,
          valid: true,
          ancho: pleatedPrice.width,
          alto: pleatedPrice.height,
          cantidad,
          subtotal,
          recargo,
          discount,
          total: subtotal + recargo - discount,
          note: `Valor por tramo de hasta ${pleatedPrice.bandWidth.toLocaleString("es-CL")} × ${pleatedPrice.bandHeight.toLocaleString("es-CL")} m. IVA incluido.`,
        }
      }

      if (category === "solicitud") {
        const valid = Number.isInteger(cantidad) && cantidad > 0
        return {
          ...baseRow,
          valid,
          cantidad,
          note: "Solicitar valores a DecoSun",
        }
      }

      if (category === "motor") {
        const valid = Number.isInteger(cantidad) && cantidad > 0
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
        Number.isInteger(cantidad) && cantidad > 0 && Number.isFinite(ancho) && Number.isFinite(alto)

      if (!valid) return baseRow

      const area = ancho * alto
      const subtotal = area * price * cantidad

      const cenefaExtra =
        item.tipo === "rollerCenefa" || item.tipo === "rollerDobleCenefa"
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
    const requestRows = validRows.filter((row) => row.category === "solicitud")

    const subtotalGeneral = validRows.reduce((acc, row) => acc + row.subtotal, 0)
    const recargoGeneral = validRows.reduce((acc, row) => acc + row.recargo, 0)
    const discountGeneral = validRows.reduce((acc, row) => acc + row.discount, 0)
    const totalGeneral = validRows.reduce((acc, row) => acc + row.total, 0)

    return {
      rows,
      validRows,
      requestRows,
      recargoUnit,
      subtotalGeneral,
      recargoGeneral,
      discountGeneral,
      totalGeneral,
      promo,
      hasValidRows: validRows.length > 0,
      hasRequestRows: requestRows.length > 0,
    }
  }, [form, measures])

  const displayedTotal = result.hasRequestRows && result.requestRows.length === result.validRows.length
    ? "Por evaluar"
    : formatCLP(result.totalGeneral)

  function buildQuoteDetails() {
    return result.rows
      .filter((row) => row.valid)
      .map((row, index) => {
        const locationText = row.ubicacion ? ` · Ubicación: ${row.ubicacion}` : ""
        const measureText =
          (row.category === "calculable" || getPleatedOption(row.productKey))
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
  }

  function buildWhatsappText(quoteNumberToUse = quoteNumber) {
    if (!result.hasValidRows) {
      return "Hola Decosun, quiero solicitar una cotización."
    }

    return [
      "Hola Decosun, quiero solicitar una cotización.",
      `Nº Cotización: ${quoteNumberToUse}`,
      "",
      `Cliente: ${form.nombre || "-"}`,
      `Teléfono: ${form.telefono || "-"}`,
      `Sucursal: ${form.sucursal === "iquique" ? "Iquique" : "Viña del Mar"}`,
      `Ciudad/Zona: ${zoneLabel}`,
      `Vendedor asignado: ${vendedor.nombre}`,
      "",
      "Productos:",
      buildQuoteDetails(quoteNumberToUse),
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
  }

  function saveQuoteToSupabase() {
    if (savePending.current) return savePending.current
    savePending.current = persistQuote().finally(() => { savePending.current = null })
    return savePending.current
  }

  async function persistQuote() {
    if (savedProject?.quoteNumber) return savedProject

    try {
      setSaving(true)

      const validRows = result.rows.filter((row) => row.valid)

      if (validRows.length !== result.rows.length || validRows.length === 0 || !form.nombre.trim() || form.telefono.replace(/\D/g, "").length < 8 || !form.zona || (form.zona === "otra" && !form.ciudadExtra.trim())) {
        alert("Completa nombre, teléfono, ubicación y todos los productos con medidas y cantidades válidas.")
        setSaving(false)
        return false
      }

      const branch = form.sucursal === "iquique" ? "iquique" : "vina"

      const { data: realQuoteNumber, error: quoteError } = pendingProject.current ? { data: pendingProject.current.quoteNumber, error: null } : await supabase.rpc(
        "next_quote_number",
        { p_branch: branch }
      )

      if (quoteError) {
        console.error(quoteError)
        alert("Error generando correlativo")
        setSaving(false)
        return false
      }

      const publicToken = pendingProject.current?.publicToken || crypto.randomUUID()
      const projectId = pendingProject.current?.projectId || crypto.randomUUID()

      const summary = validRows
        .map((row) => {
          const locationText = row.ubicacion ? ` · Ubicación: ${row.ubicacion}` : ""
          const measureText =
            row.category === "calculable" || row.productKey === "honeycomb" || getPleatedOption(row.productKey) ? ` · ${row.ancho}x${row.alto}` : ""
          const valueText =
            row.category === "solicitud"
              ? " · Solicitar valores a DecoSun"
              : ` · Total: ${formatCLP(row.total)}`

          return `${row.productLabel}${measureText} · Cant: ${row.cantidad}${locationText}${valueText}`
        })
        .join(" | ")

      const city = form.zona === "otra" ? form.ciudadExtra : zoneLabel
      const territory = getTerritoryAssignment({
        city,
        sucursal: form.sucursal,
      })

      const projectPayload = [
        {
          id: projectId,
          title: `${realQuoteNumber} · ${form.nombre || "Cliente web"}`,
          contact_name: form.nombre || null,
          contact_phone: form.telefono || null,
          city: city || null,
          summary,
          sale_value: result.totalGeneral || 0,
          amount_paid: 0,
          status: "cotizado",
          payment_status: "pendiente",
          payment_type: "pendiente",
          region_code: territory.region_code,
          client_type: "Residencial",
          company_name:
            form.sucursal === "iquique" ? "Decosun Spa" : "Decosun Group SpA",
          source: "cotizador_web",
          quote_number: realQuoteNumber,
          public_token: publicToken,
          advisor_id: territory.advisor_id,
          advisor_name: territory.advisor_name,
          advisor_region: territory.region_code,
          client_visible_status: "Cotización recibida",
        },
      ]
      const previousAttempt = pendingProject.current
      pendingProject.current = { projectId, publicToken, quoteNumber: realQuoteNumber }
      const { error: projectError } = await insertQuoteRows(supabase, "projects", projectPayload, projectId, Boolean(previousAttempt))

      if (projectError) {
        console.error(projectError)
        alert("Error guardando proyecto")
        setSaving(false)
        return false
      }

      const measurementRows = validRows.map((row) => ({
        project_id: projectId,
        product_type: row.productKey,
        width: row.category === "calculable" || row.productKey === "honeycomb" || getPleatedOption(row.productKey) ? Number(row.ancho) || null : null,
        height: row.category === "calculable" || row.productKey === "honeycomb" || getPleatedOption(row.productKey) ? Number(row.alto) || null : null,
        quantity: row.cantidad,
        fabric: row.ubicacion || null,
      }))

      const { error: measurementError } = await insertQuoteRows(supabase, "project_measurements", measurementRows, projectId, Boolean(previousAttempt))

      if (measurementError) {
        console.error(measurementError)
        alert("Proyecto creado, pero no se completaron las medidas. Reintenta sin cerrar esta página.")
        return false
      }

      const saved = {
        projectId,
        quoteNumber: realQuoteNumber,
        publicToken,
      }

      setQuoteNumber(realQuoteNumber)
      setSavedProject(saved)
      setSaving(false)

      return saved
    } catch (err) {
      console.error(err)
      alert("Error conectando con Supabase")
      setSaving(false)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveOnly() {
    const saved = await saveQuoteToSupabase()
    if (!saved) return

    alert(`Proyecto guardado en el panel: ${saved.quoteNumber}`)
  }

  async function sendQuoteEmail() {
    if (!result.hasValidRows) return

    const saved = await saveQuoteToSupabase()
    if (!saved) return

    emailjs
      .send(
        emailServiceId,
        emailTemplateId,
        {
          quoteNumber: saved.quoteNumber,
          date: new Date().toLocaleDateString("es-CL"),
          name: form.nombre || "Sin nombre",
          phone: form.telefono || "Sin teléfono",
          city: zoneLabel,
          details: buildQuoteDetails(saved.quoteNumber),
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
        alert("Cotización guardada y enviada a Decosun")
      })
      .catch((error) => {
        console.error(error)
        alert("Cotización guardada, pero hubo error al enviar correo")
      })
  }

  async function sendWhatsapp() {
    const saved = await saveQuoteToSupabase()
    if (!saved) return

    const zone = getQuoteWhatsAppZone({
      city: form.zona === "otra" ? form.ciudadExtra : zoneLabel,
      sucursal: form.sucursal,
    })
    const whatsappURL = buildWhatsAppUrl({ zone, message: buildWhatsappText(saved.quoteNumber), pathname: "/cotizar" })

    window.open(whatsappURL, "_blank", "noopener,noreferrer")
  }

  async function printQuote() {
    if (preparingPdf) return
    setPreparingPdf(true)
    setPdfError("")
    try {
      const { createQuotePdf, loadQuotePdfImage } = await import("../lib/quotePdf")
      const sources = { logo: quoteLogo }
      for (const row of result.validRows) sources[row.productKey] = getQuoteProductImage(getQuoteFamily(row.productKey), row.productKey)
      const images = Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([key, src]) => [key, await loadQuotePdfImage(src)])))
      const pdf = createQuotePdf({
        quoteNumber,
        date: new Date().toLocaleDateString("es-CL"),
        customer: form,
        city: zoneLabel,
        seller: vendedor,
        conditions: condicionesSucursal,
        result,
        totalLabel: displayedTotal,
      }, images)
      pdf.save(`Cotizacion-DecoSun-${quoteNumber.replace(/[^a-z0-9_-]/gi, "-")}.pdf`)
    } catch {
      setPdfError("No se pudo generar el PDF. Intenta nuevamente.")
    } finally {
      setPreparingPdf(false)
    }
  }

  function chooseProduct(tipo) {
    let rowId = galleryTarget.rowId
    if (rowId) handleMeasureChange(rowId, "tipo", tipo)
    else rowId = addMeasureRow(tipo, galleryTarget.ubicacion)
    setGalleryTarget(null)
    requestAnimationFrame(() => {
      const card = document.getElementById(`product-${rowId}`)
      card?.focus({ preventScroll: true })
      card?.scrollIntoView({ block: "start" })
    })
  }

  function duplicateMeasureRow(item) {
    if (pendingProject.current) return
    setSavedProject(null)
    setQuoteNumber("COT-PENDIENTE")
    setMeasures(previous => [...previous, { ...item, id: crypto.randomUUID() }])
  }

  return (
    <main className="public-presentation quote-advanced">
      <PublicPageHero page="Cotizar" eyebrow="Cotiza a tu medida" titleId="quote-title" highlight="Tu espacio." title="Tu próxima solución." media={<img src="/img/motorizacion/4MT-640.jpg" alt="Concepto de cortinas motorizadas" />} caption="Imagen conceptual de ambiente.">
        <p className="public-hero-description">Elige tus productos, configura sus medidas y revisa una estimación para tu proyecto.</p>
        <div className="public-hero-actions"><a href="#quote-products" className="public-primary-button">Elegir productos ↓</a></div>
      </PublicPageHero>
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-[30px] border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
            <div>
              <div className="quote-products-heading">
                <div><p className="quote-step-label">01 · Tus productos</p><h2 id="quote-products">¿Qué quieres cotizar?</h2><p>Elige un sistema y configura cada producto en su propia tarjeta.</p></div>
                <button type="button" className="public-primary-button" disabled={saving || Boolean(pendingProject.current)} onClick={() => setGalleryTarget({})}>+ Añadir producto</button>
              </div>
              {measures.length === 0 && <div className="quote-empty"><h3>Tu proyecto empieza aquí.</h3><p>Explora las fotos y encuentra la solución para tu espacio.</p><button type="button" className="public-primary-button" onClick={() => setGalleryTarget({})}>Explorar galería de productos ↗</button></div>}
              <p className="quote-measure-note">Medidas en metros. Por ejemplo, 150 cm = 1,50 m. Las medidas finales y la compatibilidad se confirman en evaluación técnica.</p>
              <div className="space-y-4">
                {measures.map((item, index) => {
                  const category = getProductCategory(item.tipo)
                  const family = getQuoteFamily(item.tipo)
                  const pleatedOption = getPleatedOption(item.tipo)

                  return (
                    <div
                      key={item.id}
                      id={`product-${item.id}`}
                      tabIndex={-1}
                      className="quote-config-card"
                    >
                      <div className="quote-selected-product">
                        <figure><QuoteProductImage family={family} productKey={item.tipo} />{family.conceptual && <figcaption>Imagen conceptual generada con IA.</figcaption>}</figure>
                        <div>
                          <p className="quote-step-label">Producto {index + 1}</p>
                          <h3>{pleatedOption?.name || family.name}</h3>
                          <p>{pleatedOption?.description || family.description}</p>
                          {family.id.startsWith("honeycomb") || family.id === "mosquitero" ? <Link className="quote-product-guide" to={PLEATED_PATH}>Conocer sistemas y comparar opciones ↗</Link> : null}
                          <button type="button" className="quote-outline-button" disabled={saving || Boolean(pendingProject.current)} onClick={() => setGalleryTarget({ rowId: item.id })}>Cambiar producto</button>
                          {category === "calculable" && !pleatedOption && <button type="button" className="quote-outline-button quote-add-motor" disabled={saving || Boolean(pendingProject.current)} onClick={() => setGalleryTarget({ familyId: "motor", ubicacion: item.ubicacion })}>+ Añadir motorización</button>}
                        </div>
                      </div>
                      <div className="quote-row-actions">
                        <button type="button" disabled={saving || Boolean(pendingProject.current)} onClick={() => duplicateMeasureRow(item)}>Duplicar producto</button>
                        <button type="button" disabled={saving || Boolean(pendingProject.current)} onClick={() => removeMeasureRow(item.id)}>Eliminar producto</button>
                      </div>
                      {category === "solicitud" && <p className="quote-measure-note">Valor mediante evaluación técnica. Puedes indicar el ambiente y la cantidad.</p>}
                      {category === "motor" && <p className="quote-measure-note">Valor por unidad. Indica el ambiente para relacionarlo con tus cortinas. La compatibilidad y los accesorios se confirman con asesoría.</p>}
                      {pleatedOption && <p className="quote-measure-note">{result.rows[index].note || "Indica ancho y alto para ver el precio del sistema. La tarifa usa el tramo superior de la tabla e incluye IVA. Medidas sobre 3 m en cualquiera de sus lados requieren cotización asistida."}</p>}
                      <div className="grid gap-4 md:grid-cols-3">
                        {family.variants.length > 1 && <div className="md:col-span-3">
                          <label htmlFor={`variant-${item.id}`} className="mb-2 block text-sm font-medium text-slate-700">{family.variantLabel}</label>
                          <select id={`variant-${item.id}`} value={item.tipo} onChange={event => handleMeasureChange(item.id, "tipo", event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
                            {family.variants.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                        </div>}
                        <div className="md:col-span-3">
                          <label htmlFor={`ubicacion-${item.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                            Ubicación
                          </label>
                          <input
                            type="text"
                            id={`ubicacion-${item.id}`} value={item.ubicacion}
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
                              <label htmlFor={`ancho-${item.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                                Ancho (m)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                id={`ancho-${item.id}`} value={item.ancho}
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
                              <label htmlFor={`alto-${item.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                                Alto (m)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                id={`alto-${item.id}`} value={item.alto}
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
                          <label htmlFor={`cantidad-${item.id}`} className="mb-2 block text-sm font-medium text-slate-700">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            id={`cantidad-${item.id}`} value={item.cantidad}
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
            <div className="quote-contact-heading"><p className="quote-step-label">02 · Ubicación y contacto</p><h2>¿Dónde está tu proyecto?</h2><p>La sucursal, la zona y el código promocional se reflejan en el valor estimado.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="quote-nombre" className="mb-2 block text-sm font-medium text-slate-700">
                  Nombre del cliente
                </label>
                <input
                  id="quote-nombre" name="nombre"
                  value={form.nombre}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Nombre del cliente"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="quote-telefono" className="mb-2 block text-sm font-medium text-slate-700">
                  Teléfono
                </label>
                <input
                  id="quote-telefono" name="telefono"
                  value={form.telefono}
                  onChange={handleFormChange}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+56..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label htmlFor="quote-sucursal" className="mb-2 block text-sm font-medium text-slate-700">
                  Sucursal
                </label>
                <select
                  id="quote-sucursal" name="sucursal"
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
                  <label htmlFor="quote-zona" className="mb-2 block text-sm font-medium text-slate-700">
                    Ciudad / zona
                  </label>
                  <select
                    id="quote-zona" name="zona"
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
                  <label htmlFor="quote-zona" className="mb-2 block text-sm font-medium text-slate-700">
                    Ciudad / zona
                  </label>
                  <select
                    id="quote-zona" name="zona"
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
                  <label htmlFor="quote-ciudadExtra" className="mb-2 block text-sm font-medium text-slate-700">
                    Escribe tu ciudad
                  </label>
                  <input
                    id="quote-ciudadExtra" name="ciudadExtra"
                    value={form.ciudadExtra}
                    onChange={handleFormChange}
                    type="text"
                    placeholder="Ej. La Serena"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label htmlFor="quote-promoCode" className="mb-2 block text-sm font-medium text-slate-700">
                  Código promocional
                </label>
                <input
                  id="quote-promoCode" name="promoCode"
                  value={form.promoCode}
                  onChange={handleFormChange}
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none transition focus:border-slate-400"
                />

                {form.promoCode && result.promo && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    Código aplicado: {result.promo.label} ·{" "}
                    {result.promo.percent}% de descuento
                  </p>
                )}

                {form.promoCode && !result.promo && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    Código no válido.
                  </p>
                )}
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
                      <strong>N° Cotización:</strong> {quoteNumber}
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

              {savedProject?.quoteNumber && (
                <p className="mt-4 rounded-xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-800 print:hidden">
                  Proyecto guardado en el panel: {savedProject.quoteNumber}
                </p>
              )}

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
                  {displayedTotal}
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
                                {(row.category === "calculable" || getPleatedOption(row.productKey)) &&
                                  `${row.ancho} m × ${row.alto} m · `}
                                Cantidad: {row.cantidad}
                              </p>

                              {row.category === "solicitud" && (
                                <p className="mt-1 text-sm font-medium text-amber-700">
                                  Solicitar valores a DecoSun
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
                      {displayedTotal}
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
                  onClick={printQuote}
                  disabled={preparingPdf}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 print:hidden"
                >
                  {preparingPdf ? "Preparando PDF…" : "Generar PDF carta"}
                </button>
                {pdfError && <p role="alert" className="mt-3 text-sm text-red-700">{pdfError}</p>}

                <button
                  type="button"
                  onClick={handleSaveOnly}
                  disabled={saving}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-700 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 print:hidden"
                >
                  {saving ? "Guardando..." : "Guardar proyecto en panel"}
                </button>

                <button
                  type="button"
                  onClick={sendQuoteEmail}
                  disabled={saving}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-amber-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 print:hidden"
                >
                  Guardar y enviar copia a Decosun
                </button>

                <button
                  type="button"
                  onClick={sendWhatsapp}
                  disabled={saving}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-green-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 print:hidden"
                >
                  Guardar y enviar por WhatsApp
                </button>

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
      <QuoteProductGallery target={galleryTarget} onChoose={chooseProduct} onClose={() => setGalleryTarget(null)} />
    </main>
  )
}
