import { useState, useEffect } from 'react';
import { Link, navigate } from '../router.jsx';

/* Боковая навигация гибридного одностраничника:
   О нас · Доставка — якоря на главной; Каталог — страницы с подменю;
   Прайс-лист · Контакты — якоря. Плюс поиск и CTA. */
export default function Sidebar({ data, route, activeAnchor, query, setQuery, open, onAnchor, onPriceOpen }) {
  const inCatalog = route.page === 'catalog' || route.page === 'category' || route.page === 'product';
  const [subOpen, setSubOpen] = useState(inCatalog);
  useEffect(() => {
    if (inCatalog) setSubOpen(true);
  }, [inCatalog]);

  const anchorItems = [
    { id: 'o-nas', ru: 'О нас', it: 'Chi siamo' },
    { id: 'dostavka', ru: 'Доставка', it: 'Consegna' },
  ];
  const tailItems = [
    { id: 'pricelist', ru: 'Прайс-лист', it: 'Listino' },
    { id: 'contacts', ru: 'Контакты', it: 'Contatti' },
  ];

  const anchorLink = (it) => (
    <a
      key={it.id}
      href={'#' + it.id}
      onClick={(e) => {
        e.preventDefault();
        onAnchor(it.id);
      }}
      className={route.page === 'home' && activeAnchor === it.id ? 'active' : ''}
    >
      <span>{it.ru}</span>
      <span className="nav-it">{it.it}</span>
    </a>
  );

  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <a
        className="brand"
        href={import.meta.env.BASE_URL}
        onClick={(e) => {
          e.preventDefault();
          onAnchor('top');
        }}
      >
        <h1>
          Dolce<span className="amp">&amp;</span>Salato
        </h1>
        <div className="brand-sub">food solution</div>
      </a>

      <hr className="rule" />

      <div className="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по каталогу…"
          aria-label="Поиск"
        />
        {query ? (
          <button className="s-clear" onClick={() => setQuery('')} aria-label="Очистить">
            ×
          </button>
        ) : (
          <svg className="s-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        )}
      </div>

      <nav className="nav">
        <button className="btn-price side-cta" onClick={onPriceOpen}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4h7l3 3v13H5V4z" />
            <path d="M9 11h7M9 15h5" />
          </svg>
          Прайс-лист <span className="pl-it">· Listino</span>
        </button>

        <a
          href={import.meta.env.BASE_URL + 'katalog/'}
          className={'nav-toggle ' + (inCatalog ? 'active' : '')}
          onClick={(e) => {
            e.preventDefault();
            navigate('/katalog');
            setSubOpen(true);
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Каталог</span>
            <span className="nav-it">Catalogo</span>
          </span>
          <svg
            className={'chev' + (subOpen ? ' open' : '')}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSubOpen((v) => !v);
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>

        {subOpen && (
          <div className="nav-sub">
            {data.categories.map((c) => (
              <Link key={c.id} to={'/katalog/' + c.slug} className={route.catSlug === c.slug ? 'active' : ''}>
                <span>{c.name_ru}</span>
              </Link>
            ))}
          </div>
        )}

        {anchorItems.map(anchorLink)}
        {tailItems.map(anchorLink)}
      </nav>

      <div className="sidebar-foot">
        {data.contact.phone}
        <br />
        <a href={'mailto:' + data.contact.email}>{data.contact.email}</a>
        <br />
        <a href={'https://' + data.contact.sites[0]} target="_blank" rel="noopener">
          {data.contact.sites[0]}
        </a>
      </div>
    </aside>
  );
}
