-- ============================================================================
-- Finathlon: Document Sections & File Upload (Full Setup)
-- ============================================================================

-- 1. Создаем таблицу разделов (если её еще нет)
create table if not exists public.document_sections (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references public.document_sections(id) on delete cascade,
  title        text not null,
  slug         text not null unique,
  sort_order   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists document_sections_parent_idx on public.document_sections(parent_id);
create index if not exists document_sections_sort_idx on public.document_sections(sort_order);

-- 2. Добавляем связь с документами и поле для имени файла
alter table public.documents 
add column if not exists section_id uuid references public.document_sections(id) on delete set null;

alter table public.documents 
add column if not exists file_name text;

-- Добавляем поле для источника документа
alter table public.documents 
add column if not exists source text check (source in ('olympiad', 'rsosh'));

-- 3. Включаем безопасность (RLS) для разделов
alter table public.document_sections enable row level security;

drop policy if exists "sections_public_read" on public.document_sections;
create policy "sections_public_read"
  on public.document_sections for select
  using (is_published or public.is_admin(auth.uid()));

drop policy if exists "sections_admin_write" on public.document_sections;
create policy "sections_admin_write"
  on public.document_sections for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 4. Триггер для автообновления updated_at
create or replace function public.touch_document_sections_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sections_touch on public.document_sections;
create trigger sections_touch
  before update on public.document_sections
  for each row execute function public.touch_document_sections_updated_at();

-- 5. Выдаем права на таблицу разделов
grant select on public.document_sections to anon, authenticated;
grant insert, update, delete on public.document_sections to authenticated;
