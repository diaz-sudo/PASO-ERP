# Recorrido de funcionalidades

Guía para conocer el ERP y demostrarlo a un compañero o docente. Tiempo orientativo: **15–20 minutos** para el ejercicio completo. Los registros iniciales son ficticios.

## Mapa de módulos

| Módulo | Qué puedes hacer | Rol |
| --- | --- | --- |
| Login | Entrar, ver el menú correspondiente y cerrar sesión. | Todos |
| Resumen | Ver indicadores, ventas recientes, favoritos y alertas. Almacén recibe una vista de existencias. | Todos, según permisos |
| Productos | Buscar modelos/tallas/colores. Administrador crea, edita, fija precios y desactiva variantes. | Todos consultan; administrador mantiene |
| Inventario | Consultar pares, mínimos y agotados; registrar ajustes con motivo y revisar movimientos. | Todos consultan; administrador/almacén ajustan |
| Clientes | Registrar/editar contactos y elegirlos al vender. | Administrador, vendedor |
| Proveedores | Registrar/editar proveedor y persona de contacto. | Administrador |
| Compras | Registrar órdenes pendientes y recibir mercadería una única vez. | Administrador crea; administrador/almacén reciben |
| Ventas | Carrito, cantidades, medios de pago, validación de stock e historial. | Administrador, vendedor |
| Constancia | Consultar detalle e imprimir o guardar como PDF desde el navegador. | Administrador, vendedor |
| Caja | Abrir, registrar ingresos/egresos, cerrar y comparar contado/esperado. | Administrador, vendedor |
| Reportes | Filtrar ventas/caja por fechas; consultar más vendidos, stock y mínimos; exportar CSV. | Administrador |
| Usuarios | Crear cuentas, cambiar rol, contraseña o estado. | Administrador |

## Preparación

1. Iniciar el proyecto y entrar como **administrador**: `admin@paso.pe` / `Admin123!`.
2. Consultar el resumen; en una instalación nueva hay **12 variantes, 5 clientes, 3 proveedores, 32 ventas ficticias y 1 compra pendiente**. No confundir variantes con modelos: una talla/color diferente es otro SKU.
3. Verificar que la caja esté abierta hoy. Si es de una fecha anterior, cerrar y abrir la del día. No es necesario borrar datos para repetir la demostración.

## Ejercicio completo: del producto al reporte

### A. Crear una variante

En **Productos → Nuevo producto**, usar:

| Campo | Valor de ejemplo |
| --- | --- |
| SKU | `PASO-CAMPUS-40-AZUL` |
| Marca | `PASO` |
| Modelo | `Campus académico` |
| Categoría | `Urbanas` |
| Talla / color | `40` / `Azul` |
| Costo / precio | `90.00` / `150.00` soles |
| Stock mínimo / inicial | `2` / `5` pares |

**Resultado:** variante disponible con 5 pares. Buscar el SKU en Productos y en Inventario. Si repites el ejercicio, usa otro SKU para no duplicar uno ya existente.

### B. Comprar y recibir

1. En **Proveedores**, registrar un contacto ficticio o usar uno de los tres existentes.
2. En **Compras → Nueva compra**, elegir proveedor y la variante anterior, **3 pares** a **S/ 90.00**.
3. Guardar y comprobar el total **S/ 270.00** y el estado **Por recibir**.
4. Revisar Inventario: aún debe tener **5 pares**.
5. Volver a Compras, pulsar **Recibir**, revisar cantidades y confirmar.

**Resultado:** compra recibida, stock **8 pares**, movimiento de entrada de **+3**. Se actualiza el costo de la variante. No vuelve a aparecer el botón de recepción para esa compra.

También puedes demostrar recepción usando la compra inicial `C-0001`: suma 10 pares de Nike Air Force 1, talla 42, blanco. Ese ejemplo es independiente del ejercicio Campus.

### C. Registrar una venta

1. Cerrar sesión y entrar como **vendedor**: `ventas@paso.pe` / `Ventas123!`.
2. Comprobar que aparecen Ventas, Clientes y Caja; no aparecen Usuarios ni Reportes.
3. Pulsar **Nueva venta**, buscar `Campus académico` y agregar **2 pares**.
4. Seleccionar **Cliente general** o un cliente registrado y pago **Efectivo**.
5. Revisar el importe de **S/ 300.00** y confirmar.

