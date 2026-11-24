# Testing and validation — 2026-11-02

## Current prerequisite verification (supersedes historical blockers below)

Dependencies and lockfile are now present. `npm test`: 20 passed; `npm run lint`: exit 0; `npm run build`: exit 0, Vite 7.3.7, 49 modules. The native Windows realpath failure was isolated outside Vite and avoided using its supported `resolve.preserveSymlinks` configuration. No permission or scientific engine changes were made.

The Tn5 and Tn3 guided workflows, checkpoints, TnpR gate, comparison, keyboard inspection, undo/redo/reset/replay, overview navigation and direct-route reload passed manual in-app-browser checks using the existing user server on port 5173. Tested measured widths: desktop 1800 CSS px, mobile 390 and 320 CSS px. A 320px top-navigation overflow was fixed in CSS and rechecked. Captured console warnings/errors: none. Production build passed; browser interactions used the development server. Original gel laboratories are absent, so gel regression remains not applicable. Phase 4 remains on hold.

See the project-root `PREREQUISITE_VALIDATION.md` for evidence, environment limits, changed files and test detail. Historical installation/build/browser blockers below describe earlier runs only.

## Executed

Environment: Windows PowerShell, Node v24.15.0, npm 11.12.1. Node built-in test runner; no dependency installation.

| Check | Result |
| --- | --- |
| Phase 1 contract validation before transition implementation | 5 passed, 0 failed |
| Phase 1 + Tn5 engine and guided rules before Tn3 implementation | 10 passed, 0 failed |
| All TE tests after Tn3 implementation and review | 20 passed, 0 failed |
| JavaScript/JSX syntax | Parsed successfully with an existing Babel parser; not a replacement for lint/build |
| `npm run lint` | Blocked: `eslint` command unavailable; exit 1 |
| `npm run build` | Blocked: `vite` command unavailable; exit 1 |
| Package installation | Approved and attempted; failed with `ENOTFOUND registry.npmjs.org`. Offline fallback failed with `ENOTCACHED` for `@eslint/js`. No packages installed. |
| Desktop/mobile browser validation | Not executed; frontend dependencies unavailable |
| Direct route browser load | Not executed; Vite server not started |
| Existing gel/auth/backend regression | Not applicable: empty initial workspace, none exists |

Phase 1 validation preceded Phase 2 code. Engine and guided-rule validation preceded Phase 3 code. Phase 2 browser validation could not be completed before Phase 3 because packages were unavailable; after approval, installation failed due to registry DNS access; this is an explicit outstanding verification requirement, not a passed check. Implementation continued with the independently testable engine and source files. No phase is accepted as fully validated until the frontend build and browser checks pass.

## Tested invariants

- All 15 topic IDs/numbers and scenario/profile/reference relationships; planned scenarios have no executable actions.
- Coordinate bounds, zero-based half-open to one-based inclusive display, circular L=0, origin-crossing single-ID feature and invalid overlapping segments.
- Independent fixture length/copy expectations, event schema and incompatible state versions.
- Tn5 one-copy movement, stable terminal IDs, target insertion, two external host-derived 9 bp TSDs, unresolved donor fragments.
- Tn3 initial circular pair; one-circle cointegrate with two direct element copies, two internal direct res sites and 5 bp target duplication pair.
- Separate transposition and resolution gates; unavailable TnpR, missing/reversed res, incompatible orientation, malformed topology/junction ordering and repeated operations reject.
- Two circular resolved products, one recombinant copy per product, donor/target backbone coverage and identity, constant resolution length and copy count, target-only TSD retention.
- Frozen-input immutability, source-material coverage (no backbone gaps/overlaps), target-origin-crossing placements, undo/redo/reset, branching histories and deterministic replay with tamper rejection.
- Tn5 prediction gate; Tn3 six stages, two checkpoint gates and exactly two calculated transitions.

## Browser acceptance procedure — pending

After successful package installation in a network-enabled terminal, run lint/build; fix observed failures before accepting the UI. Then use the browser against `npm run dev`:

