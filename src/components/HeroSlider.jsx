import { useEffect, useRef, useState } from 'react';
import { Link } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { totalProducts } from '../lib/catalog.js';
import { OliveArt, ForkArt } from './Art.jsx';
import { IconArrow, IconChevronLeft, IconChevronRight } from './Icons.jsx';

const DURATION = 7000;

export default function HeroSlider({ data, onPrice }) {
  const { t } = useLang();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);

  const slides = [
    {
      key: 'olive',
      tone: 'green',
      Art: OliveArt,
      title: t('Настоящая Италия ближе, чем кажется.', 'La vera Italia è più vicina di quanto sembri.'),
      sub: t('Лучшие итальянские продукты для вашего бизнеса.', 'I migliori prodotti italiani per il tuo business.'),
      cta: (
        <Link to="/catalog" className="hero-link">
          {t('Смотреть каталог', 'Vai al catalogo')} <IconArrow size={18} />
        </Link>
      ),
    },
    {
      key: 'fork',
      tone: 'red',
      Art: ForkArt,
      title: t('Food solution от закуски до десерта.', 'Food solution dall’antipasto al dessert.'),
      sub: t(
        `${totalProducts(data)} позиций в ${data.categories.length} категориях — прямые поставки из Италии.`,
        `${totalProducts(data)} prodotti in ${data.categories.length} categorie, direttamente dall’Italia.`
      ),
      cta: (
        <button className="hero-link" onClick={() => onPrice()}>
          {t('Запросить прайс-лист', 'Richiedi il listino')} <IconArrow size={18} />
        </button>
      ),
    },
  ];
  const n = slides.length;
  const go = (k) => setI((k + n) % n);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setTimeout(() => go(i + 1), DURATION);
    return () => clearTimeout(id);
  }, [i, paused]);

  return (
    <section
      className={'hero tone-' + slides[i].tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
      aria-roledescription="carousel"
      aria-label={t('Главный баннер', 'Banner principale')}
    >
      {slides.map((s, k) => (
        <div
          key={s.key}
          className={'slide slide-' + s.key + (k === i ? ' active' : '')}
          aria-hidden={k !== i}
          role="group"
          aria-roledescription="slide"
          aria-label={`${k + 1} / ${n}`}
        >
          <s.Art className={k === i ? 'play' : ''} />
          <div className="slide-copy">
            <h2 className="hero-title">{s.title}</h2>
            <p className="hero-sub">{s.sub}</p>
            {s.cta}
          </div>
        </div>
      ))}

      <button className="hero-arrow prev" onClick={() => go(i - 1)} aria-label={t('Предыдущий слайд', 'Precedente')}>
        <IconChevronLeft size={20} />
      </button>
      <button className="hero-arrow next" onClick={() => go(i + 1)} aria-label={t('Следующий слайд', 'Successivo')}>
        <IconChevronRight size={20} />
      </button>
      <div className="hero-dots">
        {slides.map((s, k) => (
          <button key={s.key} className={k === i ? 'on' : ''} onClick={() => go(k)} aria-label={`${k + 1}`} />
        ))}
      </div>
    </section>
  );
}
