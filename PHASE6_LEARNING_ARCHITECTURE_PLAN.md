# SIASET Learn | Phase 6 learning architecture

Planning decision for Malek and the course professor · 3 November 2026

Start with a boundary-reading pilot in **03 · Transposon Structure and Anatomy**. A learner who counts two host repeats as two elements will misread both guided labs. This pilot tests whether the learner can locate the element and explain its origin on a fresh diagram before the course adds more visual complexity.

## 1. Verified curriculum baseline

Local React/Vite source inspection. The table follows curriculum metadata order. The destination is the output of topicHref for that record. View names are in saved index order. The final column lists bank v1 item suffixes after the topic ID.

| # | Exact title and ID | Destination | Existing views or laboratory | Bank items |
|---|---|---|---|---|
| 01 | Introduction to Transposable Elements · `introduction` | `/learn/transposable-elements/introduction` | Intact Ac / Ds alone / Ds with Ac | primary |
| 02 | History and Discovery · `discovery` | `/learn/transposable-elements/discovery` | Maize observations / Ac absent / Ac present | primary |
| 03 | Transposon Structure and Anatomy · `anatomy` | `/learn/transposable-elements/anatomy` | Boundaries / Genes / Insertion junction | primary, evidence |
| 04 | Classification · `classification` | `/learn/transposable-elements/classification` | Ty: Class I / Tn5: Class II / Tn3: Class II | primary |
| 05 | DNA Transposons · `dna-diversity` | `/learn/transposable-elements/dna-diversity` | Tn5 / Tn3 cointegrate / Tn3 resolution | primary |
| 06 | Conservative Cut-and-Paste Transposition · `conservative` | `/lab/transposable-elements?experiment=tn5` | Guided tn5 | primary |
| 07 | Replicative Transposition · `replicative` | `/lab/transposable-elements?experiment=tn3` | Guided tn3 | primary, resolution |
| 08 | Insertion Sequences · `insertion-sequences` | `/learn/transposable-elements/insertion-sequences` | IS10 / Composite comparison / Functional asymmetry | primary |
| 09 | Composite Transposons · `composite` | `/learn/transposable-elements/composite` | Tn5 / Tn10 / Tn9 | primary |
| 10 | Genomic Consequences · `genomic-consequences` | `/learn/transposable-elements/genomic-consequences` | Insertion / Direct-repeat recombination / Inverted-repeat recombination / Unequal crossover | primary, additional |
| 11 | Phenotypic Consequences · `phenotypes` | `/learn/transposable-elements/phenotypes` | Coding insertion / Intergenic insertion / Regulatory insertion / Condition changed | primary, additional |
| 12 | Gene Expression Effects · `expression` | `/learn/transposable-elements/expression` | Promoter disruption / Outward promoter aligned / Outward promoter reversed / Operon termination / Read-through | primary, additional |
| 13 | Target-Site Duplication · `tsd` | `/learn/transposable-elements/tsd` | Tn5 junction / Tn3 junction / Non-universal outcome | primary, additional, evidence |
| 14 | Regulation of Transposable Elements · `regulation` | `/learn/transposable-elements/regulation` | Maize: Ds without Ac / Maize: Ac supplied / Bacterial IS10: RNA-OUT / Bacterial IS10: promoter inactive / Arabidopsis CACTA1: silenced / Arabidopsis: ddm1 context | primary, additional |
| 15 | Bacterial Transposable Elements and Horizontal Gene Transfer · `bacterial-hgt` | `/learn/transposable-elements/bacterial-hgt` | 1 · Identify bacterial DNA / 2 · Within-cell movement / 2 · Between-cell transfer / 2 · Nonconjugative plasmid / 3 · Resistance: starting state / 3 · Resistance: plasmid loading / 3 · Resistance: recipient acquisition / 4 · Tn7: glmS context / 4 · Tn7: transfer-related replication / 4 · Tn7: mismatched route / 5 · Integron cassette capture / 5 · Nested mobile DNA | primary, additional, evidence |

