import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const migration = (name) =>
  readFile(
    new URL(`../../supabase/migrations/${name}.sql`, import.meta.url),
    'utf8',
  )
const userId = '11111111-1111-4111-8111-111111111111'
const otherId = '22222222-2222-4222-8222-222222222222'
const adminId = '33333333-3333-4333-8333-333333333333'
const eventId = '44444444-4444-4444-8444-444444444444'

async function asRole(db, role, uid, query, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`)
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
      uid ?? '',
    ])
    return tx.query(query, params)
  })
}

test('demo import, scoring and repeated attempts use the saved question snapshot and admin permissions', async () => {
  const db = new PGlite()
  const admin = (query, params) =>
    asRole(db, 'authenticated', adminId, query, params)
  const visitor = (query, params) => asRole(db, 'anon', null, query, params)
  const importSql = 'select public.demo_import($1::jsonb, $2::jsonb)'
  const startSql =
    "select demo_start('finance','6-7','Москва','Москва') as session"
  const finishSql = 'select demo_finish($1, $2::jsonb) as result'
  const report = [
    { profile: 'finance', grades: '6-7', found: 30, uploaded: 30, issues: [] },
  ]
  const templates = [
    { kind: 'single', options: ['Первый', 'Второй'], solutions: ['2'] },
    {
      kind: 'multiple',
      options: ['Первый', 'Второй', 'Третий'],
      solutions: ['1', '3'],
    },
    {
      kind: 'matching',
      options: ['А', 'Б', 'В'],
      counterparts: ['Икс', 'Игрек', 'Зет'],
      solutions: [],
    },
    {
      kind: 'short',
      options: [],
      solutions: ['Счёт 1,5', 'допустимый ответ'],
    },
    { kind: 'sequence', options: ['Шаг А', 'Шаг Б', 'Шаг В'], solutions: [] },
  ]
  const rows = Array.from({ length: 30 }, (_, index) => ({
    profile: 'finance',
    grades: '6-7',
    number: index + 1,
    body: {
      prompt: `Вопрос ${index + 1}`,
      explanation: 'Пояснение',
      counterparts: [],
      points: 2,
      ...templates[index % 5],
    },
  }))
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
    `)
    await db.exec(
      (await migration('20260514000000_init_schema')).replace(
        'create extension if not exists pgcrypto;',
        '',
      ),
    )
    await db.exec(await migration('20261109130000_olympiads_and_profiles'))
    await db.exec(await migration('20261117000000_harden_olympiads'))
    await db.exec(await migration('20261121000000_question_banks'))
    await db.exec(await migration('20261122120000_demo_testing'))
    await db.query('insert into auth.users (id) values ($1), ($2)', [
      adminId,
      userId,
    ])
    await db.query("update profiles set role='admin' where id=$1", [adminId])

    await assert.rejects(visitor(startSql), /ещё не готов/)
    await assert.rejects(
      asRole(db, 'authenticated', userId, importSql, [
        JSON.stringify(rows),
        JSON.stringify(report),
      ]),
      /Недостаточно прав/,
    )
    await assert.rejects(
      admin(importSql, [
        JSON.stringify([
          ...rows.slice(0, 29),
          { ...rows[29], body: { ...rows[29].body, points: 0 } },
        ]),
        JSON.stringify(report),
      ]),
      /check constraint/,
    )
    assert.equal((await admin('select * from demo_questions')).rows.length, 0)
    await admin(importSql, [JSON.stringify(rows), JSON.stringify(report)])
    await assert.rejects(
      visitor('select body from demo_questions'),
      /permission denied/,
    )
    assert.equal(
      (
        await asRole(
          db,
          'authenticated',
          userId,
          'select body from demo_questions',
        )
      ).rows.length,
      0,
    )
    assert.equal(
      (await admin('select * from demo_import_reports')).rows[0].uploaded,
      30,
    )

    const {
      rows: [{ session }],
    } = await visitor(startSql)
    assert.equal(session.questions.length, 30)
    const answers = session.questions.map((question, index) => {
      assert.equal(question.number, index + 1)
      assert.equal('solutions' in question || 'explanation' in question, false)
      const body = rows[index].body
      switch (body.kind) {
        case 'short':
          return ['  СЧЕТ 1.5  ']
        case 'multiple':
          return [...body.solutions].reverse()
        case 'matching':
          return body.counterparts.map((value) =>
            String(question.counterparts.indexOf(value) + 1),
          )
        case 'sequence':
          return body.options.map((value) =>
            String(question.options.indexOf(value) + 1),
          )
        default:
          return body.solutions
      }
    })
    await assert.rejects(
      visitor(finishSql, [session.id, JSON.stringify(answers.slice(0, 29))]),
      /все 30/,
    )
    const incomplete = [...answers]
    incomplete[2] = ['1', '1', '3']
    await assert.rejects(
      visitor(finishSql, [session.id, JSON.stringify(incomplete)]),
      /вопрос №3/,
    )

    const edited = {
      ...rows[0].body,
      points: 5,
      solutions: ['1'],
      prompt: 'Новый текст',
    }
    await admin(
      "update demo_questions set body=$1 where profile='finance' and grades='6-7' and number=1",
      [JSON.stringify(edited)],
    )
    answers[1] = ['1']
    const {
      rows: [{ result }],
    } = await visitor(finishSql, [session.id, JSON.stringify(answers)])
    assert.equal(result.correctCount, 29)
    assert.equal(result.score, 58)
    assert.equal(result.maxScore, 60)
    assert.equal(result.mistakes[0].number, 2)
    assert.deepEqual(result.mistakes[0].solutions, ['1', '3'])
    assert.equal(result.mistakes[0].explanation, 'Пояснение')
    assert.deepEqual(
      (await visitor(finishSql, [session.id, '[]'])).rows[0].result,
      result,
    )

    const second = (await visitor(startSql)).rows[0].session
    assert.notEqual(second.id, session.id)
    assert.equal(second.questions[0].prompt, 'Новый текст')
    assert.equal(second.questions[0].points, 5)
    assert.deepEqual(
      (
        await admin(
          'select correct_count, incorrect_numbers from demo_attempts',
        )
      ).rows,
      [{ correct_count: 29, incorrect_numbers: [2] }],
    )
    assert.equal(
      (
        await asRole(
          db,
          'authenticated',
          userId,
          'select correct_count from demo_attempts',
        )
      ).rows.length,
      0,
    )
    await assert.rejects(
      visitor('select correct_count from demo_attempts'),
      /permission denied/,
    )
  } finally {
    await db.close()
  }
})

