-- Register contract siaset-v3: the learner-write lesson list now includes the
-- Bench Workflow module (20 lessons, 88 views). siaset-v1 and siaset-v2 stay registered so
-- operations already recorded under them keep a valid contract reference.
-- Values must match `npm run build:db2` output (supabase/seed.sql).
insert into private.contract_manifests (version, fingerprint, engine_sha256)
values ('siaset-v3', '22827c7b0900e66b6de47291b1586b5678032cb616477f16f5f5c5c71c9a87b6', '4020c786c78ac56e3a9fc7933c57710df241d94505945f7038a7fef9afcac2a5')
on conflict do nothing;
