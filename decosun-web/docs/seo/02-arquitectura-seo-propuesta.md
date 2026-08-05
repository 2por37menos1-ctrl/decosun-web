# Arquitectura SEO propuesta — DecoSun 2026-2029

## Principios

1. Separar contenido indexable de aplicaciones: marketing prerenderizado/estático; cotizador, agenda, estado y ERP no indexables.
2. Una intención principal por URL, con hubs que distribuyen autoridad.
3. No publicar landings locales sin cobertura, evidencia y contenido único.
4. No cambiar slugs después de publicar sin redirects 301.

## Mapa futuro

```text
/
├── soluciones/
│   ├── cortinas-roller/
│   │   ├── screen/
│   │   ├── blackout/
│   │   ├── translucidas/
│   │   └── duo/
│   ├── persianas/
│   │   ├── verticales/
│   │   └── aluminio/
│   ├── toldos/
│   │   ├── proyectantes/
│   │   └── verticales/
│   ├── pergolas/
│   ├── cierres-terraza/
│   │   ├── pvc/
│   │   └── cristal/
│   ├── motorizacion-cortinas/
│   └── automatizacion/
├── para/
│   ├── hogares/
│   ├── oficinas/
│   ├── empresas/
│   ├── constructoras/
│   └── instituciones/
├── proyectos/ → /proyectos/{caso-real}/
├── cobertura/ → /cobertura/{ciudad}/
├── guias/ → comparativas, medición, mantención y educación
├── preguntas-frecuentes/
├── nosotros/
│   ├── equipo/
│   ├── proceso/
│   └── garantias/
├── contacto/
├── cotizar/             [noindex]
├── agenda/              [noindex]
├── estado/{token}       [noindex,nofollow]
├── login/               [noindex,nofollow]
└── panel/*              [privado + noindex,nofollow]
```

## Backlog de páginas

Demanda y competencia son cualitativas, no datos de Keyword Planner.

