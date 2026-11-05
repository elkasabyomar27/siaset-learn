-- Cross-device progress sync (MVP). Each row is one immutable entry of the browser's progress log
-- (see frontend progressRepository.js). Signed-in owners may read and append only their own
-- entries; nothing can be updated or deleted from the browser. Devices merge all entries by
-- (clock, id), so every device converges on the same progress. The richer DB-2 tables are untouched.
create table public.progress_ops (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  op_id text not null check (length(op_id) between 1 and 128),
  op jsonb not null check (
    jsonb_typeof(op) = 'object'
    and octet_length(op::text) <= 65536
    and op->>'id' = op_id
    and op->>'version' = '1'
    and op->>'type' in ('lesson','resetLesson','lab','attempt','resetAttempts')
    and jsonb_typeof(op->'clock') = 'number'
    and (op->>'clock')::numeric between 1 and 9007199254740991
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, op_id)
);

alter table public.progress_ops enable row level security;
revoke all on public.progress_ops from public, anon, authenticated;
grant select, insert on public.progress_ops to authenticated;

create policy progress_ops_owner_read on public.progress_ops
for select to authenticated
using (user_id = (select auth.uid())
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

create policy progress_ops_owner_insert on public.progress_ops
for insert to authenticated
with check (user_id = (select auth.uid())
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

-- Bound each learner's log so one account cannot grow the table without limit.
create function private.progress_ops_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.progress_ops where user_id = new.user_id) >= 20000 then
    raise exception 'progress_quota_exceeded' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function private.progress_ops_quota() from public, anon, authenticated;
create trigger progress_ops_quota before insert on public.progress_ops
for each row execute function private.progress_ops_quota();
