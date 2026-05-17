alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.resolve_auth_email(p_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_trimmed text;
  v_email text;
begin
  v_trimmed := trim(p_identifier);
  if v_trimmed is null or v_trimmed = '' then
    return null;
  end if;
  if position('@' in v_trimmed) > 0 then
    return lower(v_trimmed);
  end if;
  select u.email into v_email
  from auth.users u
  inner join public.profiles p on p.id = u.id
  where lower(p.username) = lower(v_trimmed)
  limit 1;
  return v_email;
end;
$$;

revoke all on function public.resolve_auth_email(text) from public;
grant execute on function public.resolve_auth_email(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_first text;
  meta_last text;
  meta_username text;
begin
  meta_first := nullif(new.raw_user_meta_data->>'first_name', '');
  meta_last := nullif(new.raw_user_meta_data->>'last_name', '');
  meta_username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  insert into public.profiles (id, email, first_name, last_name, username)
  values (new.id, new.email, meta_first, meta_last, meta_username)
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  execute function public.sync_profile_email_from_auth();

create or replace function public.touch_profile_completeness()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.is_complete := (
    nullif(new.first_name, '') is not null and
    nullif(new.last_name, '')  is not null and
    nullif(new.city, '')       is not null and
    nullif(new.phone, '')      is not null and
    new.birth_date is not null and
    (
      new.username is null
      or (
        new.email is not null
        and lower(new.email) not like '%@login.finathlon'
      )
    )
  );
  return new;
end;
$$;
