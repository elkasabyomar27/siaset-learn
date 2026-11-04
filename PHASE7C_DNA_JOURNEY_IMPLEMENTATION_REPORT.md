# Phase 7C — DNA Journey navigation map

3 November 2026. Implemented locally under explicit Phase 7C authorization. No Git initialization, commit, push or deployment. This is a navigation change, not scientific approval or a public release decision.

## Scope and design inputs

Inspected the React/Vite source and used `PHASE6_LEARNING_ARCHITECTURE_PLAN.md` (especially the Journey proposal), `PHASE7A_TOPIC03_SCIENTIFIC_UX_SPECIFICATION.md` (compatibility, evidence separation and accessibility), and `PHASE7B_TOPIC03_IMPLEMENTATION_REPORT.md` as references. The user's current Phase 7C authorization supplies implementation scope; earlier planning-only gates do not constitute scientific sign-off.

| File | Change |
|---|---|
| `frontend/src/features/transposable-elements/journey.js` | Five conceptual groups keyed by stable topic IDs, ordered stops derived from actual metadata, canonical route resolution, existing completion helper, query-aware current-location matching and native-anchor focus helper. |
| `frontend/src/features/transposable-elements/Curriculum.jsx` | Shared Journey and flat-list rendering from one set of fifteen links. Full map on the curriculum overview; native collapsible disclosure on lessons. Uses the existing subscribed progress reader. |
| `frontend/src/features/transposable-elements/journey.css` | Scoped shallow depth, intertwined decorative ribbons, flat labels, focus outlines, responsive single-column layout and reduced-motion rules. |
| `frontend/src/features/transposable-elements/Laboratory.jsx` | One integration line lets the existing Curriculum toggle open the map directly without a second disclosure. |
| `frontend/src/features/transposable-elements/tests/journey.test.js` | Seven focused automated tests for routes, groups, read-only evidence, rendered accessibility, current/completed separation, focus and motion/responsive rules. |

Review screenshots: `verification/phase7c/desktop-journey.jpg` and `verification/phase7c/mobile-journey.jpg`. Normal validation regenerated `frontend/dist` and may update Vite caches. No package, dependency or package-script changes.

## Implemented behavior

- All original topic numbers, titles and ordering are retained. Each stop shows its number, exact title, lesson/lab type and explicit official completion text. Tn5 and Tn3 links retain `?experiment=tn5` and `?experiment=tn3` respectively.
- The five groups are Recognize an element (01–04), Follow a mechanism (05–07), Read genetic architecture (08–09), Interpret an insertion (10–13), and Place movement in context (14–15). Group questions follow the Phase 6 plan. There are no locks or prerequisites.
- Current location uses a separate text label, border and `aria-current="page"`. It does not imply a completed topic or a live lab molecular state. The existing lab parameter default remains Tn5. Completion is read through the existing `topicCompleted` helper, including recorded guided reviews.
- The overview offers Browse all 15 topics, five native group jump links and labeled Journey map / Flat list radio controls. Group jumps focus their named headings. Hash navigation uses native scrolling/history without smooth scrolling or interception.
- Both views use the same ordered links and statuses, with one topic focus target per destination. Ordered lists retain explicit list semantics, including when list markers are visually removed. Decorative SVGs are hidden from assistive technology and cannot receive focus.
- Static ribbon overlap and shadows create the depth effect; labels stay flat. Only hover border/shadow transitions last 140ms. There is no continuous animation, rotation, camera movement, autoplay, parallax, WebGL or new graphics dependency. Reduced-motion CSS removes transitions and animations. At narrow widths, both views become one column and decorative ribbons are hidden.
- The metaphor limitation is visible: positions, spacing and bends do not represent biological positions, sequence, scale, prerequisites or proficiency. Official completion is also explicitly distinguished from scientific certification.
- The view choice is transient. Reloading or remounting returns to the map view. Existing route scroll restoration handles Back/Forward; no last-visited record was introduced.

## Compatibility

No changes were made to the question bank, lesson evidence rules, progress repository, persistence schemas/keys, scientific engines, lab stages, guided-review recording gates, Topic 03 workbench, assessment, sandbox, dashboard, shared tool navigation or existing previous/next links. The map reads progress and links to destinations; it has no progress-writing API or storage dependency. Existing repository focus/online recovery behavior remains unchanged, including any flushing of previously pending canonical operations.

There are still 13 lesson units and two guided lab units in the 15-topic completion denominator. Browsing does not award inspections, answer questions or record lab completion. Original scientific figures and scientific color meanings remain untouched.

## Validation

Final checks: **78 tests passed, zero failed; lint passed; production build passed.** Seven tests were added to the previous 71-test suite. Build output: 86 transformed modules, approximately 431.07 kB JavaScript (135.60 kB gzip) and 55.62 kB CSS (11.88 kB gzip). These are final output sizes, not a measured before/after bundle delta.

