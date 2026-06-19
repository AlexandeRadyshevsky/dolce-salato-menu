// Обновляет public/sitemap.xml из src/data/menu.json (все ЧПУ-маршруты).
// Запуск: node scripts/gen-sitemap.mjs
// При сборке (npm run build) sitemap в dist/ генерируется автоматически.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSitemap } from './routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/menu.json'), 'utf-8'));

const out = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(out, buildSitemap(menu));
console.log('✓ public/sitemap.xml обновлён (' + buildSitemap(menu).split('<url>').length + ' URL)');
