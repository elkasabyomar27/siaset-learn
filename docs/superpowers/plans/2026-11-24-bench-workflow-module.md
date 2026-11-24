# Bench Workflow module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Molecular Biology "Bench Workflow" module: four interactive-lesson stations (19–22) that quantify, amplify, run and digest one worked sample.

**Architecture:** The pure logic and the shared `SAMPLE` live in `benchWorkflow.js`. The lesson data lives in `curriculum/benchWorkflow.js` and `benchWorkflowTopics.json`. Each station gets a hand-wired bench component in `Lessons.jsx`, alongside the existing `ConsequenceExplorer` predict-first flow. After that come contract `siaset-v3`, and a migration that registers it and raises the assignment station cap.

**Tech Stack:** React 19 + react-router, Vite, `node --test`, PGlite for the db2 tests, and Supabase migrations.

**Spec:** `docs/superpowers/specs/2026-11-24-bench-workflow-module-design.md`. The spec fixes every number, question, option, variant and outcome string. Copy them from the spec verbatim; this plan does not repeat them.

Paths are relative to the repo root. `TE` = `frontend/src/features/transposable-elements`.

## Global Constraints

- Topic ids, in order 19–22: `dna-quantification`, `pcr-amplification`, `gel-electrophoresis`, `restriction-digest`.
- Module `bench-workflow`, field `molecular-biology`, title "Bench Workflow", basePath `/learn/bench-workflow`.
- Chapters:
  - `measure-amplify` "Measure and amplify": `['dna-quantification', 'pcr-amplification']`;
  - `analyze-product` "Analyze the product": `['gel-electrophoresis', 'restriction-digest']`.
- Field summary: "Bench methods for getting DNA out of cells, measuring it, copying it and cutting it."
- Existing topics, lessons, bank v1, experiments and saved-progress formats stay unchanged.
- Each lesson has `variants` with an `outcome`, plus `exercise`, `check`, `check2`, `references` and `limitations`. Variant counts are 4 / 5 / 4 / 4.
- Teacher quiz import limits: 2–4 options, a question of at most 300 characters, each option at most 120 characters.
- Colours:
  - UI uses `src/theme.css` and `src/ui/lab-shell.css` tokens only.
  - Gel, band and curve colours are new `--scientific-*` variables in `src/scientific.css`, used only inside SVG diagrams.
- Accessibility:
  - targets at least 44px;
  - WCAG AA contrast;
  - SVGs have `role="img"` and an `aria-label` listing every band or value;
  - band animation only under `@media (prefers-reduced-motion: no-preference)`.
- Every bench has "Practice only; it doesn't change lesson completion." and a reveal button that stays disabled until a prediction is chosen.
- The amplicon is described only as "a schematic teaching amplicon, not a real human locus".
- **Ask the user before:**
  - applying a migration to Supabase;
  - redeploying `learner-write`;
  - merging.

  The migration comes before the deploy.

## Review Focus

1. **Every number the learner sees must agree.** The concentration, yield, copies, band and fragments in a handoff card must equal the next station's inputs. Test: the handoff text is built from `SAMPLE` (Task 7). A single test checks the chain `quantify → template copies → product → digest`, in Task 2.
2. **A learner switching a bench option after predicting sees a stale verdict.** Expected: changing any option clears the prediction and the result. This is pinned by pure `benchStep` reducer tests in Task 7.
3. **A partial digest, or a digest with no cutting enzyme, must not produce duplicate or zero-length fragments.** Expected: unique positive sizes, sorted descending. Tests are in Task 5.
4. **Teachers assigning all 22 stations:** the database must accept 22 and reject 65. Tests are in Task 8.
5. **Saved progress from before this change:** stations 1–18 records parse and complete exactly as before. The existing `modules.test.js` progress test is extended to also assert a `restriction-digest` record (Task 6).

---

### Task 1: Verify and add references

**Files:**
- Modify: `TE/profiles/references.json`
- Test: `TE/tests/benchWorkflow.test.js` (create)

**Produces:** reference ids `qiagen-spectro`, `thermo-purity`, `saiki1988`, `sigma-pcr`, `duewer2018`, `lee2012`, `neb-ecori`, `neb-hindiii`, `neb-bamhi`.

