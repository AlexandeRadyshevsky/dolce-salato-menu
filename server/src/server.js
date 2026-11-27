import http from 'node:http';
import { config } from './config.js';
import { openDb } from './db.js';
import { createHandler } from './app.js';
import * as unisender from './unisender.js';
import * as mailer from './mailer.js';

const repo = openDb(config.dbPath);
const server = http.createServer(
  createHandler(repo, { background: (p) => p.catch((e) => console.error('[background]', e)) })
);

server.listen(config.port, config.host, () => {
  console.log(`Dolce&Salato API: http://${config.host}:${config.port}  db=${config.dbPath}`);
  console.log(`  e-mail: ${mailer.enabled() ? 'вкл → ' + config.mail.to : 'выкл (не заполнены настройки SMTP)'}`);
  console.log(`  unisender: ${unisender.enabled() ? 'вкл' : 'выкл (нет UNISENDER_API_KEY / UNISENDER_MAIN_LIST_ID)'}`);
});

let retrying = false;
async function retryDeliveries() {
  if (retrying) return;
  retrying = true;
  try {
    const mail = mailer.enabled() ? repo.pendingMail() : [];
    const sync = unisender.enabled() ? repo.pendingSync() : [];
    await Promise.all([
      (async () => { for (const { id } of mail) await mailer.notifyRequest(repo, id); })(),
      (async () => { for (const { id } of sync) await unisender.syncContact(repo, id); })(),
    ]);
  } catch (error) {
    console.error('[retry]', error);
  } finally {
    retrying = false;
  }
}

const retries = setInterval(retryDeliveries, 5 * 60 * 1000);
retryDeliveries();

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    clearInterval(retries);
    server.close(() => {
      repo.raw.close();
      process.exit(0);
    });
  });
}
