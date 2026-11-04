# Phase 7 scientific consistency and reference audit

Scope: all 15 topic registry entries, 13 lesson definitions, guided laboratories, molecular profiles/contracts, the independent sandbox, 25 assessment items and local progress semantics. This is an implementation audit, **not scientific peer review** or experimental validation.

## Mechanism consistency

| Area | Finding and preserved boundary |
| --- | --- |
| Tn5 | Sandbox calls the existing conservative engine. One element remains overall; two external target-derived 9 bp repeats are distinct from internal terminal recognition regions. Donor fragments remain unrepaired. The 19 bp recognition region is explicitly not asserted to be a perfect inverted repeat. |
| Tn3 | Existing intact E. coli interplasmid pathway produces one circular cointegrate with two direct copies and internal res sites. Separate TnpR-dependent resolution returns supported products with two copies overall and target-side 5 bp repeats. Products may remain catenated. This route is not obligatory for all Tn3 events. |
| Coordinates | Existing zero-based half-open engine intervals are unchanged. Inspector uses studentLabels for one-based inclusive labels. Four sandbox boundaries are exposed: 0, 200, 895 and 900; 900 is equivalent to 0, and 895 exercises a host interval crossing the circular origin. These are symbolic placements, not genomic coordinates or insertion preferences. |
| Engine provenance | No Tn5/Tn3 engine, fixture or molecular contract changed. Existing immutable transitions and deterministic replay construct all sandbox structures. Undo/redo reconstruct recorded events; geometry never computes biology. |
| Class I/II and autonomy | Lessons and assessment distinguish RNA-mediated versus DNA-based pathways, and encoded autonomy from complementation in trans. Neither Class II nor supplied protein implies a universal conservative mechanism or guaranteed event. |
| IS/composite | Existing IS50, IS10 and IS1 architecture examples remain qualified. Whole-module orientation differs from short terminal motifs. Cargo and transposition functions are distinct; neither every IS copy nor every plasmid is assumed equally capable. |
| Rearrangements | Phase 5 fixed symbolic homologous-crossover models remain separate from transposition. Deletion retains the excised circle; unequal crossover retains both reciprocal products. They are not newly measured outcomes or a universal transposition reaction. |
| Phenotype/expression | Qualitative outcomes remain conditional on stated promoter, gene-function, bypass and assay assumptions. Undetermined remains valid where evidence is missing. Bacterial operon polarity is not generalized to all organisms. No quantitative expression or clinical inference added. |
| TSD exceptions | The assessment explicitly rejects a universal Tn5-length rule; the established IS608 exception is retained. TIR versus TSD questions distinguish element-derived ends from host-derived repeats and do not equate target-repeat count with element count. |
| Regulation | Ac/Ds, bacterial IS10 antisense/transcription and Arabidopsis CACTA1/DDM1 examples remain context-specific, not universal on/off or stress switches. |
| Bacterial movement | Transposition, conjugation, selection and integron cassette capture remain distinct. Tn7 compatibility classification does not execute insertion. TnsD/TniQ-family targeting in the selected glmS context is distinct from TnsE replication/transfer-associated targeting. |
| Assessment | Questions are deterministic copies of established reasoning/checkpoint definitions, with explicit answer indices and attached existing references. Added intensive coverage includes resolution, TSD/anatomy evidence, phenotype uncertainty, rearrangement, regulation, Tn7 and integrons. No new biological event, rate, sequence or experimental observation is introduced by scoring. |

## Reference audit method and result

The registry contains 28 unique reference records. Existing automated tests validate identifiers, URLs and registry relationships for topics and profiles. Shared lesson tests validate all lesson references. Phase 7 tests validate every assessment reference against that registry and confirm all 15 topic IDs in original order.

**Internal consistency passes.** All identifiers used by the assessment resolve. Assessment explanations reuse the established claim context instead of inventing stronger evidence. New Phase 7 molecular events retain existing engine reference IDs. No new DOI, PMID, accession, sequence or coordinate was invented or added to the reference registry.

External spot checks performed in this phase:

- [Goryshin & Reznikoff, Tn5 in vitro transposition, PMID 9516433](https://pubmed.ncbi.nlm.nih.gov/9516433/): primary abstract supports conservative movement in the selected in vitro system; it does not justify a universal host model or a donor repair product.
- [Takeya et al., Tn3 integration sites, PMID 377233](https://pubmed.ncbi.nlm.nih.gov/377233/): primary abstract explicitly supports a five-nucleotide direct target repeat. Published sequences were not imported into the application.
- [Collis et al., cassette insertion, PMID 8412670](https://pubmed.ncbi.nlm.nih.gov/8412670/): primary abstract supports integrase-dependent cassette insertion; it does not establish self-transfer of an integron.
- [Peters & Craig, TnsE, PMID 11274058](https://pubmed.ncbi.nlm.nih.gov/11274058/): a direct open returned an incomplete page. Indexed primary abstract/PMC text supported the replication-associated description; independent complete-page revalidation was limited.

The remaining registry entries retain their previously documented verification/access statuses. **This phase did not independently reverify all 28 full papers or every bibliographic field.** Internal integrity must not be represented as a complete external literature or metadata certification. Some entries use abbreviated citations or lack a year/author list; they remain traceable by URL. No unsupported claim of exhaustive metadata accuracy is made.

## Evidence limits and follow-up

1. The generic repeat-recombination lesson uses primary duplication evidence as biological context, not direct experimental proof of every idealized deletion/inversion diagram. An instructor should review the symbolic crossover templates and add directly relevant primary evidence for each topology before research-grade or publication-level claims.
2. Tn5 terminal recognition and Tn3 gene/site coordinates are schematic. No conclusion about genuine base-pair feature sizes, enzyme geometry or strand chemistry should be inferred from the diagrams.
3. New lab completion records validate replay and checkpoints, not independent student understanding. Assessment is local unproctored practice, not a secure qualification.
4. No kinetics, targeting probabilities, transfer rates, decatenation, population dynamics or clinical resistance outcomes are modeled.
5. Complete bibliographic normalization and full-text external review remain instructor/reviewer tasks. No established scientific claim was silently replaced and no validated molecular engine was rewritten.

Verdict: internally consistent within the declared bounded educational models, with the evidence/access limitations above. Suitable for educational acceptance review; scientific peer review remains outstanding.
