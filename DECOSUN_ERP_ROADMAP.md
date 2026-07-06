# DecoSun ERP v1 - Roadmap Maestro

## Proposito

DecoSun ERP v1 debe representar el flujo real de trabajo de la empresa: desde la oportunidad comercial hasta la instalacion, cobro, tesoreria, comisiones, aprendizaje interno y decisiones gerenciales.

Este roadmap organiza el trabajo pendiente en fases controladas. No reemplaza las reglas de negocio definidas por Carlos; sirve como mapa maestro para priorizar implementacion, auditoria y mejora continua.

## 1. Estado actual del ERP

### Proyectos/clientes

- Existe una base funcional para representar clientes, proyectos y estados comerciales/operacionales.
- El proyecto debe seguir siendo el eje principal de trazabilidad: cliente, presupuesto, agenda, pagos, deuda, comisiones, compras, produccion e instalacion.
- Se debe auditar que cada cambio de estado tenga una regla clara y que no existan estados duplicados, ambiguos o solo visuales.
- Prioridad: consolidar el proyecto como unidad operacional y financiera central.

### Agenda

- La agenda debe reflejar compromisos reales: visitas, mediciones, instalaciones, seguimiento comercial, pagos y tareas internas.
- Debe integrarse mejor con proyectos y responsables.
- Se debe diferenciar entre eventos operacionales, eventos comerciales y recordatorios administrativos.
- Prioridad: que la agenda deje de ser solo calendario y funcione como coordinador operacional.

### Finanzas

- El enfoque financiero no es contabilidad tradicional, sino motor gerencial de flujo de caja.
- El flujo esperado es:

```text
Movimiento bancario
-> Evento financiero
-> Proyecto / categoria / persona
-> Decision gerencial
```

- El Finance Engine v1 debe mantener trazabilidad entre pagos, ingresos, egresos, proyectos, categorias y saldos pendientes.
- Prioridad: cerrar el circuito entre movimiento real, lectura gerencial y accion operativa.

### Tesoreria

- Tesoreria debe permitir ver disponibilidad, compromisos, pagos futuros, cobros esperados y riesgo de caja.
- Debe integrarse con ventas, proyectos, compras, pagos a proveedores, remuneraciones y comisiones.
- Prioridad: evolucionar desde registro historico hacia proyeccion de caja.

### Comisiones

- Las comisiones deben estar conectadas a ventas, cobranza efectiva, reglas por persona y estado del proyecto.
- Debe evitarse pagar comisiones solo por venta declarada si la regla de negocio exige cobro, margen u otro hito.
- Prioridad: definir reglas publicas, trazables y auditables.

### Mercado Publico

- Mercado Publico debe tener seguimiento propio por oportunidad, licitacion, estado, fechas, documentos, responsable y resultado.
- Debe conectarse con proyectos cuando una adjudicacion se transforma en trabajo real.
- Prioridad: ordenar pipeline, fechas criticas y trazabilidad documental.

### Academia

- Academy debe servir como repositorio operativo de conocimientos, procesos, capacitacion y estandares internos.
- Puede incluir protocolos de venta, instalacion, medicion, produccion, uso del ERP y criterios de calidad.
- Prioridad: convertir conocimiento repetible en contenido accesible para el equipo.

## 2. Finance Engine v1

### Estado: COMPLETADO

Finance Engine v1 queda completado como motor gerencial de flujo de caja para DecoSun ERP v1.

El sistema ya no depende de `amount_paid` legacy como fuente financiera principal para las vistas criticas. El flujo base queda orientado a eventos trazables:

```text
Movimiento bancario
-> Evento financiero
-> Proyecto / categoria / persona
-> Decision gerencial
```

### Phase 2A Comisiones

- ✅ `project_commissions` implementado como base trazable de comisiones.
- ✅ Dashboard de comisiones disponible para lectura gerencial.
- ✅ `pay_project_commission` implementado para pagos controlados de comisiones.
- ✅ Flujo legacy de comisiones apagado como fuente principal.

### Phase 2B Cache financiero y reconciliacion

