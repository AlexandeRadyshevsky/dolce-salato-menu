// Первичная настройка Unisender: создаёт основной список, списки-сегменты
// по всем категориям PDF-каталога и доп. поле «company».
// Запуск (один раз): UNISENDER_API_KEY=... npm run unisender:setup
// Скрипт печатает строки для .env — их нужно вставить в server/.env.
import { config } from './config.js';
import { call } from './unisender.js';

if (!config.unisender.apiKey) {
  console.error('Задайте UNISENDER_API_KEY');
  process.exit(1);
}

const existing = await call('getLists', {});
const byTitle = new Map(existing.map((l) => [l.title, l.id]));

async function ensureList(title) {
  if (byTitle.has(title)) return byTitle.get(title);
  const r = await call('createList', { title });
  console.log('  + список', title, '→', r.id);
  return r.id;
}

const main = await ensureList('Dolce&Salato — основная база (сайт)');
const segments = {};
for (const c of config.categories) {
  segments[c.id] = await ensureList(`Dolce&Salato — сегмент: ${c.name}`);
}

try {
  await call('createField', { name: 'company', type: 'string', public_name: 'Компания' });
  console.log('  + поле company');
} catch (e) {
  if (!/exist/i.test(e.message)) console.warn('  поле company:', e.message);
}

console.log('\nДобавьте в server/.env:\n');
console.log(`UNISENDER_MAIN_LIST_ID=${main}`);
console.log(`UNISENDER_SEGMENT_LISTS='${JSON.stringify(segments)}'`);
