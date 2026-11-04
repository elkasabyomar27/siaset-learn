# SIASET Learn — Phase DB-2 implementation report

4 November 2026 · Local foundation implemented; hosted acceptance blocked pending approved staging resources.

The authorized, feasible local work is implemented and tested. BOTH email/password and Google OAuth have frontend flows. No accessible Supabase project was returned by the connected project's read-only inventory (`projects: []`). This does not prove the account has no projects outside the connection's permissions. No project, region, plan, Google client, SMTP service or domain was provisioned or configured externally. No real student account/data was used, no migration was attempted, and no deployment or Git push occurred. This directory is not a Git checkout.

## Implemented behavior

| Area | Result |
|---|---|
| Optional authentication | `/account`, `/auth/callback`, `/auth/recovery`; email signup/login, Google redirect OAuth, email recovery/password update, local-device sign-out |
| Auth boundary | One pinned Supabase SDK client, PKCE, manual once-only callback exchange, server `getUser` confirmation, callback parameter removal, fixed relative destinations, cross-tab flow lease with Web Locks, generic failures and restart path |
| Anonymous preservation | No learning repository changes. All learning remains browser-only even after sign-in. No implicit account claiming/upload, no account cache or outbox |
| PostgreSQL foundation | Ten owner-scoped public tables; private contract registry; explicit SELECT ownership policies, no anonymous table access, no browser canonical writes; owner-composite FKs, immutable evidence/log/receipt paths |
| Trusted validation | Server imports original index/answer validators, Tn5/Tn3 replay validation and the published assessment scorer. Rejects client owners/completion/score claims, incompatible versions and invalid submissions |
| Transaction RPC | Service-only invoker function with empty search path; locked per-owner head, decimal-string receipt counters, stable retries, ID-reuse rejection, device sequencing, field conflicts, inspection union, reset epochs, immutable lab reviews/attempts, owner rate cap, atomic rollback |
| Edge request adapter | Per-request public Auth verification and separate privileged database client; bounded streaming JSON, exact-origin CORS, no-store responses, no payload logging; writes disabled by default |
| Contract artifacts | Generated trusted validator bundle, full manifest/engine source fingerprint, registry-only seed; no learner seed data |

Implementation and safe local commands are documented in [supabase/README.md](supabase/README.md). The migration was named by the installed CLI, not invented. No schema was applied to a hosted database.

## Verification evidence

| Check | Observed result | Limit |
|---|---|---|
| Existing tests: `npm test` | **82 passed**, zero failed | Existing Vite-based render tests emit HMR port warnings; one transient dependency-scan shutdown warning occurred. Assertions passed |
| New tests: `npm run test:db2` | **11 passed**, zero failed | Auth service responses are synthetic; PostgreSQL runs locally in PGlite |
| Real SQL access controls | Every public table tested as anonymous/owner/other owner; direct INSERT/UPDATE/DELETE and privileged RPC denied to browser roles | Harness supplies synthetic `auth.users`, roles and `auth.uid()`; hosted PostgREST/Auth not exercised |
| Trusted HTTP → validator → database → receipt | Valid synthetic identity committed only its derived owner. Forged token/owner, disallowed origin and oversized body rejected | Injected identity verifier, not real hosted token issuance |
| Evidence compatibility | All 15 topics, exact 55 index domains, deep equality of all 25 assessment objects; valid Tn5/Tn3 replay admitted, altered events/review stages rejected | Does not prove human interactions occurred |
| Transaction behavior | Retry equality; one receipt/application; changed ID rejected; separate attempts preserved; recomputed scores; scoped reset retains history; stale epoch/device/field blocked; bad later batch element rolls back earlier mutations; per-owner rate cap | PGlite serializes transactions; real multi-connection locks/races still require staging tests |
| Auth flow boundaries | Public-key restriction, redirect rejection, lease/storage failure, once-only exchange, parameter cleanup, cancellation, expiry and wrong recovery flow tested | Full Google/email/recovery/session refresh integration pending |
| Frontend lint/build | Both pass | Vite reports a >500 kB main bundle warning; no unrelated bundling redesign attempted |
| Browser UI | `/account` rendered the correct title, configuration-unavailable notice, non-upload explanation and continue-learning link | Configured forms, mobile and full assistive technology review remain pending |
| Browser secret separation | Build scan found no privileged key pattern, server secret variable, commit RPC or trusted-write handler markers | Pattern/static checks complement architecture review; not a claim that arbitrary future environment values are safe |

The preview initially could not be reached from the restricted process. A loopback-only preview on port 5174 resolved this; no external host was exposed or registered. This preview port was not added to Auth/OAuth redirect configuration. Local planned Auth callbacks remain exactly `http://127.0.0.1:5173/auth/callback` and `/auth/recovery` in the local-only config. Hosted redirect choices remain unconfigured.

