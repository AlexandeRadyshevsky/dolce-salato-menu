import { Link } from '../router.jsx';
import { useLang, useProductText } from '../i18n.jsx';
import { catPath, countOf, coverOf, coverPos, imgSrcSet, plural, productPath, thumb } from '../lib/catalog.js';
import useReveal from './useReveal.js';
import { IconArrow } from './Icons.jsx';

export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const [ref, seen] = useReveal();
  return (
    <Tag ref={ref} className={'reveal ' + (seen ? 'in ' : '') + className} style={{ '--d': delay + 'ms' }} {...rest}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className = '' }) {
  return <div className={'eyebrow ' + className}>{children}</div>;
}

export function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumbs">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span className="cr-sep">/</span>}
          {it.to != null ? <Link to={it.to}>{it.label}</Link> : <span className="cr-here">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function useCount() {
  const { t } = useLang();
  return (n) => n + ' ' + t(plural(n, ['позиция', 'позиции', 'позиций']), n === 1 ? 'prodotto' : 'prodotti');
}

/* Плитка категории: обложка из PDF-каталога + название + стрелка */
export function CategoryTile({ data, cat, delay = 0, showCount }) {
  const { name } = useLang();
  const count = useCount();
  const img = coverOf(data, cat);
  return (
    <Reveal as="div" className="cat-tile-wrap" delay={delay}>
      <Link to={catPath(cat)} className="cat-tile">
        <span className="ct-img">
          {img && <img src={img} alt={cat.name_ru} loading="lazy" style={{ objectPosition: coverPos(cat) }} />}
        </span>
        <span className="ct-body">
          <span className="ct-name">
            {name(cat)}
            {showCount && <small>{count(countOf(data, cat))}</small>}
          </span>
          <span className="arrow-circle">
            <IconArrow size={15} />
          </span>
        </span>
      </Link>
    </Reveal>
  );
}

export function CategoryGrid({ data, cats, showCount }) {
  return (
    <div className="cat-grid">
      {cats.map((c, i) => (
        <CategoryTile key={c.id} data={data} cat={c} delay={(i % 5) * 60} showCount={showCount} />
      ))}
    </div>
  );
}

/* Карточка товара в сетке категории */
export function ProductCard({ cat, product, onPrice, delay = 0 }) {
  const { t, name } = useLang();
  const pt = useProductText();
  const to = productPath(cat, product);
  const qty = pt.format(product) || pt.pack(product);
  return (
    <Reveal as="article" className="p-card" delay={delay}>
      <Link to={to} className="p-img" tabIndex={-1} aria-hidden="true">
        {product.image ? (
          <img
            src={thumb(product.image)}
            srcSet={imgSrcSet(product.image)}
            sizes="(max-width: 760px) 46vw, (max-width: 1360px) 30vw, 22vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="p-ph">{name(cat)}</span>
        )}
      </Link>
      <div className="p-body">
        {product.producer && <div className="p-producer">{product.producer}</div>}
        <h3 className="p-name">
          <Link to={to}>{name(product)}</Link>
        </h3>
        <div className="p-meta">
          {qty && <span className="p-fmt">{qty}</span>}
        </div>
        <div className="p-actions">
          <button className="btn btn-outline btn-sm" onClick={() => onPrice([cat.id], product)}>
            {t('Узнать цену', 'Chiedi il prezzo')}
          </button>
          <Link to={to} className="p-more" aria-label={t('Подробнее', 'Dettagli')}>
            <span className="arrow-circle">
              <IconArrow size={15} />
            </span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
