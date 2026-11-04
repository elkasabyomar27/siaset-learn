-- DB-2 foundation. No import activation, browser writes, or production rollout.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create table private.contract_manifests (
  version text primary key,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  engine_sha256 text not null check (engine_sha256 ~ '^[0-9a-f]{64}$')
);
alter table private.contract_manifests enable row level security;
revoke all on private.contract_manifests from public, anon, authenticated;
grant select on private.contract_manifests to service_role;

create table public.learner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (length(display_name) <= 100),
  created_at timestamptz not null default now()
);
create table public.learner_heads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seq bigint not null default 0 check (last_seq >= 0),
  snapshot_version integer not null default 1 check (snapshot_version = 1),
  restore_generation uuid not null default gen_random_uuid(),
  rate_window timestamptz not null default now(),
  rate_count integer not null default 0
);
create table public.learner_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  last_seq bigint not null default 0 check (last_seq >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, device_id)
);
create table public.learner_scopes (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope ~ '^(lesson:[a-z0-9-]+|lab:tn[35]|attempts)$'),
  epoch bigint not null default 0 check (epoch >= 0),
  revision bigint not null default 0 check (revision >= 0),
  field_revisions jsonb not null default '{}',
  primary key (user_id, scope)
);
create table public.learner_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  op_id text not null check (length(op_id) between 1 and 128),
  server_seq bigint not null check (server_seq > 0),
  device_id uuid not null,
  device_seq bigint not null check (device_seq > 0),
  scope text not null,
  type text not null check (type in ('lesson','resetLesson','lab','attempt','resetAttempts')),
  payload jsonb not null check (octet_length(payload::text) <= 65536),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  contract_version text not null references private.contract_manifests(version),
  received_at timestamptz not null default now(),
  primary key (user_id, op_id), unique (user_id, server_seq), unique (user_id, device_id, device_seq),
  foreign key (user_id, device_id) references public.learner_devices(user_id, device_id)
);
create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  epoch bigint not null,
  record jsonb not null default '{}' check (jsonb_typeof(record) = 'object'),
  last_seq bigint not null,
  primary key (user_id, lesson_id)
);
create table public.lab_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id text not null,
  scenario text not null check (scenario in ('tn5','tn3')),
  record jsonb not null,
  server_seq bigint not null,
  source_op_id text not null,
  provenance text not null default 'validated_explicit_review',
  primary key (user_id, review_id), unique (user_id, source_op_id),
  foreign key (user_id, source_op_id) references public.learner_operations(user_id, op_id)
);
create table public.current_lab_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario text not null check (scenario in ('tn5','tn3')),
  review_id text not null,
  primary key (user_id, scenario),
  foreign key (user_id, review_id) references public.lab_reviews(user_id, review_id)
);
create index current_lab_reviews_owner_review on public.current_lab_reviews(user_id, review_id);
create table public.assessment_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id text not null,
  bank_version integer not null check (bank_version = 1),
  answers jsonb not null,
  client_date text not null check (length(client_date) <= 100),
  score jsonb not null,
  attempt_epoch bigint not null,
  server_seq bigint not null,
  received_at timestamptz not null default now(),
  primary key (user_id, attempt_id),
  foreign key (user_id, attempt_id) references public.learner_operations(user_id, op_id)
);
create index assessment_owner_epoch_seq on public.assessment_attempts(user_id, attempt_epoch, server_seq);
create table public.operation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  op_id text not null,
  payload_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, op_id)
);

