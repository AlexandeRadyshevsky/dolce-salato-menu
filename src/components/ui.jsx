import { Link } from '../router.jsx';

/* Акцентные цвета категорий — тёплое разнообразие поверх зелёной базы */
export const CAT_ACCENTS = ['#C8922E', '#B5532E', '#5E6B4F', '#3B5A45', '#A9762F'];
export const catAccent = (i) => CAT_ACCENTS[i % CAT_ACCENTS.length];

export function plural(n) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'позиция';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'позиции';
  return 'позиций';
}

/* ---------- хлебные крошки ---------- */
export function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Хлебные крошки">
      {items.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="cr-sep">/</span>}
          {it.to != null ? (
            <Link to={it.to}>{it.label}</Link>
          ) : (
            <span className="cr-here">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ---------- плитки категорий ---------- */
export function CatTiles({ data }) {
  return (
    <div className="cat-tiles">
      {data.categories.map((c, i) => (
        <Link key={c.id} className="cat-tile" to={'/katalog/' + c.slug} style={{ '--cat-accent': catAccent(i) }}>
          <span className="ct-name">{c.name_ru}</span>
          <span className="ct-it">{c.name_it}</span>
          <span className="ct-count">
            {c.products.length} {plural(c.products.length)}
          </span>
          <svg className="ct-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

/* ---------- заголовок секции ---------- */
export function SectionHead({ num, ru, it, accent }) {
  return (
    <div className="section-head">
      <div className="sh-left">
        {num && (
          <span className="section-num" style={accent ? { color: accent } : null}>
            {num}
          </span>
        )}
        <h3>{ru}</h3>
        {it && <span className="sh-it">{it}</span>}
      </div>
    </div>
  );
}
