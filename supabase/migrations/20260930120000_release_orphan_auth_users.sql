-- Deleting a row in public.profiles does not remove auth.users: the foreign key
-- cascades the other way. Sign-up then keeps failing with "user already
-- registered". The same happens for Auth users that were only soft-deleted
-- and still hold the original email.
--
-- release_orphan_auth_email removes such leftovers so the address can be used
-- again. A live account (profile exists and the user is not soft-deleted) is
-- left untouched.

create or replace function public.release_orphan_auth_email(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_id uuid;
  v_has_profile boolean;
  v_soft_deleted boolean := false;
  v_has_deleted_at boolean;
begin
  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or position('@' in v_email) = 0 then
    return false;
  end if;

  select u.id
    into v_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_id is null then
    return false;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'deleted_at'
  ) into v_has_deleted_at;

  if v_has_deleted_at then
    execute
      'select coalesce(deleted_at is not null, false) from auth.users where id = $1'
      into v_soft_deleted
      using v_id;
    v_soft_deleted := coalesce(v_soft_deleted, false);
  end if;

  select exists (
    select 1 from public.profiles p where p.id = v_id
  ) into v_has_profile;

  if not v_soft_deleted and v_has_profile then
    return false;
  end if;

  delete from auth.users where id = v_id;
  return true;
end;
$$;

revoke all on function public.release_orphan_auth_email(text) from public;
grant execute on function public.release_orphan_auth_email(text) to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'deleted_at'
  ) then
    execute 'delete from auth.users where deleted_at is not null';
  end if;
end
$$;

delete from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
