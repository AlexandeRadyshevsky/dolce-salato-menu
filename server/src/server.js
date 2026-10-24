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
  console.log(`  e-mail: ${mailer.enabled() ? 'вкл → ' + config.mail.to : 'выкл (нет SMTP_HOST)'}`);
  console.log(`  unisender: ${unisender.enabled() ? 'вкл' : 'выкл (нет UNISENDER_API_KEY / UNISENDER_MAIN_LIST_ID)'}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => {
      repo.raw.close();
      process.exit(0);
    });
  });
}
