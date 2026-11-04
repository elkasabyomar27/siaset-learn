# Phase 7D — Visual Experience Refinement

4 November 2026. Implemented locally in the existing React/Vite project under the user's Phase 7D authorization. **Educational visual draft; scientific approval remains pending.** No scientific sign-off or release-readiness claim. No Git initialization, commit, push, or deployment.

## Scope and exact changes

Inspected the Phase 7B workbench, Phase 7C Journey source/tests, `PHASE7A_TOPIC03_SCIENTIFIC_UX_SPECIFICATION.md`, `PHASE7B_TOPIC03_IMPLEMENTATION_REPORT.md`, and `PHASE7C_DNA_JOURNEY_IMPLEMENTATION_REPORT.md` before implementation. Existing source remains the behavior contract.

| File | Change |
|---|---|
| `frontend/src/features/transposable-elements/Curriculum.jsx` | Five named region classes; narrower static helix backdrop; one concept preview at each station, taken directly from that topic's existing first learning objective; explicit visual-draft/scientific-pending and navigation-metaphor wording. |
| `frontend/src/features/transposable-elements/journey.css` | A continuous paired navigation spine with rungs, numbered station nodes and horizontal connectors to topic links. Dotted connections bridge region boundaries. Five numbered/named regions have distinct accent bands and subtle surfaces. Mobile retains a compact connected spine. Flat list removes the spine and restores inline numbers. Current-location outlines remain independent of completion text. Added forced-colors safeguards; existing focus, 44px controls and reduced-motion rules remain. |
| `frontend/src/features/transposable-elements/components/AnatomyWorkbench.jsx` | Static SVG feature glyphs generated from existing block kinds, labels, roles and orientation marks: ticked host rails, rounded host-repeat bodies with a separate direct-repeat mark, narrow terminal blocks with opposing motif chevrons, broad gene arrows with exact case letters. Added a visible shape key and schematic-backbone caveat. Redundant glyphs remain hidden from assistive technology; the complete existing ordered text/legend and native forms remain available. Exported figure/glyph helpers for focused rendering tests. |
| `frontend/src/features/transposable-elements/components/anatomyWorkbench.css` | A connected horizontal molecular strip at wide desktop sizes; ordered glyph-and-label rows at narrower sizes. Roles use distinct shapes, strokes and labels alongside color. Accessory genes also use a dashed outline. Existing temporary learner-bracket highlighting remains separate from the underlying model. Added forced-colors handling. |
| `frontend/src/features/transposable-elements/tests/journey.test.js` | Added preview parity and named-region/draft-limit checks in both views. Narrowed the existing no-motion guard so `text-transform` is not incorrectly treated as a geometric transform. |
| `frontend/src/features/transposable-elements/tests/anatomyPractice.test.js` | Added rendering regression coverage for all B/U/U2 identities, exact gene labels, coding-arrow reversal, unchanged direct repeat marks, eight redundant nonfocusable SVGs, text inventories, initially absent selection, and the learner's four-inside/four-outside bracket. |

No packages, dependencies, scripts, WebGL, continuous animation, new activity, or progress-writing API were added. Normal build output regenerated `frontend/dist`; Vite may update its caches.

## Preserved contracts

- All 15 canonical topic destinations, original order/titles, and Tn5/Tn3 experiment query parameters.
- All three original anatomy view buttons, evidence callbacks, questions/options/keys/explanations, and completion rules. The original canonical exploration drawing was not replaced; the optional workbench receives the new molecular graphics.
- Exact B, reversed U and parallel U2 case data, gap/source identities, supplied annotations, ten-criterion rubric, hints, retry/support rules and transient draft behavior. Glyph letters remain T/C, V/W and A/Z respectively; reversed genes point leftward while host repeats remain direct/rightward.
- Terminal motifs, coding direction, element reference orientation and host-repeat marks remain distinct. Glyphs assert neither nucleotide sequence, physical scale, biochemical activity, insertion mechanism, nor donor fate. Rail artwork is explicitly schematic, not strand chemistry.
- Existing ordered text equivalents, teaching annotations, named native selects, live feedback, required-question skip links, route focus behavior, navigation alternatives and no-prerequisite browsing.
- The 25-question bank-v1 fixture, evidence repository/persistence, assessments, Tn3/Tn5 engines, labs, and every other topic activity were left unchanged.