- ✅ Pagos antiguos de UI apagados como fuente operacional.
- ✅ `amount_paid` desconectado de Tesoreria.
- ✅ Dashboard/Kanban usando cache financiero.
- ✅ `finance_status` disponible como estado financiero visual.
- ✅ Treasury projections usando cache financiero.
- ✅ Vista publica cliente usando cache financiero.
- ✅ RPC publica `get_project_status` actualizada para exponer cache financiero.
- ✅ Reconciliacion historica aplicada desde movimientos de Tesoreria vinculados.

### Resultado de reconciliacion historica

- 103 proyectos procesados.
- 103 proyectos con cache financiero.
- 18 proyectos con `project_payments` trazables.
- 0 casos `treasury_only_needs_review` pendientes.

### Pendientes menores

- 6 casos legacy para revision manual.
- 3 casos overpaid para revision manual.

### Siguiente etapa: ERP Audit Phase

Objetivo:

Auditoria completa del ERP para revisar consistencia, trazabilidad, reglas de negocio, seguridad, UX y deuda tecnica antes de avanzar a nuevos modulos profundos.

Areas de auditoria:

- Finanzas.
- Inventario.
- Mercaderia.
- Produccion.
- Corte de tela.
- Optimizacion.
- Compras.
- UX general.

## 3. Auditoria general del sistema

### Code structure

- Revisar estructura de carpetas, paginas, componentes, servicios y utilidades.
- Identificar limites claros entre UI, reglas de negocio, acceso a datos y transformaciones.
- Documentar dependencias criticas y flujos principales.
- Evitar reescrituras completas; priorizar mejoras incrementales.

### Duplicate/legacy files

- Identificar archivos duplicados, versiones antiguas y componentes abandonados.
- Clasificar cada caso como:
  - En uso.
  - Legacy pero necesario.
  - Reemplazado.
  - Candidato a eliminacion futura.
- No eliminar sin verificar uso real, rutas, imports y compatibilidad.

### Supabase/RLS

- Auditar tablas, relaciones, indices, permisos y politicas RLS.
- Validar que cada area sensible tenga permisos coherentes: finanzas, tesoreria, comisiones, usuarios y proyectos.
- Revisar si existen consultas que dependan de permisos demasiado amplios.
- Documentar riesgos antes de modificar politicas.

### Large components

- Detectar componentes demasiado grandes o con demasiadas responsabilidades.
- Priorizar separacion cuando mejore legibilidad, pruebas y mantenimiento.
- Evitar refactors cosmeticos que no reduzcan riesgo real.
- Candidatos naturales: dashboard, modales complejos, vistas financieras y vistas de proyectos.

### UX consistency

- Revisar consistencia de botones, tablas, modales, formularios, filtros, estados vacios y mensajes de error.
- Unificar patrones de navegacion y acciones principales.
- Asegurar que las pantallas operacionales sean densas, claras y rapidas de usar.

### Technical debt

- Crear inventario de deuda tecnica con impacto, riesgo y prioridad.
- Separar deuda visible para usuarios de deuda interna.
- Atacar primero deuda que afecte datos, seguridad, trazabilidad o velocidad de operacion.

## 4. UX and visual improvement

### Dashboard

- Convertirlo en centro gerencial y operacional.
- Mostrar indicadores accionables: ventas, cobros, deuda, agenda, instalaciones, caja y alertas.
- Evitar exceso de tarjetas decorativas; privilegiar informacion escaneable.
- Incluir accesos rapidos a tareas del dia.

### ProjectModal

- Ordenar informacion por flujo real: cliente, venta, medidas, agenda, pagos, produccion, instalacion y cierre.
- Reducir saturacion visual mediante secciones claras.
- Mostrar deuda, pagos y estado financiero sin obligar a navegar a otra pantalla.
- Cuidar permisos para informacion sensible.

### Treasury

- Diferenciar caja actual, compromisos, proyecciones y alertas.
- Mostrar vencimientos y pagos esperados en una lectura simple.
- Permitir filtrar por cuenta, categoria, proyecto, proveedor y periodo.

