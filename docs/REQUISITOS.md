# Requisitos y trazabilidad

Fuente: sección 1.4 de `TareaSemana4.docx`. Implementación inicial para demostración local.

| Código | Funcionalidad | Criterio de aceptación | Módulo / implementación |
| --- | --- | --- | --- |
| RF01 | Iniciar/cerrar sesión y permisos | Credenciales válidas permiten acceso; inválidas se rechazan; logout revoca sesión; backend responde 401/403 cuando corresponde. | Login, `auth.mjs`, `app.mjs` |
| RF02 | Administrar usuarios y roles | Administrador crea, edita y desactiva cuentas; no puede desactivar su propia cuenta ni quitarse su rol; se protege al último administrador. | Usuarios, `saveUser` |
| RF03 | Marcas, modelos, tallas, colores y precios | Se registra/edita cada variante con SKU único, costo, precio, categoría y estado. | Productos, `saveProduct` |
| RF04 | Existencias por variante | Se muestran pares disponibles, mínimos y alertas con búsqueda por modelo, SKU, talla y color. | Inventario, `listProducts` |
| RF05 | Entradas, salidas y ajustes con motivo | Administrador/almacén registra cantidad positiva o negativa y motivo; no se permite stock negativo. | Inventario, `adjustStock`, `stock_movements` |
| RF06 | Proveedores y compras | Administrador mantiene proveedores y registra compras con cantidades/costos. | Proveedores, Compras, `createPurchase` |
| RF07 | Recepción de mercadería | Compra pasa de pendiente a recibida; suma existencias; crea movimientos; no admite segunda recepción. | Compras, `receivePurchase` |
| RF08 | Ventas, importe y medio de pago | Se selecciona variante/cantidad/cliente y efectivo, tarjeta o transferencia; total se calcula en servidor. | Ventas, `createSale` |
| RF09 | Validación y descuento de stock | Sin stock suficiente falla la venta completa; confirmaciones repetidas con igual ID no duplican operación. | Transacción de `createSale` |
| RF10 | Constancia interna | Venta confirmada genera detalle consultable e imprimible, claramente sin valor tributario. | `saleDetail`, modal de constancia |
| RF11 | Apertura, ingresos/egresos y cierre | Fondo + ventas en efectivo + otros ingresos − egresos = esperado; se guarda contado y diferencia. | Caja, `openCash`, `moveCash`, `closeCash` |
| RF12 | Reportes | Fechas inclusivas de Lima filtran ventas, productos más vendidos y caja; existencias/mínimos muestran stock actual; CSV exporta vistas. | Reportes, `queries.mjs` |

## Matriz de acceso

| Función | Administrador | Vendedor | Almacén |
| --- | --- | --- | --- |
| Login y cierre de sesión | Sí | Sí | Sí |
| Catálogo y consulta de stock | Sí | Sí | Sí |
| Crear/editar productos y costos | Sí | No | No |
| Ajustes y movimientos de inventario | Sí | No | Sí |
| Clientes y ventas | Sí | Sí | No |
| Proveedores y crear compras | Sí | No | No |
| Consultar/recibir compras | Sí | No | Sí |
| Apertura, movimientos y cierre de caja | Sí | Sí | No |
| Reportes y exportaciones | Sí | No | No |
| Administrar usuarios | Sí | No | No |

En esta versión, el rol vendedor incluye autorización de caja. Si se requiere distinguir vendedores autorizados, agregar un permiso independiente y su validación en backend.

## Reglas de aceptación transversales

- Las pantallas no bastan como control de seguridad: toda mutación comprueba el rol en servidor.
- Compra pendiente no aumenta stock; recepción no registra automáticamente un pago a proveedor.
- Todas las ventas requieren una caja del día abierta. Solo efectivo incrementa el saldo de caja.
- Cada ajuste conserva usuario y motivo; no se editan directamente cantidades desde Productos.
- El costo en cada detalle de venta conserva el valor histórico para calcular el margen bruto.
- Productos se desactivan para conservar el historial. No se eliminan ventas ni movimientos históricos desde la interfaz.
- Los datos introducidos persisten al reiniciar el servidor y al recargar la página.