## Validation

Final runs: **80 tests passed, zero failed; lint passed; production build passed.** Two focused regression tests were added to the 78-test suite. Existing tests continue to assert exact 25-question fixture equality, all routes, original completion rules, optional-practice storage separation, repository behavior, engine products and guided-review gates. Concurrent tests still emit the previously documented non-failing HMR port 24678 warnings; all checks exit successfully.

Final build: 86 transformed modules; JavaScript 432.89 kB / 136.23 kB gzip; CSS 61.23 kB / 13.06 kB gzip. These are final bundle sizes, not a measured before/after delta.

### Chrome checks

Local preview: `http://127.0.0.1:5179/learn/transposable-elements`. Browser access required restarting the loopback-only preview with execution access that allowed Chrome to connect. It is not a deployment. No API/backend flow was added.

| Check | Observed result |
|---|---|
| All destinations | Clicked each of the 15 station links and used browser Back. All 13 lesson headings matched; both lab links loaded with their exact experiment query parameters. This was route validation, not a fresh walkthrough of every lab stage. |
| Browsing/evidence | Journey stayed at 0/15 officially completed after all visits. A correct optional g2/g6 bracket produced local success while all three original inspections and both required answers remained unrecorded. |
| Desktop Journey | Reviewed at the normal desktop viewport and at 1600×1000. Numbered nodes connect directly to topic links; region headings/questions, previews and completion labels remain legible. |
| Desktop workbench | Reviewed at 1600×1000: all eight features appear in reference order in one strip; host/repeat/end/gene shapes and exact labels are visible on the molecular surface. |
| Reversed case | Fresh U showed V/W and ten empty controls. Automated rendering checks additionally cover U2 A/Z and both leftward gene arrows without reversing host-repeat marks. |
| Keyboard and focus | Enter on a group jump focused its heading; Tab reached the first topic in that group with a visible outline. Space switched the named view radios. Enter submitted Check bracket. Optional panel changes focused the section heading. |
| Flat list | Space selected Flat list with 15 links, inline numbers, no spine, and no measured overflow at 320px; switching back restored Journey. |
| Text alternative | Read diagram as text reached the existing full ordered inventory/legend. Glyphs add no extra focus stops. Native answer controls remain separate from the artwork. |
| 320px | Actual CSS viewport 320px; document width 305px with scrollbar allowance. No measured Journey or workbench descendant extended past the viewport. All ten fresh-case selects were approximately 209.6px wide and 45.6px high. Mobile artwork retains horizontal arrow meanings in explicitly ordered vertical rows. |
| Motion | Computed baseline animation name was `none`. No continuous motion was introduced. Existing CSS removes transitions/animations under reduced motion; OS-level execution was not performed. |
| Console | No captured Chrome warning/error entries in the checked tab. |

Screenshots in `verification/phase7d/`: `desktop-journey.jpg`, `mobile-journey.jpg`, `desktop-workbench.jpg`, and `mobile-workbench.jpg`. These are local review states, not completion or scientific certifications. Temporary viewport overrides were reset after testing.

## Remaining scientific and accessibility review

- Malek / the professor must review the visual conventions and navigation metaphor. Phase 7B's scientific blockers remain: invented generic architectures and exact reversed inventories, motif/recognition terminology, role/direction distinctions, stipulated source relationships, rubric/distractor explanations and limited-independence wording. No scientific approval was inferred from rendering or test results.
- Full screen-reader walkthrough and keyboard-only completion of all four practice tasks, 400% browser zoom, OS-level reduced-motion execution, forced-colors execution, physical touch devices and broader browser coverage remain outstanding. Native semantics, sample keyboard flows, CSS safeguards and 320px measurements are partial accessibility evidence.
- Cross-tab updates, storage faults, canonical completion/reset, and all engine stages were not newly exercised in Chrome in this visual pass; unchanged regression tests cover their existing contracts. No new persistence or retention guarantee is claimed.
- No learning-efficacy study, public-release assessment, or work on other topic activities was performed.