### Kanban

- Asegurar que las columnas representen estados reales del negocio.
- Evitar estados ambiguos o duplicados.
- Permitir acciones rapidas sin perder trazabilidad.
- Mostrar señales utiles: deuda, fecha de instalacion, responsable, urgencia y bloqueo.

### Mobile/responsive

- Priorizar flujos moviles reales: revisar proyecto, llamar cliente, actualizar estado, ver agenda, registrar pago o nota.
- Reducir tablas complejas en mobile mediante listas resumidas.
- Asegurar modales usables en pantallas pequenas.

## 5. Inventory and warehouse

### Products

- Crear catalogo de productos vendibles y configurables.
- Relacionar productos con materiales, costos, proveedores y reglas de produccion.
- Mantener historial de precio/costo cuando sea necesario.

### Materials

- Registrar materiales por tipo, unidad, costo, proveedor y uso operacional.
- Diferenciar materiales consumibles, componentes y telas.
- Asociar materiales a proyectos y produccion.

### Fabric rolls

- Controlar rollos por tela, color, ancho, largo disponible, bodega y proveedor.
- Registrar ingreso, consumo, saldo y merma.
- Mantener trazabilidad desde compra hasta uso en proyecto.

### Stock movements

- Registrar entradas, salidas, ajustes, traslados y consumos.
- Asociar movimientos a compra, proyecto, produccion o ajuste manual autorizado.
- Auditar usuario, fecha, motivo y documento relacionado.

### Warehouses

- Definir bodegas fisicas o logicas.
- Permitir stock por ubicacion.
- Soportar traslados entre bodegas.

### Suppliers

- Mantener ficha de proveedor, condiciones comerciales, tiempos de entrega, productos y datos de pago.
- Conectar proveedores con compras, tesoreria y recepcion de mercaderia.

## 6. Purchases and merchandise

### Purchase requests

- Crear solicitudes desde proyectos, inventario o necesidad administrativa.
- Incluir responsable, motivo, items, prioridad y fecha requerida.
- Permitir trazabilidad desde solicitud hasta pago y recepcion.

### Supplier orders

- Generar ordenes a proveedor con items, cantidades, costos, fecha esperada y condiciones.
- Relacionar ordenes con solicitudes y proyectos.
- Registrar documentos asociados.

### Approval

- Definir reglas de aprobacion por monto, categoria o area.
- Evitar compras sin responsable ni justificacion.
- Mantener historial de aprobacion/rechazo.

### Treasury payment

- Conectar compras aprobadas con tesoreria.
- Programar pagos a proveedores.
- Mostrar compromisos futuros en proyeccion de caja.

### Reception

- Registrar recepcion parcial o total de mercaderia.
- Actualizar stock cuando corresponda.
- Detectar diferencias entre pedido, factura y recepcion.

## 7. Cutting and optimization

### Measurements

- Registrar medidas del proyecto de forma estructurada.
- Distinguir medidas preliminares, confirmadas y corregidas.
- Asociar medidas a productos, ambientes y piezas.

### Fabric usage

- Calcular consumo estimado y real de tela.
- Conectar consumo con rollos disponibles.
- Mantener trazabilidad por proyecto.

### Roll optimization

- Optimizar uso de rollos segun ancho, largo disponible, patron y restricciones productivas.
- Sugerir asignacion de rollos antes de cortar.
- Evitar consumo ineficiente de rollos grandes para piezas pequenas cuando existan alternativas.

### Waste/merma

- Registrar merma estimada y real.
- Clasificar merma normal, error de medicion, error de corte, falla de material u otro motivo.
- Usar datos historicos para mejorar compras y produccion.

### Integration with stock

- Descontar stock al confirmar consumo real.
- Reservar material para proyectos aprobados cuando corresponda.
- Liberar reservas si el proyecto cambia o se cancela.

## 8. Production

### Cutting

- Crear flujo de corte asociado a medidas, rollos y responsable.
- Registrar inicio, termino, incidencias y material usado.
- Bloquear avance si faltan medidas confirmadas o material reservado.

