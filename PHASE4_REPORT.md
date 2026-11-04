# Phase 4 implementation and validation — 2026-11-02

Implementation is present; automated validation passes. Browser acceptance remains pending because preview access failed in this execution environment. Phase 5 was not started.

## Baseline

Inspected the standalone React 19 / Vite frontend, its curriculum, reference registry, scientific contracts and guided laboratory components. Reran the existing 20 tests successfully before editing. The original MERN backend, authentication and gel laboratories are intentionally absent. No attempt was made to recreate them. Vite's `resolve.preserveSymlinks: true` is unchanged. No dependencies were added or installed.

## Seven lessons

| Original topic | Interaction and applied reasoning |
| --- | --- |
| 1 Introduction | Compare intact Ac, Ds alone and Ds complemented in trans; distinguish autonomy from current mobility. |
| 2 History and Discovery | Explore maize observations and Ac presence/absence; predict representative Ds dependence and recognize Ds diversity. |
| 3 Anatomy | Compare boundaries, coding/cargo regions and insertion junctions; distinguish TIRs, TSDs and element copies. |
| 4 Classification | Compare Ty, Tn5 and Tn3 pathway schematics; classify by the RNA/DNA intermediate rather than final product or copy count. |
| 5 DNA Transposons | Compare conservative movement, cointegrate formation and resolution; reason about copy number and launch either guided engine. |
| 8 Insertion Sequences | Inspect representative IS10, cargo comparison and functional asymmetry; distinguish transposition functions from accessory cargo. |
| 9 Composite Transposons | Compare inverted IS50/IS10 modules with directly repeated IS1 in classical Tn9; distinguish module architecture from molecular mechanism. |

All 15 topics retain their IDs and numbering. Topics 6 and 7 link to Tn5 and Tn3 respectively. Topics 10–15 have no lesson links and remain planned. A manually entered unavailable lesson route shows an explicit unavailable message.

## Architecture and progress

Lesson content is defined separately from React presentation. Shared components render curriculum navigation, SVG explanatory views, reasoning questions, knowledge checks, feedback, references and summaries. Diagrams do not execute scientific transitions.

Completion requires inspection of all three views plus correct current answers to both questions. Opening a page is insufficient. Wrong answers provide causal feedback and allow retries; changing a correct answer to a wrong answer revokes completion. Inspection and answers are saved as versioned browser-local data, with validated indices, per-lesson reset and an in-memory fallback when storage fails. This is not a secure examination record.

Navigation includes overview, curriculum, individual lesson URLs and both laboratory deep links. The lab route is keyed by experiment so navigating between Topic 6 and Topic 7 selects the correct initial engine. Existing history and simulation behavior remains in the existing components.

## Scientific evidence and limits

Reused McClintock (1950), the 2022 Ac macrotransposon paper, Boeke et al. (1985), Berg et al. and the established Tn5/Tn3 records. Added primary records for Halling et al. (1982), IS10 organization, and Alton & Vapnek (1979), Tn9 anatomy. Publisher/author-hosted primary abstracts were verified; some direct PMC/publisher requests were inaccessible, with indexed primary abstracts providing confirmation. Reference URLs and verification status are in the registry.

See `frontend/src/features/transposable-elements/contracts/PHASE4_CURRICULUM.md` for per-topic objectives, terminology, activities, assessment explanations and limitations.

All new molecular maps are symbolic, explanatory and not to scale. No nucleotide sequences, kinetics, exact coordinates or experimental outcomes are invented. Ac/Ds is a selected compatible system, not every Ds derivative. IS10 is not a universal IS template. Whole IS-module orientations are distinguished from short terminal motifs. Tn9 is an architecture example, not a new movement simulation. The Tn3 cointegrate pathway remains qualified; Tn5 donor repair remains unresolved. Scientific engine contracts and fixtures were not changed.

## Files

New:

- `frontend/src/features/transposable-elements/curriculum/lessons.js`
- `frontend/src/features/transposable-elements/lessonProgress.js`
- `frontend/src/features/transposable-elements/Curriculum.jsx`
- `frontend/src/features/transposable-elements/Lessons.jsx`
- `frontend/src/features/transposable-elements/tests/lessons.test.js`
- `frontend/src/features/transposable-elements/contracts/PHASE4_CURRICULUM.md`
- `PHASE4_REPORT.md`

Modified:

- `frontend/src/main.jsx` — lesson routes, curriculum navigation, keyed experiment route, overview link.
- `frontend/src/styles.css` — lesson panels, SVGs, question controls, responsive curriculum and wrapping navigation.
- `frontend/src/features/transposable-elements/Laboratory.jsx` — curriculum links and experiment URL initialization; no scientific calculations changed.
- `frontend/src/features/transposable-elements/curriculum/topics.json` — seven implemented lesson entries with objectives, references and activities.
- `frontend/src/features/transposable-elements/profiles/references.json` — two primary records.
- `frontend/src/features/transposable-elements/tests/contracts.test.js` — planned-status assertion now applies to Topics 10–15 rather than the newly implemented lessons.

Generated: `frontend/dist/` production bundle. Engine files, existing molecular fixtures, Vite configuration and dependency manifests/lockfile are unchanged.

## Verification

| Command/check | Result |
| --- | --- |
| `npm test` before edits | 20/20 passed |
| `npm test` after edits | 24/24 passed, including original engine and guided-flow tests |
| `npm run lint` | Passed |
| `npm run build` | Passed; 53 modules; JS 339.53 kB / gzip 105.72 kB |
| Seven-lesson browser workflows | Blocked; not verified |
| Browser completion/reload/reset and navigation | Blocked; pure progress and URL mappings tested automatically |
| Desktop/mobile layout and scrolling | Responsive CSS implemented; browser validation pending |
| Keyboard and accessibility | Native buttons, radio fieldsets/legends, SVG accessible labels, visible focus and status feedback implemented; runtime checks pending |
| Tn5/Tn3 browser regression | Not rerun successfully this turn; engine and guided-flow tests pass |
| Browser console | Not captured successfully |
| Production deployment | Not performed |

The in-app browser could not claim either its existing tab or a newly created tab (session ownership error). Connected Chrome timed out loading the development server. Vite reported the server on port 5174 because 5173 was occupied. A direct Node request to 127.0.0.1:5174 failed with `EACCES`; PowerShell reported socket access forbidden. No security settings or permissions were changed. No screenshot is supplied because no updated page could be loaded reliably.

## Local review

Run `npm run dev` from the project directory and use the URL printed by Vite. Main review routes:

- `/learn/transposable-elements`
- `/learn/transposable-elements/introduction`
- `/learn/transposable-elements/discovery`
- `/learn/transposable-elements/anatomy`
- `/learn/transposable-elements/classification`
- `/learn/transposable-elements/dna-diversity`
- `/learn/transposable-elements/insertion-sequences`
- `/learn/transposable-elements/composite`
- `/lab/transposable-elements?experiment=tn5`
- `/lab/transposable-elements?experiment=tn3`

Pending browser acceptance: visit every lesson, try wrong/correct answers, inspect all views, confirm completion appears only after all conditions, reload for persistence, reset one lesson, navigate between both lab links, run both engines/history controls, inspect console output, and check 320px/390px/desktop layouts and keyboard controls. Recheck storage-disabled behavior. Phase 4 should not be represented as fully browser-validated until these checks succeed.

Work stops within Phase 4. No Phase 5 content or Topics 10–15 were implemented.
