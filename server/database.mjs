import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { hashPassword } from './auth.mjs';

export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
export const now = () => new Date().toISOString();
export const businessDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

export function openDatabase(path, { seed = true } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  if (seed && !db.prepare('SELECT id FROM users LIMIT 1').get()) seedDatabase(db);
  return db;
}

function seedDatabase(db) {
  transaction(db, () => {
    const created = now();
    const initialAt = new Date(Date.now() - 7 * 86400000).toISOString();
    const insertUser = db.prepare('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)');
    insertUser.run('César Administrador','admin@paso.pe',hashPassword('Admin123!'),'admin',created);
    insertUser.run('Lucía Torres','ventas@paso.pe',hashPassword('Ventas123!'),'seller',created);
    insertUser.run('Diego Almacén','almacen@paso.pe',hashPassword('Almacen123!'),'warehouse',created);
    const suppliers = [
      ['Distribuidora Urban Sport','20111111111','Andrea Rojas','999 111 201','contacto@urbansport.example'],
      ['Importaciones Andina','20222222222','Carlos Vega','999 111 202','ventas@andina.example'],
      ['Sport Perú Mayorista','20333333333','María Salas','999 111 203','pedidos@sportperu.example'],
    ];
    for (const s of suppliers) db.prepare('INSERT INTO suppliers(name,document,contact,phone,email,created_at) VALUES(?,?,?,?,?,?)').run(...s,created);
    for (const c of [['Mariana Flores','70123456','999 231 456'],['Sebastián Ramos','71234567','999 342 567'],['Valeria Mendoza','72345678','999 453 678'],['Mateo García','73456789','999 564 789'],['Camila Vargas','74567890','999 675 890']]) db.prepare('INSERT INTO customers(name,document,phone,created_at) VALUES(?,?,?,?)').run(...c,created);
    const variants = [
      ['NK-AF1-38-W','Nike','Air Force 1','Urbanas','38','Blanco',22000,35900,18,5],
      ['NK-AF1-40-W','Nike','Air Force 1','Urbanas','40','Blanco',22000,35900,24,5],
      ['NK-AF1-42-W','Nike','Air Force 1','Urbanas','42','Blanco',22000,35900,5,5],
      ['AD-SMB-39-B','Adidas','Samba OG','Urbanas','39','Negro',25000,42900,16,4],
      ['AD-SMB-41-B','Adidas','Samba OG','Urbanas','41','Negro',25000,42900,14,4],
      ['NB-550-40-G','New Balance','550','Lifestyle','40','Verde',28000,46900,14,4],
      ['NB-550-42-G','New Balance','550','Lifestyle','42','Verde',28000,46900,3,4],
      ['NK-DNK-39-R','Nike','Dunk Low','Lifestyle','39','Rojo',26000,44900,12,4],
      ['PM-SUE-40-B','Puma','Suede Classic','Urbanas','40','Negro',17000,29900,20,5],
      ['AD-RUN-41-G','Adidas','Runfalcon 5','Running','41','Gris',14000,24900,17,5],
      ['AS-GEL-42-B','Asics','Gel-1130','Running','42','Azul',23000,39900,8,3],
      ['CV-CHK-37-W','Converse','Chuck Taylor','Urbanas','37','Crema',15000,26900,3,4],
    ];
    for (const p of variants) {
      const id = db.prepare('INSERT INTO products(sku,brand,model,category,size,color,cost,price,stock,min_stock,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(...p,created).lastInsertRowid;
      db.prepare('INSERT INTO stock_movements(product_id,user_id,type,quantity,reason,created_at) VALUES(?,1,\'initial\',?,\'Carga inicial de inventario\',?)').run(id,p[8],initialAt);
    }
    // Historial ficticio coherente: cada venta tiene salida de stock y solo el efectivo ingresa a caja.
    for (let day = 6; day >= 0; day--) {
      const date = businessDate(new Date(Date.now() - day * 86400000));
      const opened = day === 0 ? created : `${date}T14:00:00.000Z`;
      const cashId = db.prepare('INSERT INTO cash_sessions(opened_by,opened_at,opening_amount) VALUES(2,?,20000)').run(opened).lastInsertRowid;
      const count = [5,4,6,3,5,4,5][6-day];
      let cashTotal = 20000;
      for (let i = 0; i < count; i++) {
        const productId = [1,2,4,5,6,8,9,10,11][(day * 3 + i) % 9];
        const p = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
        const method = ['cash','card','transfer'][i%3];
        const at = day === 0 ? created : `${date}T${String(15+i).padStart(2,'0')}:00:00.000Z`;
        const saleId = db.prepare('INSERT INTO sales(customer_id,user_id,cash_session_id,payment_method,total,created_at) VALUES(?,2,?,?,?,?)').run((i%5)+1,cashId,method,p.price,at).lastInsertRowid;
        db.prepare('INSERT INTO sale_items(sale_id,product_id,quantity,unit_price,unit_cost) VALUES(?,?,1,?,?)').run(saleId,productId,p.price,p.cost);
        db.prepare('UPDATE products SET stock=stock-1 WHERE id=?').run(productId);
        db.prepare('INSERT INTO stock_movements(product_id,user_id,type,quantity,reason,sale_id,created_at) VALUES(?,2,\'sale\',-1,\'Venta de mercadería\',?,?)').run(productId,saleId,at);
        if (method === 'cash') {
          cashTotal += p.price;
          db.prepare('INSERT INTO cash_movements(session_id,user_id,type,amount,reason,sale_id,created_at) VALUES(?,2,\'sale\',?,\'Venta de mercadería\',?,?)').run(cashId,p.price,saleId,at);
        }
      }
      if (day > 0) db.prepare('UPDATE cash_sessions SET closed_by=2,closed_at=?,counted_amount=?,expected_amount=?,difference=0 WHERE id=?').run(`${date}T23:00:00.000Z`,cashTotal,cashTotal,cashId);
    }
    const purchaseId = db.prepare('INSERT INTO purchases(supplier_id,user_id,total,note,created_at) VALUES(1,1,220000,\'Reposición programada de Air Force 1\',?)').run(created).lastInsertRowid;
    db.prepare('INSERT INTO purchase_items(purchase_id,product_id,quantity,unit_cost) VALUES(?,3,10,22000)').run(purchaseId);
  });
}
