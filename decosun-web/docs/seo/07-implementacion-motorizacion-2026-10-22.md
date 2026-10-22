# Primera etapa implementada — 22 de octubre de 2026

## Alcance acordado

Motorización como primera prioridad comercial. Después, confección a medida de roller blackout, sunscreen y dúo, persianas verticales, mantención de roller y limpieza de telas sunscreen.

Cobertura confirmada por el negocio:

- Iquique: tienda física con atención al público.
- Región de Valparaíso: taller/fábrica sin atención al público; encargado radicado en Valparaíso y atención en terreno coordinada.
- Santiago: fábrica principal, soporte regional y licitaciones públicas; no se afirma atención al público.
- Arica, Copiapó, Vallenar, La Serena, Concepción y Temuco: técnicos certificados por DecoSun, mediante formación propia y pruebas en terreno, con respaldo continuo.
- Garantía de cortinas y motores suministrados por DecoSun: 5 años; instalación: 1 año. Mismos plazos por ciudad. No se denomina garantía extendida. Motorizar una cortina existente no le agrega una garantía nueva a esa cortina.

## Cambios

- Registro central de títulos, descripciones, canonical y datos estructurados de organización/servicios. Sin direcciones, horarios, reseñas, precios ni acreditaciones externas inventadas.
- HTML comercial generado al construir para inicio, soluciones, motorización, mantención, proyectos, nosotros y garantía; renderizado de componentes reales con React/Vite, sin ejecutar efectos o consultas de clientes.
- El cliente React conserva su montaje existente; no se cambia la autenticación ni los módulos operativos.
- `robots.txt` público y sitemap generado desde el registro de páginas. Solo se incluyen páginas comerciales.
- Vercel sirve el HTML por ruta, conserva cotizador, agenda, login, panel y estados como aplicación separada con `noindex`, y devuelve HTTP 404 para rutas inexistentes.
- `noindex` no reemplaza la autenticación ni los permisos del sistema.
- Portada orientada a motorización; tarjetas ordenadas según prioridades comerciales y enlaces a secciones identificables de soluciones.
- Motorización con respuestas sobre compatibilidad, nuevas cortinas, conectividad, cobertura y garantía.
- Garantía y cobertura compartidas en inicio, motorización, mantención, nosotros y página de garantía/postventa. Footer actualizado.
- La portada ya no abre automáticamente la promoción. La imagen principal usa un archivo existente de motorización de unos 123 KB, en vez de cargar las siete imágenes del carrusel anterior.
- Variantes optimizadas de logo, blackout, dúo y fotografía de tienda; originales conservados. Tamaños aproximados: 33, 98, 90 y 210 KB.
- Dependencias Supabase 2.105.4 y EmailJS 4.4.1 declaradas e instaladas en el propio proyecto, conservando las versiones que ya se usaban desde la carpeta superior. Lockfile actualizado.
- Actividad operativa no se incluye en HTML estático; en cliente solo aparece tras una consulta válida. Se aclara que los trabajos finalizados corresponden a los últimos 30 días.

## Verificación

- Compilación de cliente y HTML estático completada.
- ESLint de los archivos React/JS intervenidos aprobado.
- Pruebas `test:seo` aprobadas: HTML con encabezado principal, títulos únicos, canonical, schema y archivos locales existentes; cobertura y garantía; navegación de productos; respuestas HTTP de páginas, robots, sitemap, rutas de aplicación y 404.
- Pruebas HTTP locales ejercitan las reglas de `vercel.json` con un servidor de vista previa; no equivalen a una comprobación en Vercel publicado.
- El navegador integrado no pudo conectarse al servidor de vista previa local. Queda pendiente revisión visual e interacción de escritorio/móvil y flujos autenticados antes de publicar. No se realizaron envíos de cotizaciones ni cambios en Supabase.
- Continúa el aviso de Vite sobre un paquete JavaScript principal superior a 500 KB. Su reducción requiere una etapa adicional.
- `npm audit` reportó 12 alertas (8 altas, 3 moderadas y 1 baja), incluyendo Vite y React Router. No se aplicaron actualizaciones masivas de dependencias; requieren revisión y pruebas antes de publicar. Este resultado no establece por sí solo la exposición de producción ni qué alertas precedían a esta intervención.
- No se publicó ni se creó un commit.

## Uso

```text
npm run build
npm run test:seo
npm run preview
```

La construcción debe usar `npm run build`, no directamente `vite build`, para generar las páginas y el sitemap. `vercel.json` fija ese comando. La vista previa usa por defecto `http://127.0.0.1:4173` y reproduce las reglas estáticas del proyecto.

## Pendiente

1. Revisión visual y funcional; despliegue de vista previa y validación real de respuestas y metadatos antes de publicar en producción.
2. Confirmar/crear Search Console y Analytics con cuentas de DecoSun y configurar eventos sin datos personales. No se instalaron identificadores ficticios ni rastreo sin cuenta.
3. Fichas independientes de productos y limpieza, y páginas locales con información y evidencia propias.
4. Dirección, horarios y enlace del perfil de Maps de Iquique. No crear local abierto al público para el taller de V Región.
5. Condiciones detalladas de garantía, procedimiento y exclusiones aprobadas por el negocio. La página actual informa los plazos confirmados y el canal de atención; no inventa condiciones.
6. Casos reales de motorización, fotografías y testimonios autorizados.
7. Optimizar imágenes restantes y dividir la carga de JavaScript.
8. Comprobar una instalación limpia en el entorno de despliegue y revisar las alertas de dependencias registradas por `npm audit`.

Los documentos SEO de julio de 2026 son antecedentes históricos. Esta nota registra únicamente lo comprobado y realizado en esta etapa.
