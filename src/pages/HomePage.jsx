import { Link } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { topCategories } from '../lib/catalog.js';
import HeroSlider from '../components/HeroSlider.jsx';
import PriceForm from '../components/PriceForm.jsx';
import { OliveBranch } from '../components/Art.jsx';
import { CategoryGrid, Eyebrow, Reveal } from '../components/ui.jsx';
import {
  IconArrow,
  IconBulb,
  IconChart,
  IconHandshake,
  IconLifebuoy,
  IconMedal,
  IconPin,
  IconQuality,
  IconTruck,
} from '../components/Icons.jsx';

export default function HomePage({ data, onPrice }) {
  const { t } = useLang();

  const strengths = [
    [IconQuality, 'Качество', 'Qualità', 'Тщательный отбор и прямая связь с производителями.', 'Selezione accurata e rapporto diretto con i produttori.'],
    [IconBulb, 'Инновации', 'Innovazione', 'Решения для любых форматов и потребностей клиентов.', 'Soluzioni per ogni formato ed esigenza.'],
    [IconHandshake, 'Надёжность', 'Affidabilità', 'Мы всегда держим слово и отвечаем за результат.', 'Manteniamo sempre la parola data.'],
    [IconLifebuoy, 'Поддержка клиентов', 'Assistenza', 'Наши менеджеры на связи 24/7.', 'I nostri manager sono disponibili 24/7.'],
    [IconMedal, 'Репутация', 'Reputazione', 'Бренд, признанный в HoReCa по всей России.', 'Un marchio riconosciuto nell’HoReCa in tutta la Russia.'],
    [IconChart, 'Оптимизация затрат', 'Ottimizzazione dei costi', 'Помогаем снизить food cost на 10–30%.', 'Aiutiamo a ridurre il food cost del 10–30%.'],
  ];

  return (
    <>
      <h1 className="sr-only">{data.site.title_ru}</h1>
      <HeroSlider data={data} onPrice={onPrice} />

      <section className="sec about" id="about">
        <Reveal className="about-head">
          <Eyebrow>{t('О компании', 'Chi siamo')}</Eyebrow>
          <h2 className="h2">{t('Больше, чем просто поставщик', 'Più di un semplice fornitore')}</h2>
        </Reveal>
        <Reveal className="about-text" delay={80}>
          <p>
            {t(
              'С 2008 года Dolce&Salato поставляет высококачественные итальянские продукты для ресторанов, отелей и предприятий HoReCa, предлагая комплексные решения и экспертную поддержку.',
              'Dal 2008 Dolce&Salato fornisce prodotti italiani di alta qualità a ristoranti, hotel e HoReCa, offrendo soluzioni complete e supporto esperto.'
            )}
          </p>
        </Reveal>
        <Reveal className="about-text" delay={160}>
          <p>
            {t(
              'Мы не просто доставляем продукты — мы помогаем создавать меню, подбирать лучшие ингредиенты, оптимизировать food cost и вдохновляем новым вкусам итальянской кухни.',
              'Non ci limitiamo a consegnare prodotti: aiutiamo a creare menu, scegliere i migliori ingredienti, ottimizzare il food cost e ispiriamo con nuovi sapori della cucina italiana.'
            )}
          </p>
        </Reveal>
      </section>

      <section className="sec strengths" id="strengths">
        <Eyebrow>{t('Сильные стороны', 'Punti di forza')}</Eyebrow>
        <div className="str-grid">
          {strengths.map(([Icon, ru, it, dRu, dIt], i) => (
            <Reveal key={ru} className="str-item" delay={i * 70}>
              <Icon className="str-ico" />
              <h3>{t(ru, it)}</h3>
              <p>{t(dRu, dIt)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sec cats" id="catalog">
        <div className="sec-head">
          <Eyebrow>{t('Категории каталога', 'Categorie del catalogo')}</Eyebrow>
          <Link to="/catalog" className="link-arrow">
            {t('Смотреть весь каталог', 'Vedi tutto il catalogo')} <IconArrow size={18} />
          </Link>
        </div>
        <CategoryGrid data={data} cats={topCategories(data)} />
        <Link to="/catalog" className="btn btn-outline btn-block cats-all">
          {t('Смотреть весь каталог', 'Vedi tutto il catalogo')} <IconArrow size={16} />
        </Link>
      </section>

      <section className="sec delivery" id="delivery">
        <Eyebrow>{t('Доставка', 'Consegna')}</Eyebrow>
        <div className="dl-row">
          <Reveal className="dl-main">
            <IconTruck size={56} sw={1.2} className="dl-truck" />
            <h2 className="h3">{t('Быстро и надёжно по всей России', 'Consegna rapida e affidabile in tutta la Russia')}</h2>
          </Reveal>
          <Reveal className="dl-city" delay={80}>
            <IconPin size={22} />
            <div>
              <b>{t('Москва', 'Mosca')}</b>
              <p>{t('Доставка в пределах МКАД в течение 24 часов.', 'Consegna entro il raccordo MKAD in 24 ore.')}</p>
            </div>
          </Reveal>
          <Reveal className="dl-city" delay={160}>
            <IconPin size={22} />
            <div>
              <b>{t('Санкт-Петербург', 'San Pietroburgo')}</b>
              <p>{t('Доставка во вторник и пятницу.', 'Consegna il martedì e il venerdì.')}</p>
            </div>
          </Reveal>
          <Link to="/dostavka" className="link-arrow dl-more">
            {t('Подробнее', 'Dettagli')} <IconArrow size={18} />
          </Link>
        </div>
      </section>

      <section className="sec request" id="pricelist">
        <OliveBranch />
        <div className="rq-copy">
          <Eyebrow className="light">{t('Каталог и цены', 'Catalogo e prezzi')}</Eyebrow>
          <h2 className="h2">{t('Запросить прайс-лист', 'Richiedi il listino')}</h2>
          <p>
            {t(
              'Получите актуальный каталог и специальные условия для вашего бизнеса.',
              'Ricevi il catalogo aggiornato e condizioni speciali per il tuo business.'
            )}
          </p>
        </div>
        <div className="rq-card">
          <PriceForm data={data} />
        </div>
      </section>
    </>
  );
}