**Identity cross-check.** Order 3 in topics.json has id and lessonId anatomy. The matching lessons.js entry defines Boundaries, Genes and Insertion junction. The learn router renders that lesson. Topic 13 separately develops target-site duplication. Topic 03 introduces the distinction without teaching a strand-level insertion mechanism.

### Evidence and scoring

A = topics 01–05, 08–09. A deliberate selection of each of the three original view controls records its zero-based index. The initially displayed first view still needs explicit selection. All indices plus correct current exercise and check answers are required.

P = topics 10–15. Each original scenario requires a correct prediction submitted through its explorer before its index is credited. All listed scenarios plus correct exercise, check and check2 are required. Topic 15 uses the bacterial explorer and 10–14 use the consequence explorer. A later incorrect question answer can make a lesson incomplete. Prior inspected indices persist until reset.

L = 06–07. Replay-valid evidence at the final numeric stage and the explicit Record completed guided review action determine lab credit. Each topic contributes one unit to the 15-topic denominator. Assessment and sandbox have separate purposes.

Bank version 1 contains 25 questions. The local published fixture matches the generated objects including order, prompts, options, numeric keys and references. Primary draws from the lesson exercise or lab checkpoint, additional from check2, evidence from check on the three flagged topics, and replicative-resolution from the resolution checkpoint. All questions must be answered to submit. Each correct answer earns one point, with per-topic feedback and dated local attempts. Reuse of taught items limits what this score says about transfer to unfamiliar examples.

### Guided lab contracts

| Experiment | Existing learner flow and calculated evidence |
|---|---|
| Tn5 | Inspect linear donor and circular target. Choose a teaching boundary (0–900, with 900 equivalent to 0). Predict one copy overall. Run transposition, inspect the two unrepaired donor fragments, inserted element and two host-derived 9 bp TSDs. Review and explicitly record. Valid record requires stage 4, correct Tn5 answer and exactly one event replaying to inserted. Undo/redo land at inspect/calculate. |
| Tn3 | Inspect separate circular replicons. At explanatory strand transfer, predict one circle with both backbones and two directly oriented copies. In replication, choose Form cointegrate. Inspect the 5 bp TSDs around the insertion block. At res recognition, predict two copies after resolution and test TnpR availability. With the gate satisfied, resolve and inspect one recombinant Tn3 per product, then explicitly record. Valid evidence requires stage 5, both answers correct and exactly two events replaying to resolved. Undo/redo land at inspect/cointegrate/resolved. |

The placement control is a teaching coordinate. Explanatory strand transfer, replication-fork imagery and res recognition do not add history entries. A missing or invalid experiment parameter selects Tn5. Switching experiments resets the active lab session. Returning to a Journey node must distinguish a recorded review from a live molecular state.

### Reports and source trail

- **Phase 1 reliability** establishes one subscribed repository, fresh reads, cross-tab operation ordering, separate read/write failure notices and temporary in-memory recovery. The current repository overlays version-1 operations on legacy lesson, guided-lab and assessment records.
- **Phase 2 visual correctness** separates scientific colors from branding and distinguishes static diagrams from selectable features. A highlight in the Journey must never imply selection of molecular evidence.
- **Phase 3 learning UX** establishes current-page indication, skip link, route titles and heading focus, history scroll restoration, previous/next topic navigation and separate recording of guided reviews.
- **Phase 4 architecture** moves guided stages and assessment construction into metadata and preserves numeric stage and bank contracts. The older Phase 4 curriculum report documents the seven foundational lessons. The older Phase 5 curriculum report covers topics 10–14 and describes 15 as planned at that historical point. Current metadata, lesson composition and bacterial explorer establish that 15 is now implemented.
- **Phase 5 release readiness** records a conditional local pass and 64 passing tests at that audit. Open findings include unbounded operation growth, quota and privacy limitations, assessment result focus, sampled accessibility coverage, development dependency findings and remote hosting/rollback verification. This inspection did not rerun that QA. The existing PHASE6_REPORT.md is a separate historical artifact.

