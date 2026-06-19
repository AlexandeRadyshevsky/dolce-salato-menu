import { useState, useEffect, useRef } from 'react';

/* Форма запроса по ТЗ.
   Обязательные поля: Имя, Фамилия, Название компании (Ragione Sociale), Телефон.
   Без product — мультивыбор интересующих категорий (для фильтрации заявок в CRM).
   С product — запрос информации о конкретном товаре.
   Бэка нет: заявка валидируется, сохраняется в localStorage
   (ключ ds_price_requests) и дублируется через mailto. Для подключения
   реального бэка замените тело submit() на fetch() POST. */
export default function RequestForm({ data, product, dark, compact }) {
  const empty = { firstName: '', lastName: '', company: '', phone: '', email: '', comment: '' };
  const [form, setForm] = useState(empty);
  const [cats, setCats] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('form'); // form | sending | done
  const [ddOpen, setDdOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleCat = (id) => setCats((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  const validate = () => {
    const er = {};
    if (!form.firstName.trim()) er.firstName = 'Укажите имя · Nome';
    if (!form.lastName.trim()) er.lastName = 'Укажите фамилию · Cognome';
    if (!form.company.trim()) er.company = 'Укажите компанию · Ragione sociale';
    if (!form.phone.trim()) er.phone = 'Укажите телефон · Telefono';
    else if (form.phone.replace(/[^\d]/g, '').length < 7) er.phone = 'Неверный номер · Numero non valido';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      er.email = 'Неверный формат · Formato non valido';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      const key = 'ds_price_requests';
      const logArr = JSON.parse(localStorage.getItem(key) || '[]');
      logArr.push({
        ...form,
        categories: product ? undefined : cats,
        product: product ? { id: product.id, name: product.name_ru } : undefined,
        at: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(logArr));
    } catch (_) {
      /* ignore */
    }
    setTimeout(() => setStatus('done'), 700);
  };

  const mailtoHref = () => {
    const catNames = data.categories.filter((c) => cats.includes(c.id)).map((c) => c.name_ru);
    const subj = encodeURIComponent(
      product
        ? 'Запрос по товару: ' + product.name_ru + ' — Dolce&Salato'
        : 'Запрос прайс-листа / Richiesta listino — Dolce&Salato'
    );
    const body = encodeURIComponent(
      'Имя / Nome: ' + form.firstName +
        '\nФамилия / Cognome: ' + form.lastName +
        '\nКомпания / Ragione sociale: ' + form.company +
        '\nТелефон / Telefono: ' + form.phone +
        (form.email ? '\nEmail: ' + form.email : '') +
        (product ? '\n\nТовар / Prodotto: ' + product.name_ru + ' (' + product.name_it + ')' : '') +
        (!product && catNames.length ? '\n\nИнтересующие категории:\n— ' + catNames.join('\n— ') : '') +
        '\n\nКомментарий / Commento:\n' + (form.comment || '—')
    );
    return 'mailto:' + data.contact.email + '?subject=' + subj + '&body=' + body;
  };

  const field = (k, labelRu, labelIt, opts = {}) => (
    <div className={'field' + (errors[k] ? ' invalid' : '') + (opts.full ? ' full' : '')}>
      <label htmlFor={'f-' + k + (product ? '-p' : '')}>
        {labelRu}
        {!opts.optional && <span className="req">*</span>}
        <span className="lab-it">{labelIt}</span>
      </label>
      {opts.textarea ? (
        <textarea
          id={'f-' + k + (product ? '-p' : '')}
          value={form[k]}
          onChange={set(k)}
          placeholder={opts.ph}
          rows={compact ? 2 : 3}
        />
      ) : (
        <input
          id={'f-' + k + (product ? '-p' : '')}
          type={opts.type || 'text'}
          value={form[k]}
          onChange={set(k)}
          placeholder={opts.ph}
          autoComplete={opts.ac}
        />
      )}
      <div className="err">{errors[k] || ''}</div>
    </div>
  );

  if (status === 'done') {
    return (
      <div className="req-done">
        <div className="ok-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4>Спасибо! · Grazie!</h4>
        <p>Заявка принята — мы свяжемся с вами и пришлём {product ? 'информацию о товаре' : 'актуальный прайс-лист'}.</p>
        <a className="md-submit" style={{ marginTop: 22, display: 'inline-flex' }} href={mailtoHref()}>
          Продублировать на почту <span className="pl-it">· via email</span>
        </a>
      </div>
    );
  }

  const selCount = cats.length;

  return (
    <form className={'md-form req-form' + (dark ? '' : ' light')} onSubmit={submit} noValidate>
      {field('firstName', 'Имя', 'Nome', { ac: 'given-name', ph: 'Иван' })}
      {field('lastName', 'Фамилия', 'Cognome', { ac: 'family-name', ph: 'Иванов' })}
      {field('company', 'Название компании', 'Ragione sociale', { full: true, ac: 'organization', ph: 'Ресторан «Например»' })}
      {field('phone', 'Телефон', 'Telefono', { type: 'tel', ac: 'tel', ph: '+7 900 000-00-00' })}
      {field('email', 'Email', 'facoltativo', { type: 'email', ac: 'email', optional: true, ph: 'you@restaurant.ru' })}

      {product ? (
        <div className="field full">
          <label>
            Товар <span className="lab-it">Prodotto</span>
          </label>
          <input value={product.name_ru + ' — ' + product.name_it} readOnly disabled />
        </div>
      ) : (
        <div className="field full" ref={ddRef}>
          <label>
            Интересующие категории <span className="lab-it">facoltativo</span>
          </label>
          <div className="ms-dd">
            <button type="button" className={'ms-btn' + (ddOpen ? ' open' : '')} onClick={() => setDdOpen((v) => !v)} aria-expanded={ddOpen}>
              {selCount ? <span>Выбрано: {selCount}</span> : <span className="ms-ph">Выберите категории товаров…</span>}
              <svg className="chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {ddOpen && (
              <div className="ms-list">
                {data.categories.map((c) => (
                  <div key={c.id} className={'ms-item' + (cats.includes(c.id) ? ' on' : '')} onClick={() => toggleCat(c.id)}>
                    <span className="box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {c.name_ru}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {field('comment', 'Комментарий', 'Commento — facoltativo', { full: true, textarea: true, optional: true, ph: 'Объёмы, вопросы, пожелания…' })}

      <div className="field full">
        <button className="md-submit" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <>
              <span className="md-spinner" /> Отправляем…
            </>
          ) : (
            <>
              Отправить запрос <span className="pl-it">· Invia</span>
            </>
          )}
        </button>
        <p className="md-note">Нажимая «Отправить», вы соглашаетесь на обработку контактных данных для ответа на запрос.</p>
      </div>
    </form>
  );
}
