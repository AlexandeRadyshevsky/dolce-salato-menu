// Shared SEO helpers — vite.config.js (build/dev) и scripts/gen-sitemap.mjs.
// Меты, Schema.org, noscript-каталог, ЧПУ-страницы и sitemap — в одном месте.

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function flatten(menu) {
  const out = [];
  menu.categories.forEach((c) => c.products.forEach((p) => out.push({ p, c })));
  return out;
}

/* Абсолютный URL страницы (ЧПУ с завершающим слешем) */
export const urlFor = (menu, ...parts) =>
  menu.site.url + parts.filter(Boolean).join('/') + (parts.length ? '/' : '');

export const productUrl = (menu, c, p) => urlFor(menu, 'katalog', c.slug, p.slug);
export const categoryUrl = (menu, c) => urlFor(menu, 'katalog', c.slug);

/* JSON-LD: Organization + WebSite (поиск) + ItemList со ссылками на ЧПУ. */
export function buildStructuredData(menu) {
  const base = menu.site.url;
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: menu.brand.name,
    url: base,
    logo: base + 'images/og-cover.jpg',
    description: menu.site.description_ru,
    address: {
      '@type': 'PostalAddress',
      streetAddress: menu.contact.address_ru,
      addressLocality: menu.contact.locality,
      addressRegion: menu.contact.region,
      postalCode: menu.contact.postal,
      addressCountry: menu.contact.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: menu.contact.phone,
      email: menu.contact.email,
      contactType: 'sales',
      areaServed: 'RU',
      availableLanguage: ['ru', 'it'],
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: menu.brand.name,
    url: base,
    inLanguage: 'ru-RU',
    potentialAction: {
      '@type': 'SearchAction',
      target: base + '?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Каталог Dolce&Salato',
    numberOfItems: flatten(menu).length,
    itemListElement: flatten(menu).map(({ p, c }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: productUrl(menu, c, p),
      item: productLd(menu, c, p),
    })),
  };

  return [org, website, itemList]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n    ');
}

/* Schema.org Product для товара */
export function productLd(menu, c, p) {
  return {
    '@type': 'Product',
    name: p.name_ru,
    alternateName: p.name_it,
    url: productUrl(menu, c, p),
    image: menu.site.url + 'images/' + p.id + '.jpg',
    description: p.desc_ru || p.name_ru,
    category: c.name_ru,
    ...(p.producer ? { brand: { '@type': 'Brand', name: p.producer } } : {}),
  };
}

/* noscript-каталог для роботов без JS — ссылки на ЧПУ-страницы. */
export function buildSeoFallback(menu) {
  const cats = menu.categories
    .map((c) => {
      const items = c.products
        .map(
          (p) => `
        <article>
          <h3><a href="${categoryUrl(menu, c)}${p.slug}/">${esc(p.name_ru)}</a> <span>${esc(p.name_it)}</span></h3>
          <img src="images/${p.id}.jpg" alt="${esc(p.name_ru)} — ${esc(p.name_it)} оптом" width="320" height="213" loading="lazy" />
          ${p.producer ? `<p><b>Производитель:</b> ${esc(p.producer)}</p>` : ''}
          ${p.format ? `<p><b>Формат:</b> ${esc(p.format)}</p>` : ''}
          ${p.desc_ru ? `<p>${esc(p.desc_ru)}</p>` : ''}
        </article>`
        )
        .join('');
      return `
      <section id="${c.id}">
        <h2><a href="${categoryUrl(menu, c)}">${esc(c.name_ru)} оптом — ${esc(c.name_it)}</a></h2>${items}
      </section>`;
    })
    .join('');

  return `<noscript>
    <header>
      <h1>${esc(menu.site.title_ru)}</h1>
      <p>${esc(menu.brand.intro_ru)}</p>
      <p>${esc(menu.delivery.lead_ru)}</p>
    </header>
    ${cats}
    <footer>
      <p>${esc(menu.contact.office_ru)}: ${esc(menu.contact.address_ru)}.
      Тел.: ${esc(menu.contact.phone)}. E-mail: ${esc(menu.contact.email)}.</p>
    </footer>
  </noscript>`;
}

/* Подстановка значений в плейсхолдеры index.html. */
export function fillHead(html, menu) {
  const map = {
    '%TITLE%': menu.site.title_ru,
    '%DESCRIPTION%': menu.site.description_ru,
    '%KEYWORDS%': menu.site.keywords_ru,
    '%URL%': menu.site.url,
    '%YANDEX%': menu.site.yandex_verification,
  };
  for (const [k, v] of Object.entries(map)) html = html.split(k).join(esc(v));
  html = html.replace('<!-- %STRUCTURED_DATA% -->', buildStructuredData(menu));
  html = html.replace('<!-- %SEO_FALLBACK% -->', buildSeoFallback(menu));
  return html;
}
