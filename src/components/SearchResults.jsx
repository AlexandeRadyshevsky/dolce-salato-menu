import ProductCard from './ProductCard.jsx';

/* Живой поиск по всему каталогу; карточки ведут на ЧПУ-страницы товаров. */
export default function SearchResults({ data, query, onRequest }) {
  const q = query.trim().toLowerCase();
  const hits = [];
  data.categories.forEach((c) => {
    c.products.forEach((p) => {
      const hay = [p.name_ru, p.name_it, p.producer, p.desc_ru, p.pairing, c.name_ru, c.name_it]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (hay.includes(q)) hits.push({ p, c });
    });
  });

  if (!hits.length) {
    return (
      <div className="empty">
        <h3>Ничего не найдено</h3>
        <p>Попробуйте другой запрос — например «трюфель», «паста» или «Gentile».</p>
      </div>
    );
  }

  return (
    <section className="section" style={{ borderBottom: 'none' }}>
      <div className="section-head">
        <div className="sh-left">
          <span className="section-num">{String(hits.length).padStart(2, '0')}</span>
          <h3>Результаты</h3>
          <span className="sh-it">по запросу «{query}»</span>
        </div>
      </div>
      <div className="grid">
        {hits.map(({ p, c }, i) => (
          <ProductCard key={c.id + '-' + p.id} product={p} category={c} onRequest={onRequest} delay={Math.min(i, 5) * 50} />
        ))}
      </div>
    </section>
  );
}
