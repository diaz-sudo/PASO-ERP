import {icon,sneaker} from './icons.js';

const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const toastBox = document.querySelector('#toast');
const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2}).format((value || 0)/100);
const number = value => new Intl.NumberFormat('es-PE').format(value || 0);
const day = (date=new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const dateLabel = (value,withTime=false) => new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',...(withTime?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(value.length===10 ? `${value}T17:00:00Z` : value));
const initials = name => name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const paymentNames = {cash:'Efectivo',card:'Tarjeta',transfer:'Transferencia'};
const roleNames = {admin:'Administrador',seller:'Vendedor',warehouse:'Almacén'};
const movementNames = {initial:'Carga inicial',sale:'Venta',purchase:'Compra',adjustment:'Ajuste',income:'Ingreso',expense:'Egreso'};
const pages = {dashboard:['Resumen general','grid'],products:['Productos','shoe'],inventory:['Inventario','box'],sales:['Ventas','cart'],customers:['Clientes','users'],purchases:['Compras','bag'],suppliers:['Proveedores','truck'],cash:['Caja','wallet'],reports:['Reportes','chart'],users:['Usuarios y roles','shield'],help:['Guía del sistema','help']};
const state = {user:null,data:null,route:'dashboard',search:'',tab:'all',period:'7',from:day(new Date(Date.now()-6*86400000)),to:day(),report:null,cart:[],cartRequest:null,busy:false};
const brand = () => '<div class="brand"><span class="brand-mark">P</span><div><div class="brand-name">paso<span style="color:#9fbd7e">.</span></div><div class="brand-sub">Gestión que avanza</div></div></div>';
const badge = (label,color='',dot=false) => `<span class="badge ${color}">${dot?'<i class="dot"></i>':''}${e(label)}</span>`;
const button = (label,action,ic='plus',cls='primary',extra='') => `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${icon(ic)}${e(label)}</button>`;
const empty = (title='No hay registros',copy='Los nuevos registros aparecerán aquí.',ic='box') => `<div class="empty">${icon(ic)}<strong>${e(title)}</strong>${e(copy)}</div>`;
const stat = (label,value,caption,ic,cls='') => `<article class="stat ${cls}"><div class="stat-top"><span>${e(label)}</span><span class="stat-icon">${icon(ic)}</span></div><div class="stat-value">${value}</div><div class="stat-caption">${e(caption)}</div></article>`;
const match = (...values) => values.join(' ').toLocaleLowerCase('es').includes(state.search.toLocaleLowerCase('es'));
const allowed = route => route==='help' || state.user?.permissions.includes(route);
const admin = () => state.user?.role==='admin';
const periodQuery = () => `from=${state.from}&to=${state.to}`;
const productColor = p => /negro/i.test(p.color) ? 'black' : /rojo/i.test(p.color) ? 'red' : /azul|gris/i.test(p.color) ? 'blue' : /crema|blanco/i.test(p.color) ? 'cream' : 'sage';
const productArt = p => `<span class="product-art">${sneaker(productColor(p))}</span>`;

async function api(path,body,method='POST') {
  let response;
  try { response = await fetch(`/api${path}`,{credentials:'same-origin',...(body!==undefined?{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})}); }
  catch { throw new Error('No se pudo conectar con el servidor. Comprueba que esté iniciado.'); }
  let result;
  try { result=await response.json(); } catch { throw new Error('El servidor devolvió una respuesta inesperada.'); }
  if (!response.ok) {
    if (response.status===401 && !path.includes('/auth/login')) { state.user=null;state.data=null;if(modal.open)modal.close();renderLogin(); }
    throw new Error(result.error || 'No se pudo completar la operación.');
  }
  return result;
}
let toastTimer;
function toast(message,error=false) {
  clearTimeout(toastTimer);toastBox.textContent=message;toastBox.className=`visible${error?' error':''}`;
  toastTimer=setTimeout(()=>{toastBox.className='';},4500);
}
function formError(message,form=modal) {
  const box=form.querySelector('.form-error');
  if(box) {box.textContent=message;box.setAttribute('role','alert');} else toast(message,true);
}
async function refresh() {
  state.data=await api(`/bootstrap?${periodQuery()}`);state.user=state.data.user;state.report=null;
  if(!allowed(state.route))state.route='dashboard';
  if(state.route==='reports')state.report=await api(`/reports?${periodQuery()}`);
  renderShell();
}
function getRoute() {const route=location.hash.replace(/^#\/?/,'').split('?')[0];return pages[route]&&allowed(route)?route:'dashboard';}
async function navigate() {
  if(!state.user)return;
  state.route=getRoute();state.tab=state.route==='inventory'&&location.hash.includes('stock=low')?'low':'all';state.search='';
  if(state.route==='reports'&&!state.report) {
    try {state.report=await api(`/reports?${periodQuery()}`);}catch(error){toast(error.message,true);return;}
  }
  renderShell();
}
function renderLogin() {
  document.title='Iniciar sesión · PASO ERP';
  app.innerHTML=`<main class="login"><section class="login-story">${brand()}<div class="login-pitch"><div class="eyebrow">${icon('spark')} Un negocio. Muchas posibilidades.</div><h1>Tu próximo gran<br>paso <em>empieza aquí.</em></h1><p>Las zapatillas que vendes. El negocio que construyes. Todo conectado, en un solo lugar.</p></div><div class="hero-shoe">${sneaker('sage',true)}</div><div class="login-foot"><span>Hecho para tiendas que avanzan.</span><span>Paso Sneakers · 2026</span></div></section><section class="login-panel"><div class="login-form-wrap"><div class="login-tag">${badge('Tu tienda, bajo control','',true)}</div><h2>Qué bueno tenerte aquí.</h2><p class="muted">Inicia sesión y da el siguiente paso con tu tienda.</p><form id="login-form" data-form="login"><label class="field"><span>Correo electrónico</span><input name="email" type="email" placeholder="tu@correo.com" required autocomplete="username" maxlength="120"></label><label class="field"><span>Contraseña</span><div class="password-wrap"><input id="login-password" name="password" type="password" placeholder="Ingresa tu contraseña" required autocomplete="current-password" maxlength="128"><button type="button" class="icon-btn" data-action="toggle-password" aria-label="Mostrar contraseña">${icon('eye')}</button></div></label><div class="form-error" role="alert"></div><button class="btn primary wide login-submit" type="submit">Entrar a mi tienda ${icon('arrow')}</button></form><div class="demo-box"><p>CUENTAS DE PRUEBA</p><div class="demo-buttons">${button('Administrador','demo-admin','shield','')}${button('Vendedor','demo-seller','cart','')}${button('Almacén','demo-warehouse','box','')}</div><div class="demo-note" id="demo-note">Selecciona un rol para completar sus datos de acceso.</div></div><div class="login-security">${icon('lock')} Acceso con contraseña y permisos por rol</div></div></section></main>`;
}
function renderShell() {
  document.title=`${pages[state.route][0]} · PASO ERP`;
  const user=state.user,d=state.data;
  const nav = keys => keys.filter(allowed).map(key=>`<a href="#/${key}" class="${state.route===key?'active':''}" ${state.route===key?'aria-current="page"':''}>${icon(pages[key][1])}<span>${pages[key][0]}</span>${key==='inventory'&&d.dashboard.stock.low?`<span class="nav-count">${d.dashboard.stock.low}</span>`:''}</a>`).join('');
  app.innerHTML=`<div class="shell"><button type="button" class="sidebar-overlay" data-action="menu" aria-label="Cerrar menú"></button><aside class="sidebar">${brand()}<div class="store-chip"><span class="store-icon">${icon('shoe')}</span><div><strong>Paso Sneakers</strong><small>Tienda principal · Lima</small></div>${icon('down')}</div><p class="nav-label">Tu espacio de trabajo</p><nav class="nav" aria-label="Menú principal">${nav(['dashboard','products','inventory','sales','customers','purchases','suppliers'])}</nav><div class="nav-divider"></div><p class="nav-label">Administración</p><nav class="nav" aria-label="Administración">${nav(['cash','reports','users'])}</nav><div class="sidebar-bottom"><div class="sidebar-note">${icon('spark')}<strong>Cada paso cuenta.</strong><p>Menos tareas pendientes.<br>Más tiempo para tu negocio.</p><a href="#/help" class="link-btn">Conoce tu sistema ${icon('arrow')}</a></div><div class="sidebar-version"><span>Paso Sneakers</span><span>v1.2.0</span></div></div></aside><main class="main"><header class="topbar"><button type="button" class="icon-btn mobile-menu" data-action="menu" aria-label="Abrir menú">${icon('menu')}</button><div class="breadcrumb">Mi tienda <span>/</span> <strong>${pages[state.route][0]}</strong></div><div class="topbar-right"><label class="top-search">${icon('search')}<input id="global-search" placeholder="Buscar en esta sección…" aria-label="Buscar en esta sección" value="${e(state.search)}"></label><button type="button" class="icon-btn bell-button" data-action="alerts" aria-label="Ver alertas de stock">${icon('bell')}${d.dashboard.stock.low?'<i class="dot"></i>':''}</button><div class="profile"><span class="avatar">${e(initials(user.name))}</span><div class="profile-text"><strong>${e(user.name.split(' ').slice(0,2).join(' '))}</strong><small>${e(user.roleLabel)}</small></div><button type="button" class="icon-btn" data-action="logout" title="Cerrar sesión" aria-label="Cerrar sesión">${icon('logout')}</button></div></div></header><div id="page-view" class="page"></div></main></div>`;
  renderView();
  if(!['cash','reports','users'].some(allowed)) {
    const adminNav=app.querySelector('nav[aria-label="Administración"]');
    adminNav?.previousElementSibling?.remove();
    adminNav?.previousElementSibling?.remove();
    adminNav?.remove();
  }
}
function heading(title,description,actions='') {return `<div class="page-heading"><div><h1>${e(title)}</h1><p>${e(description)}</p></div><div class="heading-actions">${actions}</div></div>`;}
function footer() {return '<footer class="page-footer"><span>© 2026 Paso ERP <i class="dot"></i> Cada paso, bajo control.</span><span>Tu tienda, un paso adelante.</span></footer>';}
function periodSelect() {return `<select class="period-select" id="period-select" aria-label="Período de consulta"><option value="1" ${state.period==='1'?'selected':''}>Hoy</option><option value="7" ${state.period==='7'?'selected':''}>Últimos 7 días</option><option value="30" ${state.period==='30'?'selected':''}>Últimos 30 días</option>${state.period==='custom'?'<option value="custom" selected>Rango personalizado</option>':''}</select>`;}
function renderView() {
  const views={dashboard:viewDashboard,products:viewProducts,inventory:viewInventory,sales:viewSales,customers:()=>viewContacts('customers'),suppliers:()=>viewContacts('suppliers'),purchases:viewPurchases,cash:viewCash,reports:viewReports,users:viewUsers,help:viewHelp};
  const container=document.querySelector('#page-view');
  if(container)container.innerHTML=(state.route==='dashboard'&&state.search?heading('Resultados del catálogo',`Variantes que coinciden con “${state.search}”.`)+`<section class="panel">${productTable(filteredProducts())}</section>`:views[state.route]())+footer();
  if(container&&state.route==='help'&&state.search) {
    const cards=[...container.querySelectorAll('.help-card')];
    cards.forEach(card=>{card.hidden=!card.textContent.toLowerCase().includes(state.search.toLowerCase());});
    if(cards.every(card=>card.hidden))container.querySelector('.help-grid').innerHTML=empty('Sin coincidencias','Prueba con otro término.','search');
  }
}
function chart(data) {
  const length = Math.round((Date.parse(state.to)-Date.parse(state.from))/86400000)+1;
  let series=[];
  if(length<=31) for(let i=0;i<length;i++) {const date=new Date(Date.parse(`${state.from}T12:00:00Z`)+i*86400000).toISOString().slice(0,10);series.push({date,total:data.find(v=>v.date===date)?.total || 0});}
  else {
    // Agrupar todo el rango en hasta doce intervalos, conservando cada importe vendido.
    const step=Math.ceil(length/12),bins=new Map();
    for(const item of data) {
      const offset=Math.floor((Date.parse(item.date)-Date.parse(state.from))/86400000);
      const index=Math.floor(offset/step);
      if(!bins.has(index)) {
        const start=new Date(Date.parse(`${state.from}T12:00:00Z`)+index*step*86400000).toISOString().slice(0,10);
        const end=new Date(Math.min(Date.parse(`${state.to}T12:00:00Z`),Date.parse(`${start}T12:00:00Z`)+(step-1)*86400000)).toISOString().slice(0,10);
        bins.set(index,{date:start,end,total:0});
      }
      bins.get(index).total+=item.total;
    }
    series=[...bins.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  if(!series.length)return empty('Sin ventas en este período','Prueba con otro rango de fechas.','chart');
  const maximum=Math.max(...series.map(i=>i.total),10000);
  const short=length<=7;
  const labels=i=>`${dateLabel(i.date)}${i.end?` — ${dateLabel(i.end)}`:''}`;
  return `${length>31?'<p class="panel-sub" style="padding:10px 22px 0">Rango agrupado en intervalos; se incluyen todas las ventas.</p>':''}<div class="chart" role="img" aria-label="Ventas ${length>31?'por intervalo':'por día'}. ${e(series.map(i=>`${labels(i)}: ${money(i.total)}`).join('; '))}"><div class="chart-axis">${[1,.75,.5,.25,0].map(p=>`<span>${number(Math.round(maximum*p/100))}</span>`).join('')}</div><div class="chart-main"><div class="chart-grid">${'<i></i>'.repeat(5)}</div><div class="bars">${series.map(i=>`<div class="bar-group" title="${labels(i)}: ${money(i.total)}"><div class="bar" style="height:${Math.max(i.total/maximum*84,0)}%"></div><span class="bar-label">${short?new Intl.DateTimeFormat('es-PE',{weekday:'short',timeZone:'America/Lima'}).format(new Date(`${i.date}T17:00:00Z`)).replace('.',''):i.end?i.date.slice(5).split('-').reverse().join('/'):i.date.slice(8)}</span></div>`).join('')}</div></div></div>`;
}
function salesTable(sales,recent=false) {
  if(!sales.length)return empty('Todavía no hay ventas','Las ventas del período aparecerán aquí.','receipt');
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Constancia</th><th>Cliente</th><th>${recent?'Hora / fecha':'Fecha'}</th><th>Pago</th><th>Importe</th><th><span class="muted">Detalle</span></th></tr></thead><tbody>${sales.map(s=>`<tr><td class="strong">V-${String(s.id).padStart(4,'0')}</td><td>${e(s.customer_name)}</td><td>${dateLabel(s.created_at,true)}</td><td>${badge(paymentNames[s.payment_method],s.payment_method==='card'?'blue':s.payment_method==='transfer'?'gray':'')}</td><td class="amount">${money(s.total)}</td><td><button type="button" class="icon-btn" data-action="receipt" data-id="${s.id}" aria-label="Ver constancia V-${s.id}">${icon('arrow')}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function viewDashboard() {
  const d=state.data.dashboard,warehouse=state.user.role==='warehouse';
  let result=heading(`Hola, ${state.user.name.split(' ')[0]}. Todo en orden.`, 'Un vistazo a tu tienda para empezar con el pie derecho.',`<span class="date-pill">${icon('calendar')}${e(dateLabel(day()))}</span>${!warehouse?button('Nueva venta','new-sale','plus'):button('Ver inventario','go-inventory','box')}`);
  result+=`<section class="welcome"><div class="welcome-copy"><div class="eyebrow">El siguiente paso de tu negocio</div><h2>Buenas zapatillas. Una tienda mejor gestionada.</h2><p>Tu inventario, tus ventas y tus decisiones, conectados en un solo lugar.</p></div><div class="welcome-art">${sneaker('sage')}</div></section><div class="section-controls"><h2 class="section-title">Así va tu tienda ${!warehouse?badge(d.cash?'Caja abierta':'Caja cerrada',d.cash?'':'gray',true):badge('Vista de almacén')}</h2>${!warehouse?periodSelect():''}</div>`;
  if(warehouse) {
    result+=`<div class="stats">${stat('Pares en inventario',number(d.stock.total),'Disponibles en tienda','box')}${stat('Variantes activas',number(d.stock.variants),'Modelo, talla y color','shoe')}${stat('Stock por reponer',number(d.stock.low),'Variantes en su mínimo o menos','warning','stat-highlight')}${stat('Compras pendientes',number(state.data.purchases.filter(p=>p.status==='pending').length),'Pendientes de recepción','truck')}</div>`;
    return result+lowStockPanel()+`<div style="margin-top:20px">${viewInventory(true)}</div>`;
  }
  result+=`<div class="stats">${stat('Ventas del período',money(d.totals.total),`${dateLabel(state.from)} — ${dateLabel(state.to)}`,'money')}${stat('Ventas registradas',number(d.totals.count),`${number(d.totals.count?Math.round(d.totals.total/d.totals.count)/100:0)} soles de ticket promedio`,'bag')}${stat('Pares disponibles',number(d.stock.total),`${d.stock.variants} variantes en tu catálogo`,'box')}${stat('Stock por reponer',number(d.stock.low),'Variantes que necesitan atención','warning','stat-highlight')}</div>`;
  const tops=d.top.map((p,i)=>`<div class="top-product">${productArt({...p,color:['Verde','Blanco','Negro','Rojo'][i]})}<div><strong>${e(p.brand)} ${e(p.model)}</strong><p>${e(p.category)}</p></div><div class="product-total">${number(p.quantity)} pares<small>${money(p.revenue)}</small></div></div>`).join('');
  result+=`<div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>El ritmo de tus ventas</h2><p class="panel-sub">Importe vendido por día · en soles</p></div><span class="legend"><i class="dot"></i> Ventas</span></div>${chart(d.daily)}</section><section class="panel"><div class="panel-head"><div><h2>Los favoritos de la tienda</h2><p class="panel-sub">Modelos más vendidos en el período</p></div>${icon('shoe')}</div><div class="panel-body">${tops || empty('Aún no hay favoritos','Se calculan con las ventas del período.','shoe')}</div></section></div><div class="dashboard-grid"><section class="panel recent-table"><div class="panel-head"><h2>Los últimos pasos</h2><a class="link-btn" href="#/sales">Ver ventas ${icon('arrow')}</a></div>${salesTable(d.recent,true)}<div class="table-foot"><span>Últimas ${d.recent.length} ventas del período</span><span>Actualizado al consultar</span></div></section>${lowStockPanel()}</div>`;
  return result;
}
function lowStockPanel() {
  const alerts=state.data.dashboard.lowStock;
  return `<section class="panel"><div class="panel-head"><h2>Un ojo en tu inventario</h2>${badge(`${state.data.dashboard.stock.low} alertas`,'orange')}</div><div class="alert-list">${alerts.map(p=>`<div class="stock-alert"><span class="alert-icon">${icon('box')}</span><div><strong>${e(p.brand)} ${e(p.model)}</strong><p>Talla ${e(p.size)} · ${e(p.color)}</p></div>${badge(`${p.stock} ${p.stock===1?'par':'pares'}`,'orange')}</div>`).join('') || empty('Todo a buen nivel','Tu stock está por encima de los mínimos.','check')}</div><a class="alert-footer" href="#/inventory"><span>Anticípate a tu próxima reposición</span>${icon('arrow')}</a></section>`;
}
function stockBadge(p) {return p.stock===0?badge('Agotado','red'):p.stock<=p.min_stock?badge('Stock bajo','orange'):badge('Disponible');}
function filteredProducts() {
  return state.data.products.filter(p=>match(p.sku,p.brand,p.model,p.size,p.color,p.category)&&(state.tab==='inactive'?!p.active:p.active)&&(state.tab==='low'?p.stock<=p.min_stock:true)&&(state.tab.startsWith('cat-')?p.category===state.tab.slice(4):true));
}
function productTable(products,inventory=false) {
  if(!products.length)return empty('Sin coincidencias','Prueba con otra búsqueda o registra un producto.','shoe');
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>SKU</th><th>Talla / color</th>${inventory?'<th>Stock mínimo</th>':`<th>Categoría</th>${admin()?'<th>Costo</th>':''}<th>Precio</th>`}<th>Existencias</th><th>Estado</th>${admin()?'<th>Editar</th>':''}</tr></thead><tbody>${products.map(p=>`<tr><td><div class="product-cell">${productArt(p)}<div><span class="strong">${e(p.brand)} ${e(p.model)}</span><span class="cell-sub">${e(p.category)}</span></div></div></td><td>${e(p.sku)}</td><td>${e(p.size)} <span class="muted">/ ${e(p.color)}</span></td>${inventory?`<td>${p.min_stock} pares</td>`:`<td>${e(p.category)}</td>${admin()?`<td>${money(p.cost)}</td>`:''}<td class="amount">${money(p.price)}</td>`}<td class="strong">${p.stock} pares</td><td>${p.active?stockBadge(p):badge('Inactivo','gray')}</td>${admin()?`<td><button class="icon-btn" type="button" data-action="edit-product" data-id="${p.id}" aria-label="Editar ${e(p.model)} talla ${e(p.size)}">${icon('edit')}</button></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function tab(label,value) {return `<button type="button" class="tab ${state.tab===value?'active':''}" data-action="tab" data-tab="${e(value)}">${e(label)}</button>`;}
function viewProducts() {
  const products=filteredProducts();
  return heading('Cada par tiene su lugar.','Administra modelos, tallas, colores y precios de tu catálogo.',admin()?button('Nuevo producto','new-product'):'')+`<section class="panel"><div class="toolbar"><div class="tabs">${tab('Todos los productos','all')}${tab('Urbanas','cat-Urbanas')}${tab('Running','cat-Running')}${tab('Lifestyle','cat-Lifestyle')}${tab('Inactivos','inactive')}</div><span class="muted">${products.length} variantes</span></div>${productTable(products)}<div class="table-foot"><span>Una variante por modelo, talla y color · SKU único</span><span>${state.data.products.filter(p=>p.active).length} activas</span></div></section>`;
}
function viewInventory(embedded=false) {
  const p=filteredProducts();
  if(embedded)return `<section class="panel"><div class="panel-head"><h2>Existencias actuales</h2><a class="link-btn" href="#/inventory">Ver todo ${icon('arrow')}</a></div>${productTable(p.slice(0,5),true)}</section>`;
  let html=heading('Siempre un paso por delante.','Consulta existencias y mantén cada movimiento de stock registrado.',state.user.role!=='seller'?button('Ajustar inventario','adjust-stock','plus'):'');
  html+=`<div class="stats">${stat('Pares disponibles',number(state.data.dashboard.stock.total),'Stock actual de productos activos','box')}${stat('Variantes activas',number(state.data.dashboard.stock.variants),'Modelo, talla y color','shoe')}${stat('Por reponer',number(state.data.dashboard.stock.low),'Stock menor o igual al mínimo','warning')}${stat('Sin existencias',number(state.data.products.filter(p=>p.active&&!p.stock).length),'Variantes agotadas','bag')}</div><section class="panel"><div class="toolbar"><div class="tabs">${tab('Existencias','all')}${tab('Stock bajo','low')}${state.user.role!=='seller'?tab('Movimientos','movements'):''}</div><span class="muted">El stock se actualiza con compras y ventas</span></div>`;
  if(state.tab==='movements') {
    const rows=state.data.stockMovements.filter(m=>match(m.reason,m.model,m.brand,m.sku,m.user_name));
    html+=rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th><th>Responsable</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${dateLabel(m.created_at,true)}</td><td class="strong">${e(m.brand)} ${e(m.model)}<span class="cell-sub">${e(m.size)} / ${e(m.color)}</span></td><td>${badge(movementNames[m.type],m.quantity<0?'gray':'')}</td><td class="${m.quantity>0?'positive':'negative'}">${m.quantity>0?'+':''}${m.quantity}</td><td>${e(m.reason)}</td><td>${e(m.user_name)}</td></tr>`).join('')}</tbody></table></div><div class="table-foot">Se muestran hasta los últimos 300 movimientos.</div>`:empty('Sin movimientos','Registra una venta, recepción o ajuste.');
  } else html+=productTable(p,true);
  return html+'</section>';
}
function viewSales() {
  const sales=state.data.sales.filter(s=>match(`V-${String(s.id).padStart(4,'0')}`,s.customer_name,s.seller_name,paymentNames[s.payment_method]));
  return heading('Una buena venta. Un nuevo paso.','Registra ventas y consulta las constancias internas de tu tienda.',button('Nueva venta','new-sale'))+`<div class="inline-note">${icon('receipt')} Las constancias son documentos internos sin valor tributario.</div><section class="panel"><div class="toolbar"><h2 style="font-size:13px">Historial de ventas</h2>${periodSelect()}</div><div class="summary-strip"><span>Ventas: <strong>${sales.length}</strong></span><span>Total del resultado: <strong>${money(sales.reduce((s,i)=>s+i.total,0))}</strong></span><span>${dateLabel(state.from)} — ${dateLabel(state.to)}</span></div>${salesTable(sales)}<div class="table-foot"><span>Precios finales · cobros al contado</span><span>Las ventas confirmadas actualizan inventario</span></div></section>`;
}
function viewContacts(kind) {
  const isSupplier=kind==='suppliers',rows=state.data[kind].filter(c=>match(c.name,c.document,c.phone,c.email,c.contact));
  return heading(isSupplier?'Tus aliados para seguir avanzando.':'Cada cliente, una nueva historia.',isSupplier?'Organiza los contactos de quienes abastecen tu tienda.':'Mantén a mano los datos de los clientes de tu tienda.',button(isSupplier?'Nuevo proveedor':'Nuevo cliente',isSupplier?'new-supplier':'new-customer','plus'))+`<section class="panel"><div class="toolbar"><h2 style="font-size:13px">${isSupplier?'Directorio de proveedores':'Directorio de clientes'}</h2><span class="muted">${rows.length} registros</span></div>${rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>${isSupplier?'Proveedor':'Cliente'}</th><th>Documento</th>${isSupplier?'<th>Contacto</th>':''}<th>Teléfono</th><th>Correo</th><th>Editar</th></tr></thead><tbody>${rows.map(c=>`<tr><td class="strong">${e(c.name)}</td><td>${e(c.document)||'—'}</td>${isSupplier?`<td>${e(c.contact)||'—'}</td>`:''}<td>${e(c.phone)||'—'}</td><td>${e(c.email)||'—'}</td><td><button type="button" class="icon-btn" data-action="edit-${isSupplier?'supplier':'customer'}" data-id="${c.id}" aria-label="Editar ${e(c.name)}">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>`:empty('El directorio está vacío','Registra el primer contacto.','users')}</section>`;
}
function viewPurchases() {
  const rows=state.data.purchases.filter(p=>match(`C-${String(p.id).padStart(4,'0')}`,p.supplier_name,p.note)&&(state.tab==='all'||p.status===state.tab));
  return heading('Que nunca falte el próximo par.','Registra compras y recibe mercadería para reponer tu inventario.',admin()?button('Nueva compra','new-purchase'):'')+`<div class="inline-note">${icon('truck')} Las existencias aumentan al confirmar la recepción. Cada compra se recibe una sola vez.</div><section class="panel"><div class="toolbar"><div class="tabs">${tab('Todas','all')}${tab('Pendientes de recibir','pending')}${tab('Recibidas','received')}</div><span class="muted">${rows.length} compras</span></div>${rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Compra</th><th>Proveedor</th><th>Fecha</th><th>Pares</th>${admin()?'<th>Importe</th>':''}<th>Estado</th><th>Acción</th></tr></thead><tbody>${rows.map(p=>`<tr><td class="strong">C-${String(p.id).padStart(4,'0')}</td><td>${e(p.supplier_name)}<span class="cell-sub">${e(p.note)}</span></td><td>${dateLabel(p.created_at,true)}</td><td>${p.quantity}</td>${admin()?`<td class="amount">${money(p.total)}</td>`:''}<td>${badge(p.status==='pending'?'Por recibir':'Recibida',p.status==='pending'?'orange':'')}</td><td>${p.status==='pending'?button('Recibir','receive-purchase','check','','data-id="'+p.id+'"'):badge(dateLabel(p.received_at),'gray')}</td></tr>`).join('')}</tbody></table></div>`:empty('No hay compras en esta vista','Las reposiciones aparecerán aquí.','truck')}</section>`;
}
function viewCash() {
  const cash=state.data.cash,current=cash.current;
  const head=heading('Tus números, claros. Tu caja, en orden.','Controla el efectivo de la tienda, desde la apertura hasta el cierre.');
  let html=head+`<div class="cash-overview"><section class="cash-card"><div class="eyebrow">${current?'Efectivo esperado en caja':'La caja está cerrada'}</div><h2>${current?money(current.expected):'Todo listo para abrir.'}</h2><p>${current?`Abierta por ${e(current.opened_by_name)} · ${dateLabel(current.opened_at,true)}`:'Registra tu fondo inicial para empezar a vender.'}</p><div class="cash-actions">${current?button('Registrar movimiento','cash-move','plus','lime')+button('Cerrar caja','cash-close','lock',''):button('Abrir caja','cash-open','wallet','lime')}</div></section><section class="panel cash-detail"><div class="cash-line"><span>Fondo de apertura</span><strong>${money(current?.opening_amount)}</strong></div><div class="cash-line"><span>Ventas en efectivo e ingresos</span><strong class="positive">+ ${money(current?.income)}</strong></div><div class="cash-line"><span>Egresos</span><strong class="negative">− ${money(current?.expense)}</strong></div></section></div><div class="inline-note">${icon('wallet')} La caja controla solo efectivo. Los pagos con tarjeta y transferencia aparecen en ventas y reportes.</div>`;
  if(current&&day(new Date(current.opened_at))!==day())html+=`<div class="inline-note orange">${icon('warning')} Esta caja corresponde a una fecha anterior. Ciérrala y abre la caja de hoy para continuar vendiendo.</div>`;
  const movements=cash.movements.filter(m=>match(m.reason,m.user_name,movementNames[m.type]));
  html+=`<div class="content-stack"><section class="panel"><div class="panel-head"><div><h2>Movimientos de la ${current?'caja actual':'última caja'}</h2><p class="panel-sub">Trazabilidad de cada ingreso y salida de efectivo</p></div></div>${movements.length?`<div class="table-wrap" style="margin-top:15px"><table class="data-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Responsable</th><th>Importe</th></tr></thead><tbody>${movements.map(m=>`<tr><td>${dateLabel(m.created_at,true)}</td><td class="strong">${e(m.reason)}</td><td>${badge(movementNames[m.type],m.type==='expense'?'orange':'')}</td><td>${e(m.user_name)}</td><td class="amount ${m.type==='expense'?'negative':'positive'}">${m.type==='expense'?'−':'+'} ${money(m.amount)}</td></tr>`).join('')}</tbody></table></div>`:empty('Sin movimientos','El fondo inicial se muestra por separado.','wallet')}</section><section class="panel"><div class="panel-head"><h2>Historial de aperturas y cierres</h2></div><div class="table-wrap" style="margin-top:15px"><table class="data-table"><thead><tr><th>Apertura</th><th>Responsable</th><th>Fondo</th><th>Cierre</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead><tbody>${cash.history.filter(c=>match(c.opened_by_name,c.opened_at)).map(c=>`<tr><td>${dateLabel(c.opened_at,true)}</td><td>${e(c.opened_by_name)}</td><td>${money(c.opening_amount)}</td><td>${c.closed_at?dateLabel(c.closed_at,true):badge('Abierta','',true)}</td><td>${c.expected_amount!==null?money(c.expected_amount):'—'}</td><td>${c.counted_amount!==null?money(c.counted_amount):'—'}</td><td>${c.difference===null?'—':badge(money(c.difference),c.difference?'orange':'')}</td></tr>`).join('')}</tbody></table></div><div class="table-foot">Se muestran las últimas 50 cajas.</div></section></div>`;
  return html;
}
function viewReports() {
  const r=state.report;
  if(!r)return '<div class="skeleton">Preparando reportes…</div>';
  let html=heading('Decisiones con un buen punto de partida.','Consulta ventas, productos, existencias y movimientos de caja.',button('Exportar ventas','export-sales','download',''));
  html+=`<form class="report-filters" data-form="report-range"><label class="field"><span>Desde</span><input type="date" name="from" required value="${state.from}"></label><label class="field"><span>Hasta</span><input type="date" name="to" required value="${state.to}"></label><button class="btn primary" type="submit">${icon('chart')} Aplicar período</button></form><div class="stats">${stat('Ventas',money(r.totals.sales),`${r.totals.count} ventas registradas`,'money')}${stat('Margen bruto',money(r.totals.margin),'Precio menos costo histórico de venta','chart')}${stat('Pares vendidos',number(r.totals.units),'Unidades vendidas en el período','shoe')}${stat('Valor de inventario',money(r.totals.value),'Stock actual valorizado al último costo','box')}</div><div class="report-grid"><section class="panel"><div class="panel-head"><h2>Ventas por día</h2><span class="legend"><i class="dot"></i> Soles</span></div>${chart(r.daily)}</section><section class="panel"><div class="panel-head"><h2>Medios de pago</h2></div><div class="panel-body">${['cash','card','transfer'].map(m=>`<div class="report-payment"><span>${paymentNames[m]}</span><strong>${money(r.payments.find(p=>p.payment_method===m)?.total)}</strong></div>`).join('')}<p class="report-note">El margen bruto no descuenta gastos operativos. Las existencias muestran el estado actual, independientemente del período de ventas.</p></div></section></div><section class="panel"><div class="toolbar"><div class="tabs">${tab('Más vendidos','all')}${tab('Stock actual','stock')}${tab('Stock mínimo','low')}${tab('Movimientos de caja','cash-report')}</div>${button('Exportar vista','export-report','download','')}</div>`;
  if(state.tab==='all') {
    const rows=r.top.filter(p=>match(p.model,p.brand,p.size,p.color));
    html+=rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Talla / color</th><th>Pares vendidos</th><th>Ventas</th><th>Margen bruto</th></tr></thead><tbody>${rows.map(p=>`<tr><td class="strong">${e(p.brand)} ${e(p.model)}</td><td>${e(p.size)} / ${e(p.color)}</td><td>${p.quantity}</td><td class="amount">${money(p.revenue)}</td><td>${money(p.margin)}</td></tr>`).join('')}</tbody></table></div>`:empty('Sin ventas en este período','Ajusta las fechas para consultar otro período.','chart');
  } else if(state.tab==='cash-report') {
    const rows=r.movements.filter(m=>match(m.reason,m.user_name,movementNames[m.type]));
    html+=rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Caja</th><th>Tipo</th><th>Motivo</th><th>Importe</th><th>Responsable</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${dateLabel(m.created_at,true)}</td><td>#${m.session_id}</td><td>${badge(movementNames[m.type],m.type==='expense'?'orange':'')}</td><td>${e(m.reason)}</td><td class="${m.type==='expense'?'negative':'positive'}">${m.type==='expense'?'−':'+'}${money(m.amount)}</td><td>${e(m.user_name)}</td></tr>`).join('')}</tbody></table></div>`:empty('Sin movimientos de caja','No hay movimientos en el período.','wallet');
  } else html+=productTable(r.stock.filter(p=>(state.tab!=='low'||p.stock<=p.min_stock)&&match(p.brand,p.model,p.sku,p.size,p.color)),true);
  return html+'</section>';
}
function viewUsers() {
  const rows=state.data.users.filter(u=>match(u.name,u.email,roleNames[u.role]));
  return heading('El equipo detrás de cada paso.','Administra cuentas y define lo que cada persona puede hacer.',button('Nuevo usuario','new-user'))+`<div class="inline-note">${icon('shield')} Cada persona accede a las funciones de su rol. Las cuentas desactivadas no pueden iniciar sesión.</div><section class="panel"><div class="toolbar"><h2 style="font-size:13px">Usuarios de la tienda</h2><span class="muted">${rows.length} usuarios</span></div>${rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Editar</th></tr></thead><tbody>${rows.map(u=>`<tr><td><div class="user-avatar-cell"><span class="avatar">${e(initials(u.name))}</span><span class="strong">${e(u.name)}${u.id===state.user.id?' <span class="muted">(tú)</span>':''}</span></div></td><td>${e(u.email)}</td><td>${badge(roleNames[u.role],u.role==='admin'?'':'gray')}</td><td>${badge(u.active?'Activo':'Inactivo',u.active?'':'red',true)}</td><td><button class="icon-btn" type="button" data-action="edit-user" data-id="${u.id}" aria-label="Editar ${e(u.name)}">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Sin coincidencias','Prueba otro nombre o correo.','users')}</section>`;
}
function viewHelp() {
  return heading('Todo empieza con un pequeño paso.','Aprende a gestionar tu tienda y aprovecha cada módulo del sistema.')+`<div class="help-grid"><section class="panel help-card">${icon('cart')}<h2>Una venta, de principio a fin</h2><ol><li>Comprueba que la caja de hoy esté abierta.</li><li>Pulsa <strong>Nueva venta</strong> y agrega las variantes.</li><li>Selecciona cliente y medio de pago.</li><li>Confirma y revisa la constancia interna.</li></ol><p>El sistema descuenta stock y registra el ingreso de efectivo cuando corresponda.</p></section><section class="panel help-card">${icon('truck')}<h2>Repón tu inventario</h2><ol><li>Registra un proveedor desde su directorio.</li><li>Crea una compra con cantidades y costos.</li><li>Confirma la recepción cuando llegue la mercadería.</li><li>Revisa el nuevo stock y los movimientos.</li></ol><p>El ajuste manual exige un motivo y evita cantidades negativas.</p></section><section class="panel help-card">${icon('shield')}<h2>Cada rol tiene su espacio</h2><p><strong>Administrador:</strong> todos los módulos y mantenimiento de datos.<br><strong>Vendedor:</strong> catálogo, existencias, clientes, ventas y caja.<br><strong>Almacén:</strong> catálogo, inventario, ajustes y recepción de compras.</p></section><section class="panel help-card">${icon('help')}<h2>Tu tienda, conectada</h2><p>Las compras y las ventas actualizan tus existencias. Controla el efectivo desde Caja y consulta los resultados de tu tienda en Reportes. El menú muestra las herramientas disponibles para tu rol.</p><p style="margin-top:10px">Una tienda · moneda PEN · horario de Lima. Constancias internas sin valor tributario.</p></section></div>`;
}

function openModal(title,description,body,footer='',wide=false) {
  if(modal.open)modal.close();
  modal.className=wide?'wide-modal':'';
  modal.innerHTML=`<header class="modal-head"><div><h2 id="modal-title">${e(title)}</h2>${description?`<p>${e(description)}</p>`:''}</div><button type="button" class="icon-btn" data-action="close-modal" aria-label="Cerrar ventana">${icon('close')}</button></header>${body}${footer?`<footer class="modal-foot">${footer}</footer>`:''}`;
  modal.showModal();
}
const cancelButton=()=>button('Cancelar','close-modal','close','');
const saveButton=(label='Guardar',form='editor')=>`<button type="submit" form="${form}" class="btn primary">${icon('check')}${e(label)}</button>`;
function field(label,name,value='',type='text',options={}) {
  return `<label class="field ${options.wide?'span-2':''}"><span>${e(label)}${options.optional?' <span class="label-required">(opcional)</span>':''}</span><input type="${type}" name="${name}" value="${e(value)}" ${options.optional?'':'required'} ${type==='number'?`min="${options.min??0}" max="${options.max??10000000}" step="${options.step??1}"`:''} ${type==='password'?'autocomplete="new-password" minlength="8" maxlength="128"':`maxlength="${options.maxLength??120}"`} ${options.extra||''}>${options.hint?`<small>${e(options.hint)}</small>`:''}</label>`;
}
function selectField(label,name,value,options,wide=false) {
  return `<label class="field ${wide?'span-2':''}"><span>${e(label)}</span><select name="${name}" required>${options.map(([key,label])=>`<option value="${e(key)}" ${String(key)===String(value)?'selected':''}>${e(label)}</option>`).join('')}</select></label>`;
}
function editorForm(kind,id,fields) {
  return `<form id="editor" data-form="${kind}" ${id?`data-id="${id}"`:''} class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${fields}</div></form>`;
}
function productEditor(id) {
  const p=state.data.products.find(p=>p.id===id)||{category:'Urbanas',min_stock:5,cost:0,price:0,active:1};
  openModal(id?'Editar variante':'Nuevo producto','Cada combinación de modelo, talla y color tiene su propio SKU.',editorForm('product',id,
    field('SKU','sku',p.sku,'text',{maxLength:40})+field('Marca','brand',p.brand,'text',{maxLength:60})+field('Modelo','model',p.model)+selectField('Categoría','category',p.category,['Urbanas','Running','Lifestyle','Basketball','Training'].map(v=>[v,v]))+field('Talla','size',p.size,'text',{maxLength:8})+field('Color','color',p.color,'text',{maxLength:40})+field('Costo unitario (S/)','cost',p.cost/100,'number',{step:'.01'})+field('Precio de venta (S/)','price',p.price/100,'number',{min:.01,step:'.01'})+field('Stock mínimo','min_stock',p.min_stock,'number',{max:10000})+(id?selectField('Estado','active',p.active,[[1,'Activo'],[0,'Inactivo']]):field('Stock inicial','initial_stock',0,'number',{max:100000}))),cancelButton()+saveButton());
}
function contactEditor(kind,id) {
  const c=state.data[kind].find(c=>c.id===id)||{};
  const supplier=kind==='suppliers';
  openModal(`${id?'Editar':'Nuevo'} ${supplier?'proveedor':'cliente'}`,'Datos de contacto de la tienda.',editorForm(kind,id,field(supplier?'Razón social / nombre':'Nombre completo','name',c.name,'text',{wide:true})+field('Documento','document',c.document,'text',{optional:true,maxLength:20})+field('Teléfono','phone',c.phone,'text',{optional:true,maxLength:30})+field('Correo','email',c.email,'email',{optional:true,wide:!supplier})+(supplier?field('Persona de contacto','contact',c.contact,'text',{optional:true}):'')),cancelButton()+saveButton());
}
function userEditor(id) {
  const u=state.data.users.find(u=>u.id===id)||{role:'seller',active:1};
  openModal(id?'Editar usuario':'Nuevo usuario','Los permisos se aplican automáticamente según el rol.',editorForm('user',id,field('Nombre completo','name',u.name,'text',{wide:true,maxLength:100})+field('Correo de acceso','email',u.email,'email',{wide:true})+field(id?'Nueva contraseña':'Contraseña','password','','password',{optional:!!id,wide:true,hint:id?'Déjala vacía para conservar la actual. Mínimo 8 caracteres.':'Mínimo 8 caracteres.'})+selectField('Rol','role',u.role,Object.entries(roleNames))+selectField('Estado','active',u.active,[[1,'Activo'],[0,'Inactivo']])),cancelButton()+saveButton());
}
function adjustmentEditor() {
  const products=state.data.products.filter(p=>p.active);
  if(!products.length)return toast('Primero registra un producto activo.',true);
  openModal('Ajustar inventario','Cada ajuste guarda su motivo y la persona responsable.',editorForm('adjustment',null,selectField('Variante','product_id',products[0].id,products.map(p=>[p.id,`${p.brand} ${p.model} · ${p.size} / ${p.color} · ${p.stock} pares`]),true)+field('Cantidad a sumar o restar','quantity',1,'number',{min:-100000,max:100000,wide:true,hint:'Positivo para entrada, negativo para salida. Ejemplo: −2 por merma.'})+field('Motivo del ajuste','reason','','text',{wide:true,maxLength:250})),cancelButton()+saveButton('Registrar ajuste'));
}
function cashEditor(kind) {
  let fields,title,desc,submit;
  if(kind==='open') {title='Abrir caja';desc='Registra el efectivo inicial para la jornada.';fields=field('Fondo inicial (S/)','opening_amount',0,'number',{wide:true,step:'.01'});submit='Confirmar apertura';}
  if(kind==='move') {title='Registrar movimiento';desc='Solo se registran movimientos de efectivo.';fields=selectField('Tipo de movimiento','type','income',[['income','Ingreso'],['expense','Egreso']],true)+field('Importe (S/)','amount','','number',{wide:true,min:.01,step:'.01'})+field('Motivo','reason','','text',{wide:true,maxLength:250});submit='Registrar movimiento';}
  if(kind==='close') {title='Cerrar caja';desc=`Efectivo esperado: ${money(state.data.cash.current.expected)}. Cuenta el dinero físico.`;fields=field('Efectivo contado (S/)','counted_amount','','number',{wide:true,step:'.01',hint:'Se registrará la diferencia entre lo contado y lo esperado.'});submit='Confirmar cierre';}
  openModal(title,desc,editorForm(`cash-${kind}`,null,fields),cancelButton()+saveButton(submit));
}
function purchaseLine() {
  const products=state.data.products.filter(p=>p.active);
  return `<div class="purchase-line"><select name="product_id" data-purchase-product required aria-label="Producto"><option value="">Selecciona una variante</option>${products.map(p=>`<option value="${p.id}">${e(p.brand)} ${e(p.model)} · ${e(p.size)} / ${e(p.color)}</option>`).join('')}</select><input name="quantity" type="number" min="1" max="10000" step="1" value="1" required aria-label="Cantidad"><input name="unit_cost" type="number" min="0.01" max="10000000" step=".01" value="0" required aria-label="Costo unitario en soles"><button class="icon-btn" type="button" data-action="remove-purchase-line" aria-label="Eliminar línea">${icon('close')}</button></div>`;
}
function purchaseEditor() {
  if(!state.data.suppliers.length)return toast('Registra un proveedor antes de crear una compra.',true);
  if(!state.data.products.some(p=>p.active))return toast('Registra un producto activo antes de crear una compra.',true);
  openModal('Nueva compra','Las existencias se actualizan al confirmar la recepción.',`<form id="editor" data-form="purchase" class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${selectField('Proveedor','supplier_id','', [['','Selecciona un proveedor'],...state.data.suppliers.map(s=>[s.id,s.name])],true)}${field('Observación','note','','text',{optional:true,wide:true,maxLength:250})}<div class="span-2"><div class="line-labels"><span>Variante</span><span>Pares</span><span>Costo S/</span></div><div class="purchase-lines">${purchaseLine()}</div><div style="margin-top:12px">${button('Agregar producto','add-purchase-line','plus','sm')}</div><div class="purchase-total">Total de compra <strong id="purchase-total">${money(0)}</strong></div></div></div></form>`,cancelButton()+saveButton('Registrar compra'));
}
function purchaseTotal() {
  const total=[...modal.querySelectorAll('.purchase-line')].reduce((sum,line)=>sum+(Number(line.querySelector('[name=quantity]').value)||0)*(Number(line.querySelector('[name=unit_cost]').value)||0),0);
  const element=modal.querySelector('#purchase-total');if(element)element.textContent=money(Math.round(total*100));
}
async function confirmReceive(id) {
  const p=await api(`/purchases/${id}`);
  openModal(`Recibir compra C-${String(id).padStart(4,'0')}`,p.supplier_name,`<form id="editor" data-form="receive" data-id="${id}" class="modal-body"><div class="form-error" role="alert"></div><p class="inline-note">${icon('truck')} Confirma que recibiste todos los pares indicados. Se sumarán al inventario.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Talla / color</th><th>Cantidad</th></tr></thead><tbody>${p.items.map(i=>`<tr><td class="strong">${e(i.brand)} ${e(i.model)}</td><td>${e(i.size)} / ${e(i.color)}</td><td>${i.quantity} pares</td></tr>`).join('')}</tbody></table></div></form>`,cancelButton()+saveButton('Confirmar recepción'));
}
function startSale() {
  if(!state.data.cash?.current) {toast('Abre la caja para registrar una venta.');location.hash='/cash';return;}
  if(day(new Date(state.data.cash.current.opened_at))!==day()) {toast('Cierra la caja anterior y abre la caja de hoy.',true);location.hash='/cash';return;}
  state.cart=[];state.cartRequest=crypto.randomUUID();state.saleCustomer='';state.salePayment='cash';
  openModal('Un nuevo par. Una nueva venta.','Selecciona las variantes, revisa el detalle y confirma.',`<div class="pos"><section class="pos-products"><input class="pos-search" id="pos-search" placeholder="Buscar modelo, talla o color…" aria-label="Buscar productos para vender"><div class="pos-list" id="pos-products"></div></section><form id="sale-form" data-form="sale" class="pos-cart"></form></div>`,cancelButton()+saveButton('Confirmar venta','sale-form'),true);
  renderPosProducts();renderCart();
}
function renderPosProducts() {
  const query=(modal.querySelector('#pos-search')?.value || '').toLowerCase();
  const products=state.data.products.filter(p=>p.active&&`${p.brand} ${p.model} ${p.size} ${p.color} ${p.sku}`.toLowerCase().includes(query));
  const element=modal.querySelector('#pos-products');
  if(element)element.innerHTML=products.map(p=>`<button type="button" class="pos-product" data-action="add-cart" data-id="${p.id}" ${!p.stock?'disabled':''}>${productArt(p)}<strong>${e(p.brand)} ${e(p.model)}</strong><small>Talla ${e(p.size)} · ${e(p.color)}</small><div class="pos-product-end"><span class="amount">${money(p.price)}</span>${badge(`${p.stock} pares`,p.stock<=p.min_stock?'orange':'')}</div></button>`).join('') || empty('Sin coincidencias','Prueba con otro modelo.','shoe');
}
function renderCart() {
  const container=modal.querySelector('#sale-form');if(!container)return;
  const total=state.cart.reduce((s,item)=>s+item.quantity*state.data.products.find(p=>p.id===item.product_id).price,0);
  container.innerHTML=`<h3>Detalle de la venta ${badge(`${state.cart.reduce((s,i)=>s+i.quantity,0)} pares`,'gray')}</h3>${selectField('Cliente','customer_id',state.saleCustomer,[['','Cliente general'],...state.data.customers.map(c=>[c.id,c.name])])}<div class="cart-lines">${state.cart.length?state.cart.map(item=>{const p=state.data.products.find(p=>p.id===item.product_id);return `<div class="cart-line"><div><strong>${e(p.brand)} ${e(p.model)}</strong><small>${e(p.size)} / ${e(p.color)} · ${money(p.price)}</small></div><div class="quantity-control"><button type="button" data-action="cart-minus" data-id="${p.id}" aria-label="Quitar un par de ${e(p.model)}">${icon('minus')}</button><span>${item.quantity}</span><button type="button" data-action="add-cart" data-id="${p.id}" aria-label="Agregar un par de ${e(p.model)}">${icon('plus')}</button></div></div>`;}).join(''):empty('El próximo par empieza aquí','Agrega un producto del catálogo.','cart')}</div>${selectField('Medio de pago','payment_method',state.salePayment,Object.entries(paymentNames))}<div class="cart-total"><span>Total a cobrar</span><strong>${money(total)}</strong></div><div class="form-error" role="alert"></div><small class="muted">Constancia interna de venta · sin valor tributario</small>`;
  // Cliente general es una opción válida sin un registro asociado.
  container.querySelector('[name=customer_id]').required=false;
}
function changeCart(id,delta) {
  const p=state.data.products.find(p=>p.id===id),item=state.cart.find(i=>i.product_id===id);
  if(delta>0&&(item?.quantity || 0)>=p.stock)return toast('Ya agregaste todos los pares disponibles.',true);
  if(item)item.quantity+=delta;else if(delta>0)state.cart.push({product_id:id,quantity:1});
  state.cart=state.cart.filter(i=>i.quantity>0);renderCart();
}
async function showReceipt(id) {
  const sale=await api(`/sales/${id}`);
  openModal('Constancia de venta','Documento de uso interno de la tienda.',`<div class="modal-body"><article class="receipt"><header class="receipt-brand">${brand()}<p>Paso Sneakers · Tienda principal, Lima</p><p><strong>CONSTANCIA INTERNA V-${String(sale.id).padStart(4,'0')}</strong></p></header><div class="receipt-meta"><div><strong>Cliente</strong>${e(sale.customer_name)}${sale.customer_document?`<br>${e(sale.customer_document)}`:''}</div><div><strong>Fecha / hora</strong>${dateLabel(sale.created_at,true)} · Lima</div><div><strong>Atendido por</strong>${e(sale.seller_name)}</div><div><strong>Medio de pago</strong>${paymentNames[sale.payment_method]}</div></div><table class="data-table"><thead><tr><th>Detalle</th><th>Cant.</th><th>P. unit.</th><th>Importe</th></tr></thead><tbody>${sale.items.map(i=>`<tr><td class="strong">${e(i.brand)} ${e(i.model)}<span class="cell-sub">Talla ${e(i.size)} · ${e(i.color)}</span></td><td>${i.quantity}</td><td>${money(i.unit_price)}</td><td>${money(i.unit_price*i.quantity)}</td></tr>`).join('')}</tbody></table><div class="receipt-total">Total pagado<strong>${money(sale.total)}</strong></div><p class="receipt-disclaimer">Gracias por dar tu siguiente paso con nosotros.<br>Constancia interna sin valor de comprobante tributario.<br>Moneda: soles (PEN)</p></article></div>`,button('Cerrar','close-modal','close','')+button('Imprimir / guardar PDF','print','print','primary'),true);
}
function csvCell(value) {
  let text=String(value??'');if(/^[\s]*[=+@\-]/.test(text))text="'"+text;
  return `"${text.replace(/"/g,'""')}"`;
}
function downloadCSV(name,headers,rows) {
  const csv='\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=url;a.download=`paso-${name}-${state.from}-${state.to}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Reporte exportado.');
}
function exportReport(sales=false) {
  const r=state.report;
  if(sales)return downloadCSV('ventas',['Constancia','Fecha UTC','Cliente','Medio de pago','Total PEN'],r.sales.filter(s=>match(`V-${String(s.id).padStart(4,'0')}`,s.customer_name,s.seller_name,paymentNames[s.payment_method])).map(s=>[`V-${String(s.id).padStart(4,'0')}`,s.created_at,s.customer_name,paymentNames[s.payment_method],(s.total/100).toFixed(2)]));
  if(state.tab==='all')downloadCSV('mas-vendidos',['Marca','Modelo','Talla','Color','Pares vendidos','Ventas PEN','Margen bruto PEN'],r.top.filter(p=>match(p.model,p.brand,p.size,p.color)).map(p=>[p.brand,p.model,p.size,p.color,p.quantity,(p.revenue/100).toFixed(2),(p.margin/100).toFixed(2)]));
  else if(state.tab==='cash-report')downloadCSV('caja',['Fecha UTC','Caja','Tipo','Motivo','Importe PEN','Responsable'],r.movements.filter(m=>match(m.reason,m.user_name,movementNames[m.type])).map(m=>[m.created_at,m.session_id,movementNames[m.type],m.reason,((m.type==='expense'?-1:1)*m.amount/100).toFixed(2),m.user_name]));
  else downloadCSV(state.tab==='low'?'stock-minimo':'existencias',['SKU','Marca','Modelo','Talla','Color','Stock','Stock mínimo','Costo PEN','Precio PEN'],r.stock.filter(p=>(state.tab!=='low'||p.stock<=p.min_stock)&&match(p.brand,p.model,p.sku,p.size,p.color)).map(p=>[p.sku,p.brand,p.model,p.size,p.color,p.stock,p.min_stock,(p.cost/100).toFixed(2),(p.price/100).toFixed(2)]));
}
function setBusy(busy) {state.busy=busy;document.querySelectorAll('button[type=submit]').forEach(b=>{b.disabled=busy;});}
async function saveAndRefresh(path,body,method,message) {
  const result=await api(path,body,method);
  modal.close();
  try {await refresh();toast(message);}catch(error){toast(`${message} No se pudo actualizar la pantalla: ${error.message}`,true);}
  return result;
}
document.addEventListener('submit',async event=>{
  const form=event.target.closest('form[data-form]');if(!form)return;
  event.preventDefault();if(state.busy)return;
  const type=form.dataset.form,values=Object.fromEntries(new FormData(form)),id=form.dataset.id;
  formError('',form);setBusy(true);
  try {
    if(type==='login') {await api('/auth/login',values);state.route='dashboard';location.hash='/dashboard';await refresh();}
    else if(type==='product') {for(const key of ['cost','price','min_stock','initial_stock','active'])if(key in values)values[key]=Number(values[key]);await saveAndRefresh(id?`/products/${id}`:'/products',values,id?'PUT':'POST','Producto guardado.');}
    else if(type==='customers'||type==='suppliers')await saveAndRefresh(id?`/${type}/${id}`:`/${type}`,values,id?'PUT':'POST',type==='customers'?'Cliente guardado.':'Proveedor guardado.');
    else if(type==='user') {values.active=Number(values.active);await saveAndRefresh(id?`/users/${id}`:'/users',values,id?'PUT':'POST','Usuario guardado.');}
    else if(type==='adjustment')await saveAndRefresh('/inventory/adjustments',{product_id:Number(values.product_id),quantity:Number(values.quantity),reason:values.reason},'POST','Ajuste registrado.');
    else if(type==='purchase') {
      const items=[...form.querySelectorAll('.purchase-line')].map(line=>({product_id:Number(line.querySelector('[name=product_id]').value),quantity:Number(line.querySelector('[name=quantity]').value),unit_cost:Number(line.querySelector('[name=unit_cost]').value)}));
      await saveAndRefresh('/purchases',{supplier_id:Number(values.supplier_id),note:values.note,items},'POST','Compra registrada. Pendiente de recepción.');
    } else if(type==='receive')await saveAndRefresh(`/purchases/${id}/receive`,{},'POST','Mercadería recibida. Inventario actualizado.');
    else if(type==='cash-open')await saveAndRefresh('/cash/open',{opening_amount:Number(values.opening_amount)},'POST','Caja abierta.');
    else if(type==='cash-move')await saveAndRefresh('/cash/movements',{type:values.type,amount:Number(values.amount),reason:values.reason},'POST','Movimiento registrado.');
    else if(type==='cash-close') {
      const result=await saveAndRefresh('/cash/close',{counted_amount:Number(values.counted_amount)},'POST','Caja cerrada.');
      openModal('Cierre de caja registrado','El resultado quedó guardado en el historial.',`<div class="modal-body close-result">${icon('check')}<h3>${result.difference===0?'Tu caja está cuadrada.':'Hay una diferencia registrada.'}</h3><p>Esperado: <strong>${money(result.expected)}</strong><br>Contado: <strong>${money(result.counted)}</strong><br>Diferencia: <strong>${money(result.difference)}</strong></p></div>`,button('Entendido','close-modal','check','primary'));
    } else if(type==='sale') {
      if(!state.cart.length)throw new Error('Agrega al menos un producto a la venta.');
      const result=await api('/sales',{items:state.cart,customer_id:values.customer_id?Number(values.customer_id):null,payment_method:values.payment_method,request_id:state.cartRequest});
      modal.close();state.cart=[];
      try {await refresh();await showReceipt(result.id);toast('Venta registrada. Inventario y caja actualizados.');}catch(error){toast(`Venta V-${String(result.id).padStart(4,'0')} registrada. ${error.message}`,true);}
    } else if(type==='report-range') {
      if(values.from>values.to)throw new Error('La fecha inicial debe ser anterior o igual a la final.');
      const r=await api(`/reports?from=${values.from}&to=${values.to}`);state.from=values.from;state.to=values.to;state.period='custom';await refresh();state.report=r;renderView();
    }
  } catch(error) {formError(error.message,form);} finally {setBusy(false);}
});
document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
  const action=target.dataset.action,id=Number(target.dataset.id);
  try {
    if(action==='close-modal') {if(!state.busy)modal.close();}
    else if(action==='toggle-password') {const input=document.querySelector('#login-password');input.type=input.type==='password'?'text':'password';target.setAttribute('aria-label',input.type==='password'?'Mostrar contraseña':'Ocultar contraseña');}
    else if(action.startsWith('demo-')) {
      const [email,password]={'demo-admin':['admin@paso.pe','Admin123!'],'demo-seller':['ventas@paso.pe','Ventas123!'],'demo-warehouse':['almacen@paso.pe','Almacen123!']}[action];
      const form=document.querySelector('#login-form');form.elements.email.value=email;form.elements.password.value=password;document.querySelector('#demo-note').textContent=`Acceso de prueba: ${email} · ${password}`;form.querySelector('[type=submit]').focus();
    } else if(action==='menu') {document.querySelector('.sidebar').classList.toggle('open');document.querySelector('.sidebar-overlay').classList.toggle('open');}
    else if(action==='logout') {await api('/auth/logout',{});state.user=null;state.data=null;state.report=null;state.search='';if(modal.open)modal.close();renderLogin();toast('Sesión cerrada.');}
    else if(action==='alerts') {location.hash='/inventory?stock=low';state.route='inventory';state.tab='low';renderShell();}
    else if(action==='go-inventory')location.hash='/inventory';
    else if(action==='tab') {state.tab=target.dataset.tab;renderView();}
    else if(action==='new-product')productEditor();else if(action==='edit-product')productEditor(id);
    else if(action==='new-customer')contactEditor('customers');else if(action==='edit-customer')contactEditor('customers',id);
    else if(action==='new-supplier')contactEditor('suppliers');else if(action==='edit-supplier')contactEditor('suppliers',id);
    else if(action==='new-user')userEditor();else if(action==='edit-user')userEditor(id);
    else if(action==='adjust-stock')adjustmentEditor();
    else if(action==='new-purchase')purchaseEditor();
    else if(action==='add-purchase-line') {modal.querySelector('.purchase-lines').insertAdjacentHTML('beforeend',purchaseLine());purchaseTotal();}
    else if(action==='remove-purchase-line') {if(modal.querySelectorAll('.purchase-line').length>1){target.closest('.purchase-line').remove();purchaseTotal();}else toast('La compra necesita al menos un producto.');}
    else if(action==='receive-purchase')await confirmReceive(id);
    else if(action==='new-sale')startSale();
    else if(action==='add-cart')changeCart(id,1);else if(action==='cart-minus')changeCart(id,-1);
    else if(action==='receipt')await showReceipt(id);
    else if(action.startsWith('cash-'))cashEditor(action.slice(5));
    else if(action==='print')window.print();
    else if(action==='export-sales')exportReport(true);else if(action==='export-report')exportReport();
  }catch(error){toast(error.message,true);}
});
document.addEventListener('input',event=>{
  if(event.target.id==='global-search') {state.search=event.target.value;renderView();}
  else if(event.target.id==='pos-search')renderPosProducts();
  else if(event.target.closest('.purchase-line'))purchaseTotal();
});
document.addEventListener('change',async event=>{
  const target=event.target;
  if(target.id==='period-select') {
    if(target.value==='custom')return;
    state.period=target.value;state.from=day(new Date(Date.now()-(Number(state.period)-1)*86400000));state.to=day();
    try {await refresh();}catch(error){toast(error.message,true);}
  }
  if(target.hasAttribute('data-purchase-product')) {
    const product=state.data.products.find(p=>p.id===Number(target.value));if(product)target.closest('.purchase-line').querySelector('[name=unit_cost]').value=(product.cost/100).toFixed(2);purchaseTotal();
  }
  if(target.closest('#sale-form')) {if(target.name==='customer_id')state.saleCustomer=target.value;if(target.name==='payment_method')state.salePayment=target.value;}
});
modal.addEventListener('cancel',event=>{if(state.busy)event.preventDefault();});
window.addEventListener('hashchange',()=>navigate());
window.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelector('.sidebar')?.classList.remove('open');document.querySelector('.sidebar-overlay')?.classList.remove('open');}});
async function boot() {
  try {const result=await api('/auth/me');state.user=result.user;state.route=getRoute();await refresh();}
  catch(error) {renderLogin();if(!error.message.includes('Inicia sesión'))toast(error.message,true);}
}
boot();
