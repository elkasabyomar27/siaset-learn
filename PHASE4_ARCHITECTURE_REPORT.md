# SIASET Learn — Phase 4 architecture and maintainability

Implemented locally on 3 November 2026. No deployment, publishing, push, dependency installation, or Git initialization performed.

## Baseline and rollback

Inspected the React/Vite project and `PHASE3_LEARNING_UX_REPORT.md` before edits. The existing `PHASE4_REPORT.md` describes an earlier curriculum expansion; it remains untouched. This report covers the requested architecture phase.

The workspace has no Git repository. Before changing source, saved and verified `verification/phase4-architecture/baseline.zip`: 91 original project files with their relative paths, excluding dependency folders, generated builds and prior verification artifacts. `baseline-manifest.json` contains original SHA-256 hashes. Archive SHA-256: `9acd55d547c967207a2af845d4f3049924989beeaf072dfc3b42de0de857a2f0`.

For rollback, stop local previews, extract the archive into a separate folder, verify hashes against the manifest, and copy the original versions of the 13 modified files listed below back into the project. The eight newly added source/test files can then be removed after checking for subsequent user edits. Rebuild `frontend/dist` with `npm run build`. The archive does not contain installed dependencies or a prior generated dist. Do not restore an entire older workspace over newer work without reviewing the file list.

Review aids: `verification/phase4-architecture/changes.patch` (source diff against the archive) and `changed-files.json` (complete source file inventory).

## Changes

### Explicit guided stages

`guidedStages.js` defines stable stage IDs, titles, scientific notes, displayed engine cursors, undo/redo landing stages, checkpoints, actions, labels, and relevant controls. The lab now derives its display and transitions from this metadata. There is no numeric cursor-to-stage ternary or parallel notes array. `learning.js` derives action dispatch and advancement gates from the same metadata, retaining the existing title-list API and numeric stage order for v1 completion evidence.

The original Tn5 landing stages remain inspect/calculate for cursors 0/1. Tn3 remains inspect/cointegrate/resolved for cursors 0/1/2. Explanatory teaching steps create no molecular events. Final review still requires a separate explicit recording action.

### Curriculum and assessment

Each topic has explicit learning-kind/experiment and assessment metadata. Routing and completion dispatch no longer infer laboratories from topic numbers 6 and 7. The assessment bank uses topic metadata for checkpoint selection, additional resolution questions, evidence questions and laboratory references; its IDs, order, wording, options, correct keys and references exactly match bank v1.

Progress totals, percentages, curriculum counts, home-page counts and assessment descriptions derive from the curriculum. `navigation.js` derives neighboring topics from explicit order values, allowing noncontiguous display numbers. Existing lesson IDs, storage versions, scoring, completion evidence and current answers remain compatible.

### Component boundaries and CSS

Extracted the feature inspector/event log, lab evidence, lesson questions/exploration and assessment question/feedback into named components. Session state and side effects remain in their original owning pages. Updated JS formatting in the affected pages/components to make state and handlers easier to review. Applied the React review checklist to component boundaries, hooks, controlled inputs, keys and accessibility.

CSS consolidation is intentionally narrow: removed superseded base declarations for learning navigation, action buttons, lesson headings/text/feedback and selected responsive lesson styles. `theme.css` already supplied the final values at all affected viewport sizes. Structural styles, media breakpoints, scientific styles and theme tokens remain in their original layers. This is not a whole-stylesheet rewrite.

## Files changed

Modified:

- `frontend/src/features/transposable-elements/learning.js` — metadata-driven gates/actions; compatibility title list.
- `frontend/src/features/transposable-elements/Laboratory.jsx` — stage metadata consumption and extracted lab sections.
- `frontend/src/features/transposable-elements/curriculum/topics.json` — explicit learning and assessment metadata.
- `frontend/src/features/transposable-elements/curriculum/lessons.js` — metadata-driven topic routing.
- `frontend/src/features/transposable-elements/assessment.js` — bank assembly from metadata; testable bank builder.
- `frontend/src/features/transposable-elements/learnerRecords.js` — metadata-based topic completion dispatch and derived summary denominator.
- `frontend/src/features/transposable-elements/Curriculum.jsx` — derived count and lab labels.
- `frontend/src/features/transposable-elements/ProgressDashboard.jsx` — derived totals/counts and metadata-based continuation labels.
- `frontend/src/features/transposable-elements/Assessment.jsx` — extracted questions and derived topic count.
- `frontend/src/features/transposable-elements/Lessons.jsx` — extracted activities and navigation helper.
- `frontend/src/features/transposable-elements/routePresentation.js` — consistent JSON import attributes only, preventing a production bundler warning.
- `frontend/src/main.jsx` — derived curriculum/laboratory overview counts.
- `frontend/src/styles.css` — selective removal of obsolete declarations.

