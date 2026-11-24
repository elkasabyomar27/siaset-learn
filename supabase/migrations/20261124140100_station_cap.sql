-- An assignment may list up to 64 stations. The curriculum now has 22, and the old cap of 18
-- rejected an assignment that ticked them all. 64 leaves room for the next modules while
-- keeping a bound. Same checks otherwise: valid ids, no duplicates.
create or replace function public.valid_station_list(s text[]) returns boolean
language sql immutable set search_path = '' as $$
  select cardinality(s) <= 64
    and coalesce(bool_and(x ~ '^[a-z0-9-]{1,64}$'), true)
    and cardinality(s) = count(distinct x)
  from unnest(s) as x
$$;
