// Конфигурация API из переменных окружения (см. server/.env.example).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const env = process.env;

function json(name, fallback) {
  if (!env[name]) return fallback;
  try {
    return JSON.parse(env[name]);
  } catch {
    throw new Error(`${name}: невалидный JSON`);
  }
}

const menuPath = path.resolve(here, '..', env.MENU_PATH || '../src/data/menu.json');
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));

export const config = {
  port: Number(env.PORT || 3001),
  host: env.HOST || '127.0.0.1',
  dbPath: path.resolve(here, '..', env.DB_PATH || 'data/dolcesalato.db'),
  corsOrigin: (env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  adminToken: env.ADMIN_TOKEN || '',
  adminPassword: env.ADMIN_PASSWORD || '',
  sessionSecret: env.SESSION_SECRET || '',
  cookieSecure: env.COOKIE_SECURE !== '0',
  trustProxy: env.TRUST_PROXY !== '0',

  mail: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT || 465),
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === '1' : Number(env.SMTP_PORT || 465) === 465,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || env.SMTP_USER || '',
    to: env.MAIL_TO || menu.contact.email,
  },

  unisender: {
    apiKey: env.UNISENDER_API_KEY || '',
    lang: env.UNISENDER_LANG || 'ru',
    mainListId: env.UNISENDER_MAIN_LIST_ID || '',
    // { "<id категории из menu.json>": <list_id в Unisender>, ... }
    segmentLists: json('UNISENDER_SEGMENT_LISTS', {}),
    // 3 — согласие получено на сайте, контакт сразу активен (без письма-подтверждения)
    doubleOptin: env.UNISENDER_DOUBLE_OPTIN || '3',
  },

  // Сегменты = категории PDF-каталога
  categories: menu.categories.map((c) => ({ id: c.id, name: c.name_ru, parent: c.parent || null })),
};

const productNames = new Map(menu.categories.flatMap((c) => c.products.map((p) => [p.slug, p.name_ru])));
export const productName = (slug) => productNames.get(slug) || slug;

export const categoryIds = new Set(config.categories.map((c) => c.id));
export const categoryName = (id) => config.categories.find((c) => c.id === id)?.name || id;