- [ ] **Step 1:** Open each source in Claude in Chrome. Automated fetches of NCBI, NEB and vendor pages are blocked. Read the text that supports the `support` claim listed in the spec's references table. Specifically:
  - confirm Duewer's ~3.3 pg per haploid genome, or the bp × 660 g/mol derivation;
  - find the Thermo NanoDrop purity technical note and confirm its list of 230 nm absorbers.

  For any source that can't be confirmed, drop it and soften the claim in the lesson text, or substitute a confirmed source. Record what you did in the commit message.
- [ ] **Step 2: Write the failing test** `new bench references exist and are verified`. For each id above (minus any dropped in Step 1), assert:
  - the entry exists;
  - `citation`, `url`, `support`, `verification` and `verifiedOn` are non-empty;
  - `url` starts with `https://`;
  - `verifiedOn === '2026-11-24'`.
- [ ] **Step 3:** Run `npm test`. Expected: FAIL (the ids are missing).
- [ ] **Step 4:** Add the entries in the existing shape. `verification` states the method, for example "full text verified via PMC (E-utilities)" or "product page read in browser".
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6:** Commit: "Add verified references for the bench workflow module".

### Task 2: `SAMPLE` and quantification logic

**Files:**
- Create: `TE/benchWorkflow.js`
- Test: `TE/tests/benchWorkflow.test.js`

**Produces:**
- `SAMPLE`: `{volumeUl: 50, readings: {a260: 0.75, a280: 0.41, a230: 0.38}, dilution: 10, templateUl: 1, pgPerHaploidGenome: 3.3, ampliconBp: 850, ladder: [100, 200, …, 1000]}`.
- `DS_DNA_NG_PER_UL_PER_A260 = 50`.
- `QUANT_SAMPLES`: four cards `{id, label, a260, a280, a230, verdict}`, with values from the spec table. `verdict` is one of `'pure'`, `'protein'`, `'rna'`, `'low230'`.
- `quantify({a260, a280, a230, volumeUl}) → {concentration, yieldNg, r280, r230, flags}`:
  - `concentration` is ng/µL, rounded to 0.1;
  - `yieldNg` is rounded to 1;
  - `r280` and `r230` are rounded to 0.01;
  - `flags` ⊆ `['protein', 'rna', 'low230']`.
- `verdictFor(result) → 'pure' | 'protein' | 'rna' | 'low230'`. Priority: `protein`, then `rna`, then `low230`, then `pure`.
- `templateCopies(sample = SAMPLE) → number`: the rounded count of haploid copies in the template.

- [ ] **Step 1: Write failing tests:**
  - `quantify(SAMPLE readings, 50)` gives `{concentration: 37.5, yieldNg: 1875, r280: 1.83, r230: 1.97, flags: []}`.
  - Every `QUANT_SAMPLES` card has `verdictFor(quantify(card)) === card.verdict`. The ratios are 1.60, 2.05 and 1.25.
  - Thresholds are exact:
    - r280 1.69 → protein; 1.70 → none;
    - r280 1.95 → rna; 1.94 → none;
    - r230 1.79 → low230; 1.80 → none.
  - Chain test: `templateCopies()` is 1136 (3.75 ng ÷ 3.3 pg). `SAMPLE.ampliconBp === 850`.
  - `quantify` throws on a non-positive `a280`, `a230` or `volumeUl`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (the module is missing).
- [ ] **Step 3:** Implement in `TE/benchWorkflow.js`, with a header comment matching the one in `dnaExtraction.js` (qualitative teaching model).
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: "Add worked sample and quantification model".

### Task 3: PCR logic

**Files:**
- Modify: `TE/benchWorkflow.js`
- Test: `TE/tests/benchWorkflow.test.js`

**Produces:**
- `PCR`: `{defaults: {primers: 'facing', anneal: 56, extension: 60, polymerase: 'taq', cycles: 30}, controls: [...]}`. Same shape as `PRECIPITATION` in `dnaExtraction.js`. The options:
  - primers: `facing`, `same`, `away`;
  - anneal: 45, 56, 72;
  - extension: 15, 60;
  - polymerase: `taq`, `mesophile`;
  - cycles: 10, 20, 30, 40.
