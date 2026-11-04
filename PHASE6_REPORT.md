# Phase 6 — Topic 15 implementation

Topic 15, Bacterial Transposable Elements and Horizontal Gene Transfer, is implemented within the existing lesson architecture. All 15 curriculum entries are accessible in original order; Topics 6/7 retain their guided laboratories. Browser acceptance remains pending. Phase 7 was not started.

## Activities and scientific content

| Activity | Implementation |
| --- | --- |
| Bacterial DNA explorer | Symbolic two-cell SVG with chromosome and plasmid identities, plus annotated chromosome/plasmid/TE roles and relevant gene functions. Distinguishes replicons from embedded elements. |
| Transposition versus conjugation | Prediction-gated within-cell Tn5 insertion, separate between-cell plasmid transfer, and a nonconjugative/no-helper rejection case. |
| Resistance dissemination | Three inspectable, deterministically reconstructed states: donor fragment with classical resistance-associated Tn5; loaded target plasmid after the existing Tn5 operation; recipient plasmid copy after a separate conjugation operation. Event list records each operation and cellular scope. |
| Tn7 targeting | Compare established E. coli glmS-associated TnsD/TniQ-family targeting with TnsE replication/transfer-associated targeting and a mismatched-route scenario. Compatibility is a contextual classification, not calculated Tn7 insertion. |
| Integron classification | Inspect IntI, attI/attC, Pc and a cassette array; compare a nested plasmid/transposon/integron arrangement. Distinguishes cassette recombination, transposition and plasmid transfer. |

Twelve scenario predictions, an applied question and two knowledge checks require successful reasoning for completion. Incorrect predictions provide explanatory feedback without credit. Existing versioned browser progress and all earlier lessons remain intact.

## Molecular operations versus illustrations

`engine/bacterial.js` adds a bounded pure state model. Initial donor and recipient have distinct stable cell and chromosome identities. The selected Tn5 engine moves the element from a symbolic linear donor fragment to the circular target within the donor cell. It does not represent a full chromosome insertion or change cell ownership.

The separate conjugation operation requires a loaded circular plasmid, conjugative capability, oriT, machinery, contact and a compatible recipient. It assumes a completed transfer with DNA synthesis and establishment, retains the donor plasmid and adds a distinct recipient plasmid with traceable lineage. Invalid prerequisites reject without mutation. It does not run through the Tn5/Tn3 engines. No general conjugation cycle, population dynamics or arbitrary genomes are simulated.

Tn7, integron capture, nested mobile systems and selection are explanatory or classification models. No cassette recombination product or Tn7 target insertion is computed. Resistance-gene acquisition does not guarantee a phenotype; selection does not move DNA. Not every transposon carries resistance cargo, and not every plasmid is conjugative. Helper-mediated mobilization is discussed as distinct and not implemented.

Full preconditions, postconditions, identity conventions, event boundaries and limitations: `frontend/src/features/transposable-elements/contracts/PHASE6_BACTERIAL.md`.

## Scientific references

Reused existing Tn7 profiles (`tn7-tnsd`, `tn7-tnse`) and reference records for TnsD, glmS context, TnsE replication targeting and Tn5 anatomy. The Tn7 profiles remain planned as molecular engines; this phase implements educational context classification only.

Added traceable primary records:

