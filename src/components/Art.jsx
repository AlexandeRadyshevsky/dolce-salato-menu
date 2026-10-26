/* Оригинальная векторная графика из материалов заказчика (папка на Я.Диске):
   логотип — «LOGO DEFINITIVO.pdf», иллюстрации баннера — flyer/postcard 1 и 2.
   SVG сконвертированы из PDF один-в-один; группы (id) переименованы в классы,
   чтобы CSS мог перекрашивать логотип и анимировать части иллюстраций. */
import logoRaw from '../assets/logo.svg?raw';
import oliveRaw from '../assets/hero-olive.svg?raw';
import forkRaw from '../assets/hero-fork.svg?raw';

const classify = (svg, prefix) => svg.replace(/<g id="([\w-]+)"/g, `<g class="${prefix}-$1"`);

const LOGO = classify(logoRaw, 'lg');
/* Рука в оригинале обрезана ровно по низу открытки (y=461.84). Чтобы при
   анимации (подъём + поворот) снизу не открывался срез, продлеваем руку
   вниз за край баннера по наклону её краёв; лишнее скрывает overflow героя. */
const ARM_EXTENSION =
  '<path d="M-58.02 455L-109.4 545L-28.6 545L1.84 455Z" fill="#ffffff"/>';
const OLIVE = classify(oliveRaw, 'ol').replace('<g class="ol-hand">', '<g class="ol-hand">' + ARM_EXTENSION);
const FORK = classify(forkRaw, 'fk')
  /* нити спагетти рисуются штрихом: pathLength=1 для анимации stroke-dashoffset */
  .replace(/<path d="([^"]+)" fill="none" stroke=/g, '<path pathLength="1" d="$1" fill="none" stroke=');

export function Logo({ className = '', title = 'Dolce&Salato — your food solution' }) {
  return <span className={'logo ' + className} role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: LOGO }} />;
}

export function OliveArt({ className = '' }) {
  return <div className={'art art-olive ' + className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: OLIVE }} />;
}

export function ForkArt({ className = '' }) {
  return <div className={'art art-fork ' + className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: FORK }} />;
}

/* Декоративная оливковая ветвь для блока «Запросить прайс-лист» —
   в той же плоской манере, что и иллюстрации открыток. */
export function OliveBranch({ className = '' }) {
  return (
    <svg className={'olive-branch ' + className} viewBox="0 0 320 300" aria-hidden="true">
      <path d="M8 292C70 230 120 170 175 120S270 40 312 12" fill="none" stroke="#173f27" strokeWidth="4" strokeLinecap="round" />
      <g fill="#2f7a45">
        <path d="M60 238c-28-8-46-30-50-58 30 4 50 24 50 58z" />
        <path d="M98 196c-6-30 4-58 28-74 8 28-2 56-28 74z" />
        <path d="M128 168c-30-2-54-20-64-46 30-2 54 16 64 46z" />
        <path d="M176 120c2-30 20-54 46-62 0 30-18 54-46 62z" />
        <path d="M208 94c-28-10-44-34-46-62 28 8 46 32 46 62z" />
        <path d="M250 62c8-28 30-46 58-50-6 28-28 48-58 50z" />
        <path d="M150 146c26 14 38 40 34 70-26-14-38-40-34-70z" />
        <path d="M232 80c28 4 48 22 56 48-28-2-48-20-56-48z" />
      </g>
      <g fill="#173f27">
        <ellipse cx="112" cy="214" rx="17" ry="24" transform="rotate(-28 112 214)" />
        <ellipse cx="196" cy="160" rx="15" ry="21" transform="rotate(-36 196 160)" />
        <ellipse cx="272" cy="104" rx="14" ry="19" transform="rotate(-40 272 104)" />
      </g>
      <g fill="#c2c796" opacity=".55">
        <ellipse cx="105" cy="205" rx="4" ry="7" transform="rotate(-28 105 205)" />
        <ellipse cx="190" cy="152" rx="3.5" ry="6" transform="rotate(-36 190 152)" />
        <ellipse cx="266" cy="97" rx="3" ry="5.5" transform="rotate(-40 266 97)" />
      </g>
    </svg>
  );
}
