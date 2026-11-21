-- Таблица банков вопросов 
create table if not exists public.question_banks (
  id              uuid primary key default gen_random_uuid(),
  olympiad_id     uuid not null references public.olympiads(id) on delete restrict,
  grade_category  text not null check (grade_category in ('6-7', '8-9', '10-11')),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (olympiad_id, grade_category)
);

create index if not exists question_banks_olympiad_id_idx on public.question_banks(olympiad_id);

-- Таблица заданий внутри банка
create table if not exists public.question_bank_tasks (
  id              uuid primary key default gen_random_uuid(),
  bank_id         uuid not null references public.question_banks(id) on delete cascade,
  task_number     int not null check (task_number > 0),
  question_type   text not null check (
    question_type in ('single_choice', 'multiple_choice', 'matching', 'short_answer', 'sequence')
  ),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (bank_id, task_number)
);

create index if not exists question_bank_tasks_bank_id_idx on public.question_bank_tasks(bank_id);

-- Таблица вариантов вопросов внутри задания
create table if not exists public.question_bank_variants (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid not null references public.question_bank_tasks(id) on delete cascade,
  bank_id          uuid not null references public.question_banks(id) on delete cascade,
  row_number       int not null check (row_number > 0),
  question_text    text not null check (length(trim(question_text)) > 0),
  options          jsonb not null default '[]'::jsonb,
  correct_answer   jsonb not null,
  points           numeric(6, 2) not null check (points > 0),
  current_version  int not null default 1 check (current_version > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (bank_id, row_number)
);

create index if not exists question_bank_variants_task_id_idx on public.question_bank_variants(task_id);
create index if not exists question_bank_variants_bank_id_idx on public.question_bank_variants(bank_id);

-- Таблица снимков версий вопросов
create table if not exists public.question_variant_versions (
  id               uuid primary key default gen_random_uuid(),
  variant_id       uuid not null references public.question_bank_variants(id) on delete cascade,
  version_number   int not null check (version_number > 0),
  question_text    text not null,
  options          jsonb not null,
  correct_answer   jsonb not null,
  points           numeric(6, 2) not null,
  changed_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (variant_id, version_number)
);

create index if not exists question_variant_versions_variant_id_idx on public.question_variant_versions(variant_id);

-- Таблица истории изменений
create table if not exists public.question_variant_history (
  id               uuid primary key default gen_random_uuid(),
  variant_id       uuid not null references public.question_bank_variants(id) on delete cascade,
  bank_id          uuid not null references public.question_banks(id) on delete cascade,
  version_from     int not null,
  version_to       int not null,
  changed_by       uuid references auth.users(id) on delete set null,
  changes          jsonb not null,
  created_at       timestamptz not null default now()
);

create index if not exists question_variant_history_variant_id_idx on public.question_variant_history(variant_id);
create index if not exists question_variant_history_bank_id_idx on public.question_variant_history(bank_id);

-- Задел под прохождение теста 
create table if not exists public.olympiad_attempts (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null references public.olympiad_profiles(id) on delete cascade,
  bank_id          uuid not null references public.question_banks(id) on delete restrict,
  status           text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'graded')),
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz,
  total_score      numeric(8, 2) not null default 0
);

create table if not exists public.olympiad_attempt_questions (
  id               uuid primary key default gen_random_uuid(),
  attempt_id       uuid not null references public.olympiad_attempts(id) on delete cascade,
  task_number      int not null,
  variant_id       uuid not null references public.question_bank_variants(id) on delete restrict,
  version_id       uuid not null references public.question_variant_versions(id) on delete restrict,
  user_answer      jsonb,
  awarded_points   numeric(6, 2) not null default 0,
  unique (attempt_id, task_number)
);
-- Триггеры: автообновление updated_at, версионирование, запись истории правок
create or replace function public.touch_updated_at_generic()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists question_banks_touch on public.question_banks;
create trigger question_banks_touch
  before update on public.question_banks
  for each row execute function public.touch_updated_at_generic();

drop trigger if exists question_bank_tasks_touch on public.question_bank_tasks;
create trigger question_bank_tasks_touch
  before update on public.question_bank_tasks
  for each row execute function public.touch_updated_at_generic();

