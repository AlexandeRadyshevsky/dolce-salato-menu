/* Хелперы каталога. Структура категорий и порядок — строго по PDF-каталогу
   (src/data/menu.json → categories, поле parent задаёт подкатегории «Заправок»). */

export const topCategories = (data) => data.categories.filter((c) => !c.parent);

export const childrenOf = (data, cat) => data.categories.filter((c) => c.parent === cat.id);

export const findCategory = (data, slug) => data.categories.find((c) => c.slug === slug);

export const categoryById = (data, id) => data.categories.find((c) => c.id === id);

/* Все товары категории, включая товары подкатегорий */
export function productsOf(data, cat) {
  return [...cat.products, ...childrenOf(data, cat).flatMap((c) => c.products)];
}

export const countOf = (data, cat) => productsOf(data, cat).length;

export const totalProducts = (data) => data.categories.reduce((n, c) => n + c.products.length, 0);

export const catPath = (cat) => '/catalog/' + cat.slug;
export const productPath = (cat, p) => '/catalog/' + cat.slug + '/' + p.slug;

export const asset = (rel) => (rel ? import.meta.env.BASE_URL + rel : null);

/* Обложка категории: обложка из PDF, для подкатегорий без своей обложки —
   фото первого товара. */
export function coverOf(data, cat) {
  if (cat.cover) return asset(cat.cover);
  const withImg = productsOf(data, cat).find((p) => p.image);
  return withImg ? asset(withImg.image) : null;
}

/* ---------- поиск ---------- */
const norm = (s = '') =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"“”’'`.,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

let index = null;
function buildIndex(data) {
  const rows = [];
  for (const c of data.categories) {
    for (const p of c.products) {
      rows.push({
        cat: c,
        product: p,
        hay: norm([p.name_ru, p.name_it, p.producer, c.name_ru, c.name_it].join(' ')),
        name: norm(p.name_ru + ' ' + p.name_it),
      });
    }
  }
  return rows;
}

export function search(data, query, limit = 60) {
  const q = norm(query);
  if (q.length < 2) return [];
  if (!index) index = buildIndex(data);
  const terms = q.split(' ');
  return index
    .filter((r) => terms.every((t) => r.hay.includes(t)))
    .map((r) => ({ ...r, score: (r.name.startsWith(q) ? 0 : 1) + (r.name.includes(q) ? 0 : 1) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export function plural(n, [one, few, many]) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
