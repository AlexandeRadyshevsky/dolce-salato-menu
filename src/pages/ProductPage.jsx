import { useLang } from '../i18n.jsx';
import { asset, categoryById, catPath } from '../lib/catalog.js';
import { Crumbs, Eyebrow, ProductCard } from '../components/ui.jsx';
import { IconArrow } from '../components/Icons.jsx';

/* Страница товара: /catalog/<категория>/<товар>-optom/ */
export default function ProductPage({ data, cat, product, onPrice }) {
  const { t, name, lang } = useLang();
  const parent = cat.parent ? categoryById(data, cat.parent) : null;
  const producerText = product.producer && data.producers ? data.producers[product.producer] : null;
  const related = cat.products.filter((p) => p !== product).slice(0, 4);

  const facts = [
    [t('Фасовка', 'Formato'), product.format],
    [t('Упаковка', 'Confezione'), product.pack && product.pack.join(' · ')],
    [t('Характеристики', 'Caratteristiche'), product.spec],
    [t('Хранение', 'Conservazione'), product.storage],
    [t('Производитель', 'Produttore'), product.producer],
  ].filter(([, v]) => v);

  return (
    <div className="page">
      <Crumbs
        items={[
          { label: t('Главная', 'Home'), to: '/' },
          { label: t('Каталог', 'Catalogo'), to: '/catalog' },
          ...(parent ? [{ label: name(parent), to: catPath(parent) }] : []),
          { label: name(cat), to: catPath(cat) },
          { label: name(product) },
        ]}
      />

      <article className="prod">
        <div className="prod-img">
          {product.image ? <img src={asset(product.image)} alt={product.name_ru + ' — ' + (product.name_it || '')} /> : null}
        </div>
        <div className="prod-info">
          <Eyebrow>{name(cat)}</Eyebrow>
          <h1 className="h2">{name(product)}</h1>
          {product.name_it && <div className="prod-alt">{lang === 'ru' ? product.name_it : product.name_ru}</div>}
          {product.subtitle_ru && <p className="prod-sub">{product.subtitle_ru}</p>}

          {facts.length > 0 && (
            <dl className="facts">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.desc_ru && (
            <div className="prod-text">
              <h2>{t('Описание', 'Descrizione')}</h2>
              <p>{product.desc_ru}</p>
            </div>
          )}
          {product.usage_ru && (
            <div className="prod-text">
              <h2>{t('Применение', 'Utilizzo')}</h2>
              <p>{product.usage_ru}</p>
            </div>
          )}

          <div className="prod-cta">
            <button className="btn btn-red" onClick={() => onPrice([cat.id], product)}>
              {t('Запросить цену оптом', 'Richiedi il prezzo all’ingrosso')} <IconArrow size={16} />
            </button>
            <a className="btn btn-outline" href={'tel:' + data.contact.phone.replace(/[^+\d]/g, '')}>
              {data.contact.phone}
            </a>
          </div>
        </div>
      </article>

      {producerText && (
        <section className="producer">
          <Eyebrow>{t('О производителе', 'Il produttore')}</Eyebrow>
          <h2 className="h3">{product.producer}</h2>
          <p>{producerText}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className="related">
          <div className="sec-head">
            <h2 className="h3">{t('Ещё в категории', 'Altri prodotti')} «{name(cat)}»</h2>
          </div>
          <div className="p-grid">
            {related.map((p, i) => (
              <ProductCard key={p.slug} cat={cat} product={p} onPrice={onPrice} delay={i * 50} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
