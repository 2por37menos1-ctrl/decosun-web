# Propuesta incremental de datos para Operaciones

Esta fase no crea tablas de inventario. La interfaz usa únicamente `purchase_requests` y `purchase_request_items` y no asume que la ausencia de stock registrado equivale a stock cero.

## Modelo propuesto para una fase posterior

- `materials`: catálogo vivo de materiales, con nombre, categoría, unidad base, estado y atributos flexibles. No contiene stock.
- `inventory_locations`: bodegas o ubicaciones habilitadas por región.
- `inventory_lots`: existencia física por material y ubicación. Para telas representa cada rollo e incluye código, color, ancho, largo inicial, largo remanente, proveedor y estado.
- `inventory_reservations`: reservas por proyecto u orden de trabajo, con cantidad, estado, responsable y fechas. No modifica ni elimina el movimiento original.
- `inventory_movements`: libro trazable de entradas, consumos, ajustes, traslados y reversas. Cada movimiento referencia material, lote cuando corresponde, ubicación, cantidad, origen y usuario.

El stock físico debe derivarse de movimientos válidos. El stock reservado debe derivarse de reservas activas. `stock_disponible = stock_fisico - stock_reservado`.

## Integración futura

Una solicitud registra una necesidad y no un egreso. Una futura orden de compra será un compromiso; solo el pago real al proveedor deberá originar un evento financiero mediante un flujo protegido del lado servidor. La reserva de stock y la generación de solicitudes por faltantes deben implementarse transaccionalmente y con políticas RLS antes de habilitar sus botones.
