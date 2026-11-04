# SIASET Learn — Phase 3 learning UX

Implemented and verified locally on 3 November 2026. No deployment performed.

## Changes

- `frontend/src/features/transposable-elements/FeatureNav.jsx`: one visible, underlined current destination with `aria-current="page"` across curriculum/lessons, guided labs, sandbox, assessment and progress. Existing sidebar NavLink states retained.
- `frontend/src/features/transposable-elements/routePresentation.js`: shared route descriptions, including individual lesson titles and URL-selected Tn5/Tn3 lab titles. Defaults follow the existing experiment-routing helper; unrelated query parameters do not represent a new learning page. Trailing slashes are normalized.
- `frontend/src/RouteExperience.jsx`: descriptive document titles; new learning-page navigation focuses the H1 and scrolls to the top. Back/Forward navigation uses session-memory scroll positions for visited history entries. Initial page load does not steal focus. In-page interaction does not trigger route focus management. Listeners and the browser scroll-restoration setting are cleaned up on unmount.
- `frontend/src/main.jsx`: first keyboard link skips to a focusable content container around the existing routed main landmarks. No nested main landmark introduced.
- `frontend/src/features/transposable-elements/Lessons.jsx`: previous-topic links, progress links, a final-lesson assessment link, and explicit explanation that navigation does not complete a lesson. Existing next-topic and lab links retained.
- `frontend/src/features/transposable-elements/Laboratory.jsx`: final-review next steps lead from Tn5 to Tn3, and from Tn3 to Insertion Sequences; progress link and explicit reminder to record the completed review separately. Recording and advancement gates unchanged.
- `frontend/src/features/transposable-elements/Assessment.jsx`: submitted results link directly to history/progress and curriculum.
- `frontend/src/features/transposable-elements/ProgressDashboard.jsx`: curriculum/assessment actions and clearer topic continuation guidance.
- `frontend/src/theme.css`: small additions for skip-link visibility, active learning navigation and transition spacing, using existing brand tokens.
- `frontend/src/features/transposable-elements/tests/learningUx.test.js`: route presentation and rendered current-navigation regression tests.
- `frontend/dist`: regenerated production build.

No new dependencies. No edits to scientific tokens, molecular engine, progress repository, completion rules or assessment scoring.

## Outstanding Phase 2 browser checks

Completed before Phase 3 edits using Chrome on the local development preview. Initially both browsers timed out on the restricted preview. Starting a loopback-only preview outside the network restriction made the site reachable.

- Rendered legend colors: donor `rgb(102, 183, 176)`, target `rgb(109, 158, 208)`, element `rgb(211, 183, 117)`, TSD `rgb(199, 156, 218)`, res `rgb(235, 147, 109)`.
- Calculated Consequence Explorer insertion displayed five static original/result molecule cards, with zero descendant buttons, button roles, tab stops or pressed states. Prediction and calculation controls remained available.
- Laboratory feature-pill activation with Enter populated the feature inspector with Tn5 coordinates and orientation.
- Initial narrow viewport inspection showed no page-level horizontal overflow. More detailed mobile checks followed in the in-app browser after Phase 3.

## Final verification

| Check | Result |
| --- | --- |
| Full Node suite | **61 passed, 0 failed**, including Phase 1 reliability, scientific visual markup, molecular-engine and completion-rule coverage |
| ESLint | Passed |
| Vite production build | Passed; 75 modules transformed |
| Lesson navigation | Specific document title, H1 focus and scroll position 0 confirmed |
| Browser Back | Restored the prior lesson scroll position (3268.33 CSS px), title and H1 focus |
| Skip link | First Tab stop visibly exposed it; Enter focused `main-content`; next Tab entered learning navigation |
| Lab URL/history | Switching to Tn3 updated title/focus; Back restored Tn5 and its selected experiment button |
| Laboratory keyboard | Tab from comparison checkbox reached an SVG feature; Enter populated the inspector. Feature-pill Enter activation also worked |
| Mobile layout | Laboratory, final lesson, assessment and progress showed matching document/client widths and no page-level horizontal overflow at an approximately 390px viewport. Sidebar stacked, lab grid became one column, learning links wrapped |
| Tn5 learning flow | Existing prediction gate and reaction reached final review; new next-step/progress actions appeared |
| Tn3 production flow | Both checkpoints, cointegrate and resolution reached final review; next link opened Insertion Sequences with correct title, H1 focus and top scroll |
| Completion separation | Finishing Tn5 without recording review left topics at 0/15. A submitted preview assessment increased attempts to 1 while topics remained 0/15 |
| Assessment transition | All 25 items answered through UI; submission exposed the new history/progress link, which opened progress successfully |
| Production browser smoke check | Built preview served curriculum, individual lessons, sandbox and Tn3 flow; active navigation/title/focus verified |
| Browser console | No warnings/errors reported in inspected in-app browser sessions |

Screenshots: [desktop lesson](verification/phase3/desktop-lesson.png), [mobile laboratory](verification/phase3/mobile-laboratory.png).

## Limits and notes

- Browser coverage is sampled desktop/mobile coverage, not an exhaustive device or screen-reader audit. Existing molecular cards and the guided stage strip retain their intentional local scrolling.
- Chrome control timed out after responsive testing; subsequent checks succeeded in the in-app browser. The temporary in-app viewport override was reset.
- History scroll positions live in the running app only; they are not persisted across reloads. Existing unfinished lab sessions and assessment drafts retain their existing persistence behavior.
- One test assessment was stored in the temporary local development origin at `127.0.0.1:5181`; no real deployment records were accessed or reset. Guided reviews were not recorded by browser checks.
- The test runner emitted a non-failing Vite development WebSocket port-in-use warning while previews were running. All 61 tests completed successfully; production build completed without that warning.
- The workspace has no Git repository, so Git status/diff is unavailable. The file list above records the changes made in this phase.
- No deployment or external publishing was performed.
