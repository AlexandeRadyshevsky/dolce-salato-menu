import { useLang } from '../i18n.jsx';
import { Crumbs, Eyebrow, Reveal } from '../components/ui.jsx';
import { IconArrow, IconPin, IconTruck } from '../components/Icons.jsx';

export default function DeliveryPage({ data, onPrice }) {
  const { t } = useLang();
  const d = data.delivery;
  return (
    <div className="page">
      <Crumbs items={[{ label: t('Главная', 'Home'), to: '/' }, { label: t('Доставка', 'Consegna') }]} />
      <header className="page-head">
        <Eyebrow>{t('Доставка', 'Consegna')}</Eyebrow>
        <h1 className="h2">{t('Быстро и надёжно по всей России', 'Consegna rapida e affidabile in tutta la Russia')}</h1>
        <p className="page-lead">{d.lead_ru}</p>
      </header>

      <div className="dl-cards">
        <Reveal className="dl-card">
          <IconPin size={26} />
          <h2 className="h3">{t('Москва и область', 'Mosca e regione')}</h2>
          <p>{t('В течение 24 часов с момента получения заказа.', 'Entro 24 ore dall’ordine.')}</p>
        </Reveal>
        <Reveal className="dl-card" delay={80}>
          <IconPin size={26} />
          <h2 className="h3">{t('Санкт-Петербург', 'San Pietroburgo')}</h2>
          <p>{t('Дважды в неделю — во вторник и пятницу.', 'Due volte a settimana — martedì e venerdì.')}</p>
        </Reveal>
        <Reveal className="dl-card" delay={160}>
          <IconTruck size={26} />
          <h2 className="h3">{t('Собственный автопарк', 'Flotta propria')}</h2>
          <p>{d.fleet_ru}</p>
        </Reveal>
      </div>

      <ul className="dl-points">
        {d.points_ru.map((p, i) => (
          <li key={i}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {p}
          </li>
        ))}
      </ul>

      <button className="btn btn-red" onClick={() => onPrice()}>
        {t('Запросить прайс-лист', 'Richiedi il listino')} <IconArrow size={16} />
      </button>
    </div>
  );
}
