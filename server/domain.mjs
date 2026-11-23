import { createHash } from 'node:crypto';
import { transaction, now, businessDate } from './database.mjs';
import { AppError, textValue, intValue, moneyValue, enumValue, emailValue } from './validation.mjs';
import { hashPassword, roles } from './auth.mjs';

export function requireRole(user, ...allowed) {
  if (!allowed.includes(user.role)) throw new AppError('Tu rol no tiene permiso para esta acción.',403);
}
const row = (db, table, id) => {
  const record = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(intValue(Number(id),'Identificador',1));
  if (!record) throw new AppError('El registro no existe.',404);
  return record;
};
export function cashStatus(db) {
  const session = db.prepare('SELECT c.*,u.name AS opened_by_name FROM cash_sessions c JOIN users u ON u.id=c.opened_by WHERE c.closed_at IS NULL').get();
  if (!session) return null;
  const totals = db.prepare("SELECT COALESCE(SUM(CASE WHEN type IN ('sale','income') THEN amount ELSE 0 END),0) AS income,COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expense FROM cash_movements WHERE session_id=?").get(session.id);
  return { ...session, ...totals, expected: session.opening_amount + totals.income - totals.expense };
}
export function listProducts(db,user) {
  const products = db.prepare('SELECT * FROM products ORDER BY active DESC,id DESC').all();
  return products.map(p => { if (user.role !== 'admin') { delete p.cost; } return p; });
}
export function saveProduct(db,user,body,id) {
  requireRole(user,'admin');
  const values = [textValue(body.sku,'SKU',{max:40}).toUpperCase(),textValue(body.brand,'Marca',{max:60}),textValue(body.model,'Modelo',{max:100}),enumValue(body.category,['Urbanas','Running','Lifestyle','Basketball','Training'],'Categoría'),textValue(body.size,'Talla',{max:8}),textValue(body.color,'Color',{max:40}),moneyValue(body.cost,'Costo',true),moneyValue(body.price,'Precio'),intValue(body.min_stock,'Stock mínimo',0,10000)];
  return transaction(db,() => {
    if (id) {
      const product = row(db,'products',id);
      const active = body.active === undefined ? product.active : intValue(body.active,'Estado',0,1);
      db.prepare('UPDATE products SET sku=?,brand=?,model=?,category=?,size=?,color=?,cost=?,price=?,min_stock=?,active=? WHERE id=?').run(...values,active,product.id);
      return { id:product.id };
    }
    const initial = intValue(body.initial_stock ?? 0,'Stock inicial',0,100000);
    const productId = Number(db.prepare('INSERT INTO products(sku,brand,model,category,size,color,cost,price,min_stock,stock,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(...values,initial,now()).lastInsertRowid);
    if (initial) db.prepare("INSERT INTO stock_movements(product_id,user_id,type,quantity,reason,created_at) VALUES(?,?,'initial',?,'Stock inicial del producto',?)").run(productId,user.id,initial,now());
    return { id:productId };
  });
}
export function adjustStock(db,user,body) {
  requireRole(user,'admin','warehouse');
  const productId = intValue(body.product_id,'Producto',1);
  const quantity = intValue(body.quantity,'Cantidad',-100000,100000);
  if (!quantity) throw new AppError('La cantidad debe ser distinta de cero.');
  const reason = textValue(body.reason,'Motivo',{max:250});
  return transaction(db,() => {
    const product = row(db,'products',productId);
    if (!product.active) throw new AppError('El producto está inactivo.');
    if (product.stock + quantity < 0) throw new AppError('El ajuste dejaría el inventario con stock negativo.');
    db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(quantity,productId);
    db.prepare("INSERT INTO stock_movements(product_id,user_id,type,quantity,reason,created_at) VALUES(?,?,'adjustment',?,?,?)").run(productId,user.id,quantity,reason,now());
    return { stock:product.stock+quantity };
  });
}
export function saveContact(db,user,kind,body,id) {
  if (kind === 'suppliers') requireRole(user,'admin'); else requireRole(user,'admin','seller');
  const values = [textValue(body.name,'Nombre',{max:120}),textValue(body.document,'Documento',{max:20,optional:true}),textValue(body.phone,'Teléfono',{max:30,optional:true}),emailValue(body.email,true)];
  if (kind === 'suppliers') values.push(textValue(body.contact,'Contacto',{max:100,optional:true}));
  const fields = kind === 'suppliers' ? 'name,document,phone,email,contact' : 'name,document,phone,email';
  if (id) { row(db,kind,id); db.prepare(`UPDATE ${kind} SET ${fields.split(',').map(f=>`${f}=?`).join(',')} WHERE id=?`).run(...values,Number(id)); return {id:Number(id)}; }
  return { id:Number(db.prepare(`INSERT INTO ${kind}(${fields},created_at) VALUES(${values.map(()=>'?').join(',')},?)`).run(...values,now()).lastInsertRowid) };
}
function parseItems(body, type) {
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) throw new AppError('Agrega entre 1 y 100 productos.');
  const seen = new Set();
  return body.items.map(item => {
    const productId = intValue(item.product_id,'Producto',1);
    if (seen.has(productId)) throw new AppError('Combina las cantidades de un mismo producto en una sola línea.');
    seen.add(productId);
    return { product_id:productId, quantity:intValue(item.quantity,'Cantidad',1,10000), ...(type==='purchase' ? { unit_cost:moneyValue(item.unit_cost,'Costo unitario') } : {}) };
  });
}
export function createPurchase(db,user,body) {
  requireRole(user,'admin');
  const supplierId = intValue(body.supplier_id,'Proveedor',1);
  const items = parseItems(body,'purchase');
  const note = textValue(body.note,'Observación',{max:250,optional:true});
  return transaction(db,() => {
    row(db,'suppliers',supplierId);
    for (const item of items) if (!row(db,'products',item.product_id).active) throw new AppError('La compra contiene un producto inactivo.');
    const total = items.reduce((s,i)=>s+i.quantity*i.unit_cost,0);
    if (!Number.isSafeInteger(total) || total > 1000000000) throw new AppError('El importe de la compra excede el límite permitido.');
    const id = Number(db.prepare('INSERT INTO purchases(supplier_id,user_id,total,note,created_at) VALUES(?,?,?,?,?)').run(supplierId,user.id,total,note,now()).lastInsertRowid);
    for (const i of items) db.prepare('INSERT INTO purchase_items(purchase_id,product_id,quantity,unit_cost) VALUES(?,?,?,?)').run(id,i.product_id,i.quantity,i.unit_cost);
    return {id};
  });
}
export function receivePurchase(db,user,id) {
  requireRole(user,'admin','warehouse');
  return transaction(db,() => {
    const p = row(db,'purchases',id);
    if (p.status !== 'pending') throw new AppError('Esta compra ya fue recibida.',409);
    const items = db.prepare('SELECT * FROM purchase_items WHERE purchase_id=?').all(p.id);
    for (const item of items) {
      db.prepare('UPDATE products SET stock=stock+?,cost=? WHERE id=?').run(item.quantity,item.unit_cost,item.product_id);
      db.prepare("INSERT INTO stock_movements(product_id,user_id,type,quantity,reason,purchase_id,created_at) VALUES(?,?,'purchase',?,?,?,?)").run(item.product_id,user.id,item.quantity,`Recepción C-${String(p.id).padStart(4,'0')}`,p.id,now());
    }
    db.prepare("UPDATE purchases SET status='received',received_at=? WHERE id=?").run(now(),p.id);
    return {id:p.id};
  });
}
export function purchaseDetail(db,user,id) {
  requireRole(user,'admin','warehouse');
  const purchase = row(db,'purchases',id);
  purchase.supplier_name = row(db,'suppliers',purchase.supplier_id).name;
  purchase.items = db.prepare('SELECT i.product_id,i.quantity,i.unit_cost,p.sku,p.brand,p.model,p.size,p.color FROM purchase_items i JOIN products p ON p.id=i.product_id WHERE i.purchase_id=?').all(purchase.id);
  if(user.role!=='admin') {delete purchase.total;for(const item of purchase.items)delete item.unit_cost;}
  return purchase;
}
export function createSale(db,user,body) {
  requireRole(user,'admin','seller');
  const items = parseItems(body,'sale');
  const payment = enumValue(body.payment_method,['cash','card','transfer'],'Medio de pago');
  const customerId = body.customer_id ? intValue(body.customer_id,'Cliente',1) : null;
  const requestId = textValue(body.request_id,'Identificador de operación',{max:80});
  const fingerprint = createHash('sha256').update(JSON.stringify({items:items.slice().sort((a,b)=>a.product_id-b.product_id),payment,customerId})).digest('hex');
  return transaction(db,() => {
    const existing = db.prepare('SELECT * FROM sales WHERE request_id=?').get(requestId);
    if (existing) {
      if (existing.user_id !== user.id || existing.request_hash !== fingerprint) throw new AppError('Este identificador ya corresponde a otra venta.',409);
      return {id:existing.id,total:existing.total,repeated:true};
    }
    const cash = cashStatus(db);
    if (!cash) throw new AppError('Abre la caja antes de registrar una venta.');
    if (businessDate(new Date(cash.opened_at)) !== businessDate()) throw new AppError('La caja pertenece a otra fecha. Ciérrala y abre la caja de hoy.');
    if (customerId) row(db,'customers',customerId);
    let total = 0;
    const lines = items.map(item => {
      const p = row(db,'products',item.product_id);
      if (!p.active || p.stock < item.quantity) throw new AppError(`Stock insuficiente para ${p.model}, talla ${p.size}. Disponible: ${p.active ? p.stock : 0}.`);
      total += p.price * item.quantity;
      return {...item,unit_price:p.price,unit_cost:p.cost};
    });
    if (!Number.isSafeInteger(total) || total <= 0 || total > 1000000000) throw new AppError('El total de la venta no es válido.');
    const at = now();
    const id = Number(db.prepare('INSERT INTO sales(customer_id,user_id,cash_session_id,payment_method,total,request_id,request_hash,created_at) VALUES(?,?,?,?,?,?,?,?)').run(customerId,user.id,cash.id,payment,total,requestId,fingerprint,at).lastInsertRowid);
    for (const i of lines) {
      db.prepare('INSERT INTO sale_items(sale_id,product_id,quantity,unit_price,unit_cost) VALUES(?,?,?,?,?)').run(id,i.product_id,i.quantity,i.unit_price,i.unit_cost);
      db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(i.quantity,i.product_id);
      db.prepare("INSERT INTO stock_movements(product_id,user_id,type,quantity,reason,sale_id,created_at) VALUES(?,?,'sale',?,?,?,?)").run(i.product_id,user.id,-i.quantity,`Venta V-${String(id).padStart(4,'0')}`,id,at);
    }
    if (payment === 'cash') db.prepare("INSERT INTO cash_movements(session_id,user_id,type,amount,reason,sale_id,created_at) VALUES(?,?,'sale',?,?,?,?)").run(cash.id,user.id,total,`Venta V-${String(id).padStart(4,'0')}`,id,at);
    return {id,total};
  });
}
export function saleDetail(db,user,id) {
  requireRole(user,'admin','seller');
  row(db,'sales',id);
  const sale = db.prepare('SELECT s.*,COALESCE(c.name,\'Cliente general\') AS customer_name,COALESCE(c.document,\'\') AS customer_document,u.name AS seller_name FROM sales s LEFT JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=s.user_id WHERE s.id=?').get(Number(id));
  delete sale.request_hash; delete sale.request_id;
  sale.items = db.prepare('SELECT si.quantity,si.unit_price,p.sku,p.brand,p.model,p.size,p.color FROM sale_items si JOIN products p ON p.id=si.product_id WHERE si.sale_id=?').all(Number(id));
  return sale;
}
export function openCash(db,user,body) {
  requireRole(user,'admin','seller');
  const amount = moneyValue(body.opening_amount,'Fondo inicial',true);
  return transaction(db,() => {
    if (cashStatus(db)) throw new AppError('Ya hay una caja abierta.',409);
    const id = Number(db.prepare('INSERT INTO cash_sessions(opened_by,opened_at,opening_amount) VALUES(?,?,?)').run(user.id,now(),amount).lastInsertRowid);
    return {id};
  });
}
export function moveCash(db,user,body) {
  requireRole(user,'admin','seller');
  const type = enumValue(body.type,['income','expense'],'Tipo de movimiento');
  const amount = moneyValue(body.amount);
  const reason = textValue(body.reason,'Motivo',{max:250});
  return transaction(db,() => {
    const cash = cashStatus(db);
    if (!cash) throw new AppError('Primero abre la caja.');
    if (businessDate(new Date(cash.opened_at)) !== businessDate()) throw new AppError('Cierra la caja anterior y abre la caja de hoy.');
    if (type === 'expense' && amount > cash.expected) throw new AppError('El egreso supera el efectivo disponible en caja.');
    return {id:Number(db.prepare('INSERT INTO cash_movements(session_id,user_id,type,amount,reason,created_at) VALUES(?,?,?,?,?,?)').run(cash.id,user.id,type,amount,reason,now()).lastInsertRowid)};
  });
}
export function closeCash(db,user,body) {
  requireRole(user,'admin','seller');
  const counted = moneyValue(body.counted_amount,'Efectivo contado',true);
  return transaction(db,() => {
    const cash = cashStatus(db);
    if (!cash) throw new AppError('No hay una caja abierta.');
    db.prepare('UPDATE cash_sessions SET closed_by=?,closed_at=?,counted_amount=?,expected_amount=?,difference=? WHERE id=?').run(user.id,now(),counted,cash.expected,counted-cash.expected,cash.id);
    return {id:cash.id,expected:cash.expected,counted,difference:counted-cash.expected};
  });
}
export function saveUser(db,user,body,id) {
  requireRole(user,'admin');
  const name = textValue(body.name,'Nombre',{max:100});
  const email = emailValue(body.email);
  const role = enumValue(body.role,Object.keys(roles),'Rol');
  const active = intValue(body.active ?? 1,'Estado',0,1);
  let passwordHash;
  if (!id || body.password) {
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) throw new AppError('La contraseña debe tener entre 8 y 128 caracteres.');
    passwordHash = hashPassword(body.password);
  }
  return transaction(db,() => {
    if (id) {
      const old = row(db,'users',id);
      if (old.id === user.id && (!active || role !== 'admin')) throw new AppError('No puedes desactivar tu cuenta ni quitarte el rol de administrador.');
      if (old.role === 'admin' && (!active || role !== 'admin') && db.prepare("SELECT count(*) AS n FROM users WHERE role='admin' AND active=1").get().n <= 1) throw new AppError('Debe existir al menos un administrador activo.');
      db.prepare('UPDATE users SET name=?,email=?,role=?,active=?,password_hash=? WHERE id=?').run(name,email,role,active,passwordHash ?? old.password_hash,old.id);
      if (passwordHash || old.role !== role || !active) db.prepare('DELETE FROM sessions WHERE user_id=?').run(old.id);
      return {id:old.id};
    }
    return {id:Number(db.prepare('INSERT INTO users(name,email,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?)').run(name,email,passwordHash,role,active,now()).lastInsertRowid)};
  });
}