create or replace function public.handle_variant_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.question_variant_versions (
    variant_id, version_number, question_text, options, correct_answer, points, changed_by
  ) values (
    new.id, 1, new.question_text, new.options, new.correct_answer, new.points, auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists question_bank_variants_after_insert on public.question_bank_variants;
create trigger question_bank_variants_after_insert
  after insert on public.question_bank_variants
  for each row execute function public.handle_variant_insert();

create or replace function public.handle_variant_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changes jsonb := '{}'::jsonb;
  v_new_version int;
begin
  if new.question_text is not distinct from old.question_text
     and new.options is not distinct from old.options
     and new.correct_answer is not distinct from old.correct_answer
     and new.points is not distinct from old.points then
    return new;
  end if;

  if new.question_text is distinct from old.question_text then
    v_changes := v_changes || jsonb_build_object(
      'question_text', jsonb_build_object('old', old.question_text, 'new', new.question_text)
    );
  end if;

  if new.options is distinct from old.options then
    v_changes := v_changes || jsonb_build_object(
      'options', jsonb_build_object('old', old.options, 'new', new.options)
    );
  end if;

  if new.correct_answer is distinct from old.correct_answer then
    v_changes := v_changes || jsonb_build_object(
      'correct_answer', jsonb_build_object('old', old.correct_answer, 'new', new.correct_answer)
    );
  end if;

  if new.points is distinct from old.points then
    v_changes := v_changes || jsonb_build_object(
      'points', jsonb_build_object('old', old.points, 'new', new.points)
    );
  end if;

  v_new_version := old.current_version + 1;
  new.current_version := v_new_version;
  new.updated_at := now();

  insert into public.question_variant_versions (
    variant_id, version_number, question_text, options, correct_answer, points, changed_by
  ) values (
    new.id, v_new_version, new.question_text, new.options, new.correct_answer, new.points, auth.uid()
  );

  insert into public.question_variant_history (
    variant_id, bank_id, version_from, version_to, changed_by, changes
  ) values (
    new.id, new.bank_id, old.current_version, v_new_version, auth.uid(), v_changes
  );

  return new;
end;
$$;

drop trigger if exists question_bank_variants_before_update on public.question_bank_variants;
create trigger question_bank_variants_before_update
  before update on public.question_bank_variants
  for each row execute function public.handle_variant_update();

-- безопасное создание или замена банка при повторном импорте
create or replace function public.upsert_question_bank(
  p_olympiad_id uuid,
  p_grade_category text,
  p_tasks jsonb,
  p_replace_existing boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bank_id uuid;
  v_task jsonb;
  v_variant jsonb;
  v_task_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Только администратор может управлять наборами вопросов' using errcode = '42501';
  end if;

  if p_tasks is null or jsonb_typeof(p_tasks) <> 'array' or jsonb_array_length(p_tasks) = 0 then
    raise exception 'Набор должен содержать хотя бы одно задание' using errcode = '22023';
  end if;

  select id into v_bank_id
  from public.question_banks
  where olympiad_id = p_olympiad_id and grade_category = p_grade_category;

  if v_bank_id is not null then
    if not p_replace_existing then
      raise exception 'BANK_ALREADY_EXISTS' using detail = v_bank_id::text, errcode = 'P0001';
    end if;

    delete from public.question_bank_tasks where bank_id = v_bank_id;

    update public.question_banks
    set updated_at = now()
    where id = v_bank_id;
  else
    insert into public.question_banks (olympiad_id, grade_category, created_by)
    values (p_olympiad_id, p_grade_category, auth.uid())
    returning id into v_bank_id;
  end if;

  for v_task in select * from jsonb_array_elements(p_tasks)
  loop
    insert into public.question_bank_tasks (bank_id, task_number, question_type)
    values (
      v_bank_id,
      (v_task->>'taskNumber')::int,
      v_task->>'questionType'
    )
    returning id into v_task_id;

    for v_variant in select * from jsonb_array_elements(v_task->'variants')
    loop
      insert into public.question_bank_variants (
        task_id, bank_id, row_number, question_text, options, correct_answer, points
      ) values (
        v_task_id,
        v_bank_id,
        (v_variant->>'rowNumber')::int,
        v_variant->>'questionText',
        coalesce(v_variant->'options', '[]'::jsonb),
        coalesce(v_variant->'correctAnswer', 'null'::jsonb),
        (v_variant->>'points')::numeric
      );
    end loop;
  end loop;

  return v_bank_id;
end;
$$;

-- RLS и права доступа администраторов
alter table public.question_banks enable row level security;
alter table public.question_bank_tasks enable row level security;
alter table public.question_bank_variants enable row level security;
alter table public.question_variant_versions enable row level security;
alter table public.question_variant_history enable row level security;
alter table public.olympiad_attempts enable row level security;
alter table public.olympiad_attempt_questions enable row level security;

create policy "question_banks_admin_all" on public.question_banks
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "question_bank_tasks_admin_all" on public.question_bank_tasks
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "question_bank_variants_admin_all" on public.question_bank_variants
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "question_variant_versions_admin_select" on public.question_variant_versions
  for select using (public.is_admin(auth.uid()));

create policy "question_variant_history_admin_select" on public.question_variant_history
  for select using (public.is_admin(auth.uid()));

create policy "olympiad_attempts_admin_all" on public.olympiad_attempts
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "olympiad_attempt_questions_admin_all" on public.olympiad_attempt_questions
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

grant select, insert, update, delete on public.question_banks to authenticated;
grant select, insert, update, delete on public.question_bank_tasks to authenticated;
grant select, insert, update, delete on public.question_bank_variants to authenticated;
grant select on public.question_variant_versions to authenticated;
grant select on public.question_variant_history to authenticated;
grant select, insert, update, delete on public.olympiad_attempts to authenticated;
grant select, insert, update, delete on public.olympiad_attempt_questions to authenticated;
grant execute on function public.upsert_question_bank(uuid, text, jsonb, boolean) to authenticated;
