import { useState } from 'react';
import { Link } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { catPath } from '../lib/catalog.js';
import { IconArrow, IconBuilding, IconChevron, IconList, IconShield, IconTruck } from './Icons.jsx';

/* Левое меню: дерево каталога строго в порядке содержания PDF
   («Оливковое масло» и «Уксус» — подкатегории «Заправок»),
   якоря главной и красная кнопка запроса прайс-листа. */
export default function Sidebar({ data, route, onAnchor, onPrice, onNavigate, className = '' }) {
  const { t, name } = useLang();
  const [open, setOpen] = useState(true);
  const activeSlug = route.cat && route.cat.slug;
  const activeParent = route.cat && route.cat.parent;

  const anchors = [
    { id: 'about', ru: 'О компании', it: 'Chi siamo', Icon: IconBuilding },
    { id: 'strengths', ru: 'Сильные стороны', it: 'Punti di forza', Icon: IconShield },
    { id: 'delivery', ru: 'Доставка', it: 'Consegna', Icon: IconTruck },
  ];

  return (
    <aside className={'sidebar ' + className}>
      <button className="sb-cat-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <IconList size={20} />
        <span>{t('Каталог', 'Catalogo')}</span>
        <IconChevron size={16} className={'chev' + (open ? ' open' : '')} />
      </button>

      {open && (
        <nav className="sb-cats" aria-label={t('Категории каталога', 'Categorie')}>
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to={catPath(c)}
              onNavigate={onNavigate}
              className={
                (c.parent ? 'sub ' : '') +
                (activeSlug === c.slug || activeParent === c.id ? 'active' : '')
              }
            >
              {name(c)}
            </Link>
          ))}
        </nav>
      )}

      <hr />

      <nav className="sb-anchors">
        {anchors.map(({ id, ru, it, Icon }) => (
          <a
            key={id}
            href={import.meta.env.BASE_URL + '#' + id}
            onClick={(e) => {
              e.preventDefault();
              onAnchor(id);
            }}
          >
            <Icon size={20} />
            {t(ru, it)}
          </a>
        ))}
      </nav>

      <button className="btn btn-red sb-cta" onClick={() => onPrice()}>
        <span>{t('Запросить прайс-лист', 'Richiedi il listino')}</span>
        <IconArrow size={18} />
      </button>
    </aside>
  );
}
