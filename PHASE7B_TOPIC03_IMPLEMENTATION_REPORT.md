# Phase 7B — Topic 03 optional anatomy workbench

3 November 2026. Implemented locally under the user's explicit Phase 7B authorization. **Educational draft models and provisional rubrics; scientific approval by Malek / the professor remains pending. No public release readiness claim.**

Design inputs: `PHASE7A_TOPIC03_SCIENTIFIC_UX_SPECIFICATION.md` (the more detailed contract) and `PHASE6_LEARNING_ARCHITECTURE_PLAN.md`. Source was inspected before editing. No Git initialization, commit, push or deployment was performed.

## Exact implementation scope

| File | Change |
|---|---|
| `frontend/src/features/transposable-elements/anatomyPractice.js` | New pure teaching-case data, semantic gap/source keys, boundary/gene/junction/ten-criterion rubrics and transient reducer. Includes B, reversed U and parallel U2. No storage or repository imports. |
| `frontend/src/features/transposable-elements/components/AnatomyWorkbench.jsx` | New optional four-section workbench, direct navigation, static maps, pre/post source inventory, complete ordered text equivalents, native labeled selects, Check feedback, field links, progressive hints, supported retries and clear answers. |
| `frontend/src/features/transposable-elements/components/anatomyWorkbench.css` | Scoped responsive layout, 44px controls, focus treatment, separate motif/gene/repeat marks, readable molecular surface using existing theme tokens, and reduced-motion rules. |
| `frontend/src/features/transposable-elements/Lessons.jsx` | Anatomy-only evidence summary, optional workbench and required-question jump targets. The existing Reset action still calls the repository and additionally clears local workbench drafts through a ref. All original exploration and question callbacks remain in place. |
| `frontend/src/features/transposable-elements/tests/anatomyPractice.test.js` | Seven focused automated tests for rubrics, transient state, storage separation and rendered accessibility structure. |

Review artifacts: this report and `verification/phase7b/desktop-workbench.jpg`, `mobile-workbench.jpg`, `mobile-controls.jpg`. The normal build also regenerates `frontend/dist` and Vite may update its local cache; neither is an additional application behavior change. No dependencies or package scripts were added.

## Implemented behavior

- Boundaries: all nine gaps, missing/equal/reversed validation, per-end verdicts, and named host/internal inclusion differences for every ordered pair. The correct bracket is g2–g6, not inferred from pixels. Learner selections are labeled and initially unset.
- Genes: function and coding direction are checked separately for T and C. A wrong direction receives a gene-specific coding-arrow cue and the same explanation in the text inventory; terminal motif marks are not cued as gene direction.
- Insertion junction: before/after text and map evidence, two independent source selectors permitting J1 twice, and a separate count selector for the displayed product only. Shared interval identity does not imply shared atoms or a calculated reaction.
- Reversed practice: U uses X0–X7, u0–u8 and U0–U2. Parallel U2 uses alternative Y0–Y7, v0–v8 and V0–V2 with P/s/Q, D/A/Z/E. Each requires both boundaries, both source identities, one element, both gene functions, both coding directions and the reasoning statement. Host repeats retain rightward direct marks while genes point leftward.
- Only a complete first correct, unhinted case submission receives “Solved this fresh example without hints.” Missing fields do not consume an attempt. Any requested hint or prior complete submission makes subsequent correct results supported review. No mastery score is created. Switching cases clears their answers; revisited cases retain session exposure. Both cases are described as structurally similar, and reload never proves novelty.
- Panel switching preserves drafts. Editing clears stale verdicts. Clear practice answers clears drafts/feedback/hint display but retains support/exposure history. Local lesson Reset also clears practice; remote repository changes leave it intact. Unmount/reload discards workbench state. No draft query parameters or browser-storage keys exist.
- Every new practice figure visibly carries the draft/scientific-pending caption and limitations. No actual sequence, scale, donor repair, enzyme activity or pathway is asserted. Original lesson limitations and references remain accessible.

## Compatibility and validation

`npm test`: **71 passed, zero failed**, including seven added tests. Existing assertions confirm all 15 topic identities/destinations, exact 25-item bank-v1 fixture equality (IDs/order/options/keys/references), original completion rules, repository replay/concurrency/failure handling, Tn3/Tn5 scientific engines and guided review gates. These are automated contract checks, not a claim that all 15 routes received a new manual browser walkthrough.

