# Datos locales de esta instalación

La primera vez que se inicia el servidor se crea aquí `erp.sqlite`, con usuarios y datos ficticios de demostración. No se distribuye la base de otra PC.

- Cada instalación tiene su propia base y sus propias sesiones.
- Los datos persisten al cerrar y volver a iniciar el sistema.
- Para respaldar: detener el servidor y copiar esta carpeta completa.
- Para llevar datos de una PC a otra: cerrar ambos servidores, respaldar las dos carpetas `data/` y trasladar la copia acordada. No sobrescribir información sin haber hecho el respaldo.
- No borrar la base para actualizar el código. El reinicio de datos requiere una decisión explícita.

Los archivos `.sqlite-wal` y `.sqlite-shm`, cuando existen con el servidor abierto, son parte del funcionamiento de SQLite. No copiarlos aisladamente ni borrarlos durante el uso.
