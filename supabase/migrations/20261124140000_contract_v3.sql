-- Register contract siaset-v3: the learner-write lesson list now includes the
-- Bench Workflow module (20 lessons, 88 views). siaset-v1 and siaset-v2 stay registered so
-- operations already recorded under them keep a valid contract reference.
-- Values must match `npm run build:db2` output (supabase/seed.sql).
insert into private.contract_manifests (version, fingerprint, engine_sha256)
values ('siaset-v3', '016ecb7e6e4d8bad0c05518de3a45897f711a753c47b2e996844e657c45062c9', '4020c786c78ac56e3a9fc7933c57710df241d94505945f7038a7fef9afcac2a5')
on conflict do nothing;
