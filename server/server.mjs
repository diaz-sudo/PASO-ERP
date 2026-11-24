import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.mjs';
import { createApp } from './app.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path = resolve(root,process.env.DB_PATH || 'data/erp.sqlite');
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3100);
if(!Number.isInteger(port) || port<0 || port>65535) {
  console.error('PORT debe ser un entero entre 1 y 65535 (0 se reserva para pruebas).');
  process.exit(1);
}
const db = openDatabase(path);
const app = createApp(db,{secureCookie:process.env.COOKIE_SECURE==='true'});
app.listen(port,host,() => console.log(`PASO ERP disponible en http://${host}:${app.address().port}\nBase de datos: ${path}\nCtrl+C para detener.`));
app.on('error',error => {
  console.error(error.code === 'EADDRINUSE' ? `El puerto ${port} está ocupado. Usa otro valor en PORT.` : error.message);
  db.close(); process.exitCode=1;
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,() => app.close(() => { db.close(); process.exit(0); }));
