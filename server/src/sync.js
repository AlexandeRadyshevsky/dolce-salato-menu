// Повторная синхронизация с Unisender контактов со статусом pending/error.
// Запуск: npm run sync  (удобно повесить на cron раз в час)
import { config } from './config.js';
import { openDb } from './db.js';
import { enabled, syncContact } from './unisender.js';

if (!enabled()) {
  console.error('Unisender не настроен: задайте UNISENDER_API_KEY и UNISENDER_MAIN_LIST_ID');
  process.exit(1);
}
const repo = openDb(config.dbPath);
const rows = repo.pendingSync();
const stat = { ok: 0, error: 0 };
for (const { id } of rows) stat[await syncContact(repo, id)]++;
console.log(`Синхронизировано: ${stat.ok}, ошибок: ${stat.error}, всего в очереди было: ${rows.length}`);
