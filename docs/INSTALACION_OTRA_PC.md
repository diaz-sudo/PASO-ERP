# Instalación en otra PC

Versión de entrega: **1.2.0**, preparada el **30 de octubre de 2026**. Se distribuye código fuente editable; el arranque y las verificaciones se realizan desde consola.

## 1. Requisitos

- Una PC donde puedas instalar y ejecutar Node.js y guardar archivos.
- **Node.js LTS 22.14 o posterior con el módulo `node:sqlite` disponible**. Versión efectivamente utilizada para las verificaciones de esta entrega: 22.14.0.
- Navegador actualizado: Edge, Chrome o Firefox.
- Permiso de escritura en la carpeta extraída. El proyecto no necesita una unidad `D:`.

Descarga Node desde [nodejs.org/en/download](https://nodejs.org/en/download). Elige una versión **LTS**, tu sistema operativo y la arquitectura correspondiente a tu PC. En Windows, el instalador `.msi` permite instalar Node y agregarlo al PATH. No es necesario activar la instalación opcional de herramientas para compilar módulos nativos.

El módulo SQLite viene integrado en las versiones compatibles de Node; el proyecto no usa un servidor de base de datos externo. `npm run diagnostico` comprueba que el módulo esté disponible en la versión que instalaste.

## 2. Extraer el paquete

1. Copia el ZIP a la PC de destino.
2. En Windows, clic derecho → **Extraer todo**.
3. Abre la carpeta `PASO-ERP` que aparece dentro de la ubicación extraída. Debe contener `package.json`, `server/` y `public/`.
4. Puedes mover esta carpeta a `Documentos\PASO-ERP`, `C:\Proyectos\PASO-ERP` o una carpeta propia similar.

Conserva la estructura completa. Abrir solo `public/index.html` mediante doble clic no ejecuta el ERP, porque el login y las operaciones necesitan el servidor.

## 3. Comprobar y arrancar desde consola

1. Después de instalar Node, cierra las ventanas de terminal que ya estuvieran abiertas.
2. Abre una terminal dentro de la carpeta que contiene `package.json`. Puedes usar la terminal integrada de tu editor.
3. Ejecuta `node --version`, `npm run diagnostico` y `npm run check`. Comprueba los mensajes de Node, SQLite, archivos, escritura y puerto.
4. Ejecuta **`npm start`** y mantén esa terminal abierta.
5. Cuando aparezca `PASO ERP disponible en http://127.0.0.1:3100`, abre esa dirección en tu navegador.

No se requiere ejecutar como administrador ni instalar paquetes npm para ejecutar la aplicación. Si Windows solicita permisos al instalar Node, corresponde al instalador de Node, no al ERP.

### Comandos completos

Abre una terminal dentro de la carpeta que contiene `package.json`:

```powershell
node --version
npm run diagnostico
npm run check
npm start
```

Si estás en otra carpeta, entra primero a la ubicación donde extrajiste el proyecto. Ejemplo, que debes ajustar a tu PC:

```powershell
Set-Location -LiteralPath 'C:\Proyectos\PASO-ERP'
npm start
```

En macOS/Linux, instala Node compatible, abre una terminal en la carpeta del proyecto y utiliza los mismos comandos npm. La entrega se verificó en Windows, no en esos otros sistemas.

### Abrir y editar el código

Abre la carpeta completa `PASO-ERP` en Visual Studio Code u otro editor y ejecuta **`npm run dev`** desde su terminal. El servidor reinicia al guardar cambios en el backend; para cambios en la interfaz, recarga el navegador. La guía `docs/DESARROLLO.md` explica qué archivo modificar para cada tipo de cambio y cómo colaborar.

## 4. Primer acceso

| Rol | Correo | Contraseña | Para qué probarlo |
| --- | --- | --- | --- |
| Administrador | `admin@paso.pe` | `Admin123!` | Todos los módulos, reportes y usuarios. |
| Vendedor | `ventas@paso.pe` | `Ventas123!` | Ventas, clientes y caja. |
| Almacén | `almacen@paso.pe` | `Almacen123!` | Inventario, ajustes y recepción de compras. |

En el primer arranque se crea `data/erp.sqlite` con datos de demostración. En arranques posteriores se conservan las operaciones; no se vuelve a llenar la base.

La caja inicial está abierta el día en que se creó la base. Si pruebas otro día, entra a **Caja**, cierra la caja anterior indicando el efectivo esperado que muestra la pantalla y abre la de hoy. Esto permite comenzar una nueva demostración con las reglas normales del sistema.

## 5. Ver las funcionalidades

Abre `GUIA_RAPIDA.html` para una vista resumida y sigue `docs/FUNCIONALIDADES.md` para un ejercicio que conecta producto → compra → recepción → venta → caja → reporte.

No es necesario ingresar datos reales de una tienda ni cuentas bancarias. Tarjeta y transferencia son etiquetas del medio de pago: no se conectan a servicios externos.

## 6. Solución de problemas

| Mensaje o síntoma | Qué hacer |
| --- | --- |
| `node no se reconoce` / no se encontró Node | Instalar Node LTS desde la web oficial, cerrar y volver a abrir la terminal. Comprobar `node --version`. |
| Node anterior a 22.14 / `No such built-in module: node:sqlite` | Instalar una versión compatible. El diagnóstico señala el requisito; no intentar instalar un paquete llamado sqlite para resolverlo. |
| `ExperimentalWarning: SQLite` | En Node 22.14 es un aviso del módulo integrado. Si después aparece la dirección del servidor, el proyecto está funcionando. |
| `El puerto 3100 está ocupado` | Puede que el ERP ya esté abierto. Primero probar http://127.0.0.1:3100. Si otro programa usa ese puerto, elegir otro como se explica debajo. |
| Faltan archivos o no encuentra `package.json` | Extraer todo el ZIP y abrir la terminal en la carpeta donde está `package.json`. |
| `EACCES`, `EPERM` o no puede crear datos | Mover la carpeta a Documentos o una carpeta propia con permiso de escritura. No se necesita cambiar la seguridad del sistema. |
| El navegador no conecta | Confirmar que la ventana del servidor sigue abierta y usar la dirección/puerto impresos allí. `127.0.0.1` se abre en la misma PC. |
| PowerShell bloquea `npm.ps1` | Usar directamente `node scripts/doctor.mjs` y `node server/server.mjs`; no hace falta cambiar la política de ejecución de PowerShell. Para desarrollo: `node --watch server/server.mjs`. |
| Se olvidó la contraseña de una cuenta nueva | Entrar como administrador y editar ese usuario. Las credenciales iniciales solo corresponden a cuentas de demostración que no se hayan cambiado. |
| Error por demasiados intentos de login | Esperar el período de bloqueo de 15 minutos antes de volver a intentar con los datos correctos. |
| No deja vender por caja cerrada o de otro día | Cerrar la anterior si existe y abrir la caja de hoy. Ver sección Caja en el manual. |
| Mi amigo no ve mis ventas | Cada instalación tiene su propia base. El ZIP crea datos iniciales; no sincroniza operaciones entre PC. |

Para otro puerto, abrir PowerShell dentro de la carpeta del proyecto:

```powershell
$env:PORT = '3101'
node server/server.mjs
```

Abrir entonces **http://127.0.0.1:3101**. Si ya probaste otra configuración de HTTPS, la instalación HTTP local debe usar la configuración predeterminada `COOKIE_SECURE=false`.

## 7. Guardar y trasladar datos

Para un respaldo, detener el servidor con `Ctrl+C` y copiar la carpeta `data/` completa a un lugar seguro. No copiar una base abierta durante una operación.

Para continuar con los mismos datos en otra PC:

1. Detener los servidores en ambas PC.
2. Respaldar la carpeta `data/` de cada instalación.
3. Copiar la carpeta de datos acordada a la instalación destino, conservando previamente su respaldo.
4. Iniciar de nuevo y entrar con los usuarios de esa base.

No borrar la base para actualizar el código. Para una demostración nueva e independiente, extraer el ZIP en **otra carpeta**; esa nueva instalación generará su propia base. Esto conserva los datos que ya tenías.

## 8. Comprobación técnica opcional

En una terminal dentro del proyecto:

```powershell
npm run check
npm test
npm run test:entrega
```

Las pruebas automáticas usan bases temporales; no alteran `data/erp.sqlite`. `test:entrega` arranca un proceso real, usa una ruta con espacios, prueba los tres roles, ejecuta una venta/compra/caja y reinicia el proceso para comprobar persistencia.

## 9. Contenido del ZIP

Incluye código fuente, archivos estáticos, scripts, pruebas, guías `.md`, guía HTML, plantilla `.env.example`, `TareaSemana4.docx` y `CONTENIDO-SHA256.txt` para verificar sus archivos.

No incluye Node, `node_modules`, carpetas Delvet, una base SQLite existente, sesiones de la PC original, `.env` reales ni salidas de pruebas. El sitio no está alojado en internet; se ejecuta localmente.
