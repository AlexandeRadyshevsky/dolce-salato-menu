import { Link } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { catPath, topCategories } from '../lib/catalog.js';
import { Logo } from './Art.jsx';
import { IconMail, IconPhone, IconPin } from './Icons.jsx';

export default function Footer({ data, onAnchor }) {
  const { t, name } = useLang();
  const c = data.contact;
  const tops = topCategories(data);
  const half = Math.ceil(tops.length / 2);
  return (
    <footer className="footer" id="contacts">
      <div className="f-brand">
        <Logo className="logo-light" />
        <p>
          {t(
            'Импорт и дистрибуция итальянских продуктов для HoReCa с 2008 года.',
            'Importazione e distribuzione di prodotti italiani per l’HoReCa dal 2008.'
          )}
        </p>
      </div>

      <div className="f-col f-cats">
        <h4>{t('Каталог', 'Catalogo')}</h4>
        <div className="f-cat-cols">
          {[tops.slice(0, half), tops.slice(half)].map((col, k) => (
            <ul key={k}>
              {col.map((cat) => (
                <li key={cat.id}>
                  <Link to={catPath(cat)}>{name(cat)}</Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="f-col">
        <h4>{t('Компания', 'Azienda')}</h4>
        <ul>
          <li>
            <a href={import.meta.env.BASE_URL + '#about'} onClick={(e) => (e.preventDefault(), onAnchor('about'))}>
              {t('О компании', 'Chi siamo')}
            </a>
          </li>
          <li>
            <a href={import.meta.env.BASE_URL + '#strengths'} onClick={(e) => (e.preventDefault(), onAnchor('strengths'))}>
              {t('Сильные стороны', 'Punti di forza')}
            </a>
          </li>
          <li>
            <Link to="/dostavka">{t('Доставка', 'Consegna')}</Link>
          </li>
          <li>
            <Link to="/privacy">{t('Политика конфиденциальности', 'Privacy')}</Link>
          </li>
        </ul>
      </div>

      <div className="f-col f-contacts">
        <h4>{t('Контакты', 'Contatti')}</h4>
        <a href={'tel:' + c.phone.replace(/[^+\d]/g, '')}>
          <IconPhone size={18} /> {c.phone}
        </a>
        <a href={'mailto:' + c.email}>
          <IconMail size={18} /> {c.email}
        </a>
        <p>
          <IconPin size={18} />
          <span>
            {c.office_ru}
            <br />
            {c.address_ru}
          </span>
        </p>
      </div>

      <div className="f-bottom">
        <span>© 2008–{new Date().getFullYear()} Dolce&amp;Salato</span>
        <span>{c.sites.join(' · ')}</span>
      </div>
    </footer>
  );
}
