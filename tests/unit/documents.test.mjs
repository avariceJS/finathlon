import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const migration = (name) =>
  readFile(
    new URL(`../../supabase/migrations/${name}.sql`, import.meta.url),
    'utf8',
  )
const administrator = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const visitor = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const privatePath = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc.pdf'

test('document rollout preserves old rows, seeds once and protects hierarchy and private downloads', async () => {
  const db = new PGlite()
  const role = (name, id, query, params = []) =>
    db.transaction(async (tx) => {
      await tx.exec(`set local role ${name}`)
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
        id ?? '',
      ])
      return tx.query(query, params)
    })
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table storage.buckets (id text primary key, name text not null, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null);
      alter table storage.objects enable row level security;
      grant usage on schema public, auth, storage to anon, authenticated;
      grant select on storage.objects to anon;
      grant select, insert, delete on storage.objects to authenticated;
    `)
    await db.exec(
      (await migration('20260514000000_init_schema')).replace(
        'create extension if not exists pgcrypto;',
        '',
      ),
    )
    await db.exec(
      'grant select on public.documents to anon, authenticated; grant update, insert on public.documents to authenticated;',
    )
    await db.query(
      'insert into auth.users (id, email) values ($1, $2), ($3,$4)',
      [administrator, 'admin@example.test', visitor, 'visitor@example.test'],
    )
    await db.query("update profiles set role='admin' where id=$1", [
      administrator,
    ])
    await db.exec(
      "insert into documents (title,category,file_url) values ('Старый документ','guides','/banner.jpg')",
    )
    const baseline = await db.query('select * from documents order by id')
    const before = baseline.rows.find((row) => row.title === 'Старый документ')

    await db.exec(await migration('20261124230000_document_schema_update'))
    const catalog = await migration('20261125150000_seed_all_documents')
    await db.exec(catalog)
    await db.exec(catalog)

    const after = (
      await role('anon', null, 'select * from documents where id=$1', [
        before.id,
      ])
    ).rows[0]
    const { section_id, file_name, file_path, source, ...original } = after
    assert.deepEqual(original, before)
    assert.deepEqual(
      [section_id, file_name, file_path, source],
      [null, null, null, null],
    )
    assert.equal(
      (await db.query('select count(*)::int as n from documents')).rows[0].n,
      baseline.rows.length + 64,
    )
    assert.equal(
      (await db.query('select count(*)::int as n from document_sections'))
        .rows[0].n,
      11,
    )
    assert.equal(
      (
        await db.query(
          "select public from storage.buckets where id='documents'",
        )
      ).rows[0].public,
      false,
    )
    const {
      rows: [root],
    } = await db.query(
      "select id from document_sections where slug='olympiad-docs'",
    )
    const {
      rows: [leaf],
    } = await db.query(
      "select id from document_sections where slug='olympiad-2026-2027-profile-1'",
    )
    await assert.rejects(
      () =>
        role(
          'authenticated',
          visitor,
          "insert into document_sections (title,slug) values ('Без прав','forbidden')",
        ),
      /row-level security/,
    )
    await assert.rejects(
      () =>
        role(
          'authenticated',
          administrator,
          "insert into document_sections (title,slug,parent_id) values ('Слишком глубоко','too-deep',$1)",
          [leaf.id],
        ),
      /трёх уровней/,
    )
    await assert.rejects(
      () =>
        role(
          'authenticated',
          administrator,
          'update document_sections set parent_id=$1 where id=$2',
          [leaf.id, root.id],
        ),
      /циклов/,
    )
    await assert.rejects(
      () =>
        role(
          'authenticated',
          administrator,
          'delete from document_sections where id=$1',
          [leaf.id],
        ),
      /foreign key/,
    )

    const store = (id) =>
      role(
        'authenticated',
        id,
        "insert into storage.objects (bucket_id,name) values ('documents',$1)",
        [privatePath],
      )
    await assert.rejects(() => store(visitor), /row-level security/)
    await store(administrator)
    const fetchStorage = (id) =>
      role(
        id ? 'authenticated' : 'anon',
        id,
        'select name from storage.objects',
      )
    assert.equal((await fetchStorage(null)).rows.length, 0)
    assert.equal((await fetchStorage(administrator)).rows.length, 1)
    await role(
      'authenticated',
      administrator,
      "insert into public.documents (title,section_id,file_path,is_published) values ('Загрузка',$1,$2,false)",
      [leaf.id, privatePath],
    )
    assert.equal((await fetchStorage(null)).rows.length, 0)
    await role(
      'authenticated',
      administrator,
      'update documents set is_published=true where file_path=$1',
      [privatePath],
    )
    assert.equal((await fetchStorage(null)).rows.length, 1)
    await role(
      'authenticated',
      administrator,
      'update document_sections set is_published=false where id=$1',
      [root.id],
    )
    assert.equal((await fetchStorage(null)).rows.length, 0)
    assert.equal(
      (
        await role(
          'authenticated',
          visitor,
          'select id from documents where section_id=$1',
          [leaf.id],
        )
      ).rows.length,
      0,
    )
    assert.equal(
      (
        await role(
          'anon',
          null,
          'select id from document_sections where id=$1',
          [leaf.id],
        )
      ).rows.length,
      0,
    )
    assert.equal((await fetchStorage(administrator)).rows.length, 1)
  } finally {
    await db.close()
  }
})
