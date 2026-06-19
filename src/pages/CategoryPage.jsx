import { Crumbs, SectionHead, catAccent } from '../components/ui.jsx';
import ProductCard from '../components/ProductCard.jsx';

/* Страница категории: сетка товаров с быстрым запросом. */
export default function CategoryPage({ data, cat, onRequest }) {
  const idx = data.categories.indexOf(cat);
  const accent = catAccent(idx);
  return (
    <section
      className="section prod-page"
      style={{ borderBottom: 'none', '--cat-accent': accent }}
      data-screen-label={'Категория: ' + cat.name_ru}
    >
      <Crumbs items={[{ label: 'Главная', to: '/' }, { label: 'Каталог', to: '/katalog' }, { label: cat.name_ru }]} />
      <SectionHead num={String(idx + 1).padStart(2, '0')} ru={cat.name_ru} it={cat.name_it} accent={accent} />
      <div className="grid">
        {cat.products.map((p, i) => (
          <ProductCard key={p.id} product={p} category={cat} onRequest={onRequest} delay={Math.min(i, 4) * 70} />
        ))}
      </div>
    </section>
  );
}
