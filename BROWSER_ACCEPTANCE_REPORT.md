# SiaSet browser acceptance — Phases 4–6

Date: 2026-11-02. Target: existing server at `http://127.0.0.1:5173`.

**Result: core interactive flows passed; one progress-display inconsistency failed; accessibility/device coverage has limits listed below.** This is development-server acceptance, not production deployment validation.

## Session and scope

Attached successfully to the existing Google Chrome tab titled SiaSet — Transposable Elements Laboratory, initially at `/`. Followed its TE curriculum link. No Vite server was started or stopped. No application source, scientific engine, dependency or configuration was changed. Only this report was created.

Testing used real visible controls, DOM/accessibility observations, browser reloads, screenshots, viewport overrides and captured console logs. No hidden React state or localStorage values were injected. Test answers and inspections were entered through the UI, so browser learning records now include acceptance-test progress. Topic 15 was completed, reset, then partially exercised again for keyboard testing; other lesson completions were retained. No previous browser records were bulk-cleared.

## Curriculum and lesson results

All 15 links were present in original order. Every linked route loaded. The 13 lesson pages were exercised to their visible “Lesson completed” state. Each exploration button was operated, every prediction-driven context was correctly classified, and all required question groups were answered through native radio controls. Incorrect options were retried using the displayed explanatory feedback.

| Topic | Browser result | Exploration coverage |
| --- | --- | --- |
| 1 Introduction | PASS | 3 views; wrong-answer feedback, completion, reload persistence |
| 2 History and Discovery | PASS | 3 views and both question groups |
| 3 Anatomy | PASS | 3 views and both question groups |
| 4 Classification | PASS | 3 views and both question groups |
| 5 DNA Transposons | PASS | 3 views and both question groups |
| 6 Conservative Transposition | PASS | Tn5 laboratory, detailed below |
| 7 Replicative Transposition | PASS | Tn3 laboratory, detailed below |
| 8 Insertion Sequences | PASS | 3 views and both question groups |
| 9 Composite Transposons | PASS | 3 views and both question groups |
| 10 Genomic Consequences | PASS | 4 contexts; prediction reveals and assessments reached completion |
| 11 Phenotypic Consequences | PASS | 4 contexts including conditional/undetermined outcomes |
| 12 Gene Expression Effects | PASS | 5 contexts and all three assessment groups |
| 13 Target-Site Duplication | PASS | 3 contexts, engine-derived molecular displays and assessments |
| 14 Regulation | PASS | 6 contexts and all three assessment groups |
| 15 Bacterial TE/HGT | PASS | All 12 contexts, including calculated transfer, blocked transfer and targeting classifications; applied question and two checks |

Total lesson exploration coverage: 55 views/contexts across 13 lesson pages. Completion was verified as an actual rendered status, not inferred from page access or automated test results. This is functional browser coverage, not independent scientific peer review of every explanation.

## Guided laboratory results

| Check | Result / observed evidence |
| --- | --- |
| Topic 6 deep link | PASS — selected Tn5 and initial separate DNA |
| Tn5 wrong prediction | PASS — choosing two copies kept Run transposition disabled |
| Tn5 correct prediction and transition | PASS — target insertion, one element overall, 9 bp target repeats displayed |
| Keyboard feature inspection | PASS — Enter on Left TIR opened inspector relationship “Internal to” |
| Tn5 comparison | PASS — Compare initial state revealed INITIAL STATE and current diagrams |
| Tn5 undo/redo | PASS — undo returned Separate DNA; redo restored the calculated event |
| Tn5 replay | PASS — status: “Replayed 1 molecular event(s). State reconstruction matches the recorded result.” |
| Tn5 reset | PASS — reset returned initial state; repeat run reached Experiment reviewed |
| Topic 7 deep link and experiment switch | PASS — Tn3 initial state and guided steps rendered |
| Tn3 wrong prediction | PASS — incorrect one-copy/separate-circle prediction blocked Continue |
| Cointegrate calculation | PASS — one cointegrate state, 02 copies and 5 bp target repeats displayed |
| TnpR unavailable | PASS — resolution alert: “TNPR: TnpR resolvase must be available; cointegrate remains unchanged.” State summary remained Cointegrate / 02 |
| Resolution with TnpR | PASS — Resolved products / 02 displayed |
| Tn3 undo/redo | PASS — undo restored Cointegrate; redo restored resolved state |
| Tn3 replay | PASS — status confirmed reconstruction of 2 molecular events |
| Tn3 reset | PASS — Separate DNA / 01 initial donor copy returned |

