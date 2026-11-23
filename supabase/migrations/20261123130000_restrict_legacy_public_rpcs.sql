-- Account recovery must not delete Auth users based on a public email lookup.
-- Preserve the return contract for previously deployed clients.
create or replace function public.release_orphan_auth_email(p_email text)
returns boolean
language sql
set search_path = ''
as $$
  select false;
$$;

-- The bank import performs an explicit administrator check. Keep its
-- executable surface limited to authenticated sessions.
revoke execute on function public.upsert_question_bank(uuid, text, jsonb, boolean)
  from public, anon;
grant execute on function public.upsert_question_bank(uuid, text, jsonb, boolean)
  to authenticated;
