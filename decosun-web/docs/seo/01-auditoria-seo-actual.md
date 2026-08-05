# Auditoría SEO actual — DecoSun

Fecha: 29-07-2026  
Alcance: código y producción pública de `decosun.cl`. No se modificó código, datos ni infraestructura.

## Resumen ejecutivo

La web tiene contenido comercial real, fotografías propias, productos definidos y dos mecanismos de conversión potentes (`/cotizar` y `/agenda`). Sin embargo, hoy la capa SEO es esencialmente la de una plantilla Vite: todas las URL entregan un HTML inicial vacío, en inglés, con el título `decosun-web`; no hay metadatos por ruta, canonical, robots, sitemap, schema ni 404 HTTP real. Google puede ejecutar JavaScript, pero debe descubrir y procesar una SPA pesada antes de ver el contenido.

La mayor prioridad no es migrar de framework: es separar explícitamente la superficie pública indexable de las rutas operativas, crear respuestas HTTP correctas y prerenderizar las páginas comerciales. El ERP, cotizador, agenda y estado de proyectos deben conservar su comportamiento; login, panel, cotizador transaccional, agenda y estados con token deben ser `noindex`.

## Método y límites

**Confirmado:** lectura de rutas/componentes/configuración; búsquedas de metadatos, enlaces, schemas y analítica; inventario de activos; hash de duplicados; build y lint; solicitudes HTTP a producción.

**No medido:** CWV de campo, Lighthouse, rankings, demanda, backlinks, GA4/GSC, leads y ventas. Requieren herramientas externas o acceso de empresa.

## Inventario de rutas

| URL | Página / componente / archivo | Tipo | Acceso | Indexación recomendada | Objetivo / keyword probable | Estado, problema y recomendación |
|---|---|---|---|---|---|---|
| `/` | Home / `Home` / `src/pages/Home.jsx` | Comercial | Pública | Sí | Control solar y cortinas en Chile | Contenido amplio pero HTML inicial vacío, título genérico, H1 poco específico y siete imágenes hero cargadas. Prerender, metadata propia, optimizar hero y enlazar landings. |
| `/soluciones` | Soluciones / `Soluciones` / `src/pages/Soluciones.jsx` | Hub comercial | Pública | Sí | Cortinas roller, persianas, toldos y pérgolas | Una URL concentra múltiples intenciones y favorece canibalización futura. Mantener como hub y crear URLs de producto. |
| `/proyectos` | Proyectos / `Proyectos` / `src/pages/Proyectos.jsx` | Portafolio | Pública | Sí | Proyectos de cortinas y control solar | Casos genéricos, sin ciudad, cliente, fecha, ficha individual ni breadcrumbs. Convertir casos reales en páginas verificables. |
| `/nosotros` | Nosotros / `Nosotros` / `src/pages/Nosotros.jsx` | Marca/E-E-A-T | Pública | Sí | Empresa de cortinas y control solar | Buen proceso, pero destaca el portal interno y no contiene NAP, equipo, razones sociales, garantías verificables ni historia concreta. |
| `/cotizar` | Cotizador / `Cotizar` / `src/pages/Cotizar.jsx` | Aplicación transaccional | Pública | **No**; crear landing indexable separada | Cotizar cortinas roller | Es una app de 1.113 líneas que escribe proyectos/mediciones en Supabase y envía EmailJS/WhatsApp. No usarla como landing SEO; `noindex,follow`, proteger cambios y enlazarla desde landings. |
| `/agenda` | Agenda / `Agenda` / `src/pages/Agenda.jsx` | Formulario transaccional | Pública | **No** | Agendar visita cortinas | Guarda en Supabase. `noindex,follow`; medir envío y crear contexto comercial en páginas indexables. |
| `/estado/:token` | Estado público / `ProjectStatusPublic` / `src/pages/ProjectStatusPublic.jsx` | Consulta con token | Pública no enlazada | **Noindex, nofollow** | Sin objetivo SEO | Datos de proyecto obtenidos por token. Excluir de sitemap, meta/HTTP `noindex`, minimizar exposición y conservar seguridad/RLS. |
| `/login` | Login / `Login` / `src/pages/Login.jsx` | Autenticación | Pública | **Noindex, nofollow** | Sin objetivo SEO | Aparece en navegación comercial y comparte metadata genérica. Retirar del menú principal o relegar al footer; `noindex`. |
| `/panel` | Dashboard / `Dashboard` / `src/pages/Dashboard.jsx` | ERP | Privada por lógica cliente | **Noindex, nofollow** | Sin objetivo SEO | Lazy-loaded, pero no existe bloqueo SEO/HTTP. Mantener fuera del sitemap; no tocar lógica; revisar protección servidor/RLS aparte. |
| `/panel/academy` | Academy / `Academy` / `src/pages/Academy.jsx` | Interna | Privada | **Noindex, nofollow** | Sin objetivo SEO | Lazy-loaded; aplicar política global a `/panel/*`. |
| `/panel/academy/comercial` | Academy Comercial / `AcademyCommercial` / `src/pages/AcademyCommercial.jsx` | Interna | Privada | **Noindex, nofollow** | Sin objetivo SEO | Igual que anterior. |
| `/panel/mercado-publico` | Mercado Público / `MercadoPublico` / `src/pages/MercadoPublico.jsx` | Interna | Riesgo: ruta directa sin guard visible en `App.jsx` | **Noindex, nofollow** | Sin objetivo SEO | Importación eager y ruta fuera del wrapper protegido. Revisar autorización sin alterar negocio; nunca indexar. |
| `/panel/radar-compra-agil` | Radar / `RadarCompraAgil` / `src/pages/RadarCompraAgil.jsx` | Interna | Riesgo: ruta directa sin guard visible en `App.jsx` | **Noindex, nofollow** | Sin objetivo SEO | Mismo riesgo y además contribuye al bundle inicial. Lazy-load y guard tras validación funcional. |
| Cualquier otra | Sin componente 404 | Soft 404 | Pública | No | Ninguno | Vercel reescribe todo a `/`; producción devuelve 200 con la SPA. Crear 404 real/estrategia compatible con hosting. |