| URL | Objetivo / keyword / intención | Público y contenido mínimo | Relacionadas | Prioridad / valor | Canibalización |
|---|---|---|---|---|---|
| `/soluciones/` | Hub de control solar / comercial | Familias, selector por necesidad, proceso, cobertura | Todas las landings | P0 / alto | No intentar rankear cada variante en el hub. |
| `/soluciones/cortinas-roller/` | Hub cortinas roller / comercial | Tipos, diferencias, ambientes, medición, FAQ | Screen, blackout, translúcida, dúo | P1 / alto | Reservar variantes a hijas. |
| `/soluciones/cortinas-roller/screen/` | cortinas roller screen / transaccional | Aperturas, UV, privacidad diurna, telas, proyectos, instalación | Blackout, oficinas | P1 / muy alto | Diferenciar de “control solar”. |
| `/soluciones/cortinas-roller/blackout/` | cortinas blackout / transaccional | Oscuridad, dormitorios, límites laterales, opciones | Screen, translúcida | P1 / muy alto | No duplicar “black out” en otra URL. |
| `/soluciones/cortinas-roller/translucidas/` | roller translúcidas / transaccional | Luz, privacidad, colores, ambientes | Screen, dúo | P2 / alto | Comparativa explícita. |
| `/soluciones/cortinas-roller/duo/` | cortinas roller dúo / transaccional | Bandas, sunout/translúcida, uso, galería | Roller, automatización | P1 / alto | Unificar DÚO/duo. |
| `/soluciones/persianas/verticales/` | persianas verticales / transaccional | Vanos amplios, oficinas, materiales, mantención | Aluminio, oficinas | P2 / medio-alto | No mezclar con roller vertical. |
| `/soluciones/persianas/aluminio/` | persianas aluminio / transaccional | Lamas, regulación, aplicaciones, colores | Verticales | P2 / medio | Validar oferta actual antes. |
| `/soluciones/toldos/proyectantes/` | toldos proyectantes / transaccional | Sistemas, viento, dimensiones, uso, instalación | Toldos verticales, terrazas | P1 / alto | Diferenciar mecanismo. |
| `/soluciones/toldos/verticales/` | toldos verticales / transaccional | Protección frontal, balcones, screen exterior | Proyectantes, cierres | P2 / alto | Evitar competir por “toldos” genérico. |
| `/soluciones/pergolas/` | pérgolas / comercial-transaccional | Tipos reales, drenaje, viento, permisos, casos | Terrazas, cierres | P1 / alto | No afirmar “bioclimática” si modelo no lo es. |
| `/soluciones/cierres-terraza/pvc/` | cierres PVC terraza / transaccional | Material, clima, apertura, medidas, mantención | Cristal, toldos | P2 / alto | Comparativa PVC/cristal. |
| `/soluciones/cierres-terraza/cristal/` | cierres cristal terraza / transaccional | Sistema, seguridad, condiciones, galería, casos | PVC, pérgolas | P1 / muy alto | Contenido hoy comentado en Soluciones; consolidar. |
| `/soluciones/motorizacion-cortinas/` | motorizar cortinas / transaccional | Compatibilidad, control, alimentación, instalación | Automatización, roller | P1 / alto | Motorización = hardware/servicio. |
| `/soluciones/automatizacion/` | automatización de cortinas / comercial | Integraciones reales, escenas, control, límites | Motorización | P2 / alto | Automatización = ecosistema; no duplicar texto. |
| `/para/oficinas/` | cortinas para oficinas / B2B | Deslumbramiento, pantallas, privacidad, especificación, casos | Screen, verticales | P1 / alto | Vertical sectorial, no ficha de producto. |
| `/para/empresas/` | soluciones control solar empresas / B2B | Cobertura, SLA real, facturación, multi-sede | Oficinas, proyectos | P2 / alto | Diferenciar de oficinas por proceso. |
| `/para/constructoras/` | proveedor cortinas constructoras / B2B | Capacidad, cubicación, fichas, coordinación, casos | Recursos técnicos | P1 / muy alto | Requiere evidencia operativa. |
| `/para/instituciones/` | cortinas instituciones / B2B | Seguridad, licitaciones, documentación, proyectos | Mercado Público (sin enlazar ERP) | P2 / alto | Hablar del servicio, nunca exponer panel. |
| `/proyectos/{slug}/` | caso de éxito específico / comercial | Desafío, solución, productos, ciudad, fotos propias, resultado | Producto y ciudad | P1 continuo / alto | Solo casos reales y consentidos. |
| `/guias/` | Hub educativo / informativa | Taxonomía y autores | Pilares | P2 / medio | No usar `/blog` y `/guias` para lo mismo. |
| `/preguntas-frecuentes/` | dudas de compra / informativa-comercial | FAQ editorial enlazada por tema | Productos | P2 / medio | Las FAQs de producto permanecen específicas. |
| `/cobertura/` | áreas de servicio / local | Mapa/listado honesto, modalidades y contacto | Ciudades | P1 / alto | No afirmar sucursales donde hay asesores. |

## Plantilla obligatoria de landing

- Breadcrumb visible.
- Title, description, canonical, H1 único.
- Respuesta directa inicial y propuesta de valor verificable.
- Casos de uso y criterios de elección.
- Especificaciones reales; límites y mantención.
- Galería propia optimizada con captions.
- Proceso, cobertura y garantías validadas.
- Caso relacionado, FAQ útil y CTA con evento.
- Enlaces al hub, productos alternativos, ciudad y guía.
- `Service` o `Product` solo según la naturaleza real.

## Navegación

Menú recomendado: Soluciones (mega menú simple), Proyectos, Empresas, Cobertura, Nosotros y CTA Cotizar. “Agenda” puede ser CTA secundario y “Acceso equipo” debe salir de la navegación comercial principal. Footer: NAP validado por sucursal, contacto, cobertura, políticas, garantías y acceso interno discreto.

## Estrategia de renderizado

Fase inmediata: prerender de `/`, `/soluciones`, `/proyectos`, `/nosotros` y futuras landings. Mantener apps transaccionales como SPA. Cada artefacto prerenderizado debe tener metadata y contenido propios. A medida que crezca el catálogo, evaluar SSG híbrido; migrar framework solo si la generación, edición o routing supera lo razonable en Vite.

## Reglas editoriales y de URL

- Minúsculas, guiones, sin tildes en slug; español de Chile.
- Canonical absoluto al host `www` confirmado.
- Una URL por concepto; redirects para sinónimos.
- Parámetros de campaña nunca canonical propios.
- Paginación/filtros solo cuando tengan valor y contenido distinto.
- Ninguna URL local se publica hasta aprobar la ficha de evidencia local.