- [Assembly of the Tn7 targeting complex by a regulated stepwise process](https://pubmed.ncbi.nlm.nih.gov/38834067/) — TnsD/TniQ-family targeting complex and TnsC recruitment; not universal behavior of all TniQ homologs.
- [RP4 TraI relaxase and site-specific DNA processing](https://pubmed.ncbi.nlm.nih.gov/8385350/) — evidence for oriT/relaxase-mediated conjugative DNA processing; symbolic lesson plasmid is not asserted to be RP4.
- [Collis et al., site-specific insertion of gene cassettes into integrons](https://pubmed.ncbi.nlm.nih.gov/8412670/) — cassette capture, not self-transfer or universal cassette expression.

Primary abstracts or indexed primary text were checked. Relevance, evidence status and limitations are recorded in `profiles/references.json`, including the reused Tn7/Tn5 records. No sequence, genomic coordinate, efficiency, frequency, clinical measurement or treatment outcome is invented.

## Files created

- `frontend/src/features/transposable-elements/curriculum/phase6.js`
- `frontend/src/features/transposable-elements/engine/bacterial.js`
- `frontend/src/features/transposable-elements/BacterialExplorer.jsx`
- `frontend/src/features/transposable-elements/tests/phase6.test.js`
- `frontend/src/features/transposable-elements/contracts/PHASE6_BACTERIAL.md`
- `PHASE6_REPORT.md`

## Files modified

- `frontend/src/features/transposable-elements/curriculum/lessons.js` — registers Topic 15 and enables its route link.
- `frontend/src/features/transposable-elements/curriculum/topics.json` — implemented activity, objective, reference and assessment metadata.
- `frontend/src/features/transposable-elements/Curriculum.jsx` — displays the new lesson rather than planned status.
- `frontend/src/features/transposable-elements/Lessons.jsx` — selects the Topic 15 explorer; earlier lesson content remains unchanged.
- `frontend/src/features/transposable-elements/profiles/references.json` — primary records and scoped evidence limitations.
- `frontend/src/features/transposable-elements/tests/contracts.test.js` — curriculum implementation assertion now includes Topic 15.
- `frontend/src/features/transposable-elements/tests/lessons.test.js` — Topic 15 integration assertion replaces planned-status expectation.

Production artifacts were regenerated under `frontend/dist/`. Existing Tn5/Tn3 engines, molecular fixtures, Vite workaround, dependencies, storage key/schema and prior lesson content were not changed. No packages were installed or backend/authentication systems added.

## Verification

| Check | Result |
| --- | --- |
| `npm test` | **33 passed, 0 failed**, including all previous-phase regressions |
| `npm run lint` | **Passed** |
| `npm run build` | **Passed**, 59 modules; JS 378.22 kB / gzip 116.46 kB |
| New tests | Curriculum/reference integrity; five activity groups; molecular versus cellular scope; cell/chromosome/plasmid identities; donor retention; cloned recipient DNA; each conjugation prerequisite; mutation-free rejection; event ordering; Tn7 compatibility; integron classification; contextual feedback; completion/persistence |
| Previous phases | Automated engine, guided-flow, lesson-content and progress regressions pass |
| Browser, mobile and keyboard checks | **Blocked, not verified** |
| Console capture/screenshots | Not available from a successfully loaded updated page |
| Production deployment | Not performed |

Vite reported the development server at `http://127.0.0.1:5174/` (5173 was occupied). The in-app browser failed to open `/learn/transposable-elements/bacterial-hgt` with `net::ERR_CONNECTION_TIMED_OUT`. No security setting was changed and no successful browser acceptance is claimed. The verification-owned server was stopped after checking.

## Manual acceptance checklist

Run `npm run dev` from the repository root and use Vite's printed URL.

1. Open `/learn/transposable-elements/bacterial-hgt` directly and through curriculum Topic 15; confirm original order and all previous routes remain accessible.
2. Inspect all 12 contexts across the five activity groups. Try wrong predictions and confirm explanatory feedback without inspection credit.
3. Compare the donor/recipient ownership maps before and after transposition and conjugation. Verify retained donor plasmid, distinct recipient copy, unchanged chromosomes, ordered separate events, and blocked nonconjugative case.
4. Follow the resistance sequence and verify the explicit unknown phenotype and unmodeled selection outcomes.
5. Compare both Tn7 routes and the mismatch example; confirm no exact insertion coordinate or probability is shown.
6. Distinguish integron cassette capture from transposition and transfer, including nested systems and the absence of a calculated cassette product.
7. Solve every scenario plus all three assessment questions; completion must require every condition. Reload for persistence and reset Topic 15 without clearing earlier lessons.
8. Check desktop and 320/390px mobile layouts, SVG readability, scrolling, native select/radio keyboard operation, focus indicators, status feedback and browser console.
9. Rerun both guided labs, Tn3 resolution gate, undo/redo/reset/replay, and representative Phase 4/5 lessons in the browser.

Remaining limits: fixed curated bacterial contexts; no general genome/population simulator; no quantitative transfer or resistance prediction; no complete conjugation intermediates; no Tn7 insertion or integron recombination engine; browser acceptance for Phases 4–6 remains pending. Target-factor compatibility alone cannot establish a real insertion event. Stop after Phase 6.