To reproduce the audit, start at frontend/src/main.jsx. Under frontend/src/features/transposable-elements, compare curriculum/topics.json, curriculum/lessons.js, phase5.js and phase6.js in that curriculum directory, and curriculum/navigation.js with Lessons.jsx, components/LessonActivities.jsx, ConsequenceExplorer.jsx and BacterialExplorer.jsx. Follow Laboratory.jsx through guidedStages.js, learning.js, engine/tn3.js and engine/tn5.js. Follow evidence through lessonProgress.js, learnerRecords.js, progressRepository.js and ProgressDashboard.jsx. Compare assessment.js and Assessment.jsx against tests/assessment-v1.json. The root reports used are PHASE1_RELIABILITY_REPORT.md, PHASE2_VISUAL_CORRECTNESS_REPORT.md, PHASE3_LEARNING_UX_REPORT.md, PHASE4_ARCHITECTURE_REPORT.md, PHASE4_REPORT.md, PHASE5_RELEASE_READINESS_REPORT.md and PHASE5_REPORT.md.

## 2. Proposed teaching sequence

Everything below is a design proposal. Each activity sits beside the original controls. A/P/L refer to the exact evidence paths above. Each formative prompt gives immediate explanatory feedback and a retry. For independent practice, present the fresh case without highlights, reveal its rationale only after submission, and allow review or another attempt. The stated expected answer is the design rubric. An answer shown after a hint is guided practice. Neither mode writes a mastery flag, submits a bank item or satisfies a required question.

### 01 · Introduction | A
**Objective and activity.** Separate encoded capacity from available protein. Give the learner an intact Ac card and a compatible Ds card. Ask them to assign each an autonomy label, then lend Ac protein to Ds and revise only the claims that change. Keep two columns visible, “encoded here” and “available in cell”. If autonomy changes, point back to the unchanged Ds card.
**Hints.** Locate the coding region → distinguish DNA from supplied protein → Ds still needs its supplier.
**Check.** Formative: remove the supplier and select which capability is lost (complementation). Independent: for a new element with compatible ends but no functional transposase, classify autonomy and state the condition for possible movement. Require both dependence and compatible supply.
**Boundary and access.** No event rate or guaranteed insertion. Provide labeled select controls for assignments and a text change log.

### 02 · History and Discovery | A
**Objective and activity.** Build an argument from observations of mutable maize loci. Place a historical observation, a controlling-element interpretation and a proposed Ac-removal comparison into “observed”, “inferred” and “would test”. On submit, identify which card makes a causal claim beyond the observed pattern.
**Hints.** Find what could have been recorded → identify the explanation → use absence of compatible Ac as a comparison.
**Check.** Formative: does a mutable pattern alone identify a transposase sequence? No. Independent: choose the observation that would support dependence in a defined Ds comparison and qualify the inference to that derivative.
**Boundary and access.** Label hypothetical comparisons separately from historical observations. No reconstructed kernel counts or breakage timing. Use a linear card list with one radio group per card.

### 03 · Anatomy | A
**Objective and activity.** Delimit a representative TIR-bearing insertion, distinguish coding function from direction, and trace host repeats to one original interval. Place two boundary markers, annotate two gene arrows, then match both flanks to the pre-insertion target. Feedback identifies the specific feature incorrectly included or excluded.
**Hints.** Compare the original target → trace the matching outside blocks → bracket the two terminal regions and everything between them.
**Check.** Formative: fix a bracket that includes a host repeat. Independent: on an unlabeled, oppositely oriented example select both boundaries, assign host origin to both flanks, and count one complete element. See pilot below.
**Boundary and access.** Symbolic motifs and generic cargo. No sequence alignment or scale. Every boundary has a named text equivalent.

