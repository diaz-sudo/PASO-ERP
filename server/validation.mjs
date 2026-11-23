export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function textValue(value, label, { max = 160, optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new AppError(`${label}: ingresa un texto de 1 a ${max} caracteres.`);
  return value.trim();
}
export function intValue(value, label, min = 0, max = 1000000) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new AppError(`${label}: debe ser un entero entre ${min} y ${max}.`);
  return value;
}
export function moneyValue(value, label = 'Importe', allowZero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < (allowZero ? 0 : 0.01) || value > 10000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) throw new AppError(`${label}: ingresa un importe válido con hasta dos decimales.`);
  return Math.round(value * 100);
}
export function enumValue(value, allowed, label) {
  if (!allowed.includes(value)) throw new AppError(`${label}: selecciona una opción válida.`);
  return value;
}
export function emailValue(value, optional = false) {
  const email = textValue(value, 'Correo', { max: 120, optional }).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AppError('Ingresa un correo electrónico válido.');
  return email;
}
export function dateRange(search) {
  const to = search.get('to') || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const from = search.get('from') || new Date(Date.parse(`${today}T17:00:00Z`) - 29 * 86400000).toISOString().slice(0, 10);
  for (const value of [from,to]) if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) !== value) throw new AppError('El rango de fechas no es válido.');
  if (from > to) throw new AppError('La fecha inicial debe ser anterior o igual a la final.');
  return { from, to, start: `${from}T05:00:00.000Z`, end: new Date(Date.parse(`${to}T05:00:00Z`) + 86400000).toISOString() };
}
