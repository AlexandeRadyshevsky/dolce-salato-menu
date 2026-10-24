import { useCallback, useEffect, useState } from 'react';
import { useRoute, navigate } from './router.jsx';
import { useLang } from './i18n.jsx';
import Header, { LangSwitch, SearchBox } from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';
import PriceModal from './components/PriceModal.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import DeliveryPage from './pages/DeliveryPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App({ data }) {
  const route = useRoute(data);
  const { name } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // { preset: [catIds], product }

  /* смена маршрута: наверх (или к якорю), закрыть меню, обновить <title> */
  useEffect(() => {
    setMenuOpen(false);
    const hash = window.location.hash.slice(1);
    if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 60);
    else window.scrollTo(0, 0);

    const s = data.site;
    const titles = {
      home: s.title_ru,
      catalog: 'Каталог итальянских продуктов оптом — Dolce&Salato',
      category: route.cat && `${route.cat.name_ru} оптом — купить для ресторана | Dolce&Salato`,
      product: route.product && `${route.product.name_ru} оптом — ${route.cat.name_ru} | Dolce&Salato`,
      delivery: 'Доставка — Dolce&Salato',
      privacy: 'Политика обработки персональных данных — Dolce&Salato',
      notfound: 'Страница не найдена — Dolce&Salato',
    };
    document.title = titles[route.page] || s.title_ru;
  }, [route, data]);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  const onAnchor = useCallback(
    (id) => {
      setMenuOpen(false);
      if (route.page !== 'home') {
        navigate('/#' + id);
        return;
      }
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState({}, '', '#' + id);
    },
    [route.page]
  );

  const openPrice = useCallback((preset = [], product = null) => {
    setMenuOpen(false);
    setModal({ preset: Array.isArray(preset) ? preset : [], product });
  }, []);

  let page;
  switch (route.page) {
    case 'home':
      page = <HomePage data={data} onPrice={openPrice} />;
      break;
    case 'catalog':
      page = <CatalogPage data={data} q={route.q} onPrice={openPrice} />;
      break;
    case 'category':
      page = <CategoryPage key={route.cat.id} data={data} cat={route.cat} onPrice={openPrice} />;
      break;
    case 'product':
      page = <ProductPage key={route.product.slug} data={data} cat={route.cat} product={route.product} onPrice={openPrice} />;
      break;
    case 'delivery':
      page = <DeliveryPage data={data} onPrice={openPrice} />;
      break;
    case 'privacy':
      page = <PrivacyPage data={data} />;
      break;
    case 'redirect':
      page = null;
      break;
    default:
      page = <NotFoundPage />;
  }

  return (
    <>
      <a className="skip" href="#main">
        Перейти к содержанию
      </a>
      <Header data={data} onPrice={openPrice} onMenu={() => setMenuOpen((v) => !v)} menuOpen={menuOpen} />

      <div className="layout">
        <Sidebar data={data} route={route} onAnchor={onAnchor} onPrice={openPrice} className="sb-desktop" />
        <main id="main" className="main">
          {page}
        </main>
      </div>

      <Footer data={data} onAnchor={onAnchor} />

      {/* мобильное меню */}
      <div className={'drawer' + (menuOpen ? ' open' : '')} aria-hidden={!menuOpen}>
        <div className="drawer-top">
          <SearchBox data={data} onDone={() => setMenuOpen(false)} />
          <LangSwitch />
        </div>
        <Sidebar
          data={data}
          route={route}
          onAnchor={onAnchor}
          onPrice={openPrice}
          onNavigate={() => setMenuOpen(false)}
          className="sb-mobile"
        />
      </div>
      <div className={'drawer-shade' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen(false)} />

      {modal && (
        <PriceModal data={data} preset={modal.preset} product={modal.product} onClose={() => setModal(null)} />
      )}
    </>
  );
}