[Preservation evidence](verification/db2/preservation.json) records a pre-edit baseline of **149 files**, with **143 unchanged** and exactly six intentional edits: `.gitignore`, root `package.json`, frontend package/lock files, `main.jsx`, and `routePresentation.js`. The baseline excludes dependencies, Git/private tool directories and generated `dist`; it is a new measurement, not a claim to reproduce DB-1's different 158-file set. All original scientific engines, 15-topic/55-index curriculum data, full assessment bank fixture, lesson/lab/assessment components, explicit review/prediction/TnpR gates and progress/evidence modules are byte-identical to this session's baseline. No Phase 8B work was performed.

## Current documentation checked

The [Supabase changelog](https://supabase.com/changelog) was fetched on 4 November 2026 and cached at `verification/db2/supabase-changelog.md`. Relevant changes were followed: [CLI v3 local targets and hosted confirmation](https://supabase.com/changelog/supabase-cli-v3), [explicit Data API grants](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically), and the [upcoming TLS cipher change](https://supabase.com/changelog/cbc-tls-ciphers-deprecated). The implementation uses explicit grants and a pinned CLI/SDK. No deprecated server adapter or legacy auth helper was introduced.

Auth/SQL decisions were checked with the connected documentation search and current official guides: [Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [database functions](https://supabase.com/docs/guides/database/functions), and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Supabase, Supabase Postgres, computer-use and verification skills guided the corresponding work.

Pinned additions: browser/Edge SDK **2.119.0**, CLI **3.0.0**, PGlite **0.5.15**. Root install audit reported zero findings. Frontend audit reported **five moderate development-tool findings** in ESLint/minimatch, rooted in [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). These are recorded, not silently remediated through an unrelated major dependency change. No production dependency advisory appeared in that audit response.

## Deliberate limits and DB-1 differences

This is a foundation, not an enabled cloud learning release. The Edge endpoint remains disabled by default and has not been deployed. PostgreSQL executes in disposable in-memory tests; Docker and psql were not available on PATH, so no full local Supabase stack or database advisors were run. There was no authorized staging project for hosted advisors.

Import tables/activation are deferred entirely to DB-3 so incomplete consent scaffolding cannot become an upload route. Account IndexedDB/cache/outbox, consistent snapshot/delta read APIs, owner-switch cancellation, field-conflict UI, offline predecessor references, recovery/restore and retention/deletion workflows remain unimplemented. The account page says this explicitly and does not claim cloud saving. No account progress adapter is connected to canonical callbacks.

Validated lesson records are stored as JSON plus scope/field revisions, rather than separate answer columns. Browser writes are still denied; the original validators define the exact domain. Malformed content is rejected before SQL rather than durably storing invalid raw payloads. Valid conflicts retain immutable receipts. The initial protocol requires in-order device sequences and does not yet implement offline predecessor references or semantic no-op stale answers. These restrictions must be resolved/tested before cloud sync. The proposed cross-device conflict/reset policy is implemented for synthetic tests only; acceptance for learners remains a pre-DB-3 decision.

Explicit review records prove only consistency with the existing replay/gate contract. They cannot prove someone physically clicked the final review control. Raw inspections retain their existing semantics and do not gain proof of prediction interaction.

## Remaining staging gate and required choices

DB-2 is **not accepted for hosted use** until the following are completed on an explicitly approved isolated synthetic target:

1. Approve Supabase organization/owner, staging project name, region/data residency, plan and spend ceiling; confirm production isolation.
2. Inspect the approved target, apply/review migrations and the registry seed, check security/performance advisors, and test actual Data API grants/RLS/RPC denial with synthetic users A/B and anonymous access.
3. Approve Google Cloud/OAuth owner/client, consent audience and synthetic test users, exact app origin/callbacks and Supabase provider callback. Configure only those approved settings.
4. Approve email delivery method and synthetic recipients. Any custom SMTP/domain/provider configuration needs its own details/approval. Keep email confirmation enabled and verify actual received confirmation/recovery URLs.
5. Run real signup/login/recovery/cancellation/expiry/wrong-browser/link-reuse tests, refresh/revocation/sign-out/shared-device checks and same-email provider-linking outcomes. Never merge identities by email in app code.
6. Test the Deno function, gateway signing/key configuration, actual multi-connection transaction races, front-door abuse controls and configured auth accessibility/mobile behavior. Then separately approve any DB-3 policy/scope.

No credentials are requested in this report. Enter privileged values only through secure provider/runtime settings. The user's explicit requirement to approve project/region/plan/provider/domain changes is the reason this external stage remains pending. No skill-based approval requirement was added.
