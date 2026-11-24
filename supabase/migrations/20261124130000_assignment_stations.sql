-- Assignable stations: an assignment can list curriculum stations (topic ids), and the class's
-- teacher can read members' progress entries for exactly those stations. Progress itself stays
-- owner-only in progress_ops; this function is the single, read-only window onto it.

create function public.valid_station_list(s text[]) returns boolean
language sql immutable set search_path = '' as $$
  select cardinality(s) <= 18
    and coalesce(bool_and(x ~ '^[a-z0-9-]{1,64}$'), true)
    and cardinality(s) = count(distinct x)
  from unnest(s) as x
$$;

alter table public.assignments add column stations text[] not null default '{}'
  check (public.valid_station_list(stations));

revoke insert, update on public.assignments from authenticated;
grant insert (class_id, title, instructions, due_at, stations),
  update (title, instructions, due_at, stations) on public.assignments to authenticated;

-- Lab stations are recorded by scenario, not topic id. Keep in step with curriculum/topics.json
-- (topic.learning.experiment); adding a lab station means adding a line here and a test.
create function public.station_lab_scenarios(s text[]) returns text[]
language sql immutable set search_path = '' as $$
  select coalesce(array_agg(case x when 'conservative' then 'tn5' when 'replicative' then 'tn3' end)
    filter (where x in ('conservative', 'replicative')), '{}')
  from unnest(s) as x
$$;

-- One row per class member, with that member's matching entries as a JSON array. Returning one
-- row per entry would be silently cut by the API's max_rows limit at ordinary class sizes.
create function public.assignment_station_progress(p_assignment uuid)
returns table (user_id uuid, display_name text, ops jsonb)
language sql stable security definer set search_path = '' as $$
  with a as (
    select id, class_id, stations, public.station_lab_scenarios(stations) as labs
    from public.assignments
    where id = p_assignment and public.teaches_class(class_id)
  )
  select m.user_id, m.display_name, coalesce(jsonb_agg(p.op) filter (where p.op is not null), '[]'::jsonb)
  from a
  join public.class_members m on m.class_id = a.class_id
  left join public.progress_ops p on p.user_id = m.user_id and (
    (p.op->>'type' in ('lesson', 'resetLesson') and p.op->>'lessonId' = any(a.stations))
    or (p.op->>'type' = 'lab' and p.op->'record'->>'scenario' = any(a.labs))
  )
  group by m.user_id, m.display_name
$$;

revoke all on function public.assignment_station_progress(uuid) from public, anon;
grant execute on function public.assignment_station_progress(uuid) to authenticated;
