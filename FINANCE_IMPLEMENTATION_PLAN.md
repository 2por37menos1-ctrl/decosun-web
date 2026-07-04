# Plan de implementacion del DecoSun Financial Engine

## Objetivo

Transformar Finanzas desde un modelo basado en campos acumulados editables hacia un modelo basado en eventos financieros trazables.

Mantener compatibilidad con el sistema actual durante la transicion.

El nuevo motor financiero debe tomar `FINANCE_RULES.md` como fuente de verdad. El banco sigue siendo la columna vertebral: una venta financiera nace cuando entra dinero al banco, no cuando se acepta una cotizacion, se instala un proyecto o se edita manualmente un acumulado.

## Situacion actual

- `Treasury.jsx` ya administra:
  - empresas
  - bancos
  - categorias
  - movimientos de tesoreria
  - prestamos
  - transferencias
- `ProjectModal.jsx` actualmente administra:
  - `sale_value`
  - `amount_paid`
  - estado de pago
  - comisiones
- `Dashboard.jsx` actualmente detecta cambios en `amount_paid` y crea movimientos de tesoreria desde la diferencia.
- `KanbanBoard.jsx` actualmente muestra totales de `sale_value`.

La migracion debe preservar la funcionalidad existente mientras se incorpora el modelo nuevo.

## Phase 1 — Financial foundations

Crear nuevas entidades financieras sin eliminar los campos actuales.

### Estado de avance

- Phase 1A completada: se creo la base `project_payments` y los campos cache de proyecto sin activar cambios de comportamiento.
- Phase 1B completada: se creo y aplico `register_project_payment` como RPC transaccional para registrar pagos reales como eventos financieros.
- Fecha de validacion: 2026-07-03.
- Resultado de validacion manual en Supabase:
  - `register_project_payment` creo correctamente el evento en `project_payments`.
  - Creo correctamente el movimiento relacionado en `treasury_movements`.
  - Recalculo `amount_paid_cached`.
  - Recalculo `balance_cached`.
  - Actualizo `finance_status`.
  - Preservo `amount_paid` como campo legacy sin modificarlo.
  - No se realizaron cambios en React ni se activo el nuevo flujo visual de pagos.

### `project_payments`

Proposito:
Guardar cada pago real de cliente como un evento independiente.

Conceptos requeridos:
- relacion con proyecto
- monto
- fecha
- empresa
- banco
- usuario
- hito de pago
- estado
- relacion con tesoreria

Notas tecnicas:
- Cada transferencia debe conservar fecha, banco, empresa, monto, usuario, origen y relacion con proyecto.
- Varios movimientos pueden completar el mismo hito de pago, por ejemplo cuando el banco limita transferencias.
- Los estados deben permitir registrar pagos confirmados, anulados, corregidos o reversados sin borrar historia.
- No eliminar `amount_paid` todavia. Mantenerlo como legado/cache durante la transicion.

### `project_commissions`

Proposito:
Rastrear comisiones generadas por dinero real recibido.

Reglas:
- La comision se genera desde pagos, no desde `sale_value`.
- La comision generada y la comision pagada son estados distintos.
- Debe soportar comisiones de asesores y retiros de gerencia.

Notas tecnicas:
- Cada comision debe relacionarse con el pago que la origina cuando corresponda.
- El pago de una comision debe registrarse como evento separado, no como edicion destructiva del monto generado.
- El modelo debe permitir ver saldos pendientes por persona.

### `financial_provisions`

Proposito:
Separar dinero que todavia existe en el banco pero ya tiene destino.

Ejemplos:
- reserva de comision de asesor
- impuestos
- retiros de gerencia
- planificacion de proveedores

Notas tecnicas:
- Las provisiones deben afectar el disponible gerencial, no necesariamente el saldo banco.
- Deben poder relacionarse con empresa, banco, proyecto, categoria o cuenta interna segun corresponda.
- Deben tener estados que permitan liberar, consumir, anular o reversar la provision sin borrar trazabilidad.

### `financial_commitments`

Proposito:
Rastrear obligaciones futuras y alertas de pago.

Ejemplos:
- IVA
- TGR
- sueldos
- servicios
- gastos recurrentes

Notas tecnicas:
- Cada compromiso debe tener monto, fecha de vencimiento, empresa, categoria, estado y responsable cuando aplique.
- Debe permitir alertas por vencimiento.
- Cuando se pague un compromiso, el pago debe relacionarse con el movimiento de tesoreria correspondiente.

### `internal_accounts`

Proposito:
Rastrear dinero asignado a personas.

Ejemplos:
- comision pendiente de asesor
- monto generado Carlos
- retiros Carlos
- capital retenido

Notas tecnicas:
- Las cuentas internas deben explicar saldos por persona o rol.
- Deben soportar cargos, abonos, retiros, ajustes y reversas trazables.
- Deben integrarse con comisiones, provisiones y movimientos de tesoreria.

## Phase 2 — Payment flow

