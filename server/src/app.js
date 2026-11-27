// HTTP-обработчик API (без фреймворков, node:http).
//   POST /api/price-request          — заявка с сайта
//   GET  /api/health                 — проверка
//   GET  /admin                      — админка (вход по ADMIN_PASSWORD)
//   POST /api/admin/login | logout   — сессия админки (HttpOnly-cookie)
//   GET  /api/admin/stats            — счётчики + сегменты + список категорий
//   GET  /api/admin/requests         — заявки ?segment=&q=&page=
//   DELETE /api/admin/contacts/:id   — удалить контакт (запрос на удаление ПДн)
//   GET  /api/admin/segments         — сколько контактов в каждом сегменте
//   GET  /api/admin/contacts.csv     — выгрузка ?segment=main|<id категории>
//   (всё /api/admin/* — по сессии или заголовку Authorization: Bearer ADMIN_TOKEN)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config, menu, categoryIds, categoryName, productName } from './config.js';
import { clearCookie, isAdmin, passwordOk, sessionCookie } from './auth.js';
import { editableProducts, findProduct, validateProductEdit } from './catalog.js';
import * as unisender from './unisender.js';
import * as mailer from './mailer.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

export function validate(body) {
  const r = {
    name: clip(body.name, 120),
    company: clip(body.company, 200),
    email: clip(body.email, 200).toLowerCase(),
    phone: clip(body.phone, 40),
    comment: clip(body.comment, 2000),
    product: clip(body.product, 200),
    page: clip(body.page, 500),
    categories: [...new Set(Array.isArray(body.categories) ? body.categories.map(String) : [])].filter((c) =>
      categoryIds.has(c)
    ),
  };
  if (r.product) {
    const possible = menu.categories.filter((category) => category.products.some((product) => product.slug === r.product));
    const pagePath = URL.canParse(r.page) ? new URL(r.page).pathname : '';
    const category = possible.find((c) => pagePath.replace(/\/$/, '') === `/catalog/${c.slug}/${r.product}`)
      ?? possible.find((c) => c.id === body.productCategory)
      ?? possible.find((c) => r.categories.includes(c.id))
      ?? (possible.length === 1 ? possible[0] : null);
    if (category && !r.categories.includes(category.id)) r.categories.push(category.id);
  }
  const errors = {};
  if (!r.name) errors.name = 'required';
  if (!r.company) errors.company = 'required';
  if (!EMAIL_RE.test(r.email)) errors.email = 'invalid';
  if (r.phone.replace(/\D/g, '').length < 10) errors.phone = 'invalid';
  if (body.consent !== true) errors.consent = 'required';
  return { data: r, errors };
}

/* простой лимит: N заявок с IP за окно */
function rateLimiter(limit = 5, windowMs = 10 * 60 * 1000) {
  const hits = new Map();
  return (ip) => {
    const t = Date.now();
    const arr = (hits.get(ip) || []).filter((x) => t - x < windowMs);
    arr.push(t);
    hits.set(ip, arr);
    if (hits.size > 5000) hits.clear();
    return arr.length <= limit;
  };
}

function clientIp(req) {
  return (
    (config.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) ||
    req.socket.remoteAddress
  );
}

async function readJson(req, max = 20_000) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw Object.assign(new Error('too large'), { status: 413 });
    chunks.push(c);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
  } catch {
    throw Object.assign(new Error('bad json'), { status: 400 });
  }
}