The new tests cover:

1. All fifteen IDs, exact resolved destinations, lab queries and the five-group partition in original order.
2. Current-location matching for every canonical route, lab default/invalid parameters, unrelated query parameters, trailing slashes and non-topic tools.
3. Zero writes while deriving/rendering both views for every topic and focusing group targets against an instrumented repository/storage fixture. Legacy partial anatomy evidence remains incomplete and byte-for-byte unchanged.
4. Identical ordered links in both views, native named radios, focusable group headings, hidden decorative SVGs, unlocked destinations and explicit status text.
5. Native group focus without scroll animation or cancellation of anchor behavior.
6. Rendered completed, incomplete and current labels remaining independent when input records change or reset; lab completion reads the existing validated repository snapshot contract.
7. Responsive, touch-target, focus and reduced-motion CSS safeguards, plus source guards against introducing storage or progress-writing calls into the map/model.

The existing suite continues to verify exact equality of all 25 bank-v1 question objects, route contracts, original completion rules, Topic 03 practice separation, repository replay/reset/concurrency/failure handling, Tn3/Tn5 products, event replay and guided-review gates. Tests emit the previously observed non-failing HMR port 24678 warnings; the final test process exits successfully. Two initial new-test failures were test-harness issues (attribute-order matching and server rendering a client-only external-store hook), resolved before the final pass; no compatibility code was changed to accommodate them.

### Chrome observations

The verified flow is curriculum map → canonical lesson/lab URL → existing page; official status comes from the unchanged local repository. This feature adds no API/backend flow.

| Check | Observed result |
|---|---|
| All map destinations | Clicked all fifteen links and returned using browser Back. All thirteen lessons loaded their expected headings; both lab URLs loaded, with correct experiment-specific route titles. |
| Browsing completion | Starting at 0/15, visiting all stops left the visible summary at 0/15. No required evidence controls were activated. The stronger zero-write assertion is automated with instrumented storage, not browser storage instrumentation. |
| Lab map | Existing Curriculum toggle opened the map directly. Tn3 showed Current location at 07 while official completion remained Incomplete / guided review not recorded. |
| Lesson disclosure | Keyboard Enter opened the anatomy map; Current location was 03 and the original workbench/required-question destination remained present. |
| Group jumps | Clicking and keyboard Enter focused `journey-mechanism` and moved to its heading. |
| Flat alternative | Keyboard Space selected Flat list, with fifteen links and equal full-width rows. Space switched back to Journey map. |
| 320px viewport | Actual CSS viewport 320px; document width about 305px including scrollbar allowance. No map descendant extended beyond the viewport. All checked link/label touch areas were at least 44px high; topic rows were 118–159px high as titles wrapped. |
| History | Browser Back returned to the scrolled Journey position after a lab visit. Existing route restoration was used without modification. |
| Motion | Normal computed transition was 0.14s for border/shadow. Reduced-motion removal is covered by stylesheet assertions; OS-level execution was not tested. |
| Console | No captured warning/error entries in the checked Chrome tab. |

Browser access initially failed because the restricted preview process could not accept connections. The loopback-only preview was restarted with approved execution access and then tested successfully at `http://127.0.0.1:5177/learn/transposable-elements`. It is a local development preview, not a deployment. Temporary viewport emulation was reset after testing. Screenshots show review states, not a learner certification.

## Remaining review blockers and limitations

- Full screen-reader navigation, complete keyboard-only traversal of every destination/tool, 400% browser zoom, OS-level reduced-motion execution, physical touch devices and broader browser coverage remain outstanding. Native controls, accessible names, focus targets, keyboard samples and 320px layout were checked; this is partial accessibility evidence.
- The supported browser tooling exposed viewport control but no reduced-motion emulation capability. CSS assertions and the absence of continuous motion do not replace an OS-level walkthrough.
- Cross-tab progress changes, successful canonical completion, storage denial/quota faults and remote resets were not newly injected in Chrome during Phase 7C. Existing repository tests plus new derived/rendered status tests cover their contracts. No new retention guarantee is claimed.
- Malek / the professor should review the proposed conceptual grouping/questions and metaphor wording for pedagogical clarity. Existing Phase 7B scientific approval blockers remain: invented anatomy inventories, terminal/motif conventions, gene direction/function distinctions, pre/post source relationships, reversed examples, rubrics/distractors and independence wording. Phase 7C grants no approval to those materials.
- No learning-efficacy study or public release assessment was performed. Transient view preferences and existing in-memory route history intentionally do not persist across reloads. Laboratory final-stage next-topic links retain their existing stage-dependent behavior.
