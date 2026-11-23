# Verificación del sistema

## Comandos

```powershell
npm run check
npm test
npm run diagnostico
npm run test:entrega
```

Se utiliza `node:test`, HTTP real en puerto libre y SQLite en memoria. La comprobación de persistencia usa un directorio temporal exclusivo. Las pruebas no modifican `data/erp.sqlite`.

El diagnóstico comprueba runtime, módulo SQLite, archivos, escritura y puerto. `test:entrega` lanza un proceso del servidor desde una carpeta diferente con espacios y base temporal, realiza operaciones integradas y reinicia el proceso para verificar persistencia. Se debe ejecutar también desde una copia extraída del ZIP para validar la distribución.

## Casos automáticos

1. Rutas protegidas sin sesión, credenciales incorrectas y acceso válido.
2. Cookie HttpOnly/SameSite y revocación por logout.
3. Sesión vencida y bloqueo de origen externo.
4. Roles: vendedor sin costos/reportes/usuarios; almacén sin ventas/caja y sin costos de compras.
5. Venta en efectivo: stock, caja, detalle e idempotencia; un ID usado con otro contenido se rechaza.
6. Venta con tarjeta: registra ingreso comercial sin alterar efectivo.
7. Venta con una línea sin stock: rollback completo.
8. Dos confirmaciones simultáneas con un único par: solo una se registra.
9. Compra pendiente sin cambio de stock; recepción válida una vez y costo actualizado.
10. Ajustes de almacén con motivo; rechazo de stock negativo y motivo vacío.
11. Ingreso, egreso, saldo esperado, diferencia al cerrar y necesidad de abrir caja para vender.
12. Rechazo de ventas en caja de un día anterior.
13. Creación/desactivación de usuario y protección de la cuenta administradora actual.
14. Reportes: suma por pagos/productos concuerda con ventas; stock concuerda con movimientos; fechas inválidas se rechazan.
15. Altas de producto/cliente/proveedor y validación de SKU duplicado, importes y stock.
16. Límite de intentos de login.
17. Caracteres exactos de contraseña, incluidos espacios iniciales/finales.
18. Límites de fecha de Lima: incluye 05:00 UTC y excluye 05:00 UTC del día siguiente.
19. Persistencia y ausencia de nueva siembra al reabrir la base.
20. Presentación neutral de conceptos del historial inicial de versiones anteriores, sin alterar sus registros ni motivos personalizados.

Los resultados de la última ejecución y la revisión visual se conservan en `AVANCE.md`.

## Lista manual de aceptación

- Login y logout con los tres roles.
- Crear y editar una variante; buscar por SKU/talla/color.
- Ajuste con motivo y consulta de movimientos.
- Crear compra con varias líneas; revisar total; recibir una única vez.
- Carrito: añadir, aumentar, disminuir, eliminar y confirmar; verificar constancia.
- Abrir/cerrar caja y comprobar diferencia; tarjeta no suma efectivo.
- Reportes: cambiar fechas y descargar CSV de las cuatro vistas.
- Verificar impresión/PDF desde navegador.
- Revisar diseño con ancho móvil, menú lateral, formularios y tablas desplazables.
- Recargar y confirmar que sesión/datos persisten.

No marcar como completado un caso manual que no se haya ejecutado. La presencia del botón de imprimir no prueba que la impresión del sistema operativo se haya completado.
