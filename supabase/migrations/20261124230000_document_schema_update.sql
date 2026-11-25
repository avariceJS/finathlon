create table public.document_sections (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.document_sections(id) on delete restrict,
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index document_sections_parent_idx on public.document_sections(parent_id);
alter table public.documents
  add column section_id uuid references public.document_sections(id) on delete restrict,
  add column file_name text,
  add column file_path text check (file_path ~ '^[a-f0-9-]{36}\.(pdf|docx)$'),
  add column source text check (source in ('olympiad', 'rsosh'));
create index documents_section_idx on public.documents(section_id);
create unique index documents_file_path_idx on public.documents(file_path) where file_path is not null;

create function public.validate_document_section()
returns trigger language plpgsql set search_path = '' as $$
declare
  cursor_id uuid := new.parent_id;
  ancestor_depth integer := 0;
  descendant_depth integer := 0;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    if new.parent_id is not distinct from old.parent_id then
      return new;
    end if;
  end if;
  perform pg_advisory_xact_lock(53197794675371023);
  while cursor_id is not null loop
    ancestor_depth := ancestor_depth + 1;
    if cursor_id = new.id or ancestor_depth >= 3 then
      raise exception 'В разделе допустимо до трёх уровней без циклов.' using errcode = '23514';
    end if;
    select s.parent_id into cursor_id from public.document_sections s where s.id = cursor_id;
  end loop;
  if tg_op = 'UPDATE' then
    with recursive descendants(id, depth) as (
      select s.id, 1 from public.document_sections s where s.parent_id = new.id
      union all
      select s.id, d.depth + 1
      from public.document_sections s join descendants d on s.parent_id = d.id
      where d.depth < 3
    )
    select coalesce(max(depth), 0) into descendant_depth from descendants;
  end if;
  if ancestor_depth + 1 + descendant_depth > 3 then
    raise exception 'Перенос создаёт больше трёх уровней разделов.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger document_sections_validate
  before insert or update on public.document_sections
  for each row execute function public.validate_document_section();

create function public.document_section_is_public(section uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  with recursive ancestors as (
    select id, parent_id, is_published, 1 as depth
    from public.document_sections where id = section
    union all
    select s.id, s.parent_id, s.is_published, a.depth + 1
    from public.document_sections s join ancestors a on s.id = a.parent_id
    where a.depth < 3
  )
  select coalesce(bool_and(is_published) and bool_or(parent_id is null), false)
  from ancestors;
$$;
revoke all on function public.document_section_is_public(uuid) from public, anon, authenticated;
grant execute on function public.document_section_is_public(uuid) to anon, authenticated;

alter table public.document_sections enable row level security;
revoke all on public.document_sections from public, anon, authenticated;
grant select on public.document_sections to anon, authenticated;
grant insert, update, delete on public.document_sections to authenticated;

create policy document_sections_public_read on public.document_sections for select
  using (public.document_section_is_public(id) or public.is_admin((select auth.uid())));
create policy document_sections_admin_write on public.document_sections for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy documents_public_read on public.documents;
create policy documents_public_read on public.documents for select
  using (
    (is_published and (section_id is null or public.document_section_is_public(section_id)))
    or public.is_admin((select auth.uid()))
  );

-- Store staff uploads privately. A visitor can sign a short-lived download URL
-- only for an object attached to a published document in a visible section.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 15728640, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

create policy finathlon_documents_download on storage.objects for select to anon, authenticated
  using (bucket_id = 'documents' and (
    public.is_admin((select auth.uid())) or exists (
      select 1 from public.documents d
      where d.file_path = storage.objects.name and d.is_published
        and (d.section_id is null or public.document_section_is_public(d.section_id))
    )
  ));

create policy finathlon_documents_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_admin((select auth.uid())));
create policy finathlon_documents_remove on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_admin((select auth.uid())));
