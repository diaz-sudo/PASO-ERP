import { cashStatus, listProducts, requireRole } from './domain.mjs';
import { publicUser } from './auth.mjs';
import { businessDate } from './database.mjs';

// Presentar las descripciones iniciales de instalaciones anteriores sin alterar su historial.
function presentMovement(movement) {
  if(movement.reason==='Carga inicial de demostración')return {...movement,reason:'Carga inicial de inventario'};
  if(movement.reason==='Venta de demostración')return {...movement,reason:'Venta de mercadería'};
  return movement;
}

export function listSales(db,range) {
  return db.prepare(`SELECT s.id,s.created_at,s.total,s.payment_method,COALESCE(c.name,'Cliente general') AS customer_name,u.name AS seller_name,(SELECT SUM(quantity) FROM sale_items WHERE sale_id=s.id) AS quantity FROM sales s LEFT JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=s.user_id WHERE s.created_at>=? AND s.created_at<? ORDER BY s.id DESC`).all(range.start,range.end);
}
export function report(db,user,range) {
  requireRole(user,'admin');
  const sales = listSales(db,range);
  const top = db.prepare(`SELECT p.id,p.brand,p.model,p.size,p.color,p.category,SUM(i.quantity) AS quantity,SUM(i.quantity*i.unit_price) AS revenue,SUM(i.quantity*(i.unit_price-i.unit_cost)) AS margin FROM sale_items i JOIN products p ON p.id=i.product_id JOIN sales s ON s.id=i.sale_id WHERE s.created_at>=? AND s.created_at<? GROUP BY p.id ORDER BY quantity DESC,revenue DESC`).all(range.start,range.end);
  const daily = db.prepare(`SELECT date(created_at,'-5 hours') AS date,SUM(total) AS total,COUNT(*) AS count FROM sales WHERE created_at>=? AND created_at<? GROUP BY date(created_at,'-5 hours') ORDER BY date`).all(range.start,range.end);
  const payments = db.prepare('SELECT payment_method,SUM(total) AS total,COUNT(*) AS count FROM sales WHERE created_at>=? AND created_at<? GROUP BY payment_method').all(range.start,range.end);
  const stock = db.prepare('SELECT * FROM products WHERE active=1 ORDER BY stock-min_stock,id').all();
  const movements = db.prepare('SELECT m.*,u.name AS user_name FROM cash_movements m JOIN users u ON u.id=m.user_id WHERE m.created_at>=? AND m.created_at<? ORDER BY m.id DESC').all(range.start,range.end).map(presentMovement);
  return {range:{from:range.from,to:range.to},sales,top,daily,payments,stock,movements,totals:{sales:sales.reduce((s,i)=>s+i.total,0),count:sales.length,margin:top.reduce((s,i)=>s+i.margin,0),units:top.reduce((s,i)=>s+i.quantity,0),stock:stock.reduce((s,i)=>s+i.stock,0),value:stock.reduce((s,i)=>s+i.stock*i.cost,0),low:stock.filter(p=>p.stock<=p.min_stock).length}};
}
export function dashboard(db,user,range) {
  const totals = db.prepare('SELECT COALESCE(SUM(total),0) AS total,COUNT(*) AS count FROM sales WHERE created_at>=? AND created_at<?').get(range.start,range.end);
  const stock = db.prepare('SELECT COALESCE(SUM(stock),0) AS total,SUM(CASE WHEN stock<=min_stock THEN 1 ELSE 0 END) AS low,COUNT(*) AS variants FROM products WHERE active=1').get();
  const daily = db.prepare(`SELECT date(created_at,'-5 hours') AS date,SUM(total) AS total,COUNT(*) AS count FROM sales WHERE created_at>=? AND created_at<? GROUP BY date(created_at,'-5 hours') ORDER BY date`).all(range.start,range.end);
  const top = db.prepare(`SELECT p.brand,p.model,p.category,MIN(p.id) AS id,SUM(i.quantity) AS quantity,SUM(i.quantity*i.unit_price) AS revenue FROM sale_items i JOIN products p ON p.id=i.product_id JOIN sales s ON s.id=i.sale_id WHERE s.created_at>=? AND s.created_at<? GROUP BY p.brand,p.model ORDER BY quantity DESC,revenue DESC LIMIT 4`).all(range.start,range.end);
  const lowStock = db.prepare('SELECT id,brand,model,size,color,stock,min_stock FROM products WHERE active=1 AND stock<=min_stock ORDER BY stock LIMIT 6').all();
  const data = {totals,stock,daily,top,lowStock,today:businessDate(),range:{from:range.from,to:range.to}};
  if (user.role !== 'warehouse') { data.recent = listSales(db,range).slice(0,5); data.cash = cashStatus(db); }
  // Almacén ve inventario y sus alertas, sin información de facturación.
  if (user.role === 'warehouse') { delete data.totals; delete data.daily; delete data.top; }
  return data;
}
export function bootstrap(db,user,range) {
  const result = {user:publicUser(user),products:listProducts(db,user),dashboard:dashboard(db,user,range)};
  if (user.role !== 'warehouse') {
    result.customers = db.prepare('SELECT * FROM customers ORDER BY id DESC').all();
    result.sales = listSales(db,range);
    result.cash = {current:cashStatus(db),history:db.prepare('SELECT c.*,u.name AS opened_by_name FROM cash_sessions c JOIN users u ON u.id=c.opened_by ORDER BY c.id DESC LIMIT 50').all(),movements:db.prepare('SELECT m.*,u.name AS user_name FROM cash_movements m JOIN users u ON u.id=m.user_id WHERE session_id=(SELECT id FROM cash_sessions ORDER BY id DESC LIMIT 1) ORDER BY m.id DESC').all().map(presentMovement)};
  }
  if (user.role !== 'seller') {
    result.purchases = db.prepare('SELECT p.*,s.name AS supplier_name,u.name AS user_name,(SELECT SUM(quantity) FROM purchase_items WHERE purchase_id=p.id) AS quantity FROM purchases p JOIN suppliers s ON s.id=p.supplier_id JOIN users u ON u.id=p.user_id ORDER BY p.id DESC').all();
    if (user.role === 'warehouse') for (const p of result.purchases) delete p.total;
    result.stockMovements = db.prepare('SELECT m.*,p.brand,p.model,p.sku,p.size,p.color,u.name AS user_name FROM stock_movements m JOIN products p ON p.id=m.product_id JOIN users u ON u.id=m.user_id ORDER BY m.id DESC LIMIT 300').all().map(presentMovement);
  }
  if (user.role === 'admin') {
    result.suppliers = db.prepare('SELECT * FROM suppliers ORDER BY id DESC').all();
    result.users = db.prepare('SELECT id,name,email,role,active,created_at FROM users ORDER BY id').all();
  }
  return result;
}
