# Plan de medición y KPI

## Línea base antes de cambios

Ventana recomendada: 28 días y comparación interanual cuando exista. Exportar GSC por página/consulta/país/dispositivo; GA4 por landing/canal/evento; GBP por ubicación; CWV de campo; crawl; respuestas HTTP; leads y ventas del ERP con identificador de origen, sin alterar tablas hasta diseñar privacidad y migración.

## Stack

- GSC para dominio, sitemaps, indexación, consultas, CTR y CWV.
- GA4, preferentemente desplegado mediante GTM con consentimiento conforme a revisión legal.
- Bing Webmaster Tools y sitemap.
- Vercel Analytics/logs si están autorizados; no sustituyen GA4/GSC.
- Looker Studio o BI existente para tablero mensual.
- Monitor de URLs críticas, sitemap, robots, canonical y 404.

No se encontró implementación de estas herramientas en el código auditado.

## Taxonomía de eventos

| Evento | Cuándo | Parámetros no sensibles |
|---|---|---|
| `generate_lead` | Envío confirmado de agenda/contacto | `form_type`, `landing_path`, `product_interest`, `service_area` normalizada |
| `quote_start` | Primera interacción útil con cotizador | `landing_path`, `branch` |
| `quote_step_complete` | Paso válido | `step_name`, `product_type` |
| `quote_submit` | Guardado confirmado | `product_count`, `branch`, `service_area`; nunca nombre/teléfono |
| `whatsapp_click` | Click/acción de WhatsApp | `placement`, `landing_path`, `branch` |
| `phone_click` | Click `tel:` | `placement`, `landing_path` |
| `appointment_submit` | Agenda guardada | `service_area`, `landing_path` |
| `form_error` | Error de validación/técnico | `form_type`, `field_group`, `error_type`; sin valores |
| `case_view` | Vista de caso relevante | `case_slug`, `product`, `city` |
| `resource_download` | Descarga | `resource_name`, `audience` |

Éxito debe dispararse solo después de confirmación real, no al click del botón. Usar UTMs y conservar landing/referrer en el traspaso al sistema comercial de forma compatible con privacidad.

## KPI

| Grupo | KPI principal | Fuente / frecuencia |
|---|---|---|
| Técnico | URLs indexables válidas, soft 404, canonical, sitemap, CWV pass rate, LCP/INP/CLS | GSC/crawl/CrUX mensual |
| Posicionamiento | Clics, impresiones, CTR y posición por clúster (no solo promedio global) | GSC mensual |
| Contenido | Entradas orgánicas, consultas nuevas, scroll útil, CTA, asistencias y actualización | GSC/GA4 mensual-trimestral |
| Local | Visibilidad/consultas por ciudad, acciones GBP, llamadas, rutas, leads | GSC/GBP/CRM mensual |
| Comercial | Leads orgánicos válidos, cotizaciones, visitas, ventas, ingreso y margen atribuible | GA4 + ERP/CRM mensual |
| Conversión | CVR orgánica por landing/dispositivo, quote start→submit, formulario error/abandono | GA4 mensual |
| Autoridad | Dominios relevantes, menciones, enlaces a casos/recursos, calidad/referral | Herramienta SEO trimestral |

## Tablero mensual

1. Resumen ejecutivo: leads, ventas, ingreso, CVR y cambio versus base.
2. Salud técnica: indexación, errores, CWV, releases.
3. Clústeres: producto, B2B, local, contenido.
4. Landings: clics, CTR, conversiones y oportunidad.
5. Local: sede/área, GBP y pipeline.
6. Contenidos publicados/actualizados y contribución.
7. Autoridad: enlaces/menciones ganados y perdidos.
8. Experimentos: hipótesis, resultado y decisión.
9. Acciones del mes siguiente con dueño y fecha.

## Atribución

Reportar first-touch orgánico, last non-direct y conversiones asistidas; no adjudicar toda venta al último click. Vincular lead a cotización/venta mediante un ID no sensible. Definir ventanas por ciclo comercial. Conciliar mensualmente GA4 con el ERP, documentando pérdidas por cookies, dispositivos o WhatsApp.

## Alertas

- Robots/sitemap dejan de devolver formato correcto.
- Página crítica cambia a noindex, pierde canonical o devuelve no-200.
- Caída >30% semanal de clics orgánicos no explicada.
- Pico de 404/5xx.
- Conversión o `quote_submit` cae tras despliegue.
- CWV crítico empeora.

Los umbrales deben recalibrarse después de 8-12 semanas de datos.

## QA de medición

GTM Preview, GA4 DebugView, consentimiento aceptado/rechazado, exclusión de PII, cross-domain si aplica, deduplicación de eventos, prueba móvil/escritorio, WhatsApp/teléfono, formulario exitoso/fallido, cotizador completo y reconciliación con un lead de prueba identificado.
