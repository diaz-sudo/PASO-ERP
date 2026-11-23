# Estado del proyecto

## Código fuente y consola — 30 de octubre de 2026 (Lima)

Versión **1.2.0**. El usuario pidió una entrega editable para colaborar y ejecutar por comandos de consola.

- Se retiraron los lanzadores de Windows de la raíz y de la lista de distribución.
- Inicio normal: `npm start`. Desarrollo con reinicio: `npm run dev`. Diagnóstico: `npm run diagnostico`.
- Guías de instalación y HTML actualizadas para usar la terminal.
- Nueva guía `docs/DESARROLLO.md` con mapa del código, edición, pruebas, bases de experimentación y colaboración.
- Código de interfaz y servidor legible; `.editorconfig` para edición consistente. Se conservan las cuentas de prueba y la presentación neutral de las pantallas.
- Archivo de entrega: `PASO-ERP-1.2.0-fuente.zip`.
- Verificado: sintaxis correcta, **20 pruebas aprobadas, 0 fallos**, y prueba de entrega con operaciones/reinicio/persistencia correcta.
- Guía HTML actualizada con siete enlaces internos comprobados y acceso a la documentación de edición. La interfaz conserva la presentación de la tienda y las cuentas de prueba.

Esta sección reemplaza las instrucciones de arranque de las entregas históricas que aparecen debajo. Los datos locales se conservan.

## Presentación de la interfaz — 30 de octubre de 2026 (Lima)

Versión **1.1.1**. A pedido del usuario, las pantallas presentan la tienda sin referencias al origen académico, proyecto, demostración o datos ficticios. Se conservan las cuentas de prueba y el autocompletado de acceso.

- Login, barra lateral, pies de página, metadatos, ayuda y constancias con textos propios de la tienda.
- Guía HTML con presentación neutral.
- Los movimientos iniciales nuevos usan conceptos de inventario y mercadería. Las instalaciones existentes reciben esas mismas descripciones al consultar la API, sin modificar registros, cantidades, importes ni motivos personalizados.
- El contexto de trabajo, requisitos y documento original se conservan para continuar el desarrollo.
- Distribución actual: `PASO-ERP-1.1.1.zip`.
- Verificación: sintaxis correcta, **20 pruebas aprobadas, 0 fallos**, y prueba real de entrega/reinicio correcta.
- Navegador: login y autocompletado, panel, ayuda, inventario/movimientos, caja, reportes y constancia revisados sin referencias al origen académico. Las cuentas de prueba permanecen visibles.

## Distribución para otra PC — 30 de octubre de 2026 (Lima)

Versión **1.1.0**. El usuario pidió continuar y preparar un ZIP completo para enviar a un amigo, con guías para instalar y probar funcionalidades.

### Preparado

- [x] Instalación sin dependencias de las rutas de la PC original.
- [x] `LEEME_PRIMERO.md`, `docs/INSTALACION_OTRA_PC.md` y `docs/FUNCIONALIDADES.md` con recorrido y resultados esperados.
- [x] `GUIA_RAPIDA.html`: guía visual autónoma, se abre en el navegador sin arrancar el servidor.
- [x] Lanzadores `INICIAR.cmd` y `VERIFICAR.cmd` con mensajes de Node ausente, incompatibilidad, archivos, escritura y puerto.
- [x] Diagnóstico `npm run diagnostico` y prueba de servidor real `npm run test:entrega`.
- [x] Empaquetador `scripts/crear-entrega.ps1` con lista permitida, manifiesto SHA-256 y hash del contenedor.
- [x] Base de la PC original conservada; la distribución genera datos ficticios en destino.

### Verificación de origen

- [x] Diagnóstico y sintaxis correctos con Node.js 22.14.0.
- [x] **19 pruebas de integración aprobadas, 0 fallos**.
- [x] Servidor iniciado desde otra carpeta con espacios y base temporal; tres roles, recursos, venta, constancia, compra, recepción, ajuste, caja, reportes y reinicio con persistencia verificados.

### Verificación de la distribución

- [x] Se generó un ZIP candidato y se extrajo a una carpeta nueva con espacios y paréntesis, simulando la ubicación de otra PC.
- [x] **39 entradas del ZIP** y **38 hashes de archivos** comprobados; el manifiesto es la entrada adicional. No contenía bases SQLite, sesiones, `.env` reales ni carpetas de dependencias.
- [x] `VERIFICAR.cmd` ejecutado desde la copia extraída: diagnóstico y sintaxis correctos.
- [x] Desde esa copia: **19 pruebas aprobadas, 0 fallos**, más la prueba real de entrega completa y reinicio con persistencia.
- [x] Guía HTML con sus seis enlaces de navegación internos comprobados; guías de instalación, funciones y manual incluidas.

