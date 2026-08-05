# Estrategia SEO local

## Estado confirmado

El código comunica “2 sucursales activas”; el cotizador identifica `Decosun Iquique` y `Decosun Viña del Mar`, y permite zonas Iquique, II Región, Viña del Mar, Santiago y otras. Home/footer mencionan además Arica, Calama, Tocopilla, Antofagasta, Copiapó, Vallenar, La Serena, V Región, Santiago y Temuco. Estas menciones **no prueban** sucursal, GBP ni capacidad constante. Antes de publicar landings se necesita una matriz operativa aprobada.

## Matriz inicial de decisión

“Demanda” y “oportunidad” son hipótesis cualitativas. “Landing” queda condicionada a cobertura y evidencia.

| Zona | Demanda probable | Oportunidad | Decisión inicial | Contenido único requerido |
|---|---|---|---|---|
| Iquique | Media | Muy alta | P1, candidata inmediata si NAP/GBP activos | Sucursal/equipo, clima/deslumbramiento, comunas, proyectos, fotos, tiempos y contacto local. |
| Alto Hospicio | Baja-media | Media-alta | Integrar en Iquique primero | Cobertura logística, proyectos/testimonios propios; separar solo con masa crítica. |
| Antofagasta | Media-alta | Alta | P1/P2 tras confirmar atención | Casos locales, condiciones solares/viento, modalidad y responsable. |
| Calama | Media | Media-alta | P2 tras evidencia | Minería/oficinas/residencial si son líneas atendidas; logística real. |
| Copiapó | Media | Media | P2/P3 | Proyecto/fotos y cobertura verificable. |
| La Serena | Media-alta | Alta | P1/P2 | Terrazas, departamentos, radiación, equipo y casos. |
| Coquimbo | Media | Alta | Inicialmente landing La Serena-Coquimbo o cobertura relacionada | Evidencia propia suficiente para separar. |
| Viña del Mar | Alta | Muy alta | P1 inmediata si sucursal/GBP | Sucursal, departamentos/terrazas, cierres, comunas, proyectos y NAP. |
| Valparaíso | Media-alta | Alta | P2 | Arquitectura/vanos y cobertura propia, no copia de Viña. |
| Concón | Media-alta | Alta | P2 tras casos | Terrazas, viento/salinidad solo con respaldo técnico, cierres y proyectos. |
| Reñaca | Media | Alta | Integrar en Viña inicialmente | Casos/fotos específicas antes de separar. |
| Quillota | Baja-media | Media | Página regional o cobertura, no landing inicial | Capacidad y proyectos. |
| Quilpué | Media | Media-alta | P2/P3 | Hogares/oficinas, proyecto y contacto. |
| Villa Alemana | Media | Media | Agrupar con interior V Región inicialmente | Contenido y casos propios. |
| Santiago | Alta | Muy alta | P1 solo al confirmar modelo de atención | Comunas atendidas, responsable, plazos, casos, B2B y contacto; competencia requerirá mayor profundidad. |

## Regla anti-doorway

Una ciudad obtiene URL propia solo si cumple al menos cuatro condiciones: atención estable, responsable/contacto, dos o más casos fotografiados, explicación logística/área de servicio, testimonio autorizado o GBP/ubicación real. Si no, se presenta honestamente en `/cobertura/` o en la landing de una sucursal relacionada. Nunca sustituir el nombre de ciudad sobre una plantilla idéntica.

## Estructura local

```text
/cobertura/
├── iquique/
├── vina-del-mar/
├── santiago/             (cuando se valide)
├── antofagasta/          (cuando se valide)
└── la-serena-coquimbo/   (evaluar evidencia y modelo)
```

Cada página: naturaleza de la presencia (sucursal, asesor o cobertura), NAP coherente, áreas/comunas, productos con demanda local, proceso y condiciones de visita, proyectos propios, fotos, preguntas locales, mapa solo si hay ubicación atendible, CTA al asesor correcto y enlaces a productos/casos.

## NAP, GBP y schema

1. Crear fuente maestra de nombre, dirección, teléfono, horario, URL, coordenadas, razón social y área.
2. Auditar consistencia en web, GBP, Apple/Bing y directorios legítimos.
3. Una ficha GBP por ubicación elegible, sin oficinas virtuales; categoría principal y servicios reales.
4. Solicitar reseñas después de hitos reales, sin incentivos; responder con contexto y privacidad.
5. Publicaciones con casos, novedades y consejos locales, no duplicados automáticos.
6. `LocalBusiness` por sede física elegible; `Organization` para marca; `areaServed` para cobertura real. No crear `AggregateRating` propio hasta validar elegibilidad.

## Evidencia necesaria por ciudad

Responsable operativo, frecuencia de visitas, comunas, costos/condiciones, productos disponibles, fotos propias, casos, testimonios, teléfono, dirección si existe, horario, GBP, capacidad mensual y restricciones. Marketing no debe prometer cobertura por encima de operaciones.

## Enlazado

Producto → ciudades con casos; ciudad → productos más relevantes y casos locales; caso → producto y ciudad; cobertura → todas las áreas válidas. Anchors descriptivos (“cortinas roller screen en Iquique”), usados naturalmente y sin repetición forzada.

## KPI local

Impresiones/clics no-branded por ciudad, acciones GBP, llamadas, rutas, formularios, leads orgánicos asignados, tasa de visita a cotización, ventas y margen por zona. Separar sucursal física de área de servicio.