### Assembly

- Registrar armado/confeccion por producto o pieza.
- Asociar responsable, estado, observaciones y tiempos.
- Conectar avances con agenda de instalacion.

### Quality control

- Definir checklist de calidad por tipo de producto.
- Registrar aprobacion, rechazo, correccion o retrabajo.
- Mantener evidencia cuando sea necesario.

### Ready for installation

- Marcar proyectos o piezas listos para instalacion.
- Validar que esten completos: produccion, accesorios, pagos requeridos y agenda.
- Generar alerta si falta algun requisito.

## 9. Management reports

### Sales

- Ventas por periodo, vendedor, canal, producto y estado.
- Conversion de oportunidades a proyectos.
- Comparacion entre venta presupuestada y venta cerrada.

### Collections

- Cobros realizados por periodo, proyecto, cliente y responsable.
- Cobros esperados versus cobrados.
- Identificacion de atraso y riesgo.

### Pending balances

- Saldos pendientes por cliente, proyecto, antiguedad y estado.
- Separar deuda vencida, deuda futura y deuda en disputa.
- Mostrar impacto en caja proyectada.

### Commissions

- Comisiones devengadas, pagadas y pendientes.
- Trazabilidad con venta, cobro y regla aplicada.
- Reporte por persona y periodo.

### Inventory value

- Valor de inventario por bodega, categoria, proveedor y antiguedad.
- Stock inmovilizado o de baja rotacion.
- Impacto de consumo y compras en capital de trabajo.

### Profitability

- Rentabilidad por proyecto, producto, cliente, vendedor o canal.
- Considerar ingresos, materiales, compras, comisiones, gastos asociados y merma.
- Separar margen estimado, margen real y diferencias.

## 10. Future AI assistant

### Voice capture

- Capturar notas por voz desde terreno, sala de ventas o bodega.
- Convertir notas en tareas, observaciones de proyecto o eventos de agenda.
- Validar siempre antes de modificar datos sensibles.

### Project summaries

- Generar resumen ejecutivo de cada proyecto:
  - Estado comercial.
  - Estado financiero.
  - Agenda.
  - Produccion.
  - Pendientes.
  - Riesgos.

### Alerts

- Detectar atrasos, deuda vencida, falta de material, falta de agenda, caja insuficiente o proyectos bloqueados.
- Priorizar alertas accionables por rol.
- Evitar ruido excesivo.

### Finance analysis

- Analizar flujo de caja, compromisos, cobros pendientes y escenarios.
- Explicar riesgos en lenguaje gerencial.
- Sugerir acciones, pero no ejecutar movimientos sin confirmacion humana.

## Orden recomendado de trabajo

1. Ejecutar ERP Audit Phase sin modificar comportamiento.
2. Revisar Supabase/RLS, permisos y trazabilidad financiera.
3. Auditar Finance Engine v1 en produccion: pagos, cache, comisiones, Tesoreria y reconciliacion historica.
4. Mejorar UX de Dashboard, ProjectModal, Treasury y Kanban.
5. Consolidar agenda y estados operacionales de proyectos.
6. Disenar inventario y bodega con modelo incremental.
7. Implementar compras conectadas a tesoreria y recepcion.
8. Implementar control de telas, rollos, stock y movimientos.
9. Implementar mediciones, corte y optimizacion.
10. Implementar flujo de produccion y control de calidad.
11. Crear reportes gerenciales de ventas, cobranza, comisiones, inventario y rentabilidad.
12. Incorporar asistente IA solo cuando los datos base sean confiables, trazables y seguros.

## Criterios de avance

- Cada fase debe tener reglas de negocio claras antes de implementar.
- Cada cambio debe mantener compatibilidad hacia atras.
- Cada modulo critico debe tener permisos definidos.
- Cada dato financiero debe ser trazable hasta su origen.
- Cada pantalla operacional debe ayudar a tomar una decision o ejecutar una accion.
- Cada migracion futura debe ser incremental, revisable y segura.