1. Open `/`, enter the TE laboratory, and refresh the direct `/lab/transposable-elements` route. Confirm no console or runtime errors.
2. At desktop width (~1440px), inspect donor/target, select element/TIR annotations by mouse and keyboard. Verify inspector molecule/feature IDs and one-based labels.
3. Tn5: a wrong answer must block progression; correct answer enables Run transposition. Verify 1 copy, target TSDs and two unrepaired fragments. Compare initial state, replay, undo, redo, reset. Try invalid target boundaries and confirm visible errors without state mutation.
4. Tn3: inspect all six stages. Revisions must remain 0 during explanatory strand transfer/replication, become 1 for completed cointegrate and 2 for resolved products. Inspect two direct copies and two internal res annotations in the cointegrate.
5. At resolution checkpoint, supply wrong then correct reasoning. Disable TnpR, attempt resolution and verify unchanged cointegrate/revision/log; enable TnpR and resolve. Confirm two copies overall, target TSDs and catenation disclaimer. Undo to the cointegrate and redo.
6. Switch between Tn5 and Tn3; confirm independent reset state and mechanism-specific 9/5 bp labels. Curriculum must retain 15 entries and show future topics as planned, without launching placeholder experiments.
7. At 390px and 320px widths, confirm no page-level horizontal overflow, readable labels/controls, accessible focus and all actions reachable. Repeat both workflows. Check reduced-motion preferences.
8. Capture Tn5 insertion, Tn3 cointegrate, resolved products and mobile views. Record actual browser/version and results here. No screenshots have yet been produced.

## Scientific review still required

University review has not occurred. References were checked via primary abstracts/publisher or bibliographic records; full text was not uniformly accessible. Symbolic gene placement, unresolved donor repair, permissive res topology, identity allocation after recombination, and lack of strand/kinetic simulation are deliberate boundaries. No experimental validation is claimed.

## Bench Workflow module (stations 19–22) — 2026-11-24

- **Models.** All the logic is in `benchWorkflow.js`, tested in `tests/benchWorkflow.test.js`:
  - one worked `SAMPLE` threads all four stations: A260 0.75 → 37.5 ng/µL → 3.75 ng template ≈ 1,100 haploid copies → an 850 bp teaching amplicon → EcoRI 300 + 550, HindIII 700 + 150, no BamHI site;
  - the purity cut-offs (A260/A280 < 1.7, ≥ 1.95; A260/A230 < 1.8) are teaching values;
  - the gel uses a schematic log-linear model;
  - the PCR plateau is drawn, not calculated.
- **Benches.** The predict-then-reveal state is in `benchStep.js`. Changing a setting or a prediction clears any shown verdict. Bench markup, SVG labels and CSS rules are tested in `tests/benchComponents.test.js`.
- **References, verified 2026-11-24.**
  - Read in a browser: the QIAGEN bench guide, the Sigma-Aldrich PCR guide, and the NEB EcoRI, HindIII and BamHI pages.
  - Checked via NCBI E-utilities: Saiki 1988 (abstract), Lee 2012 and Duewer 2018 (full text).
  - Dropped: the Thermo NanoDrop purity note, because no readable copy was found.
- **Corrections made while verifying the sources.**
  - Phenol is not named as a low-A260/A280 cause: QIAGEN notes that phenol raises apparent purity.
  - The PCR extension-time control was removed: a 1 min extension covers up to 2 kb, so "15 s is too short for 850 bp" could not be defended.
- **Browser check (Vite dev server, built-in browser).** All four stations were checked:
  - each prediction was revealed and its feedback read;
  - the gel lesson was completed to "Lesson completed";
  - the Lab room and the Station finder list the module;
  - at 375 px there is no overflow, and every control is at least 44 px;
  - there were no console errors.
- **Database.** Contract `siaset-v4` covers 20 lessons and 88 views (v4 rewords station 18's A260/A230 question). The assignment station cap is raised to 64 (migrations `20261124140000` and `20261124140100`).
