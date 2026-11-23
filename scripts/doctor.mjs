import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
let failures=0;
const pass=message=>console.log(`[OK] ${message}`);
const fail=message=>{failures++;console.error(`[ERROR] ${message}`);};

console.log('PASO ERP - Diagnostico de instalacion\n');
console.log(`Carpeta: ${root}`);
const [major,minor]=process.versions.node.split('.').map(Number);
if(major>22 || (major===22 && minor>=14))pass(`Node.js ${process.versions.node}`);
else fail(`Node.js ${process.versions.node} no es compatible. Instala Node.js LTS 22.14 o superior: https://nodejs.org/en/download`);

try {
  const {DatabaseSync}=await import('node:sqlite');
  const memory=new DatabaseSync(':memory:');
  const result=memory.prepare('SELECT 1 AS ready').get();memory.close();
  if(result.ready===1)pass('SQLite integrado disponible. No se instala por separado.');
}catch(error){fail(`SQLite integrado no disponible: ${error.message}. Instala una version compatible de Node.js.`);}

const required=['package.json','server/server.mjs','server/schema.sql','server/app.mjs','server/auth.mjs','server/database.mjs','server/domain.mjs','server/queries.mjs','server/validation.mjs','public/index.html','public/app.js','public/icons.js','public/styles.css','public/favicon.svg'];
const missing=required.filter(path=>!existsSync(resolve(root,path)));
if(missing.length)fail(`Faltan archivos: ${missing.join(', ')}. Extrae todo el ZIP y conserva la estructura de carpetas.`);
else pass('Archivos principales completos.');

const database=resolve(root,process.env.DB_PATH || 'data/erp.sqlite');
const dataDir=dirname(database);
let probe;
try {
  mkdirSync(dataDir,{recursive:true});
  probe=resolve(dataDir,`.paso-escritura-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(probe,'PASO ERP: prueba temporal de escritura.',{flag:'wx'});
  unlinkSync(probe);probe=null;
  pass(`Permiso de escritura: ${dataDir}`);
}catch(error){fail(`No se puede escribir en la carpeta de datos: ${error.message}. Extrae el proyecto a una carpeta propia, por ejemplo Documentos\\PASO-ERP.`);}
finally {if(probe&&existsSync(probe))try{unlinkSync(probe);}catch{/* No eliminar ningun archivo diferente al marcador creado. */}}

const host=process.env.HOST || '127.0.0.1';
const port=Number(process.env.PORT || 3100);
if(!Number.isInteger(port) || port<0 || port>65535)fail('PORT debe ser un numero entero entre 1 y 65535 (0 se reserva para pruebas).');
else if(!process.argv.includes('--sin-puerto')) {
  await new Promise(resolve=>{
    const probeServer=createServer();
    probeServer.once('error',error=>{
      fail(error.code==='EADDRINUSE'?`El puerto ${port} esta ocupado. Si PASO ya esta abierto, entra al navegador; para otra instancia usa PORT=3101.`:`No se pudo usar ${host}:${port}: ${error.message}`);
      resolve();
    });
    probeServer.listen(port,host,()=>{pass(`Puerto disponible: ${host}:${probeServer.address().port}`);probeServer.close(resolve);});
  });
}

console.log(`\n${failures?'Diagnostico con errores. Corrige los puntos anteriores.':'Todo listo. Inicia el servidor con: npm start'}`);
process.exitCode=failures?1:0;