function send(res, status, body, headers = {}) {
  const isStr = typeof body === 'string';
  res.writeHead(status, {
    'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isStr ? body : JSON.stringify(body));
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export function toCsv(rows) {
  const cols = ['email', 'name', 'company', 'phone', 'segments', 'requests', 'created_at', 'last_request_at', 'sync_status'];
  const lines = [cols.join(';')];
  for (const r of rows) {
    const segs = (r.segments || '').split(',').filter(Boolean).map(categoryName).join(', ');
    lines.push(cols.map((c) => csvCell(c === 'segments' ? segs : r[c])).join(';'));
  }
  return '﻿' + lines.join('\n'); // BOM — Excel корректно откроет кириллицу
}

const ADMIN_HTML = fileURLToPath(new URL('../admin/index.html', import.meta.url));

export function createHandler(repo, { background = (p) => p } = {}) {
  // за NAT хостинга у всех посетителей один IP — лимит по e-mail + общий потолок
  const allowEmail = rateLimiter(5, 10 * 60 * 1000);
  const allowGlobal = rateLimiter(120, 10 * 60 * 1000);
  const allowLogin = rateLimiter(10, 15 * 60 * 1000);

  const cors = (req) => {
    const origin = req.headers.origin;
    if (origin && config.corsOrigin.includes(origin)) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      };
    }
    return {};
  };

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '');
    const h = cors(req);
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '', h);

      if (path === '/api/health') return send(res, 200, { ok: true }, h);

      if (path === '/api/catalog' && req.method === 'GET') {
        return send(res, 200, repo.catalogEdits(), h);
      }

      if (path === '/api/price-request' && req.method === 'POST') {
        const ip = clientIp(req);
        const body = await readJson(req);
        if (body.website) return send(res, 200, { ok: true }, h); // honeypot: бот
        const emailKey = String(body.email || '').trim().toLowerCase();
        if (!allowEmail(emailKey) || !allowGlobal('all')) return send(res, 429, { ok: false, error: 'rate_limited' }, h);

        const { data, errors } = validate(body);
        if (Object.keys(errors).length) return send(res, 422, { ok: false, errors }, h);

        const { contactId, requestId } = repo.saveRequest({ ...data, ip, userAgent: clip(req.headers['user-agent'], 300) });

        background(Promise.all([mailer.notifyRequest(repo, requestId), unisender.syncContact(repo, contactId)]));
        return send(res, 201, { ok: true, id: requestId }, h);
      }

      /* ---------- админка ---------- */
      if (path === '/admin' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow',
          'X-Frame-Options': 'DENY',
        });
        return res.end(fs.readFileSync(ADMIN_HTML));
      }

      if (path === '/api/admin/login' && req.method === 'POST') {
        if (!allowLogin(clientIp(req))) return send(res, 429, { ok: false, error: 'rate_limited' });
        const body = await readJson(req, 2000);
        if (!passwordOk(body.password)) return send(res, 401, { ok: false, error: 'bad_password' });
        return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie() });
      }
      if (path === '/api/admin/logout' && req.method === 'POST') {
        return send(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
      }

      if (path.startsWith('/api/admin/') && !isAdmin(req)) return send(res, 401, { ok: false }, h);

      if (path === '/api/admin/catalog' && req.method === 'GET') {
        return send(res, 200, editableProducts(repo), h);
      }

      if (path === '/api/admin/catalog' && req.method === 'POST') {
        const body = await readJson(req, 100_000);
        if (!body || !findProduct(body.category, body.slug)) return send(res, 404, { ok: false }, h);
        const { values, errors } = validateProductEdit(body);
        if (Object.keys(errors).length) return send(res, 422, { ok: false, errors }, h);
        const revision = repo.updateCatalog(body.category, body.slug, body.revision, values);
        if (revision === null) return send(res, 409, { ok: false }, h);
        return send(res, 200, { ok: true, revision }, h);
      }

      if (path === '/api/admin/stats' && req.method === 'GET') {
        return send(res, 200, {
          ...repo.stats(),
          segments: repo.segmentCounts(),
          categories: config.categories,
        });
      }

      if (path === '/api/admin/requests' && req.method === 'GET') {
        const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const limit = 50;
        const r = repo.listRequests({
          segment: url.searchParams.get('segment') || '',
          q: clip(url.searchParams.get('q'), 100),
          limit,
          offset: (page - 1) * limit,
        });
        r.rows = r.rows.map((x) => ({ ...x, product: x.product ? productName(x.product) : null }));
        return send(res, 200, { ...r, page, pages: Math.max(1, Math.ceil(r.total / limit)) });
      }

      const del = path.match(/^\/api\/admin\/contacts\/(\d+)$/);
      if (del && req.method === 'DELETE') {
        return send(res, repo.deleteContact(Number(del[1])) ? 200 : 404, { ok: true });
      }

      if (path === '/api/admin/segments' && req.method === 'GET') {
        return send(
          res,
          200,
          repo.segmentCounts().map((s) => ({ ...s, name: s.segment === 'main' ? 'Основная база' : categoryName(s.segment) })),
          h
        );
      }

      if (path === '/api/admin/contacts.csv' && req.method === 'GET') {
        const segment = url.searchParams.get('segment') || 'main';
        return send(res, 200, toCsv(repo.exportSegment(segment)), {
          ...h,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="contacts-${segment}.csv"`,
        });
      }

      return send(res, 404, { ok: false, error: 'not_found' }, h);
    } catch (e) {
      if (!e.status) console.error(e);
      return send(res, e.status || 500, { ok: false, error: e.status ? e.message : 'server_error' }, h);
    }
  };
}
