-- ============================================================================
-- Регистрация на отборочное тестирование по профилю олимпиады
-- ============================================================================
--   * profiles                — новые поля полной регистрационной анкеты.
--   * olympiad_registrations  — регистрация участника на профиль
--                               (одна строка на пару «кабинет + профиль»).
--   * register_for_olympiad_profile()  — сохраняет анкету и создаёт регистрацию.
-- Миграция идемпотентна.
-- ============================================================================

-- Открыт ли профиль для регистрации и тестирования прямо сейчас.
create or replace function public.olympiad_profile_is_open(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.olympiads op
    where op.id = p_profile_id
      and op.status = 'published'
      and op.is_published
      and coalesce(
        op.registration_open,
        (op.start_date is null or op.start_date <= (now() at time zone 'Europe/Moscow')::date)
        and (op.end_date is null or op.end_date >= (now() at time zone 'Europe/Moscow')::date)
      )
  );
$$;

revoke all on function public.olympiad_profile_is_open(uuid) from public;
grant execute on function public.olympiad_profile_is_open(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- profiles: поля полной регистрационной анкеты
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists federal_district  text,
  add column if not exists region            text,
  add column if not exists postal_code       text,
  add column if not exists locality_type     text,
  add column if not exists address           text,
  add column if not exists is_rural          boolean,
  add column if not exists school_address    text,
  add column if not exists school_phone      text,
  add column if not exists school_email      text,
  add column if not exists is_orphan         boolean,
  add column if not exists has_disability    boolean,
  add column if not exists motivation        text,
  add column if not exists finance_interest  text,
  add column if not exists info_source       text,
  add column if not exists parent_full_name  text,
  add column if not exists parent_email      text,
  add column if not exists parent_phone      text,
  add column if not exists organizations     text,
  add column if not exists teacher_full_name text,
  add column if not exists teacher_phone     text,
  add column if not exists teacher_email     text;

-- ----------------------------------------------------------------------------
-- olympiad_registrations
-- ----------------------------------------------------------------------------
create table if not exists public.olympiad_registrations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  profile_id  uuid not null references public.olympiads(id) on delete restrict,
  email       text not null,
  last_name   text not null,
  first_name  text not null,
  middle_name text,
  -- Анкета в том виде, в каком она была отправлена при регистрации.
  form_data   jsonb not null default '{}'::jsonb,
  status      text not null default 'registered',
  created_at  timestamptz not null default now(),
  constraint olympiad_registrations_user_profile_key unique (user_id, profile_id)
);

create unique index if not exists olympiad_registrations_profile_email_idx
  on public.olympiad_registrations (profile_id, lower(email));

create index if not exists olympiad_registrations_user_idx
  on public.olympiad_registrations (user_id);

alter table public.olympiad_registrations enable row level security;
revoke all on public.olympiad_registrations from public, anon, authenticated;
grant select on public.olympiad_registrations to authenticated;

-- Запись создаётся только функцией register_for_olympiad_profile.
drop policy if exists "olympiad_registrations_select_own_or_admin" on public.olympiad_registrations;
create policy "olympiad_registrations_select_own_or_admin"
  on public.olympiad_registrations for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "olympiad_registrations_admin_write" on public.olympiad_registrations;
create policy "olympiad_registrations_admin_write"
  on public.olympiad_registrations for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- Регистрация на профиль: анкета -> profiles, запись -> olympiad_registrations
