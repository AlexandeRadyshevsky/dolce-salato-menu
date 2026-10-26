# Dolce&Salato — сайт (редизайн 2026)

Каталог итальянских продуктов для HoReCa: **React + Vite** (статический сайт с
пререндером ЧПУ-страниц) и **API** формы «Запросить прайс-лист» (`server/`:
Node + SQLite + e-mail + Unisender).

## Источники контента (приоритет — оригинальные материалы)

| Что | Откуда |
|-----|--------|
| Категории: названия, количество, порядок, вложенность | PDF «catalogo febbraio 2025 вариант 2.pdf» (содержание, стр. 5) |
| Обложки категорий | вводные изображения в начале каждой категории PDF (у «Фарро» и «Трюфеля» вводной обложки нет — взято первое фото раздела; у «Оливкового масла» и «Уксуса» — обложка «Заправок» / фото первого товара) |
| Товары (276), фото, фасовка, описания, производители | тот же PDF |
| Логотип | `LOGO DEFINITIVO.pdf` → `src/assets/logo.svg` |
| Иллюстрации баннера | `flyer/postcard 1.pdf`, `postcard 2.pdf` → `src/assets/hero-*.svg` |

Все данные — в `src/data/menu.json`, фото — `public/images/catalog/<категория>/<товар>.jpg`,
обложки — `public/images/categories/`.

## URL

```
/                                    главная
/catalog/                            каталог (+ ?q= поиск)
/catalog/<категория>/                категория
/catalog/<категория>/<товар>-optom/  товар
/dostavka/  /privacy/
```
Старые `/katalog/…` → 301 на `/catalog/…` (nginx, `deploy/nginx.conf`) и
клиентский редирект.

## Фронтенд

```bash
npm install
npm run dev       # http://localhost:5173  (/api проксируется на :3001)
npm run build     # dist/ + статические ЧПУ-страницы + sitemap.xml
```

## API формы (`server/`)

Каждая заявка:
1. сохраняется в SQLite (`contacts` — карточка по e-mail с именем, компанией,
   телефоном; `requests` — история заявок с категориями и датой;
   `contact_segments` — `main` + id выбранных категорий);
2. уходит письмом менеджеру (SMTP);
3. синхронизируется с **Unisender**: основной список + списки-сегменты по
   категориям (контакт может быть в нескольких), категории дублируются тегами,
   телефон и компания пишутся в карточку.

```bash
cd server
npm install
cp .env.example .env            # SMTP, ADMIN_TOKEN, UNISENDER_API_KEY
npm run unisender:setup         # один раз: создаст списки и выведет строки для .env
npm start                       # API на 127.0.0.1:3001
npm run sync                    # повторная отправка в Unisender (cron)
npm run export -- pasta > pasta.csv   # CSV сегмента; --segments — счётчики
npm test
```

### Админка для заказчика

`https://<домен>/admin` — вход по паролю `ADMIN_PASSWORD` из `server/.env`.
Счётчики заявок, список заявок (контакт, компания, категории, комментарий,
статусы письма и Unisender), фильтр по сегменту-категории, поиск, выгрузка CSV
(основная база или сегмент), удаление контакта по запросу на удаление ПДн.
Страница отдаётся API-сервером (`noindex`), сессия — HttpOnly-cookie на 12 ч,
не больше 10 попыток входа за 15 минут с одного IP.

Для скриптов: `GET /api/admin/contacts.csv?segment=main` с заголовком
`Authorization: Bearer <ADMIN_TOKEN>`.

## Деплой на VPS

- `npm run build`, содержимое `dist/` → `/var/www/dolcesalato/dist`
- `server/` → `/var/www/dolcesalato/server`, `.env`, systemd: `deploy/dolcesalato-api.service`
- nginx: `deploy/nginx.conf` (статика, `/api` → :3001, 301 со старых адресов)
- Node ≥ 22.9

## Перед запуском

- реквизиты оператора ПДн на странице `/privacy/` (`src/pages/PrivacyPage.jsx`);
- код Яндекс.Вебмастера — `site.yandex_verification` в `menu.json`.
