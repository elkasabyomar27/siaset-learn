# SIASET Learn — Phase 5 release-readiness QA

Audited locally on 3 November 2026 (Africa/Cairo). This is the release QA phase following `PHASE4_ARCHITECTURE_REPORT.md`; the older `PHASE5_REPORT.md` concerns curriculum content and is unchanged.

## Release recommendation

**Conditional pass for the tested local application; not an unconditional production sign-off.** No immediate release-blocking functional defect was reproduced in the sampled workflows. No application source, dependencies, storage schema, scientific engine, completion rules or hosting configuration were changed. The production build was regenerated.

Before a long-lived public release, resolve or explicitly accept the unbounded learner-history risk below and verify the real hosting configuration and rollback target. These are release decisions, not failures of the 64-test suite. A bounded pilot has a much smaller storage exposure: the minimum evidence for all 13 lessons is 87 operations, excluding lab reviews, assessments and repeat interactions. No pilot or release was published.

## Prioritized findings and release gates

| Priority | Finding | Result / required action |
| --- | --- | --- |
| P1 — long-lived release gate | Learner operations grow without a bound or compaction; each write scans and replays the history twice. Logical resets add operations and do not recover quota. | **FAIL: bounded storage lifecycle is absent.** Before an unrestricted long-term rollout, approve a retention/recovery design or explicitly accept this limitation for a bounded pilot. Do not delete operation keys or compact them without a concurrency design. |
| P1 — production verification gate | The SPA configuration is correct for a Vercel project rooted at `frontend`, but no remote project settings, deployed headers, asset delivery or rollback deployment were inspected. | **LIMITATION:** verify Root Directory, rewrite behavior, HTTPS and deployment rollback in an authorized release step. Local Vite fallback is not proof of Vercel execution. No deployment was authorized or performed. |
| P2 | Assessment submission disables the focused submit button; the inspected browser then reports focus on `body`. Results are live regions, but keyboard position is not moved to the score. | **FOLLOW-UP:** focus the result heading after submission and restore a useful position on retry; verify with a screen reader. Results and retry remain reachable, so this was not treated as a demonstrated functional release blocker. No scope-expanding UX edit made. |
| P2 | Full dependency audit reports five moderate findings, all in the development dependency chain (`minimatch` and ESLint-related packages). | **FAIL: full audit is not clean.** Production-only audit reports zero findings. Review a compatible toolchain update separately and rerun checks. Do not apply npm's proposed major-version downgrade automatically. |
| P2 | No learner export/import or complete in-app erasure; resets leave historical answers and legacy records physically stored. | **LIMITATION:** document shared-browser privacy and recovery expectations. Design export and complete erasure with cross-tab behavior before promising those capabilities. Browser site-data clearing removes records but is destructive; it was not performed. |
| P2 | Accessibility and device coverage remain sampled. | **LIMITATION:** screen-reader review, browser/device matrix, zoom/contrast and a broader touch-target audit remain necessary before claiming WCAG conformance. |
| P3 | README still describes an early phase and optional Google Fonts, while the current theme uses local system fonts. `.gitignore` excludes `.env` but not all `.env.*` variants. | Update release documentation and ignore rules before any separately authorized repository setup. No environment files or Git repository were found in this workspace. |

There is no newly discovered small P0/P1 source defect requiring a surgical fix. The storage lifecycle work is substantial and requires approval before implementation. No Git initialization, push, deployment, publishing or learner-data migration was performed.

## Verification matrix

