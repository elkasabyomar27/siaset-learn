# Phase 5 implementation report

Topics 10–14 are implemented. Automated checks pass; browser acceptance is pending. Topic 15 remains planned, with no functional link or lesson. No Phase 6 work was started.

## Activities

| Topic | Interactive examples |
| --- | --- |
| 10 Genomic Consequences | Select insertion, direct-repeat deletion, inverted-repeat inversion or unequal crossover; predict and calculate the selected structural arrangement. Compare the original and retained/excised or reciprocal products. |
| 11 Phenotypic Consequences | Compare assumed coding disruption, intergenic insertion, unknown regulatory insertion and nutrient supplementation. Outcomes include likely altered, likely unchanged and undetermined. |
| 12 Gene Expression | Compare sole-promoter disruption, aligned/reversed outward promoters, bacterial operon termination and read-through. Separate transcriptional effects from coding disruption and protein/phenotype inference. |
| 13 TSD Investigation | Render existing Tn5 insertion and Tn3 cointegrate engine states. Trace both host-derived TSDs to the same symbolic target interval, compare 9 bp with 5 bp, and examine IS608 as a documented non-TSD exception. |
| 14 Regulation | Change defined conditions: maize Ds with/without Ac protein; bacterial IS10 RNA-OUT pairing or inactive pIN; Arabidopsis CACTA1 silencing and ddm1 context. No quantitative event frequencies or universal stress switch. |

Each lesson has objectives, explanation, scientific context diagrams, scenario predictions, an applied reasoning question, two knowledge checks, explanatory feedback, references and limitations. Every scenario must receive a correct prediction before its inspection is credited. Completion additionally requires the applied question and both checks. Storage preserves prior Phase 4 records and validates optional second-check indices. Incorrect answers can be retried; opening a page never completes it.

## Scientific models and references

The new structural model is deliberately limited to fixed symbolic crossover substrates. It rejects unsupported homology/orientation/substrate combinations. It preserves the excised circle in deletion and both reciprocal products in unequal crossover. It does not model transposase-dependent rearrangements, nucleotide breakpoints, physical topology, product survival or repair chemistry.

Insertion and TSD displays invoke the existing Tn5/Tn3 transitions rather than duplicating their logic. No existing engine, fixture or scientific contract was rewritten. The new contract addendum is `frontend/src/features/transposable-elements/contracts/PHASE5_CURRICULUM.md`.

New reference records (primary abstract or indexed primary text verified):

