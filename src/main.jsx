import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import menu from './data/menu.json';
import { initMetrika } from './lib/metrika.js';
import './index.css';

initMetrika();

async function loadCatalog() {
  const configuredApi = import.meta.env.VITE_API_URL;
  if (!configuredApi && import.meta.env.BASE_URL !== '/') return menu;
  const api = (configuredApi || '/api').replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(api + '/catalog', { signal: controller.signal });
    if (!response.ok) return menu;
    const changes = await response.json();
    if (!Array.isArray(changes) || !changes.length) return menu;
    const edits = new Map(changes.map((edit) => [`${edit.category}/${edit.slug}`, edit.values]));
    return {
      ...menu,
      categories: menu.categories.map((category) => ({
        ...category,
        products: category.products.map((product) => ({
          ...product, ...edits.get(`${category.id}/${product.slug}`),
        })),
      })),
    };
  } catch {
    return menu;
  } finally {
    clearTimeout(timeout);
  }
}

loadCatalog().then((catalog) => createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App data={catalog} />
    </LangProvider>
  </React.StrictMode>
));
