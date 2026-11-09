import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
const margin = 12

export async function loadQuotePdfImage(src) {
  if (!src) return null
  try {
    const image = new Image()
    image.src = src
    await image.decode()
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = Math.max(1, Math.round(512 * image.naturalHeight / image.naturalWidth))
    const context = canvas.getContext("2d")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", .88)
  } catch {
    return null
  }
}

export function createQuotePdf({ quoteNumber, date, customer, city, seller, conditions, result, totalLabel }, images = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter", compress: true })
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  const contentWidth = width - margin * 2
  const right = width - margin
  doc.setProperties({ title: `Cotización DecoSun ${quoteNumber}`, subject: "Cotización referencial", creator: "DecoSun" })

  function drawImage(data, x, y, boxWidth, boxHeight) {
    if (!data) return
    const properties = doc.getImageProperties(data)
    const scale = Math.min(boxWidth / properties.width, boxHeight / properties.height)
    const imageWidth = properties.width * scale
    const imageHeight = properties.height * scale
    doc.addImage(data, x, y + (boxHeight - imageHeight) / 2, imageWidth, imageHeight)
  }

  drawImage(images.logo, margin, 11, 45, 15)
  doc.setTextColor(15, 23, 42)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("Cotización", right, 17, { align: "right" })
  doc.setFontSize(10)
  doc.text(quoteNumber, right, 23, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.text(date, right, 28, { align: "right" })
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(.45)
  doc.line(margin, 32, right, 32)

  autoTable(doc, {
    startY: 35,
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1, textColor: [30, 41, 59], overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: contentWidth * .6 }, 1: { cellWidth: contentWidth * .4 } },
    body: [[
      `Cliente  ${customer.nombre || "Por indicar"}\nTeléfono  ${customer.telefono || "Por indicar"}\nCiudad  ${city}`,
      `${seller.sucursal}\n${seller.nombre}\n${seller.telefono}\n${seller.email}`,
    ]],
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    theme: "plain",
    margin: { top: margin, bottom: margin + 5, left: margin, right: margin },
    head: [["Producto y ambiente", "Medidas", "Cant.", "Valor"]],
    body: result.validRows.map(row => [
      [row.productLabel, row.ubicacion, row.note].filter(Boolean).join("\n"),
      row.ancho && row.alto ? `${row.ancho} × ${row.alto} m` : "-",
      String(row.cantidad),
      row.category === "solicitud" ? "Por evaluar" : money.format(row.total),
    ]),
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, textColor: [30, 41, 59], overflow: "linebreak", valign: "middle", minCellHeight: 17, lineWidth: { bottom: .15 }, lineColor: [226, 232, 240] },
    headStyles: { fontStyle: "bold", fillColor: [241, 245, 249], minCellHeight: 7 },
    columnStyles: {
      0: { cellWidth: contentWidth * .56, cellPadding: { top: 2, bottom: 2, left: 24, right: 2 } },
      1: { cellWidth: contentWidth * .20 },
      2: { cellWidth: contentWidth * .08, halign: "center" },
      3: { cellWidth: contentWidth * .16, halign: "right" },
    },
    rowPageBreak: "avoid",
    showHead: "everyPage",
    didDrawCell(data) {
      if (data.section !== "body" || data.column.index !== 0) return
      const row = result.validRows[data.row.index]
      drawImage(images[row.productKey], data.cell.x + 2, data.cell.y + (data.cell.height - 13) / 2, 19, 13)
    },
  })

  const totals = [
    ["Subtotal base", money.format(result.subtotalGeneral)],
    ["Recargo de ubicación", money.format(result.recargoGeneral)],
  ]
  if (result.discountGeneral > 0) totals.push([`Descuento ${result.promo?.label}`, `-${money.format(result.discountGeneral)}`])
  totals.push(["Total estimado", totalLabel])

  doc.setFontSize(8)
  const terms = conditions.flatMap((condition, index) => doc.splitTextToSize(`${index + 1}. ${condition}`, contentWidth))
  const note = doc.splitTextToSize("Valores referenciales sujetos a evaluación técnica y condiciones de instalación. Las imágenes conceptuales ilustran el tipo de sistema. Las telas, colores y configuración final se confirman con asesoría.", contentWidth)
  const assessment = result.hasRequestRows ? doc.splitTextToSize("Los productos marcados como Por evaluar requieren confirmación de valores. El total incluye los productos con valor disponible.", contentWidth) : []
  const closingHeight = totals.length * 5.2 + terms.length * 3.6 + note.length * 3.5 + assessment.length * 3.6 + 18
  let y = doc.lastAutoTable.finalY + 4
  if (y + closingHeight > height - margin - 5) {
    doc.addPage()
    y = margin
  }

  for (const [index, [label, value]] of totals.entries()) {
    const isTotal = index === totals.length - 1
    if (isTotal) {
      doc.setFillColor(254, 243, 199)
      doc.rect(right - 82, y - 3.5, 82, 5.8, "F")
    }
    doc.setFont("helvetica", isTotal ? "bold" : "normal")
    doc.setFontSize(isTotal ? 10 : 8.5)
    doc.text(label, right - 80, y)
    doc.text(value, right - 2, y, { align: "right" })
    y += 5.2
  }

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  y += 3
  if (assessment.length) {
    doc.text(assessment, margin, y, { lineHeightFactor: 1.3 })
    y += assessment.length * 3.6 + 2
  }
  doc.setFont("helvetica", "bold")
  doc.text("Condiciones comerciales", margin, y)
  y += 4
  doc.setFont("helvetica", "normal")
  doc.text(terms, margin, y, { lineHeightFactor: 1.3 })
  y += terms.length * 3.6 + 3
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7.5)
  doc.text(note, margin, y, { lineHeightFactor: 1.3 })

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`DecoSun - ${quoteNumber}`, margin, height - 8)
    doc.text(`Página ${page} de ${pages}`, right, height - 8, { align: "right" })
  }
  return doc
}