Reemplazar la edicion directa de `amount_paid` por un flujo basado en eventos.

Nuevo flujo:

```text
Usuario registra pago
↓
Crear project_payment
↓
Crear treasury_movement
↓
Generar comision
↓
Actualizar totales cacheados del proyecto
```

Reglas de implementacion:
- El usuario no debe editar `amount_paid` como fuente primaria del cobro.
- `amount_paid` debe actualizarse desde la suma de pagos validos para mantener compatibilidad.
- El movimiento de tesoreria debe nacer desde el pago y conservar la relacion entre banco, empresa y proyecto.
- La comision debe generarse solo cuando existe dinero recibido.
- El saldo pendiente debe calcularse como venta cerrada menos pagos recibidos.
- Si cambia el alcance, registrar un ajuste de alcance en vez de aplicar descuentos posteriores.

## Phase 3 — Treasury evolution

Mantener Tesoreria como el modulo que explica el banco.

Tesoreria debe responder:

- Cuanto dinero entro?
- Donde se gasto el dinero?
- Que conceptos consumieron caja?
- Que dinero esta reservado?
- Cual es el disponible real?

Reglas de implementacion:
- No convertir Tesoreria en software contable.
- Organizar Finanzas primero por empresa y luego por banco.
- Mantener dos miradas del mes financiero: caja real por fecha de movimiento y gestion por proyectos/compromisos asociados.
- El disponible gerencial debe calcularse como dinero conciliado menos provisiones menos compromisos reservados.
- Los errores financieros deben anularse, corregirse o reversarse. No deben editarse borrando historia.

## Phase 4 — Dashboard and Kanban

Actualizar indicadores financieros para que reflejen pagos reales y compromisos.

Mostrar:
- total vendido
- total cobrado
- pendiente de cobro
- dinero gastado por categoria
- caja operacional disponible

Columnas Kanban:
- valor de venta
- monto cobrado
- monto pendiente

Reglas de implementacion:
- `KanbanBoard.jsx` puede seguir mostrando `sale_value`, pero debe separar venta, cobro y pendiente.
- `Dashboard.jsx` debe dejar de depender del delta manual de `amount_paid` como origen financiero principal.
- Los indicadores deben poder filtrarse por empresa, banco, fecha de movimiento y proyecto asociado.
- La vista gerencial debe responder cuanto se vendio, cuanto se cobro, cuanto falta cobrar, donde se gasto, que esta provisionado, que compromisos vienen y cuanto queda realmente disponible.

## Phase 5 — Historical migration

Convertir cuidadosamente los valores existentes de `amount_paid` en `project_payments`.

Objetivos:
- preservar historia
- mantener compatibilidad
- evitar duplicar ingresos
- evitar duplicar comisiones
- evitar perder informacion existente

Estrategia sugerida:
- Identificar proyectos con `amount_paid` mayor a cero.
- Revisar si ya existen movimientos de tesoreria generados desde esos pagos.
- Crear pagos historicos solo cuando no exista un evento equivalente.
- Marcar pagos migrados con origen historico o migracion.
- Relacionar pagos migrados con movimientos de tesoreria existentes cuando sea posible.
- Recalcular caches del proyecto y comparar contra `amount_paid`.
- Validar comisiones generadas antes de activar el nuevo flujo en produccion.

Controles:
- Ejecutar migracion primero en ambiente de prueba.
- Generar reporte de diferencias por proyecto.
- No borrar movimientos antiguos.
- No eliminar `amount_paid` hasta validar que los pagos, comisiones y saldos coinciden.

## Security requirements

Antes de uso productivo:

- Revisar politicas Supabase RLS.
- Proteger tablas financieras del lado servidor.
- No depender solo de permisos frontend.

Requisitos adicionales:
- Auditar permisos existentes en `permissions.js`.
- Asegurar que usuarios sin permiso financiero no puedan leer, crear, editar, anular o reversar eventos financieros desde llamadas directas a Supabase.
- Separar permisos de lectura, creacion, anulacion, pago de compromisos y administracion financiera.
- Registrar usuario responsable en cada evento financiero sensible.

## Implementation rules for Codex

Nunca:
- reescribir todo el modulo Finanzas de una sola vez
- eliminar datos financieros existentes
- quitar `amount_paid` hasta validar la migracion

Siempre:
- implementar en fases pequenas
- mantener compatibilidad hacia atras
- documentar cambios de base de datos
- probar antes de desplegar

Reglas operativas:
- Cada fase debe tener migracion, UI minima, validaciones, permisos y pruebas.
- Los cambios deben ser reversibles o al menos auditables.
- Cualquier cambio que afecte dinero debe conservar trazabilidad.
- Evitar duplicar movimientos financieros entre pagos, tesoreria, comisiones y migraciones historicas.

## Principio final

The objective is not to create a traditional accounting system.
The objective is to create a managerial cash-flow engine that explains where money came from, where it went, what is committed, and what can safely be used.
