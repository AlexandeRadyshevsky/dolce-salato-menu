import { useLang } from '../i18n.jsx';
import { categoryById, catPath, childrenOf, coverOf, countOf } from '../lib/catalog.js';
import { Link } from '../router.jsx';
import { Crumbs, Eyebrow, ProductCard, useCount } from '../components/ui.jsx';
import { IconArrow } from '../components/Icons.jsx';

/* Страница категории. Для «Заправок» — разделы подкатегорий
   («Оливковое масло», «Уксус»), как в PDF-каталоге. */
export default function CategoryPage({ data, cat, onPrice }) {
  const { t, name, lang } = useLang();
  const count = useCount();
  const kids = childrenOf(data, cat);
  const parent = cat.parent ? categoryById(data, cat.parent) : null;
  const cover = coverOf(data, cat);
  const sections = kids.length ? kids : [cat];

  const crumbs = [
    { label: t('Главная', 'Home'), to: '/' },
    { label: t('Каталог', 'Catalogo'), to: '/catalog' },
    ...(parent ? [{ label: name(parent), to: catPath(parent) }] : []),
    { label: name(cat) },
  ];

  return (
    <div className="page">
      <Crumbs items={crumbs} />
      <header className="cat-hero">
        <div className="cat-hero-copy">
          <Eyebrow>{lang === 'ru' ? cat.name_it : cat.name_ru}</Eyebrow>
          <h1 className="h1">{name(cat)}</h1>
          <p className="page-lead">
            {count(countOf(data, cat))} · {t('оптом для ресторанов, отелей и HoReCa', 'all’ingrosso per ristoranti, hotel e HoReCa')}
          </p>
          <button className="btn btn-red" onClick={() => onPrice([cat.id, ...kids.map((k) => k.id)])}>
            {t('Запросить прайс-лист', 'Richiedi il listino')} <IconArrow size={16} />
          </button>
        </div>
        {cover && (
          <div className="cat-hero-img">
            <img src={cover} alt={cat.name_ru} />
          </div>
        )}
      </header>

      {kids.length > 0 && (
        <nav className="subcats">
          {kids.map((k) => (
            <a key={k.id} href={'#' + k.slug} className="chip">
              {name(k)} <small>{k.products.length}</small>
            </a>
          ))}
        </nav>
      )}

      {sections.map((s) => (
        <section key={s.id} id={s.slug} className="cat-section">
          {kids.length > 0 && (
            <div className="sec-head">
              <h2 className="h3">{name(s)}</h2>
              <Link to={catPath(s)} className="link-arrow">
                {t('Открыть раздел', 'Apri la sezione')} <IconArrow size={16} />
              </Link>
            </div>
          )}
          <div className="p-grid">
            {s.products.map((p, i) => (
              <ProductCard key={p.slug} cat={s} product={p} onPrice={onPrice} delay={(i % 4) * 50} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
