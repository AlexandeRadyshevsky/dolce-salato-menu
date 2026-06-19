import { Crumbs, CatTiles, SectionHead } from '../components/ui.jsx';

/* Страница каталога: все категории первого уровня. */
export default function CatalogPage({ data }) {
  return (
    <section className="section prod-page" style={{ borderBottom: 'none' }} data-screen-label="Каталог — все категории">
      <Crumbs items={[{ label: 'Главная', to: '/' }, { label: 'Каталог' }]} />
      <SectionHead ru="Каталог" it="Catalogo" />
      <p style={{ maxWidth: '62ch', marginTop: -22, marginBottom: 38, color: 'var(--ink-soft)' }}>
        Итальянские продукты оптом для ресторанов, отелей и кафе — {data.categories.length} категорий, от оливкового
        масла до праздничной выпечки.
      </p>
      <CatTiles data={data} />
    </section>
  );
}