| Area | Result | Evidence / limits |
| --- | --- | --- |
| Node test suite | **PASS — 64/64**, zero failures/skips | Includes molecular engines, gates, exact assessment-bank v1 equality, metadata routing, legacy records, concurrent writes, resets, corruption and persistence failure/recovery. |
| ESLint | **PASS** | `npm run lint` from workspace root. |
| Production build | **PASS** | Vite 7.3.7; 81 modules; JS 406,947 bytes (127.80 kB gzip), CSS 48,761 bytes (10.56 kB gzip). No build warnings. |
| Production dependency audit | **PASS — 0 advisories** | `npm audit --omit=dev --json`, saved under `verification/phase5-release`. Point-in-time advisory result, not a security guarantee. |
| Full dependency audit | **FAIL — 5 moderate, 0 high/critical** | `npm audit --json`; underlying advisory: minimatch globparts amplification, GHSA-g3hv-75wg-m249. No packages changed. |
| Production deep routes | **PASS locally / hosting unverified** | HTTP 200 HTML for overview, lesson, assessment, progress, Tn3 lab and sandbox; favicon returns `image/svg+xml`. Browser direct load and reload rendered Tn3. |
| URL experiment/history | **PASS sampled** | Tn3 → Tn5 preserves `qa=phase5`; Back returns Tn3; reload retains selection. Descriptive titles and navigation H1 focus observed. |
| Unknown route | **PASS locally** | `/not-a-route` renders “Page not found”; keyboard activation of return link reaches Overview. SPA response remains HTTP 200 (soft 404). |
| Lesson persistence | **PASS sampled** | All three introductory views activated with Enter/Space; correct answers complete the lesson; reload retains evidence and answers. |
| Cross-tab state | **PASS sampled** | Progress tab shows 1/15 after completion; changing an answer to wrong updates it to 0/15 without reload. |
| Assessment flow | **PASS sampled, focus follow-up above** | Incomplete submit disabled; 25 first options selected through UI; keyboard submission returns 3/25 (12%); progress shows one saved attempt and 0/15 topics. |
| Sandbox | **PASS sampled** | Prediction gate, Tn5 insertion, undo, redo and replay; initial/inserted state and one conserved copy confirmed. |
| Keyboard access | **PASS sampled** | First Tab exposes skip link with 3px focus outline; Enter focuses `main-content`. Tn3 feature pill Enter populates inspector with 701–1000 units and orientation. Lesson buttons accept Enter/Space. |
| Responsive layout | **PASS sampled** | Lab, introductory lesson, assessment, progress, overview and sandbox measured at `innerWidth=320`, document client/scroll widths both 301 (19px vertical scrollbar). No page-level horizontal overflow in those samples. |
| Browser console | **PASS sampled** | No warning/error entries returned for the main production-preview browser tab. |
| Rollback snapshot | **PASS locally** | 95 source/config/public/build files archived and every archive entry verified against SHA-256 manifest. Remote rollback not tested. |

The test runner emits the existing non-failing “WebSocket server error: Port 24678 is already in use” message from a Vite-backed markup test. It does not occur in the production build or sampled production browser console. The suite still exits successfully. No fresh dependency installation was performed; lockfile reproducibility was inspected, not tested with a clean `npm ci`.

## Production routing and Vercel configuration