`AgendaPanel`, `PurchaseRequests`, `Treasury` y `Panel.jsx` existen en el repositorio, pero no tienen rutas directas en `App.jsx`; son componentes internos u obsoletos. `AgendaPanel copy.jsx` es una copia sin ruta y debe revisarse como deuda, no eliminarse en la fase SEO.

## Hallazgos técnicos priorizados

| ID | Hallazgo y evidencia | Impacto SEO / comercial | Prioridad | Dificultad / riesgo | Solución |
|---|---|---|---|---|---|
| T01 | `index.html:2` usa `lang="en"`; `index.html:7` usa `decosun-web`. Producción entrega lo mismo. | Señales lingüísticas y snippets incorrectos; marca poco profesional. | P0 | Baja / baja | `es-CL`, título base correcto y metadata por ruta. |
| T02 | `index.html` solo contiene `<div id="root"></div>`; contenido depende de JS. | Descubrimiento/renderizado más lento y previews pobres. | P0 | Media / media | Prerender de páginas comerciales; verificar HTML generado. |
| T03 | No hay `robots.txt` ni `sitemap.xml`; producción responde HTML 200 para ambos. | Rastreo no dirigido; sitemap inválido. | P0 | Baja / baja | Archivos estáticos válidos y pruebas de MIME/contenido. |
| T04 | `vercel.json` reescribe `/(.*)` a `/`; URL inventada responde 200. | Soft 404, desperdicio de rastreo, indexación de URLs basura. | P0 | Media / media | Rewrites acotados y respuesta 404; preservar rutas SPA necesarias. |
| T05 | No se encontró canonical, meta robots, description, OG, Twitter o JSON-LD. | Duplicados, snippets pobres y falta de resultados enriquecidos. | P0 | Media / baja | Componente SEO central más prerender; datos reales solamente. |
| T06 | Login, panel, estado por token, agenda y cotizador no declaran `noindex`; `/panel/mercado-publico` y radar están expuestos como rutas directas. | Riesgo de indexación y exposición de superficies internas. | P0 | Media / alta | Política de indexación + cabeceras; auditar auth/RLS por separado. |
| T07 | Bundle inicial 670,91 kB minificado/192,50 kB gzip; Vite advierte >500 kB. Varias páginas internas son imports eager en `App.jsx:13-17`. | INP/LCP móvil y conversión potencialmente peores. | P1 | Media / media | Lazy-load por ruta, separar Supabase/ERP, medir antes/después. |
| T08 | Activos: 65 archivos, 110,85 MB; JPG 64,04 MB, PNG 27,96 MB, vídeo 10,08 MB. Hero carga siete `<img>` sin `loading`, tamaños ni `srcset`. | LCP, ancho de banda, CLS y datos móviles. | P0 | Media / baja | AVIF/WebP responsive, un hero prioritario, dimensiones, lazy-load bajo el pliegue. |
| T09 | No hay route-level 404 ni redirects semánticos/canonical host en repo; dominio raíz sí redirige a `www`. | Soft 404 y posibles inconsistencias futuras. | P1 | Media / media | Matriz de redirects, host canónico `https://www.decosun.cl`, tests. |
| T10 | Sin breadcrumbs, schemas ni páginas individuales de producto/caso. | Arquitectura débil y baja cobertura de intenciones. | P1 | Alta / baja | Hub + landings + casos, enlazado y schema elegible. |
| T11 | Footer no presenta NAP, email, teléfono, direcciones ni políticas; WhatsApp usa un número fijo. | Confianza, SEO local y conversión limitados. | P1 | Baja / riesgo de datos incorrectos | Publicar datos validados por sucursal y políticas. |
| T12 | No se encontraron GA4, GTM, GSC, Bing ni eventos. | Imposible atribuir SEO a leads/ventas. | P0 | Media / privacidad | Línea base y plan de medición antes de cambios. |
| T13 | Lint: 17 errores y 5 warnings; build sí finaliza. | Deuda que eleva riesgo de cambios SEO. | P2 | Media / media | Corregir incrementalmente, sin mezclar con lógica financiera. |
| T14 | Tres pares de imágenes son binariamente duplicados; hay HEIC y nombres inconsistentes. | Peso/mantenibilidad y compatibilidad. | P2 | Baja / baja | Consolidar solo tras verificar imports; pipeline de activos. |
| T15 | `Home.jsx` consulta `public_site_activity` en cliente. | Dependencia de red para evidencia social y posible dato cero/error. | P2 | Media / media | Cache/fallback estable y verificación de privacidad; no inventar cifras. |

