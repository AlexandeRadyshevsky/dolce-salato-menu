import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import menu from './data/menu.json';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App data={menu} />
    </LangProvider>
  </React.StrictMode>
);
