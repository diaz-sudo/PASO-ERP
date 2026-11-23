# Editar y colaborar con PASO ERP

Versión **1.2.0**. La entrega contiene código fuente legible, sin compilar ni ofuscar. Puedes modificarlo con cualquier editor y ejecutarlo desde la terminal.

## Abrir y ejecutar

Extrae el ZIP y abre **toda la carpeta `PASO-ERP`** en Visual Studio Code u otro editor. Debe mostrar `package.json`, `public/`, `server/`, `scripts/` y `tests/`.

En Visual Studio Code: Archivo → Abrir carpeta; después Terminal → Nueva terminal. Si tienes instalado su comando, `code .` también abre la carpeta actual.

Con Node.js 22.14 o posterior instalado, ejecutar desde la raíz:

```powershell
npm run diagnostico
npm run dev
```

Abrir **http://127.0.0.1:3100**. `dev` reinicia el servidor al modificar el backend. Al cambiar HTML, CSS o JavaScript en `public/`, guardar y recargar el navegador. Si muestra una versión anterior, usar `Ctrl+F5`.

Para un inicio normal: `npm start`. Para detener: `Ctrl+C`. Ejecutar una sola instancia por puerto. No se requiere `npm install` porque esta versión no tiene dependencias externas.

## Dónde modificar cada cosa

| Archivo | Responsabilidad |
| --- | --- |
| `public/index.html` | Documento principal y metadatos. |
| `public/app.js` | Pantallas, menú, formularios, carrito, API y exportación CSV. |
| `public/styles.css` | Colores, tamaños, distribución, móvil e impresión. |
| `public/icons.js` | Iconos e ilustración de zapatilla en SVG. |
| `server/server.mjs` | Arranque, puerto y cierre del proceso. |
| `server/app.mjs` | Rutas HTTP, solicitudes, acceso y respuestas. |
| `server/auth.mjs` | Contraseñas, sesiones, roles y permisos. |
| `server/domain.mjs` | Reglas de inventario, compra, venta, caja y mantenimiento. |
| `server/queries.mjs` | Consultas para pantallas, indicadores y reportes. |
| `server/validation.mjs` | Validación de textos, cantidades, importes y fechas. |
| `server/schema.sql` | Tablas, índices y restricciones. |
| `server/database.mjs` | Apertura de SQLite y datos iniciales. |
| `tests/erp.test.mjs` | Pruebas del comportamiento mediante HTTP. |
| `docs/` | Requisitos, decisiones, manuales y avance compartido. |

La interfaz utiliza rutas `/api/...`; las reglas y permisos se verifican en el servidor. Ocultar un botón no sustituye esa validación.

## Ejemplos de cambios

**Textos y colores:** buscar el texto en `public/app.js` o `public/index.html`. Los estilos y variables principales están en `public/styles.css`. Guardar y recargar. Las pantallas conservan la presentación de la tienda y las cuentas de prueba; no agregar referencias al origen académico o al proceso de desarrollo.

**Validaciones o reglas:** revisar `server/domain.mjs`, `server/validation.mjs` y el requisito en `docs/REQUISITOS.md`. Si cambia un caso de negocio, actualizar su prueba de comportamiento.

**Campos nuevos:** revisar tabla, validación, consulta, ruta y formulario. Preparar una migración para bases existentes: `CREATE TABLE IF NOT EXISTS` no modifica una tabla ya creada. No resolverlo borrando la base.

**Datos iniciales:** la carga de `server/database.mjs` se ejecuta solamente en una base nueva. Editarla no reemplaza la información ya guardada. Para experimentar, elegir una base independiente.

## Base separada para experimentar

En PowerShell:

```powershell
$env:DB_PATH = 'data/experimentos.sqlite'
$env:PORT = '3101'
npm run dev
```

Abrir **http://127.0.0.1:3101**. Esa instancia conserva la base habitual `data/erp.sqlite`.

Al terminar, detener el proceso y volver a la configuración normal en esa terminal:

```powershell
Remove-Item Env:DB_PATH -ErrorAction SilentlyContinue
Remove-Item Env:PORT -ErrorAction SilentlyContinue
npm start
```

Estos comandos quitan variables de la terminal; no borran archivos.

## Verificar antes de compartir

```powershell
npm run check
npm test
```

Para validar además el inicio, operaciones y reinicio del proceso:

```powershell
npm run test:entrega
```

Las pruebas utilizan bases temporales. Si PowerShell bloquea npm, puedes usar sus equivalentes directos:

```powershell
node scripts/doctor.mjs
node scripts/check.mjs
node --test tests/*.test.mjs
node scripts/smoke-distribution.mjs
node --watch server/server.mjs
```

## Colaboración

- Acordar quién modifica cada módulo y registrar cambios importantes en `docs/AVANCE.md`.
- Usar Git si el equipo ya tiene un repositorio, o preparar un nuevo ZIP después de comprobar los cambios.
- Compartir código y documentación. Cada integrante conserva su base local; las ventas no se sincronizan al copiar el código.
- No versionar ni incluir bases personales, sesiones o `.env` reales. `.gitignore` ya contempla esas exclusiones.
- Leer `AGENTS.md`, requisitos y arquitectura antes de cambiar reglas o alcance.

`.editorconfig` unifica UTF-8, finales de línea e indentación en los editores compatibles. No restringe la edición.