## Renderizado React/Vite

### Alternativas

| Alternativa | Resuelve | Beneficio | Esfuerzo / riesgo | Decisión |
|---|---|---|---|---|
| SPA sin prerender + metadata cliente | Snippets básicos tras JS | Bajo; Google aún debe renderizar | Bajo / persisten HTML vacío y soft 404 | Insuficiente como estado final. |
| SPA + prerender de rutas públicas | HTML, metadata y contenido por URL | Alto con cambio acotado | Medio / cuidar cotizador y Supabase | **Recomendada ahora.** |
| SSG estático para nuevas landings + SPA para apps | Separación comercial/operativa | Muy alto y escalable | Medio-alto / routing y despliegue | Objetivo de arquitectura 2026-27. |
| Migración total a framework SSR/SSG | HTTP dinámico, SSG/SSR integrado | Alto a largo plazo | Alto / riesgo ERP, auth y regresiones | Evaluar después de landings y medición; no necesaria hoy. |

React Helmet puede centralizar metadatos cliente, pero por sí solo no corrige el HTML inicial, sitemap, 404 ni respuestas HTTP. Si se adopta, debe complementarse con prerender/SSG.

## On-page actual y propuesta inmediata

| Ruta | Keyword / intención | Title recomendado | Meta description | H1 recomendado | H2, enlaces, CTA y schema |
|---|---|---|---|---|---|
| `/` | soluciones de control solar Chile / comercial | `Control solar, cortinas y terrazas en Chile | DecoSun` | `Diseño, fabricación e instalación de cortinas roller, persianas, toldos, pérgolas y cierres de terraza. Agenda asesoría con DecoSun.` | `Control solar y soluciones para ventanas y terrazas` | H2 por familias, proceso, cobertura verificable y casos. Enlaces a productos/ciudades. CTA cotizar y agendar. `Organization`, `WebSite`, `WebPage`. |
| `/soluciones` | cortinas, persianas y toldos / exploración comercial | `Cortinas roller, persianas, toldos y pérgolas | DecoSun` | `Compara soluciones DecoSun para controlar luz, privacidad y temperatura en hogares, oficinas y terrazas.` | `Soluciones de control solar para cada espacio` | H2 Cortinas, Persianas, Exterior, Automatización, Cómo elegir, FAQ. Enlaces a cada landing. `CollectionPage`, breadcrumbs. |
| `/proyectos` | proyectos de cortinas / prueba comercial | `Proyectos de cortinas y control solar | DecoSun Chile` | `Conoce proyectos reales de cortinas roller, toldos y soluciones para oficinas, hogares y terrazas ejecutados por DecoSun.` | `Proyectos de control solar ejecutados por DecoSun` | Filtros no indexables, fichas reales, ciudad/producto/resultado. CTA solicitar proyecto similar. `CollectionPage`; no `Review` sin reseña real. |
| `/nosotros` | empresa control solar / marca-confianza | `Sobre DecoSun | Experiencia en control solar en Chile` | `Conoce la experiencia, proceso, cobertura y equipo detrás de las soluciones de control solar e instalación de DecoSun.` | `DecoSun: experiencia técnica en control solar` | Historia, equipo, sucursales, proceso, garantías y contacto verificables. `AboutPage`, `Organization`, `LocalBusiness` donde corresponda. |

