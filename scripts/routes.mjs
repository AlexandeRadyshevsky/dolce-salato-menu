// Генерация статических ЧПУ-страниц (/katalog/<категория>/<товар>-optom/)
// из собранного index.html + sitemap.xml по всем маршрутам.
// Используется vite.config.js на этапе build (closeBundle).

import { flatten, categoryUrl, productUrl, productLd } from './seo.mjs';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Подменяет title/description/canonical/og в готовом HTML на значения страницы
   и добавляет страничный JSON-LD перед </head>. */
function retitle(html, { title, description, canonical, ldjson }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${esc(description)}$2`
  );
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(canonical)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${esc(description)}$2`
  );
  if (ldjson) {
    html = html.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(ldjson)}</script>\n</head>`
    );
  }
  return html;
}

/* Все маршруты сайта: каталог, категории, товары. */
export function buildRoutePages(menu, builtIndexHtml) {
  const pages = [];

  pages.push({
    file: 'katalog/index.html',
    html: retitle(builtIndexHtml, {
      title: 'Каталог итальянских продуктов оптом — Dolce&Salato',
      description:
        'Каталог Dolce&Salato: ' + menu.categories.length +
        ' категорий итальянских продуктов оптом для HoReCa — масло, паста, рис, трюфель, сыры. Доставка по Москве за 24 часа.',
      canonical: menu.site.url + 'katalog/',
    }),
  });

  for (const c of menu.categories) {
    pages.push({
      file: `katalog/${c.slug}/index.html`,
      html: retitle(builtIndexHtml, {
        title: `${c.name_ru} оптом — купить для ресторана в Москве | Dolce&Salato`,
        description: `${c.name_ru} (${c.name_it}) оптом для ресторанов и HoReCa: ${c.products
          .map((p) => p.name_ru)
          .slice(0, 4)
          .join(', ')}. Доставка по Москве за 24 часа.`,
        canonical: categoryUrl(menu, c),
        ldjson: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: c.name_ru,
          url: categoryUrl(menu, c),
          isPartOf: { '@type': 'WebSite', name: menu.brand.name, url: menu.site.url },
        },
      }),
    });

    for (const p of c.products) {
      pages.push({
        file: `katalog/${c.slug}/${p.slug}/index.html`,
        html: retitle(builtIndexHtml, {
          title: `${p.name_ru} оптом — ${c.name_ru} | Dolce&Salato`,
          description: `${p.name_ru} (${p.name_it})${p.producer ? ' от ' + p.producer : ''} оптом для HoReCa. ${
            p.desc_ru || ''
          }`.slice(0, 250),
          canonical: productUrl(menu, c, p),
          ldjson: { '@context': 'https://schema.org', ...productLd(menu, c, p) },
        }),
      });
    }
  }

  return pages;
}

/* sitemap.xml по всем маршрутам */
export function buildSitemap(menu) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: menu.site.url, pri: '1.0' },
    { loc: menu.site.url + 'katalog/', pri: '0.9' },
    ...menu.categories.map((c) => ({ loc: categoryUrl(menu, c), pri: '0.8' })),
    ...flatten(menu).map(({ p, c }) => ({ loc: productUrl(menu, c, p), pri: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
}
