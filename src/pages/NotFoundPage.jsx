import { Link, navigate } from '../router.jsx';

/* Страница 404 в фирменном стиле (тёмно-зелёный фон, антиква). */
export default function NotFoundPage() {
  return (
    <div className="notfound" data-screen-label="404 — не найдено">
      <svg
        className="nf-fork"
        width="40"
        height="92"
        viewBox="0 0 60 158"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 12 L18 50 Q18 65 30 67 Q42 65 42 50 L42 12" />
        <path d="M30 12 L30 50" />
        <path d="M30 67 L30 150" />
      </svg>
      <p className="nf-code">
        4<span className="amp">0</span>4
      </p>
      <h1>Страница не найдена</h1>
      <div className="nf-it">Pagina non trovata</div>
      <p>Похоже, такого блюда нет в нашем меню. Возможно, ссылка устарела или адрес введён неверно.</p>
      <div className="nf-actions">
        <button className="nf-home" onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h14V10" />
          </svg>
          На главную
        </button>
        <Link className="nf-ghost" to="/katalog">
          Смотреть каталог
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
