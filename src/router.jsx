/* Крошечный роутер на History API.
   Пути относительно BASE (import.meta.env.BASE_URL), с завершающим слешем:
   /                                  — главная
   /katalog/                          — каталог
   /katalog/<категория>/              — категория
   /katalog/<категория>/<товар>/      — товар (slug со словом «оптом») */
import { useState, useEffect } from 'react';

export const BASE = import.meta.env.BASE_URL; // всегда заканчивается на /

/* Текущий маршрут как строка '/katalog/pasta' (без BASE и хвостового слеша) */
export function currentPath() {
  let p = decodeURIComponent(window.location.pathname);
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  p = '/' + p.replace(/^\/+/, '').replace(/\/+$/, '');
  return p === '//' ? '/' : p;
}

export function hrefFor(to) {
  if (to === '/') return BASE;
  return BASE + to.replace(/^\//, '').replace(/\/?$/, '/');
}

export function navigate(to) {
  window.history.pushState({}, '', hrefFor(to));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function parseRoute(data) {
  const parts = currentPath().split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'home' };
  if (parts[0] === 'katalog') {
    if (parts.length === 1) return { page: 'catalog' };
    const cat = data.categories.find((c) => c.slug === parts[1]);
    if (!cat) return { page: 'notfound' };
    if (parts.length === 2) return { page: 'category', catSlug: cat.slug, cat };
    const product = cat.products.find((p) => p.slug === parts[2]);
    if (!product) return { page: 'notfound' };
    return { page: 'product', catSlug: cat.slug, cat, product };
  }
  return { page: 'notfound' };
}

export function useRoute(data) {
  const [route, setRoute] = useState(() => parseRoute(data));
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(data));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [data]);
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