for (const existingFormat of [false, true]) {
  test(`upgrade preserves data and enforces permissions (${existingFormat ? 'format' : 'legacy stage'} schema)`, async () => {
    const db = new PGlite()
    try {
      await db.exec(`
        create role anon; create role authenticated; create role service_role bypassrls;
        create schema auth;
        create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
        create function auth.uid() returns uuid language sql stable as
          $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        grant usage on schema public, auth to anon, authenticated, service_role;
        grant execute on function auth.uid() to anon, authenticated, service_role;
      `)
      // gen_random_uuid is built into Postgres. PGlite does not ship the pgcrypto extension.
      await db.exec(
        (await migration('20260514000000_init_schema')).replace(
          'create extension if not exists pgcrypto;',
          '',
        ),
      )
      await db.exec(await migration('20260515120000_profiles_username_login'))
      await db.exec(await migration('20260930120000_release_orphan_auth_users'))
      await db.exec(await migration('20261109130000_olympiads_and_profiles'))
      await db.exec(
        'grant select, insert, update, delete on all tables in schema public to authenticated, service_role',
      )
      for (const id of [userId, otherId, adminId]) {
        await db.query('insert into auth.users (id, email) values ($1, $2)', [
          id,
          `${id}@example.test`,
        ])
      }
      await db.query("update profiles set role='admin' where id=$1", [adminId])
      await db.query(
        `insert into olympiads (id, slug, title, year, stage, status, is_published, max_participants)
        values ($1, 'existing', 'Real title must survive', 2026, 'final', 'published', true, -1)`,
        [eventId],
      )
      if (existingFormat) {
        await db.exec(
          "alter table olympiads add column format text default 'online'; alter table olympiads add column registration_open boolean default true",
        )
      }
      // Reproduce the real privilege escalation before applying the fix.
      await asRole(
        db,
        'authenticated',
        userId,
        "update profiles set role='admin' where id=$1",
        [userId],
      )
      await db.query("update profiles set role='user' where id=$1", [userId])
      await db.exec(await migration('20261117000000_harden_olympiads'))
      const {
        rows: [existing],
      } = await db.query('select * from olympiads where id=$1', [eventId])
      assert.equal(existing.title, 'Real title must survive')
      assert.equal(existing.max_participants, -1) // no hidden destructive cleanup of historical data
      assert.equal(existing.format, existingFormat ? 'online' : 'offline')
      assert.equal(existing.registration_open, existingFormat ? true : null)
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          userId,
          "update profiles set role='admin' where id=$1",
          [userId],
        ),
        /Only administrators/,
      )
      await db.query('delete from profiles where id=$1', [otherId])
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          otherId,
          "insert into profiles (id,role) values ($1,'admin')",
          [otherId],
        ),
        /Only administrators/,
      )
      await asRole(
        db,
        'authenticated',
        otherId,
        'insert into profiles (id) values ($1)',
        [otherId],
      )
      await asRole(
        db,
        'authenticated',
        userId,
        "update profiles set first_name='Allowed' where id=$1",
        [userId],
      )
      await asRole(
        db,
        'authenticated',
        adminId,
        "update profiles set role='admin' where id=$1",
        [otherId],
      )
      await asRole(
        db,
        'service_role',
        null,
        "update profiles set role='user' where id=$1",
        [otherId],
      )
      // New sign-ups still create ordinary profiles after the role trigger is installed.
      await db.query(
        "insert into auth.users (id,email) values ('55555555-5555-4555-8555-555555555555','new@example.test')",
      )
      await asRole(
        db,
        'authenticated',
        adminId,
        'update olympiads set max_participants=100 where id=$1',
        [eventId],
      )
      for (const [slug, status, published] of [
        ['draft', 'draft', true],
        ['hidden', 'published', false],
      ]) {
        await asRole(
          db,
          'authenticated',
          adminId,
          'insert into olympiads (slug,title,year,status,is_published) values ($1,$1,2026,$2,$3)',
          [slug, status, published],
        )
      }
      const publicRows = await asRole(
        db,
        'anon',
        null,
        'select slug from olympiads',
      )
      assert.deepEqual(
        publicRows.rows.map((row) => row.slug),
        ['existing'],
      )
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          userId,
          "insert into olympiads (slug,title,year) values ('bad','bad',2026)",
        ),
        /row-level security/,
      )
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          adminId,
          'update olympiads set max_participants=0 where id=$1',
          [eventId],
        ),
        /olympiads_capacity_valid/,
      )
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          adminId,
          "update olympiads set start_date='2026-11-18',end_date='2026-11-17' where id=$1",
          [eventId],
        ),
        /olympiads_dates_valid/,
      )
      await asRole(
        db,
        'authenticated',
        adminId,
        "update olympiads set start_date='2026-11-17',end_date='2026-11-17' where id=$1",
        [eventId],
      )
      await asRole(
        db,
        'authenticated',
        adminId,
        'insert into olympiad_profiles (user_id,olympiad_id,olympiad_year) values ($1,$2,2026)',
        [userId, eventId],
      )
      assert.equal(
        (
          await asRole(
            db,
            'authenticated',
            userId,
            'select * from olympiad_profiles',
          )
        ).rows.length,
        1,
      )
      assert.equal(
        (
          await asRole(
            db,
            'authenticated',
            otherId,
            'select * from olympiad_profiles',
          )
        ).rows.length,
        0,
      )
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          userId,
          'update olympiad_profiles set score=100 returning *',
        ).then((res) => {
          if (res.rows.length === 0) throw new Error('write denied')
        }),
        /write denied|row-level security/,
      )
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          adminId,
          'update olympiad_profiles set score=-1',
        ),
        /olympiad_profiles_score_valid/,
      )
      await assert.rejects(
        asRole(
          db,
          'authenticated',
          adminId,
          'insert into olympiad_profiles (user_id,olympiad_id,olympiad_year) values ($1,$2,2026)',
          [userId, eventId],
        ),
        /unique constraint/,
      )
    } finally {
      await db.close()
    }
  })
}
