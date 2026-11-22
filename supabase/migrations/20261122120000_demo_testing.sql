create function public.demo_question_valid(q jsonb)
returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  kind text := q->>'kind';
  n integer;
  key_count integer;
begin
  if jsonb_typeof(q) is distinct from 'object'
    or coalesce(kind, '') not in ('single', 'multiple', 'matching', 'short', 'sequence')
    or jsonb_typeof(q->'prompt') is distinct from 'string'
    or jsonb_typeof(q->'explanation') is distinct from 'string'
    or length(btrim(q->>'prompt')) not between 1 and 10000
    or length(btrim(q->>'explanation')) not between 1 and 10000
    or jsonb_typeof(q->'points') is distinct from 'number'
    or coalesce(q->>'points', '') !~ '^(100|[1-9][0-9]?)$'
    or jsonb_typeof(q->'options') is distinct from 'array'
    or jsonb_typeof(q->'counterparts') is distinct from 'array'
    or jsonb_typeof(q->'solutions') is distinct from 'array'
  then return false; end if;

  n := jsonb_array_length(q->'options');
  key_count := jsonb_array_length(q->'solutions');
  if n > 6 or key_count > 12
    or exists (
      select 1 from jsonb_array_elements((q->'options') || (q->'counterparts') || (q->'solutions')) as e(value)
      where jsonb_typeof(e.value) <> 'string' or length(btrim(e.value #>> '{}')) not between 1 and 2000
    )
  then return false; end if;

  if kind = 'short' then
    return n = 0 and jsonb_array_length(q->'counterparts') = 0 and key_count >= 1;
  end if;

  if n < 2 or n <> (
    select count(distinct value) from jsonb_array_elements_text(q->'options')
  ) then return false; end if;

  if kind = 'matching' then
    return key_count = 0 and n = jsonb_array_length(q->'counterparts') and n = (
      select count(distinct value) from jsonb_array_elements_text(q->'counterparts')
    );
  end if;

  if jsonb_array_length(q->'counterparts') <> 0 then return false; end if;
  if kind = 'sequence' then return key_count = 0; end if;

  return (kind = 'single' and key_count = 1 or kind = 'multiple' and key_count between 2 and n)
    and key_count = (select count(distinct value) from jsonb_array_elements_text(q->'solutions'))
    and not exists (
      select 1 from jsonb_array_elements_text(q->'solutions') as s(value)
      where not (s.value = any(array(select i::text from generate_series(1, n) as i)))
    );
end;
$$;

create table public.demo_questions (
  profile text not null check (profile in ('finance', 'informatics')),
  grades text not null check (grades in ('6-7', '8-9', '10-11')),
  number integer not null check (number between 1 and 30),
  body jsonb not null check (public.demo_question_valid(body)),
  primary key (profile, grades, number)
);

create table public.demo_import_reports (
  profile text not null check (profile in ('finance', 'informatics')),
  grades text not null check (grades in ('6-7', '8-9', '10-11')),
  found integer not null check (found >= 0),
  uploaded integer not null check (uploaded between 0 and found),
  issues jsonb not null check (jsonb_typeof(issues) = 'array'),
  primary key (profile, grades)
);

create table public.demo_attempts (
  id uuid primary key default gen_random_uuid(),
  profile text not null,
  grades text not null,
  region text not null,
  city text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  snapshot jsonb,
  result jsonb,
  correct_count integer,
  question_count integer,
  score integer,
  max_score integer,
  incorrect_numbers integer[]
);

create index demo_attempts_completed_idx on public.demo_attempts (completed_at desc, id desc) where completed_at is not null;
create index demo_attempts_expiry_idx on public.demo_attempts (started_at) where completed_at is null;

alter table public.demo_questions enable row level security;
alter table public.demo_import_reports enable row level security;
alter table public.demo_attempts enable row level security;

revoke all on public.demo_questions, public.demo_import_reports, public.demo_attempts from public, anon, authenticated;
grant select, update (body) on public.demo_questions to authenticated;
grant select on public.demo_import_reports to authenticated;
grant select (id, profile, grades, region, city, completed_at, correct_count, question_count,
  score, max_score, incorrect_numbers) on public.demo_attempts to authenticated;

create policy demo_questions_read on public.demo_questions for select to authenticated
  using (public.is_admin((select auth.uid())));
create policy demo_questions_edit on public.demo_questions for update to authenticated
  using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));