- `PCR_OUTCOMES`: keyed `single`, `none`, `extra`, `weak`. Each entry has `{label, tone, text}`, and its label is exactly the spec's outcome string (`single product`, and so on).
- `runPcr(settings) → {gates, outcome, bands}`:
  - `gates` use the `gate(id, label, state, note)` shape with states `open`, `restricted` and `closed`.
  - Outcome rule: any closed gate → `none`. Otherwise extension 15 or cycles 10 → `weak`. Otherwise anneal 45 → `extra`. Otherwise `single`.
  - `bands` is an array of `{bp, intensity: 'strong' | 'faint', schematic: boolean}`:
    - `single` → `[{bp: 850, intensity: 'strong'}]`;
    - `weak` → 850, faint;
    - `extra` → 850 plus schematic 420 and 1300;
    - `none` → `[]`.
  - Cycles 40 gives `restricted` on the cycles gate, with outcome `single`.
- `idealCopies(start, n) → start * 2 ** n`.
- `exactLengthDuplexes(n) → Math.max(0, 2 ** n - 2 * n)`.
- `pcrTable(cycles = 5) → [{cycle, total, exact}]`, counted in duplexes from one template duplex.

- [ ] **Step 1: Write failing tests:**
  - Defaults give `single`.
  - Each spec variant maps to its outcome:
    - `away` → `none`;
    - anneal 72 → `none`;
    - anneal 45 → `extra`;
    - extension 15 → `weak`;
    - `mesophile` → `none`;
    - `same` → `none`;
    - cycles 10 → `weak`;
    - cycles 40 → `single`, with the cycles gate `restricted`.
  - `exactLengthDuplexes`: [1, 2, 3, 4] → [0, 0, 2, 8].
  - `pcrTable(5)` totals are [2, 4, 8, 16, 32].
  - `idealCopies(1100, 10) === 1126400`, which matches the exercise's "about 1.1 million".
  - The check that the outcome labels match the lesson variants lives in Task 6.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: "Add PCR model".

### Task 4: Gel logic

**Files:**
- Modify: `TE/benchWorkflow.js`
- Test: `TE/tests/benchWorkflow.test.js`

**Produces:**
- `GEL`: `{defaults: {agarose: '1', polarity: 'wells-negative', run: 'right'}, controls: [...]}`. The options:
  - agarose: `'0.7'`, `'1'`, `'2'`;
  - polarity: `wells-negative`, `wells-positive`;
  - run: `short`, `right`.
- `GEL_WINDOWS = {'0.7': [300, 12000], '1': [80, 8000], '2': [40, 2500]}`. Each pair is `[lo, hi]` in bp; these are schematic values.
- `RUN_FACTOR = {short: 0.25, right: 0.9}`.
- `migrate(sizeBp, agarose, run) → number`. It returns the fraction of the lane length from the well:

  ```
  RUN_FACTOR[run] * (log10(hi) − log10(size)) / (log10(hi) − log10(lo))
  ```

  The result is not clamped. A value above 1 means the band ran off the gel.
- `GEL_OUTCOMES`: keyed `resolved`, `ranOut`, `floats`, `unseparated`. Labels are the spec outcome strings.
- `runGel(settings, {ethanolLane = false} = {}) → {lanes, outcome}`:
  - `lanes` is `[{id: 'ladder' | 'product' | 'ntc' | 'ethanol', bands: [{bp, pos}]}]`.
  - Outcome: `wells-positive` → `ranOut`, with every lane's bands empty. Otherwise `run === 'short'` → `unseparated`. Otherwise `resolved`.
  - The ethanol lane has no bands, and `floats: true`.
  - `floats` becomes the outcome only when the explorer variant asks for it, through `runGel(defaults, {ethanolLane: true}).outcome === 'floats'`.
- `estimateSize(pos, agarose, run) → bp`. It is the inverse of `migrate`, rounded to the nearest 10.
- `bracket(bp, ladder = SAMPLE.ladder) → [lower, upper]`.

- [ ] **Step 1: Write failing tests:**
  - For every agarose and run, `migrate` is strictly decreasing in size across the ladder plus 850.
  - At 1% and `right`, the product's `pos` lies strictly between the 900 and 800 ladder positions.
  - `estimateSize(migrate(850, '1', 'right'), '1', 'right') === 850`.
  - `bracket(850)` gives `[800, 900]`.
  - The log midpoint `Math.sqrt(800 * 900)` rounds to 849.
  - The outcomes for the four spec variants (`resolved`, `ranOut`, `floats`, `unseparated`).
  - At 0.7%, the 100 bp ladder band has `pos > 1` (it ran off).
  - At 2%, the 850 band has a smaller `pos` than at 1%.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: "Add gel migration model".

