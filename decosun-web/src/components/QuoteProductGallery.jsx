import { useEffect, useRef } from "react"
import roller from "../assets/images/fabrics/sunscreen-concept.jpg"
import blackout from "../assets/images/fabrics/blackout-concept.jpg"
import translucida from "../assets/images/fabrics/translucida-concept.jpg"
import doble from "../assets/images/systems/roller-doble-concept.jpg"
import duo from "../assets/images/systems/roller-duo-concept.jpg"
import vertical from "../assets/images/systems/persianas-verticales-concept.jpg"
import proyectante from "../assets/images/systems/toldos-proyectantes-concept.jpg"
import toldoVertical from "../assets/images/systems/toldos-verticales-concept.jpg"
import cristal from "../assets/images/cierres-cristal/cierre-cristal-balcon-01.jpeg"
import pergola from "../assets/images/pergola02.avif"

export const quoteFamilies = [
  {
    id: "roller", name: "Cortina roller", image: roller, conceptual: true,
    description: "Una tela que se enrolla. Elige cómo filtrar la luz y cuidar tu privacidad.",
    variantLabel: "Tela y terminación",
    variants: [
      ["rollerSimple", "Roller simple · tela por confirmar"],
      ["sunscreen", "Sunscreen · luz filtrada y vista"],
      ["blackout", "Blackout · oscurecimiento"],
      ["translucido", "Translúcida · luz difusa"],
      ["darkBlackout", "Dark Black Out · referencia por confirmar"],
      ["rollerCenefa", "Roller con cenefa · tela por confirmar"],
    ],
  },
  {
    id: "doble", name: "Roller doble", image: doble, conceptual: true,
    description: "Dos cortinas independientes, sunscreen y blackout, para alternar luz y oscurecimiento.",
    variantLabel: "Terminación",
    variants: [["rollerDoble", "Sunscreen + blackout"], ["rollerDobleCenefa", "Sunscreen + blackout con cenefa"]],
  },
  {
    id: "duo", name: "Cortina DÚO", image: duo, conceptual: true,
    description: "Franjas de distinta transparencia que se alternan para regular la luz y la privacidad.",
    variantLabel: "Variante de tela",
    variants: [["rollerDuo", "DÚO · referencia por confirmar"], ["rollerDuoTranslucido", "DÚO translúcido"], ["rollerDuoSunOut", "DÚO Sun Out"]],
  },
  {
    id: "vertical", name: "Persiana vertical", image: vertical, conceptual: true,
    description: "Láminas orientables para dirigir la luz en oficinas y ventanas amplias.",
    variants: [["persianaVertical", "Persiana vertical"]],
  },
  {
    id: "motor", name: "Motorización", image: "/img/motorizacion/4MT-640.jpg", conceptual: true,
    description: "Evalúa el control motorizado de tu sistema. Motor, accesorios y compatibilidad se confirman con asesoría.",
    variantLabel: "Tipo de motorización",
    variants: [["motorizacionIndependiente", "Motorización independiente"], ["motorizacionDual", "Motorización dual"], ["motorizacionIntegrada", "Motorización integrada al producto"]],
  },
  {
    id: "proyectante", name: "Toldo proyectante", image: proyectante, conceptual: true, assisted: true,
    description: "Sombra que se proyecta hacia terrazas y otros espacios exteriores. Requiere evaluación técnica.",
    variants: [["toldoProyectante", "Toldo proyectante"]],
  },
  {
    id: "toldoVertical", name: "Toldo vertical", image: toldoVertical, conceptual: true, assisted: true,
    description: "Protección solar exterior en un plano vertical. Tela y fijaciones se evalúan para cada proyecto.",
    variants: [["toldoVertical", "Toldo vertical"]],
  },
  {
    id: "honeycomb", name: "Plisadas Honeycomb", assisted: true,
    description: "Cortinas de estructura celular. Configuración y valor se definen mediante asesoría.",
    variants: [["honeycomb", "Plisadas Honeycomb"]],
  },
  {
    id: "cristal", name: "Cierre de cristal", image: cristal, assisted: true,
    description: "Cierres para terrazas y balcones, sujetos a revisión de medidas y condiciones de instalación.",
    variants: [["cierreTerraza", "Cierre de cristal"]],
  },
  {
    id: "pergola", name: "Pérgola bioclimática", image: pergola, assisted: true,
    description: "Una solución para espacios exteriores cuyo alcance y factibilidad requieren evaluación técnica.",
    variants: [["pergolaBioclimatica", "Pérgola bioclimática"]],
  },
]

export function getQuoteFamily(productKey) {
  return quoteFamilies.find(family => family.variants.some(([key]) => key === productKey))
}

export function QuoteProductImage({ family, productKey }) {
  const fabricImages = { blackout, darkBlackout: blackout, translucido: translucida }
  const image = fabricImages[productKey] || family.image

  if (!image) return <div className="quote-photo-pending">Fotografía pendiente<br /><strong>{family.name}</strong></div>

  return <img src={image} alt={family.name} loading="lazy" decoding="async" />
}

export default function QuoteProductGallery({ target, onChoose, onClose }) {
  const dialog = useRef(null)
  const visibleFamilies = quoteFamilies.filter(family => !target?.familyId || family.id === target.familyId)

  useEffect(() => {
    if (target) dialog.current.showModal()
    else dialog.current.close()
  }, [target])

  return (
    <dialog ref={dialog} className="quote-gallery-dialog" aria-labelledby="product-gallery-title" onCancel={onClose} onClose={onClose}>
      <header className="quote-gallery-heading">
        <div><p className="quote-step-label">Encuentra tu solución</p><h2 id="product-gallery-title">Elige un producto</h2><p>Después podrás configurar su variante, ambiente y cantidad.</p></div>
        <button type="button" className="quote-outline-button" onClick={onClose}>Cerrar ✕</button>
      </header>
      <div className="quote-gallery-grid">
        {visibleFamilies.map(family => (
          <button type="button" className="quote-gallery-card" key={family.id} onClick={() => onChoose(family.variants[0][0])}>
            <div className="quote-gallery-photo"><QuoteProductImage family={family} /></div>
            <div className="quote-gallery-copy">
              <span className="quote-product-tag">{family.assisted ? "Evaluación técnica" : "Valor estimado en línea"}</span>
              <h3>{family.name}</h3><p>{family.description}</p>
              <span className="quote-gallery-choose">{target?.rowId ? "Elegir producto" : "Añadir producto"} ↗</span>
              {family.conceptual && <small>Imagen conceptual generada con IA.</small>}
            </div>
          </button>
        ))}
      </div>
    </dialog>
  )
}
