import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSession, verifyPassword, createSession, publicUser, sessionCookie, tokenHash, hashPassword } from './auth.mjs';
import { AppError, textValue, dateRange } from './validation.mjs';
import * as domain from './domain.mjs';
import { bootstrap, dashboard, report } from './queries.mjs';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)),'../public');
const files = new Set(['index.html','app.js','styles.css','icons.js','favicon.svg']);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const dummyHash = hashPassword('dummy-password-never-a-user');

async function readBody(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new AppError('Envía los datos en formato JSON.',415);
  let length = 0; const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 65536) throw new AppError('La solicitud es demasiado grande.',413);
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch { throw new AppError('El JSON de la solicitud no es válido.'); }
}
export function createApp(db, {secureCookie=false} = {}) {
  const attempts = new Map();
  const server = createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const json = (value,status=200) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
    try {
      const url = new URL(req.url,'http://localhost');
      const path = url.pathname;
      if (!path.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new AppError('Método no permitido.',405);
        const file = path==='/' ? 'index.html' : path.slice(1);
        if (!files.has(file)) throw new AppError('Página no encontrada.',404);
        const content = await readFile(resolve(publicDir,file));
        res.writeHead(200,{'Content-Type':mime[extname(file)],'Cache-Control':'no-cache'});
        return res.end(req.method==='HEAD' ? undefined : content);
      }
      if (req.method === 'GET' && path === '/api/health') return json({ok:true,application:'PASO ERP'});
      if (!['GET','HEAD'].includes(req.method)) {
        const origin = req.headers.origin;
        if ((origin && new URL(origin).host !== req.headers.host) || req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('Origen de solicitud no permitido.',403);
      }
      if (req.method === 'POST' && path === '/api/auth/login') {
        const body = await readBody(req);
        const email = textValue(body.email,'Correo',{max:120}).toLowerCase();
        if (typeof body.password !== 'string' || !body.password.length || body.password.length > 128) throw new AppError('Ingresa una contraseña de hasta 128 caracteres.');
        const password = body.password;
        const key = `${req.socket.remoteAddress}:${email}`;
        const ipKey = `ip:${req.socket.remoteAddress}`;
        const time = Date.now();
        for (const [k,v] of attempts) if (v.until < time) attempts.delete(k);
        if ((attempts.get(key)?.count ?? 0) >= 8 || (attempts.get(ipKey)?.count ?? 0) >= 40) throw new AppError('Demasiados intentos. Espera 15 minutos antes de volver a ingresar.',429);
        const user = db.prepare('SELECT * FROM users WHERE email=? AND active=1').get(email);
        const valid = verifyPassword(password,user?.password_hash || dummyHash);
        if (!user || !valid) {
          for (const k of [key,ipKey]) { const old = attempts.get(k); attempts.set(k,{count:(old?.count ?? 0)+1,until:old?.until ?? time+900000}); }
          throw new AppError('El correo o la contraseña son incorrectos.',401);
        }
        attempts.delete(key);
        res.setHeader('Set-Cookie',sessionCookie(createSession(db,user.id),secureCookie));
        return json({user:publicUser(user)});
      }
      const session = getSession(db,req);
      if (!session) throw new AppError('Inicia sesión para continuar.',401);
      const {user} = session;
      if (req.method === 'GET' && path === '/api/auth/me') return json({user:publicUser(user)});
      if (req.method === 'POST' && path === '/api/auth/logout') {
        db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(session.token));
        res.setHeader('Set-Cookie',sessionCookie('',secureCookie)); return json({ok:true});
      }
      if (req.method === 'GET' && path === '/api/bootstrap') return json(bootstrap(db,user,dateRange(url.searchParams)));
      if (req.method === 'GET' && path === '/api/dashboard') return json(dashboard(db,user,dateRange(url.searchParams)));
      if (req.method === 'GET' && path === '/api/reports') return json(report(db,user,dateRange(url.searchParams)));
      if (req.method === 'GET' && /^\/api\/sales\/\d+$/.test(path)) return json(domain.saleDetail(db,user,path.split('/').at(-1)));
      if (req.method === 'GET' && /^\/api\/purchases\/\d+$/.test(path)) return json(domain.purchaseDetail(db,user,path.split('/').at(-1)));
      let result;
      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await readBody(req);
        let match;
        if (path === '/api/products' && req.method==='POST') result = domain.saveProduct(db,user,body);
        else if ((match=/^\/api\/products\/(\d+)$/.exec(path)) && req.method==='PUT') result = domain.saveProduct(db,user,body,match[1]);
        else if (path === '/api/inventory/adjustments' && req.method==='POST') result = domain.adjustStock(db,user,body);
        else if (path === '/api/purchases' && req.method==='POST') result = domain.createPurchase(db,user,body);
        else if ((match=/^\/api\/purchases\/(\d+)\/receive$/.exec(path)) && req.method==='POST') result = domain.receivePurchase(db,user,match[1]);
        else if (path === '/api/sales' && req.method==='POST') result = domain.createSale(db,user,body);
        else if (path === '/api/cash/open' && req.method==='POST') result = domain.openCash(db,user,body);
        else if (path === '/api/cash/movements' && req.method==='POST') result = domain.moveCash(db,user,body);
        else if (path === '/api/cash/close' && req.method==='POST') result = domain.closeCash(db,user,body);
        else if ((match=/^\/api\/(customers|suppliers)(?:\/(\d+))?$/.exec(path)) && ((req.method==='PUT' && match[2]) || (req.method==='POST' && !match[2]))) result = domain.saveContact(db,user,match[1],body,match[2]);
        else if (path === '/api/users' && req.method==='POST') result = domain.saveUser(db,user,body);
        else if ((match=/^\/api\/users\/(\d+)$/.exec(path)) && req.method==='PUT') result = domain.saveUser(db,user,body,match[1]);
        else throw new AppError('Operación no encontrada.',404);
        return json(result,req.method==='POST' ? 201 : 200);
      }
      throw new AppError('Operación no encontrada.',404);
    } catch (error) {
      if (res.headersSent) return res.end();
      if (error instanceof AppError) return json({error:error.message},error.status);
      if (String(error.message).includes('UNIQUE constraint failed')) return json({error:'Ya existe un registro con ese SKU o correo. Revisa los datos.'},409);
      if (String(error.message).includes('FOREIGN KEY constraint failed')) return json({error:'Uno de los registros relacionados ya no está disponible.'},409);
      console.error('Error de aplicación:',error.message);
      return json({error:'No se pudo completar la operación. Inténtalo de nuevo.'},500);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
