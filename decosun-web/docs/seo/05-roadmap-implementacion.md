# Roadmap de implementación SEO

Escala: P0 crítico, P1 muy alto, P2 alto, P3 medio, P4 bajo. Ninguna tarea autoriza cambios financieros, Supabase, permisos o ERP.

| ID | Fase / acción | Justificación y resultado | Prioridad / impacto | Dificultad | Dependencias / riesgos | Archivos probables | Validación |
|---|---|---|---|---|---|---|---|
| SEO-000 | F0: capturar GA4/GSC/GBP, rankings, CWV y leads base | Comparar efecto sin atribución falsa | P0 / muy alto | Media | Accesos y privacidad | GTM/analítica por definir | Snapshot fechado y tablero |
| SEO-001 | F0: rastreo y export de URL/headers | Línea base de indexación | P0 / alto | Baja | Herramienta crawler | Sin cambio | Reporte reproducible |
| SEO-002 | F0: definir dominios, NAP, cobertura y entidades legales | Evita publicar datos/schema erróneos | P0 / muy alto | Media | Decisión empresa | Contenido global | Aprobación escrita |
| SEO-010 | F1: `lang=es-CL`, títulos/descripciones/canonical/OG por ruta | Corrige señales y snippets | P0 / muy alto | Media | Arquitectura SEO | `index.html`, `src/App.jsx`, nuevo módulo SEO | HTML por ruta y validators |
| SEO-011 | F1: robots y sitemap reales | Hace rastreo explícito | P0 / muy alto | Baja | Lista indexable | `public/robots.txt`, `public/sitemap.xml` o generador | HTTP 200, MIME y contenido |
| SEO-012 | F1: noindex en login/panel/estado/agenda/cotizador | Protege superficies no buscables | P0 / muy alto | Media | Política y pruebas auth | routing/headers/SEO module | URL Inspection y HTML/header |
| SEO-013 | F1: 404 real y redirects controlados | Elimina soft 404 | P0 / muy alto | Media | Config Vercel | `vercel.json`, ruta 404 | rutas inventadas = 404 |
| SEO-014 | F1: prerender páginas públicas | Entrega contenido/metadata sin JS | P0 / muy alto | Alta | SEO-010, routing | Vite/config/build | curl sin JS por cada ruta |
| SEO-015 | F1: separar imports internos por ruta | Reduce bundle público | P1 / alto | Media | Regression tests ERP | `src/App.jsx` | chunks y flujo interno |
| SEO-016 | F1: optimizar hero y activos críticos | Mejora LCP/datos móviles | P0 / muy alto | Media | Pipeline imágenes | Home/assets | Lighthouse + inspección visual |
| SEO-017 | F1: política de privacidad/cookies y formularios | Confianza y medición responsable | P1 / alto | Media | Revisión legal | Footer/rutas/forms | Legal y QA |
| SEO-020 | F2: metadata y on-page de 4 páginas actuales | Quick win de relevancia | P1 / alto | Baja-media | SEO-010 | Home/Soluciones/Proyectos/Nosotros | checklist on-page |
| SEO-021 | F2: footer NAP/contacto/políticas | Local y confianza | P1 / alto | Baja | SEO-002 | `Footer.jsx` | consistencia NAP |
| SEO-022 | F2: eventos cotizador/agenda/WhatsApp/teléfono | Atribución comercial | P0 / muy alto | Media | Consentimiento y GTM | componentes públicos | DebugView y pruebas |
| SEO-023 | F2: lazy loading, dimensiones, srcset | Rendimiento y CLS | P1 / alto | Media | Inventario activos | páginas públicas | CWV laboratorio |
| SEO-024 | F2: corregir enlaces/anchors y acceso interno en menú | Arquitectura y UX | P2 / medio-alto | Baja | Navegación aprobada | Navbar/Footer/pages | crawl y móvil |
| SEO-030 | F3: crear hubs/jerarquía/breadcrumbs | Escala sin canibalización | P1 / muy alto | Alta | Keyword validation | routing + nuevas páginas | crawl, schema, UX |
| SEO-031 | F3: plantilla SEO reutilizable | Calidad consistente | P1 / alto | Media | Diseño/contenido | componentes | pruebas unitarias/snapshots |
| SEO-032 | F3: plantilla de casos y guías | Autoridad escalable | P2 / alto | Media-alta | Flujo editorial | nuevas rutas/datos | validación editorial |
| SEO-040 | F4: Screen, Blackout, DÚO y Roller hub | Intenciones de mayor valor | P1 / muy alto | Alta | Fotos/especificaciones | nuevas páginas | GSC, conversión |
| SEO-041 | F4: Toldos, cierres cristal y pérgolas | Terrazas y ticket alto | P1 / muy alto | Alta | Oferta/casos reales | nuevas páginas | leads por landing |
| SEO-042 | F4: Translúcidas, persianas, PVC, motorización | Cobertura de catálogo | P2 / alto | Alta | Validación oferta | nuevas páginas | contenido no duplicado |
| SEO-043 | F4: páginas B2B | Constructoras/oficinas/instituciones | P1 / muy alto | Alta | Evidencia/capacidad | `/para/*` | leads calificados |
| SEO-050 | F5: hub cobertura + Iquique/Viña | Aprovecha presencia confirmable | P1 / muy alto | Alta | NAP/GBP/casos | cobertura/pages/schema | QA local/GBP |
| SEO-051 | F5: evaluar Santiago/Antofagasta/La Serena | Expansión sin doorway | P2 / alto | Media | Matriz operativa | futuras landings | gate de evidencia |
| SEO-052 | F5: programa de reseñas | Confianza local sostenible | P2 / alto | Media | CRM/proceso | fuera de repo + enlaces | tasa y política |
| SEO-060 | F6: guía medición, screen vs blackout y precios | Captura demanda comercial | P1 / alto | Media | Expertos/autores | `/guias/*` | rankings asistidos/leads |
| SEO-061 | F6: cuatro casos reales iniciales | Prueba y long tail local | P1 / muy alto | Media | Consentimiento/fotos | `/proyectos/*` | engagement/conversión |
| SEO-062 | F6: calendario editorial trimestral | Autoridad continua | P2 / medio-alto | Media | GSC | flujo editorial | revisión trimestral |
| SEO-070 | F7: equipo, garantías, proceso y autoría | E-E-A-T | P1 / alto | Media | Datos empresa/legal | Nosotros/subpáginas | checklist confianza |
| SEO-071 | F7: alianzas y menciones legítimas | Autoridad externa | P2 / alto | Alta | Relaciones | Fuera del repo | enlaces relevantes |
| SEO-072 | F7: activos enlazables técnicos | Backlinks y leads B2B | P2 / alto | Alta | Especialistas | guías/PDF accesible | descargas/leads/enlaces |
| SEO-080 | F8: selector de cortina | Resuelve elección y alimenta cotizador | P2 / alto | Alta | Catálogo/reglas | nueva herramienta | completitud→lead |
| SEO-081 | F8: guía/calculadora de medidas | Tráfico útil y menos fricción | P1 / alto | Media | Reglas de medición | herramienta | errores y conversión |
| SEO-082 | F8: comparador screen-blackout | Intención comparativa | P2 / alto | Media | Datos técnicos | herramienta/guía | uso y CTA |
| SEO-083 | F8: biblioteca de telas/fichas | Valor B2B/B2C | P2 / alto | Alta | Datos/licencias | catálogo | indexación/descargas |
| SEO-090 | F9: decidir continuidad Vite vs framework SSG | Escalar con evidencia | P3 / medio | Alta | 30+ páginas, CMS, costes | arquitectura | ADR y prototipo |
| SEO-091 | F9: expansión geográfica por gates | Crecer sin doorway | P2 / alto | Continua | SEO local | cobertura | calidad y rentabilidad |
| SEO-092 | F9: ciclo mensual de poda/actualización | Evita deuda y canibalización | P2 / alto | Continua | Dashboard | contenido/redirects | auditoría trimestral |

