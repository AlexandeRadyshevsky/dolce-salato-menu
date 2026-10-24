/* Крошечный роутер на History API.
   Пути относительно BASE (import.meta.env.BASE_URL), с завершающим слешем:
   /                                   — главная
   /catalog/                           — каталог
   /catalog/<категория>/               — категория
   /catalog/<категория>/<товар>-optom/ — товар
   /dostavka/                          — доставка
   /privacy/                           — политика обработки персональных данных
   Старые адреса /katalog/… переадресуются на /catalog/… */
import { useState, useEffect } from 'react';
import { findCategory } from './lib/catalog.js';

export const BASE = import.meta.env.BASE_URL; // всегда заканчивается на /

/* Текущий маршрут как строка '/catalog/pasta' (без BASE и хвостового слеша) */
export function currentPath() {
  let p = decodeURIComponent(window.location.pathname);
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  p = '/' + p.replace(/^\/+/, '').replace(/\/+$/, '');
  return p;
}

export function hrefFor(to) {
  const m = to.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  const path = m[1].replace(/^\/+/, '').replace(/\/+$/, '');
  return BASE + (path ? path + '/' : '') + (m[2] || '') + (m[3] || '');
}

export function navigate(to, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', hrefFor(to));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function parseRoute(data) {
  const parts = currentPath().split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'home' };
  if (parts[0] === 'katalog') return { page: 'redirect', to: '/catalog/' + parts.slice(1).join('/') };
  if (parts[0] === 'catalog') {
    if (parts.length === 1) return { page: 'catalog', q: new URLSearchParams(window.location.search).get('q') || '' };
    const cat = findCategory(data, parts[1]);
    if (!cat) return { page: 'notfound' };
    if (parts.length === 2) return { page: 'category', cat };
    const product = cat.products.find((p) => p.slug === parts[2]);
    if (!product || parts.length > 3) return { page: 'notfound' };
    return { page: 'product', cat, product };
  }
  if (parts.length === 1 && parts[0] === 'dostavka') return { page: 'delivery' };
  if (parts.length === 1 && parts[0] === 'privacy') return { page: 'privacy' };
  return { page: 'notfound' };
}

export function useRoute(data) {
  const [route, setRoute] = useState(() => parseRoute(data));
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(data));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [data]);
  useEffect(() => {
    if (route.page === 'redirect') navigate(route.to, { replace: true });
  }, [route]);
  return route;
}

/* Ссылка, работающая через pushState (Cmd/Ctrl+клик открывает в новой вкладке) */
export function Link({ to, children, onNavigate, ...rest }) {
  return (
    <a
      href={hrefFor(to)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
        if (onNavigate) onNavigate();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