create policy demo_import_reports_read on public.demo_import_reports for select to authenticated
  using (public.is_admin((select auth.uid())));
create policy demo_attempts_read on public.demo_attempts for select to authenticated
  using (completed_at is not null and public.is_admin((select auth.uid())));

create function public.demo_import(p_questions jsonb, p_reports jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Недостаточно прав для импорта.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) > 180
    or jsonb_typeof(p_reports) is distinct from 'array' or jsonb_array_length(p_reports) > 6
  then
    raise exception 'Неверный формат данных импорта.' using errcode = '22023';
  end if;

  insert into public.demo_questions (profile, grades, number, body)
  select profile, grades, number, body
  from jsonb_to_recordset(p_questions) as q(profile text, grades text, number integer, body jsonb)
  order by profile, grades, number
  on conflict (profile, grades, number) do update set body = excluded.body;

  insert into public.demo_import_reports (profile, grades, found, uploaded, issues)
  select r.profile, r.grades, r.found, r.uploaded, r.issues
  from jsonb_to_recordset(p_reports) as r(profile text, grades text, found integer, uploaded integer, issues jsonb)
  order by profile, grades
  on conflict (profile, grades) do update
  set found = excluded.found, uploaded = excluded.uploaded, issues = excluded.issues;
end;
$$;

