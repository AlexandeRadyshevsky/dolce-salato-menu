import { useEffect } from 'react';
import RequestForm from './RequestForm.jsx';

/* Модальная обёртка формы запроса: прайс-лист или конкретный товар. */
export default function PriceModal({ data, product, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={product ? 'Запрос по товару' : 'Запросить прайс-лист'}>
        <button className="md-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <div className="md-kicker label">Сотрудничество · Collaborazione</div>
        <h3>{product ? 'Запрос по товару' : 'Запросить прайс-лист'}</h3>
        <div className="md-it">{product ? 'Richiesta informazioni prodotto' : 'Richiedi il listino prezzi'}</div>
        <p className="md-lead">
          {product
            ? 'Оставьте контакты — расскажем о товаре, ценах и условиях поставки.'
            : 'Оставьте контакты — пришлём актуальные цены и условия поставки для вашего заведения.'}
        </p>
        <RequestForm data={data} product={product} compact />
      </div>
    </div>
  );
}
