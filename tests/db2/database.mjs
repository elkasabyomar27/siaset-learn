import {PGlite} from '@electric-sql/pglite';
import {readFile, readdir} from 'node:fs/promises';
export const ownerA = '11111111-1111-4111-8111-111111111111';
export const ownerB = '22222222-2222-4222-8222-222222222222';
export const device = '33333333-3333-4333-8333-333333333333';
export async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    -- Minimal stand-in for Supabase Storage so storage migrations and policies run locally.
    create schema storage;
    create table storage.buckets (id text primary key, name text not null unique, public boolean not null default false,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
      name text not null, owner uuid, unique (bucket_id, name));
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable
      as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    grant execute on function auth.uid(), auth.jwt() to anon,authenticated,service_role;
    grant select,insert,delete on storage.objects to anon,authenticated;
    insert into auth.users values ('${ownerA}'), ('${ownerB}');
  `);
  for (const name of (await readdir('supabase/migrations')).filter(p => p.endsWith('.sql')).sort())
    await db.exec(await readFile(`supabase/migrations/${name}`, 'utf8'));
  await db.exec(await readFile('supabase/seed.sql', 'utf8'));
  return db;
}
export async function commit(db, owner, operations) {
  return db.transaction(async tx => {
    await tx.exec('set local role service_role');
    return (await tx.query('select public.commit_learner_batch($1,$2) as receipts', [owner, JSON.stringify(operations)])).rows[0].receipts;
  });
}
export async function asRole(db, role, owner, sql, params = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [owner || '']);
    return tx.query(sql, params);
  });
}
