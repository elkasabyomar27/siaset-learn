# SIASET DB-2 foundation

Local implementation only. No hosted project is linked. Do not apply to production or enable learner uploads.

The frontend supports optional email/password and redirect Google OAuth through one PKCE client. With empty configuration, `/account` explains that anonymous learning continues. `frontend/.env.example` accepts only a modern publishable key; privileged keys are rejected. The learning repository remains browser-only even after sign-in. This phase adds no account progress cache, outbox, import, or migration.

## Local checks

From the repository root:

```powershell
npm ci
npm --prefix frontend ci
npm run build:db2
npm run test:db2
npm test
npm run lint
npm run build
node scripts/verify-db2-preservation.mjs
```

`test:db2` creates disposable, in-memory PostgreSQL through PGlite. The harness creates synthetic `auth.users`, roles, and an `auth.uid()` equivalent before applying the actual migration and registry seed. Role/grant/RLS tests run as PostgreSQL roles, not JavaScript mocks. HTTP identity verification is injected with synthetic tokens. No email is sent and no external account is created. This verifies PostgreSQL semantics, not hosted Supabase Auth, PostgREST, Deno deployment, or multi-connection locking.

The Supabase CLI is pinned to 3.0.0. The migration filename was created with `supabase migration new db2_foundation`. Docker/psql were unavailable in this session; no full local Supabase stack was started. Before using any later CLI operation inspect its `--help`; v3 local/remote targeting differs from v2. Never add a remote target or unattended approval flag without approval for that specific external action.

## Trust boundary

`server/validate.js` imports original scientific validators, lesson index/answer domains and the frozen assessment scorer. It rejects owner claims, unknown operation keys, incompatible versions, forged completion/score fields, invalid lab replay and incomplete submissions. New cloud envelopes use UUID operation/device IDs and decimal-string counters. Legacy anonymous IDs and data are not passed through this stricter protocol.

`server/handler.js` bounds streamed requests to 64 KiB before parsing and never trusts decoded token claims. The Edge adapter verifies the bearer through Auth `getUser(token)`, rejects Auth anonymous identities, and derives the owner from that response. A separate per-request service client invokes `commit_learner_batch`. No user Authorization header is attached to that client. CORS permits exact configured origins; it is not authentication. Responses are private/no-store. Raw credentials, answers and evidence are not logged.

The endpoint is **disabled by default**. `SIASET_DB2_SYNTHETIC_WRITES=enabled` is only for an explicitly approved isolated synthetic environment. `verify_jwt=false` in local function config disables gateway verification in favor of explicit handler verification; it does not allow unauthenticated writes. Before deployment verify the actual gateway/key/signing combination. No deployment was performed here.

All ten public tables enable RLS. Authenticated owners receive SELECT only; anonymous users receive no table access; browsers receive no canonical write or commit-function grants. The invoker RPC has an empty search path and service-only EXECUTE. It locks the owner head, issues per-owner sequences, records stable receipts, prevents changed ID reuse, enforces device sequences, applies field revisions and epoch fences, and commits evidence/projection/receipt together. Reset records are retained and do not delete historical attempts. Owner-first composite foreign keys prevent cross-account review pointers. Rate limits cover valid new operations (120 per owner/minute), and transient throttling does not permanently consume an operation ID. Front-door unauthenticated abuse controls remain a staging/deployment gate.

`build:db2` produces the Edge validator bundle, complete contract manifest with engine source fingerprint, and registry-only `seed.sql`. Neither generated artifact contains credentials or learner data. Rebuild and review these artifacts after source changes. Published contract versions must be immutable; a contract change needs a new version/migration rather than overwriting an existing registry row.

## Deliberate DB-2 boundaries

- Browser callbacks and anonymous evidence are unchanged. No automatic account writes occur on learning or sign-in.
- Lesson projection uses validated JSON records plus scope/field revisions, preserving current field semantics; separate SQL answer columns are not needed at this gate. No writable completion flag exists.
- One new operation per HTTP request; the internal RPC accepts bounded batches. Validated conflicts receive durable receipts. Malformed envelopes are rejected before the database, without storing raw invalid content.
- Ordered offline predecessor references, semantic no-op answer retries, consistent paginated snapshot/delta APIs, account cache isolation, conflict UI, import staging/activation and recovery workflows are deferred. Those are necessary before DB-3/account progress rollout. Device sequence fencing means operations from one device must drain in order.
- Direct owner SELECT is for inspection, not a consistent multi-table sync protocol. PostgreSQL bigint fields from direct reads must not be treated as JavaScript-safe counters. RPC receipts use decimal strings.
- Replay establishes consistency with the existing model; it cannot prove a person clicked Review or physically performed an inspection/prediction. No stronger evidence claim is introduced.

## Approval required for staging

Before provisioning or changing a hosted project obtain explicit approval for the organization, project name, region/data residency, plan and spending limit. Confirm isolation from production and synthetic-only data. Then obtain separate approved Google Cloud project/client ownership, consent/test users, exact app callback origins, provider callback URL, and email/SMTP delivery details. Enter secrets only in provider/runtime settings, never in chat, source, Vite variables or report files.

On the approved target: inspect existing schema first, review/apply migration and registry seed through an authorized path, deploy the disabled function, configure only approved exact redirects, run advisors, then perform real role/PostgREST negative tests and actual synthetic Auth tests. Test signup confirmation, login, recovery, cancellation, expired/reused/wrong-browser links, session refresh/sign-out, same-email provider linking outcomes, and real concurrent connections before accepting DB-2. Also test keyboard/mobile auth UI in the configured environment. No production release or student import follows automatically.
