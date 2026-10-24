import { Link } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { ForkArt } from '../components/Art.jsx';
import { IconArrow } from '../components/Icons.jsx';

export default function NotFoundPage() {
  const { t } = useLang();
  return (
    <div className="nf">
      <ForkArt className="play" />
      <div className="nf-copy">
        <div className="nf-code">404</div>
        <h1 className="h2">{t('Страница не найдена', 'Pagina non trovata')}</h1>
        <p>{t('Возможно, товар переехал в другой раздел каталога.', 'Forse il prodotto è stato spostato.')}</p>
        <Link to="/catalog" className="btn btn-red">
          {t('Перейти в каталог', 'Vai al catalogo')} <IconArrow size={16} />
        </Link>
      </div>
    </div>
  );
}
