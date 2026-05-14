-- ============================================================================
-- Finathlon initial schema
-- ============================================================================
-- This migration creates the full schema used by the app:
--   * profiles + user role
--   * private user data: events, achievements, notifications
--   * public CMS-managed content: news, programs, timeline_events, stats,
--     partners, organizers, council_members, documents, faqs
-- RLS rules:
--   * private tables -> users see only own rows, admins see/modify everything
--   * content tables -> everyone can read published rows, admins manage
-- ============================================================================

create extension if not exists pgcrypto;

-- Reset old tables before creating the new schema. Project is still in active
-- development, so dropping is safe and keeps migrations idempotent.
drop table if exists public.notifications cascade;
drop table if exists public.achievements  cascade;
drop table if exists public.user_events   cascade;
drop table if exists public.events        cascade;
drop table if exists public.news          cascade;
drop table if exists public.programs      cascade;
drop table if exists public.timeline_events cascade;
drop table if exists public.stats         cascade;
drop table if exists public.partners      cascade;
drop table if exists public.council_members cascade;
drop table if exists public.documents     cascade;
drop table if exists public.faqs          cascade;
drop table if exists public.site_settings cascade;
drop table if exists public.profiles      cascade;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'user' check (role in ('user', 'admin')),
  first_name    text,
  last_name     text,
  middle_name   text,
  email         text,
  phone         text,
  birth_date    date,
  country       text,
  city          text,
  school        text,
  class_course  text,
  telegram      text,
  vk            text,
  avatar_url    text,
  bio           text,
  is_complete   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- user_events: history of the user's participation
-- ----------------------------------------------------------------------------
create table if not exists public.user_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  year            int not null,
  date_label      text not null,
  title           text not null,
  result          text,
  publication_url text,
  diploma_url     text,
  created_at      timestamptz not null default now()
);

create index if not exists user_events_user_id_idx on public.user_events(user_id);

alter table public.user_events enable row level security;

drop policy if exists "user_events_select_own_or_admin" on public.user_events;
create policy "user_events_select_own_or_admin"
  on public.user_events for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "user_events_admin_write" on public.user_events;
create policy "user_events_admin_write"
  on public.user_events for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- achievements: user's achievements / progress badges
-- ----------------------------------------------------------------------------
create table if not exists public.achievements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  description      text,
  progress_current int not null default 0,
  progress_total   int not null default 1,
  created_at       timestamptz not null default now()
);

create index if not exists achievements_user_id_idx on public.achievements(user_id);

alter table public.achievements enable row level security;

drop policy if exists "achievements_select_own_or_admin" on public.achievements;
create policy "achievements_select_own_or_admin"
  on public.achievements for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "achievements_admin_write" on public.achievements;
create policy "achievements_admin_write"
  on public.achievements for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  document_url text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own_or_admin" on public.notifications;
create policy "notifications_select_own_or_admin"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "notifications_admin_insert_delete" on public.notifications;
create policy "notifications_admin_insert_delete"
  on public.notifications for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "notifications_admin_delete" on public.notifications;
