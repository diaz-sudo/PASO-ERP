import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../server/database.mjs';
import { createApp } from '../server/app.mjs';
import { cashStatus } from '../server/domain.mjs';

describe('ERP académico: integración HTTP, permisos y operaciones',()=>{
  let db,server,base;
  async function request(path,{body,cookie,method,origin}={}) {
    const response=await fetch(`${base}/api${path}`,{method:method || (body===undefined?'GET':'POST'),headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
  }
  async function login(role='admin') {
    const credentials={admin:['admin@paso.pe','Admin123!'],seller:['ventas@paso.pe','Ventas123!'],warehouse:['almacen@paso.pe','Almacen123!']}[role];
    const result=await request('/auth/login',{body:{email:credentials[0],password:credentials[1]}});
    assert.equal(result.status,200);return result.cookie;
  }
  beforeEach(async()=>{db=openDatabase(':memory:');server=createApp(db);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
  afterEach(async()=>{await new Promise(resolve=>server.close(resolve));db.close();});

  it('exige sesión y rechaza credenciales incorrectas',async()=>{
    assert.equal((await request('/bootstrap')).status,401);
    const bad=await request('/auth/login',{body:{email:'admin@paso.pe',password:'incorrecta'}});
    assert.equal(bad.status,401);assert.match(bad.body.error,/incorrectos/);
    const cookie=await login();const me=await request('/auth/me',{cookie});
    assert.equal(me.body.user.role,'admin');assert.equal(me.body.user.password_hash,undefined);
  });
  it('crea cookie HttpOnly y revoca la sesión al salir',async()=>{
    const result=await request('/auth/login',{body:{email:'admin@paso.pe',password:'Admin123!'}});
    assert.match(result.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
    await request('/auth/logout',{body:{},cookie:result.cookie});
    assert.equal((await request('/auth/me',{cookie:result.cookie})).status,401);
  });
  it('rechaza sesiones vencidas y peticiones de otro origen',async()=>{
    const cookie=await login();
    assert.equal((await request('/cash/open',{cookie,body:{opening_amount:0},origin:'https://otro.example'})).status,403);
    db.prepare('UPDATE sessions SET expires_at=?').run('2000-01-01T00:00:00.000Z');
    assert.equal((await request('/auth/me',{cookie})).status,401);
  });
  it('aplica permisos en servidor y oculta costos y datos de administración',async()=>{
    const seller=await login('seller'),warehouse=await login('warehouse');
    const data=(await request('/bootstrap',{cookie:seller})).body;
    assert.equal(data.products[0].cost,undefined);assert.equal(data.users,undefined);assert.equal(data.suppliers,undefined);
    assert.equal((await request('/reports',{cookie:seller})).status,403);
    assert.equal((await request('/products',{cookie:seller,body:{}})).status,403);
    assert.equal((await request('/sales',{cookie:warehouse,body:{}})).status,403);
    const wh=(await request('/bootstrap',{cookie:warehouse})).body;
    assert.equal(wh.sales,undefined);assert.equal(wh.dashboard.totals,undefined);assert.equal(wh.purchases[0].total,undefined);
    assert.equal((await request('/purchases',{cookie:warehouse,body:{}})).status,403);
  });
  it('registra venta en efectivo, descuenta stock y evita reintentos duplicados',async()=>{
    const cookie=await login('seller');const stock=db.prepare('SELECT stock FROM products WHERE id=1').get().stock;
    const before=cashStatus(db).expected;
    const body={items:[{product_id:1,quantity:2}],payment_method:'cash',customer_id:1,request_id:randomUUID()};
    const sale=await request('/sales',{cookie,body});assert.equal(sale.status,201);assert.equal(sale.body.total,71800);
    assert.equal(db.prepare('SELECT stock FROM products WHERE id=1').get().stock,stock-2);
    assert.equal(cashStatus(db).expected,before+71800);
    const again=await request('/sales',{cookie,body});assert.equal(again.body.id,sale.body.id);assert.equal(again.body.repeated,true);
    assert.equal(cashStatus(db).expected,before+71800);
    const changed=await request('/sales',{cookie,body:{...body,payment_method:'card'}});assert.equal(changed.status,409);
    const receipt=await request(`/sales/${sale.body.id}`,{cookie});assert.equal(receipt.body.items[0].quantity,2);assert.equal(receipt.body.customer_name,'Mariana Flores');
  });
  it('con tarjeta registra la venta sin aumentar el efectivo',async()=>{
    const cookie=await login();const before=cashStatus(db).expected;
    const sale=await request('/sales',{cookie,body:{items:[{product_id:1,quantity:1}],payment_method:'card',request_id:randomUUID()}});
    assert.equal(sale.status,201);assert.equal(cashStatus(db).expected,before);
  });
  it('revierte toda una venta si una línea no tiene existencias',async()=>{
    const cookie=await login();const stock=db.prepare('SELECT stock FROM products WHERE id=1').get().stock;
    const count=db.prepare('SELECT COUNT(*) AS n FROM sales').get().n;const before=cashStatus(db).expected;
    const result=await request('/sales',{cookie,body:{items:[{product_id:1,quantity:1},{product_id:7,quantity:999}],payment_method:'cash',request_id:randomUUID()}});
    assert.equal(result.status,400);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1').get().stock,stock);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sales').get().n,count);assert.equal(cashStatus(db).expected,before);
  });
  it('evita sobreventa cuando se confirman dos ventas a la vez',async()=>{
    const cookie=await login();db.prepare('UPDATE products SET stock=1 WHERE id=1').run();
    const results=await Promise.all([1,2].map(()=>request('/sales',{cookie,body:{items:[{product_id:1,quantity:1}],payment_method:'transfer',request_id:randomUUID()}})));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,400]);assert.equal(db.prepare('SELECT stock FROM products WHERE id=1').get().stock,0);
  });
  it('recibe una compra una sola vez y conserva stock hasta recibirla',async()=>{
    const cookie=await login();const warehouse=await login('warehouse');
    const stock=db.prepare('SELECT stock FROM products WHERE id=3').get().stock;
    const purchase=await request('/purchases',{cookie,body:{supplier_id:1,items:[{product_id:3,quantity:7,unit_cost:230.50}],note:'Reposición de prueba'}});
    assert.equal(purchase.status,201);assert.equal(db.prepare('SELECT stock FROM products WHERE id=3').get().stock,stock);
    const receive=await request(`/purchases/${purchase.body.id}/receive`,{cookie:warehouse,body:{}});assert.equal(receive.status,201);
    const p=db.prepare('SELECT stock,cost FROM products WHERE id=3').get();assert.equal(p.stock,stock+7);assert.equal(p.cost,23050);
    assert.equal((await request(`/purchases/${purchase.body.id}/receive`,{cookie:warehouse,body:{}})).status,409);
    assert.equal(db.prepare('SELECT stock FROM products WHERE id=3').get().stock,stock+7);
  });
  it('permite ajustes de almacén con motivo y prohíbe stock negativo',async()=>{
    const cookie=await login('warehouse');const before=db.prepare('SELECT stock FROM products WHERE id=7').get().stock;
    assert.equal((await request('/inventory/adjustments',{cookie,body:{product_id:7,quantity:-1,reason:'Par deteriorado'}})).status,201);
    assert.equal(db.prepare('SELECT stock FROM products WHERE id=7').get().stock,before-1);
    assert.equal((await request('/inventory/adjustments',{cookie,body:{product_id:7,quantity:-999,reason:'Error'}})).status,400);
    assert.equal((await request('/inventory/adjustments',{cookie,body:{product_id:7,quantity:1,reason:''}})).status,400);
  });
  it('calcula ingresos, egresos y diferencia de cierre; exige caja para vender',async()=>{
    const cookie=await login('seller');const before=cashStatus(db).expected;
    assert.equal((await request('/cash/movements',{cookie,body:{type:'income',amount:50,reason:'Aporte de fondo'}})).status,201);
    assert.equal((await request('/cash/movements',{cookie,body:{type:'expense',amount:20,reason:'Movilidad'}})).status,201);
    assert.equal(cashStatus(db).expected,before+3000);
    assert.equal((await request('/cash/movements',{cookie,body:{type:'expense',amount:999999,reason:'Excesivo'}})).status,400);
    const close=await request('/cash/close',{cookie,body:{counted_amount:(before+2500)/100}});
    assert.equal(close.body.difference,-500);assert.equal(close.body.expected,before+3000);assert.equal(cashStatus(db),null);
    assert.equal((await request('/sales',{cookie,body:{items:[{product_id:1,quantity:1}],payment_method:'card',request_id:randomUUID()}})).status,400);
    assert.equal((await request('/cash/open',{cookie,body:{opening_amount:100}})).status,201);
    assert.equal((await request('/cash/open',{cookie,body:{opening_amount:100}})).status,409);
  });
  it('impide vender con una caja que quedó abierta otro día',async()=>{
    const cookie=await login();db.prepare("UPDATE cash_sessions SET opened_at='2000-01-01T14:00:00.000Z' WHERE closed_at IS NULL").run();
    const result=await request('/sales',{cookie,body:{items:[{product_id:1,quantity:1}],payment_method:'cash',request_id:randomUUID()}});
    assert.equal(result.status,400);assert.match(result.body.error,/otra fecha/);
  });
  it('crea usuarios, desactiva su sesión y protege al administrador actual',async()=>{
    const cookie=await login();
    const user=await request('/users',{cookie,body:{name:'Vendedor Prueba',email:'test@paso.pe',password:'Prueba123!',role:'seller',active:1}});assert.equal(user.status,201);
    const session=await request('/auth/login',{body:{email:'test@paso.pe',password:'Prueba123!'}});assert.equal(session.status,200);
    assert.equal((await request(`/users/${user.body.id}`,{cookie,method:'PUT',body:{name:'Vendedor Prueba',email:'test@paso.pe',role:'seller',active:0}})).status,200);
    assert.equal((await request('/auth/me',{cookie:session.cookie})).status,401);
    assert.equal((await request('/users/1',{cookie,method:'PUT',body:{name:'Admin',email:'admin@paso.pe',role:'seller',active:0}})).status,400);
  });
  it('mantiene coherentes reportes y existencias y valida las fechas',async()=>{
    const cookie=await login();const result=await request('/reports?from=2000-01-01&to=2099-12-31',{cookie});
    assert.equal(result.status,200);const r=result.body;
    assert.equal(r.totals.sales,r.payments.reduce((s,i)=>s+i.total,0));assert.equal(r.totals.sales,r.top.reduce((s,i)=>s+i.revenue,0));
    assert.equal(r.totals.count,r.sales.length);
    for(const p of db.prepare('SELECT * FROM products').all())assert.equal(p.stock,db.prepare('SELECT SUM(quantity) AS n FROM stock_movements WHERE product_id=?').get(p.id).n);
    assert.equal((await request('/reports?from=2026-02-30&to=2026-03-02',{cookie})).status,400);
    assert.equal((await request('/reports?from=2026-10-31&to=2026-10-01',{cookie})).status,400);
  });
  it('presenta el historial anterior con conceptos de tienda y conserva los registros originales',async()=>{
    const cookie=await login();
    const initial=db.prepare("SELECT * FROM stock_movements WHERE type='initial' ORDER BY id LIMIT 1").get();
    const cash=db.prepare('SELECT * FROM cash_movements WHERE session_id=? ORDER BY id LIMIT 1').get(cashStatus(db).id);
    db.prepare('UPDATE stock_movements SET reason=? WHERE id=?').run('Carga inicial de demostración',initial.id);
    db.prepare('UPDATE cash_movements SET reason=? WHERE id=?').run('Venta de demostración',cash.id);
    const customId=db.prepare("SELECT id FROM stock_movements WHERE type='sale' ORDER BY id LIMIT 1").get().id;
    db.prepare('UPDATE stock_movements SET reason=? WHERE id=?').run('Entrega al cliente',customId);
    const data=(await request('/bootstrap',{cookie})).body;
    assert.equal(data.stockMovements.find(m=>m.id===initial.id).reason,'Carga inicial de inventario');
    assert.equal(data.cash.movements.find(m=>m.id===cash.id).reason,'Venta de mercadería');
    assert.equal(data.stockMovements.find(m=>m.id===customId).reason,'Entrega al cliente');
    const report=(await request('/reports',{cookie})).body;
    assert.equal(report.movements.find(m=>m.id===cash.id).reason,'Venta de mercadería');
    assert.equal(db.prepare('SELECT reason,quantity FROM stock_movements WHERE id=?').get(initial.id).quantity,initial.quantity);
    assert.equal(db.prepare('SELECT reason FROM stock_movements WHERE id=?').get(initial.id).reason,'Carga inicial de demostración');
    assert.equal(db.prepare('SELECT amount FROM cash_movements WHERE id=?').get(cash.id).amount,cash.amount);
  });
  it('registra productos y contactos y rechaza valores manipulados',async()=>{
    const cookie=await login();
    const body={sku:'TEST-40',brand:'Prueba',model:'Modelo de prueba',category:'Urbanas',size:'40',color:'Azul',cost:100,price:150.5,min_stock:3,initial_stock:5};
    const p=await request('/products',{cookie,body});assert.equal(p.status,201);
    assert.equal(db.prepare('SELECT SUM(quantity) AS n FROM stock_movements WHERE product_id=?').get(p.body.id).n,5);
    assert.equal((await request('/products',{cookie,body})).status,409);
    assert.equal((await request('/products',{cookie,body:{...body,sku:'OTHER',price:1.234}})).status,400);
    assert.equal((await request('/products',{cookie,body:{...body,sku:'OTHER',initial_stock:-1}})).status,400);
    assert.equal((await request('/customers',{cookie,body:{name:'Cliente nuevo',email:'cliente@example.com',document:'12345678',phone:'999999999'}})).status,201);
    assert.equal((await request('/suppliers',{cookie,body:{name:'Proveedor nuevo',email:'proveedor@example.com'}})).status,201);
  });
  it('limita los intentos de acceso fallidos',async()=>{
    for(let i=0;i<8;i++)assert.equal((await request('/auth/login',{body:{email:'admin@paso.pe',password:'incorrecta'}})).status,401);
    assert.equal((await request('/auth/login',{body:{email:'admin@paso.pe',password:'Admin123!'}})).status,429);
  });
  it('conserva exactamente los caracteres de las contraseñas',async()=>{
    const cookie=await login();
    const password=' Prueba con espacios! ';
    assert.equal((await request('/users',{cookie,body:{name:'Cuenta Espacios',email:'espacios@paso.pe',password,role:'seller',active:1}})).status,201);
    assert.equal((await request('/auth/login',{body:{email:'espacios@paso.pe',password}})).status,200);
    assert.equal((await request('/auth/login',{body:{email:'espacios@paso.pe',password:password.trim()}})).status,401);
  });
  it('filtra el día de Lima con límites de UTC inclusivo y exclusivo',async()=>{
    const cookie=await login();const cash=cashStatus(db);
    const insert=db.prepare("INSERT INTO sales(user_id,cash_session_id,payment_method,total,created_at) VALUES(1,?,'card',100,?)");
    insert.run(cash.id,'2020-01-02T04:59:59.999Z');
    insert.run(cash.id,'2020-01-02T05:00:00.000Z');
    insert.run(cash.id,'2020-01-03T04:59:59.999Z');
    insert.run(cash.id,'2020-01-03T05:00:00.000Z');
    const result=await request('/reports?from=2020-01-02&to=2020-01-02',{cookie});
    assert.equal(result.status,200);assert.equal(result.body.sales.length,2);assert.equal(result.body.totals.sales,200);
  });
});

it('persiste los datos y no vuelve a sembrarlos al abrir SQLite',()=>{
  const folder=mkdtempSync(join(tmpdir(),'paso-erp-test-'));const path=join(folder,'test.sqlite');
  try {let db=openDatabase(path);const count=db.prepare('SELECT COUNT(*) AS n FROM sales').get().n;db.prepare("UPDATE products SET model='Cambio persistente' WHERE id=1").run();db.close();db=openDatabase(path);assert.equal(db.prepare('SELECT model FROM products WHERE id=1').get().model,'Cambio persistente');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sales').get().n,count);db.close();}
  finally {rmSync(folder,{recursive:true,force:true});}
});
