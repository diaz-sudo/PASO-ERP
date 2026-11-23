import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

let failed = false;
for (const folder of ['server','public','scripts','tests']) {
  for (const name of readdirSync(folder).filter(f=>/\.(mjs|js)$/.test(f))) {
    const path = join(folder,name);
    const result = spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    if (result.status !== 0) { failed=true; console.error(result.stderr); }
  }
}
if (failed) process.exitCode=1; else console.log('Sintaxis JavaScript verificada.');
