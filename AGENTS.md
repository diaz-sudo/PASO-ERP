# Guía para continuar este proyecto

## Leer primero
1. `README.md`: ejecución y usuarios de demostración.
   Para una instalación recibida en ZIP, empezar por `LEEME_PRIMERO.md` y `docs/INSTALACION_OTRA_PC.md`.
2. `docs/CONTEXTO.md`: decisiones, referencia Delvet y alcance.
3. `docs/REQUISITOS.md`: RF01–RF12 y criterios de aceptación.
4. `docs/ARQUITECTURA.md`: estructura, reglas de negocio y datos.
5. `docs/AVANCE.md`: estado verificado y siguientes pasos.

## Instrucciones
- Trabajar dentro de la raíz donde se haya extraído este proyecto. En la PC de origen es `D:\adm proyectos Cesar`; esa letra de disco no es un requisito para otras PC. Los proyectos Delvet son referencia de lectura, no modificarlos ni copiar sus secretos, bases de datos o datos empresariales.
- Es un ERP académico para UNA tienda de zapatillas. Respetar los límites de `TareaSemana4.docx`.
- Mantener login real, roles verificados en servidor y persistencia SQLite. No reemplazarlos por simulaciones en localStorage.
- Interfaz y documentación en español; moneda PEN (S/); fechas de negocio en America/Lima.
- En las pantallas, metadatos, ayuda y constancias no mostrar referencias a proyecto académico, desarrollo, demostración o datos ficticios. Mantener las cuentas de prueba del login: el usuario pidió conservarlas. El contexto académico queda en la documentación de trabajo, no en la interfaz de la tienda.
- Distribuir siempre código fuente editable y documentar el arranque por consola con `npm start` y el desarrollo con `npm run dev`. No volver a agregar lanzadores `.cmd`, `.bat` ni instaladores: el usuario pidió quitarlos para trabajar en equipo.
- No agregar multiempresa, SUNAT, contabilidad integral, pagos externos ni servicios innecesarios.
- Actualizar `docs/AVANCE.md` y la documentación afectada después de cambios relevantes. Registrar comprobaciones reales y sus límites.
- Antes de entregar: `npm run check` y `npm test`. Las pruebas usan bases temporales y no deben tocar la base de demostración.
- No borrar `TareaSemana4.docx`, `data/erp.sqlite` ni información de usuario. El reinicio de datos requiere solicitud expresa.
- Nunca versionar `.env`, bases SQLite, registros de sesiones ni credenciales reales.
- Para compartir, ejecutar `scripts/crear-entrega.ps1`: usa una lista de archivos permitidos y excluye bases, sesiones, `.env`, salidas anteriores y carpetas temporales. Verificar el ZIP extrayéndolo y ejecutando sus comprobaciones.