**Resultado:** stock baja de 8 a **6 pares**; el efectivo esperado de caja aumenta en **S/ 300.00**; aparece una constancia interna con dos unidades. Desde Ventas, volver a abrirla con la flecha de la fila.

La constancia permite abrir el diálogo de impresión y seleccionar Guardar como PDF. Es un documento interno sin valor tributario.

### D. Registrar y cuadrar caja

1. En **Caja**, observar el fondo, ingresos, egresos y efectivo esperado.
2. Registrar un **egreso de S/ 20.00** con motivo `Movilidad de mercadería — demostración`.
3. El efectivo esperado debe disminuir en **S/ 20.00**.
4. Pulsar **Cerrar caja** e ingresar el importe esperado mostrado, como simulación del conteo físico.

**Resultado:** cierre con diferencia **S/ 0.00**, guardado en el historial. Para demostrar faltante, en otro cierre contar menos y observar la diferencia negativa. Abrir una nueva caja antes de volver a vender.

### E. Ajustar el inventario

1. Entrar como **almacén**: `almacen@paso.pe` / `Almacen123!`.
2. Comprobar que no aparecen Ventas, Clientes, Caja ni Reportes.
3. En Inventario registrar un ajuste de **−1 par** de Campus, con motivo `Par deteriorado — demostración`.
4. Consultar Movimientos.

**Resultado del ejercicio, si no hiciste otras operaciones:** stock final **5 pares**. Existe trazabilidad de stock inicial +5, compra +3, venta −2 y ajuste −1.

### F. Revisar reportes y exportar

1. Volver a entrar como administrador.
2. En Reportes, seleccionar la fecha de hoy en Desde y Hasta y pulsar **Aplicar período**.
3. En Más vendidos, buscar `Campus académico`.
4. La venta del ejercicio representa **2 pares**, **S/ 300.00** de ventas y **S/ 120.00 de margen bruto**: 2 × (150 − 90).
5. Consultar Stock actual, Stock mínimo y Movimientos de caja. Las existencias son actuales; no se reconstruye stock histórico.
6. Probar **Exportar ventas** y **Exportar vista**. Abrir el CSV en Excel o LibreOffice; el separador es punto y coma.

## Otras comprobaciones útiles

| Acción | Resultado esperado |
| --- | --- |
| Ingresar contraseña incorrecta | Mensaje de acceso inválido, sin entrar al sistema. |
| Intentar vender 99 pares de una variante con menos stock | La interfaz limita cantidades y el servidor rechaza stock insuficiente. No se registra una venta parcial. |
| Registrar otro SKU idéntico | Se informa que ya existe. |
| Ajustar −99 sobre un stock menor | Se rechaza porque dejaría stock negativo. |
| Vender sin una caja abierta del día | Se pide abrir la caja correcta. |
| Venta con tarjeta o transferencia | Cuenta como venta y descuenta stock; no aumenta el efectivo físico. |
| Desactivar un usuario de prueba desde administrador | No puede ingresar y se revocan sus sesiones existentes. |
| Desactivar tu propia cuenta administradora | Se rechaza para mantener acceso administrativo. |
| Recargar/cerrar e iniciar otra vez el servidor | Se conservan datos y operaciones guardadas. |
| Reducir el ancho del navegador | Aparece menú móvil; tablas pueden desplazarse horizontalmente. |

## Cómo explicar la integración en la exposición

```text
Compra pendiente → recepción → inventario (+)
Venta confirmada → inventario (−) → constancia
                                → caja (+), si se paga en efectivo
Caja: fondo + ventas en efectivo + ingresos − egresos → cierre y diferencia
Reportes → consultas sobre los mismos registros
```

El valor del ERP es que estos módulos comparten datos: las cantidades y los importes no se vuelven a escribir manualmente en cada pantalla.

## Límites que debes presentar con claridad

Una tienda, moneda PEN y horario de Lima. No incluye pasarela de pago, tienda online, SUNAT, comprobantes fiscales, contabilidad integral, múltiples sucursales, devoluciones automáticas, recepción parcial ni pagos a proveedores. Tarjeta/transferencia no ejecutan cobros reales.

Los formularios no envían correos; los proveedores/clientes de ejemplo son ficticios. El proyecto está preparado para demostración local; cada PC conserva su propia base de datos.
