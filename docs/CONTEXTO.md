# Contexto y decisiones del proyecto

## Pedido del usuario

Crear un ERP sencillo para una tienda de zapatillas como proyecto académico del curso Administración de Proyectos. Tomar como referencia el ERP de Delvet trabajado previamente en su PC. El login es obligatorio. Dejar guías Markdown para conservar contexto y continuar sin empezar de cero.

## Fuentes consultadas

- `D:\adm proyectos Cesar\TareaSemana4.docx`: alcance, RF01–RF12 y paquetes de trabajo de la EDT. Fue leído; se conserva intacto.
- `D:\delvet sistemas web\SISTEMA-DE-VENTAS.V4\frontend\package.json` y `backend\package.json`: Angular/PrimeNG, Node/Express/PostgreSQL y servicios complementarios.
- `D:\delvet sistemas web\SISTEMA-DE-VENTAS.V4\frontend\src\app\app.routes.ts`: separación por módulos, login, guardas y permisos.
- Estructura y rutas de autenticación del backend V4.
- `D:\delvet sistemas web\SISTEMA-DE-VENTAS-GAMARRA-V1\README.md`: referencia de división frontend/backend/datos.

Solo se consultaron archivos de código y documentación; no se reutilizaron bases empresariales, archivos `.env`, secretos ni información del negocio.

## Adaptación de Delvet

Se conservaron los conceptos de módulos separados, acceso por rol y relación entre compras, inventario, ventas y caja. Se implementó una aplicación nueva y pequeña, evitando copiar el ERP completo y sus dependencias.

Tecnología elegida: HTML/CSS/JavaScript modular y Node.js con SQLite nativo. Facilita que el equipo académico lo ejecute con un solo comando y entienda el código. El usuario no exigió conservar Angular ni PostgreSQL. Un cambio de stack es una ampliación técnica que debe evaluarse si el docente lo exige.

Nombre de demostración: **PASO**, tienda **Paso Sneakers**. Es una propuesta inicial y se puede cambiar. Estilo visual: verde oscuro, fondos claros y acentos salvia; ilustraciones SVG locales, sin recursos remotos obligatorios.

## Alcance acordado por el documento

Una sola tienda, una caja abierta a la vez y moneda PEN. Usuarios administrador, vendedor y almacén. Productos definidos por SKU, marca, modelo, categoría, talla, color, precio, costo y stock mínimo.

Excluye aplicación móvil independiente, comercio electrónico, múltiples sucursales, pasarelas, facturación electrónica, contabilidad integral, cambios y devoluciones automatizados, migración masiva y soporte permanente.

El documento académico menciona equipo, EDT, RACI y gestión del proyecto. Esos entregables pertenecen a la documentación del curso; no significan que el ERP deba incluir un gestor de proyectos o un tablero de tareas.

## Cómo retomar

1. Leer `AGENTS.md`, esta guía y `docs/AVANCE.md`.
2. Comprobar si el servidor de `127.0.0.1:3100` ya está activo antes de abrir otro.
3. Consultar `server/schema.sql` y el módulo afectado antes de editar.
4. Mantener reglas y permisos en backend aunque se oculten botones en la interfaz.
5. Ejecutar las verificaciones y registrar resultados reales en `AVANCE.md`.
