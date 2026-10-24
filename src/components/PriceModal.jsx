import { useEffect } from 'react';
import { useLang } from '../i18n.jsx';
import PriceForm from './PriceForm.jsx';
import { IconClose } from './Icons.jsx';

/* Модальное окно «Запросить прайс-лист».
   preset — категории, отмеченные заранее (с какой страницы открыли). */
export default function PriceModal({ data, preset, product, onClose }) {
  const { t, name } = useLang();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="pm-title">
        <button className="modal-close" onClick={onClose} aria-label={t('Закрыть', 'Chiudi')}>
          <IconClose />
        </button>
        <div className="eyebrow">{t('Каталог и цены', 'Catalogo e prezzi')}</div>
        <h3 id="pm-title">{t('Запросить прайс-лист', 'Richiedi il listino')}</h3>
        <p className="modal-lead">
          {product
            ? t('Товар: ', 'Prodotto: ') + name(product) + '. '
            : ''}
          {t(
            'Получите актуальный каталог и специальные условия для вашего бизнеса.',
            'Ricevi il catalogo aggiornato e condizioni speciali per il tuo business.'
          )}
        </p>
        <PriceForm data={data} preset={preset} product={product} variant="modal" />
      </div>
    </div>
  );
}
