import { Link } from '../router.jsx';
import useReveal from './useReveal.js';
import useImageProbe from './useImageProbe.js';

/* Карточка товара: фото/плейсхолдер, ссылка на страницу товара (ЧПУ)
   и быстрый запрос информации по этому товару. */
export default function ProductCard({ product, category, onRequest, delay = 0 }) {
  const [ref, seen] = useReveal();
  const src = import.meta.env.BASE_URL + 'images/' + product.id + '.jpg';
  const imgOk = useImageProbe(src);
  const to = '/katalog/' + category.slug + '/' + product.slug;

  return (
    <article ref={ref} className={'card' + (seen ? ' in' : '')} style={{ transitionDelay: delay + 'ms' }}>
      <Link className="thumb" to={to} aria-label={product.name_ru}>
        {imgOk ? (
          <img src={src} alt={product.name_ru} loading="lazy" />
        ) : (
          <span className="ph-cap">{category.name_it}</span>
        )}
      </Link>
      <div className="body">
        {product.producer && <div className="producer">{product.producer}</div>}
        <h4>
          <Link to={to}>{product.name_ru}</Link>
        </h4>
        <div className="name-it">{product.name_it}</div>
        {product.desc_ru && <p className="desc">{product.desc_ru}</p>}
        {product.format && (
          <div className="format">
            <span className="fmt-line" />
            <span className="label">{product.format}</span>
          </div>
        )}
        <div className="card-actions">
          <button className="card-req" onClick={() => onRequest(product)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16v12H4z" />
              <path d="M4 7l8 6 8-6" />
            </svg>
            Запросить информацию
          </button>
          <Link className="card-more" to={to}>
            Подробнее
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
