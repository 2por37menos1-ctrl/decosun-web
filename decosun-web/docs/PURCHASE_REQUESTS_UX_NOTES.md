# Solicitudes de material: alcance de UX

La interfaz renovada mantiene las tablas existentes `purchase_requests` y `purchase_request_items`. No se crearon migraciones ni estados nuevos.

## Mapeo visual de estados

- `solicitado` → Pendiente
- `aprobado` → En revisión
- `pagado`, `pedido_realizado` o `en_compra` → En compra
- `recibido` o `reception_status = recibido` → Recibida
- `anulado`, `rechazado` o `cerrado` → Cerrada

Este mapeo no modifica el valor almacenado. Su propósito es presentar estados históricos heterogéneos con lenguaje operacional consistente.

## Compatibilidad del alta

El flujo guarda `supplier_name = Por definir`, importes en cero y los mismos campos de compatibilidad usados previamente para cada material. El proveedor y el precio no se solicitan al usuario. La cabecera y los materiales continúan guardándose en dos operaciones independientes porque no existe un RPC transaccional local.

## Datos pendientes

No existe evidencia local de columnas compatibles para prioridad o fecha requerida en `purchase_requests`. Por eso el wizard no captura valores que luego se perderían. Las solicitudes antiguas muestran `priority` o `urgency` cuando esos datos ya vienen en la respuesta.

La opción “Desde medidas / cálculo del proyecto” queda visible pero deshabilitada. Su integración futura deberá consumir resultados del motor compartido sin copiar fórmulas al flujo de solicitudes.

La etapa de compra necesita posteriormente proveedor, precio y orden de compra. La recepción necesita cantidades recibidas y trazabilidad parcial. Ninguna de esas áreas genera movimientos financieros en esta fase.
