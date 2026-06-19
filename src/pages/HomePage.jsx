import { Link } from '../router.jsx';
import { CatTiles, SectionHead } from '../components/ui.jsx';
import RequestForm from '../components/RequestForm.jsx';
import Foot from '../components/Foot.jsx';

/* Главная — гибридный одностраничник:
   герой → О нас → Доставка → Каталог (плитки) → Прайс-лист (форма) → Контакты */
export default function HomePage({ data, onAnchor }) {
  return (
    <>
      <section className="hero" id="top" data-screen-label="Главная">
        <div className="hero-kicker label">Дистрибьютор итальянских продуктов · HoReCa</div>
        <h2 className="hero-brand">
          Dolce<span className="amp">&amp;</span>Salato
        </h2>
        <div className="hero-sub">food solution</div>
        <p className="hero-body">{data.brand.intro_ru}</p>
        <p className="hero-it">{data.brand.intro_it}</p>
        <div className="hero-cta">
          <button className="btn-price hero-cta" style={{ marginTop: 0 }} onClick={() => onAnchor('pricelist')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4h7l3 3v13H5V4z" />
              <path d="M9 11h7M9 15h5" />
            </svg>
            Запросить прайс-лист <span className="pl-it">· Richiedi il listino</span>
          </button>
          <Link className="btn-ghost" to="/katalog">
            Смотреть каталог
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      <section className="section" id="o-nas" data-screen-label="О нас">
        <SectionHead num="01" ru={data.about.title_ru} it={data.about.title_it} />
        <div className="about-grid">
          <div className="about-col">
            <span className="since">2008</span>
            <p>{data.about.founded_ru}</p>
          </div>
          <div className="about-col">
            <h4>
              <em>Your</em> Food Solution
            </h4>
            <p>{data.about.solution_ru}</p>
          </div>
          <div className="about-col">
            <h4>{data.about.tasting_title_ru}</h4>
            <p>{data.about.tasting_ru}</p>
          </div>
        </div>
      </section>

      <section className="section" id="dostavka" data-screen-label="Доставка">
        <SectionHead num="02" ru={data.delivery.title_ru} it={data.delivery.title_it} accent="#B5532E" />
        <div className="delivery-wrap">
          <div>
            <p className="delivery-lead">
              Доставка по Москве и области — <b>в течение 24 часов</b> с момента получения заказа. В Санкт-Петербург —
              дважды в неделю, во вторник и пятницу.
            </p>
            <p className="delivery-fleet">{data.delivery.fleet_ru}</p>
          </div>
          <ul className="delivery-points">
            {data.delivery.points_ru.map((p, i) => (
              <li key={i}>
                <span className="dp-num">{String(i + 1).padStart(2, '0')}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="katalog" data-screen-label="Каталог">
        <SectionHead num="03" ru="Каталог" it="Catalogo" accent="#5E6B4F" />
        <CatTiles data={data} />
      </section>

      <section className="section req-section" id="pricelist" data-screen-label="Прайс-лист">
        <SectionHead num="04" ru="Запросить прайс-лист" it="Richiedi il listino" />
        <div className="req-panel">
          <div className="req-blurb">
            Работаем с ресторанами, отелями и кафе Москвы и области. Оставьте контакты — пришлём актуальный прайс-лист и
            условия поставки. Минимальный заказ — 8 000 ₽.
            <a className="req-phone" href={'tel:' + data.contact.phone.replace(/[^+\d]/g, '')}>
              {data.contact.phone}
            </a>
          </div>
          <RequestForm data={data} dark />
        </div>
      </section>

      <Foot data={data} />
    </>
  );
}