Added:

- `frontend/src/features/transposable-elements/guidedStages.js`
- `frontend/src/features/transposable-elements/curriculum/navigation.js`
- `frontend/src/features/transposable-elements/components/LabInspector.jsx`
- `frontend/src/features/transposable-elements/components/LabEvidence.jsx`
- `frontend/src/features/transposable-elements/components/LessonActivities.jsx`
- `frontend/src/features/transposable-elements/components/AssessmentQuestion.jsx`
- `frontend/src/features/transposable-elements/tests/architecture.test.js`
- `frontend/src/features/transposable-elements/tests/assessment-v1.json` — full bank snapshot produced with the archived pre-edit assessment assembly, using unchanged lesson/checkpoint content.

Also added this report and the rollback/review artifacts under `verification/phase4-architecture`; regenerated `frontend/dist`.

Byte comparisons against the archive confirm all molecular-engine files, scientific fixtures, theme/scientific CSS, lesson progress rules, progress repository, manifests and lockfile are unchanged. Existing Phase 1–3 reports remain untouched.

## Verification

| Check | Result |
| --- | --- |
| Baseline suite before edits | 61 passed, 0 failed |
| Final full Node suite | 64 passed, 0 failed |
| New assessment compatibility coverage | Exact full-bank v1 equality; reassigned topic numbers and reordered input retain per-topic items |
| New curriculum coverage | Renumbering does not change routes or lab completion; subset denominator 1/2 = 50%; empty denominator handled; noncontiguous navigation |
| New guided coverage | Every stage agrees with actual engine cursor; checkpoint/final-review evidence gates; undo/redo cursor restoration for both engines |
| ESLint | Passed |
| Production build | Passed without build warnings; 81 modules; JS 406.95 kB / gzip 127.80 kB; CSS 48.76 kB / gzip 10.56 kB |
| Tn3 browser flow | Prediction gate, cointegrate calculation, resolution prediction, TnpR-off rejection, successful resolution and final review |
| Tn3 history | Undo returns to cointegrate inspection; redo returns to resolved products; replay reconstructs both events |
| Tn5 browser flow | Prediction gate, calculated insertion and final review; undo returns to initial inspection and redo to calculation |
| Extracted inspector | Enter on Tn5 feature pill populates the inspector |
| Assessment browser flow | All 25 first options selected through UI; submission reports 3/25, feedback and topic links; saved attempt appears in progress |
| Completion separation | Submitted assessment increases attempts to 1 while topics remain 0/15; finishing labs without recording does not complete them |
| Extracted lesson controls | All three introductory views plus correct current answers complete lesson; changing a correct answer to wrong revokes completion |
| Route presentation | Progress navigation sets descriptive title, H1 focus and scroll 0 |
| Narrow layout sample | Lesson, laboratory and progress: client/scroll widths both 469 CSS px; no page-level horizontal overflow; screenshot inspected |
| Scientific legend colors | Donor 102/183/176; target 109/158/208; element 211/183/117; TSD 199/156/218; res 235/147/109 |
| Production-preview smoke | Built assessment renders 25 items with disabled incomplete submit; guided lab renders correct title and five Tn5 stages |
| Browser console | No warnings/errors in inspected development and production-preview sessions |

## Limits and local test data

- Browser checks are sampled, not an exhaustive device, screen-reader, history-scroll-restoration or every-lesson audit. The viewport tool requested 390px, but the actual measured layout viewport was 469 CSS px; this report does not claim an exact 390px result.
- Initial restricted preview access failed. A loopback-only local preview with the required execution permission succeeded. No network/security settings were changed and no public service was created.
- Node tests still emit the existing non-failing Vite WebSocket port-in-use message from the test environment. All 64 tests pass; production build has no warnings.
- Browser checks created one practice attempt and temporary introductory-lesson answers on the isolated development origin `127.0.0.1:5185`. Guided reviews were not recorded. No deployment records or other origins were reset.
- CSS cleanup deliberately leaves other layered overrides intact. Stage numeric ordering remains a v1 persistence compatibility constraint even though runtime mappings now come from metadata.
- No Git status is available. The archived hashes, source patch and changed-file inventory provide the local review/rollback record.
- No deployment, publishing or push performed.

Screenshot evidence: [Production laboratory](verification/phase4-architecture/production-lab.jpg).
