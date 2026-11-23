# Manual de uso y guion de sustentación

## 1. Ingreso

Ejecutar `npm start` en la carpeta del proyecto y abrir `http://127.0.0.1:3100`. Elegir una cuenta de demostración o ingresar correo y contraseña. Pulsar **Entrar a mi tienda**. Las credenciales están en `README.md`.

La sesión conserva el acceso al recargar. Para salir, usar el icono de salida en la esquina superior derecha. En celular, el botón de menú muestra las secciones.

## 2. Resumen y búsqueda

El panel muestra ventas del período, número de operaciones, pares disponibles y alertas. Elegir Hoy, últimos 7 días o últimos 30 días. Los gráficos se calculan con datos guardados; el historial inicial es ficticio.

La barra superior filtra los registros de la sección actual. En el resumen permite buscar productos del catálogo. El icono de alertas abre Inventario con el filtro de stock bajo.

## 3. Productos e inventario

Como administrador, abrir **Productos → Nuevo producto**. Registrar SKU, marca, modelo, categoría, talla, color, costo, precio, mínimo y stock inicial. Cada talla/color constituye una variante independiente. El lápiz permite editar o desactivar una variante; así se conserva su historial.

**Inventario** permite consultar todas las existencias o solo las que están en su mínimo o menos. Administrador y almacén pueden abrir **Movimientos** y **Ajustar inventario**. Una cantidad positiva es una entrada; una negativa, una salida. Siempre debe indicarse el motivo. El sistema impide dejar stock negativo.

## 4. Proveedores y compras

1. Como administrador, registrar el proveedor en **Proveedores**.
2. En **Compras**, pulsar **Nueva compra**.
3. Seleccionar proveedor y variantes; indicar cantidad y costo por par. El costo inicial se propone desde el catálogo y es editable.
4. Guardar. La compra queda **Por recibir** y el stock no cambia.
5. Administrador o almacén pulsa **Recibir**. Revisar cantidades y confirmar la recepción completa.
6. Consultar el nuevo stock y los movimientos. La misma compra no puede recibirse dos veces.

La compra no representa un pago de efectivo. Los pagos a proveedores/cuentas por pagar no forman parte de esta versión. Si se quiere demostrar un egreso físico, registrarlo expresamente en Caja con su motivo.

## 5. Ventas y constancia

1. Verificar que exista una caja de hoy abierta. Si quedó una de un día anterior, cerrarla y abrir la nueva.
2. Pulsar **Nueva venta**, buscar el producto y seleccionar la variante exacta.
3. Ajustar cantidades con `+` y `−`; al quitar la última unidad se elimina esa línea del carrito.
4. Elegir cliente o **Cliente general** y medio de pago.
5. Revisar el total y pulsar **Confirmar venta**.
6. Se muestra una constancia interna. **Imprimir / guardar PDF** abre el diálogo de impresión del navegador; allí se puede seleccionar Guardar como PDF.

El sistema valida las existencias en el servidor, descuenta el inventario y registra el movimiento. Solo el pago en efectivo ingresa a la caja física. Los precios se obtienen del catálogo del servidor.

Para consultar una venta anterior, abrir **Ventas** y pulsar la flecha de su fila. Las constancias no son comprobantes tributarios.

## 6. Caja

**Abrir caja:** ingresar el fondo inicial. Solo puede existir una caja abierta para la tienda.

**Registrar movimiento:** elegir ingreso o egreso, importe y motivo. No registrar otra vez el efectivo de una venta: se registra automáticamente.

**Cerrar caja:** contar el efectivo real e ingresar ese importe. El sistema guarda esperado, contado y diferencia; el historial conserva el resultado. Diferencia positiva significa sobrante y negativa significa faltante.

## 7. Reportes

Como administrador, seleccionar fechas Desde/Hasta y pulsar **Aplicar período**. Revisar ventas, pares vendidos, margen bruto y medios de pago. Las pestañas muestran más vendidos, stock actual, stock mínimo y movimientos de caja.

Los gráficos muestran días individuales en rangos de hasta 31 días. Para períodos mayores agrupan todas las ventas en hasta doce intervalos e indican sus límites al pasar el cursor sobre cada barra.

**Exportar ventas** descarga las ventas del rango; **Exportar vista** descarga la pestaña seleccionada. Los CSV usan punto y coma y codificación UTF-8 con BOM para facilitar su apertura en Excel. Si hay una búsqueda activa, la exportación respeta el filtro de la vista. Las fechas del CSV se identifican como UTC; la pantalla muestra Lima.

## 8. Usuarios

Como administrador, crear/editar usuarios, asignar rol y activar/desactivar cuentas. Una nueva contraseña requiere al menos 8 caracteres; al editar, dejarla vacía conserva la actual. Cambiar rol, contraseña o desactivar revoca las sesiones del usuario afectado.

## Guion sugerido para exponer (8–10 minutos)

1. Presentar objetivo, límites y referencia funcional Delvet (1 min).
2. Entrar como administrador y mostrar dashboard (1 min).
3. Mostrar SKU por talla/color y alerta de stock (1 min).
4. Registrar o recibir una compra y revisar incremento de stock (1 min).
5. Registrar una venta, mostrar descuento de stock y constancia (2 min).
6. Registrar egreso y cerrar caja comparando esperado/contado (1 min).
7. Mostrar filtros y exportación de reportes (1 min).
8. Cerrar sesión y entrar como almacén o vendedor para demostrar permisos (1 min).

Relacionar cada módulo con los RF y paquetes 1.4.1–1.4.7 de la EDT. Mostrar `docs/REQUISITOS.md` y `docs/PRUEBAS.md` como evidencia de trazabilidad y verificación.