### Task 5: Digest logic

**Files:**
- Modify: `TE/benchWorkflow.js`
- Test: `TE/tests/benchWorkflow.test.js`

**Produces:**
- `ENZYMES`:

  ```
  {
    EcoRI:   {site: 'GAATTC', cut: 'G^AATTC', at: [300]},
    HindIII: {site: 'AAGCTT', cut: 'A^AGCTT', at: [700]},
    BamHI:   {site: 'GGATCC', cut: 'G^GATCC', at: []},
  }
  ```

- `SIZE_CHOICES = [150, 300, 400, 550, 700, 850]`.
- `digest(lengthBp, cuts, {topology = 'linear', partial = false} = {}) → number[]`. It returns unique positive sizes, sorted descending.
  - **linear complete:** the differences between consecutive points of `[0, ...sorted cuts, L]`.
  - **linear partial:** every `P[j] − P[i]` for `i < j` over the same points.
  - **circular complete:** the differences between consecutive cuts, plus the wrap-around piece. With 0 cuts it returns `[L]`.
- `cutsFor(enzymeNames) → number[]`: unique sorted positions.
- `fragmentsMatch(predicted, actual) → boolean`: equality of the two sets, ignoring order.

- [ ] **Step 1: Write failing tests:**
  - EcoRI → `[550, 300]`.
  - BamHI → `[850]`.
  - EcoRI + HindIII → `[400, 300, 150]`.
  - HindIII → `[700, 150]`.
  - EcoRI partial → `[850, 550, 300]`.
  - EcoRI + HindIII partial → `[850, 700, 550, 400, 300, 150]`.
  - EcoRI + BamHI equals EcoRI alone.
  - Circular cases: 3000 bp, one cut at 100 → `[3000]`; two cuts at 100 and 1100 → `[2000, 1000]`.
  - Linear with 2 cuts gives 3 fragments.
  - The same cut listed twice does not add a fragment.
  - `fragmentsMatch([300, 550], [550, 300])` is true.
  - Every fragment for every enzyme subset is in `SIZE_CHOICES`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: "Add restriction digest model".

### Task 6: Curriculum data, routes and module wiring

**Files:**
- Create: `TE/curriculum/benchWorkflow.js`, exporting `benchWorkflow` (4 lessons, in the `extraction.js` style)
- Create: `TE/curriculum/benchWorkflowTopics.json` (orders 19–22, in the `extractionTopics.json` shape)
- Modify:
  - `TE/curriculum/lessons.js`: `lessons.push(...phase5, phase6, ...extraction, ...benchWorkflow)`;
  - `TE/curriculum/modules.js`: the new module and the field summary;
  - `TE/curriculum/stations.js`: four `stationCopy` entries. Challenges are the builder's wording. Activities: "Spectrophotometer", "Thermocycler", "Gel rig", "Digest and check";
  - `frontend/src/main.jsx`: the routes `/learn/bench-workflow/:topicId` (inside `TopicWorkspace`) and `/learn/bench-workflow` (redirecting to `/lab#module-bench-workflow`).
- Test:
  - `TE/tests/modules.test.js`: update to 3 modules, `lessons.length` 20, and `adjacentTopics('ethanol-wash').next.id === 'dna-quantification'`;
  - `TE/tests/benchWorkflow.test.js`;
  - `TE/tests/stationDashboard.test.js`: 22 checkboxes, plus a legend `Molecular Biology · Bench Workflow`.

**Lesson content:** objectives, terms, concept, variants (label, blocks, explanation, outcome), the three questions with options, explanations and `correct` index, references, and limitations. All of it comes verbatim from the spec. Concept paragraphs are the builder's wording, built only from facts in the spec. Topic `references` equals lesson `references`, and topic `learningObjectives` equals lesson `objectives`.

