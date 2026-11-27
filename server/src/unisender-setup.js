// Первичная настройка Unisender: создаёт основной список, списки-сегменты
// по всем категориям PDF-каталога и текстовые поля компании и телефона.
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

const fields = new Set((await call('getFields', {})).map((field) => field.name));
for (const [name, public_name] of [['company', 'Компания'], ['ds_phone', 'Телефон для связи']]) {
  if (fields.has(name)) continue;
  await call('createField', { name, type: 'string', public_name });
  console.log('  + поле', name);
}

console.log('\nДобавьте в server/.env:\n');
console.log(`UNISENDER_MAIN_LIST_ID=${main}`);
console.log(`UNISENDER_SEGMENT_LISTS='${JSON.stringify(segments)}'`);
console.log('UNISENDER_PHONE_FIELD=ds_phone');