El ZIP final conserva los mismos archivos de ejecución verificados y actualiza esta documentación con los resultados. Se entrega con su manifiesto interno y hash SHA-256 externo en `entrega/`.

No se ha ejecutado en el equipo físico del destinatario ni se instaló Node por él. Las pruebas fueron en Windows con Node.js 22.14.0; otros sistemas y versiones deben comprobarse con el diagnóstico incluido.

## Entrega inicial — 29 de octubre de 2026 (Lima)

Proyecto creado en `D:\adm proyectos Cesar`. Se revisó Delvet V4 y se extrajeron los requisitos del documento académico. Se mantuvo intacto el material original.

### Implementado

- [x] Aplicación web local, adaptable y en español, bajo la marca de demostración PASO.
- [x] Login real, logout, sesiones de 8 horas y contraseñas scrypt.
- [x] Roles administrador, vendedor y almacén, con permisos en servidor.
- [x] Mantenimiento de usuarios; activación/desactivación y cambio de rol/contraseña.
- [x] Catálogo por SKU, modelo, talla y color, con precio/costo y mínimos.
- [x] Inventario, alertas y movimientos; ajustes con motivo.
- [x] Clientes y proveedores.
- [x] Compras pendientes y recepción transaccional sin duplicados.
- [x] Ventas con carrito, tres medios de pago y validación de stock.
- [x] Constancias internas consultables e imprimibles.
- [x] Apertura, ingresos/egresos y cierre de caja con diferencia.
- [x] Reportes por período y exportaciones CSV.
- [x] Persistencia SQLite y datos ficticios iniciales.
- [x] Guías `.md`, instrucciones de continuidad y lanzador `INICIAR.cmd`.

### Verificado

- [x] `npm run check`: sintaxis correcta.
- [x] `npm test`: **19 pruebas aprobadas, 0 fallos** en la ejecución final. Incluye regresiones para contraseña exacta y límites de fecha de Lima.
- [x] HTTP local: `/api/health` respondió correctamente.
- [x] Navegador: login administrador, panel y carrito; variante talla 40, dos pares y total S/ 718.00.
- [x] Navegador: venta de prueba V-0033, dos Nike Air Force 1 talla 40, pago por transferencia; constancia generada con total S/ 718.00.
- [x] Navegador: reportes filtrados al 29/10/2026 y vista de stock mínimo; CSV descargado correctamente.
- [x] Navegador: login de almacén y vendedor; menús restringidos por rol.
- [x] Navegador: adaptación a 390 × 844 píxeles, sin desborde horizontal del documento; menú móvil y ventana de recepción de compra legibles. Tamaño restaurado después de la prueba.
- [x] Navegador: formulario de nuevo producto y revisión de la recepción de C-0001 sin confirmarla, preservando la compra pendiente para la exposición.
- [x] Navegador: reporte de enero a octubre con agrupación por intervalos, conservando el total de ventas; sin errores en la consola.

### Límites de la verificación

- No se completó la impresión del sistema operativo ni el guardado de PDF; se comprobó la constancia y su acción de impresión disponible.
- Los flujos de compra completa y cierre de caja se verificaron mediante pruebas HTTP transaccionales; no se recorrieron de nuevo íntegramente desde el navegador.
- No se ha verificado alojamiento externo ni acceso desde otra computadora.

### Continuidad

Consultar esta sección antes de trabajar de nuevo. Los cambios guardados en la base local deben preservarse. Las pruebas automáticas crean sus propias bases.

No se ha publicado en internet. La implementación es local y puede iniciarse con `npm start` o `INICIAR.cmd`. Los accesos y procedimientos se encuentran en `README.md` y `MANUAL.md`.

La sesión y la pestaña usadas para pruebas se cerraron al terminar. El servidor de vista previa se detiene al cerrar la entrega; iniciar el proyecto para volver a utilizarlo.

### Mejoras opcionales fuera de la entrega inicial

- Personalizar nombre/logo de la tienda cuando se confirme el negocio del curso.
- Ajustar campos o tecnología si el docente exige un stack específico.
- Añadir recepción parcial, devoluciones o auditoría ampliada solo si se amplía el alcance.
- Preparar acta, cronograma, EDT/RACI final o informe del curso si se solicitan; no se han generado como nuevos documentos Word en esta entrega.
