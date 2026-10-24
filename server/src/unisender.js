// Интеграция с Unisender (https://www.unisender.com/ru/support/api/).
// Каждый контакт попадает в основной список (main list) и в списки-сегменты
// по выбранным категориям. Дополнительно категории пишутся тегами — по ним
// тоже можно строить сегменты внутри Unisender. Телефон хранится в карточке.
import { config, categoryName } from './config.js';

const API = 'https://api.unisender.com';

export const enabled = () => Boolean(config.unisender.apiKey && config.unisender.mainListId);

/* +7XXXXXXXXXX для российских номеров, иначе только цифры с «+» */
export function normalizePhone(phone = '') {
  let d = String(phone).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1);
  if (d.length === 10) d = '7' + d;
  return d ? '+' + d : '';
}

export function listIdsFor(segments) {
  const ids = [config.unisender.mainListId];
  for (const s of segments) {
    const id = config.unisender.segmentLists[s];
    if (id) ids.push(String(id));
  }
  return [...new Set(ids.filter(Boolean))];
}

/* Параметры метода subscribe */
export function subscribeParams(contact, segments) {
  const cats = segments.filter((s) => s !== 'main');
  const p = new URLSearchParams({
    api_key: config.unisender.apiKey,
    list_ids: listIdsFor(segments).join(','),
    'fields[email]': contact.email,
    'fields[Name]': contact.name || '',
    double_optin: config.unisender.doubleOptin,
    overwrite: '2', // обновлять только переданные поля, списки — добавлять
  });
  const phone = normalizePhone(contact.phone);
  if (phone) p.set('fields[phone]', phone);
  if (contact.company) p.set('fields[company]', contact.company);
  // Unisender принимает до 10 тегов за запрос
  const tags = cats.map(categoryName).slice(0, 10);
  if (tags.length) p.set('tags', tags.join(','));
  return p;
}

export async function call(method, params) {
  const body = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  if (!body.has('api_key')) body.set('api_key', config.unisender.apiKey);
  const res = await fetch(`${API}/${config.unisender.lang}/api/${method}?format=json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`Unisender ${method}: ${data.error || res.status}${data.code ? ' (' + data.code + ')' : ''}`);
  }
  return data.result;
}

export async function subscribe(contact, segments) {
  return call('subscribe', subscribeParams(contact, segments));
}

/* Синхронизация одного контакта с записью статуса в БД */
export async function syncContact(repo, contactId) {
  if (!enabled()) {
    repo.setSync(contactId, 'off');
    return 'off';
  }
  try {
    await subscribe(repo.contact(contactId), repo.segments(contactId));
    repo.setSync(contactId, 'ok');
    return 'ok';
  } catch (e) {
    repo.setSync(contactId, 'error', String(e.message).slice(0, 500));
    console.error('[unisender]', e.message);
    return 'error';
  }
}