- [ ] **Step 1: Write failing tests** in `benchWorkflow.test.js`:
  - `moduleById('bench-workflow')` has the topic ids and chapters from the Global Constraints.
  - `allTopics` orders run 1…22.
  - Every new lesson:
    - has `check2`;
    - has every variant `outcome` set;
    - has variant counts `[4, 5, 4, 4]`;
    - has references that all resolve;
    - mentions "teaching" in the `limitations` of 22 and 20.
  - `topicHref` gives `/learn/bench-workflow/<id>`.
  - `routePresentation` gives the title `<Title> — Lesson 19` and so on.
  - `moduleBanks['bench-workflow'].length === 12`, and every item is within the teacher quiz import limits.
  - Each `correct` answer matches the spec's ✔.
  - The PCR, gel and digest outcome labels from Tasks 3–5 match the outcome set of the variants.
  - Progress: `parseProgress` on a raw record holding the old `introduction` and `ethanol-wash` records plus a full `restriction-digest` record gives completion `true` for the complete ones.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the files listed above.
- [ ] **Step 4:** Run `npm test`. Expected: PASS. `tests/db2/security.test.mjs` now fails on the 16/71 counts; Task 8 fixes that.
- [ ] **Step 5:** Commit: "Add Bench Workflow module curriculum".

### Task 7: Bench components and lesson wiring

**Files:**
- Create in `TE/components/`:
  - `SampleHandoff.jsx`;
  - `GelImage.jsx`;
  - `Spectrophotometer.jsx`;
  - `Thermocycler.jsx`;
  - `GelBench.jsx`;
  - `DigestBench.jsx`;
  - `benchWorkflow.css`.
- Create: `TE/benchStep.js`, the pure predict/reveal reducer.
- Modify:
  - `TE/Lessons.jsx`: wire `lesson.id === '<id>' && <Bench/>`, next to the extraction ones;
  - `frontend/src/scientific.css`: add `--scientific-gel`, `--scientific-band` and `--scientific-ladder`.
- Test: `TE/tests/benchComponents.test.js`. It uses vite `ssrLoadModule`, in the same pattern as `stationDashboard.test.js`.

**Interfaces:**
- **`benchStep(state, action) → state`.**
  - The state is `{settings, prediction, result}`.
  - Actions:
    - `set`: a settings patch; clears `prediction` and `result`;
    - `predict`: sets `prediction`; clears `result`;
    - `reveal`: only with a prediction; sets `result = {…evaluated, correct}`;
    - `reset`.
  - Components pass the evaluate function via `useReducer` init/closure. It is the same reducer for all four benches.
- **`<SampleHandoff from={{title, href}} items={[{label, value}]} />`.**
  - It renders "From the last station" and a link to the previous station.
  - Its `value`s are computed from `SAMPLE`, `quantify` and so on, never typed as literals.
- **`<GelImage lanes={[{id, label, bands: [{bp, pos, intensity}]}]} caption />`.**
  - An SVG with the wells at the top marked "−", and an arrow to "+".
  - Its `aria-label` lists every lane and band size.
  - Bands with `pos > 1` are not drawn, and the label says "ran off the gel".
- **The benches.** Each one follows the `ProtocolBench` layout and classes (`parts-bench`, `pb-goal`, `cb-controls`, `pb-verdict`), plus these parts:
  - **Spectrophotometer:** four `QUANT_SAMPLES` cards. Each has a predict `<select>` of 4 verdicts and a reveal button showing the ratios, concentration and flag text. Then a concentration step: 3 options, with the working shown after the answer.
  - **Thermocycler:** the `PCR` controls; a predict select over the `PCR_OUTCOMES` labels; "Run the cycler"; a verdict with gates and a `GelImage` preview; the `pcrTable(5)` table; the ideal vs schematic plateau chart (SVG). A predict step for the value at cycle 10 comes before the chart is revealed. The plateau curve is labelled with the spec's "schematic" text.
  - **GelBench:** the `GEL` controls; a predict select over the bracket options `700–800`, `800–900` and `900–1,000`; "Run the gel"; `GelImage` with the ladder, product, NTC and ethanol lanes. After the run, an estimate input (number) whose feedback shows the bracket and log midpoint, then ≈ 850 bp.
  - **DigestBench:** enzyme checkboxes; a short-incubation toggle; a multi-select of `SIZE_CHOICES`; "Digest and run" (disabled until at least one size is picked); `GelImage` with the ladder, uncut and digest lanes; feedback from `fragmentsMatch`; the rule card; and the circular try-it (one question, three options, answer "one fragment").