The browser results verify observable state transitions and controls; they do not replace the molecular invariant tests already recorded in phase reports.

## Completion and persistence

- PASS: new/uncompleted pages showed “Evidence still to review.” Opening pages alone did not complete them.
- PASS: all 13 lessons reached completion only after exploration and assessment interaction.
- PASS: Topic 1 and Topic 15 remained completed after full browser reloads; subsequent direct route visits retained completed badges for the earlier lessons.
- PASS: changing Topic 1's correct applied answer to “Autonomous now” revoked completion. Restoring the correct answer restored completion.
- PASS: Reset this lesson on Topic 15 removed its completion; reload preserved the reset. Other completed lessons remained completed.
- FAIL: the guided laboratory curriculum panel does not display saved lesson completion. After Topic 1 was restored to Completed on the lesson page, opening Topic 7's Curriculum panel showed “01 Introduction to Transposable Elements Interactive lesson.” The lesson curriculum itself continued to show Completed. This is a display inconsistency, not observed loss of saved records. No fix was made during this acceptance task.

## Responsive layout, keyboard and console

PASS: all 15 routes loaded under both mobile viewport overrides. No document-level horizontal overflow was measured:

| Requested browser override | Observed layout viewport | Document widths |
| --- | --- | --- |
| 390 × 844 | innerWidth 355; clientWidth 341 | scrollWidth 341 on every route |
| 320 × 740 | innerWidth 291; clientWidth 277 | scrollWidth 277 on every route |
| 1440 × 900 desktop curriculum | innerWidth/clientWidth 1309 | scrollWidth 1309 |
| Default restored desktop | innerWidth 942; clientWidth 928 | scrollWidth 928 on observed lab page |

Browser devicePixelRatio was approximately 1.1; requested override sizes therefore were not the measured CSS widths. These are browser-emulated responsive checks, not physical mobile-device tests. Scrolling and locator-driven navigation reached lower controls and feedback. Mobile screenshots showed the laboratory and stacked Topic 15 controls. Desktop curriculum card geometry was within the measured viewport. A desktop screenshot did not include the entire emulated right edge of the page, so that capture alone is not evidence of full visual coverage.

PASS: keyboard Enter activated a laboratory feature inspector. On narrow Topic 15, ArrowDown/Enter selected the native scenario option, Enter on Test reasoning produced Supported feedback, Space checked the applied radio, and Tab moved focus to the next radio group. DOM confirmed the selected radio was checked and focused. Native labels, fieldsets and status text were present in accessibility snapshots.

PASS: captured Chrome console query for warnings/errors returned an empty list after lesson testing and again after lab/mobile testing. No captured application warning or error was observed. Expected TnpR validation feedback was an inline application alert, not a console error. This statement is limited to logs captured for the attached session.

## Blocked or incomplete coverage

| Check | Status / limitation |
| --- | --- |
| Existing Chrome session | Accessible; earlier preview-access blocker did not recur |
| Lab curriculum completion badges | FAILED as described above |
| Physical touch/mobile devices | NOT TESTED — browser emulation only |
| Screen-reader announcements, full keyboard-only journey and focus audit | PARTIAL — representative native controls and accessibility structure checked, not a complete assistive-technology audit |
| Storage denied, corrupt data, private mode and cross-tab synchronization | NOT TESTED in this browser session |
| Exhaustive wrong answer for every scenario | NOT EXHAUSTIVE — wrong feedback was observed and retries exercised, but every possible wrong combination was not enumerated |
| Full visual review of every molecular label at every viewport | PARTIAL — all routes checked for overflow, selected views inspected visually; very small diagram text still needs human mobile readability review |
| External reference pages | Not opened; presence of links checked, not availability of every scientific publisher |
| Production hosting/build artifact | NOT TESTED — existing development server only |

## Remaining manual acceptance checklist

1. Reproduce and resolve the lab curriculum completion-badge inconsistency, then verify saved completion is consistent between curriculum entry points.
2. Check every diagram and long native-select option on real 320/390px-class devices for readability and touch operation.
3. Perform a complete keyboard-only route/lesson/lab journey, including visible focus, native select behavior, radio groups and SVG feature inspection; test status feedback with a screen reader.
4. Test denied storage, private browsing, corrupted stored records and cross-tab progress changes with disposable test data.
5. Exercise every incorrect scenario response if exhaustive assessment acceptance is required.
6. Test a production preview separately before claiming production readiness.

