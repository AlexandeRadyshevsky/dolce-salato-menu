import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fillHead } from './scripts/seo.mjs';
import { buildRoutePages, buildSitemap } from './scripts/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readMenu = () =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, 'src/data/menu.json'), 'utf-8'));

/* SEO-мета, Schema.org (JSON-LD) и noscript-каталог в index.html (dev + build). */
function seoPrerender() {
  return {
    name: 'dolcesalato-seo-prerender',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return fillHead(html, readMenu());
      },
    },
  };
}

/* После сборки: статические ЧПУ-страницы для каждой категории и товара
   (katalog/<slug>/index.html) + актуальный sitemap.xml в dist/. */
function seoRoutePages() {
  return {
    name: 'dolcesalato-route-pages',
    apply: 'build',
    closeBundle() {
      const menu = readMenu();
      const dist = path.resolve(__dirname, 'dist');
      const indexFile = path.join(dist, 'index.html');
      if (!fs.existsSync(indexFile)) return;
      const html = fs.readFileSync(indexFile, 'utf-8');
      for (const page of buildRoutePages(menu, html)) {
        const f = path.join(dist, page.file);
        fs.mkdirSync(path.dirname(f), { recursive: true });
        fs.writeFileSync(f, page.html);
      }
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), buildSitemap(menu));
      console.log('\n  ✓ SEO: сгенерированы ЧПУ-страницы каталога и sitemap.xml');
    },
  };
}

// https://vite.dev/config/
// Для GitHub Pages (проектный сайт username.github.io/REPO/) укажите имя
// репозитория в переменной BASE при сборке:
//   BASE=/dolce-salato-menu/ npm run build
// Для своего домена или локального просмотра ничего указывать не нужно.
export default defineConfig({
  base: process.env.BASE || '/',
  plugins: [react(), seoPrerender(), seoRoutePages()],
});
