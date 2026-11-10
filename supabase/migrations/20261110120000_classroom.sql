-- Classroom mode: teacher approval, classes, assignments with file submissions, and live quizzes.
--
-- Trust model
-- * Only signed-in, non-anonymous accounts take part (public.classroom_uid()).
-- * Becoming a teacher is decided outside the browser: the teacher-request Edge Function (service role)
--   writes teacher_requests.status after the site owner follows the emailed approval link.
-- * Students never see a quiz's correct answers. Hosts advance a session through RPCs that copy only
--   the current question's text and options to the session row; scoring happens in quiz_answer().
-- * Teachers see only their own classes, rosters, submissions and quiz sessions. Students see their
--   own classes, assignments and submissions; classmates are not visible to each other.

create function public.classroom_uid() returns uuid
language sql stable set search_path = '' as $$
  select case when coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false' then (select auth.uid()) end
$$;

-- Short, unambiguous codes (no 0/O/1/I) from gen_random_uuid() bytes.
create function public.classroom_code(len int, alphabet text) returns text
language plpgsql volatile set search_path = '' as $$
declare bytes bytea := uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()); result text := '';
begin
  for i in 0 .. len - 1 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end $$;

-- ---------------------------------------------------------------- teacher approval
create table public.teacher_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 100),
  school text not null default '' check (length(school) <= 200),
  reason text not null default '' check (length(reason) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  token_hash text check (token_hash ~ '^[0-9a-f]{64}$'),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.teacher_requests enable row level security;
revoke all on public.teacher_requests from public, anon, authenticated;
-- The approval token hash is never readable from the browser.
grant select (user_id, display_name, school, reason, status, created_at, decided_at) on public.teacher_requests to authenticated;
grant all on public.teacher_requests to service_role;
create policy teacher_requests_owner_read on public.teacher_requests
for select to authenticated using (user_id = (select public.classroom_uid()));

create function public.is_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teacher_requests
    where user_id = (select public.classroom_uid()) and status = 'approved')
$$;

-- ---------------------------------------------------------------- classes
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  join_code text not null unique default public.classroom_code(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
    check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_at timestamptz not null default now()
);
create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) between 1 and 100),
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index class_members_user on public.class_members(user_id);

create function public.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = (select public.classroom_uid()))
$$;
create function public.in_class(p_class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.class_members where class_id = p_class and user_id = (select public.classroom_uid()))
$$;

alter table public.classes enable row level security;
alter table public.class_members enable row level security;
revoke all on public.classes, public.class_members from public, anon, authenticated;
grant select, delete on public.classes, public.class_members to authenticated;
grant insert (name), update (name) on public.classes to authenticated;
grant all on public.classes, public.class_members to service_role;

create policy classes_read on public.classes for select to authenticated
using (teacher_id = (select public.classroom_uid()) or public.in_class(id));
create policy classes_create on public.classes for insert to authenticated
with check (teacher_id = (select public.classroom_uid()) and public.is_teacher());
create policy classes_rename on public.classes for update to authenticated
using (teacher_id = (select public.classroom_uid())) with check (teacher_id = (select public.classroom_uid()));
create policy classes_delete on public.classes for delete to authenticated
using (teacher_id = (select public.classroom_uid()));

create policy class_members_read on public.class_members for select to authenticated
using (user_id = (select public.classroom_uid()) or public.teaches_class(class_id));
create policy class_members_leave_or_remove on public.class_members for delete to authenticated
using (user_id = (select public.classroom_uid()) or public.teaches_class(class_id));

create function public.join_class(p_code text, p_display_name text)
returns table (class_id uuid, class_name text)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.classroom_uid(); target public.classes;
begin
  if uid is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  select * into target from public.classes where join_code = upper(btrim(p_code));
  if target.id is null then raise exception 'class_not_found' using errcode = 'P0002'; end if;
  if target.teacher_id = uid then raise exception 'own_class' using errcode = '22023'; end if;
  if (select count(*) from public.class_members m where m.class_id = target.id) >= 300 then
    raise exception 'class_full' using errcode = '54000';
  end if;
  insert into public.class_members (class_id, user_id, display_name)
  values (target.id, uid, btrim(p_display_name))
  on conflict on constraint class_members_pkey do update set display_name = excluded.display_name;
  return query select target.id, target.name;
