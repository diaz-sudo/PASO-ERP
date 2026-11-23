// Comprobacion del servidor real con una base temporal. No modifica data/erp.sqlite.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const temp=mkdtempSync(join(tmpdir(),'PASO ERP - PC de prueba '));
const database=join(temp,'datos con espacios','erp.sqlite');
let child,base;
const ok=label=>console.log(`[OK] ${label}`);

async function start() {
  child=spawn(process.execPath,[resolve(root,'server/server.mjs')],{cwd:temp,env:{...process.env,HOST:'127.0.0.1',PORT:'0',DB_PATH:database,COOKIE_SECURE:'false'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  const current=child;
  base=await new Promise((done,reject)=>{
    let output='',errors='';
    const timer=setTimeout(()=>reject(new Error(`El servidor no inicio en 12 segundos. ${errors}`)),12000);
    current.stderr.on('data',chunk=>{errors=(errors+chunk).slice(-2000);});
    current.once('error',error=>{clearTimeout(timer);reject(error);});
    current.once('exit',code=>{clearTimeout(timer);reject(new Error(`El servidor termino con codigo ${code}. ${errors}`));});
    current.stdout.on('data',chunk=>{
      output+=chunk;
      const url=/PASO ERP disponible en (http:\/\/127\.0\.0\.1:\d+)/.exec(output)?.[1];
      if(url){clearTimeout(timer);done(url);}
    });
  });
}
async function stop() {
  if(!child || child.exitCode!==null)return;
  const current=child;
  await new Promise(resolve=>{
    const timer=setTimeout(()=>{current.kill('SIGKILL');},4000);
    current.once('exit',()=>{clearTimeout(timer);resolve();});
    current.kill('SIGTERM');
  });
  child=null;
}
async function request(path,{body,cookie,method,status=200}={}) {
  const response=await fetch(`${base}/api${path}`,{signal:AbortSignal.timeout(8000),method:method || (body===undefined?'GET':'POST'),headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const value=await response.json();
  assert.equal(response.status,status,`${path}: ${value.error || 'respuesta inesperada'}`);
  return {body:value,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function login(role) {
  const credentials={admin:['admin@paso.pe','Admin123!'],seller:['ventas@paso.pe','Ventas123!'],warehouse:['almacen@paso.pe','Almacen123!']}[role];
  return (await request('/auth/login',{body:{email:credentials[0],password:credentials[1]}})).cookie;
}

try {
  console.log('PASO ERP - Prueba de entrega con servidor y base temporales\n');
  await start();
  assert.equal((await request('/health')).body.ok,true);
  for(const path of ['/','/app.js','/icons.js','/styles.css','/favicon.svg']) {
    const response=await fetch(`${base}${path}`,{signal:AbortSignal.timeout(8000)});
    assert.equal(response.status,200,path);assert.ok((await response.text()).length>0);
  }
  assert.equal((await fetch(`${base}/server/schema.sql`)).status,404);
  ok('Arranque desde una carpeta distinta, con espacios; recursos web completos.');
  await request('/bootstrap',{status:401});
  const admin=await login('admin'),seller=await login('seller'),warehouse=await login('warehouse');
  const baseline=(await request('/bootstrap',{cookie:admin})).body;
  assert.equal(baseline.products.length,12);assert.equal(baseline.sales.length,32);
  assert.equal(baseline.users.length,3);assert.equal(baseline.purchases[0].status,'pending');
  const sellerData=(await request('/bootstrap',{cookie:seller})).body;
  assert.equal(sellerData.users,undefined);assert.equal(sellerData.products[0].cost,undefined);
  await request('/reports',{cookie:warehouse,status:403});
  ok('Instalacion limpia: 3 roles, 12 variantes, 32 ventas ficticias y compra pendiente.');

  const product=(await request('/products',{cookie:admin,status:201,body:{sku:'DEMO-ENVIO-40',brand:'PASO',model:'Prueba de entrega',category:'Urbanas',size:'40',color:'Azul',cost:90,price:150,min_stock:2,initial_stock:4}})).body;
  const salePayload={items:[{product_id:product.id,quantity:1}],payment_method:'cash',request_id:randomUUID()};
  const sale=(await request('/sales',{cookie:seller,status:201,body:salePayload})).body;
  assert.equal(sale.total,15000);
  assert.equal((await request('/sales',{cookie:seller,status:201,body:salePayload})).body.id,sale.id);
  const receipt=(await request(`/sales/${sale.id}`,{cookie:seller})).body;
  assert.equal(receipt.items[0].quantity,1);assert.equal(receipt.items[0].unit_price,15000);
  let data=(await request('/bootstrap',{cookie:admin})).body;
  assert.equal(data.products.find(p=>p.id===product.id).stock,3);
  assert.equal(data.cash.current.expected,baseline.cash.current.expected+15000);
  ok('Venta real HTTP, constancia, stock, efectivo e idempotencia.');

  const purchase=(await request('/purchases',{cookie:admin,status:201,body:{supplier_id:baseline.suppliers[0].id,note:'Prueba temporal de entrega',items:[{product_id:product.id,quantity:2,unit_cost:90}]}})).body;
  await request(`/purchases/${purchase.id}/receive`,{cookie:warehouse,body:{},status:201});
  await request(`/purchases/${purchase.id}/receive`,{cookie:warehouse,body:{},status:409});
  await request('/inventory/adjustments',{cookie:warehouse,status:201,body:{product_id:product.id,quantity:-1,reason:'Ajuste de prueba temporal'}});
  data=(await request('/bootstrap',{cookie:admin})).body;
  assert.equal(data.products.find(p=>p.id===product.id).stock,4);
  ok('Compra, recepcion unica y ajuste de almacen integrados con el inventario.');

  await request('/cash/movements',{cookie:seller,status:201,body:{type:'expense',amount:10,reason:'Gasto temporal de prueba'}});
  const expected=baseline.cash.current.expected+15000-1000;
  const close=(await request('/cash/close',{cookie:seller,status:201,body:{counted_amount:expected/100}})).body;
  assert.equal(close.difference,0);assert.equal(close.expected,expected);
  const report=(await request('/reports',{cookie:admin})).body;
  assert.equal(report.totals.count,baseline.sales.length+1);
  assert.equal(report.totals.sales,report.payments.reduce((s,p)=>s+p.total,0));
  ok('Egreso, cierre cuadrado y reportes coherentes.');

  await stop();await start();
  const again=await login('admin');data=(await request('/bootstrap',{cookie:again})).body;
  assert.equal(data.products.length,13);assert.equal(data.sales.length,33);
  assert.equal(data.products.find(p=>p.id===product.id).stock,4);
  assert.equal(data.cash.current,null);
  await request('/auth/logout',{cookie:again,body:{}});
  await request('/auth/me',{cookie:again,status:401});
  ok('Reinicio del proceso conserva datos y cierre; logout revoca acceso.');
  console.log('\nEntrega comprobada. La base habitual del proyecto no se ha modificado.');
}catch(error){console.error(`\n[ERROR] ${error.message}`);process.exitCode=1;}
finally {
  await stop();
  if(dirname(resolve(temp))===resolve(tmpdir()))rmSync(temp,{recursive:true,force:true});
}
