export const PLEATED_PATH = "/cortinas-plisadas-honeycomb"

export const pleatedOptions = [
  { key: "honeycombBlackout", name: "Plisada blackout", group: "cortina", purpose: "Para oscurecer", description: "Una tela para reducir el paso de luz y favorecer el descanso. El resultado del recinto también depende de los bordes, las guías y el montaje." },
  { key: "honeycombTranslucida", name: "Plisada translúcida", group: "cortina", purpose: "Para luz difusa", description: "Deja pasar luz natural difusa sin permitir vista hacia el exterior. Es una opción para iluminar espacios de uso diario." },
  { key: "honeycombScreen", name: "Plisada screen", group: "cortina", purpose: "Para dejar pasar luz", description: "Deja pasar luz natural difusa e impide ver hacia el exterior a través de la tela. La referencia y el nivel de difusión se confirman con una muestra." },
  { key: "mosquiteroPlisado", name: "Mosquitero plisado", group: "mosquitero", purpose: "Para ventilar con malla", description: "Una malla plegable para ayudar a limitar el paso de insectos mientras la ventana o puerta está abierta. Su ajuste depende del vano y de la instalación." },
  { key: "honeycombBlackoutMosquitero", name: "Plisada blackout + mosquitero", group: "combinado", purpose: "Oscurecimiento y malla", description: "Reúne una tela blackout y una malla mosquitera en una configuración a medida. Permite elegir la función según el momento de uso." },
  { key: "honeycombTranslucidaMosquitero", name: "Plisada translúcida + mosquitero", group: "combinado", purpose: "Luz difusa y malla", description: "Combina una tela translúcida con una malla mosquitera. Se revisan el espacio disponible, el recorrido y la forma de apertura." },
  { key: "honeycombScreenMosquitero", name: "Plisada screen + mosquitero", group: "combinado", purpose: "Luz filtrada y malla", description: "Una alternativa con tela screen y malla mosquitera para evaluar control de luz y ventilación en el mismo proyecto." },
  { key: "honeycombDoble", name: "Plisada doble blackout + screen", group: "doble", purpose: "Dos telas, dos funciones", description: "Combina una tela para oscurecer y otra para filtrar luz. El montaje y el funcionamiento de ambas se confirman según las medidas del vano." },
]

export const pleatedFaqs = [
  ["¿Qué es una cortina plisada Honeycomb?", "Es una cortina con tela de estructura celular, similar a un panal, que se recoge mediante pliegues. En la versión lateral presentada por DecoSun, la tela se desplaza horizontalmente sobre sus guías. La referencia de tela y la configuración se confirman para cada proyecto."],
  ["¿Qué diferencia hay entre blackout, translúcida y screen?", "Blackout se elige para oscurecer. En este sistema plisado, las telas translúcidas y de paso de luz difunden la iluminación natural e impiden ver hacia el exterior a través del tejido. La referencia y el grado de difusión se confirman con muestras."],
  ["¿El mosquitero plisado sirve para oscurecer?", "Su función es incorporar una malla en el vano para ayudar a limitar el paso de insectos durante la ventilación. Para controlar la luz puedes evaluar una configuración que lo combine con una cortina plisada."],
  ["¿Se puede combinar una cortina plisada con mosquitero?", "Sí. Se pueden cotizar configuraciones de cortina plisada más malla mosquitera. Hay que revisar medidas, guías, espacio de recogida y recorrido antes de confirmar la fabricación e instalación."],
  ["¿Cómo se toman las medidas para cotizar?", "Ingresa ancho y alto del espacio a cubrir en metros. Por ejemplo, 150 cm corresponden a 1,50 m. Estas medidas sirven para una estimación inicial. El equipo debe confirmar las medidas de fabricación y las condiciones del vano."],
  ["¿Cómo se calcula el precio de una cortina plisada?", "El valor se obtiene de una tabla según el sistema, el ancho y el alto, con IVA incluido en el precio mostrado. Para medidas intermedias se toma el tramo superior de cada lado, desde el tramo mínimo de 1 × 1 m. Si algún lado supera los 3 m, se solicita evaluación y cotización asistida. La ubicación y los códigos promocionales pueden ajustar el total."],
  ["¿Dónde puedo consultar por este sistema?", "Puedes enviar tu solicitud a DecoSun indicando ciudad y sucursal de gestión, Iquique o Viña del Mar. El equipo confirma disponibilidad, factibilidad técnica y condiciones de instalación para tu ubicación."],
  ["¿Las cortinas Honeycomb se pueden motorizar?", "La compatibilidad depende del sistema, la tela, las dimensiones y los accesorios. Para esta familia se confirma mediante asesoría técnica antes de ofrecer una configuración motorizada."],
]

export function pleatedQuoteLink(productKey) {
  return `/cotizar?producto=${productKey}`
}

export function getPleatedOption(productKey) {
  return pleatedOptions.find(option => option.key === productKey)
}
