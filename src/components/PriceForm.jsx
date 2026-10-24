import { useState } from 'react';
import { Link } from '../router.jsx';
import { useLang } from '../i18n.jsx';
import { IconArrow, IconCheck } from './Icons.jsx';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Форма «Запросить прайс-лист».
   Заявка уходит на бэкенд (server/): сохраняется в БД, дублируется письмом
   менеджеру и синхронизируется с Unisender (основной список + сегменты по
   выбранным категориям). Категории = категории PDF-каталога (id из menu.json). */
export default function PriceForm({ data, preset = [], product = null, variant = 'section', onDone }) {
  const { t, name } = useLang();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', comment: '', website: '' });
  const [cats, setCats] = useState(preset);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: null }));
  };
  const toggle = (id) => setCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = t('Укажите имя', 'Inserisci il nome');
    if (!form.company.trim()) er.company = t('Укажите компанию', 'Inserisci l’azienda');
    if (!EMAIL_RE.test(form.email.trim())) er.email = t('Проверьте e-mail', 'Controlla l’e-mail');
    if (form.phone.replace(/\D/g, '').length < 10) er.phone = t('Проверьте телефон', 'Controlla il telefono');
    if (!consent) er.consent = t('Нужно согласие на обработку данных', 'Serve il consenso');
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      const res = await fetch(API + '/price-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categories: cats,
          product: product ? product.slug : undefined,
          consent: true,
          page: window.location.href,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setStatus('done');
      onDone && onDone();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className={'pf pf-' + variant + ' pf-done'}>
        <span className="pf-ok">
          <IconCheck size={28} sw={2} />
        </span>
        <h4>{t('Спасибо! Заявка отправлена', 'Grazie! Richiesta inviata')}</h4>
        <p>
          {t(
            'Менеджер свяжется с вами и пришлёт актуальный прайс-лист и условия сотрудничества.',
            'Un manager vi contatterà con il listino aggiornato e le condizioni.'
          )}
        </p>
      </div>
    );
  }

  const input = (k, label, type = 'text', ac) => (
    <label className={'pf-field' + (errors[k] ? ' bad' : '')}>
      <input
        type={type}
        value={form[k]}
        onChange={set(k)}
        placeholder={label + '*'}
        aria-label={label}
        aria-invalid={!!errors[k]}
        autoComplete={ac}
        inputMode={type === 'tel' ? 'tel' : undefined}
      />
      {errors[k] && <span className="pf-err">{errors[k]}</span>}
    </label>
  );

  return (
    <form className={'pf pf-' + variant} onSubmit={submit} noValidate>
      <div className="pf-inputs">
        {input('name', t('Ваше имя', 'Nome'), 'text', 'name')}
        {input('company', t('Название компании', 'Azienda'), 'text', 'organization')}
        {input('email', 'Email', 'email', 'email')}
        {input('phone', t('Телефон', 'Telefono'), 'tel', 'tel')}
        {variant === 'modal' && (
          <label className="pf-field pf-wide">
            <textarea
              rows={2}
              value={form.comment}
              onChange={set('comment')}
              placeholder={t('Комментарий (необязательно)', 'Commento (facoltativo)')}
            />
          </label>
        )}
        {/* honeypot для ботов */}
        <input className="pf-hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />
      </div>

      <fieldset className="pf-cats">
        <legend>{t('Какие категории вас интересуют?', 'Quali categorie vi interessano?')}</legend>
        <div className="pf-cat-list">
          {data.categories.map((c) => (
            <label key={c.id} className="pf-check">
              <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggle(c.id)} />
              <span className="box" aria-hidden="true">
                <IconCheck size={12} sw={3} />
              </span>
              {name(c)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pf-foot">
        <button className="btn btn-red pf-submit" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? t('Отправляем…', 'Invio…') : t('Получить прайс-лист', 'Ricevi il listino')}
          <IconArrow size={18} />
        </button>
        <label className={'pf-check pf-consent' + (errors.consent ? ' bad' : '')}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span className="box" aria-hidden="true">
            <IconCheck size={12} sw={3} />
          </span>
          <span>
            {t('Я согласен на ', 'Acconsento al ')}
            <Link to="/privacy" target="_blank">
              {t('обработку персональных данных', 'trattamento dei dati personali')}
            </Link>
          </span>
        </label>
        {status === 'error' && (
          <p className="pf-fail" role="alert">
            {t('Не удалось отправить заявку. Позвоните нам: ', 'Invio non riuscito. Chiamateci: ')}
            <a href={'tel:' + data.contact.phone.replace(/[^+\d]/g, '')}>{data.contact.phone}</a>
            {t(' или напишите на ', ' o scrivete a ')}
            <a href={'mailto:' + data.contact.email}>{data.contact.email}</a>
          </p>
        )}
      </div>
    </form>
  );
}
