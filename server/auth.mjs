import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export const roles = Object.freeze({ admin: 'Administrador', seller: 'Vendedor', warehouse: 'Almacén' });
export const permissions = Object.freeze({
  admin: ['dashboard','products','inventory','sales','customers','purchases','suppliers','cash','reports','users'],
  seller: ['dashboard','products','inventory','sales','customers','cash'],
  warehouse: ['dashboard','products','inventory','purchases'],
});
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, roleLabel: roles[user.role], permissions: permissions[user.role] };
}
export function createSession(db, userId) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenHash(token), userId, expires);
  return token;
}
export function getSession(db, req) {
  const token = /(?:^|;\s*)paso_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  if (!token) return null;
  const user = db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').get(tokenHash(token), new Date().toISOString());
  return user ? { user, token } : null;
}
export function sessionCookie(token, secure = false) {
  return `paso_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 28800 : 0}${secure ? '; Secure' : ''}`;
}
