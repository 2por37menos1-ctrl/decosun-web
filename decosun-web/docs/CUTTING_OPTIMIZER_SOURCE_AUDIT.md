# Auditoría de la fuente de verdad del optimizador

Fecha de revisión: 2026-09-03.

Fuente funcional revisada, sin modificaciones:

- `C:\Users\2por3\Pictures\optimizador-decosun\index.html`

Motor comparado:

- `src/lib/cuttingOptimizer.js`
- `src/components/operations/MaterialCalculator.jsx`
- `src/components/operations/ProductionOptimizer.jsx`

## Entrada aceptada por el optimizador original

El texto visible recomienda dos disposiciones:

1. `Cantidad | Tipo | Ancho | Alto | Vano | Tela | Lugar | Caída | Izq/Der`
2. `Cantidad | Ancho | Alto | Vano | Tela | Lugar | Caída | Izq/Der`

Sin embargo, la función real `splitExcelLine` separa tabulaciones, punto y coma o comas; no implementa el separador `|` anunciado visualmente. Si la segunda columna no reconoce `duo`, `dúo`, `simple` o `mini`, usa el tipo seleccionado por defecto y trata esa columna como ancho. La tela vacía usa el código de tela predeterminado. Cada fila se expande inmediatamente según cantidad y recibe un número correlativo de OT.

Las medidas positivas menores o iguales a 10 se interpretan como metros y se convierten a centímetros. En el original, `1,290` y `1.290` terminan representando 129 cm. La lógica admite coma decimal cuando no hay punto y elimina todos los puntos únicamente cuando existen varios.

## Reglas de producto encontradas

### Roller Simple MiniGap

- Tubo Ø38: `ancho final - descuento simple`.
- Barra inferior: igual al tubo.
- Ancho de tela: `tubo - gap de tela`.
- Alto de tela: `alto final + extra simple`.
- Mecanismo: una unidad de `Mecanismo MiniGap`.
- Valores iniciales de interfaz: descuento `2,5 cm`, gap `0,5 cm`, extra simple `20 cm`.
- Los tres parámetros son configurables por el usuario.

### Roller DÚO

- Ancho de tela: `ancho final - 3 cm`.
- Alto de tela: `alto final × 2 + extra DÚO`.
- Cenefa: `ancho final - 1 cm`.
- Tubo Ø38: `ancho final - 2,5 cm`.
- Redondo o tubo interior: `ancho final - 2,5 cm`.
- Contrapeso: `ancho final - 2 cm`.
- No genera barra inferior simple.
- Mecanismo: una unidad de `Mecanismo DÚO`.
- El extra DÚO es configurable y su valor inicial real es `0 cm`.

Todos los cortes descuentan con `Math.max(..., 0)` para evitar largos negativos.

## Optimización y compra

- El ancho inicial del rollo es `300 cm` y es configurable.
- El largo inicial de perfiles es `580 cm` y es configurable.
- Tela y perfiles usan First Fit Decreasing: ordenar cortes de mayor a menor y ubicarlos en el primer contenedor con capacidad.
- La tela se agrupa primero por código de tela.
- Modo `Priorizar mismo alto`: redondea el alto de cada pieza al centímetro, agrupa por ese alto, ordena grupos desde el alto mayor y aplica FFD por ancho dentro de cada grupo.
- Modo `Maximizar ancho`: aplica FFD por ancho mezclando alturas de una misma tela; el consumo lineal de cada pasada es el mayor alto de las piezas colocadas.
- Metros lineales de tela: suma de los altos consumidos por cada pasada o grupo dividida por 100.
- Sobrante transversal de tela: `ancho de rollo - suma de anchos de piezas`.
- Perfiles optimizados individualmente: tubo Ø38, barra inferior, cenefa DÚO, redondo DÚO y contrapeso DÚO.
- Sobrante de perfil: `largo de perfil - suma de cortes`.
- Compra de tela: desglose informativo suponiendo rollos de 30 m, con rollos completos más remanente lineal.
- Compra de perfiles: estimación de paquetes de 10 mediante `ceil(cantidad de barras / 10)`.

## Estructura de la OT original

Cada cortina expandida conserva: correlativo, tipo y etiqueta de producto, ancho y alto finales, vano, tela, ancho y alto de corte de tela, cenefa, tubo Ø38, redondo, contrapeso, barra inferior, mecanismo, lugar, caída y lado. El informe también conserva cliente/proyecto, fecha, tipo predeterminado y ancho del rollo, y permite imprimir por separado OT, tela o perfiles.

## Reglas equivalentes en el motor ERP actual