end $$;

create function public.new_join_code(p_class uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare code text;
begin
  if not public.teaches_class(p_class) then raise exception 'not_your_class' using errcode = '42501'; end if;
  update public.classes set join_code = public.classroom_code(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
  where id = p_class returning join_code into code;
  return code;
end $$;

-- ---------------------------------------------------------------- assignments and submissions
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  instructions text not null default '' check (length(instructions) <= 5000),
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index assignments_class on public.assignments(class_id);
create table public.submissions (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  file_path text not null check (length(file_path) <= 400),
  file_name text not null check (length(file_name) between 1 and 200),
  file_size bigint not null check (file_size between 1 and 26214400),
  note text not null default '' check (length(note) <= 2000),
  submitted_at timestamptz not null default now(),
  grade text check (length(grade) <= 40),
  feedback text check (length(feedback) <= 2000),
  graded_at timestamptz,
  primary key (assignment_id, user_id),
  -- Files live at {class}/{assignment}/{student}/{name}; the row must point inside the student's folder.
  check (split_part(file_path, '/', 2) = assignment_id::text and split_part(file_path, '/', 3) = user_id::text)
);

create function public.assignment_class(p_assignment uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select class_id from public.assignments where id = p_assignment
$$;

alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
revoke all on public.assignments, public.submissions from public, anon, authenticated;
grant select, delete on public.assignments, public.submissions to authenticated;
grant insert (class_id, title, instructions, due_at), update (title, instructions, due_at) on public.assignments to authenticated;
-- Students write only their file fields; grades and feedback are set through grade_submission().
grant insert (assignment_id, file_path, file_name, file_size, note),
  update (file_path, file_name, file_size, note, submitted_at) on public.submissions to authenticated;
grant all on public.assignments, public.submissions to service_role;

create policy assignments_read on public.assignments for select to authenticated
using (public.teaches_class(class_id) or public.in_class(class_id));
create policy assignments_create on public.assignments for insert to authenticated
with check (public.teaches_class(class_id));
create policy assignments_edit on public.assignments for update to authenticated
using (public.teaches_class(class_id)) with check (public.teaches_class(class_id));
create policy assignments_delete on public.assignments for delete to authenticated
using (public.teaches_class(class_id));

create policy submissions_read on public.submissions for select to authenticated
using (user_id = (select public.classroom_uid()) or public.teaches_class(public.assignment_class(assignment_id)));
create policy submissions_create on public.submissions for insert to authenticated
with check (user_id = (select public.classroom_uid()) and public.in_class(public.assignment_class(assignment_id))
  and split_part(file_path, '/', 1) = public.assignment_class(assignment_id)::text);
create policy submissions_replace on public.submissions for update to authenticated
using (user_id = (select public.classroom_uid()))
with check (user_id = (select public.classroom_uid()) and public.in_class(public.assignment_class(assignment_id))
  and split_part(file_path, '/', 1) = public.assignment_class(assignment_id)::text);
create policy submissions_withdraw on public.submissions for delete to authenticated
using (user_id = (select public.classroom_uid()));

-- A new upload clears any earlier grade so feedback always matches the file the teacher saw.
create function public.submissions_reset_grade() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.file_path is distinct from old.file_path then
    new.grade := null; new.feedback := null; new.graded_at := null; new.submitted_at := now();
  end if;
  return new;
end $$;
create trigger submissions_reset_grade before update on public.submissions
for each row when (pg_trigger_depth() = 0) execute function public.submissions_reset_grade();

create function public.grade_submission(p_assignment uuid, p_student uuid, p_grade text, p_feedback text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.teaches_class(public.assignment_class(p_assignment)) then
    raise exception 'not_your_class' using errcode = '42501';
  end if;
  update public.submissions set grade = nullif(btrim(p_grade), ''), feedback = nullif(btrim(p_feedback), ''), graded_at = now()
  where assignment_id = p_assignment and user_id = p_student;
  if not found then raise exception 'submission_not_found' using errcode = 'P0002'; end if;
end $$;

-- Private bucket. Path: {class_id}/{assignment_id}/{student_id}/{file name}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('class-submissions', 'class-submissions', false, 26214400, array[
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text'
]);

create function public.submission_folder_ok(p_name text, p_student_only boolean) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare parts text[] := string_to_array(p_name, '/'); uid uuid := public.classroom_uid(); uuid_re text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if uid is null or array_length(parts, 1) <> 4 or parts[1] !~ uuid_re or parts[2] !~ uuid_re or parts[3] !~ uuid_re then
    return false;
  end if;
  if not exists (select 1 from public.assignments where id = parts[2]::uuid and class_id = parts[1]::uuid) then return false; end if;
  if parts[3]::uuid = uid and public.in_class(parts[1]::uuid) then return true; end if;
  return not p_student_only and public.teaches_class(parts[1]::uuid);
end $$;

create policy class_submission_upload on storage.objects for insert to authenticated
with check (bucket_id = 'class-submissions' and public.submission_folder_ok(name, true));
create policy class_submission_read on storage.objects for select to authenticated
using (bucket_id = 'class-submissions' and public.submission_folder_ok(name, false));
create policy class_submission_delete on storage.objects for delete to authenticated
using (bucket_id = 'class-submissions' and public.submission_folder_ok(name, true));

-- ---------------------------------------------------------------- live quizzes
create function public.valid_quiz_questions(q jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item jsonb; n int;
begin
  if jsonb_typeof(q) <> 'array' or jsonb_array_length(q) not between 1 and 50 then return false; end if;
  for item in select value from jsonb_array_elements(q) loop
    if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'text') <> 'string'
      or length(item->>'text') not between 1 and 300
      or jsonb_typeof(item->'options') <> 'array' then return false; end if;
    n := jsonb_array_length(item->'options');
    if n not between 2 and 4 then return false; end if;
    if exists (select 1 from jsonb_array_elements(item->'options') o
      where jsonb_typeof(o) <> 'string' or length(o #>> '{}') not between 1 and 120) then return false; end if;
    if jsonb_typeof(item->'correct') <> 'number' or (item->>'correct')::numeric <> floor((item->>'correct')::numeric)
      or (item->>'correct')::int not between 0 and n - 1 then return false; end if;
    if jsonb_typeof(item->'seconds') <> 'number' or (item->>'seconds')::numeric not between 5 and 120 then return false; end if;
  end loop;
  return true;
end $$;

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  questions jsonb not null check (public.valid_quiz_questions(questions)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
revoke all on public.quizzes from public, anon, authenticated;
grant select, delete on public.quizzes to authenticated;
grant insert (title, questions), update (title, questions, updated_at) on public.quizzes to authenticated;
grant all on public.quizzes to service_role;
create policy quizzes_owner_read on public.quizzes for select to authenticated using (teacher_id = (select public.classroom_uid()));
create policy quizzes_create on public.quizzes for insert to authenticated
with check (teacher_id = (select public.classroom_uid()) and public.is_teacher());
create policy quizzes_edit on public.quizzes for update to authenticated
using (teacher_id = (select public.classroom_uid())) with check (teacher_id = (select public.classroom_uid()));
create policy quizzes_delete on public.quizzes for delete to authenticated using (teacher_id = (select public.classroom_uid()));

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  pin text not null check (pin ~ '^[0-9]{6}$'),
  status text not null default 'lobby' check (status in ('lobby', 'question', 'reveal', 'finished')),
  question_index int not null default -1,
  question_count int not null,
  -- Public view of the current question: {text, options, seconds}. Never contains the answer.
  current jsonb,
  question_started_at timestamptz,
  correct_option int,
  answer_counts jsonb,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index quiz_sessions_live_pin on public.quiz_sessions(pin) where status <> 'finished';
create table public.quiz_players (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (length(btrim(nickname)) between 1 and 30),
  score int not null default 0,
  correct_count int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);
create unique index quiz_players_nickname on public.quiz_players(session_id, lower(nickname));
create table public.quiz_answers (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_index int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice int not null,
  is_correct boolean not null,
  points int not null,
  answered_at timestamptz not null default now(),
  primary key (session_id, question_index, user_id)
);

create function public.hosts_quiz(p_session uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.quiz_sessions where id = p_session and host_id = (select public.classroom_uid()))
$$;
create function public.plays_quiz(p_session uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.quiz_players where session_id = p_session and user_id = (select public.classroom_uid()))
$$;

alter table public.quiz_sessions enable row level security;
alter table public.quiz_players enable row level security;
alter table public.quiz_answers enable row level security;
revoke all on public.quiz_sessions, public.quiz_players, public.quiz_answers from public, anon, authenticated;
grant select on public.quiz_sessions, public.quiz_players, public.quiz_answers to authenticated;
grant all on public.quiz_sessions, public.quiz_players, public.quiz_answers to service_role;
create policy quiz_sessions_read on public.quiz_sessions for select to authenticated
using (host_id = (select public.classroom_uid()) or public.plays_quiz(id));
create policy quiz_players_read on public.quiz_players for select to authenticated
using (public.hosts_quiz(session_id) or public.plays_quiz(session_id));
create policy quiz_answers_read on public.quiz_answers for select to authenticated
using (user_id = (select public.classroom_uid()) or public.hosts_quiz(session_id));

create function public.start_quiz_session(p_quiz uuid) returns table (session_id uuid, pin text)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.classroom_uid(); q public.quizzes; new_id uuid; new_pin text;
begin
  select * into q from public.quizzes where id = p_quiz and teacher_id = uid;
  if q.id is null or not public.is_teacher() then raise exception 'not_your_quiz' using errcode = '42501'; end if;
  -- One live game per host keeps PINs scarce and avoids forgotten sessions.
  update public.quiz_sessions set status = 'finished', ended_at = now(), current = null
  where host_id = uid and status <> 'finished';
  for attempt in 1 .. 20 loop
    new_pin := public.classroom_code(6, '0123456789');
    begin
      insert into public.quiz_sessions (quiz_id, host_id, title, pin, question_count)
      values (q.id, uid, q.title, new_pin, jsonb_array_length(q.questions)) returning id into new_id;
      return query select new_id, new_pin;
      return;
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'pin_unavailable' using errcode = '54000';
end $$;

create function public.join_quiz(p_pin text, p_nickname text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.classroom_uid(); s public.quiz_sessions;
begin
  if uid is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  select * into s from public.quiz_sessions where pin = btrim(p_pin) and status <> 'finished';
  if s.id is null then raise exception 'game_not_found' using errcode = 'P0002'; end if;
  if s.host_id = uid then raise exception 'own_game' using errcode = '22023'; end if;
  if exists (select 1 from public.quiz_players where session_id = s.id and user_id <> uid
             and lower(nickname) = lower(btrim(p_nickname))) then
    raise exception 'nickname_taken' using errcode = '23505';
  end if;
  if (select count(*) from public.quiz_players where session_id = s.id) >= 300 then
    raise exception 'game_full' using errcode = '54000';
  end if;
  insert into public.quiz_players (session_id, user_id, nickname) values (s.id, uid, btrim(p_nickname))
  on conflict on constraint quiz_players_pkey do update set nickname = excluded.nickname;
  return s.id;
end $$;

-- lobby → question 0 → reveal → question 1 → … → reveal → finished
-- The host passes the step its screen shows; a stale or repeated call (double click, timer racing a
-- button) changes nothing, so a question can never be skipped by accident.
create function public.quiz_advance(p_session uuid, p_from_status text, p_from_index int) returns text
language plpgsql security definer set search_path = '' as $$
declare s public.quiz_sessions; q jsonb; next_index int;
begin
  select * into s from public.quiz_sessions where id = p_session and host_id = public.classroom_uid() for update;
  if s.id is null then raise exception 'not_your_game' using errcode = '42501'; end if;
  if s.status is distinct from p_from_status or s.question_index is distinct from p_from_index then return s.status; end if;
  select questions into q from public.quizzes where id = s.quiz_id;
  if s.status = 'question' then
    update public.quiz_sessions set status = 'reveal',
      correct_option = (q->s.question_index->>'correct')::int,
      answer_counts = (select coalesce(jsonb_object_agg(choice, n), '{}'::jsonb) from
        (select choice, count(*) n from public.quiz_answers where session_id = s.id and question_index = s.question_index group by choice) c)
    where id = s.id;
    return 'reveal';
  elsif s.status in ('lobby', 'reveal') then
    next_index := s.question_index + 1;
    if q is null or next_index >= jsonb_array_length(q) then
      update public.quiz_sessions set status = 'finished', ended_at = now() where id = s.id;
      return 'finished';
    end if;
    update public.quiz_sessions set status = 'question', question_index = next_index,
      current = jsonb_build_object('text', q->next_index->'text', 'options', q->next_index->'options', 'seconds', q->next_index->'seconds'),
      question_started_at = now(), correct_option = null, answer_counts = null
    where id = s.id;
    return 'question';
  end if;
  return s.status;
end $$;

create function public.quiz_end(p_session uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.quiz_sessions set status = 'finished', ended_at = coalesce(ended_at, now())
  where id = p_session and host_id = public.classroom_uid();
  if not found then raise exception 'not_your_game' using errcode = '42501'; end if;
end $$;

-- Correct answers earn 500–1000 points: faster answers earn more. Late or repeated answers are refused.
create function public.quiz_answer(p_session uuid, p_choice int) returns table (accepted boolean, points int)
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.classroom_uid(); s public.quiz_sessions; q jsonb; elapsed numeric; limit_s numeric; ok boolean; earned int;
begin
  select * into s from public.quiz_sessions where id = p_session;
  if s.id is null or not exists (select 1 from public.quiz_players where session_id = s.id and user_id = uid) then
    raise exception 'not_in_game' using errcode = '42501';
  end if;
  if s.status <> 'question' then raise exception 'question_closed' using errcode = '22023'; end if;
  select questions->s.question_index into q from public.quizzes where id = s.quiz_id;
  if p_choice is null or p_choice < 0 or p_choice >= jsonb_array_length(q->'options') then
    raise exception 'invalid_choice' using errcode = '22023';
  end if;
  limit_s := (q->>'seconds')::numeric;
  elapsed := greatest(0, extract(epoch from (clock_timestamp() - s.question_started_at)));
  if elapsed > limit_s + 1.5 then raise exception 'question_closed' using errcode = '22023'; end if;
  ok := p_choice = (q->>'correct')::int;
  earned := case when ok then 500 + round(500 * greatest(0, 1 - least(elapsed, limit_s) / limit_s))::int else 0 end;
  insert into public.quiz_answers (session_id, question_index, user_id, choice, is_correct, points)
  values (s.id, s.question_index, uid, p_choice, ok, earned)
  on conflict do nothing;
  if not found then raise exception 'already_answered' using errcode = '23505'; end if;
  update public.quiz_players set score = score + earned, correct_count = correct_count + ok::int
  where session_id = s.id and user_id = uid;
  return query select true, earned;
end $$;

-- RPC access: signed-in users only.
do $$
declare f text;
begin
  foreach f in array array[
    'classroom_uid()', 'is_teacher()', 'teaches_class(uuid)', 'in_class(uuid)', 'assignment_class(uuid)',
    'join_class(text,text)', 'new_join_code(uuid)', 'grade_submission(uuid,uuid,text,text)',
    'submission_folder_ok(text,boolean)', 'hosts_quiz(uuid)', 'plays_quiz(uuid)',
    'start_quiz_session(uuid)', 'join_quiz(text,text)', 'quiz_advance(uuid,text,int)', 'quiz_end(uuid)', 'quiz_answer(uuid,int)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated, service_role', f);
  end loop;
end $$;
revoke all on function public.classroom_code(int, text), public.valid_quiz_questions(jsonb), public.submissions_reset_grade() from public, anon;
grant execute on function public.classroom_code(int, text), public.valid_quiz_questions(jsonb) to authenticated, service_role;

-- Live updates for quiz screens (Supabase Realtime honours the read policies above).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.quiz_sessions, public.quiz_players, public.quiz_answers;
  end if;
end $$;
