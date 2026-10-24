// HTTP-обработчик API (без фреймворков, node:http).
//   POST /api/price-request          — заявка с сайта
//   GET  /api/health                 — проверка
//   GET  /api/admin/segments         — сколько контактов в каждом сегменте   (Bearer ADMIN_TOKEN)
//   GET  /api/admin/contacts.csv     — выгрузка ?segment=main|<id категории> (Bearer ADMIN_TOKEN)
import { config, categoryIds, categoryName } from './config.js';
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

export function createHandler(repo, { background = (p) => p } = {}) {
  const allow = rateLimiter();

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

  const isAdmin = (req, url) => {
    if (!config.adminToken) return false;
    const h = req.headers.authorization || '';
    return h === 'Bearer ' + config.adminToken || url.searchParams.get('token') === config.adminToken;
  };

  return async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '');
    const h = cors(req);
    try {
      if (req.method === 'OPTIONS') return send(res, 204, '', h);

      if (path === '/api/health') return send(res, 200, { ok: true }, h);

      if (path === '/api/price-request' && req.method === 'POST') {
        const ip =
          (config.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) ||
          req.socket.remoteAddress;
        const body = await readJson(req);
        if (body.website) return send(res, 200, { ok: true }, h); // honeypot: бот
        if (!allow(ip)) return send(res, 429, { ok: false, error: 'rate_limited' }, h);

        const { data, errors } = validate(body);
        if (Object.keys(errors).length) return send(res, 422, { ok: false, errors }, h);

        const { contactId, requestId } = repo.saveRequest({ ...data, ip, userAgent: clip(req.headers['user-agent'], 300) });

        // письмо и Unisender — после ответа, статусы пишутся в БД (повтор: npm run sync)
        background(
          (async () => {
            repo.setMail(requestId, await mailer.notify(data));
            await unisender.syncContact(repo, contactId);
          })()
        );
        return send(res, 201, { ok: true, id: requestId }, h);
      }

      if (path === '/api/admin/segments' && req.method === 'GET') {
        if (!isAdmin(req, url)) return send(res, 401, { ok: false }, h);
        return send(
          res,
          200,
          repo.segmentCounts().map((s) => ({ ...s, name: s.segment === 'main' ? 'Основная база' : categoryName(s.segment) })),
          h
        );
      }

      if (path === '/api/admin/contacts.csv' && req.method === 'GET') {
        if (!isAdmin(req, url)) return send(res, 401, { ok: false }, h);
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
