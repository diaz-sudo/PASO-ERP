# PASO ERP — código fuente editable

Este paquete contiene todo el código de la interfaz y del servidor, pruebas y guías. Abre la carpeta completa en Visual Studio Code u otro editor para modificarlo. Se ejecuta con comandos de consola y no depende de las carpetas de Delvet.

## Arranque rápido en Windows

1. **Extrae todo el ZIP**. No ejecutes los archivos desde la ventana del ZIP. La carpeta resultante se llama `PASO-ERP`.
2. Instala **Node.js LTS, versión 22.14 o posterior**, desde [la página oficial](https://nodejs.org/en/download). Mantén la opción de agregar Node al PATH. No hace falta instalar herramientas adicionales de compilación.
3. Si acabas de instalar Node, cierra las terminales anteriores. Abre una terminal dentro de la carpeta extraída, donde está `package.json`.
4. Ejecuta los comandos siguientes y conserva abierta la terminal del servidor:

```powershell
node --version
npm run diagnostico
npm start
```

5. Abre tu navegador en **http://127.0.0.1:3100** e inicia sesión.

No necesitas `npm install`, Angular CLI, PostgreSQL, MySQL, XAMPP, Redis ni internet para utilizarlo una vez instalado Node. SQLite está incluido en Node. La primera ejecución crea la base y los datos ficticios automáticamente.

Si PowerShell bloquea npm, usa `node scripts/doctor.mjs` y `node server/server.mjs` directamente.

## Editar y trabajar en equipo

Abre toda la carpeta en tu editor y ejecuta desde su terminal:

```powershell
npm run dev
```

El servidor se reinicia al modificar el backend. Para cambios en la interfaz, guarda y recarga el navegador.

| Carpeta | Qué editar |
| --- | --- |
| `public/` | Pantallas, estilos, navegación, formularios e iconos. |
| `server/` | API, acceso, permisos, reglas de negocio y datos. |
| `tests/` | Pruebas de comportamiento. |
| `docs/` | Guías y decisiones compartidas. |

Antes de compartir cambios, ejecutar `npm run check` y `npm test`. Consulta `docs/DESARROLLO.md` para el recorrido del código y la colaboración.

## Accesos

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@paso.pe` | `Admin123!` |
| Vendedor | `ventas@paso.pe` | `Ventas123!` |
| Almacén | `almacen@paso.pe` | `Almacen123!` |

Los botones del login completan estos datos; después pulsa **Entrar a mi tienda**.

## Qué abrir después

- **`GUIA_RAPIDA.html`**: guía visual que se abre en el navegador incluso antes de iniciar el servidor.
- **`docs/INSTALACION_OTRA_PC.md`**: instalación detallada, solución de problemas y respaldo.
- **`docs/FUNCIONALIDADES.md`**: qué hace cada módulo y un ejercicio de principio a fin.
- **`docs/DESARROLLO.md`**: cómo editar, ejecutar y compartir cambios en equipo.
- **`docs/MANUAL.md`**: manual y guion de exposición.
- **`AGENTS.md`** y **`docs/AVANCE.md`**: instrucciones y contexto para continuar el desarrollo.

## Datos de la entrega

Esta distribución no incluye la base de la PC original, sesiones ni archivos `.env` reales. En tu PC se generarán tres usuarios de prueba, 12 variantes de zapatillas, 5 clientes, 3 proveedores, 32 ventas ficticias, cajas de demostración y una compra pendiente.

El ZIP no contiene Node; se instala por separado. La dirección `127.0.0.1` funciona dentro de la PC donde ejecutas el sistema. Compartir el ZIP no sincroniza datos entre computadoras.

Para detener: `Ctrl+C` en la terminal del servidor. Para volver a entrar: `npm start`. Los datos guardados se conservan en `data/erp.sqlite`.