- Conversión general de metros a centímetros para números positivos hasta 10.
- Reconocimiento conceptual de Simple y DÚO.
- Fórmulas de ancho para tubo, barra inferior y tela Simple.
- Extra Simple inicial de 20 cm.
- Fórmulas fijas de ancho para tela, cenefa, tubo, redondo y contrapeso DÚO.
- Expansión de cantidades a piezas individuales.
- Agrupación de tela por código.
- First Fit Decreasing para tela y los cinco tipos de perfiles.
- Cálculo de sobrante transversal y sobrante de perfiles.
- Conservación de vano, tela, lugar, caída y lado dentro de las piezas calculadas.

## Diferencias detectadas antes de cambiar comportamiento

1. **Extra DÚO crítico:** el original inicia en `0 cm`; el motor ERP reutiliza actualmente `fabricExtra = 20 cm` y suma 20 cm a cada DÚO.
2. **Punto decimal crítico:** el original interpreta `1.290` como 129 cm; el parser ERP elimina ese punto como separador de miles y produce 1290 cm.
3. **Formato sin tipo:** el original acepta filas sin tipo usando una selección predeterminada; el ERP exige de hecho nueve columnas y no ofrece tipo predeterminado.
4. **Separadores:** el original ejecutable admite tab, `;` y coma, aunque su texto anuncia `|`; el ERP admite tab, `|` y `;`, pero no coma. Aceptar coma como separador entra en conflicto con medidas decimales con coma y requiere una decisión explícita.
5. **Tela predeterminada:** el original permite configurarla; el ERP usa `Sin tela definida` y no expone configuración.
6. **Ancho de rollo:** original `300 cm`; ERP `250 cm` tanto para el cálculo inicial de requerimientos como para Fabricación.
7. **Largo de perfiles:** original `580 cm`; ERP `600 cm`.
8. **Parámetros de Simple:** el motor ERP permite recibir configuración internamente, pero la UI no expone descuento, gap ni extra.
9. **Extra DÚO configurable:** no tiene un campo independiente en el motor ni en la UI ERP.
10. **Agrupación por alto:** el original redondea al centímetro y procesa alturas descendentes; el ERP agrupa por el valor exacto y conserva el orden de llegada.
11. **Etiquetas de mecanismo:** el original distingue `Mecanismo MiniGap` y `Mecanismo DÚO`; el ERP solo contabiliza mecanismos genéricos.
12. **Resumen de compra:** el ERP no presenta la regla informativa de rollos de 30 m ni paquetes de 10 perfiles.
13. **OT visible:** el ERP conserva varios campos internamente, pero su tabla no muestra vano, caída, lado, cada componente ni la etiqueta de mecanismo.
14. **Metadatos e impresión:** el ERP selecciona proyecto, pero no replica fecha, tipo por defecto, metadatos completos ni impresión por panel.
15. **Formato visual:** el original expresa medidas de OT en metros con tres decimales; el ERP las presenta en centímetros con un decimal.
16. **Validación de capacidad:** ninguno de los motores rechaza explícitamente una pieza más ancha que el rollo o más larga que el perfil; ambos crean un contenedor cuyo sobrante visual queda en cero. Esto requiere una regla de negocio para tratar piezas imposibles.

## Reglas pendientes de validación antes del traslado

- Confirmar que el extra DÚO productivo debe iniciar en 0 cm.
- Confirmar que los valores productivos por defecto siguen siendo rollo de 300 cm y perfil de 580 cm.
- Decidir si el ERP debe tolerar coma como delimitador, considerando que también se usa como decimal.
- Definir el comportamiento ante una pieza que excede el ancho del rollo o largo del perfil.
- Confirmar si las estimaciones de compra de rollos de 30 m y paquetes de 10 deben formar parte del calculador gerencial o solo del informe de fabricación.
- Confirmar alcance de impresión y metadatos de OT para esta fase.

## Correcciones trasladadas después de validación

Las reglas productivas fueron confirmadas y trasladadas al ERP el 2026-09-03: extra DÚO de 0 cm, rollo de 300 cm, perfil de 580 cm, normalización decimal de medidas, filas sin tipo, agrupación por alturas redondeadas descendentes, mecanismos separados, compra informativa y rechazo de piezas imposibles.

Normalización adoptada: un único punto o coma se interpreta como separador decimal. Por eso `1.290`, `1,290` y `1.29` representan 1,29 m y se convierten en 129 cm; `129` y `129,0` permanecen en 129 cm. Múltiples puntos sin coma conservan la interpretación legacy de separadores de miles. Una cadena que mezcla punto y coma se rechaza por ambigua.

La coma no se usa como delimitador de columnas en el ERP porque entra en conflicto con la coma decimal confirmada. Se aceptan tabulaciones, `|` y `;`. Esta es una diferencia deliberada frente al fallback de `splitExcelLine` del HTML original.
