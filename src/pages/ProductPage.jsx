import { Crumbs, SectionHead, catAccent } from '../components/ui.jsx';
import RequestForm from '../components/RequestForm.jsx';
import useImageProbe from '../components/useImageProbe.js';

/* Страница товара (ЧПУ со словом «оптом»):
   фото, описание и форма быстрого запроса именно об этом продукте. */
export default function ProductPage({ data, cat, product }) {
  const idx = data.categories.indexOf(cat);
  const accent = catAccent(idx);
  const src = import.meta.env.BASE_URL + 'images/' + product.id + '.jpg';
  const imgOk = useImageProbe(src);

  return (
    <div className="prod-page" style={{ '--cat-accent': accent }} data-screen-label={'Товар: ' + product.name_ru}>
      <Crumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Каталог', to: '/katalog' },
          { label: cat.name_ru, to: '/katalog/' + cat.slug },
          { label: product.name_ru },
        ]}
      />

      <div className="prod-layout">
        <div className="prod-photo">
          {imgOk ? <img src={src} alt={product.name_ru} /> : <span className="ph-cap">{cat.name_it}</span>}
        </div>
        <div className="prod-info">
          {product.producer && <div className="producer">{product.producer}</div>}
          <h1>{product.name_ru}</h1>
          <div className="name-it">{product.name_it}</div>
          {product.desc_ru && <p className="desc">{product.desc_ru}</p>}
          {product.pairing && (
            <p className="pairing">
              <b>Сочетания —</b> {product.pairing}
            </p>
          )}
          {product.format && (
            <div className="format" style={{ marginBottom: 34 }}>
              <span className="fmt-line" style={{ background: accent }} />
              <span className="label">{product.format}</span>
            </div>
          )}

          <SectionHead ru="Запросить информацию" it="Richiedi informazioni" />
          <RequestForm data={data} product={product} compact />
        </div>
      </div>
    </div>
  );
}
