import { useEffect, useRef, useState } from 'react';
import { Link, navigate } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { search, productPath, asset } from '../lib/catalog.js';
import { Logo } from './Art.jsx';
import { IconArrow, IconClose, IconMenu, IconSearch } from './Icons.jsx';

export function LangSwitch({ className = '' }) {
  const { lang, setLang } = useLang();
  return (
    <div className={'lang ' + className} role="group" aria-label="Язык / Lingua">
      <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')} aria-pressed={lang === 'ru'}>
        RU
      </button>
      <span aria-hidden="true">|</span>
      <button className={lang === 'it' ? 'on' : ''} onClick={() => setLang('it')} aria-pressed={lang === 'it'}>
        IT
      </button>
    </div>
  );
}

/* Живой поиск по каталогу: выпадающие подсказки + Enter → страница результатов */
export function SearchBox({ data, onDone, autoFocus }) {
  const { t, name } = useLang();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef(null);
  const res = q.trim().length >= 2 ? search(data, q, 8) : [];

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (to) => {
    setOpen(false);
    setQ('');
    navigate(to);
    onDone && onDone();
  };
  const submit = (e) => {
    e.preventDefault();
    if (res[hi] && open) return go(productPath(res[hi].cat, res[hi].product));
    if (q.trim()) go('/catalog?q=' + encodeURIComponent(q.trim()));
  };

  return (
    <form className="search" ref={box} onSubmit={submit} role="search">
      <IconSearch size={18} className="s-ico" />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setHi((h) => Math.min(h + 1, res.length - 1));
          if (e.key === 'ArrowUp') setHi((h) => Math.max(h - 1, 0));
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={t('Поиск по каталогу…', 'Cerca nel catalogo…')}
        aria-label={t('Поиск по каталогу', 'Cerca nel catalogo')}
        autoComplete="off"
      />
      {open && q.trim().length >= 2 && (
        <div className="s-drop">
          {res.length === 0 && <div className="s-empty">{t('Ничего не найдено', 'Nessun risultato')}</div>}
          {res.map((r, i) => (
            <a
              key={r.cat.id + r.product.slug}
              href={import.meta.env.BASE_URL + productPath(r.cat, r.product).slice(1) + '/'}
              className={'s-item' + (i === hi ? ' hi' : '')}
              onMouseEnter={() => setHi(i)}
              onClick={(e) => {
                e.preventDefault();
                go(productPath(r.cat, r.product));
              }}
            >
              <span className="s-thumb">{r.product.image && <img src={asset(r.product.image)} alt="" loading="lazy" />}</span>
              <span className="s-txt">
                <b>{name(r.product)}</b>
                <small>{name(r.cat)}</small>
              </span>
            </a>
          ))}
          {res.length > 0 && (
            <button type="submit" className="s-all" onClick={() => setHi(-1)}>
              {t('Все результаты', 'Tutti i risultati')} <IconArrow size={14} />
            </button>
          )}
        </div>
      )}
    </form>
  );
}

export default function Header({ data, onPrice, onMenu, menuOpen }) {
  const { t } = useLang();
  return (
    <header className="header">
      <Link to="/" className="h-logo" aria-label="Dolce&Salato — на главную">
        <Logo />
      </Link>
      <p className="h-tag">
        {t(
          'Импорт и дистрибуция итальянских продуктов для ресторанов, кафе, отелей и предприятий HoReCa',
          'Importazione e distribuzione di prodotti italiani per ristoranti, caffè, hotel e HoReCa'
        )}
      </p>
      <div className="h-search">
        <SearchBox data={data} />
      </div>
      <LangSwitch className="h-lang" />
      <button className="btn btn-green h-cta" onClick={() => onPrice()}>
        {t('Запросить прайс-лист', 'Richiedi il listino')} <IconArrow size={16} />
      </button>
      <button className="h-burger" onClick={onMenu} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen}>
        {menuOpen ? <IconClose /> : <IconMenu />}
      </button>
    </header>
  );
}