-- Imports are deliberately absent: DB-3 must add staged consent and activation together.
do $security$
declare t text;
begin
  foreach t in array array['learner_profiles','learner_heads','learner_devices','learner_scopes',
    'learner_operations','lesson_progress','lab_reviews','current_lab_reviews','assessment_attempts','operation_receipts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated, service_role', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('create policy owner_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $security$;
grant select, insert on public.learner_profiles, public.learner_operations, public.lab_reviews,
  public.assessment_attempts, public.operation_receipts to service_role;
grant select, insert, update on public.learner_heads, public.learner_devices,
  public.learner_scopes, public.lesson_progress, public.current_lab_reviews to service_role;
grant delete on public.lesson_progress to service_role;

-- Server validates content before this service-only transaction. Caller owner is derived by getUser.
create function public.commit_learner_batch(p_user_id uuid, p_operations jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  op jsonb; p jsonb; old_receipt public.operation_receipts%rowtype;
  h public.learner_heads%rowtype; s public.learner_scopes%rowtype;
  result jsonb; results jsonb := '[]'; reason text; seq bigint;
  current_revision bigint; rec jsonb; indices jsonb;
begin
  if p_user_id is null or jsonb_typeof(p_operations) <> 'array' or jsonb_array_length(p_operations) not between 1 and 20
    or octet_length(p_operations::text) > 131072 then raise exception 'invalid_batch'; end if;
  insert into public.learner_heads(user_id) values(p_user_id) on conflict do nothing;
  select * into h from public.learner_heads where user_id = p_user_id for update;
  insert into public.learner_profiles(user_id) values(p_user_id) on conflict do nothing;
  for op in select value from jsonb_array_elements(p_operations) loop
    if op->>'protocol_version' is distinct from '1' or not exists (
      select 1 from private.contract_manifests where version = op->>'contract_version' and fingerprint = op->>'contract_hash'
    ) then raise exception 'unsupported_contract'; end if;
    select * into old_receipt from public.operation_receipts where user_id = p_user_id and op_id = op->>'op_id';
    if found then
      if old_receipt.payload_hash is distinct from op->>'payload_hash' then
        results := results || jsonb_build_array(jsonb_build_object('status','conflict','reason','id_reuse','op_id',op->>'op_id'));
      else results := results || jsonb_build_array(old_receipt.result); end if;
      continue;
    end if;
    if h.rate_window < now() - interval '1 minute' then h.rate_window := now(); h.rate_count := 0; end if;
    if h.rate_count >= 120 then
      results := results || jsonb_build_array(jsonb_build_object('status','retry','reason','rate_limited','op_id',op->>'op_id'));
      continue;
    end if;
    h.rate_count := h.rate_count + 1;
    insert into public.learner_devices(user_id,device_id) values(p_user_id,(op->>'device_id')::uuid) on conflict do nothing;
    insert into public.learner_scopes(user_id,scope) values(p_user_id,op->>'scope') on conflict do nothing;
    select * into s from public.learner_scopes where user_id = p_user_id and scope = op->>'scope';
    current_revision := case when op->>'type' = 'lesson' then coalesce((s.field_revisions->>(op->>'field'))::bigint,0) else s.revision end;
    reason := null;
    if (op->>'device_seq')::bigint <= (select last_seq from public.learner_devices where user_id = p_user_id and device_id = (op->>'device_id')::uuid) then reason := 'stale_device_seq';
    elsif (op->>'expected_epoch')::bigint <> s.epoch then reason := 'stale_epoch';
    elsif not (op->>'type' = 'attempt' or (op->>'type' = 'lesson' and op->>'field' = 'inspect'))
      and (op->>'expected_revision')::bigint <> current_revision then reason := 'revision_conflict'; end if;
    if reason is not null then
      result := jsonb_build_object('status','conflict','reason',reason,'op_id',op->>'op_id','epoch',s.epoch::text,'revision',current_revision::text);
    else
      h.last_seq := h.last_seq + 1; seq := h.last_seq; p := op->'payload';
      insert into public.learner_operations(user_id,op_id,server_seq,device_id,device_seq,scope,type,payload,payload_hash,contract_version)
        values(p_user_id,op->>'op_id',seq,(op->>'device_id')::uuid,(op->>'device_seq')::bigint,op->>'scope',op->>'type',p,op->>'payload_hash',op->>'contract_version');
      case op->>'type'
      when 'lesson' then
        select record into rec from public.lesson_progress where user_id = p_user_id and lesson_id = p->>'lessonId';
        rec := coalesce(rec,'{}');
        if p->>'kind' = 'inspect' then
          select jsonb_agg(v order by v) into indices from (select distinct value::integer as v from jsonb_array_elements_text(coalesce(rec->'inspected','[]') || jsonb_build_array(p->'value'))) q;
          rec := jsonb_set(rec,'{inspected}',indices);
        else rec := jsonb_set(rec,array[p->>'kind'],p->'value'); end if;
        insert into public.lesson_progress(user_id,lesson_id,epoch,record,last_seq) values(p_user_id,p->>'lessonId',s.epoch,rec,seq)
          on conflict(user_id,lesson_id) do update set record = excluded.record,last_seq = excluded.last_seq,epoch = excluded.epoch;
        s.field_revisions := jsonb_set(s.field_revisions,array[op->>'field'],to_jsonb(seq::text));
      when 'resetLesson' then
        delete from public.lesson_progress where user_id = p_user_id and lesson_id = p->>'lessonId';
        s.epoch := s.epoch + 1; s.field_revisions := '{}';
      when 'lab' then
        insert into public.lab_reviews(user_id,review_id,scenario,record,server_seq,source_op_id)
          values(p_user_id,op->>'op_id',p->'record'->>'scenario',p->'record',seq,op->>'op_id');
        insert into public.current_lab_reviews(user_id,scenario,review_id) values(p_user_id,p->'record'->>'scenario',op->>'op_id')
          on conflict(user_id,scenario) do update set review_id = excluded.review_id;
      when 'attempt' then
        insert into public.assessment_attempts(user_id,attempt_id,bank_version,answers,client_date,score,attempt_epoch,server_seq)
          values(p_user_id,op->>'op_id',1,p->'attempt'->'answers',p->'attempt'->>'date',p->'score',s.epoch,seq);
      when 'resetAttempts' then s.epoch := s.epoch + 1;
      else raise exception 'invalid_type';
      end case;
      update public.learner_scopes set epoch = s.epoch,revision = seq,field_revisions = s.field_revisions where user_id = p_user_id and scope = s.scope;
      update public.learner_devices set last_seq = (op->>'device_seq')::bigint where user_id = p_user_id and device_id = (op->>'device_id')::uuid;
      result := jsonb_build_object('status','accepted','op_id',op->>'op_id','server_seq',seq::text,'epoch',s.epoch::text,'revision',seq::text);
    end if;
    insert into public.operation_receipts(user_id,op_id,payload_hash,result) values(p_user_id,op->>'op_id',op->>'payload_hash',result);
    results := results || jsonb_build_array(result);
  end loop;
  update public.learner_heads set last_seq = h.last_seq,rate_window = h.rate_window,rate_count = h.rate_count where user_id = p_user_id;
  return results;
end $function$;
revoke all on function public.commit_learner_batch(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.commit_learner_batch(uuid,jsonb) to service_role;
