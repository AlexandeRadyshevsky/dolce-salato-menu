import { useLang } from '../i18n.jsx';
import { search, topCategories, totalProducts } from '../lib/catalog.js';
import { CategoryGrid, Crumbs, Eyebrow, ProductCard, useCount } from '../components/ui.jsx';

/* /catalog/ — все категории первого уровня (порядок PDF);
   /catalog/?q=… — результаты поиска по товарам. */
export default function CatalogPage({ data, q, onPrice }) {
  const { t } = useLang();
  const count = useCount();
  const results = q ? search(data, q, 200) : null;

  return (
    <div className="page">
      <Crumbs items={[{ label: t('Главная', 'Home'), to: '/' }, { label: t('Каталог', 'Catalogo') }]} />
      <header className="page-head">
        <Eyebrow>{t('Каталог', 'Catalogo')}</Eyebrow>
        {results ? (
          <>
            <h1 className="h2">
              {t('Поиск: ', 'Ricerca: ')}«{q}»
            </h1>
            <p className="page-lead">{results.length ? count(results.length) : t('Ничего не найдено', 'Nessun risultato')}</p>
          </>
        ) : (
          <>
            <h1 className="h2">{t('Итальянские продукты оптом', 'Prodotti italiani all’ingrosso')}</h1>
            <p className="page-lead">
              {t(
                `${totalProducts(data)} позиций в ${data.categories.length} категориях — от оливкового масла до праздничной выпечки.`,
                `${totalProducts(data)} prodotti in ${data.categories.length} categorie — dall’olio d’oliva ai dolci delle feste.`
              )}
            </p>
          </>
        )}
      </header>

      {results ? (
        <div className="p-grid">
          {results.map((r, i) => (
            <ProductCard key={r.cat.id + r.product.slug} cat={r.cat} product={r.product} onPrice={onPrice} delay={(i % 4) * 50} />
          ))}
        </div>
      ) : (
        <CategoryGrid data={data} cats={topCategories(data)} showCount />
      )}
    </div>
  );
}
