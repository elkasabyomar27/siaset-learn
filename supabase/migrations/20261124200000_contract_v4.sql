-- Register contract siaset-v4: station 18 (Ethanol Washing) rewords its A260/A230
-- question and explanation, which changes the lesson fingerprint. Same 20 lessons, 88 views.
-- siaset-v1, v2 and v3 stay registered so operations already recorded under them keep a
-- valid contract reference. Values must match `npm run build:db2` output (supabase/seed.sql).
insert into private.contract_manifests (version, fingerprint, engine_sha256)
values ('siaset-v4', '43bd3145b10456786a7424303e32c99a8febd4ffbc574b2f16ed771fb84184b1', '4020c786c78ac56e3a9fc7933c57710df241d94505945f7038a7fef9afcac2a5')
on conflict do nothing;
