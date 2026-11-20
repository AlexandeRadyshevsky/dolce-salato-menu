/* Двуязычие RU | IT. Основной язык сайта — русский; итальянский переключает
   интерфейс и названия категорий/товаров (name_it из PDF-каталога).
   Описания товаров пока только на русском — для них fallback на RU. */
import { createContext, useContext, useEffect, useState } from 'react';

const LangCtx = createContext({ lang: 'ru', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ds-lang') === 'it' ? 'it' : 'ru';
    } catch {
      return 'ru';
    }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('ds-lang', lang);
    } catch {
      /* приватный режим */
    }
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

/* const { lang, setLang, t, name } = useLang();
   t('Текст', 'Testo') — строка интерфейса; name(obj) — name_ru / name_it */
export function useLang() {
  const { lang, setLang } = useContext(LangCtx);
  const t = (ru, it) => (lang === 'it' && it ? it : ru);
  const name = (o) => (lang === 'it' && o.name_it ? o.name_it : o.name_ru);
  return { lang, setLang, t, name };
}

/* ---------- данные товара на языке сайта ----------
   Правило: в итальянской версии — только итальянские тексты (из PDF-каталога),
   в русской — только русские. Нет перевода → поле не показывается (без смешения). */

// единицы и упаковка — терминами итальянской части каталога
// \b в JS не работает с кириллицей — границы слова задаём явно
const W = '(?<![А-Яа-яЁё])';
const E = '(?![А-Яа-яЁё])';
const UNITS_IT = [
  [new RegExp(W + 'кг' + E, 'g'), 'kg'],
  [new RegExp(W + 'мл' + E, 'g'), 'ml'],
  [new RegExp(W + 'г' + E, 'g'), 'g'],
  [new RegExp(W + 'л' + E, 'g'), 'l'],
];
const PACK_IT = [
  ['Жестяная банка', 'Latta'],
  ['Стеклянная банка', 'Vaso in vetro'],
  ['Пластиковая банка', 'Vaso in plastica'],
  ['Пластиковое ведёрко', 'Secchiello di plastica'],
  ['Пакет', 'Busta'],
  ['Вакуум', 'Sottovuoto'],
];

export function qtyIt(s = '') {
  const m = s.match(/^выдержка\s+(.+?)\.?$/i);
  if (m) return 'stagionatura ' + m[1].replace(/\s*мес/g, '').replace(/,\s*/g, ', ') + ' mesi';
  return UNITS_IT.reduce((acc, [re, to]) => acc.replace(re, to), s);
}

export function packIt(s = '') {
  const [ru, it] = PACK_IT.find(([ru]) => s.startsWith(ru)) || [];
  return qtyIt(ru ? it + s.slice(ru.length) : s);
}

export function useProductText() {
  const { lang } = useLang();
  const it = lang === 'it';
  return {
    lang,
    desc: (p) => (it ? p.desc_it : p.desc_ru) || '',
    usage: (p) => (it ? p.usage_it : p.usage_ru) || '',
    subtitle: (p) => (it ? p.subtitle_it : p.subtitle_ru) || '',
    format: (p) => (p.format ? (it ? qtyIt(p.format) : p.format) : ''),
    pack: (p) => (p.pack || []).map((x) => (it ? packIt(x) : x)).join(' · '),
    producerText: (data, name) => (name ? (it ? data.producers_it : data.producers)?.[name] || '' : ''),
  };
}