create function public.demo_start(p_profile text, p_grades text, p_region text, p_city text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  questions jsonb;
  public_questions jsonb;
  attempt_id uuid;
begin
  if coalesce(p_profile, '') not in ('finance', 'informatics')
    or coalesce(p_grades, '') not in ('6-7', '8-9', '10-11')
    or length(btrim(coalesce(p_region, ''))) not between 1 and 120
    or length(btrim(coalesce(p_city, ''))) not between 1 and 120
  then
    raise exception 'Укажите профиль, класс, регион и город.' using errcode = '22023';
  end if;

  with prepared as materialized (
    select number, body, body->>'kind' as kind
    from public.demo_questions where profile = p_profile and grades = p_grades
  ), shuffled as (
    select p.*, s.options as shuffled_options, s.solution
    from prepared p
    left join lateral (
      select jsonb_agg(item order by position) as options,
             jsonb_agg(position::text order by original_position) as solution
      from (
        select item, original_position, row_number() over (order by random()) as position
        from jsonb_array_elements(
          case p.kind when 'matching' then p.body->'counterparts'
                      when 'sequence' then p.body->'options' else '[]'::jsonb end
        ) with ordinality as e(item, original_position)
      ) choices
    ) s on true
  ), snapshot as (
    select number, body || jsonb_build_object('number', number) ||
      case kind
        when 'matching' then jsonb_build_object('counterparts', shuffled_options, 'solutions', solution)
        when 'sequence' then jsonb_build_object('options', shuffled_options, 'solutions', solution)
        else '{}'::jsonb
      end as question
    from shuffled
  )
  select jsonb_agg(question order by number),
    jsonb_agg(jsonb_build_object(
      'number', number, 'kind', question->'kind', 'prompt', question->'prompt',
      'options', question->'options', 'counterparts', question->'counterparts', 'points', question->'points'
    ) order by number)
  into questions, public_questions
  from snapshot;

  if coalesce(jsonb_array_length(questions), 0) <> 30 then
    raise exception 'Тест для этой категории ещё не готов.' using errcode = 'P0001';
  end if;

  delete from public.demo_attempts where completed_at is null and started_at < now() - interval '24 hours';
  insert into public.demo_attempts (profile, grades, region, city, snapshot)
  values (p_profile, p_grades, btrim(p_region), btrim(p_city), questions)
  returning id into attempt_id;
  return jsonb_build_object('id', attempt_id, 'questions', public_questions);
end;
$$;

create function public.demo_normalize_short(value text)
returns text
language sql immutable strict
set search_path = ''
as $$
  select replace(
    replace(lower(btrim(value, ' ' || chr(9) || chr(10) || chr(13) || chr(160) || chr(8239))), 'ё', 'е'),
    ',', '.'
  );
$$;

create function public.demo_finish(p_attempt uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  attempt public.demo_attempts%rowtype;
  q jsonb;
  solution jsonb;
  answer jsonb;
  kind text;
  possible integer;
  position integer := 0;
  pts integer;
  correct boolean;
  total_correct integer := 0;
  earned integer := 0;
  total_points integer := 0;
  errors jsonb := '[]'::jsonb;
  wrong_numbers integer[] := '{}';
  finished jsonb;
begin
  select a.* into attempt from public.demo_attempts a where id = p_attempt for update;
  if not found or (attempt.completed_at is null and attempt.started_at < now() - interval '24 hours') then
    raise exception 'Попытка недоступна. Начните демо-тест заново.' using errcode = 'P0001';
  end if;
  if attempt.result is not null then return attempt.result; end if;

  if jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers) <> 30 then
    raise exception 'Ответьте на все 30 вопросов.' using errcode = '22023';
  end if;

  for q in select value from jsonb_array_elements(attempt.snapshot) loop
    answer := p_answers->position;
    position := position + 1;
    solution := q->'solutions';
    kind := q->>'kind';
    pts := (q->>'points')::integer;
    possible := jsonb_array_length(case when kind = 'matching' then q->'counterparts' else q->'options' end);

    if jsonb_typeof(answer) is distinct from 'array' or jsonb_array_length(answer) not between 1 and 6
      or exists (
        select 1 from jsonb_array_elements(answer) as a(value)
        where jsonb_typeof(a.value) <> 'string' or length(a.value #>> '{}') not between 1 and 2000
      )
      or (kind in ('single', 'short') and jsonb_array_length(answer) <> 1)
      or (kind in ('matching', 'sequence') and jsonb_array_length(answer) <> possible)
    then
      raise exception 'Проверьте ответ на вопрос №%.', position using errcode = '22023';
    end if;

    if kind = 'short' then
      if public.demo_normalize_short(answer->>0) = '' then
        raise exception 'Введите ответ на вопрос №%.', position using errcode = '22023';
      end if;
      select exists (
        select 1 from jsonb_array_elements_text(solution) as s(value)
        where public.demo_normalize_short(s.value) = public.demo_normalize_short(answer->>0)
      ) into correct;
    else
      if exists (
        select 1 from jsonb_array_elements_text(answer) as a(value)
        where not (a.value = any(array(select i::text from generate_series(1, possible) as i)))
      ) or jsonb_array_length(answer) <> (select count(distinct value) from jsonb_array_elements_text(answer)) then
        raise exception 'Проверьте ответ на вопрос №%.', position using errcode = '22023';
      end if;
      correct := case when kind = 'multiple' then answer @> solution and solution @> answer
                      else answer = solution end;
    end if;

    total_points := total_points + pts;
    if correct then
      total_correct := total_correct + 1;
      earned := earned + pts;
    else
      wrong_numbers := array_append(wrong_numbers, position);
      errors := errors || jsonb_build_array(q || jsonb_build_object('answer', answer));
    end if;
  end loop;

  finished := jsonb_build_object(
    'correctCount', total_correct, 'questionCount', position, 'score', earned,
    'maxScore', total_points, 'mistakes', errors
  );
  update public.demo_attempts set completed_at = now(), snapshot = null, result = finished,
    correct_count = total_correct, question_count = position, score = earned,
    max_score = total_points, incorrect_numbers = wrong_numbers
  where id = attempt.id;
  return finished;
end;
$$;

revoke execute on function public.demo_import(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.demo_start(text, text, text, text) from public, anon, authenticated;
revoke execute on function public.demo_finish(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.demo_import(jsonb, jsonb) to authenticated;
grant execute on function public.demo_start(text, text, text, text) to anon, authenticated;
grant execute on function public.demo_finish(uuid, jsonb) to anon, authenticated;
