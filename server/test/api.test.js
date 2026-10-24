import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.UNISENDER_API_KEY = 'test-key';
process.env.UNISENDER_MAIN_LIST_ID = '100';
process.env.UNISENDER_SEGMENT_LISTS = JSON.stringify({ pasta: 201, olio: 202 });
process.env.ADMIN_TOKEN = 'secret';

const { openDb } = await import('../src/db.js');
const { createHandler } = await import('../src/app.js');
const uni = await import('../src/unisender.js');

let server, base, repo;
const pending = [];
const realFetch = globalThis.fetch;
const uniCalls = [];

before(async () => {
  // подменяем сеть: вызовы Unisender записываем и отвечаем успехом
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith('https://api.unisender.com')) {
      uniCalls.push(new URLSearchParams(opts.body));
      return new Response(JSON.stringify({ result: { person_id: 1 } }), { status: 200 });
    }
    return realFetch(url, opts);
  };
  repo = openDb(':memory:');
  server = http.createServer(createHandler(repo, { background: (p) => pending.push(p) }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  globalThis.fetch = realFetch;
  server.close();
});

const post = (body) =>
  realFetch(base + '/api/price-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.' + Math.random() },
    body: JSON.stringify(body),
  });

const valid = {
  name: 'Марио',
  company: 'Trattoria',
  email: 'Mario@Example.com',
  phone: '8 (900) 123-45-67',
  categories: ['pasta', 'olio', 'verdura', 'unknown'],
  consent: true,
};

test('сохраняет заявку, контакт и сегменты (main + категории)', async () => {
  const res = await post(valid);
  assert.equal(res.status, 201);
  await Promise.all(pending);
  const c = repo.raw.prepare('SELECT * FROM contacts WHERE email = ?').get('mario@example.com');
  assert.ok(c);
  assert.equal(c.phone, '8 (900) 123-45-67');
  assert.deepEqual(repo.segments(c.id).sort(), ['main', 'olio', 'pasta', 'verdura']);
  const req = repo.raw.prepare('SELECT * FROM requests WHERE contact_id = ?').get(c.id);
  assert.deepEqual(JSON.parse(req.categories), ['pasta', 'olio', 'verdura']); // неизвестная категория отброшена
  assert.ok(req.created_at);
  assert.equal(repo.contact(c.id).sync_status, 'ok');
});

test('в Unisender: основной список + списки сегментов, телефон, теги', async () => {
  const p = uniCalls.at(-1);
  // verdura без своего списка — только тег
  assert.deepEqual(p.get('list_ids').split(',').sort(), ['100', '201', '202']);
  assert.equal(p.get('fields[email]'), 'mario@example.com');
  assert.equal(p.get('fields[phone]'), '+79001234567');
  assert.equal(p.get('fields[company]'), 'Trattoria');
  assert.match(p.get('tags'), /Паста/);
  assert.match(p.get('tags'), /Овощи/);
});

test('повторная заявка того же e-mail добавляет сегменты, не дублирует контакт', async () => {
  const res = await post({ ...valid, categories: ['dolci'], phone: '+7 900 000 00 00' });
  assert.equal(res.status, 201);
  await Promise.all(pending);
  const n = repo.raw.prepare('SELECT COUNT(*) n FROM contacts').get().n;
  assert.equal(n, 1);
  const c = repo.raw.prepare('SELECT * FROM contacts').get();
  assert.equal(c.phone, '+7 900 000 00 00');
  assert.ok(repo.segments(c.id).includes('dolci'));
  assert.ok(repo.segments(c.id).includes('pasta'));
});

test('валидация: без согласия и с плохим e-mail — 422', async () => {
  const res = await post({ ...valid, email: 'nope', consent: false });
  assert.equal(res.status, 422);
  const j = await res.json();
  assert.ok(j.errors.email && j.errors.consent);
});

test('honeypot: бот получает 200, но ничего не сохраняется', async () => {
  const before = repo.raw.prepare('SELECT COUNT(*) n FROM requests').get().n;
  const res = await post({ ...valid, email: 'bot@x.ru', website: 'http://spam' });
  assert.equal(res.status, 200);
  assert.equal(repo.raw.prepare('SELECT COUNT(*) n FROM requests').get().n, before);
});

test('CSV-выгрузка сегмента защищена токеном', async () => {
  assert.equal((await realFetch(base + '/api/admin/contacts.csv?segment=pasta')).status, 401);
  const res = await realFetch(base + '/api/admin/contacts.csv?segment=pasta', {
    headers: { Authorization: 'Bearer secret' },
  });
  assert.equal(res.status, 200);
  const csv = await res.text();
  assert.match(csv, /mario@example.com/);
  assert.match(csv, /Паста/);
  const empty = await (await realFetch(base + '/api/admin/contacts.csv?segment=tartufo&token=secret')).text();
  assert.doesNotMatch(empty, /mario/);
});

test('normalizePhone', () => {
  assert.equal(uni.normalizePhone('8 900 123 45 67'), '+79001234567');
  assert.equal(uni.normalizePhone('9001234567'), '+79001234567');
  assert.equal(uni.normalizePhone('+39 06 1234 5678'), '+390612345678');
});