The seven added tests cover all 81 boundary pairs, each independent-case criterion separately in both cases, function/direction separation, source reuse, missing/invalid values, prior wrong/correct submissions, hints, panel changes, case switches, answer clearing, returning legacy evidence, remote resets, subsequent canonical writes, and native labels/status/skip targets in server-rendered markup. All modeled practice actions produce zero storage writes; import/API guards ensure the workbench has no progress-writing dependency. The cross-tab state test exercises the repository and reducer separately; actual mounted behavior was also checked in Chrome below.

`npm run lint`: **passed**. `npm run build`: **passed**. The final bundle is generated by Vite, with no new dependency. Concurrent server-rendered tests emit non-failing `Port 24678 is already in use` HMR warnings; the test suite still exits successfully. Existing test infrastructure was not changed to address that unrelated warning.

### Chrome checks performed

The story checked was anatomy route → optional native controls → in-memory rubric feedback, alongside original evidence controls → unchanged local repository → refreshed evidence summary. There is no API/backend request in the new practice flow.

| Check | Observed outcome |
|---|---|
| Fresh route | Three original controls, original two questions and all 15 curriculum links available; no inspection or answers awarded by preview. |
| Missing and wrong bracket | Named missing-field links; host-repeat inclusion and missing-terminal feedback; Check retained focus. |
| Correct bracket | Correct local verdict; official evidence unchanged. |
| Gene direction error and correction | Function remained correct while direction was marked wrong; correction yielded local success. |
| Junction | Both source selects accepted J1 simultaneously; count one yielded local success. |
| Reversed U | All ten criteria correct on first complete unhinted submission yielded the specified local label. Rechecking the same case yielded supported review. |
| Parallel U2 | Started with ten empty fields; hint use followed by correct submission yielded supported review. Returning to Boundaries preserved its draft. |
| Cross-tab partial evidence | Original Boundaries/Insertion junction and exercise actions in a second tab updated the first tab’s real summary without changing its g2/g6 practice draft. |
| Canonical completion | Original Genes and original check completed the lesson; optional practice had left it incomplete beforehand. |
| Remote versus local reset | Remote Reset cleared official evidence while the first tab kept g2/g6. Local Reset then cleared the first tab’s practice fields. |
| Navigate to another lesson and Back | Original partial evidence returned; practice fields started empty. |
| Narrow layout | At an actual 320px CSS viewport, page width was 305px with scrollbar, no workbench child extended beyond the viewport, and all ten fresh-case selects fit at about 210px wide and 45.6px tall. Keyboard Home/ArrowDown selected u2; Enter on Check submitted validation. |
| Desktop | Reviewed a 1600×900 viewport with eight ordered blocks in one row and visible draft caption. Corrected an initially observed theme contrast collision; verified figure text rgb(223,232,236) on rgb(14,20,25). |
| Console | No warn/error entries captured in the checked tab. |

Preview test evidence was reset afterward in the isolated local preview origin. Screenshots may show intermediate QA evidence, not a saved learner certification. The local development preview is on `http://127.0.0.1:5176/learn/transposable-elements/anatomy`; it has not been deployed.

## Scientific approval blockers and limits

Before any scientific approval or public release decision, Malek / the professor must approve the invented expanded architecture, terminal/motif notation, distinction between gene and element orientation, stipulated pre/post source relationships, T/C role annotations, both reversed inventories, all ten criteria and distractor explanations, and limited independence wording. No scientific sign-off was inferred from source behavior or tests.

Accessibility evidence is partial: native controls, accessibility-tree names, text equivalence, visible contrast/focus, sample keyboard operations and 320px layout were inspected. A full screen-reader walkthrough, keyboard-only completion of all four tasks, 400% browser zoom, OS-level reduced-motion execution and broader device/browser testing remain outstanding. Reduced-motion CSS is present and all diagrams are static; this does not substitute for those manual checks.

Blocked reads, quota failures, damaged/future records and deterministic conflicting-operation ordering are covered by the existing repository tests; live browser fault injection was not performed. No claim of a new evidence retention guarantee is made. Drafts intentionally disappear on navigation/reload, and local exposure history cannot establish lifetime novelty. Learner usability/efficacy observations and the separate public release decision remain outside this local implementation.
