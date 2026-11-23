# Arquitectura y reglas técnicas

## Componentes

```text
Navegador (HTML + CSS + módulos JavaScript)
          │ HTTP JSON, mismo origen, cookie de sesión
          ▼
Servidor Node.js 22.14+ (node:http)
          │ validación + permisos + transacciones
          ▼
SQLite (node:sqlite) → data/erp.sqlite
```

No hay dependencias npm externas ni paso de compilación. La aplicación funciona sin conexión a internet después de disponer de Node. Los archivos de Delvet son referencias y no forman parte del runtime.

## Estructura

```text
public/
  index.html       Documento principal
  app.js           Vistas, navegación hash, formularios, carrito, CSV
  styles.css       Diseño adaptable y estilos de impresión
  icons.js         Iconos e ilustración SVG de zapatilla
  favicon.svg
server/
  server.mjs       Arranque, host/puerto y cierre
  app.mjs          Rutas HTTP, origen, errores y archivos públicos
  auth.mjs         Contraseñas, sesiones y permisos
  database.mjs     SQLite, transacciones y datos ficticios
  domain.mjs       Operaciones y reglas de negocio
  queries.mjs      Consultas, dashboard y reportes
  validation.mjs   Validación de campos e importes
  schema.sql       Tablas, restricciones e índices
scripts/check.mjs  Comprobación de sintaxis
scripts/doctor.mjs Requisitos, archivos, permisos y puerto
scripts/smoke-distribution.mjs Servidor real con base temporal y reinicio
scripts/crear-entrega.ps1 Empaquetado permitido + manifiesto SHA-256
tests/erp.test.mjs Pruebas HTTP con SQLite aislado
data/             Base local (ignorada por Git)
docs/             Guías de continuidad y presentación
```

## Modelo de datos

| Entidad | Relaciones y responsabilidad |
| --- | --- |
| `users` / `sessions` | Usuario con rol/estado; sesiones con vencimiento, vinculadas al usuario. |
| `products` | Una variante por SKU con stock, costo y precio en céntimos. |
| `customers` | Cliente opcional de una venta. Cliente general no requiere registro. |
| `suppliers` | Proveedor de compras. |
| `purchases` / `purchase_items` | Cabecera y líneas; pendiente/recibida, fecha de recepción. |
| `sales` / `sale_items` | Cabecera y líneas con precio y costo históricos, cliente, vendedor y caja. |
| `stock_movements` | Variación de stock y motivo; referencia a compra o venta cuando corresponda. |
| `cash_sessions` | Fondo, apertura, cierre, esperado, contado y diferencia. Índice asegura una sola abierta. |
| `cash_movements` | Ventas en efectivo, otros ingresos y egresos de la caja. |

Importes enteros evitan errores de coma flotante en sumas. La API recibe importes en soles al crear productos, compras y movimientos; valida y convierte a céntimos. Las respuestas monetarias son en céntimos, formateados en frontend. Los IDs son enteros.

## Transacciones

Venta: `BEGIN IMMEDIATE` → verificar ID de operación → caja del día y stock → cabecera/detalles → descuento de stock → kardex → efectivo si corresponde → `COMMIT`. Ante error se ejecuta `ROLLBACK` y nada queda a medias.

La venta usa `request_id` más una huella del contenido para evitar duplicados al reintentar. La recepción de compra verifica su estado dentro de la transacción. El servidor no confía en precios ni totales enviados desde el navegador.

Las operaciones SQLite son síncronas y breves. Este diseño está dimensionado para la demostración de una tienda; no pretende atender carga empresarial alta.

## Acceso y sesiones

- Hash scrypt con sal aleatoria por contraseña; nunca se devuelven hashes a la interfaz.
- Token de sesión aleatorio; SQLite conserva su SHA-256 y vencimiento de 8 horas.
- Cookie HttpOnly, SameSite=Strict y Path=/; Secure opcional con `COOKIE_SECURE=true` al usar HTTPS.
- Comprobación de origen en mutaciones y política de contenido para recursos del mismo servidor.
- Bloqueo temporal de 15 minutos después de 8 intentos fallidos por cuenta/IP y límite adicional por IP. Este contador es en memoria y se reinicia con el proceso.
- Usuarios desactivados o con contraseña/rol modificado pierden sus sesiones. No hay registro público.
- Roles definidos en `auth.mjs`; validación obligatoria de mutaciones en `domain.mjs`.

No se guardan sesiones, contraseñas ni base de datos en localStorage. Esta versión no implementa recuperación por email, MFA ni administración de sesiones desde pantalla.

## Caja y fechas

```text
Esperado = fondo inicial + ventas en efectivo + otros ingresos − egresos
Diferencia = efectivo contado − esperado
```

Tarjetas/transferencias son ventas, pero no efectivo físico. Un egreso no puede superar el saldo esperado. Una caja de otra fecha puede cerrarse, pero debe abrirse la caja de hoy para registrar nuevas ventas o movimientos.

Timestamps guardados en ISO UTC. Consultas de negocio y pantallas usan America/Lima (UTC−05). Los reportes convierten el rango inclusivo a `[desde 05:00 UTC, día posterior a hasta 05:00 UTC)`. El stock de reportes es actual; no representa un corte histórico.

## API principal

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/logout` | Entrar/salir. |
| GET | `/api/auth/me`, `/api/bootstrap` | Sesión y datos según rol. |
| GET | `/api/dashboard`, `/api/reports` | Indicadores y reportes con `from`/`to`. |
| POST / PUT | `/api/products` / `/api/products/:id` | Variantes. |
| POST | `/api/inventory/adjustments` | Entrada/salida manual con motivo. |
| POST / PUT | `/api/customers`, `/api/suppliers`, `/api/users` y `/:id` | Mantenimientos. |
| POST | `/api/purchases` | Compra pendiente. |
| GET / POST | `/api/purchases/:id` / `/api/purchases/:id/receive` | Detalle/recepción. |
| POST / GET | `/api/sales` / `/api/sales/:id` | Venta/detalle. |
| POST | `/api/cash/open`, `/api/cash/movements`, `/api/cash/close` | Operaciones de caja. |

## Configuración y publicación

`HOST`, `PORT`, `DB_PATH`, `COOKIE_SECURE` son variables de proceso. `.env.example` es orientativo; `npm start` no carga `.env` automáticamente. Si se usa archivo: `node --env-file=.env server/server.mjs`.

Entrega local en esta PC. No se creó un Site alojado ni se publicaron bases o credenciales. Una publicación futura requerirá un host compatible con Node y disco persistente, HTTPS y sustituir las cuentas de demostración. Cloudflare Workers no ejecuta este servidor Node/SQLite local directamente; requeriría adaptación.

## Distribución portable

Las rutas se resuelven desde los módulos, no desde la letra de disco de origen. La carpeta extraída puede cambiar de ubicación. Para usar npm, abrir una terminal en la carpeta que contiene `package.json`: `npm start` inicia el servidor y `npm run dev` activa el seguimiento de cambios. Se distribuye código fuente editable con una guía de desarrollo para colaborar.

El ZIP incluye una carpeta `PASO-ERP/`, documentación de instalación y funcionalidad, una guía HTML autónoma y el documento académico original. Solo lleva `data/README.md`; la base se genera en destino, conservando la de la PC original. El empaquetador añade un manifiesto por archivo y un hash del ZIP. Ver `ENTREGA.md`.