-- ----------------------------------------------------------------------------
create or replace function public.register_for_olympiad_profile(
  p_profile_id uuid,
  p_form       jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text;
  v_last   text := nullif(trim(p_form->>'last_name'), '');
  v_first  text := nullif(trim(p_form->>'first_name'), '');
  v_middle text := nullif(trim(p_form->>'middle_name'), '');
  v_id     uuid;
  v_birth_date date;
  v_form jsonb;
  v_text_fields constant text[] := array[
    'last_name', 'first_name', 'middle_name', 'birth_date', 'country',
    'federal_district', 'region', 'postal_code', 'locality_type', 'city',
    'address', 'phone', 'class_course', 'school', 'school_address',
    'school_phone', 'school_email', 'motivation', 'finance_interest', 'info_source',
    'parent_full_name', 'parent_email', 'parent_phone', 'organizations',
    'teacher_full_name', 'teacher_phone', 'teacher_email'
  ];
  v_bool_fields constant text[] := array['is_rural', 'is_orphan', 'has_disability'];
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if jsonb_typeof(p_form) is distinct from 'object'
    or octet_length(p_form::text) > 65536
    or exists (
      select 1 from unnest(v_text_fields) as f(key)
      where jsonb_typeof(p_form->f.key) is distinct from 'string'
        or length(btrim(p_form->>f.key)) not between 1 and 4000
    )
    or exists (
      select 1 from unnest(v_bool_fields) as f(key)
      where jsonb_typeof(p_form->f.key) is distinct from 'boolean'
    )
    or (p_form->>'postal_code') !~ '^[0-9]{6}$'
    or (p_form->>'class_course') not in ('6-7', '8', '9', '10', '11')
    or (p_form->>'birth_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  then
    raise exception 'form_incomplete' using errcode = '22023';
  end if;

  begin
    v_birth_date := (p_form->>'birth_date')::date;
  exception when invalid_datetime_format or datetime_field_overflow then
    raise exception 'form_incomplete' using errcode = '22023';
  end;
  if v_birth_date < date '1950-01-01'
    or v_birth_date > (now() at time zone 'Europe/Moscow')::date
  then
    raise exception 'form_incomplete' using errcode = '22023';
  end if;

  select jsonb_object_agg(f.key, p_form->f.key)
  into v_form
  from unnest(v_text_fields || v_bool_fields) as f(key);

  if not public.olympiad_profile_is_open(p_profile_id) then
    raise exception 'profile_closed';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  if v_email is null then
    raise exception 'not_authenticated';
  end if;

  if exists (
    select 1
    from public.olympiad_registrations r
    where r.profile_id = p_profile_id
      and (r.user_id = v_uid or lower(r.email) = v_email)
  ) then
    raise exception 'already_registered';
  end if;

  insert into public.profiles (id, email)
  values (v_uid, v_email)
  on conflict (id) do nothing;

  update public.profiles set
    last_name         = v_last,
    first_name        = v_first,
    middle_name       = v_middle,
    birth_date        = v_birth_date,
    country           = nullif(trim(p_form->>'country'), ''),
    federal_district  = nullif(trim(p_form->>'federal_district'), ''),
    region            = nullif(trim(p_form->>'region'), ''),
    postal_code       = nullif(trim(p_form->>'postal_code'), ''),
    locality_type     = nullif(trim(p_form->>'locality_type'), ''),
    city              = nullif(trim(p_form->>'city'), ''),
    address           = nullif(trim(p_form->>'address'), ''),
    is_rural          = (p_form->>'is_rural')::boolean,
    phone             = nullif(trim(p_form->>'phone'), ''),
    class_course      = nullif(trim(p_form->>'class_course'), ''),
    school            = nullif(trim(p_form->>'school'), ''),
    school_address    = nullif(trim(p_form->>'school_address'), ''),
    school_phone      = nullif(trim(p_form->>'school_phone'), ''),
    school_email      = nullif(trim(p_form->>'school_email'), ''),
    is_orphan         = (p_form->>'is_orphan')::boolean,
    has_disability    = (p_form->>'has_disability')::boolean,
    motivation        = nullif(trim(p_form->>'motivation'), ''),
    finance_interest  = nullif(trim(p_form->>'finance_interest'), ''),
    info_source       = nullif(trim(p_form->>'info_source'), ''),
    parent_full_name  = nullif(trim(p_form->>'parent_full_name'), ''),
    parent_email      = nullif(trim(p_form->>'parent_email'), ''),
    parent_phone      = nullif(trim(p_form->>'parent_phone'), ''),
    organizations     = nullif(trim(p_form->>'organizations'), ''),
    teacher_full_name = nullif(trim(p_form->>'teacher_full_name'), ''),
    teacher_phone     = nullif(trim(p_form->>'teacher_phone'), ''),
    teacher_email     = nullif(trim(p_form->>'teacher_email'), '')
  where id = v_uid;

  begin
    insert into public.olympiad_registrations (
      user_id, profile_id, email, last_name, first_name, middle_name, form_data
    )
    values (
      v_uid, p_profile_id, v_email, v_last, v_first, v_middle, v_form
    )
    returning id into v_id;
  exception when unique_violation then
    raise exception 'already_registered';
  end;

  return v_id;
end;
$$;

revoke all on function public.register_for_olympiad_profile(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.register_for_olympiad_profile(uuid, jsonb) to authenticated;
