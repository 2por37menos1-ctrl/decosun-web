# Reglas del modulo Finanzas

## Reglas de negocio

1. El modulo Finanzas no reemplaza la contabilidad formal ni el banco. Su objetivo es explicar el movimiento del dinero.
2. El banco es la columna vertebral: una venta financiera nace cuando entra dinero al banco.
3. Una cotizacion aceptada sin pago es una oportunidad ganada, pero no una venta financiera.
4. Los pagos de cliente son eventos independientes. Cada transferencia debe conservar fecha, banco, empresa, monto, usuario, origen y relacion con proyecto.
5. En DecoSun normalmente el cliente paga 50% inicial y 50% final. Si el banco limita transferencias, varios movimientos pueden completar el mismo hito de pago.
6. La comision nace cuando entra dinero, no cuando se cotiza ni cuando se instala.
7. La comision generada y la comision pagada son estados distintos.
8. El saldo pendiente es venta cerrada menos pagos recibidos.
9. No se hacen descuentos posteriores; si cambia el alcance, debe registrarse como ajuste de alcance.
10. La mercaderia comprada por rollos, tubos o stock general pertenece al inventario, no necesariamente al costo directo exacto del proyecto.
11. Los costos directos de proyecto incluyen comision, instalador externo, ayudante, flete especial, traslado u otros gastos identificables.
12. Finanzas debe organizarse primero por empresa y luego por banco.
13. El mes financiero debe permitir dos miradas: caja real por fecha de movimiento y gestion por proyectos/compromisos asociados.
14. Los errores financieros no deben editarse borrando historia; deben anularse, corregirse o reversarse.
15. El disponible gerencial no es igual al saldo banco. Disponible gerencial = dinero conciliado - provisiones - compromisos reservados.
16. Las provisiones separan dinero que aun esta en el banco pero ya tiene destino.
17. Los compromisos de pago deben permitir alertas por vencimiento.
18. Deben existir cuentas internas por persona: comisiones de asesores, retiros gerencia, capital retenido o aportes.
19. La vista gerencial debe responder: cuanto vendimos, cuanto cobramos, cuanto falta cobrar, donde se gasto, que esta provisionado, que compromisos vienen y cuanto queda realmente disponible.
20. Todo cambio futuro debe respetar trazabilidad y evitar duplicar movimientos financieros.

## Current implementation notes

- `Treasury.jsx` ya tiene empresas, bancos, categorias, prestamos, transferencias y movimientos manuales.
- `ProjectModal.jsx` actualmente edita `amount_paid` directamente.
- `Dashboard.jsx` actualmente crea ingresos de tesoreria desde el delta de `amount_paid`.
- `KanbanBoard.jsx` actualmente suma `sale_value` por columna.
- `permissions.js` ya tiene permisos financieros basicos, pero se debe auditar Supabase RLS.

## Implementation principle

Construir el nuevo motor financiero sin eliminar los campos actuales. Mantener `amount_paid` como legado/cache durante la transicion.