- [ ] **Step 1: Write failing tests:**
  - `benchStep`:
    - `reveal` without a prediction is a no-op;
    - `set` after a reveal clears both the prediction and the result (Review Focus 2);
    - `correct` is computed against the evaluated outcome.
  - SSR markup of each bench:
    - contains "From the last station";
    - its handoff shows `37.5 ng/µL` (Thermocycler) and `850 bp` (GelBench, DigestBench);
    - the reveal or run button has `disabled=""`;
    - contains "Practice only";
    - every `<svg` has `role="img"` and `aria-label`.
  - `GelImage`'s `aria-label` contains "850" for the product lane.
  - `benchWorkflow.css` contains no hex colour, and its animation sits inside `prefers-reduced-motion: no-preference`. Assert by reading the file.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. CSS uses the `var(--…)` tokens only, and every button has `min-height: 44px`.
- [ ] **Step 4:** Run `npm test` and `npm run lint`. Expected: PASS, with no lint errors.
- [ ] **Step 5:** Commit: "Add bench workflow benches".

### Task 8: Contract siaset-v3 and the station cap

**Files:**
- Modify:
  - `server/validate.js`: `CONTRACT_VERSION = 'siaset-v3'`, with the comment updated to 20 lessons and 88 views;
  - `TE/learnerMirror.js`: `CONTRACT_VERSION = 'siaset-v3'`.
- Generated by `npm run build:db2`: `supabase/contract-manifest.json`, `supabase/seed.sql`, `supabase/functions/learner-write/handler.generated.js`.
- Create:
  - `supabase/migrations/20261124140000_contract_v3.sql`: inserts the row from `seed.sql`, in the v2 migration's format and comment style;
  - `supabase/migrations/20261124140100_station_cap.sql`: `create or replace function public.valid_station_list`, with the same body except `cardinality(s) <= 64`.
- Test:
  - `tests/db2/security.test.mjs`: 20 lessons and 88 views; the migration path changes to `20261124140000_contract_v3.sql`;
  - `tests/db2/assignmentStations.test.mjs`: 19 → 65 in the rejection case, plus an accepted 22-station list from `allTopics.map(t => t.id)`;
  - `tests/db2/learnerMirror.test.mjs` and any other test hard-coding `siaset-v2`: update them by grepping for `siaset-v2`.

- [ ] **Step 1:** Update the db2 tests (the counts, the migration path, 65 rejected, 22 accepted).
- [ ] **Step 2:** Run `npm run test:db2`. Expected: FAIL.
- [ ] **Step 3:** Bump both constants, run `npm run build:db2`, then write the two migrations with the exact `seed.sql` values.
- [ ] **Step 4:** Run `npm run test:db2` and `npm test`. Expected: all pass. The baseline was 50 db2 tests and 158 frontend tests, plus the new ones.
- [ ] **Step 5:** Commit: "Register contract siaset-v3 and raise the assignment station cap".

### Task 9: Verify, document, open the PR

- [ ] **Step 1:** Run `npm test`, `npm run test:db2`, `npm run lint` and `npm run build`. All must pass. Record the counts.
- [ ] **Step 2:** Run `preview_start` "frontend". Then, for each of `/learn/bench-workflow/<id>`:
  - check the console for errors;
  - make a prediction, then reveal;
  - use `read_page` to confirm the verdict text;
  - complete the explorer and the questions until "Lesson completed".

  Also check:
  - the Lab room, the Station finder and the teacher station picker list the new module;
  - mobile width with `resize_window`;
  - screenshots of the gel and digest benches.
- [ ] **Step 3:** Add a short "Bench Workflow" section to `TE/TESTING_AND_VALIDATION.md`, covering the model limits and the references verified. Commit.
- [ ] **Step 4:** Push the branch and open a PR to `main` with `gh` from PowerShell (`C:\Program Files\GitHub CLI\gh.exe`). The PR body lists:
  - the stations;
  - the two migrations;
  - the order "apply migrations → deploy learner-write → merge";
  - that none of those has happened.
- [ ] **Step 5:** Ask the user before any of these: applying the migrations to `vtbwzyyovfarfytbvoun`, deploying `learner-write`, or merging.