### 04 · Classification | A
**Objective and activity.** Classify pathways by intermediate. Give Ty, Tn5 and Tn3 pathway strips with a missing intermediate; insert RNA/RT or a DNA-based step and assign class. If the learner groups Ty with Tn3 by copy gain, highlight the step that produced the new DNA.
**Hints.** Ignore final copy count → find the template → RNA followed by reverse transcription identifies Class I.
**Check.** Formative: classify Tn3 despite copy gain. Independent: classify an unnamed pathway with an RNA intermediate and reverse transcription, then explain why a second case with only a copy count is insufficient.
**Boundary and access.** The three strips are representative. Offer ordered sentences and native choices for each gap.

### 05 · DNA Transposons | A
**Objective and activity.** Reconcile copy number with backbone topology. Fill a ledger for Tn5 insertion, Tn3 cointegrate formation and resolution. Enter number of elements and identify which backbones share a molecule. For a mistaken copy loss, carry the two labeled Tn3 copies across the resolution row.
**Hints.** Count elements once per row → trace both backbone labels → partition the two copies on resolution.
**Check.** Formative: locate the row where replication increases the count. Independent: infer the supported transition from one fused circle with two direct copies to two replicon structures with one each. Require “resolution” and conserved total.
**Boundary and access.** Selected interplasmid pathway only. Supply row headers and an equivalent one-row-at-a-time form.

### 06 · Conservative Cut-and-Paste | L/Tn5
**Objective and activity.** Follow the original element through a single event. Before running the existing lab, tag its donor location on a scratch diagram. After the run, select the product carrying the tag and account for each donor fragment. Compare against the actual post-event state; marking a repeat as the second copy highlights its target origin.
**Hints.** Locate both terminal ends → follow them as a pair → inspect the target for the only complete element.
**Check.** Formative: locate both host-derived repeats. Independent: from a fresh product inventory, report one element, two host repeats and unknown donor repair. Use the existing lab stages and recording action for credit.
**Boundary and access.** No repaired donor, target preference or enzyme kinetics inferred. Provide molecule-by-molecule lists with explicit topology.

### 07 · Replicative Transposition | L/Tn3
**Objective and activity.** Diagnose a stalled resolution. Trace both backbones around the calculated cointegrate, select both internal res sites on a practice outline, predict the products and test the existing TnpR gate off then on. If the learner expects one copy to vanish, pair each recombinant product with its backbone.
**Hints.** Count circles and copies separately → find res inside each copy → TnpR partitions the cointegrate.
**Check.** Formative: identify the state retained with the gate off. Independent: describe backbone distribution and total copies after successful resolution, and identify physical unlinking as unresolved.
**Boundary and access.** Direct res orientation and permissive topology assumed. Supply circular traversal as an ordered list with a return-to-start label.

### 08 · Insertion Sequences | A
**Objective and activity.** Attribute movement functions to features of a representative IS. Mark terminal recognition regions, transposition gene and external accessory cargo on a simple IS versus composite comparison. Selecting cargo as the enzyme source opens its functional annotation; selecting an end explains recognition versus protein coding.
**Hints.** Read the feature legend → separate protein coding from recognition → compare IS10-R with IS10-L.
**Check.** Formative: identify the normal machinery source in native Tn10. Independent: given two compact IS-like maps, one with an interrupted coding region, identify the missing intrinsic function and explain why end presence alone cannot establish mobility.
**Boundary and access.** IS10 is family-specific. Use a feature inventory with text roles and positions.

### 09 · Composite Transposons | A
**Objective and activity.** Reconstruct the three classical architectures. Choose a flanking module pair and orient its whole-module arrows around cargo. Validate against Tn5/IS50 inverted, Tn10/IS10 inverted and Tn9/IS1 direct. On mismatch, compare arrow directions at the same level of magnification.
**Hints.** Identify the IS family → compare whole modules → distinguish whole IS1 repeats from small host repeats.
**Check.** Formative: rotate the mismatched Tn9 module. Independent: interpret a map with direct IS1 modules and cargo; identify a composite arrangement and explain why orientation alone cannot assign a reaction pathway.
**Boundary and access.** No inference of equal module activity. Use forward/reverse buttons with directional words.