`/cotizar` y `/agenda` deben recibir títulos funcionales y `noindex`; no necesitan competir por keywords. `/estado/:token`, `/login` y `/panel/*` deben usar títulos neutros y `noindex,nofollow`.

## Multimedia

- Convertir fotografías grandes a AVIF con WebP/JPEG fallback; conservar originales fuera del payload público.
- Usar SVG para logos/íconos geométricos, no para fotografías.
- El hero necesita una imagen móvil y otra de escritorio con `srcset`, `sizes`, dimensiones y prioridad solo en la primera.
- Todas las imágenes bajo el pliegue: `loading="lazy"` y `decoding="async"`; reservar espacio con `width`/`height` o `aspect-ratio`.
- El vídeo de 10,08 MB debe usar poster optimizado, carga bajo interacción y formatos probados; agregar transcripción si se publica como contenido.
- Duplicados confirmados: `black-out05.jpg`/`roller-blackout-dormitorio.jpg`; `home-sunscreen-terraza.jpg`/`terraza-02.jpg`; `pergola-04.png`/`pergola-premium.png`.
- HEIC no debe servirse directamente; convertir a AVIF/WebP/JPEG compatible.

## Datos estructurados

| Schema | Dónde | Datos disponibles / faltantes | Riesgo |
|---|---|---|---|
| `Organization` | Home/Nosotros | Marca y sitio; faltan razón social elegida, logo canónico, contactos, perfiles y políticas | No mezclar entidades legales sin validación. |
| `LocalBusiness` | Página de cada sucursal real | Iquique y Viña aparecen en cotizador; faltan NAP, horario, coordenadas, URL GBP y cobertura confirmada | No crear sucursales ficticias ni usar área nacional sin capacidad. |
| `WebSite`, `WebPage` | Home y páginas públicas | URL/nombre disponibles | No declarar `SearchAction` sin buscador. |
| `BreadcrumbList` | Productos, soluciones, casos, ciudades | Jerarquía futura | Debe coincidir con navegación visible. |
| `Service` | Landings de servicios | Producto/área; faltan proveedor y cobertura validados | No confundir con `Product` si no hay oferta concreta. |
| `Product` + `Offer` | Solo fichas con producto/precio real | Cotizador contiene rangos internos, no una oferta pública estable | No publicar precio/stock ficticio. |
| `FAQPage` | FAQs visibles | Preguntas futuras | Google limita resultados; contenido debe ser visible y propio. |
| `Article`/`BlogPosting` | Guías firmadas | Falta sistema editorial, autor, fechas | No usar en páginas comerciales. |
| `ImageObject`/`VideoObject` | Casos y vídeo con página propia | Activos existen; faltan licencia/caption/thumbnail/transcripción | Datos deben corresponder al archivo real. |
| `Review`/`AggregateRating` | Solo reseñas elegibles y visibles | No se encontraron datos | No implementar hasta contar con evidencia y cumplir políticas. |

