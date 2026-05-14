# Supabase backend

Финатлон использует [Supabase](https://supabase.com) как бэкенд: авторизация,
Postgres, REST API и RLS. Своего сервера на Node не требуется.

## Структура папок

- `src/shared/supabase/` — supabase-клиент и типы `Database`.
- `src/shared/api/` — сервисный слой (`news`, `programs`, `partners`, ...).
- `src/shared/auth/` — `AuthProvider`, `useAuth`, обёртки `signIn` / `signUp` / `reset`.
- `supabase/migrations/` — SQL-миграции схемы.
- `.env.local` — URL и публичный ключ (в git не попадает).

## Таблицы

Приватные (видят только владельцы; админ — всё):

- `profiles` — расширение `auth.users` (имя, телефон, дата рождения, город,
  школа/ВУЗ, соцсети, биография, флаг `is_complete`, роль `user|admin`).
- `user_events` — история участия пользователя в мероприятиях.
- `achievements` — достижения пользователя (выдаются админом).
- `notifications` — личные уведомления (массовая рассылка — из админки).

Контент (публичное чтение, запись — только админ):

- `news` — новости (slug, заголовок, текст, обложка, статус публикации).
- `programs` — карточки направлений на главной (Викторина / Олимпиада / Форум).
- `timeline_events` — события для таймлайна.
- `stats` — числовые метрики «5+ тыс школьников», «100+ ВУЗов».
- `partners` — партнёры и организаторы (поле `kind`).
- `council_members` — попечительский совет.
- `documents` — документы с категориями.
- `faqs` — часто задаваемые вопросы.
- `site_settings` — глобальные тексты (hero, about, контакты).

Все таблицы защищены RLS. Политики используют функцию `is_admin(uid)`, которая
проверяет роль через таблицу `profiles`.

## Как развернуть БД

### Вариант 1 — через SQL Editor (быстрее)

1. Откройте [supabase.com/dashboard](https://supabase.com/dashboard) → ваш проект.
2. В меню слева найдите **SQL Editor**.
3. Скопируйте содержимое `supabase/migrations/20260514000000_init_schema.sql`.
4. Вставьте в редактор → **Run**.

Миграция идемпотентна: можно прогонять повторно.

### Вариант 2 — через Supabase CLI

```bash
npm run db:login          # сгенерируйте Personal Access Token и вставьте
npm run db:link           # привяжите проект
npm run db:push           # применит миграции
```

## Включение Email-провайдера

В **Authentication → Providers → Email**:

- Email включён по умолчанию.
- Для разработки выключите **Confirm email**, чтобы пользователи могли
  логиниться сразу после регистрации.

## Как назначить администратора

После регистрации обычного аккаунта (через сайт) откройте Supabase Studio →
**Table Editor → profiles**, найдите свою запись и поменяйте поле `role` с
`user` на `admin`. После следующего логина у вас появится доступ к `/admin`.

Альтернативно через SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

## Деплой

1. Залейте репозиторий на GitHub.
2. На Vercel → **Add New Project** → выберите репо.
3. В **Environment Variables** добавьте `VITE_SUPABASE_URL` и
   `VITE_SUPABASE_KEY` из `.env.local`.
4. **Deploy** — Vercel соберёт и выдаст ссылку.