### 10 · Genomic Consequences | P
**Objective and activity.** Account for all products of rearrangement. Select the template event, predict the fate of a labeled interval, then allocate product blocks to a retained molecule, excised circle or reciprocal product as appropriate. Compare against the existing calculated product lists; name the first missing interval.
**Hints.** Identify the participating molecules → compare repeat orientations → account for the interval on every product.
**Check.** Formative: recover the circle missing from a direct-repeat deletion answer. Independent: on a new unequal-crossover block diagram identify the reciprocal duplication and deletion, distinguishing recombination from a new insertion.
**Boundary and access.** Fixed templates do not predict breakpoints or product survival. Supply ordered text strings and separate product headings.

### 11 · Phenotypic Consequences | P
**Objective and activity.** Separate a molecular lesion from an assay result. Keep one defined biosynthetic lesion fixed, choose supplemented or unsupplemented medium and predict growth relative to the stated comparator. Reveal the bypass assumption alongside the still-disrupted gene. For sparse evidence allow “undetermined”.
**Hints.** Name the measured trait → check whether the pathway is required → test whether supplementation bypasses it.
**Check.** Formative: explain how unchanged growth can coexist with disrupted coding DNA. Independent: predict the effect of an insertion near a poorly characterized promoter with unspecified assay. Require “undetermined” and one missing condition.
**Boundary and access.** Hypothetical qualitative cases. Use paired descriptions with the changed assumption labeled explicitly.

### 12 · Gene Expression Effects | P
**Objective and activity.** Trace transcription to a downstream gene. Select a promoter, orient the transcription arrow and mark where the transcript stops in each supplied context. Overlay the supported path. On error, identify the first incompatible direction, termination point or independently driven region.
**Hints.** Locate initiation → follow promoter direction → check termination and independent promoters before inferring polarity.
**Check.** Formative: reverse the outward promoter and reassess the rightward gene. Independent: in a new two-gene operon diagram with interruption of A and a functional independent promoter for B, identify why a decrease in B transcription is not required.
**Boundary and access.** No expression magnitudes or protein-level predictions. Provide a numbered path with spoken direction and stop positions.

### 13 · Target-Site Duplication | P
**Objective and activity.** Trace each flanking copy to a host interval. Select the original target interval and link it to each post-event TSD using the existing Tn5 or Tn3 output. Compare literature-based lengths and choose the appropriate exception card. On error, contrast host interval identity with an internal end.
**Hints.** Start before insertion → follow the same source twice → compare the 9 bp and 5 bp labels.
**Check.** Formative: trace Tn3 repeats around the cointegrate insertion block. Independent: classify a no-TSD IS608 example and reject inferring that insertion failed solely because repeats are absent.
**Boundary and access.** Schematic gap filling, symbolic coordinates and no IS608 engine. Offer paired source/destination selectors with textual bp labels.

### 14 · Regulation | P
**Objective and activity.** Find the regulated step in each organism. Assign Ac supply, IS10 RNA-OUT pairing and DDM1-associated silencing to the correct organism and molecular step. Remove one specified constraint and choose permitted/reduced/undetermined under the displayed assumptions. If an event is called certain, show the remaining unknown conditions.
**Hints.** Identify organism → identify protein supply, translation or chromatin → separate a gate from a measured frequency.
**Check.** Formative: contrast inactive transcription with inhibited translation in IS10. Independent: interpret a ddm1 case with a relaxed constraint and unknown copy competence; explain why the next event is undetermined.
**Boundary and access.** No universal stress switch or numeric rates. Offer one named organism per fieldset and explicit comparison baseline.

