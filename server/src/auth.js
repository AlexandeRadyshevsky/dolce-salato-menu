// Вход в админку: пароль ADMIN_PASSWORD → подписанная HttpOnly-cookie сессии.
// Для скриптов/интеграций по-прежнему работает заголовок Authorization: Bearer ADMIN_TOKEN.
import crypto from 'node:crypto';
import { config } from './config.js';

const COOKIE = 'ds_admin';
const TTL = 12 * 60 * 60 * 1000; // 12 часов
const secret = config.sessionSecret || crypto.randomBytes(32).toString('hex');

const sign = (v) => crypto.createHmac('sha256', secret).update(v).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export const passwordOk = (pw) => Boolean(config.adminPassword) && safeEqual(pw, config.adminPassword);

export function sessionCookie() {
  const exp = String(Date.now() + TTL);
  const attrs = [`${COOKIE}=${exp}.${sign(exp)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${TTL / 1000}`];
  if (config.cookieSecure) attrs.push('Secure');
  return attrs.join('; ');
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

function readCookie(req) {
  const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

export function isAdmin(req) {
  const h = req.headers.authorization || '';
  if (config.adminToken && safeEqual(h, 'Bearer ' + config.adminToken)) return true;
  const c = readCookie(req);
  if (!c) return false;
  const [exp, sig] = c.split('.');
  return Boolean(exp && sig) && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}
