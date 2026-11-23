# PASO · ERP académico para una tienda de zapatillas

**Código fuente editable · versión 1.2.0.** Abre la carpeta completa en tu editor y ejecuta los comandos desde la terminal. Consulta [la guía de desarrollo](docs/DESARROLLO.md) para modificar el sistema en equipo.

Sistema web local para una sola tienda. Incluye inicio de sesión, tres roles, productos por talla/color, inventario, clientes, proveedores, compras y recepción, ventas, constancias internas, caja y reportes CSV.

Se tomó como referencia funcional Delvet V4 y como alcance el documento `TareaSemana4.docx`. Los proyectos Delvet no fueron modificados ni se copiaron sus datos o credenciales.

**¿Recibiste este proyecto en un ZIP?** Empieza por [LEEME_PRIMERO.md](LEEME_PRIMERO.md), abre [GUIA_RAPIDA.html](GUIA_RAPIDA.html) en tu navegador y consulta la [instalación en otra PC](docs/INSTALACION_OTRA_PC.md). El proyecto se puede extraer en cualquier carpeta propia; no depende de la unidad `D:`.

## Iniciar

Requisito: **Node.js 22.14 o superior con `node:sqlite`**. La versión instalada al desarrollar fue 22.14.0. No requiere instalar paquetes, PostgreSQL, Redis ni un servicio de base de datos.

Abre una terminal PowerShell **dentro de la carpeta donde está `package.json`** y ejecuta:

```powershell
npm run diagnostico
npm start
```

Abrir **http://127.0.0.1:3100**. Mantener la terminal abierta; `Ctrl+C` detiene el servidor. La base SQLite se crea automáticamente en el primer inicio, en `data/erp.sqlite`.

`npm run diagnostico` comprueba Node, SQLite, archivos, permisos y puerto. Si el puerto está ocupado, usa otra terminal dentro del proyecto:

```powershell
$env:PORT = '3101'
npm start
```

Si PowerShell bloquea `npm.ps1`, puedes iniciar directamente con `node server/server.mjs`, sin cambiar la política de ejecución. La advertencia `ExperimentalWarning: SQLite` de Node 22.14 no impide ejecutar el proyecto.

## Accesos de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@paso.pe` | `Admin123!` |
| Vendedor | `ventas@paso.pe` | `Ventas123!` |
| Almacén | `almacen@paso.pe` | `Almacen123!` |

Los botones de demostración del login completan los campos. Luego se debe pulsar **Entrar a mi tienda**. Son cuentas ficticias para la presentación local.

## Qué puedes demostrar

- Autenticación real con contraseñas derivadas mediante scrypt y sesión en cookie HttpOnly.
- Administrador: catálogo, usuarios, proveedores y todas las operaciones.
- Vendedor: catálogo, consulta de stock, clientes, ventas y caja.
- Almacén: catálogo, consulta y ajustes de stock, recepción de compras.
- Compra pendiente → recepción → entrada de inventario, una única vez.
- Venta → validación y descuento de stock → constancia → ingreso en caja si el pago es en efectivo.
- Apertura → ingresos/egresos → cierre con comparación de contado y esperado.
- Reportes por fechas de Lima: ventas, productos vendidos, margen bruto, existencias, mínimos y movimientos de caja.

Se incluyen 12 variantes, 5 clientes, 3 proveedores, un historial ficticio de ventas, cajas anteriores y una compra pendiente. Los datos iniciales se cargan una sola vez. La caja de demostración queda abierta el día de creación; en los siguientes días hay que cerrarla y abrir una nueva.

## Documentación

| Archivo | Para qué sirve |
| --- | --- |
| `LEEME_PRIMERO.md` / `GUIA_RAPIDA.html` | Primeros pasos y guía visual para quien recibe el ZIP. |
| `docs/INSTALACION_OTRA_PC.md` | Instalación detallada, solución de problemas y respaldo. |
| `docs/FUNCIONALIDADES.md` | Recorrido por los módulos con ejercicio y resultados esperados. |
| `docs/ENTREGA.md` | Contenido, integridad y generación del ZIP. |
| `docs/DESARROLLO.md` | Cómo editar, ejecutar y verificar cambios en equipo. |
| `AGENTS.md` | Instrucciones para que Codex continúe el proyecto. |
| `docs/CONTEXTO.md` | Origen, decisiones y alcance académico. |
| `docs/REQUISITOS.md` | RF01–RF12 y criterios de aceptación. |
| `docs/ARQUITECTURA.md` | Componentes, modelo de datos, permisos y reglas. |
| `docs/MANUAL.md` | Uso paso a paso y guion de sustentación. |
| `docs/PRUEBAS.md` | Validación automática y comprobación manual. |
| `docs/AVANCE.md` | Estado de lo implementado y verificado. |

## Desarrollo y comprobaciones

```powershell
npm run dev
npm run check
npm test
npm run diagnostico
npm run test:entrega
```

`dev` reinicia el servidor cuando cambia el backend. Para ver cambios del frontend, recarga el navegador. `check` comprueba la sintaxis; `test` ejecuta pruebas de integración con bases aisladas que no alteran los datos de demostración.

`diagnostico` comprueba el entorno local. `test:entrega` arranca el servidor real con una base temporal, prueba roles, venta, compra, caja y persistencia tras reiniciar. Todos los comandos deben ejecutarse desde la carpeta del proyecto. No se necesita `npm install` porque no existen dependencias externas.

## Datos y límites

- Importes guardados en céntimos enteros; moneda PEN. Las pantallas muestran soles.
- Persistencia en `data/erp.sqlite`; no se usa localStorage como base de datos.
- Para respaldar, detener el servidor y copiar la carpeta `data/`. No borrar ni reemplazar la base para actualizar el código.
- Servidor ligado a `127.0.0.1`, destinado a demostración en esta PC. No se ha publicado en internet.
- Constancias sin valor tributario. No incluye SUNAT, comercio electrónico, múltiples tiendas, contabilidad integral, devoluciones automatizadas ni recuperación por correo.
- Las compras gestionan abastecimiento y recepción. No implementan pagos a proveedores ni cuentas por pagar; un gasto efectivo se registra expresamente en caja.