### 15 · Bacterial Transposable Elements and Horizontal Gene Transfer | P
**Objective and activity.** Distinguish molecular relocation from acquisition by a new cell. Build a chain of custody for resistance-associated DNA. Select cell, replicon and cargo before and after Tn5 loading and plasmid transfer. Then classify a blocked transfer, match Tn7 selectors to contexts, and place a cassette inside its integron. Compare against existing ownership results or explanatory annotations according to case. If a learner labels loading HGT, point to the unchanged recipient.
**Hints.** Locate the cell boundary → check transfer machinery and helper assumptions → separate cassette capture, targeting and plasmid transfer.
**Check.** Formative: hide transfer machinery and explain the no-helper result. Independent: given a recipient carrying a cassette-bearing plasmid, identify which evidence would distinguish transfer from cassette capture and what assay would be needed to support a resistance claim. Mere co-location establishes neither event history nor phenotype.
**Boundary and access.** TnsD/glmS and TnsE replication contexts are compatibility examples. No rate, clinical prediction or calculated integron reaction. Provide a nested text inventory by cell and replicon and a chronological event list.

## 3. DNA Journey navigation proposal

Use an ordered set of fifteen links on a shallow, illustrated double helix. Its bends distinguish groups; they carry no information about sequence, molecular scale, prerequisites or proficiency. Keep the underlying ordered list usable on its own. Generate destinations with the existing topic resolver and groups by stable ID. Within a group, sort by metadata order. Display the original number, title, lesson/lab type and current recorded status at every stop.

| Group | Stops | Question the group answers |
|---|---|---|
| Recognize an element | 01–04 | What is the evidence for mobility, which DNA belongs to the element, and what moves through which intermediate? |
| Follow a mechanism | 05–07 | What happens to copies and replicons during the two worked pathways? |
| Read genetic architecture | 08–09 | How are movement functions and cargo organized into modules? |
| Interpret an insertion | 10–13 | Which structural, phenotypic, transcriptional and junction-level claims follow from the evidence? |
| Place movement in context | 14–15 | What permits movement, and when does DNA enter a different cell? |

At entry offer “Browse all 15 topics” and group jump links. Group activation scrolls/focuses its heading; topic activation goes directly to the canonical destination, including experiment query strings. Current location and recorded completion use different text labels. No locked stops or forced starting position. A learner can go straight to 15, return to 03, or leave a lab before recording. Preserve existing previous/next, progress, assessment and sandbox destinations. Browser Back returns to the visited Journey position using existing route behavior. Avoid a new “last visited” storage key.

Create depth with static overlapping ribbons, modest shadows and perspective in decorative artwork only. Node labels stay flat. Optionally fade the selected outline once over 120–160 ms. No continuous rotation, camera travel, parallax, autoplay or scroll hijacking. With reduced motion, remove transitions and use instant group jumps; no information depends on animation. Hide decorative ribbons from assistive technology. Use one focus target per destination, touch targets at least 44 CSS px, visible focus, headings and text status. At 320 px or high zoom, use the same links in a single column, in DOM order, without horizontal map scrolling.

## 4. Topic 03 pilot specification

One existing lesson URL, with in-page panels. Keep direct access to the three existing view buttons and the required questions, including when the practice is skipped. The pilot has three independent state layers: selected original view, transient practice inputs and repository-derived evidence. Only existing evidence controls may write. Revisiting a previously inspected view keeps its real index; a scratch highlight cannot mark it inspected.

