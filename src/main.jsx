import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import menu from './data/menu.json';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App data={menu} />
  </React.StrictMode>
);
