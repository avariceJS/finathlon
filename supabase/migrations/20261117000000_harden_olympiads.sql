-- Additive upgrade for databases with the original stage-based schema.
-- Do not replay the destructive initial-schema migration on an existing database.

alter table public.olympiads add column if not exists format text;
alter table public.olympiads add column if not exists registration_open boolean;

do $$
begin
  if exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'olympiads' and column_name = 'stage') then
    update public.olympiads
    set format = case when stage = 'final' then 'offline' else 'online' end
    where format is null;
  else
    update public.olympiads set format = 'online' where format is null;
  end if;
end;
$$;

alter table public.olympiads alter column format set default 'online';
alter table public.olympiads alter column format set not null;
alter table public.olympiads alter column is_published set default false;

-- NOT VALID preserves existing records; all new/updated rows must satisfy checks.
-- Validate separately after reviewing any historical invalid records.
alter table public.olympiads add constraint olympiads_format_valid
  check (format in ('online', 'offline')) not valid;
alter table public.olympiads add constraint olympiads_dates_valid
  check (end_date is null or start_date is null or end_date >= start_date) not valid;
alter table public.olympiads add constraint olympiads_capacity_valid
  check (max_participants is null or max_participants > 0) not valid;
alter table public.olympiads add constraint olympiads_title_valid
  check (length(trim(title)) > 0) not valid;
alter table public.olympiad_profiles add constraint olympiad_profiles_score_valid
  check (score >= 0) not valid;

-- Published status and visibility must agree in the API as well as the UI.
drop policy if exists "olympiads_public_read" on public.olympiads;
create policy "olympiads_public_read" on public.olympiads for select
  using ((is_published and status = 'published') or public.is_admin(auth.uid()));

-- Existing profiles RLS permits own-row writes. Protect the role column itself.
-- SECURITY INVOKER retains the caller identity, including trusted server/SQL roles.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.role is not distinct from old.role then return new; end if;
  elsif new.role = 'user' then
    return new;
  end if;

  if current_user in ('postgres', 'service_role', 'supabase_admin')
    or public.is_admin(auth.uid()) then
    return new;
  end if;

  raise exception 'Only administrators can assign roles' using errcode = '42501';
end;
$$;

create trigger profiles_protect_role
  before insert or update of role on public.profiles
  for each row execute function public.protect_profile_role();

-- Be explicit even on projects without Supabase's default table privileges.
grant select on public.olympiads to anon, authenticated;
grant insert, update, delete on public.olympiads to authenticated;
grant select, insert, update, delete on public.olympiad_profiles to authenticated;
