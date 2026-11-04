# SIASET Learn Phase 1 reliability implementation

Implemented locally on 3 November 2026. No deployment performed.

## Result

- REL-01: One application-level repository now owns learner progress used by lessons, curriculum, guided reviews, assessment history and the progress dashboard. Components subscribe through React's `useSyncExternalStore`. Local changes notify the same tab; storage events update other tabs. Existing validation and completion functions remain in use without changes.
- REL-03: Failed reads and failed writes have distinct status. Valid changes remain in application memory across internal navigation and component unmounts. The interface explains that reload/close can lose temporary changes. Retry is available explicitly and on focus, online events, and subsequent valid writes. Recovery reads current persistent records before persisting pending operations.
- REL-02: Laboratory selection derives directly from the query string. Switching pushes browser history and preserves unrelated parameters. The selected laboratory session alone is keyed by the resolved experiment, resetting history, stage, answers, selection, comparison, target boundary, enzyme gate and notices on experiment changes. Same-experiment query changes preserve the session. Missing, invalid and case-mismatched values resolve to Tn5; invalid URLs are left intact until a different experiment is selected.

The molecular engine, teaching content, scientific models, completion rules, CSS and dependencies were not edited. The existing React/Vite/router stack is retained.

## Persistence and concurrency contract

The repository reads the existing `siaset-lessons-v1`, `siaset-guided-labs-v1` and `siaset-assessments-v1` records as its legacy base. New writes use versioned operations under `siaset-progress-op-v1:<random operation ID>`. Legacy records are not rewritten or migrated destructively. Malformed/incompatible envelopes and operations remain untouched; valid portions accepted by the existing validators are still used. This is backward-compatible reading, not support for downgrading to an older application release.

Each operation owns a unique storage key. This replaces a shared read/merge/write envelope, so a successfully persisted update cannot overwrite an independent tab's operation. Web Locks are not needed for that property. It assumes normal localStorage behavior, unique cryptographically generated IDs, and no outside modification or deletion of the operation keys. No claim of a transactional multi-key snapshot, disk-level durability, cross-device synchronization, or compatibility with concurrent old-version writers is made.

Operations are replayed by logical clock, then operation ID for ties. A tab advances its clock beyond operations it has observed. Concurrent conflicting answers therefore converge deterministically, but their order is not guaranteed to match wall-clock time. Inspection evidence is unioned until a lesson reset. Current answers can replace earlier correct answers, so completion is not artificially made permanent. Resets are ordered operations: they clear earlier evidence in that order, and later operations may add evidence again. Assessment attempts have unique operation identities, so retries do not duplicate an attempt; two genuine submissions remain two attempts even if their dates and answers match.

Cross-tab views converge after storage events or a fresh read. Scanning localStorage keys is not an atomic snapshot and can temporarily miss an in-flight operation; event handling and refresh/focus reads reconcile it. Pending memory operations retain their original IDs and logical order on recovery, and merge with persisted operations. If both affect the same answer or a reset, the same deterministic conflict rule applies; temporary changes are not promised to defeat unseen concurrent edits. Memory-only data is per page/tab and does not synchronize across tabs.

Resets clear the displayed logical history; they do not physically erase historic operations or the legacy base. The assessment confirmation text reflects that behavior. There is no automatic compaction in Phase 1. Storage usage, scan cost and replay cost grow with operation count; quota failures fall back to memory. Safe compaction would require a separately designed coordination protocol. Browser eviction or manually clearing site data can remove saved records.

The old storage helper functions in `lessonProgress.js` and `learnerRecords.js` remain available for legacy parsing/testing; all application screens now use the shared repository for learner record reads and writes.

## Files changed

All source paths below are relative to the project root.

| File | Change |
| --- | --- |
| `frontend/src/main.jsx` | Removed duplicate experiment normalization/remount wrapper. |
| `frontend/src/features/transposable-elements/Laboratory.jsx` | URL-authoritative selection, isolated keyed experiment session, shared review recording and status. |
| `frontend/src/features/transposable-elements/Lessons.jsx` | Subscribed shared progress, operation-based interactions/reset, truthful status. |
| `frontend/src/features/transposable-elements/Curriculum.jsx` | Live lesson and guided-review subscriptions. |
| `frontend/src/features/transposable-elements/Assessment.jsx` | Shared submitted attempt history and persistence/fallback status. Unsubmitted drafts remain transient, as before. |
| `frontend/src/features/transposable-elements/ProgressDashboard.jsx` | Live shared records, repository refresh/reset, truthful reset/persistence copy. |
| `frontend/src/features/transposable-elements/progressRepository.js` | New validated operation repository, legacy reads, synchronization, fallback and retry. |
| `frontend/src/features/transposable-elements/useProgress.js` | New React external-store subscription hook. |
| `frontend/src/features/transposable-elements/PersistenceStatus.jsx` | Shared persistence status and retry control using existing UI classes. |
| `frontend/src/features/transposable-elements/experimentRouting.js` | Shared query selection/default helpers. |
| `frontend/src/features/transposable-elements/tests/progressReliability.test.js` | New persistence, concurrency, recovery and legacy compatibility tests. |
| `frontend/src/features/transposable-elements/tests/experimentRouting.test.js` | New query parsing and preservation tests. |
| `PHASE1_RELIABILITY_REPORT.md` | This implementation and verification report. |

The production build also generated `frontend/dist` output and local Vite caches. No package or lockfile changes were needed. This workspace contains no Git repository, so no Git diff or commit is available.

## Verification

- `npm test`: **57 passed, 0 failed**, including all 43 pre-existing tests and 14 new tests. Tests include deliberate interleaving after both tabs have read storage, independently completed lessons, same-answer conflicts, inspection union, scoped resets, stable snapshot references, subscriber cleanup, read/write failure, navigation-equivalent unsubscribe/resubscribe, recovery against unseen persisted progress, legacy lessons/labs/assessments, corrupt/future data preservation, and stable retry IDs.
- `npm run lint`: passed.
- `npm run build`: passed; 72 modules transformed. Final application output approximately 400.26 kB JavaScript / 125.39 kB gzip, with the existing stylesheet output.
- Real Chrome checks against the local Vite app: direct Tn5 load; switch to Tn3 with an unrelated query parameter preserved; refresh retains Tn3; Back returns Tn5; Forward returns Tn3; switching after advancing a teaching stage returns the destination experiment to its initial teaching stage; curriculum link within the laboratory selects Tn3; invalid experiment resolves to Tn5.
- Real Chrome two-tab checks: split exploration and correct answers across tabs on the introduction lesson; both tabs show completion without refresh. Reset in one tab clears completion and answers in the other; reload retains the reset. Progress dashboard renders after internal navigation. No warning/error console entries were returned for the checked learner tab.
- Test learner writes used `http://localhost:5173`, which was initially empty, separately from the pre-existing learner records at `http://127.0.0.1:5173`. Existing learner records at the latter origin were only read during routing checks. Test-origin history was logically reset after the lesson check.

## Verification limits

Storage failure/recovery and forced simultaneous-write interleaving were tested through injected storage/event adapters, not by changing Chrome's storage policy. The navigation fallback test verifies repository lifetime through unsubscribe/resubscribe; actual browser navigation was checked with working storage. No exhaustive browser/device matrix, long-run quota/performance test, crash/power-loss test, or pixel-perfect design audit was performed. Browser screenshot capture timed out twice, so browser evidence is the inspected accessibility state and console results; no screenshot artifact is claimed.

No deployment, remote publishing, dependency installation or backend changes were performed.
