import { useLang, useProductText } from '../i18n.jsx';
import { asset, categoryById, catPath } from '../lib/catalog.js';
import { Crumbs, Eyebrow, ProductCard } from '../components/ui.jsx';
import { IconArrow } from '../components/Icons.jsx';

/* Страница товара: /catalog/<категория>/<товар>-optom/
   Все тексты — строго на языке сайта (итальянские из PDF-каталога). */
export default function ProductPage({ data, cat, product, onPrice }) {
  const { t, name } = useLang();
  const pt = useProductText();
  const parent = cat.parent ? categoryById(data, cat.parent) : null;
  const producerText = pt.producerText(data, product.producer);
  const related = cat.products.filter((p) => p !== product).slice(0, 4);
  const desc = pt.desc(product);
  const usage = pt.usage(product);
  const subtitle = pt.subtitle(product);

  const facts = [
    [t('Фасовка', 'Formato'), pt.format(product)],
    [t('Упаковка', 'Confezione'), pt.pack(product)],
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
          {product.image && (
            <img src={asset(product.image)} alt={name(product)} />
          )}
        </div>
        <div className="prod-info">
          <Eyebrow>{name(cat)}</Eyebrow>
          <h1 className="h2">{name(product)}</h1>
          {subtitle && <p className="prod-sub">{subtitle}</p>}

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

          {desc && (
            <div className="prod-text">
              <h2>{t('Описание', 'Descrizione')}</h2>
              <p>{desc}</p>
            </div>
          )}
          {usage && (
            <div className="prod-text">
              <h2>{t('Применение', 'Utilizzo')}</h2>
              <p>{usage}</p>
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
            <h2 className="h3">
              {t('Ещё в категории', 'Altri prodotti in')} «{name(cat)}»
            </h2>
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
