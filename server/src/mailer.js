// Письмо менеджеру о новой заявке «Запросить прайс-лист».
import nodemailer from 'nodemailer';
import { config, categoryName, productName } from './config.js';

let transport = null;
export const enabled = () => Boolean(config.mail.host && config.mail.to);

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
    });
  }
  return transport;
}

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function buildMessage(r) {
  const cats = r.categories.map(categoryName);
  const rows = [
    ['Имя', r.name],
    ['Компания', r.company],
    ['E-mail', r.email],
    ['Телефон', r.phone],
    ['Категории', cats.join(', ') || '—'],
    ['Товар', r.product ? productName(r.product) : ''],
    ['Комментарий', r.comment || ''],
    ['Страница', r.page || ''],
    ['Дата', new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })],
  ].filter(([, v]) => v);
  return {
    from: config.mail.from,
    to: config.mail.to,
    replyTo: r.email,
    subject: `Запрос прайс-листа: ${r.company} (${r.name})`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html:
      '<h2 style="font-family:Arial">Новая заявка с сайта dolcesalato.ru</h2><table style="font-family:Arial;font-size:14px;border-collapse:collapse">' +
      rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 14px 6px 0;color:#777;vertical-align:top">${esc(k)}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`
        )
        .join('') +
      '</table>',
  };
}

export async function notify(r) {
  if (!enabled()) return 'off';
  try {
    await getTransport().sendMail(buildMessage(r));
    return 'ok';
  } catch (e) {
    console.error('[mail]', e.message);
    return 'error';
  }
}
