// Генерация статических ЧПУ-страниц (/catalog/<категория>/<товар>-optom/)
// из собранного index.html + sitemap.xml по всем маршрутам.
// Используется vite.config.js на этапе build (closeBundle).

import { flatten, categoryUrl, productUrl, productLd } from './seo.mjs';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Подменяет title/description/canonical/og в готовом HTML на значения страницы
   и добавляет страничный JSON-LD перед </head>. */
function retitle(html, { title, description, canonical, ldjson, noscript, image }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  /* полный каталог (noscript + ItemList) остаётся только на главной и /catalog/ */
  if (noscript != null) {
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>${noscript}</noscript>`);
    html = html.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"ItemList"[\s\S]*?<\/script>/, '');
  }
  if (image) {
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
  }
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

const allProducts = (menu, c) => [
  ...c.products,
  ...menu.categories.filter((k) => k.parent === c.id).flatMap((k) => k.products),
];

/* Все маршруты сайта: каталог, категории, товары. */
export function buildRoutePages(menu, builtIndexHtml) {
  const pages = [];

  pages.push({
    file: 'catalog/index.html',
    html: retitle(builtIndexHtml, {
      title: 'Каталог итальянских продуктов оптом — Dolce&Salato',
      description:
        'Каталог Dolce&Salato: ' + menu.categories.length +
        ' категорий итальянских продуктов оптом для HoReCa — оливковое масло, паста, рис, овощи, сыры, десерты. Доставка по Москве за 24 часа.',
      canonical: menu.site.url + 'catalog/',
    }),
  });

  pages.push({
    file: 'dostavka/index.html',
    html: retitle(builtIndexHtml, {
      title: 'Доставка итальянских продуктов по Москве и России — Dolce&Salato',
      description: menu.delivery.lead_ru,
      canonical: menu.site.url + 'dostavka/',
      noscript: `<h1>Доставка</h1><p>${esc(menu.delivery.lead_ru)}</p><p>${esc(menu.delivery.fleet_ru)}</p>`,
    }),
  });
  pages.push({
    file: 'privacy/index.html',
    html: retitle(builtIndexHtml, {
      title: 'Политика обработки персональных данных — Dolce&Salato',
      description: 'Политика обработки персональных данных Dolce&Salato.',
      canonical: menu.site.url + 'privacy/',
      noscript: '<h1>Политика обработки персональных данных</h1>',
    }),
  });

  for (const c of menu.categories) {
    pages.push({
      file: `catalog/${c.slug}/index.html`,
      html: retitle(builtIndexHtml, {
        title: `${c.name_ru} оптом — купить для ресторана в Москве | Dolce&Salato`,
        description: `${c.name_ru} (${c.name_it}) оптом для ресторанов и HoReCa: ${allProducts(menu, c)
          .map((p) => p.name_ru)
          .slice(0, 4)
          .join(', ')}. Доставка по Москве за 24 часа.`,
        canonical: categoryUrl(menu, c),
        noscript: `<h1>${esc(c.name_ru)} оптом — ${esc(c.name_it)}</h1><ul>${allProducts(menu, c)
          .map((p) => `<li><a href="${productUrl(menu, menu.categories.find((k) => k.products.includes(p)), p)}">${esc(p.name_ru)}</a>${p.format ? ' — ' + esc(p.format) : ''}</li>`)
          .join('')}</ul>`,
        image: c.cover ? menu.site.url + c.cover : undefined,
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
        file: `catalog/${c.slug}/${p.slug}/index.html`,
        html: retitle(builtIndexHtml, {
          title: `${p.name_ru} оптом — ${c.name_ru} | Dolce&Salato`,
          description: `${p.name_ru}${p.name_it ? ' (' + p.name_it + ')' : ''}${p.producer ? ' от ' + p.producer : ''} оптом для HoReCa${
            p.format ? ', ' + p.format : ''
          }. ${p.desc_ru || p.usage_ru || ''}`.slice(0, 250),
          canonical: productUrl(menu, c, p),
          noscript: [
            `<h1>${esc(p.name_ru)} оптом</h1>`,
            p.name_it ? `<p>${esc(p.name_it)}</p>` : '',
            p.image ? `<img src="/${p.image}" alt="${esc(p.name_ru)}" width="600" height="600" />` : '',
            p.producer ? `<p>Производитель: ${esc(p.producer)}</p>` : '',
            p.format ? `<p>Фасовка: ${esc(p.format)}</p>` : '',
            p.pack && p.pack.length ? `<p>Упаковка: ${esc(p.pack.join(', '))}</p>` : '',
            p.desc_ru ? `<p>${esc(p.desc_ru)}</p>` : '',
            p.usage_ru ? `<p>Применение: ${esc(p.usage_ru)}</p>` : '',
            `<p><a href="${categoryUrl(menu, c)}">${esc(c.name_ru)}</a> · Тел. ${esc(menu.contact.phone)}</p>`,
          ].join(''),
          image: p.image ? menu.site.url + p.image : undefined,
          ldjson: {
            '@context': 'https://schema.org',
            '@graph': [
              productLd(menu, c, p),
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Главная', item: menu.site.url },
                  { '@type': 'ListItem', position: 2, name: 'Каталог', item: menu.site.url + 'catalog/' },
                  { '@type': 'ListItem', position: 3, name: c.name_ru, item: categoryUrl(menu, c) },
                  { '@type': 'ListItem', position: 4, name: p.name_ru, item: productUrl(menu, c, p) },
                ],
              },
            ],
          },
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
    { loc: menu.site.url + 'catalog/', pri: '0.9' },
    { loc: menu.site.url + 'dostavka/', pri: '0.5' },
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