Ejemplo orientativo para Home, con marcadores que **deben** reemplazarse por datos aprobados:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.decosun.cl/#organization",
  "name": "DecoSun",
  "url": "https://www.decosun.cl/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://www.decosun.cl/RUTA-LOGO-CANONICO"
  },
  "contactPoint": [{
    "@type": "ContactPoint",
    "telephone": "TELEFONO-VALIDADO",
    "contactType": "sales",
    "areaServed": "CL",
    "availableLanguage": "es"
  }]
}
```

No debe publicarse con marcadores. Los schemas de página deben referenciar el mismo `@id`; `LocalBusiness` tendrá NAP propio por sede real.

## Conversión y UX

**Fortalezas confirmadas:** CTA a cotizar repetido, botón WhatsApp persistente, agenda funcional, cotizador con productos/medidas/ubicación y contenido de proceso/confianza.

**Fricciones confirmadas o probables:**

- El menú asigna el mismo nivel a Cotizador, Agenda y Acceso equipo, debilitando la jerarquía comercial.
- `/cotizar` contiene un flujo extenso y técnico; necesita instrumentación por pasos, progreso, errores y abandono antes de rediseñarlo.
- El WhatsApp global siempre usa el mismo teléfono/mensaje; confirmar enrutamiento por sucursal y medir `placement`.
- Footer sin contacto, políticas, garantías ni NAP visible.
- Home abre un modal de vídeo basado en `sessionStorage`; puede competir con el hero/CTA y afectar móvil. Medir apertura, cierre y conversión antes de decidir.
- Proyectos no aporta ciudad, métricas, testimonios o detalle que reduzca riesgo percibido.
- No hay enlaces `tel:` o `mailto:` comerciales públicos detectados en la navegación/footer.

Recomendación: mantener identidad, simplificar jerarquía, añadir señales verificables, instrumentar el funnel y ejecutar pruebas pequeñas. No cambiar reglas, precios ni persistencia del cotizador desde SEO.

## Competencia: metodología y plantilla

No se encontraron nombres de competidores en el repositorio y no se realizó una SERP competitiva reproducible con herramienta SEO; por tanto, no se inventan competidores, tráfico ni autoridad.

Proceso posterior:

1. Exportar de GSC consultas no branded y seleccionar 20-30 por clúster/ciudad.
2. Registrar dominios que aparecen orgánicamente y en mapa en ventana incógnita/localización documentada.
3. Medir con la misma herramienta y fecha.
4. Separar competidores comerciales, editoriales, marketplaces y directorios.
5. Convertir brechas en backlog, no copiar contenido.

| Dominio | Tipo | Clúster/ciudad | Arquitectura/landings | Calidad y evidencia | Backlinks/autoridad | CWV/móvil | Local/GBP | Confianza/CRO | Brecha/acción |
|---|---|---|---|---|---|---|---|---|---|
| Por recopilar | Comercial/editorial | Consulta observada | URLs y profundidad | Casos, autores, fichas | Dominios relevantes, no solo total | CrUX/PSI | Ubicaciones/reseñas | CTA, NAP, garantías | Evidencia y prioridad |

Métricas: share of voice por clúster, URLs posicionadas, intención, profundidad, contenido único, dominios de referencia relevantes, enlaces ganados, CWV, número/calidad de casos, páginas locales válidas, rating/reseñas con fecha, pasos de conversión y propuesta de valor.

## Riesgos que no deben tocarse en SEO

- Tablas, RPC y lógica de precios/guardado en `Cotizar.jsx`.
- RLS, funciones y migraciones Supabase.
- Autorización, permisos, tesorería, comisiones, agenda interna y Mercado Público.
- Tokens y datos mostrados por `ProjectStatusPublic.jsx`.
- Cambios visuales radicales. La optimización debe conservar diseño y flujos.

## Validación externa pendiente

PageSpeed/Lighthouse móvil y escritorio en cinco plantillas; GSC (cobertura, consultas, sitemaps, CWV); GA4/GTM; logs de Vercel; Rich Results Test; GBP de cada ubicación; rastreo completo con crawler; backlinks y competidores con herramientas autorizadas.
