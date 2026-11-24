-- Register contract siaset-v2: the learner-write lesson list now includes the
-- DNA Extraction module (16 lessons, 71 views). siaset-v1 stays registered so
-- operations already recorded under it keep a valid contract reference.
-- Values must match `npm run build:db2` output (supabase/seed.sql).
insert into private.contract_manifests (version, fingerprint, engine_sha256)
values ('siaset-v2', '4872230387fa8a04d78d91aff85117269b4c68c5ac03341ecb8be6469e8513e6', '4020c786c78ac56e3a9fc7933c57710df241d94505945f7038a7fef9afcac2a5')
on conflict do nothing;