create policy "notifications_admin_delete"
  on public.notifications for delete
  using (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- news (CMS content)
-- ----------------------------------------------------------------------------
create table if not exists public.news (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text,
  content      text,
  cover_url    text,
  author_name  text,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists news_published_idx on public.news(is_published, published_at desc);

alter table public.news enable row level security;

drop policy if exists "news_public_read" on public.news;
create policy "news_public_read"
  on public.news for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "news_admin_write" on public.news;
create policy "news_admin_write"
  on public.news for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- programs (Викторина / Олимпиада / Форум)
-- ----------------------------------------------------------------------------
create table if not exists public.programs (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text,
  description  text,
  highlights   jsonb not null default '[]'::jsonb,
  cta_label    text,
  cta_href     text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists programs_sort_idx on public.programs(sort_order);

alter table public.programs enable row level security;

drop policy if exists "programs_public_read" on public.programs;
create policy "programs_public_read"
  on public.programs for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "programs_admin_write" on public.programs;
create policy "programs_admin_write"
  on public.programs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- timeline events
-- ----------------------------------------------------------------------------
create table if not exists public.timeline_events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  date_label   text not null,
  event_year   int not null,
  accent       text not null default 'red' check (accent in ('red', 'blue', 'green', 'orange')),
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.timeline_events enable row level security;

drop policy if exists "timeline_public_read" on public.timeline_events;
create policy "timeline_public_read"
  on public.timeline_events for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "timeline_admin_write" on public.timeline_events;
create policy "timeline_admin_write"
  on public.timeline_events for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- stats (homepage tiles)
-- ----------------------------------------------------------------------------
create table if not exists public.stats (
  id           uuid primary key default gen_random_uuid(),
  metric_key   text not null unique,
  value_text   text not null,
  label        text not null,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);

alter table public.stats enable row level security;

drop policy if exists "stats_public_read" on public.stats;
create policy "stats_public_read"
  on public.stats for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "stats_admin_write" on public.stats;
create policy "stats_admin_write"
  on public.stats for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- partners
-- ----------------------------------------------------------------------------
create table if not exists public.partners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  logo_url     text,
  website_url  text,
  kind         text not null default 'partner' check (kind in ('partner', 'organizer')),
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists partners_kind_idx on public.partners(kind);

alter table public.partners enable row level security;

drop policy if exists "partners_public_read" on public.partners;
create policy "partners_public_read"
  on public.partners for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "partners_admin_write" on public.partners;
create policy "partners_admin_write"
  on public.partners for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- council members (Попечительский совет)
-- ----------------------------------------------------------------------------
create table if not exists public.council_members (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  title        text,
  bio          text,
  photo_url    text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.council_members enable row level security;

drop policy if exists "council_public_read" on public.council_members;
create policy "council_public_read"
  on public.council_members for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "council_admin_write" on public.council_members;
create policy "council_admin_write"
  on public.council_members for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- documents
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category     text not null default 'general',
  file_url     text,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists documents_category_idx on public.documents(category);

alter table public.documents enable row level security;

drop policy if exists "documents_public_read" on public.documents;
create policy "documents_public_read"
  on public.documents for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "documents_admin_write" on public.documents;
create policy "documents_admin_write"
  on public.documents for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- faqs
-- ----------------------------------------------------------------------------
create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.faqs enable row level security;

drop policy if exists "faqs_public_read" on public.faqs;
create policy "faqs_public_read"
  on public.faqs for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "faqs_admin_write" on public.faqs;
create policy "faqs_admin_write"
  on public.faqs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- site_settings (single-row key/value for global content)
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings for select
  using (true);

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write"
  on public.site_settings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- helpers: auto-create profile, touch updated_at, profile completeness flag
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_first text;
  meta_last  text;
begin
  meta_first := nullif(new.raw_user_meta_data->>'first_name', '');
  meta_last  := nullif(new.raw_user_meta_data->>'last_name', '');

  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, meta_first, meta_last)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_profile_completeness()
returns trigger
language plpgsql
as $$
begin
  new.updated_at  = now();
  new.is_complete := (
    nullif(new.first_name, '') is not null and
    nullif(new.last_name, '')  is not null and
    nullif(new.city, '')       is not null and
    nullif(new.phone, '')      is not null and
    new.birth_date is not null
  );
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_profile_completeness();

drop trigger if exists profiles_touch_insert on public.profiles;
create trigger profiles_touch_insert
  before insert on public.profiles
  for each row execute function public.touch_profile_completeness();

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'news', 'programs', 'partners', 'council_members', 'documents'
  ]
  loop
    execute format(
      'drop trigger if exists %1$s_touch on public.%1$s;
       create trigger %1$s_touch before update on public.%1$s
         for each row execute function public.touch_updated_at();',
      tbl
    );
  end loop;
end;
$$;

-- ============================================================================
-- Seed data: realistic homepage content + initial CMS content
-- Idempotent via on conflict.
-- ============================================================================

insert into public.programs (slug, title, summary, description, highlights, cta_label, cta_href, sort_order)
values
  (
    'quiz',
    'Викторина',
    'Финансовая викторина для школьников 5–11 классов: интересные задания и быстрый старт.',
    'Викторина «Финатлон» — точка входа в мир финансовой грамотности. Подходит ученикам средней и старшей школы, не требует особой подготовки и позволяет получить первый балл в личный рейтинг.',
    '["Регистрация в один клик", "Задания с разбором решений", "Сертификаты участникам", "Призы победителям и финалистам"]',
    'Участвовать',
    '/events/quiz',
    1
  ),
  (
    'olympiad',
    'Олимпиада',
    'Всероссийская олимпиада «Финатлон» для старшеклассников: отборочный и очный туры.',
    'Олимпиада объединяет старшеклассников, увлечённых экономикой и финансами. Победители получают льготы при поступлении в вузы-партнёры и приглашаются в Финатлон-форум.',
    '["Отборочный онлайн-этап", "Очный финал в Москве", "Льготы при поступлении", "Научное руководство"]',
    'Участвовать',
    '/events/olympiad',
    2
  ),
  (
    'forum',
    'Форум',
    'Финатлон-форум «Профессионалы будущего» — деловая площадка для студентов и финалистов олимпиады.',
    'Форум собирает студентов, экспертов и партнёров для обсуждения актуальных вопросов экономики и финансов. Финалисты презентуют свои исследовательские работы и получают обратную связь от профессионального жюри.',
    '["Научные секции", "Питч-сессии", "Менторская программа", "Публикации в РИНЦ"]',
    'Подробнее',
    '/events/forum',
    3
  )
on conflict (slug) do update set
  title       = excluded.title,
  summary     = excluded.summary,
  description = excluded.description,
  highlights  = excluded.highlights,
  cta_label   = excluded.cta_label,
  cta_href    = excluded.cta_href,
  sort_order  = excluded.sort_order;

insert into public.stats (metric_key, value_text, label, sort_order)
values
  ('school',       '5+ тыс', 'Школьников',     1),
  ('students',     '12+ тыс','Студентов',      2),
  ('universities', '100+',   'ВУЗов-партнёров',3)
on conflict (metric_key) do update set
  value_text = excluded.value_text,
  label      = excluded.label,
  sort_order = excluded.sort_order;

insert into public.timeline_events (title, date_label, event_year, accent, sort_order)
values
  ('Финатлон.Форум', '23 апреля', 2025, 'red', 1),
  ('Финатлон.Олимпиада', '28 ноября', 2026, 'blue', 2)
on conflict do nothing;

insert into public.faqs (question, answer, sort_order)
values
  (
    'Я не помню, где участвовал — как это проверить?',
    'Зайдите в личный кабинет: история участия, этапы и результаты хранятся в разделе «Мои мероприятия».',
    1
  ),
  (
    'А где мои баллы? Я прошёл этап, но ничего не вижу.',
    'Результаты появляются после проверки. Когда баллы будут утверждены, они отобразятся в личном кабинете автоматически.',
    2
  ),
  (
    'Я зарегистрировался и что теперь делать?',
    'Выберите интересующий этап на странице «Мероприятия» и следуйте инструкциям. Не пропустите даты регистрации.',
    3
  ),
  (
    'Я забыл пароль, что делать?',
    'Нажмите «Забыли пароль?» при входе — ссылка для восстановления придёт на почту.',
    4
  ),
  (
    'Где можно посмотреть задания прошлых лет?',
    'Архив заданий доступен в разделе «Документы» и в наших соцсетях.',
    5
  ),
  (
    'У меня что-то не работает — куда писать?',
    'Напишите в поддержку: finatlon@fin.ru или в Telegram-канал проекта. Мы поможем.',
    6
  )
on conflict do nothing;

insert into public.news (slug, title, summary, content, author_name, is_published, published_at)
values
  (
    'forum-2026-finalists',
    'Открыта регистрация финалистов Финатлон-Форума 2026',
    'Финалисты Всероссийской олимпиады «Финатлон» приглашаются к участию в очном финале и научной конференции 28–30 апреля 2026 года.',
    'Дорогие финалисты! Для участия в очной конференции 28–30 апреля 2026 года необходимо подтвердить участие, подготовить презентацию по требованиям организаторов и заполнить форму на сайте. Подробные требования к презентации и доклад опубликованы в разделе «Документы».',
    'Игорь Костиков',
    true,
    now() - interval '3 days'
  ),
  (
    'olympiad-results-21',
    'Предварительные результаты XXI Олимпиады',
    'Опубликованы предварительные списки победителей и призёров XXI Всероссийской олимпиады по финансовой грамотности.',
    'Списки победителей размещены по категориям: 8–9 класс, 10–11 класс, призёры 8–9 и 10–11 классов, специальные номинации. В случае несогласия с итогами в десятидневный срок можно подать апелляцию на адрес finalists@itu.ru.',
    'Игорь Костиков',
    true,
    now() - interval '10 days'
  ),
  (
    'microloans-explained',
    'Игорь Костиков: о росте микрозаймов и защите потребителей',
    'Доктор экономических наук Игорь Костиков рассказал о росте рынка микрокредитов в России и о том, что нужно знать заёмщикам.',
    'Россияне взяли рекордное число микрозаймов — кредитов до 30 тысяч рублей сроком до 30 дней. По мнению эксперта, рост связан с реальным падением доходов и недостаточной финансовой грамотностью населения.',
    'Игорь Костиков',
    true,
    now() - interval '20 days'
  )
on conflict (slug) do update set
  title        = excluded.title,
  summary      = excluded.summary,
  content      = excluded.content,
  author_name  = excluded.author_name,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.partners (name, description, kind, sort_order)
values
  ('Институт фондового рынка и управления', 'Профильный научно-образовательный партнёр проекта', 'organizer', 1),
  ('Финансовый университет при Правительстве РФ', 'Стратегический образовательный партнёр', 'organizer', 2),
  ('Московский Политех', 'Технологический партнёр и площадка форума', 'organizer', 3),
  ('Финатлон-Pro', 'Профессиональное сообщество выпускников', 'partner', 1),
  ('ДГУ', 'Региональный вуз-партнёр', 'partner', 2),
  ('Совкомбанк', 'Финансовый партнёр направлений «Олимпиада» и «Форум»', 'partner', 3),
  ('АКАР', 'Партнёр направления маркетинговой грамотности', 'partner', 4),
  ('Интерфакс', 'Информационный партнёр проекта', 'partner', 5),
  ('Общественные новости', 'Информационный партнёр проекта', 'partner', 6)
on conflict do nothing;

insert into public.council_members (full_name, title, bio, sort_order)
values
  ('Грибнев Руслан Семёнович', 'Председатель попечительского совета', 'Доктор экономических наук, многолетний руководитель национальных программ финансовой грамотности.', 1),
  ('Бабаев Михаил Юрьевич', 'Заместитель председателя совета', 'Эксперт в сфере банковского регулирования и устойчивого финансирования.', 2),
  ('Бабаев Кирилл Владимирович', 'Член совета', 'Учёный, специалист по международной экономике и образовательной политике.', 3),
  ('Алексеев Константин Анатольевич', 'Член совета', 'Государственный деятель, эксперт по финансовой политике регионов.', 4),
  ('Бахтин Альберт Рауфович', 'Член совета', 'Руководитель образовательного направления, наставник олимпиадных команд.', 5),
  ('Бутурина Ольга Витальевна', 'Член совета', 'Эксперт в области права и защиты прав потребителей финансовых услуг.', 6),
  ('Гусейнов Абдусалам Абдулкеримович', 'Член совета', 'Доктор философских наук, академик РАН.', 7),
  ('Юпина Юлия Альбертовна', 'Член совета', 'Эксперт в сфере банковских услуг и финансового регулирования.', 8),
  ('Колесников Андрей Николаевич', 'Член совета', 'Учёный-экономист, преподаватель ведущих вузов России.', 9)
on conflict do nothing;

insert into public.documents (title, description, category, sort_order)
values
  ('Положение об организационном комитете', 'Документ, определяющий состав и полномочия оргкомитета Финатлон.', 'general', 1),
  ('Регламент проведения олимпиады', 'Регламент отборочного и очного этапов олимпиады «Финатлон».', 'regulations', 2),
  ('Положение об олимпиаде', 'Полное положение о Всероссийской олимпиаде «Финатлон» 2025/2026.', 'regulations', 3),
  ('Рекомендации участникам', 'Методические рекомендации по подготовке к этапам олимпиады.', 'guides', 4),
  ('Методические указания', 'Методические указания для научных руководителей и наставников.', 'guides', 5),
  ('Требования к оформлению статей', 'Требования к оформлению научных статей участников Финатлон-Форума.', 'guides', 6),
  ('Требования к оформлению презентаций', 'Шаблоны и требования к оформлению презентаций для очного финала.', 'guides', 7),
  ('Критерии оценки научных работ', 'Критерии оценки докладов и научных работ участников.', 'guides', 8)
on conflict do nothing;

insert into public.site_settings (key, value)
values
  (
    'hero',
    '{
      "title": "Финатлон — платформа для финансовых олимпиад, викторин и форумов",
      "subtitle": "Развиваем финансовую грамотность школьников и студентов, поддерживаем талантливых ребят и объединяем экспертов вокруг идеи устойчивой экономики."
    }'::jsonb
  ),
  (
    'about',
    '{
      "title": "О Финатлоне",
      "paragraphs": [
        "Финатлон — это масштабная образовательная инициатива по развитию финансовой грамотности, поддержке талантливых школьников и продвижению принципов устойчивого развития в экономике и обществе.",
        "Проект объединяет несколько ключевых направлений: всероссийскую олимпиаду для старшеклассников, образовательную викторину для школьников и деловой Финатлон-форум, где обсуждаются актуальные вопросы экономики и социальной ответственности."
      ]
    }'::jsonb
  ),
  (
    'contacts',
    '{
      "phone": "+7 (495) 123-45-67",
      "email": "finatlon@fin.ru",
      "address": "Москва, ул. Профсоюзная, 65"
    }'::jsonb
  )
on conflict (key) do update set
  value      = excluded.value,
  updated_at = now();
