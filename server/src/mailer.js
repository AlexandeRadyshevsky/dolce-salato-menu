// Письмо менеджеру о новой заявке «Запросить прайс-лист».
import nodemailer from 'nodemailer';
import { config, categoryName, productName } from './config.js';
import { trackJob } from './jobs.js';

let transport = null;
export const enabled = () => Boolean(config.mail.host && config.mail.from && config.mail.to.length &&
  (!config.mail.user || config.mail.pass));
const jobs = new Map();

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
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
    ['Дата', new Date(r.created_at ?? Date.now()).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })],
  ].filter(([, v]) => v);
  return {
    from: config.mail.from,
    to: config.mail.to,
    replyTo: r.email,
    subject: `${r.product ? 'Запрос о товаре' : 'Запрос прайс-листа'}: ${r.company} (${r.name})`,
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

export function notifyRequest(repo, id) {
  return trackJob(jobs, id, async () => {
    const request = repo.requestForMail(id);
    if (!request || request.mail_status === 'ok') return;
    const delivered = new Set(JSON.parse(request.mail_delivered));
    if (!enabled()) {
      repo.setMail(id, 'off', [...delivered]);
      return;
    }
    const message = buildMessage({ ...request, categories: JSON.parse(request.categories) });
    for (const address of message.to) {
      if (delivered.has(address)) continue;
      try {
        const result = await getTransport().sendMail({ ...message, to: address });
        if (!(result.accepted || []).some((candidate) => candidate.toLowerCase() === address.toLowerCase())) {
          throw new Error('SMTP не принял адрес получателя');
        }
        delivered.add(address);
        repo.setMail(id, 'pending', [...delivered]);
      } catch (e) {
        console.error('[mail]', e.message);
      }
    }
    repo.setMail(id, message.to.every((address) => delivered.has(address)) ? 'ok' : 'error', [...delivered]);
  });
}
