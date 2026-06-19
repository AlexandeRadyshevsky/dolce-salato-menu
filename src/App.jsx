import { useState, useEffect } from 'react';
import { useRoute, navigate } from './router.jsx';
import Intro from './components/Intro.jsx';
import Sidebar from './components/Sidebar.jsx';
import SearchResults from './components/SearchResults.jsx';
import PriceModal from './components/PriceModal.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App({ data }) {
  const [intro, setIntro] = useState(true);
  const route = useRoute(data);
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [req, setReq] = useState({ open: false, product: null });
  const [activeAnchor, setActiveAnchor] = useState('top');
  const searching = query.trim().length > 0;

  /* при смене маршрута — наверх, сбросить поиск и мобильное меню */
  useEffect(() => {
    setQuery('');
    setNavOpen(false);
    window.scrollTo(0, 0);
  }, [route]);

  /* scroll-spy для якорей главной */
  useEffect(() => {
    if (route.page !== 'home' || searching) return;
    const ids = ['o-nas', 'dostavka', 'katalog', 'pricelist', 'contacts'];
    const secs = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!secs.length) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveAnchor(e.target.id);
        }),
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    secs.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [route.page, searching]);

  /* якорная навигация гибридного одностраничника */
  const onAnchor = (id) => {
    setNavOpen(false);
    if (query) setQuery('');
    const scroll = () => {
      if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    if (route.page !== 'home') {
      navigate('/');
      setTimeout(scroll, 130);
    } else {
      scroll();
    }
  };

  const openRequest = (product) => setReq({ open: true, product: product || null });

  let pageEl;
  if (searching) {
    pageEl = <SearchResults data={data} query={query} onRequest={openRequest} />;
  } else if (route.page === 'catalog') {
    pageEl = <CatalogPage data={data} />;
  } else if (route.page === 'category') {
    pageEl = <CategoryPage data={data} cat={route.cat} onRequest={openRequest} />;
  } else if (route.page === 'product') {
    pageEl = <ProductPage data={data} cat={route.cat} product={route.product} />;
  } else if (route.page === 'notfound') {
    pageEl = <NotFoundPage />;
  } else {
    pageEl = <HomePage data={data} onAnchor={onAnchor} />;
  }

  return (
    <>
      {intro && <Intro onDone={() => setIntro(false)} />}

      <div className="topbar">
        <span className="tb-brand">
          Dolce<span className="amp">&amp;</span>Salato
        </span>
        <button className="menu-btn" onClick={() => setNavOpen((v) => !v)}>
          {navOpen ? 'Закрыть' : 'Меню'}
        </button>
      </div>

      <button className="btn-price fab" onClick={() => openRequest()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4h7l3 3v13H5V4z" />
          <path d="M9 11h7M9 15h5" />
        </svg>
        Прайс-лист
      </button>

      {req.open && <PriceModal data={data} product={req.product} onClose={() => setReq({ open: false, product: null })} />}

      <div className="app">
        <Sidebar
          data={data}
          route={route}
          activeAnchor={activeAnchor}
          query={query}
          setQuery={setQuery}
          open={navOpen}
          onAnchor={onAnchor}
          onPriceOpen={() => openRequest()}
        />
        <main className="main">{pageEl}</main>
      </div>
    </>
  );
}
