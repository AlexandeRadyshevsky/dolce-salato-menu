// Выгрузка контактов в CSV (для импорта в любую платформу рассылок).
// npm run export -- main > all.csv
// npm run export -- pasta > pasta.csv
// npm run export -- --segments   (сколько контактов в каждом сегменте)
import { config, categoryName } from './config.js';
import { openDb } from './db.js';
import { toCsv } from './app.js';

const repo = openDb(config.dbPath);
const arg = process.argv[2] || 'main';
if (arg === '--segments') {
  for (const s of repo.segmentCounts()) {
    console.log(String(s.contacts).padStart(6), ' ', s.segment === 'main' ? 'Основная база' : categoryName(s.segment));
  }
} else {
  process.stdout.write(toCsv(repo.exportSegment(arg)) + '\n');
}