| Screen | Learner action and displayed state | Response, retry and evidence |
|---|---|---|
| Entry / resume | Show title, two current objectives, legend and “Try the anatomy workbench”. Display the three view labels with current inspection status plus the two required question statuses. Offer a direct link to required questions. | Fresh record shows zero inspections even if Boundaries is previewed. Restore current evidence on return. Opening the lesson or workbench writes nothing. |
| Boundaries · index 0 | Explicitly select Boundaries. Show host TSD, left terminal region, transposase, right terminal region, host TSD in that order. Two named boundary selectors choose gaps between blocks. “Check bracket” becomes available once both are set. | Existing view click earns index 0 regardless of bracket performance. For reversed markers ask learner to order them. If TSD included, identify host origin; if end omitted, identify missing recognition region. Correct bracket includes both ends and internal coding DNA. Keep selections on retry. |
| Genes · index 1 | Select Genes. Show both ends with transposase and cargo inside. Select each coding arrow; assign movement machinery or accessory function, then read its direction using the legend. | Existing view selection earns index 1. On swapped roles, explain which gene supplies the transposition protein. A direction error triggers an arrowhead cue only. Correct response displays one sentence per feature with role and direction. |
| Insertion junction · index 2 | Select Insertion junction. Compare a pre-insertion host strip with the post-insertion strip. Match each outside repeat to its source interval, then enter the number of complete elements. | Selection earns index 2. If the learner selects an end, point to the pre-insertion strip where the element was absent. If they count two elements, outline the single bounded element. Correct response identifies one source, two host repeat copies, one element. |
| Independent transfer | Offer a different schematic with element orientation reversed, neutral block identifiers, a pre-insertion target and explicit motif, transcription-direction and repeat evidence in the legend. Ask for both boundaries, host-derived flanks and copy count without cues. | Require all three claims for “Explained this example independently” on the first unaided correct submission. Any reveal changes the label to “Reviewed with support”. Show missed claim(s) and rationale after submission. Retry with a parallel case or return to the relevant view. No answer is copied to a required radio group. |
| Existing evidence and exit | Preserve the applied question “Which regions move as part of this element?” and check “Two flanking direct host repeats demonstrate what?” with their current option order and feedback. Offer summary, reset, previous/next, references and progress. | Completion is exactly inspected indices 0,1,2 plus exercise=1 and check=1. Skipped or failed optional practice permits completion by existing rules. A completed practice case with missing original evidence leaves the topic incomplete. Display exactly what remains. |

**Interaction details.** Empty fields show instructions; incomplete submissions identify the missing field in text. Editing a checked answer clears its transient verdict. Hints open one at a time: a question about origin, a cue pointing to comparable regions, then a worked explanation. In Genes the sequence is “read the feature name”, “separate function from arrow direction”, then a worked gene assignment. Retrying practice resets only that case. Navigating away/reloading discards draft practice; tell learners this at entry. Existing lesson reset goes through the existing reset control. Clear related temporary feedback on reset. A repository change from another tab refreshes the evidence summary without overwriting draft practice. Keep the current persistence notice and retry action visible during read/write failure.

**Delivery and accessibility.** Pair every diagram with its ordered feature list, expose bracketing as two labeled native selects, and use text for direction and inside/outside status. No precision dragging. Keep focus on Check for retries, announce one concise result, and offer an explicit link to the missed field. On panel navigation focus the requested panel heading when appropriate; never move focus just because evidence updated. Show the limitation beside the figure: generic TIR-bearing model, arbitrary scale, no exact nucleotide sequence. Tn5 recognition ends must not be depicted as perfect 19 bp inverted repeats. The same tasks must work in the text-only layout.

## 5. Review decisions, implementation sequence and acceptance

### Questions for Malek and the professor

1. **Professor, before drawing the pilot:** approve the generic terminal-region notation and the separation of whole-element orientation, gene direction and inverted end motifs. Should the simplified workbench omit any Tn5-specific annotation beyond the caveat? Review both fresh transfer diagrams for solvability from the supplied evidence.
2. **Professor, before writing case sets:** which maize observation should be presented with a primary-source caption? Approve the Ac/Ds derivative assumptions, native IS10 asymmetry and the level of topology detail for recombinant Tn3 products. Until reviewed, use the source lesson's bounded examples.
3. **Professor, before review of topics 10–15:** specify permissible assumptions for each phenotype/expression pair, wording for host regulation and the evidence needed for the Tn7, cassette-capture and transfer branches. Which “undetermined” answers should earn conceptual credit and why?
4. **Malek, at prototype review:** choose course language/terminology level and whether the list or illustrated view should be the desktop default. Confirm target devices and recruit students who have and have not used the current labs. Both navigation views must reach all stops.
5. **Malek and professor:** agree what counts as an unaided explanation in the pilot. Suggested observation: independently place both boundaries and justify the host origin of both repeats on an unseen map. Record pilot observations separately with consent; in-app progress remains the existing local measure.

