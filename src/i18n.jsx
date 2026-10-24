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