## Secuencia y gates

No publicar nuevas landings antes de SEO-000, 002, 010-014 y 022. No publicar páginas locales antes de aprobar cobertura. No añadir `Review`, precios u ofertas al schema sin datos visibles y elegibles. Cada fase debe terminar con build, lint de archivos tocados, crawl, HTML sin JS, móvil, formulario, auth/ERP smoke tests y comparación de métricas.

## Herramientas SEO priorizadas

| Herramienta | Problema / público | SEO y negocio | Complejidad / datos | Integración / prioridad |
|---|---|---|---|---|
| Guía-calculadora de medidas | Medición / B2C | Enlaces y long tail; cotizaciones completas | Media; reglas por producto | Precarga cotizador / P1 |
| Selector según ambiente | Elección / B2C/B2B | Clúster de necesidades; lead guiado | Alta; matriz producto-uso | Resultado a cotizador / P2 |
| Comparador screen-blackout | Confusión / B2C | Comparativas; reduce mala elección | Media; especificaciones | CTA producto/cotizador / P2 |
| Simulador transparencia/privacidad | Expectativas / B2C | Visual y enlazable; califica lead | Alta; fotos controladas y disclaimers | Guardar preferencia / P3 |
| Estimador de precio | Presupuesto / B2C | Alta intención; filtra leads | Alta; precios, zonas y vigencia | Reusar reglas sin exponer ERP / P2 |
| Biblioteca de telas | Especificación / B2B/B2C | Long tail y confianza | Alta; fichas/licencias/muestras | Selección en cotizador / P2 |
| Recursos arquitectos | Especificación / B2B | Enlaces y leads de proyecto | Media-alta; CAD/PDF/fichas | Formulario B2B / P1 |

## Autoridad ética

Casos cocreados con arquitectos/constructoras, páginas de distribuidores de fabricantes, asociaciones/cámaras legítimas, medios regionales por proyectos reales, recursos técnicos citables, universidades cuando exista colaboración, YouTube con demostraciones y perfiles sociales que distribuyan activos. Prohibido comprar paquetes, granjas, PBN, directorios indiscriminados o automatizar contenido sin revisión experta.