### Future work packages and go/no-go criteria

| Package | Reviewable result | Exit test before proceeding |
|---|---|---|
| 1 · Freeze baseline and approve content | Source-to-screen inventory, original bank and evidence fixtures, professor-annotated pilot diagrams and distractor rationales | Match all 15 routes, variant indices, original question options and lab stage IDs. Every scientific claim has a named curriculum reference or an explicit review question. |
| 2 · Prototype 03 outside production | Three original-view entry points, optional workbench, text alternative, unseen transfer and all pilot states | Walk fresh, partial, complete, wrong-answer, hinted, retry, reset and return paths. With the same canonical actions, pilot-on and pilot-off yield identical progress. Exercise alone cannot complete the lesson. |
| 3 · Prototype Journey | Flat and illustrated renderings from one ordered link set | Every stop opens directly from a fresh profile. Check 05→06→07→08, 15→assessment, Back and Forward with both lab queries. Opening all stops yields 0/15 without evidence actions. |
| 4 · Observe and revise | Small moderated pilot: ask learners to narrate where each flank came from; log misconception, hint used and independent explanation separately | Professor signs off the answer key; resolve repeated ambiguity before expansion. One keyboard-only and one screen-reader walkthrough complete each pilot task, with preserved focus, usable zoom and identical reduced-motion outcomes. A small pilot cannot establish learning efficacy. |
| 5 · Expand by group | Implement optional practice in batches, reviewing the two lab overlays separately from P explorers | For every topic check correct, partial and wrong paths, and compare evidence snapshots to baseline. Unsolved P predictions never earn inspection. A failed enzyme gate adds no event. Undo/redo and replay retain the original molecular products. |
| 6 · Regression and release decision | Local QA results and separate decision record | Re-score saved bank v1 attempts identically. Old records, malformed/future records, blocked storage, temporary recovery and interleaved cross-tab resets follow the existing repository contract. Full credit remains 13 lessons plus two valid explicitly recorded reviews. A public release requires its own authorization and Phase 5 gate review. |

**Specific compatibility probes.** Start 03 from an old record with indices 0 and 2 and correct exercise. Finish the new workbench without selecting Genes or answering the original check: still incomplete. Select Genes and answer the original check correctly: complete. Change the check to an incorrect answer: incomplete again. Inspect operation keys before/after hint, hover, practice retry and map selection: zero extra operations attributable to these interactions. On Tn3, reaching the final state alone must leave an unrecorded review uncredited. Across all 25 bank items, compare IDs, order, options, correct indices, references and score with the frozen fixture before accepting any future change.

### Risks and decisions that contain them

- **A compelling diagram can imply an unmodeled reaction.** Caption static diagrams as explanatory and calculated outputs with their actual scenario and event. Review illustrations next to the source limitations. Do not animate nucleotide geometry or donor repair.
- **More clicks can dilute rather than deepen the lesson.** Make the new reasoning optional, keep the original view controls visible and test understanding with a fresh case. Distinguish “reviewed with support”, an independent response and official local completion in all copy.
- **Visual order can silently become stored identity.** Generate map nodes from topic IDs; pin existing variant indices, answer indices, stage order, experiment names, event semantics, bankVersion and operation keys. Defer any incompatible revision to a separately approved versioning plan.
- **Repeated writes magnify the known quota and replay costs.** Keep hints, practice, motion preferences derived from the OS, and Journey browsing outside learner history. Retain temporary-status notices and cross-tab behavior. Long-term retention, export, erasure and remote rollout remain separate decisions.
- **Perspective and color can obscure the biology.** Keep text labels level, use scientific tokens only for their existing meanings, test static list parity at narrow widths and distinguish arrows for gene direction from boundaries. A muted decoration must never conceal a selected or focused control.

**Status.** This document is a source-grounded design for review. Browser acceptance, professor approval and learner observations in the work packages are future checks.
