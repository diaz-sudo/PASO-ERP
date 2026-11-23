# Entrega para compartir

## Identificación

- Proyecto: PASO ERP académico para una tienda de zapatillas.
- Versión del código: **1.2.0**.
- Fecha: **30 de octubre de 2026**, America/Lima.
- Archivo: `PASO-ERP-1.2.0-fuente.zip`.
- Carpeta de primer nivel al extraer: **`PASO-ERP/`**.
- Empezar por **`LEEME_PRIMERO.md`** o la guía visual **`GUIA_RAPIDA.html`**.

## Qué incluye

| Contenido | Finalidad |
| --- | --- |
| `public/` y `server/` | Interfaz y backend completos, esquema SQL y generador de datos ficticios. |
| `scripts/` y `tests/` | Diagnóstico, comprobaciones, pruebas y generación de otra entrega. |
| `.editorconfig` / `docs/DESARROLLO.md` | Edición consistente y guía para colaborar con el código fuente. |
| `package.json` | Arranque y comprobaciones npm, sin dependencias externas. |
| `LEEME_PRIMERO.md` / `GUIA_RAPIDA.html` | Primeros pasos, usuarios y recorrido visual. |
| `docs/` y `AGENTS.md` | Instalación, funciones, manual, contexto, requisitos, arquitectura y avance. |
| `TareaSemana4.docx` | Documento original del alcance académico. |
| `.env.example` / `.gitignore` | Plantilla opcional de configuración y exclusiones. |
| `data/README.md` | Explicación de persistencia y respaldo. |
| `CONTENIDO-SHA256.txt` | Hash SHA-256 de cada archivo del paquete, excepto el propio manifiesto. |

## Datos de destino

La base `data/erp.sqlite` se crea al iniciar. Incluye tres cuentas ficticias, doce variantes, cinco clientes, tres proveedores, treinta y dos ventas de demostración, cajas y una compra pendiente.

No se incluyen bases de otra PC, sesiones previas, `.env` reales, registros ni dependencias instaladas. Node se instala por separado desde su sitio oficial. El ZIP contiene el proyecto para ejecutar con ese runtime; no es un ejecutable autónomo.

## Comprobar antes de enviar

En la carpeta del proyecto:

```powershell
npm run diagnostico
npm run check
npm test
npm run test:entrega
```

Las comprobaciones se realizan sobre los archivos fuente. La prueba de entrega inicia un proceso real con base y ruta temporales, verifica las tres cuentas, recursos web, venta, recepción, ajuste, caja, reportes y persistencia al reiniciar. No modifica la base habitual. Los resultados actuales se registran en `AVANCE.md`.

Para verificar una distribución, extraer el ZIP a una carpeta nueva, comprobar los hashes y ejecutar estos comandos desde esa copia. El estado concreto de esta entrega se registra en `AVANCE.md`.

La versión 1.2.0 elimina los lanzadores y documenta la ejecución por consola y el trabajo en equipo. Conserva las cuentas de prueba y la presentación neutral de la interfaz.

## Generar otro ZIP

Desde PowerShell, dentro del proyecto:

```powershell
& .\scripts\crear-entrega.ps1 -Nombre 'PASO-ERP-1.2.0-fuente.zip'
```

Si el nombre ya existe, el script se detiene para conservar la entrega previa. Elegir otro, por ejemplo `PASO-ERP-revision-2.zip`. Este script no es necesario para usar el ERP.

La salida queda en `entrega/`. Se usa una lista permitida de archivos y directorios. El manifiesto se genera dentro del ZIP y se crea un archivo `.zip.sha256` al lado para comprobar el contenedor.

## Verificar integridad

Comparar el hash del ZIP recibido con el archivo `.sha256` proporcionado:

```powershell
Get-FileHash -LiteralPath '.\PASO-ERP-1.2.0-fuente.zip' -Algorithm SHA256
```

`CONTENIDO-SHA256.txt` contiene líneas `hash  ruta/relativa`, calculadas sobre los bytes de los archivos. Si una comprobación no coincide, volver a copiar el ZIP original antes de instalar. Un hash detecta modificaciones o errores de copia; no es una firma de autoría.

## Compartir

Enviar el ZIP y, si se desea, su `.sha256`. Todo el código fuente y las guías de edición van incluidos. Indicar al destinatario: **Extraer todo → abrir la carpeta en el editor → instalar Node → abrir terminal → `npm run diagnostico` → `npm start` → abrir http://127.0.0.1:3100**. Para editar con reinicio automático: `npm run dev`.
