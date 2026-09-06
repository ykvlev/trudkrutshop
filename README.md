<div align="center">

# 🎽 ТрудКрутШоп

**Интернет-магазин официального мерча Российских Студенческих Отрядов**

Футболки · худи · значки и пины · аксессуары · подарочные сертификаты

<br>

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

<sub>#ТрудКрут, а ты ещё круче 💪</sub>

</div>

---

Полнофункциональная платформа: витрина и каталог, корзина и оформление, приём
оплаты и расчёт доставки, счета и УПД для юридических лиц, склад с журналом
движений, подарочные сертификаты и админ-панель. Подробный план и архитектура —
в [`docs/plan.md`](docs/plan.md).

## ✨ Возможности

- 🛍️ **Витрина** — каталог с вложенными категориями, поиск, карточки товаров с вариантами (размер/цвет)
- 🛒 **Заказ** — корзина со снимком цен, промокоды, расчёт доставки, статус-страница заказа
- 💳 **Оплата** — эквайринг и касса 54-ФЗ (Точка); подтверждение только по вебхуку
- 🚚 **Доставка** — расчёт и оформление (SafeRoute), трек-номера
- 🧾 **Юрлицам** — реквизиты по ИНН, **счёт на оплату в PDF**, УПД через ЭДО
- 📦 **Склад** — остатки по вариантам, бронирование, журнал движений (любое изменение — проводкой)
- 🎁 **Сертификаты** — выпуск, баланс, погашение
- 🛠️ **Админка** — заказы, товары, склад, промокоды, сертификаты, пользователи
- 🔒 **Безопасность и SEO** — CSP и security-заголовки, cookie-баннер (152-ФЗ), sitemap/robots, JSON-LD

## 🧰 Стек

| Слой | Технологии |
|---|---|
| Фронтенд | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| Данные | PostgreSQL 18, Prisma (схема, миграции) |
| Фон | pg-boss — задачи поверх той же Postgres (без отдельного Redis) |
| Документы | pdf-lib — счета на оплату (PDF, кириллица) |
| Качество | zod (валидация окружения), Vitest (юнит + интеграционные тесты) |
| Деплой | Docker Compose: app + worker + Postgres + Caddy (авто-TLS) |

## 🚀 Быстрый старт

> Нужны **Node 20+** и **PostgreSQL 18** (порт `5433` по умолчанию, см. `.env`).

```bash
# 1. Зависимости
npm install

# 2. Окружение
cp .env.example .env          # впишите DATABASE_URL и, при наличии, ключи

# 3. База: роли и БД (один раз, под суперпользователем postgres)
psql -U postgres -f scripts/create-db.sql

# 4. Схема и тестовые данные
npx prisma migrate deploy     # применить миграции
npm run db:seed               # наполнить каталог

# 5. Запуск
npm run dev                   # → http://localhost:3000
npm run worker                # в отдельном терминале: фоновые задачи
```

> 💡 Без БД витрина работает в демо-режиме на тестовых данных
> (`src/lib/test-data.ts`), а интеграции — в mock-режиме, пока не заданы ключи.
> Можно посмотреть проект, ничего не настраивая.

## 🔑 Переменные окружения

Полный список — в [`.env.example`](.env.example). Ключевые:

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Подключение к Postgres — **обязательна** |
| `TOCHKA_API_KEY` | Оплата и касса 54-ФЗ (Точка) · пусто → mock |
| `SAFEROUTE_API_KEY` | Расчёт и оформление доставки · пусто → mock |
| `DIADOC_API_KEY` | ЭДО для УПД · пусто → ручной PDF |
| `DADATA_TOKEN` | Реквизиты юрлица по ИНН · пусто → mock |
| `SELLER_*` | Реквизиты продавца для счёта (PDF) |
| `SITE_ADDRESS`, `POSTGRES_*` | Только для Docker Compose |

Окружение валидируется при старте (`src/lib/env.ts` → `src/instrumentation.ts`):
критичные ошибки логируются, ненастроенные интеграции — предупреждением.

## 📜 Скрипты

| Команда | Действие |
|---|---|
| `npm run dev` | Дев-сервер |
| `npm run build` · `start` | Прод-сборка (standalone) · запуск |
| `npm run worker` | Воркер фоновых задач (pg-boss) |
| `npm run lint` · `typecheck` | ESLint · проверка типов |
| `npm test` | Юнит-тесты |
| `npm run test:integration` | Интеграционные тесты (нужна `TEST_DATABASE_URL`) |
| `npm run db:migrate` · `db:seed` · `db:studio` | Миграции · сид · Prisma Studio |

## 🗄️ Миграции

История — в `prisma/migrations`. Базовая `0_init` снята со схемы и помечена
применённой на существующей БД (baseline, **без сброса данных**). На новой БД
применяется командой `npx prisma migrate deploy` — её же выполняет контейнер
`app` перед стартом.

## 🐳 Деплой (Docker)

```bash
cp .env.example .env    # задайте POSTGRES_PASSWORD, SITE_ADDRESS, SELLER_* и ключи
docker compose up -d --build
```

Поднимаются четыре сервиса:

| Сервис | Роль |
|---|---|
| `db` | PostgreSQL 18 (данные в volume) |
| `app` | Next.js (standalone), применяет миграции перед стартом |
| `worker` | Фоновые задачи (pg-boss) |
| `caddy` | Реверс-прокси и автоматический TLS для `SITE_ADDRESS` |

Заголовки безопасности задаёт само приложение (`next.config.ts`).

## 🗂️ Структура

```
src/
  app/            маршруты (App Router): (shop) витрина, (admin) панель, api/
  components/     UI: shop/, admin/
  domain/         бизнес-инварианты: pricing, stock (чистые, покрыты тестами)
  lib/            data/ (фасад БД), actions*, invoice/ (PDF счёта), env
  integrations/   провайдеры: payment · fiscal · delivery · edo · dadata · crm · email
  jobs/           очередь и обработчики фоновых задач (pg-boss)
prisma/           schema.prisma · migrations/ · seed.ts
docs/plan.md      план разработки и архитектура
```

## 🧪 Тесты

```bash
npm test                  # юнит: бизнес-логика (pricing, склад)
npm run test:integration  # интеграционные: заказ/склад на реальной БД
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) прогоняет lint,
типы, тесты и сборку, а также миграции и сид на сервисной Postgres.

---

<div align="center">
<sub>Сделано для Российских Студенческих Отрядов 🇷🇺</sub>
</div>
