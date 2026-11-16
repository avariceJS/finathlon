-- ============================================================================
-- Finathlon: Olympiads and Profiles section
-- ============================================================================
-- This migration adds tables for managing olympiad events and participant profiles
-- in the admin panel section "Олимпиады и профили".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- olympiads: management of olympiad events/directions
-- ----------------------------------------------------------------------------
create table if not exists public.olympiads (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  profile_title   text,
  description     text,
  season          text,
  year            int not null,
  
  
  format          text not null default 'online' check (format in ('online', 'offline')),
  
  status          text not null default 'draft' check (status in ('draft', 'published', 'completed', 'archived')),
  start_date      date,
  end_date        date,
  max_participants int,
  is_published    boolean not null default true,
  rich_content    text,
  
  -- Добавили ручное управление регистрацией
  registration_open boolean default null,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists olympiads_year_idx on public.olympiads(year);
create index if not exists olympiads_status_idx on public.olympiads(status);
create index if not exists olympiads_is_published_idx on public.olympiads(is_published);

alter table public.olympiads enable row level security;

-- Ensure profile_title column exists (for databases where table was created before this migration)
alter table public.olympiads add column if not exists profile_title text;

drop policy if exists "olympiads_public_read" on public.olympiads;
create policy "olympiads_public_read"
  on public.olympiads for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "olympiads_admin_write" on public.olympiads;
create policy "olympiads_admin_write"
  on public.olympiads for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- olympiad_profiles: participant profiles for olympiads
-- ----------------------------------------------------------------------------
create table if not exists public.olympiad_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  olympiad_id     uuid not null references public.olympiads(id) on delete cascade,
  olympiad_year   int not null,
  category        text not null default 'general' check (category in ('general', '8-9', '10-11', 'university')),
  score           int not null default 0,
  rank            text not null default 'participant' check (rank in ('participant', 'winner', 'prize_winner', 'finalist')),
  diploma_url     text,
  certificate_url text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, olympiad_id)
);

create index if not exists olympiad_profiles_user_id_idx on public.olympiad_profiles(user_id);
create index if not exists olympiad_profiles_olympiad_id_idx on public.olympiad_profiles(olympiad_id);
create index if not exists olympiad_profiles_year_idx on public.olympiad_profiles(olympiad_year);

alter table public.olympiad_profiles enable row level security;

drop policy if exists "olympiad_profiles_select_own_or_admin" on public.olympiad_profiles;
create policy "olympiad_profiles_select_own_or_admin"
  on public.olympiad_profiles for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "olympiad_profiles_admin_write" on public.olympiad_profiles;
create policy "olympiad_profiles_admin_write"
  on public.olympiad_profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- trigger: auto-update updated_at on olympiads
-- ----------------------------------------------------------------------------
create or replace function public.touch_olympiads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists olympiads_touch on public.olympiads;
create trigger olympiads_touch
  before update on public.olympiads
  for each row execute function public.touch_olympiads_updated_at();

-- ----------------------------------------------------------------------------
-- trigger: auto-update updated_at on olympiad_profiles
-- ----------------------------------------------------------------------------
create or replace function public.touch_olympiad_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists olympiad_profiles_touch on public.olympiad_profiles;
create trigger olympiad_profiles_touch
  before update on public.olympiad_profiles
  for each row execute function public.touch_olympiad_profiles_updated_at();

-- ============================================================================
-- Seed data: sample olympiad events
-- ============================================================================

insert into public.olympiads (slug, title, profile_title, description, season, year, format, status, start_date, end_date, max_participants, is_published, rich_content, registration_open)
values
  (
    'olympiad-2025-2026',
    'Всероссийская олимпиада «Финатлон» 2025/2026',
    'Профиль участника 2025/2026',
    'Основная олимпиада для старшеклассников: отборочный онлайн-этап и очный финал.',
    '2025–2026',
    2026,
    'online', -- формат
    'published',
    '2025-09-01',
    '2026-04-30',
    1000,
    true,
    null,
    null -- регистрация по датам
  ),
  (
    'olympiad-2024-2025',
    'Всероссийская олимпиада «Финатлон» 2024/2025',
    'Профиль участника 2024/2025',
    'Прошлый сезон олимпиады с отборочным и очным турами.',
    '2024–2025',
    2025,
    'offline', -- формат
    'archived',
    '2024-09-01',
    '2025-04-30',
    1000,
    true,
    null,
    false -- принудительно закрыта, так как архив
  ),
  (
    'olympiad-2026-2027',
    'Всероссийская олимпиада «Финатлон» 2026/2027',
    'Профиль участника 2026/2027',
    'Будущий сезон олимпиады, открыт для регистрации.',
    '2026–2027',
    2027,
    'online', -- формат
    'draft',
    '2026-09-01',
    '2027-04-30',
    1000,
    false,
    null,
    null -- регистрация по датам
  )
on conflict (slug) do update set
  title       = excluded.title,
  profile_title = excluded.profile_title,
  description = excluded.description,
  season      = excluded.season,
  year        = excluded.year,
  format      = excluded.format,
  status      = excluded.status,
  start_date  = excluded.start_date,
  end_date    = excluded.end_date,
  max_participants = excluded.max_participants,
  is_published = excluded.is_published,
  rich_content = excluded.rich_content,
  registration_open = excluded.registration_open,
  updated_at  = now();