- [Repeat-mediated duplication evidence](https://pubmed.ncbi.nlm.nih.gov/1868831/) — Alu-associated duplication; supports biological relevance of repeat recombination, not every geometric detail of the generic templates.
- [IS2 transcription contexts](https://pubmed.ncbi.nlm.nih.gov/6194305/).
- [IS3 outward promoter in E. coli](https://pmc.ncbi.nlm.nih.gov/articles/PMC320941/).
- [IS10 antisense inhibition](https://pubmed.ncbi.nlm.nih.gov/1691097/).
- [IS10 promoter organization](https://pubmed.ncbi.nlm.nih.gov/6311437/).
- [Arabidopsis CACTA mobility and epigenetic control](https://pubmed.ncbi.nlm.nih.gov/15514067/).
- [IS608 structural/biochemical study](https://pmc.ncbi.nlm.nih.gov/articles/PMC2680152/) — no target-site duplication.

Existing McClintock, Ac/Ds, Tn5 and Tn3 references are reused. Phenotype and expression exercises explicitly stipulate hypothetical qualitative contexts; they are not fabricated experimental findings. Conditional “unchanged” predictions do not establish universal neutrality. Promoter and termination states are assumptions, not inferred properties of every element. Transposase availability permits a modeled prerequisite, not a guaranteed event.

## Files created

- `frontend/src/features/transposable-elements/curriculum/phase5.js`
- `frontend/src/features/transposable-elements/engine/consequences.js`
- `frontend/src/features/transposable-elements/ConsequenceExplorer.jsx`
- `frontend/src/features/transposable-elements/tests/phase5.test.js`
- `frontend/src/features/transposable-elements/contracts/PHASE5_CURRICULUM.md`
- `PHASE5_REPORT.md`

## Files modified

- `curriculum/lessons.js` — registers Phase 5 lessons and links through Topic 14.
- `curriculum/topics.json` — objectives, terminology, references, activities and assessment objectives for five new lessons.
- `profiles/references.json` — seven new evidence records.
- `Curriculum.jsx` — Topic 15 alone remains planned.
- `Lessons.jsx` — new explorer and second knowledge check; shared completion text.
- `lessonProgress.js` — validates, requires and persists the optional second check.
- `tests/contracts.test.js` — planned-scope assertion updated for Topic 15.
- `tests/lessons.test.js` — retains seven-topic Phase 4 mapping checks and broadens shared content/progress coverage to Phase 5.
- `frontend/src/styles.css` — responsive native selection control and evidence styling.

Paths above are relative to `frontend/src/features/transposable-elements/` except explicitly qualified paths. Generated `frontend/dist/` was rebuilt. Dependency manifests, existing Tn5/Tn3 engines, molecular fixtures and Vite preserveSymlinks configuration are unchanged. No backend, authentication or dependency installation was added.

## Validation results

| Check | Result |
| --- | --- |
| `npm test` | **28 passed, 0 failed**, including original 20 tests and Phase 4 coverage |
| `npm run lint` | **Passed** |
| `npm run build` | **Passed**, 56 modules; JS 360.66 kB, gzip 111.68 kB |
| New structural tests | Deletion/excised circle, inversion, reciprocal duplication/deletion, invalid substrate rejection and input immutability pass |
| TSD tests | Engine-derived pairs have matching host intervals and pair identity, correct element-specific bp labels, and distinct internal TIR parents |
| Learning tests | Context-dependent outcomes, both knowledge checks, all-context completion and persistence pass |
| Previous phases | Automated engine, guided-flow and lesson regressions pass; browser regressions remain unverified |
| Browser desktop/mobile, console and keyboard | **Not verified** |
| Production deployment | **Not performed** |

Vite started at `http://127.0.0.1:5174/` because port 5173 was occupied. The in-app browser failed to load `/learn/transposable-elements/tsd` with `net::ERR_CONNECTION_TIMED_OUT`. This remains a preview-access limitation. No successful screenshot or runtime browser acceptance is claimed; source-level responsiveness/accessibility is not a substitute for runtime checks.

## Manual acceptance checklist

Run `npm run dev` from the project root and use Vite's printed address.

1. Open `/learn/transposable-elements`; confirm Topics 1–14 retain original order and Topic 15 is planned. Follow Topics 6/7 to both guided engines.
2. Open each new route: `genomic-consequences`, `phenotypes`, `expression`, `tsd`, `regulation`, under `/learn/transposable-elements/`.
3. Try wrong predictions: feedback appears without credit. Solve every context, then the applied question and both checks; completion must remain incomplete until all requirements are met.
4. Change conditions and compare predictions. Check deletion retains its circle, inversion reverses X, and unequal crossover retains both reciprocal products. Compare original and modified diagrams.
5. In TSD investigation inspect Tn5 and Tn3 engine outputs and matching target intervals. Confirm the no-TSD IS608 example is explanatory only.
6. Reload to verify second-check persistence; reset one lesson without erasing other progress. Try storage-disabled mode and malformed saved data.
7. Run both existing laboratories, including prediction gates, both Tn3 transitions, unavailable-TnpR rejection, undo/redo/reset/replay.
8. Check desktop and 320/390px mobile widths, scrolling, focus outlines, radio/select keyboard interaction, readable SVG labels, status announcements and console errors.

Remaining limitations: browser acceptance incomplete; symbolic fixed rearrangement templates; no arbitrary genomes, sequences, quantitative expression or event rates; no backend progress certification. No further phase was started.
