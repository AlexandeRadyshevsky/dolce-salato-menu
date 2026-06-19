/* Подвал с контактами (якорь #contacts). */
export default function Foot({ data }) {
  const c = data.contact;
  return (
    <footer className="foot" id="contacts" data-screen-label="Контакты">
      <div>
        <div className="foot-brand">
          Dolce<span className="amp">&amp;</span>Salato
        </div>
        <div className="foot-meta" style={{ marginTop: 10 }}>
          {data.brand.tagline_en} · {data.brand.tagline_ru}
        </div>
      </div>
      <div className="foot-meta">
        <span className="label">{c.office_ru} · Контакты</span>
        {c.address_ru}
        <br />
        <br />
        <a href={'tel:' + c.phone.replace(/[^+\d]/g, '')}>{c.phone}</a>
        <br />
        <a href={'mailto:' + c.email}>{c.email}</a>
        <br />
        {c.sites.map((s) => (
          <span key={s}>
            <a href={'https://' + s} target="_blank" rel="noopener">
              {s}
            </a>
            <br />
          </span>
        ))}
      </div>
    </footer>
  );
}