`frontend/vercel.json` sets `framework: vite`, `installCommand: npm ci`, `buildCommand: npm run build`, `outputDirectory: dist`, and the catch-all rewrite `/(.*) → /index.html`. This agrees with [Vercel's Vite SPA guidance](https://vercel.com/docs/frameworks/frontend/vite). The deployment project must use **Root Directory = `frontend`** so that the lockfile, scripts, output directory and configuration refer to the same application. The workspace-root package only delegates development/build/lint commands and has no root lockfile; deploying with an unintended root is not equivalent.

`BrowserRouter` is used without a subpath basename and built asset paths start at `/assets/`; the current configuration assumes hosting at the domain root. Static assessment/progress/sandbox routes precede generic topic routes. Catch-all UI recovery exists. A missing lesson slug inside the generic topic route shows curriculum plus “Lesson unavailable”; it is recoverable, although its title and heading are less consistent than the global 404 page.

HTTP evidence is in `verification/phase5-release/http-routes.json`. These responses came from the built Vite preview, not a Vercel emulator. Actual CDN cache policy, stale-chunk behavior during releases, missing asset responses, HTTPS/security headers, protected deployment settings and remote Root Directory remain unverified. No `vercel` deployment command was run. A future authorized release check should load and refresh every route family, verify JS/CSS MIME types and favicon, test history/query switching, and test a nonexistent URL on the actual deployment.

## Learner-record compatibility, growth and quota

Reviewed `progressRepository.js`, `lessonProgress.js`, `learnerRecords.js`, the shared hook/status component and existing regression tests. The repository reads legacy `siaset-lessons-v1`, `siaset-guided-labs-v1` and `siaset-assessments-v1` keys without rewriting them; new operations use `siaset-progress-op-v1:<id>`. Completion is recomputed from validated evidence. Current answers can revoke completion. Lab reviews require replay-valid final events and correct checkpoints; assessment scores are recomputed using bank v1. The full pre-refactor assessment-bank equality test passes.

Independent writes use separate keys. Operations sort by logical clock and ID, with deterministic conflict resolution rather than guaranteed wall-clock ordering. Existing tests cover deliberately interleaved writes, reset ordering, pending-write recovery, stable retry identities, malformed/future data preservation and legacy lab/assessment reads. This is backward-compatible reading, not compatibility with simultaneous old-release writers or safe downgrade to a pre-operation repository. Changing a deployment's origin also changes its storage namespace; there is no cross-domain migration.

Every valid repeated inspection, answer change, lab recording, attempt and reset can add another key. `commit()` calls `sync()` and then `flush()`, both of which read the full store; both publish a replayed snapshot. Reads validate historical attempts and replay lab evidence even when later reset operations hide it. Storage events/focus/navigation subscriptions cause further reads. Pending operations also grow in memory while writes remain blocked. Multi-tab activity increases the work. No usage meter, warning threshold, compaction, retention bound or export exists.

Measured synthetic workload (`storage-audit.mjs`, results in adjacent JSON):

| Existing operations | Kind | Estimated key/value UTF-16 bytes after write | Initial read | One new lesson write | `getItem` calls for write |
| --- | --- | ---: | ---: | ---: | ---: |
| 100 | lesson inspection | 39,308 | 1.3 ms | 1.8 ms | 206 |
| 1,000 | lesson inspection | 392,112 | 4.2 ms | 8.6 ms | 2,006 |
| 5,000 | lesson inspection | 1,968,112 | 23.6 ms | 37.2 ms | 10,006 |
| 10,000 | lesson inspection | 3,938,116 | 42.9 ms | 70.2 ms | 20,006 |
| 1,000 | full assessment attempt | 1,670,112 | 27.4 ms | 52.1 ms | 2,006 |
| 5,000 | full assessment attempt | 8,358,112 | 89.3 ms | 154.8 ms | 10,006 |
| 10,000 | full assessment attempt | 16,718,116 | 198.9 ms | 300.9 ms | 20,006 |

These are single-run Node 24.15 timings using an in-memory adapter, not real browser localStorage, mobile measurements, capacity guarantees or statistically stable performance thresholds. The larger seeded datasets deliberately exceed plausible browser capacity to expose scaling. Browser key enumeration, synchronous storage and rendering can add cost; lab-heavy history was not benchmarked. [MDN documents localStorage quotas and quota exceptions](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria); exact key-count capacity cannot be inferred from this estimate.

`quota-check.mjs` adds a byte-limited synthetic adapter. At its configured 5 MiB boundary, a write reports `temporary`, evidence remains in memory, a fresh repository cannot recover the unsaved evidence, and reset/retry cannot free storage. After freeing only the synthetic adapter's unrelated filler, retry persists the original two operation IDs and the reset remains effective on reload. Assertions passed. No browser quota was filled and no real learner data was removed.

The UI truthfully warns about blocked reads/writes and reload loss and offers retry. This prevents a false “saved” claim, but retry cannot create free capacity. A safe follow-up needs an approved storage budget, user-visible recovery/export and a coordinated snapshot/compaction or transactional design that preserves concurrent edits and resets. Skipping semantically redundant writes may reduce growth, but cannot alone bound it. Do not implement naive “keep the last N operations” or physically delete old keys: either can drop evidence or resurrect legacy state.

## Accessibility and responsive observations

There is one main landmark in the inspected lab, labelled learning navigation, native form labels/fieldsets, pressed states for feature controls, live persistence/feedback messages, focus-visible rules, local diagram scrolling and reduced-motion CSS. Selected learning navigation has `aria-current`. Initial route load does not force heading focus; internal destination changes do. Static molecular results omit interactive handlers, roles and tab stops as verified by existing markup tests. Interactive SVG has equivalent feature-pill controls for annotations; assistive-technology behavior across SVG implementations remains to be tested.

At the measured 320px viewport the lesson's diagram region is 231px wide with 560px scrollable content; it is focusable and labelled. The stage strip and molecular cards retain intentional local scrolling. A narrow lab screenshot was visually inspected in the browser tool: stacked sidebar/navigation/metrics and wrapped learning links were readable. Temporary viewport overrides were reset. The tool initially requested 320 but measured 400 due to scaling; only the subsequently measured `innerWidth=320` checks are claimed here. No exact 390px result is claimed.

No screen reader, automated accessibility engine, comprehensive contrast calculation, 200%/400% zoom review, reduced-motion browser emulation or full touch-target matrix was run. Molecular pills have a 30px minimum height; spacing and effective target area deserve review. Assessment submission mounts many feedback status regions and loses button focus, so announcement order and result focus are a concrete follow-up. This report does not claim WCAG compliance or exhaustive keyboard traversal of every lesson.

## Security and privacy

This is a static, browser-only practice application: no backend/authentication, account identifiers, analytics code, fetch calls, telemetry or client secrets were found in the reviewed application source/config. Current typography uses system fonts, and built files contain no source-map outputs. Targeted common private-key/API-token pattern scanning found no matches in source/public/build; this is not an exhaustive secret scan. HTTPS citation links open with `rel="noreferrer"`; no `dangerouslySetInnerHTML`, `eval` or raw HTML injection sink was found in the application source. These are scoped source findings, not a penetration test or assertion about hosting-provider logs.

Stored data includes answer choices, inspected views, guided event evidence and assessment timestamps. It is plaintext, origin-local and accessible to same-origin JavaScript and people using that browser profile. It can be edited or cleared outside the app; scores are not secure credentials. The interface correctly says local practice and no secure certification. Logical reset is not erasure. Browser eviction/private-mode behavior and unavailable storage can remove or prevent records. Reload also discards lab sessions and unfinished assessment drafts by design.

No explicit CSP, frame restriction or additional security headers are configured in `vercel.json`. Hosting defaults were not inspected. Consider a tested CSP and frame/referrer/content-type policies for the actual deployment, taking the generated bundle and any permitted embeds into account. No speculative header change was made during this audit. Full npm audit evidence is saved locally; [the advisory reported by npm](https://github.com/advisories/GHSA-g3hv-75wg-m249) concerns the installed development-tool glob-matching chain, not a demonstrated browser runtime exploit.

## Release snapshot and rollback readiness

Saved `verification/phase5-release/release-snapshot.zip` with 95 files: frontend source/tests, public assets, package/lock/config files, root package/ignore files and the tested generated `dist`. Excludes dependencies, environment files, browser learner storage and earlier verification folders. `release-manifest.json` lists the SHA-256 of every entry; the snapshot script reopened the ZIP and verified all entries and their inventory.

Snapshot archive SHA-256: `7daec428431ba291a9b9e4aa36e74b27abbaf3cddc4d226c1eb881f90964b398`.

The Phase 4 baseline archive still matches its documented SHA-256: `9acd55d547c967207a2af845d4f3049924989beeaf072dfc3b42de0de857a2f0`. It is a **pre-Phase-4** source baseline, not the current release. The new snapshot captures the current Phase 4 application as tested in Phase 5. Neither archive backs up browser learner records.

For a future local restore: stop previews, extract the chosen ZIP into a separate folder, verify its entries against its matching manifest, compare with any later user changes, then restore only the intended files. The new snapshot includes tested dist; rebuilding requires the matching lockfile and dependencies. Validate tests/lint/build and route smoke checks after any restoration. No restore was performed over the workspace.

For a future production rollback: record the deployment identifier, stable domain and a tested prior deployment before release. Roll back application assets/config while preserving learner storage. Use a release that understands operation-v1 records and the same bank/stage contract; rolling back before Phase 1 can hide new evidence or revive legacy history. Do not clear browser records as part of rollback. A destructive migration or record-version change requires a separately approved plan. No remote rollback target is currently documented or tested.

## Scope, evidence and next steps

Read the Phase 1 reliability, Phase 2 visual correctness, Phase 3 learning UX and Phase 4 architecture reports, current routes/components/persistence implementation, manifest/lockfile, Vite/ESLint/Vercel config and relevant tests. The workflow traced was learner UI → validated browser operation → storage/read replay → subscribed lesson/progress UI. There is no API/database boundary in this app.

Only additions are this report and QA evidence/scripts/archive under `verification/phase5-release`; generated dist was rebuilt. Application files and lockfile were left unchanged. Full tests/lint/build were run before the added standalone audit scripts; those scripts do not enter the application bundle or frontend lint scope. The synthetic quota script's assertions passed separately.

Browser writes used the isolated preview origin **`http://127.0.0.1:5192`**: introductory lesson evidence/current wrong exercise answer and one 3/25 practice attempt. Lab feature inspection and sandbox history were transient. No guided review was recorded. Other origins, deployed learner records and the earlier phase test origins were not reset or migrated. Browser observations are tool-visible evidence; no saved screenshot file is claimed for this phase.

Recommended sequence:

1. Decide the release scope and approve a concrete retention/recovery design if long-lived use is required. Preserve the v1 concurrency and completion contracts.
2. Address assessment result focus and screen-reader announcements; run the broader accessibility/device checks and agree on supported browsers.
3. Review the moderate development-tool advisory and make a compatible dependency update in a separate change, with a clean installation and regression checks.
4. Refresh release/privacy documentation and retain the verified source/build snapshot. Git setup remains subject to explicit approval.
5. Only in a separately authorized release step, verify Vercel Root Directory/config/headers and direct-route/assets behavior on the intended host; establish the rollback deployment and smoke checklist before promotion.

No deployment, publishing, repository push, Git initialization, dependency update or data migration was performed.