No new server, scientific-engine changes or Phase 7 work was performed. Browser viewport overrides were reset after testing. Existing server remains under user control.

## Completion-badge fix follow-up

The historical failed check above is retained as evidence of the original defect. A source fix has now been implemented; **post-fix browser acceptance is blocked, not passed**.

### Cause and fix

`Lessons.jsx` passed its live `progress` record into `Curriculum`. The laboratory rendered `<Curriculum/>`, whose previous default was an empty object. Its badges therefore evaluated every lesson as incomplete regardless of saved progress.

Added `readProgress` to the existing `lessonProgress.js` module. Both the lesson initializer and the curriculum's default progress now use that reader. It reads the existing `siaset-lessons-v1` key and delegates validation to the existing `parseProgress`. `Curriculum` continues to use the existing `isComplete` function. The live lesson prop still takes precedence. The laboratory's curriculum loads current saved records when rendered, including after navigating from a lesson or reopening the panel. No new storage subscription or cross-tab synchronization guarantee is introduced.

The reader is read-only, catches inaccessible storage and does not cache records. No progress migration, deletion, new storage key, assessment rule or scientific-engine change was made.

Files modified: `lessonProgress.js`, `Curriculum.jsx`, `Lessons.jsx` under `frontend/src/features/transposable-elements/`, plus this report. Added `tests/progress-reading.test.js`. Production assets were rebuilt.

### Post-fix checks

| Check | Result |
| --- | --- |
| `npm test` | PASS — 35 tests, zero failures, including existing Tn5/Tn3 regressions |
| Shared-reader regressions | PASS — persisted completion, revocation, restoration, isolated Topic 15 record removal, unavailable/malformed storage |
| `npm run lint` | PASS |
| `npm run build` | PASS — 59 modules |
| Topic 1 complete/revoke/restore in both browser curriculum views | BLOCKED — no post-fix UI observation obtained |
| Reload persistence and Topic 15 reset in browser | BLOCKED — not rerun after fix |
| Tn5/Tn3 browser regressions after fix | BLOCKED — automated regressions pass; earlier browser results above predate fix |

Only the existing Chrome tab and server on port 5173 were used. Reload of tab 2099521197 at `/learn/transposable-elements` timed out waiting for CDP `Runtime.evaluate`; a subsequent DOM read timed out on `Emulation.setFocusEmulationEnabled`. Browser tab inventory still listed the same SiaSet URL. Reattaching to that same tab also timed out on `Emulation.setFocusEmulationEnabled` after 10 seconds. This prevented observing the updated application; it does not establish an application failure or a server outage. No replacement server was started, browser process killed, or scientific engine changed.

### Remaining manual verification for this fix

1. On existing port 5173, complete Topic 1 through all three views and both answers. Confirm Completed on the lesson curriculum, then navigate to Topic 7 and open Curriculum; confirm the same badge.
2. Return to Topic 1, choose an incorrect applied answer, and confirm completion is revoked in both views after navigation.
3. Restore the correct answer and verify Completed in both views again. Reload the laboratory and reopen Curriculum to check persistence.
4. Complete Topic 15 if needed, reset that lesson, and verify its completion badge disappears in both views while Topic 1 and other records retain their status.
5. Run Tn5 insertion and Tn3 cointegrate/resolution, including TnpR gate and history controls, to finish post-fix browser regression acceptance.

Phase 7 remains untouched. The implementation is tested automatically, but the original badge failure should be closed as browser-verified only after this checklist succeeds.

## Phase 7 follow-up: badge fix browser-verified

The preceding blocked status is historical. During Phase 7 the existing Chrome connection recovered on port 5173. The laboratory Curriculum panel displayed Topic 1 Completed. Changing the Topic 1 applied answer to an incorrect choice changed its lab-panel badge to Interactive lesson; restoring the correct answer restored Completed, which persisted after laboratory reload. Thus the originally reported completion-badge defect is now **browser-verified fixed** for the observed navigation/reload flow.

New guided-review records also displayed consistently: Topic 6 showed Completed after its explicit final review action, and the dashboard counted both newly recorded Tn5/Tn3 reviews. Prior lesson records were retained. Phase 7 added no scientific-engine changes.

Detailed new-feature acceptance, scoped-reset behavior, keyboard/mobile checks and console evidence are in `PHASE7_RELEASE_READINESS.md`. Final automated checks: 41 tests passed, lint passed, production build passed. Production-host fallback, full assistive-technology testing and physical devices remain outside the verified scope.
