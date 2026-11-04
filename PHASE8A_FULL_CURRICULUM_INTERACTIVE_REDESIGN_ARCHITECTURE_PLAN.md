# SIASET Learn — Phase 8A: Full Curriculum Interactive Redesign Architecture

Planning report for Malek and the course professor · 4 November 2026

**Status: PLAN ONLY. No Phase 8B implementation is authorized by this report.**

The proposed direction is a stylized educational molecular environment with short missions, meaningful manipulation and a complete interactive 2D/text pathway. Use React Three Fiber (R3F) for inspecting bounded structures, tracing material and comparing molecular organization. Use 2D for historical reasoning, classification, transcription and conditional inference. Shared visual identity does not require every lesson to load WebGL.

The strongest first experiment is **Topic 03 plus Tn5**: can students distinguish element boundaries from host repeats, then follow one element into the engine-calculated product? Expand only after testing both understanding and access. A visually impressive scene is insufficient evidence of learning.

## 1. Reading this report and scope

- **V — verified:** observed in the inspected local source, read-only module evaluation, or explicitly attributed historical report. Source keys S1–S15 resolve to files in §15.
- **P — proposal:** future instructional content, UI, architecture or acceptance target. All sections describing new missions are P unless marked V.
- **A — approval needed:** a decision requiring Malek, scientific review, accessibility review or separate implementation authorization. Pending approval never means approval has been inferred.

The local source is the current implementation authority. Older reports establish history and outstanding limitations, not the current runtime by themselves. The referenced Improvement suggestions chat was read for intent; its approximate topic groupings are superseded by the exact local inventory below. Attached images from that earlier chat were not necessary to verify scientific or completion contracts; no claim is made to reproduce their appearance.

**Preservation boundary:** all fifteen identities, titles, ordering, canonical destinations, free navigation, original view/scenario indices, required questions, the complete 25-object bank-v1 content, progress denominator, explicit guided recording, scientific engines, event/replay contracts, sandbox, labs, browser storage and current Topic 03 workbench remain protected. This report proposes additive presentation and optional practice. Replacing an existing learning interface, changing evidence eligibility, persisting new practice, installing packages, modifying source or deploying requires separate authorization.

## 2. Verified baseline and compatibility contract

### 2.1 Exact curriculum registry

V: resolved from `topics.json`, composed `lessons`, and `topicHref`, rather than inferred from report prose [S1, S2]. A = original view-selection evidence; PRED = original prediction-gated scenario evidence; LAB = explicitly recorded guided review. These labels describe existing evidence, not proposed mission progress.

| # | Exact title | Exact ID | Canonical destination | Evidence |
|---|---|---|---|---|
| 01 | Introduction to Transposable Elements | `introduction` | `/learn/transposable-elements/introduction` | A: 3 views |
| 02 | History and Discovery | `discovery` | `/learn/transposable-elements/discovery` | A: 3 views |
| 03 | Transposon Structure and Anatomy | `anatomy` | `/learn/transposable-elements/anatomy` | A: 3 views |
| 04 | Classification | `classification` | `/learn/transposable-elements/classification` | A: 3 views |
| 05 | DNA Transposons | `dna-diversity` | `/learn/transposable-elements/dna-diversity` | A: 3 views |
| 06 | Conservative Cut-and-Paste Transposition | `conservative` | `/lab/transposable-elements?experiment=tn5` | LAB: Tn5 |
| 07 | Replicative Transposition | `replicative` | `/lab/transposable-elements?experiment=tn3` | LAB: Tn3 |
| 08 | Insertion Sequences | `insertion-sequences` | `/learn/transposable-elements/insertion-sequences` | A: 3 views |
| 09 | Composite Transposons | `composite` | `/learn/transposable-elements/composite` | A: 3 views |
| 10 | Genomic Consequences | `genomic-consequences` | `/learn/transposable-elements/genomic-consequences` | PRED: 4 contexts |
| 11 | Phenotypic Consequences | `phenotypes` | `/learn/transposable-elements/phenotypes` | PRED: 4 contexts |
| 12 | Gene Expression Effects | `expression` | `/learn/transposable-elements/expression` | PRED: 5 contexts |
| 13 | Target-Site Duplication | `tsd` | `/learn/transposable-elements/tsd` | PRED: 3 contexts |
| 14 | Regulation of Transposable Elements | `regulation` | `/learn/transposable-elements/regulation` | PRED: 6 contexts |
| 15 | Bacterial Transposable Elements and Horizontal Gene Transfer | `bacterial-hgt` | `/learn/transposable-elements/bacterial-hgt` | PRED: 12 contexts |

V: thirteen lessons contain **55 original views/contexts**; the two lab topics contribute the other two completion units. The inventory in §16 pins every saved index. Do not consolidate those indices merely because the new UI groups them into missions.

V: additional tool destinations remain `/learn/transposable-elements` (curriculum), `/learn/transposable-elements/assessment`, `/learn/transposable-elements/progress`, `/lab/transposable-elements/sandbox`, the base guided-lab route and `/` [S1]. Missing/invalid lab experiment selects Tn5; switching experiment remounts the session. Guided target boundary accepts integers 0–900; 900 is equivalent to 0. Sandbox placements remain 0, 200, 895, 900, with a separate session [S4, S10].

### 2.2 Evidence and assessment freeze

V [S3–S6]:

1. A lessons require deliberate activation of all three original view buttons plus correct **current** `exercise` and `check`. The displayed first preview awards nothing. Those view selections currently earn inspection regardless of optional practice performance.
2. PRED lessons require a correct prediction submitted in each original context before its index is recorded, plus correct `exercise`, `check` and `check2`. An incorrect context prediction does not award a new index. Previously earned indices persist until reset. A later wrong required question can revoke derived lesson completion.
3. Tn5 valid lab evidence requires final numeric **stage 4**, correct Tn5 checkpoint, exactly **one** replay-valid event and final phase `inserted`. Tn3 requires **stage 5**, both `tn3` and `resolution` checkpoints correct, exactly **two** replay-valid events and phase `resolved`. The learner must explicitly choose **Record completed guided review**. Reaching a product, browsing or using the sandbox does not record this review.
4. Total completion remains 13 lessons + 2 labs = 15. Local evidence is recorded review/current answers, not instructor certification, verified identity or an independent mastery measure.
5. Bank version 1 has exactly **25** question objects. `primary` derives from the original exercise/lab checkpoint; `additional` from `check2`; `evidence` from `check` for anatomy, tsd and bacterial-hgt; `replicative-resolution` from the resolution checkpoint. All questions must be answered to submit; scoring is one point per correct response. Attempts and scores remain separate from topic completion.

**Read-only verification performed for Phase 8A:** imported actual curriculum and question modules; resolved all fifteen routes; counted 13 lessons and 25 items; compared `JSON.stringify(questions)` to the parsed published fixture: **equal**, including object content and array order. The complete item ID mapping is in §16. Do not add mission questions to `lessons.js` or its phase files: bank generation would pick up such edits.

### 2.3 Current implementation and historical report findings

V: frontend is React 19 / React DOM 19, React Router 7 and Vite 7 by dependency ranges. R3F, Three.js and Drei are **not listed dependencies**. Current scientific graphics are SVG/HTML; no existing R3F renderer was found [S1, S3, S8].

| Inspected source/report | Verified finding and implication |
|---|---|
| Phase 6 implementation | Topic 15 has twelve contexts, a bounded bacterial model, Tn7 compatibility and explanatory integron classification. Its old browser-blocked status is historical. |
| Phase 6 learning architecture | Proposed all-topic optional practice, strict A/PRED/LAB separation, Topic 03 pilot and Journey. Journey is now implemented; future work must not recreate it as if absent. |
| Phase 7 implementation/audit/readiness | Sandbox, 25-item practice assessment and explicit lab recording exist. Scientific audit identifies symbolic coordinates, contextual outcomes and incomplete full-paper verification. Historical statements that dashboard cross-tab updates are not live are superseded by current repository/subscription code. |
| Phase 7A | Detailed anatomy inventories, semantic gaps, four tasks, first unaided eligibility, reset distinctions and scientific review questions. Use the implemented rubric as present behavior; do not assume every earlier proposed detail is a current UI fact. |
| Phase 7B | Optional anatomy workbench implements B/U/U2, transient drafts, ten-part fresh-case rubric and zero practice writes. Scientific approval remains pending. |
| Phase 7C | Five Journey groups, one ordered destination set, flat-list parity and read-only progress. No topic locks. |
| Phase 7D | Molecular glyphs and Journey depth remain static SVG/CSS. Motif direction, coding direction and whole-module orientation are distinct. |
| Phase 7E | Light anatomy surface, concise tasks, contextual features, prominent full text and collapsed secondary scientific notes; Journey previews initially hidden. Reports 82 passing tests, lint/build pass and route/narrow-width browser samples. These are **historical results**, not newly run Phase 8A tests. |

V: pending across the reports are scientific approval, full screen-reader and keyboard completion, true 400% zoom, OS reduced-motion/forced-colors execution, physical touch and wider browser coverage. No efficacy or public-release acceptance is established. Current plans must close these gaps rather than inherit a compliance claim [S12–S15].

V: metadata has scope mismatches worth preserving visibly in the plan. Lab topic statuses still say `implemented-awaiting-browser-validation` despite later reported browser samples. The `insertion-sequence` profile describes IS50 while the current lesson uses IS10; the `composite` profile is narrower than the lesson's Tn5/Tn10/Tn9 examples. These are not permission to widen engines or silently normalize metadata. Use the **lesson's explicit example and references for instructional anatomy**, and the **engine's supported scenario** for calculated output. A future metadata reconciliation needs separate review [S2, S11].

## 3. Learning and visual direction

P: build a quiet molecular work surface, not a navigable game world. A light, high-contrast specimen area, restrained depth, labeled components and a single task should dominate. Existing branding can frame it without changing scientific color meanings. Reuse the current donor, target, element, TSD, TIR, gene and res tokens; convert CSS colors to explicit renderer material values through one theme adapter. Shapes, patterns, labels and text always accompany color.

P: distinguish model roles visually: backbone rail/tube; element bracket/body; narrow terminal recognition tabs; broad coding arrows; small paired host-repeat capsules; internal res marker. Avoid atomistic balls, photorealistic proteins, nucleotide ladders or helical twist that implies solved strand topology. Any DNA twist used as decoration must be scientifically redundant and absent from the minimum-quality view. Spatial separation of product panels is an exploded diagram convention, not physical separation or decatenation.

P: recurring teaching loop is **inspect → make a claim → manipulate a constrained representation → compare evidence → explain**. Not every step needs animation. Require a conceptual decision rather than repeated target clicking. Do not gate recorded credit on new precision, speed, camera skill or optional practice success.

### 3.1 Concise text and progressive disclosure

P: default mission content budget, excluding exact title, necessary choices and accessible evidence:

- One goal of roughly 12–18 words, one instruction of at most 25 words, one essential premise of at most 30 words, and a short visible model caveat.
- One active contextual annotation, normally at most 40 words; one feedback sentence naming the claim to reconsider and its reason. Expand a “Why?” explanation on request.
- Hint ladder: orient attention → identify the relevant relationship → worked explanation. No unsolicited reveal of the key.
- Keep **all facts needed to solve the current question immediately available**. Essential assumptions, pre-insertion evidence, independence qualification and errors cannot be buried under a science-notes disclosure to hit a word target.
- “Read/use the full text model” appears before the viewport. “Scientific notes and sources” holds secondary detail. Original full lesson text and original required controls remain accessible through a clearly named recorded-lesson area.

P/A: initially add a short optional mission entry beside existing content. A later authorized shell may make the mission the default presentation and place long core exposition in a native disclosure, but must keep direct access to original evidence controls. Do not remove or rewrite original lesson/question definitions. Malek should approve the balance after pilot observation; no permission to replace the current workbench is implied.

## 4. Fifteen distinct mission specifications

All mission content below is **P**, with V anchors and exact evidence mappings. Each independent check is a proposed local transfer task, **outside the 25-question bank**. New cases and rubrics need professor approval; no new certified mastery or persisted score is proposed. Shared accessibility and state rules in §§5–10 apply to every topic.

### 01 · Introduction to Transposable Elements — “Lend the machinery”

**V anchor:** A; Intact Ac, Ds alone, Ds with Ac; `acds` [S2].

**Objective:** distinguish encoded autonomy from compatible protein availability and possible movement. **Mission/actions:** inspect Ac and a specified non-autonomous Ds; assign “encoded here” and “supplied in cell”; add/remove an Ac-protein token; revise mobility permission while retaining Ds's autonomy label. Manipulation changes a teaching premise, not a molecular genome.

**Representation/entities:** 2D paired element cards, compatible-end markers, transposase coding annotation, external protein token and two separate claim slots. Depth would not help the encoded-versus-supplied distinction; do not load R3F. Constraints come from the representative Ac/Ds lesson, not an executable Ac/Ds engine.

**Feedback/hints/text:** prompt “Can borrowed protein change what Ds encodes?” If Ds becomes “autonomous”, point to its unchanged coding annotation. Hints: inspect coding capacity → distinguish protein supply → movement may become possible while Ds stays non-autonomous. Keep compatible-ends/permissive-context premise visible.

**Access/checks:** native labeled supply checkbox and two selects mirror token placement; ordered before/after claims provide text parity. Formative: remove the supplier and explain the lost condition. Independent: a new annotated element lacks functional transposase but has compatible ends; require non-autonomy plus dependence on compatible supply, without guaranteeing movement.

**Evidence:** only original indices 0–2 and original exercise/check satisfy A. Token changes award nothing; bank remains `introduction-primary`. **Caveat/sign-off:** representative derivative only, no rate or guaranteed event. Professor: are the compatibility premises sufficient and the autonomy/mobility vocabulary appropriate?

### 02 · History and Discovery — “Build a supported explanation”

**V anchor:** A; Maize observations, Ac absent, Ac present; `mcclintock1950`, `acds` [S2].

**Objective:** separate historical observations, interpretation and a proposed causal comparison. **Mission/actions:** place evidence cards into observed / inferred / would test; connect a mutable-locus observation to a controlling-element interpretation; remove all compatible transposase sources in a clearly hypothetical Ds comparison; state the bounded conclusion.

**Representation/entities:** 2D evidence board with source-caption cards, claim links and defined comparison conditions. R3F would add navigation and imply reconstructed experiments without improving argument evaluation. No new historical dataset, kernel counts or animated maize phenotype.

**Feedback/hints/text:** “Which part was observed, and which part explains it?” Flag causal certainty beyond a card's evidence. Hints: recorded observation → explanatory claim → controlled comparison. Long historical context appears under “Read the source context”; card provenance and hypothetical status stay visible.

**Access/checks:** per-card radio group or select replaces drag; a linear argument list states links and provenance. Formative: reject deriving a transposase sequence from a mutable pattern alone. Independent: choose a defined Ac-withdrawal comparison supporting dependence and qualify it to the selected Ds derivative.

**Evidence:** original views 0–2 plus original exercise/check; bank `discovery-primary`. Sorting is practice only. **Caveat/sign-off:** no recreated chromosome breakage, timing, footprint or historical measurement. Professor must approve exact historical excerpts/paraphrases and citations before new observation cards are authored.

### 03 · Transposon Structure and Anatomy — “Find what belongs to the element”

**V anchor:** A; Boundaries, Genes, Insertion junction; existing optional `anatomyPractice.js` B/U/U2 and `AnatomyWorkbench` [S2, S8, S14].

**Objective:** delimit the element, read function separately from coding direction, and trace external repeats to one host interval. **Mission/actions:** tilt a shallow schematic to inspect labeled layers; place two semantic boundary handles; select a gene and separately assign function/direction; link both post-insertion repeats to the same pre-insertion source; count the displayed complete element. Drag snaps to existing gap IDs; selects remain primary alternatives.

**Representation/entities:** optional shallow R3F extrusion of the existing B case's eight blocks, nine gaps, gene labels and before/after source map. Educational test: does separating host/element annotation layers help learners distinguish origin while retaining adjacency? An aligned 2D reference is always available. Do not introduce fictional 3D molecular folding. If the pilot finds depth distracts, retain the current 2D workbench as preferred.

**Feedback/hints/text:** “Bracket the element. Leave host repeats outside.” Use existing semantic rubric: B g2–g6 includes B2–B5; diagnose each included host block or omitted end/gene. Role errors and direction errors are separate. Reuse current progressive hints and worked-answer labels. Source identity is supplied evidence, not a deduction from color.

**Access/checks:** complete ordered inventories and named gaps/sources; native forms work without WebGL. Formative: repair a bracket including a host repeat. Independent: preserve the existing U/U2 ten-criterion task and support/exposure rules, with both genes leftward, host repeats direct, and no initial correct bracket. Accessible evidence is not a hint. The current workbench remains available and unchanged until separately authorized; a renderer experiment must reuse its reducer/rubric rather than fork a competing answer key.

**Evidence:** original three view activations and two original questions only; practice still cannot complete anatomy. Bank remains `anatomy-primary`, `anatomy-evidence`. **Caveat/sign-off:** generic TIR-bearing educational draft, no bp scale, sequence, reaction or donor fate. Professor must approve every extruded inventory, motif convention and source relationship; Malek must approve whether depth actually helps.

### 04 · Classification — “Follow the intermediate”

**V anchor:** A; Ty: Class I, Tn5: Class II, Tn3: Class II; `ty`, `tn5-conservative`, `kitts1982` [S2].

**Objective:** classify using intermediate/template evidence rather than final copy count. **Mission/actions:** complete three pathway strips with supplied DNA/RNA/reverse-transcription labels; classify each; compare Tn3 copy gain with Ty and identify the different intermediate.

**Representation/entities:** 2D ordered pathway graph, intermediate cards, class assignments and an evidence field. A third dimension adds no relevant information to a categorical path; Ty remains conceptual, not an additional engine.

**Feedback/hints/text:** “Choose the class from the intermediate.” If Tn3 is labeled Class I due to copy gain, highlight the DNA-based premise. Hints: ignore count → identify template → RNA and reverse transcription support Class I. Explanations expand one strip at a time.

**Access/checks:** numbered sentences with native gap selects and class radios. Formative: correctly classify replicative Tn3 as Class II. Independent: classify an unnamed RNA/RT pathway and select “insufficient evidence” for a second case supplying only copy gain; require both claims.

**Evidence:** A 0–2 plus original exercise/check; bank `classification-primary`. Practice strip edits do not inspect original views. **Caveat/sign-off:** Ty is one exemplar, not all LTR/non-LTR mechanisms; Class II is not synonymous with conservative excision. Professor approves missing-step terminology and the uncertainty case.

### 05 · DNA Transposons — “Balance copies and backbones”

**V anchor:** A; Tn5, Tn3 cointegrate, Tn3 resolution; selected mechanism references in lesson [S2, S7].

**Objective:** track copy gain separately from joining and partitioning replicon structures. **Mission/actions:** compare before/after specimen trays; tag donor and target backbones; enter copy and molecule counts; associate the two recombinant Tn3 allocations with resolved products; identify which transition adds an element copy.

**Representation/entities:** optional R3F comparison of linear donor, target ring, cointegrate ring and resolved structural panels, backed by immutable snapshots from existing engines. A 2D ledger is the default answer interface. Depth is justified only for following connected backbones around a ring; it is not needed to count. Do not execute lab-completion events or persist a guided record from this lesson comparison.

**Feedback/hints/text:** “Count elements. Then ask which backbones share a molecule.” A mistaken disappearance on resolution highlights both product allocations. Hints: separate count from circles → trace both backbones → partition retains two copies.

**Access/checks:** row-header ledger plus ordered circular traversal, molecule headings and counts. Formative: locate the 1→2 change at cointegrate formation. Independent: given one fused circle followed by two product structures, name resolution and retained total two; identify physical unlinking as unknown.

**Evidence:** original A indices and exercise/check only; bank `dna-diversity-primary`; launch links still go to canonical labs. **Caveat/sign-off:** selected Tn3 route, not obligatory; no repaired Tn5 donor or decatenation implied by tray spacing. Professor approves topology captions and ancestry wording.

### 06 · Conservative Cut-and-Paste Transposition — “Account for every piece”

**V anchor:** Tn5 guided lab; five stages and one calculated event [S4, S7].

**Objective:** follow the conserved element, host-repeat ancestry and unresolved donor fragments. **Mission/actions:** inspect ends and donor/target ownership; select a teaching boundary using a ring marker or number input; answer the original prediction; explicitly run transposition; select the resulting element, both host repeats and donor fragments; compare with initial state. Rotation and feature selection provide inspection; no user-drawn cleavage or free protein docking.

**Representation/entities:** R3F linear donor and circular target, ordered blocks, features, two unrepaired fragments, inserted copy and target TSD pair, generated from engine state. Orbit/inspection helps connect a circular junction to its source interval and compare all products. Render validated endpoints; an optional short diagram transition cannot become a biochemical intermediate.

**Feedback/hints/text:** “Follow the original element into the target.” Wrong prediction retains the existing gate. Selection feedback distinguishes TIR inside versus host-derived TSD outside. Hints: identify ends → track one complete element → inspect both flanks. Keep “Donor repair unresolved” and symbolic model wording visible after the event.

**Access/checks:** full molecule/feature inventory, boundary number input, native original checkpoint/run/history controls and static 2D products. Formative: identify two repeats without calling them two elements. Independent practice: in a separately labeled fresh product inventory identify one element, two target repeats and unknown donor repair; no new persistence.

**Evidence:** preserve stage sequence inspect(0), predict(1), calculate(2), insertion(3), review(4), checkpoint and explicit recorder. New inspection tasks add no completion conditions. Bank `conservative-primary`. **Caveat/sign-off:** 9 bp label is Tn5-specific; coordinates symbolic; no donor repair, insertion preference or recognition geometry solved. Professor approves the endpoint-only transition and visibility of limitations.

### 07 · Replicative Transposition — “Diagnose the unresolved cointegrate”

**V anchor:** Tn3 guided lab; six stages, two calculated events, TnpR gate [S4, S7].

**Objective:** distinguish replication/copy gain from TnpR partitioning and unresolved physical topology. **Mission/actions:** inspect two starting circles; answer existing cointegrate prediction; explicitly form the cointegrate; trace donor and target backbones in one continuous traversal; select both internal res sites; answer resolution checkpoint; test TnpR off then on; compare calculated recombinant products and retained total two. Selection of res is optional inspection, never an extra scientific precondition or completion gate.

**Representation/entities:** R3F annotated rings, directly oriented copies, internal res/tnpA/tnpR/bla features, target TSD pair and ancestry. A fixed plan-view reference prevents camera perspective from reversing orientation. Depth supports tracing one connected structure; it must not suggest that displayed rings are geometrically accurate or physically unlinked.

**Feedback/hints/text:** “Two copies share one cointegrate. What can TnpR change?” Failed enzyme gate reports unchanged state/event count. Hints: count copies separately from circles → locate internal res → partition without deleting a copy. Strand transfer/replication explanation retains “state unchanged”; no moving forks, protein synapsis or cut-at-res chemistry.

**Access/checks:** ordered cyclic block list with return-to-start, same two checkpoints, enzyme checkbox and native commands. Formative: state retained when TnpR unavailable. Independent: new annotated product comparison requires one copy per product, two overall and physical unlinking uncomputed.

**Evidence:** inspect(0), transfer(1), replicate(2), cointegrate(3), recognize-res(4), resolved(5); checkpoint gates, two events, explicit recorder unchanged. Bank `replicative-primary`, `replicative-resolution`. **Caveat/sign-off:** permissive topology and competent direct res assumed; recombinant IDs are ancestry/allocation labels. Professor must approve all topology language and any layout suggesting product separation before this later rollout.

### 08 · Insertion Sequences — “Locate the source of movement functions”

**V anchor:** A; IS10, Composite comparison, Functional asymmetry; `is10-primary`, `tn5-ends` [S2].

**Objective:** distinguish recognition DNA, transposition-related coding DNA and external accessory cargo; recognize native Tn10 module asymmetry. **Mission/actions:** select each feature and assign its annotated role; compare compact IS10 with cargo between modules; identify IS10-R as the normal functional source in the supplied native Tn10 example. Removing a function label changes a teaching question, not a simulated sequence.

**Representation/entities:** 2D nested architecture strips with end tabs, gene arrow, IS module bracket and cargo. Keep levels aligned; depth would obscure what is inside a module. No IS10 transposition engine is introduced; profile IS50 text is not substituted for the lesson's IS10 data.

**Feedback/hints/text:** “Which annotation supplies the movement protein?” Cargo choice opens its accessory-role annotation; end choice distinguishes recognition from coding. Hints: read role → separate DNA recognition from protein coding → compare L/R capacity.

**Access/checks:** linear inventory, function selects and L/R radio choices. Formative: name the normally active module in the supplied Tn10 architecture. Independent: new explicitly annotated compact maps, one with interrupted transposase coding region; identify missing intrinsic supply while acknowledging compatible external supply could matter.

**Evidence:** A indices 0–2 plus original exercise/check; bank `insertion-sequences-primary`. **Caveat/sign-off:** IS families vary; no universal architecture or mobility claim from ends alone. Professor approves omitted regulation/overlap detail and asymmetry annotations; profile/lesson reconciliation remains a separate decision.

### 09 · Composite Transposons — “Build at the right structural level”

**V anchor:** A; Tn5, Tn10, Tn9; IS50, IS10, IS1 architectures [S2].

**Objective:** distinguish whole IS module orientation from terminal motifs and host repeats. **Mission/actions:** choose a named classical example; place its two supplied IS modules around cargo; set each whole-module arrow with a forward/reverse control; then inspect a separate terminal-motif inset. Validate Tn5/IS50 inverted, Tn10/IS10 inverted and Tn9/IS1 direct.

**Representation/entities:** 2D architecture assembly board with module brackets, cargo, orientation arrows and magnification inset. Optional static shallow shading shares visual style; R3F is unnecessary because the relevant relation is linear order and nesting. Flipping an answer token does not recombine real DNA or run a Tn9 engine.

**Feedback/hints/text:** “Orient the whole IS modules, not their terminal motifs.” Wrong Tn9 orientation cues same-level arrow comparison. Hints: identify module family → compare whole modules → distinguish long IS modules from external host repeats.

**Access/checks:** native module selects, direction buttons and complete text architecture. Formative: correct an inverted Tn9 module answer. Independent: given directly repeated IS1 modules around cargo, identify the composite arrangement and reject assigning a shared mechanism solely from architecture.

**Evidence:** original A views and exercise/check; bank `composite-primary`. **Caveat/sign-off:** equal module function is not assumed, cargo is distinct from machinery, Tn9 is an anatomy example only. Professor approves all nested brackets, orientation insets and any classical-example simplifications.

### 10 · Genomic Consequences — “Keep every product”

**V anchor:** PRED; four contexts; `rearrange` fixed block algebra and existing Tn5 insertion example [S2, S9].

**Objective:** distinguish insertion from homologous recombination and account for reciprocal/excised products. **Mission/actions:** choose a supplied substrate/event; predict interval fate; align homologous repeat labels using constrained snap points; calculate through the existing helper; allocate every returned block to a product tray; find a missing excised circle or reciprocal deletion.

**Representation/entities:** 2D ordered block strips as the primary model; optional R3F inspection of returned linear/circular product trays only. Alignment in 2D teaches repeat orientation better than free 3D crossings. No arbitrary crossover point, folding collision or strand solver. Use `rearrange` products/topology unchanged; insertion uses the existing engine.

**Feedback/hints/text:** “Where did interval X go? Account for every product.” Name the first omitted interval/product. Hints: identify substrates → inspect repeat orientations → account across all products. Keep homology and permissive-context premises visible.

**Access/checks:** ordered before/product strings, native allocation selects and product headings. Formative: recover X in the excised circle. Independent: a professor-approved renamed unequal-crossover template requires both duplication and deletion and the label recombination, not a new insertion.

**Evidence:** only correct original context submissions award indices 0–3; original exercise/check/check2 remain required. Bank `genomic-consequences-primary`, `-additional`. **Caveat/sign-off:** ideal block algebra, not nucleotide breakpoints, product survival or a universal TE outcome. Direct primary support for each illustrated topology remains an instructor review item; approval is needed before new visual rearrangement narratives.

### 11 · Phenotypic Consequences — “Ask what the assay measures”

**V anchor:** PRED; Coding insertion, Intergenic insertion, Regulatory insertion, Condition changed [S2].

**Objective:** separate a molecular lesion from a conditional phenotype and preserve uncertainty. **Mission/actions:** hold a defined biosynthetic lesion fixed; choose one of the supplied assay/medium contexts; mark which assumptions are known; predict likely altered / likely unchanged / undetermined; compare supplemented and unsupplemented reasoning without repairing the gene.

**Representation/entities:** 2D causal/evidence board, lesion card, pathway-dependence premise, nutrient-bypass card, assay and claim. No R3F: simulated growing cultures would imply measured dynamics. Outcomes are prescribed qualitative teaching contexts, not an engine that computes growth.

**Feedback/hints/text:** “The gene is disrupted. Does this assay require its pathway?” If supplementation is mistaken for repair, keep the lesion card unchanged and show the bypass premise. Hints: identify trait → pathway requirement → bypass/unknown information. Assay conditions stay visible; extra biological background can collapse.

**Access/checks:** radio context choice, premise checklist and a textual causal chain. Formative: explain unchanged growth with persistent molecular loss of function. Independent: poorly characterized promoter insertion with no assay context must yield undetermined plus the missing information needed.

**Evidence:** correct original predictions for indices 0–3 and original exercise/check/check2; bank `phenotypes-primary`, `-additional`. **Caveat/sign-off:** no real gene identity, quantitative growth, clinical claim or fitness coefficient. Professor approves every stipulated bypass and comparison baseline; Malek approves wording that makes “undetermined” a reasoned response rather than a failure.

### 12 · Gene Expression Effects — “Trace a supported transcription path”

**V anchor:** PRED; five supplied bacterial transcription contexts [S2].

**Objective:** distinguish initiation, direction, effective termination and independent downstream promoters. **Mission/actions:** select the active annotated promoter; orient a proposed transcription path; place a stop marker; inspect whether B has an independent promoter; classify only the supported qualitative transcription outcome. Choosing among supplied contexts does not invent promoter strengths.

**Representation/entities:** 2D operon lane with P, A, B, TE-associated promoter/terminator annotations, direction and alternative-start flags. Third-dimensional depth is irrelevant to this directional causal path. Any path highlight is an explanatory annotation, never an RNA/protein abundance simulation.

**Feedback/hints/text:** “Start at the promoter. Follow its direction and check for a stop.” Identify the first incompatible direction or stop; A disruption alone does not establish B decrease. Hints: initiation → direction → terminator and independent promoter. Essential promoter activity/termination assumptions remain beside the task.

**Access/checks:** numbered verbal path, direction selects and named start/stop choices. Formative: reverse an outward promoter and distinguish direct drive from unknown total transcription. Independent: new annotated A-interruption/B-independent-promoter case requires rejecting obligatory B decrease and naming the independent initiation evidence.

**Evidence:** correct original context predictions 0–4 plus exercise/check/check2; bank `expression-primary`, `-additional`. **Caveat/sign-off:** qualitative bacterial contexts; translation, protein abundance and phenotype not inferred. Professor approves transcript-path captions and effective-termination premises; never generalize IS2/IS3 annotations to every copy.

### 13 · Target-Site Duplication — “Trace one host interval twice”

**V anchor:** PRED; Tn5 junction, Tn3 junction, Non-universal outcome; `tsdEvidence` and existing engines [S2, S9].

**Objective:** trace duplicated host ancestry and distinguish element-specific TSD lengths from universal rules. **Mission/actions:** select a source interval before insertion; connect each output TSD to that interval; walk the circular Tn3 insertion block to locate both flanks; compare 9 bp and 5 bp labels; inspect the explanatory IS608 exception.

**Representation/entities:** R3F optional ring inspection plus synchronized 2D before/after source strips. Both TSDs derive from `pairId` and `sourceSegments`; ring traversal can expose that Tn3 repeats flank E2–donor–E1, not each copy separately. Enlarged feature geometry is disclosed. IS608 remains a 2D evidence card with no execution.

**Feedback/hints/text:** “Find the host source of both flanks.” Selecting TIR cues element origin; counting TSDs as elements cues complete copy boundaries. Hints: pre-insertion target → same source twice → compare element-specific labels. Gap filling stays in an optional schematic explanation, not a calculated animation.

**Access/checks:** source/destination selects with complete segment text and bp labels; ordered circular inventory. Formative: locate both Tn3 flanks around the insertion block. Independent: no-TSD IS608 evidence requires rejecting “no insertion occurred” solely because repeats are absent, without claiming an IS608 engine result.

**Evidence:** original correct predictions 0–2 plus exercise/check/check2; bank `tsd-primary`, `-additional`, `-evidence`. **Caveat/sign-off:** symbolic coordinate units are not a true sequence map; no strand geometry solved. Professor approves ancestry connectors, origin-wrap labels and non-universal explanation.

### 14 · Regulation of Transposable Elements — “Find the regulated step”

**V anchor:** PRED; six contexts across maize Ac/Ds, bacterial IS10 and Arabidopsis CACTA1/DDM1 [S2].

**Objective:** identify system-specific regulation and separate permission from predicted occurrence. **Mission/actions:** select organism/system; assign a supplied constraint to protein supply, transcription, translation or chromatin-associated silencing; switch between the prescribed paired contexts; make a qualitative claim and identify unresolved prerequisites.

**Representation/entities:** 2D system-specific control board with separate organism panels, premise cards, regulated-step labels and outcome claims. No R3F: a physical-looking universal switch would falsely unify distinct biology. No stress slider, event-rate dial or new regulation engine.

**Feedback/hints/text:** “Which step is constrained in this system?” RNA-OUT must point to translation, not transcription; supplied Ac must not relabel Ds autonomous. Hints: organism → molecular level → remaining prerequisites. Display a comparison baseline whenever the claim is “reduced”.

**Access/checks:** native organism/context selects and one fieldset per constraint; text chain of premise → supported claim → remaining unknown. Formative: contrast inactive pIN with functional RNA-OUT pairing. Independent: relaxed CACTA1 silencing with unknown copy competence requires undetermined next event and a reason, not guaranteed movement.

**Evidence:** original correct predictions 0–5 and exercise/check/check2; bank `regulation-primary`, `-additional`. **Caveat/sign-off:** no numeric frequency, universal stress effect or interchangeable host mechanism. Professor approves reduced/permitted/undetermined language and baseline assumptions for all six contexts.

### 15 · Bacterial Transposable Elements and Horizontal Gene Transfer — “Follow DNA across boundaries”

**V anchor:** PRED; twelve contexts in five activity groups; bounded bacterial engine, Tn7 compatibility and explanatory integron cases [S2, S9].

**Objective:** distinguish cell ownership, replicon identity, molecular movement, transfer, cassette capture and phenotypic inference. **Mission/actions:** select cell → replicon → embedded element; predict and inspect Tn5 plasmid loading in donor; separately test defined conjugation prerequisites; inspect retained donor and distinct recipient plasmid; classify unsupported transfer; match TnsD/TnsE to their supplied contexts; place an explanatory cassette within its integron and nested carrier.

**Representation/entities:** hybrid. Optional shallow R3F nested ownership view for two cells, chromosome identity markers, donor fragment, target plasmid and recipient plasmid; 2D chronology, Tn7 matching and integron board. Depth can help separate containment levels, but cell membranes remain schematic and never imply transport physics. All calculated cellular states come from `resistanceExample`/`bacterialTransition`; transfer is a separate bounded event, not a Tn5 event.

**Feedback/hints/text:** “Did DNA change location within a cell, or enter another cell?” If loading is called HGT, point to unchanged recipient ownership. Failed transfer names the missing prerequisite. Hints: cell boundary → prerequisites/helper assumptions → distinguish capture, targeting and transfer. Show one activity group at a time without hiding its original contexts.

**Access/checks:** nested cell/replicon inventory and ordered event log; native controls for all matching/classification. Formative: explain the no-helper transfer rejection. Independent: a new annotated recipient/cassette-plasmid evidence board asks which records distinguish transfer from capture and what assay is still needed for resistance; co-location alone establishes neither history nor phenotype.

**Evidence:** all twelve original predictions plus exercise/check/check2; bank `bacterial-hgt-primary`, `-additional`, `-evidence`. **Caveat/sign-off:** no selection dynamics, clinical outcome, Tn7 insertion or integron recombination product. Namespaced rendered recipient IDs must preserve source lineage without double-counting local engine IDs. Professor approves nested ownership, completed-conjugation wording and TnsD/TniQ scope before this batch.

## 5. Shared learning shell and component responsibilities

P: use a small family of reusable interaction patterns rather than one generic click-through activity for every topic. Proposed names are architectural responsibilities, **not existing files or exports**.

| Proposed responsibility | Owns | Must not own |
|---|---|---|
| `LearningShell` | Exact topic header, optional mission entry, task card, model mode, recorded-evidence summary, full-text/source disclosures, previous/next links | New route identities, completion calculations or biology |
| `MissionDefinition` | Topic ID, objective, case IDs, semantic action vocabulary, required premises, hint ladder, formative/transfer rubric, source keys | Mutations to original lesson definitions or bank |
| `MissionSession` | While-open drafts, active task, feedback, hints, support/exposure flags | Browser persistence, scientific truth or official evidence |
| `ModelAdapter` family | Read-only engine snapshot → semantic scene/text descriptors; teaching-case adapter explicitly distinguished | New molecular transitions or invented ancestry |
| `MolecularScene` | R3F geometry, selection presentation, clipping-safe labels and constrained camera | Direct engine calls, answer keys, repository imports |
| `DiagramView` / `TextModel` | Same descriptors as SVG/HTML and full ordered inventory | Independent scientific data/rubrics |
| `ActionPanel` | Native selections, predictions, target boundary, check/run buttons, hint and retry controls | Pointer-only operations or implicit recording |
| Existing canonical lesson/lab hosts | Original question controls, scientific execution, history/stages and repository callbacks | Automatic translation of practice success into credit |

P: keep shell outside any Canvas error boundary, so all text, controls, original content and persistence notices work when graphics fail. Lazy-load the R3F branch only when requested. Keep Journey as its existing read-only HTML/SVG navigator and preserve its flat list; a compulsory 3D curriculum map offers no identified conceptual benefit.

P: initial implementation boundary, if separately authorized, is an **optional renderer/practice module** in the existing anatomy and Tn5 pages. Retain existing workbench and lab interface as direct choices at the same URLs. Broader replacement/promotion to default is a later review decision. Avoid rendering two active copies of the lab controller or two repositories when presenting alternate views.

## 6. Authoritative models and declarative rendering

### 6.1 Separate four kinds of data

V [S7–S11], P adapter treatment:

| Data class | Existing authority | Proposed display rule |
|---|---|---|
| Calculated molecular state | `engine/model.js`, `tn5.js`, `tn3.js`, `index.js` | Render actual validated molecules, blocks, sites/features and lineage. Geometry is a projection only. |
| Fixed symbolic rearrangement | `engine/consequences.js` | Render returned before/products/topology; do not coerce these strings into Tn5/Tn3 states. |
| Bounded bacterial state/compatibility | `engine/bacterial.js` | Render ownership and event scope separately; compatibility boolean is not a molecular insertion. |
| Explanatory or qualitative teaching context | Lesson variant blocks/assumptions; anatomy case model | Label teaching example/qualitative claim; no scientific event or molecular revision is fabricated. |

P: each semantic descriptor should carry `topicId`, `caseId`, model kind, snapshot revision if applicable, source reference keys, visible caveat, ordered entities, accessible inventory and available **view** actions. Engine entity keys include molecule ID plus feature ID; bacterial entities additionally include cell/replicon context. A render namespace avoids collisions without editing source `copyId`, `lineageId` or event serialization.

### 6.2 Coordinate and geometry contract

V: engine features use zero-based half-open intervals; `studentLabels` converts to one-based inclusive display. Circular L equals 0. A source interval may cross origin and have multiple segments; one logical ID remains one feature. Block order and array order are scientifically meaningful [S7].

P: lay out a linear molecule along a reference axis and a circular molecule along a schematic closed curve, preserving ordered blocks and adjacency. Map interval fraction to curve parameter; attach feature overlays to the same mapping. Minimum visible thickness/arc and larger invisible pick areas are presentation adjustments, labeled “small features enlarged”. Never overwrite model coordinates with visual lengths. If an exploded view separates overlays from their carrier, include connectors and the aligned reference view; no topology change may be implied.

P: persistent screen/reference words “leftward/rightward” refer to the fixed map, not whatever direction an object appears after orbiting. Use a resettable plan view and an orientation key. Coding arrows, motif chevrons, whole-module arrows and reference orientation remain distinct. Labels should stay upright, never hidden behind geometry. DOM detail/text inventories are the reliable complete label set; avoid crowded 3D text as the only source of information.

### 6.3 Execute before presentation

P: pointer/native command → existing host validates teaching-stage/checkpoint eligibility → existing `actionForStep` creates action → existing `execute` calculates/validates state and event → host accepts new history → scene adapter receives immutable endpoint → optional short visual transition → inspect endpoint.

On error, retain prior history, revision, selection where valid and stage; announce the existing error code with concise explanation. Camera motion, feature selection and snap previews never call `transition`. A dropped object can set a draft teaching boundary; **Run transposition** remains explicit. Do not animate a “successful” outcome before engine validation. No physics solver, random biochemical trajectories, collision-based binding, new cleavage chemistry, continuous enzyme dynamics or sequence inference.

P: visual transition phases cannot enter engine history. Use endpoint crossfade/annotation change rather than choreographed strand cutting. If motion is skipped, interrupted or lost to fallback, show the accepted endpoint immediately. Visual completion is never required to answer, navigate or record an already valid review.

### 6.4 Tn5/Tn3 adapter invariants

V [S4, S7]:

| Scenario | Authoritative states/events | Renderer assertion |
|---|---|---|
| Tn5 initial | Linear donor + circular target, one element | Show no actual TSD pair yet; expected 9 bp is a forecast label only. |
| `tn5.transpose` | `inserted`, revision 1; two unrepaired donor fragments + circular target; one element, two target-derived 9 bp TSDs | Preserve original copy/terminal identities and unresolved donor repair. Do not draw joined donor ends. |
| Tn3 initial | Two circular replicons, one intact Tn3 | Internal TIR/tnpA/tnpR/res/bla annotations are symbolic. |
| `tn3.replicate` | `cointegrate`, revision 1; one circle, two direct copies, target-derived 5 bp pair | Follow donor–E1–right TSD–target remainder–left TSD–E2 cyclic order. Pair flanks E2–donor–E1 around the circle. |
| `tn3.resolve` | `resolved`, revision 2; two circular structures, one recombinant copy each, two overall; target retains TSDs | Show recombinant ancestry; product spacing is schematic. Keep “may remain catenated; decatenation not modeled” visible. |

V: total model length 1900 initially; 1909 after Tn5; 2205 after Tn3 formation and resolution. These are bookkeeping invariants, **not experimentally sized genomes**. Model element length 300 is symbolic; do not present it as a 300 bp transposon.

P: verify descriptor output against these invariants independently of rendered screenshots. Do not repair or normalize rejected engine states inside an adapter.

## 7. Interaction and state machines

### 7.1 Orthogonal state owners

P: keep five independent layers: repository-derived official evidence; authoritative molecular history; original guided teaching stage/answers; transient mission draft/support state; view mode/camera/selection. A change in one layer must not masquerade as a change in another. Existing lab host remains the sole owner of scientific history and original stage progression.

P practice state flow:

`ready → editing → checked(correct / reconsider) → editing or next case`

- Incomplete submission names missing fields, preserves inputs and does not count as a complete independent attempt.
- An edit clears stale verdicts; hint/reveal marks that case supported. A complete attempted submission also prevents a later retry being called first unaided success.
- A new case starts with empty choices and no answer overlays. Case exposure remains tracked while mounted; clearing answers does not erase exposure/support.
- Switching 3D/2D/text preserves case, draft, support, checked result and official evidence. Camera reset changes only view. Selection is cleared when it references an entity absent from the new snapshot.
- Navigating away/remount/reload may discard transient practice. Do not promise lifetime novelty or saved drafts; no new localStorage/sessionStorage/query-state persistence.

P renderer availability flow:

`2D ready → 3D requested → loading → 3D ready` or `failed → 2D ready`.

Context loss goes directly to usable 2D with the same domain state and draft. A voluntary retry creates only renderer resources. Renderer status never disables canonical required controls. Offer “Use 2D” before loading.

### 7.2 Guided stages stay exactly as implemented

V: Tn5 teaching stages share molecular cursors 0/0/1/1/1. Undo/redo land on inspect/calculate. Tn3 stages share cursors 0/0/0/1/1/2; undo/redo land on inspect/cointegrate/resolved. Strand transfer, replication explanation and res recognition do not calculate intermediate structures [S4].

P: show a compact stage heading and current task; preserve all original stage identities, order, checkpoint answers and `canAdvance`. A new scene subtask may be skipped without changing the original gate. Freeze or queue **view** transitions while a command is being committed to prevent double dispatch, but never introduce a new scientific event type or stage. Keep undo/redo/reset/replay semantics and redo-branch truncation. Switching scenarios retains the existing remount/reset behavior rather than pretending to resume a prior molecular session from an official completion badge.

## 8. Evidence boundary, storage and return behavior

V [S5]: existing legacy keys are `siaset-lessons-v1`, `siaset-guided-labs-v1`, `siaset-assessments-v1`; append operations use `siaset-progress-op-v1:`. Repository reads legacy records without rewriting them, merges known/pending operations and orders by logical clock then lexicographic ID. Inspection unions indices; answer operations replace a current answer; reset removes the lesson at its replay position. A later operation can recreate partial evidence. Failed reads prevent writes; failed writes can retain temporary pending progress in memory. Storage events synchronize, and focus/online attempt flush. Damaged/incompatible data is left untouched.

P: scene and mission modules have no repository/storage dependency. Only original canonical host callbacks may write. A newly designed mission must not wrap opening a scene as `recordLesson('inspect')`, copy a practice answer into a required radio, call `recordLab` on animation end, or turn a transfer case into a bank attempt.

| Return/reset case | Required compatible behavior |
|---|---|
| Fresh lesson or scene | Display previews without inspection credit. All new answers empty. |
| Old partial anatomy: inspected 0/2, exercise correct | Perfect optional mission still incomplete. Original Genes action and correct original check can complete; a wrong original check revokes completion. |
| Already complete | Offer practice without erasing/requiring new evidence. Failed practice cannot revoke official completion. |
| Local lesson Reset | Existing repository reset and current workbench clear integration retained; new local practice may clear, with exposure/support retained appropriately. |
| Remote evidence/reset | Refresh official summary; do not infer a reset from an undifferentiated snapshot and erase unrelated practice drafts. Do not replay practice to repair missing evidence. |
| Concurrent reset/answer | Honor actual deterministic operation order, including equal-clock ID tie order; no stronger reset-wins claim. |
| Lab final product without Record | Review still unrecorded; scene success is not lab evidence. |
| Temporary/failed saving | Keep existing persistence notice and dedicated Retry action; practice cannot fix saving. Reload can lose temporary work. |
| Navigation/Back | Preserve existing route focus/scroll behavior and actual official evidence; disclose that remounted drafts may be empty. |
| Renderer loss/change | Same history, answers and eligibility; no extra canonical operation. |

P: zero-write acceptance means **zero new operations attributable to practice**. Existing focus/online recovery may flush prior pending canonical work; compare operation identities and payloads rather than incorrectly requiring a globally unchanged storage count under recovery.

## 9. Camera, keyboard, screen reader, touch and motion

P: camera controls are optional inspection aids. Default to a readable plan/near-orthographic view with shallow depth. Provide explicit Rotate left/right/up/down, Zoom in/out, Fit model and Reset view buttons; enforce bounds that prevent clipping, inversion of reference meaning or losing the specimen. No automatic orbit, fly-through, scroll hijacking or required camera puzzle. Disable or tightly bound pan initially. Camera state is transient and absent from molecular events.

P: canvas pointer input is scoped to the viewport. A click selects semantic entity; pointer drag may orbit only when no answer handle is active. Boundary handles snap to named gaps/allowed teaching coordinates. Cancel drag restores its draft; releasing outside does not execute biology. Zoom should not intercept ordinary page scroll unless the user explicitly activates the viewport control. Touch has labeled select/place controls; pinch/orbit is optional, and page scrolling remains available.

P accessibility contract:

- Native DOM controls perform every scientific/practice action. The WebGL canvas is redundant with the model inventory, and is excluded from duplicate screen-reader traversal; its short visible caption explains the equivalent path. Do not use blanket application roles.
- A “Use full text model” control precedes the viewport and exposes all ordered entities, direction words, origin, topology, supplied annotations, comparison evidence, choices and errors **before answers are submitted**. It is an interactive route to the same rubric, not a prose-only consolation page.
- Select entities from a native list; mirror selection in graphics. Use stable labels rather than relative “this arrow”. Keep focus on Check/Run after results; announce one concise result in a polite status, with field-error links. Do not announce camera frames or full inventories on every selection.
- Keep existing skip link, route title/heading focus and Back/Forward restoration. Explicit task navigation may focus the new section heading; model updates never unexpectedly steal focus.
- Minimum proposed targets 44×44 CSS px; ordinary text contrast ≥4.5:1; essential graphic/control boundaries ≥3:1. Check selected, focus, error and forced-colors states separately.
- At 320 CSS px and true 400% browser zoom, stack panels in DOM order. Required controls/text path must solve without horizontal scrolling. A larger optional viewport may pan, but cannot be the sole evidence.
- Reduced motion removes camera interpolation, damping, tweening, crossfades and animated emphasis. Endpoint changes, content and eligibility remain identical. Explicit camera increments remain immediate. No flashing, auto-spin or time-limited reaction task.

P: test with NVDA plus a Windows browser, keyboard alone, physical touch, forced colors and OS motion settings. DOM structure inspection is necessary but does not establish usable announcements. A supplied evidence legend never counts as a hint or reduces independent eligibility merely because a learner uses the accessible pathway.

## 10. Low-spec performance and WebGL fallback

P: performance budgets below are proposed acceptance thresholds, not observed measurements. Confirm the actual laptop/browser baseline with Malek before implementation. Suggested baseline: Windows laptop, integrated graphics, 8 GB RAM, 1366×768 display, recent supported Chrome/Edge, on battery as well as mains.

P: lazy-load renderer modules only after 3D request on an eligible topic; 2D-only topics and curriculum overview never download a 3D scene. Keep one active Canvas per page, not one per molecule or comparison panel. Prefer simple reusable geometry, few materials, instancing for repeated pieces, no realtime shadows, postprocessing, reflective environments, particles or heavy model downloads. Do not force a GLTF/texture pipeline for symbolic blocks.

P: use demand rendering at rest; invalidate on selection, camera input or a bounded transition. DPR begins at 1 on low quality and is capped at 1.5 on standard quality. Suspend rendering in hidden tabs/offscreen surfaces; dispose scene-specific buffers/materials/controls and reuse shared assets with explicit ownership. Avoid React state updates per animation frame. Reduce geometry/antialiasing before sacrificing labels or source evidence.

P quality ladder: standard → low geometry/DPR → 2D. Offer a manual choice as well as automatic degradation from sustained poor frame time. Store preference only in component memory for this scope. Lack of WebGL2, denied context, context loss, renderer chunk failure or unsupported resources produces the complete 2D model immediately. No forced retry loop; explain briefly and offer one explicit retry. The lesson must remain usable even if the renderer cannot initialize at all.

| Proposed budget | Acceptance measurement |
|---|---|
| 2D shell usable | Within 2 s on agreed cached/local baseline; test cold load separately under a documented 10 Mbps/100 ms network profile. |
| Optional 3D usable | Within 5 s cold request under that network profile; controls/text remain usable throughout. |
| Interaction responsiveness | Model-selection/feedback visible within 100 ms p95 on baseline device; exclude intentional network load and report sample count. |
| Active manipulation | At least 30 fps at p95 frame time ≤33 ms during a representative 30 s orbit/selection sequence on agreed laptop. If unmet, lower quality or prefer 2D. |
| Idle | No continuous render loop after settling; verify frame submissions cease absent invalidation. |
| Pilot scene complexity | Start ≤100 draw calls and ≤100k visible triangles; measure actual production scene, not source guesses. |
| Optional renderer payload | Target ≤350 kB gzip additional JS for first pilot renderer; 0 additional 3D JS on 2D-only routes. If exceeded, record analysis and obtain a revised budget before expansion. |
| Resource lifecycle | After ten route/renderer toggles, no monotonic growth in retained renderer resources; compare geometry/texture counts after settling. |
| Failure recovery | 2D controls available within 1 s after detected context failure, retaining history/drafts and producing no new evidence operations. |

P: numeric budgets are adjustable by recorded decision; scientific correctness, parity and no false completion are nonnegotiable. If loading must be deferred, default to 2D rather than make learners wait for a stylized environment.

Technical basis checked on 4 November 2026: official R3F documentation pairs Fiber 9 with React 19; this fits the current manifest's React major, but exact versions/peer dependencies must be checked again at authorized installation. Official guidance supports demand rendering, resource reuse and instancing. Three.js documents OrbitControls and renderer disposal. These justify techniques, not the project's unmeasured budgets. Sources: [R3F introduction](https://r3f.docs.pmnd.rs/getting-started/introduction), [R3F performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Three.js OrbitControls](https://threejs.org/docs/pages/OrbitControls), [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).

P/A: proposed minimal dependency set is `three` plus a React-19-compatible `@react-three/fiber`; use Three's controls directly or a narrowly imported Drei helper only after a bundle/maintenance decision. No physics, animation framework or state library is justified by the current requirements. Exact package pins, lockfile changes and license/dependency review belong to separately authorized implementation, not Phase 8A.

## 11. Verification and acceptance plan

P: compare the same canonical action sequences with the new feature disabled, 2D, 3D and forced fallback. Compare serialized scientific state/events, original records and score outcomes; visual parity alone is insufficient.

| Area | Required test/evidence | Pass condition |
|---|---|---|
| Identity/navigation | All 15 resolved destinations; exact titles/order; 05→06→07→08, direct URL/reload, invalid experiment, Back/Forward; tools preserved | No altered route/query semantics, locks or visit credit. |
| Assessment | Full bank fixture equality, all item IDs/order/options/keys/explanations/references; saved v1 attempts re-scored | 25 exact objects; scores unchanged; practice never appends an attempt. |
| Lesson credit | Fresh/partial/complete/wrong/recovery; every original variant index | A explicit selections retained; PRED wrong predictions cannot add inspection; optional success cannot substitute for original answers. |
| Tn5 | Boundaries 0/200/895/900 and invalid values; state, copies, TSD ancestry, fragments, history | Existing engine output unchanged; one event and explicit record gate. |
| Tn3 | All stages/cursors, TnpR off/on, errors, cointegrate traversal, resolution/ancestry, undo/redo/replay/branching | Exactly two valid events; no event on rejected gate/explanatory stage; two copies retained. |
| Descriptor parity | Molecule/feature IDs, origin-wrap segments, order, topology, directions, annotations and source relationships across 3D/SVG/text | Same scientific descriptor and rubric; no lost/duplicated feature from origin crossing or display enlargement. |
| Practice independence | First unhinted, hint used, wrong-then-correct, incomplete submit, repeated/revisited case, clear and mode switch | Correct limited label; no lifetime-novelty or mastery claim. Anatomy existing B/U/U2 rules remain intact. |
| Persistence | Instrumented operation attribution; cross-tab answer/reset races, damaged/future records, denied reads, quota failure and recovery | Existing repository semantics; no practice operation or overwritten unrelated evidence. |
| Accessibility | Complete all pilot tasks without pointer/canvas; screen-reader announcements; 320 px/400%; forced colors; physical touch | Same evidence, answers and results; no traps, hidden required assumptions or inaccessible input. |
| Motion/failure | OS reduced motion; chunk failure, unavailable WebGL2, context loss during optional transition | Instant endpoint/text parity, preserved domain state and working canonical controls. |
| Visual science | Professor reviews every initial/product frame, label, origin relation and explanatory badge in both modes | No unsupported geometry, chemistry, donor repair, catenation or probability claim. |
| Runtime/performance | Console, lifecycle and measured budgets in §10, supported browsers | No new runtime errors or resource growth; target met or documented switch to 2D. |

P: future automated checks should extend meaningful existing engine/contract/progress tests and add pure descriptor/rubric tests, then browser interaction tests for the new risks. Do not duplicate implementation details in brittle snapshots as the only evidence. Existing `npm test`, lint and production build are required in an implementation phase; build output must not be regenerated in this planning phase. Production-host direct-route acceptance/deployment remains separately authorized.

### 11.1 Learning/overwhelm evaluation

P/A: moderated pilot with a small, explicitly nonrepresentative group (suggest 6–8 learners spanning familiarity and device/access needs). Use parallel professor-approved cases and counterbalance 2D-first/3D-first order; record support, evidence-path use and camera difficulty separately. Do not feed observations into local progress storage or introduce telemetry in this scope.

Proposed formative acceptance signals: at least 80% complete the primary boundary/copy task without facilitator rescue; median clarity rating at least 4/5; at least 80% distinguish TSD count from element count on the transfer task; every recruited access-path participant can finish equivalent tasks; no repeated scientific misconception attributable to perspective or motion. Measure time to first meaningful action, unnecessary disclosure openings, hints, unaided explanations and reported text overload against the current workbench. Small samples give design signals, not efficacy proof. If fewer participants are available, report raw counts and observations without treating percentages as robust findings.

P: if 3D does not improve explanation or introduces camera burden, keep the same mission in 2D and use 3D as optional inspection only. Revise text grouping if learners must open multiple disclosures to discover essential premises. Do not improve apparent completion rates by weakening existing evidence requirements.

## 12. Phased rollout and rollback boundaries

Everything here is future work contingent on explicit implementation authorization. No package or release step is authorized now.

| Package | Scope and reviewable result | Exit gate |
|---|---|---|
| 8A — this report | Exact inventory, source/evidence mapping, mission/renderer architecture, approval register | User reviews plan; unresolved decisions recorded. No implementation. |
| 8B-0 — freeze and content review | Content-approved pilot figures/rubrics, measured baseline devices, immutable bank/evidence fixtures, package proposal | Professor approves new visual semantics; Malek approves scope and exact protected interfaces. |
| 8B-1 — shell + Topic 03 pilot | Optional R3F adapter using current B/U/U2 data, existing workbench preserved, 2D/text parity and renderer-failure path | All pilot correctness/access/zero-write checks; depth improves or at least does not obstruct explanation. No default replacement without approval. |
| 8B-2 — Tn5 pilot | Single-event renderer, explicit command, original stages/checkpoint/recorder/history preserved | Full Tn5 state/event parity, low-spec/context-loss acceptance and learner observation. Review 03→06 transfer. |
| Batch 1 — foundations/architecture | Topics 01, 02, 04, 08, 09; focused 2D boards/assembly with common shell | Distinct conceptual tasks, approved case keys, original A evidence unchanged; no mandatory WebGL. |
| Batch 2 — mechanisms/junctions | Topics 05 and 13 using tested adapters and engine-derived comparisons | Copy/backbone/source tracing correct; Tn3 cointegrate insertion-block flanks reviewed. Topic 07 guided interface still unchanged. |
| Batch 3 — consequences/context | Topics 10, 11, 12, 14; block-accounting and qualitative reasoning boards | Every assumption/outcome reviewed; all PRED contexts and required questions retained; uncertainty preserved. |
| Batch 4 — bacterial context | Topic 15 nested ownership plus separate targeting/integron 2D branches | All twelve contexts; transfer gate/lineage parity and no phenotype/selection overclaim. |
| Batch 5 — Tn3 guided redesign | Topic 07 complex ring tracing, resolution gate, ancestry and topology caveats | Full six-stage/two-event tests, scientific sign-off of all views and complete accessibility walkthrough. |
| Final acceptance decision | Whole-course local regression, performance/access evidence, report of outstanding limits | Separate approval for replacing defaults and, later, any public deployment. |

P: this sequence covers all fifteen topics and deliberately delays Tn3's guided renderer until the simpler adapter and failure model are proven. Topics 05/13 may display existing Tn3 snapshots before Topic 07 changes; that is read-only comparison, not an early rewrite of the lab.

P rollback: an implementation feature switch should select original presentation by default until pilot review; configuration/session-only control needs no storage schema. Disabling the new module must return the existing workbench/lab interface on the same routes, retaining evidence and accepted engine history while mounted. A renderer failure falls back to 2D, not a blank page. No progress migration, experimental evidence conversion or rollback deletion is needed because the protected contracts never change. Exact feature-switch implementation is a future decision, not a new dependency requirement.

## 13. Approval register and scientific review questions

No approval is asserted. Review each item as approve / revise / unresolved, recording reviewer, date, affected cases/screens and exact correction.

| Decision | Owner | Recommendation / question | Status |
|---|---|---|---|
| Implementation authorization | Malek | Approve a bounded Topic 03 + Tn5 optional prototype only after reviewing this plan; source/dependency work is a separate action. | Pending |
| Overall visual style | Malek + professor | Light stylized molecular surface with readable labels and restrained depth; approve whether R3F is optional by default after pilot. | Pending |
| Exact anatomical figures | Professor | Approve current B/U/U2 draft inventories, motif/coding/reference directions and any shallow extrusion. No new named sequence or scale. | Pending |
| Every topic's new cases | Professor | Approve each mission's independent rubric, premises, hints and distractors; refer to per-topic questions in §4. | Pending |
| Molecular visual transitions | Professor | Approve endpoint-only depiction and wording; confirm no transient animation is read as calculated chemistry. | Pending |
| Tn3 topology | Professor | Approve direct res, recombinant ancestry, insertion-block TSD flanks, permissive topology and persistent catenation caveat. | Pending |
| Historical evidence | Professor | Which primary-source observations/paraphrases can be placed on the discovery board, and how must hypothetical tests be labeled? | Pending |
| Rearrangement evidence | Professor | Approve the idealized templates and direct source support for each illustrated topology; do not equate them with universal transposition products. | Pending |
| Conditional inference | Professor | Approve assay/bypass/promoter/termination premises and the reduced/permitted/undetermined rubrics. | Pending |
| Bacterial context | Professor | Approve completed-conjugation abstraction, identity namespaces, Tn7 factor scope and noncomputed integron capture. | Pending |
| Device and language baseline | Malek | Confirm actual laptop/browser/touch targets, vocabulary/course language, and whether bilingual content is needed. Do not assume translation authorization. | Pending |
| Accessibility acceptance | Accessibility reviewer + Malek | Agree screen-reader/browser pair and representative access participants; full task completion required. | Pending |
| Dependency/version/budget | Implementer + Malek | Approve minimal package set and measured budgets; exact peer versions rechecked at installation. | Pending |
| Practice data retention | Malek | Keep session-only practice with no new telemetry/storage. Any persistence/mastery model needs a separate versioning decision. | Proposed; unapproved change outside scope |
| Existing-interface replacement | Malek | Retain original workbench/lab until separate approval after prototype review. | Protected |
| Public release | Malek + appropriate reviewers | Separate deployment authorization and release evidence; prior test reports do not grant it. | Outside Phase 8A |

Scientific source discipline: reuse existing registry IDs and their access/verification caveats. This inspection checks code/data consistency, not every paper's full text. New sequences, named gene maps, protein structures, quantitative mechanisms, target probabilities, growth/resistance results and claimed novel scientific behavior require new reviewed provenance. R3F documentation is technical support only, not biological evidence.

## 14. Phase 8A verification and limitations

Completed read-only inspection: current metadata and all thirteen lesson implementations, both lab flows, Tn5/Tn3/model/event code, consequence and bacterial helpers, anatomy data/rubric, current renderers, Journey/routes, repository/completion/assessment contracts, manifest, tests as a contract inventory, Phase 6 implementation/architecture and Phase 7 implementation/audit/readiness plus 7A–7E reports. Read the referenced chat through the connected thread tool. No subagents were used.

Executed only read-only curriculum/bank evaluation and report consistency checks. **No fresh full test-suite, lint, build, dev server, browser acceptance, package installation, Git operation or deployment was performed.** This document's future performance/access/learning thresholds are proposals, not results. The historical 82-test statement belongs to Phase 7E.

Before creating this report, an aggregate SHA-256 was computed over 157 pre-existing project files, excluding tool/private directories and dependencies. After writing and checking the report, the same 157-file set produced the identical aggregate: `31637e8f06b6dcb933e4eb605571a35ef56cfbf5603e799f5da1c85d6eec1871`. **All sampled pre-existing files were unchanged.** The new report itself is excluded from that comparison. This is a filesystem-content comparison, not Git status or proof about excluded directories.

Report checks confirmed fifteen mission sections, every exact topic title/ID/canonical destination, all 25 bank item IDs, all 55 original view/context indices and 49 valid local source links. No broken local source link was found. The generated evidence inventory was appended only to this report. These checks establish report coverage and link integrity, not prototype correctness or scientific approval.

## 15. Source index

Source keys used above are local evidence references. Linked paths are absolute; file-level references identify implementations rather than pretend to cite a line not verified here.

| Key | Source and what was inspected |
|---|---|
| S1 | [topics.json](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/curriculum/topics.json>), [main.jsx](</C:/Users/Administrator/Self Study/SIASET/frontend/src/main.jsx>), [frontend package](</C:/Users/Administrator/Self Study/SIASET/frontend/package.json>), [navigation](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/curriculum/navigation.js>), [experiment routing](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/experimentRouting.js>) — IDs/titles/order/routes/dependencies. |
| S2 | [lessons.js](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/curriculum/lessons.js>), [phase5.js](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/curriculum/phase5.js>), [phase6.js](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/curriculum/phase6.js>) — all objectives, concepts, variants, original questions and limitations. |
| S3 | [Lessons](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/Lessons.jsx>), [LessonActivities](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/components/LessonActivities.jsx>), [ConsequenceExplorer](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/ConsequenceExplorer.jsx>), [BacterialExplorer](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/BacterialExplorer.jsx>) — actual evidence callbacks and presentation. |
| S4 | [Laboratory](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/Laboratory.jsx>), [guidedStages](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/guidedStages.js>), [learning](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/learning.js>) — stages, cursors, checkpoint gates, boundary and execution. |
| S5 | [lessonProgress](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/lessonProgress.js>), [learnerRecords](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/learnerRecords.js>), [progressRepository](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/progressRepository.js>), [useProgress](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/useProgress.js>) — completion, validation, storage and subscription. |
| S6 | [assessment](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/assessment.js>), [published fixture](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/tests/assessment-v1.json>) — generated objects, IDs/scoring and verified equality. |
| S7 | [engine model](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/model.js>), [Tn5](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/tn5.js>), [Tn3](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/tn3.js>), [engine index](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/index.js>), [engine contracts](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/contracts.js>), [scientific contracts](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/contracts/SCIENTIFIC_CONTRACTS.md>) — scientific authority and history. |
| S8 | [anatomyPractice](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/anatomyPractice.js>), [AnatomyWorkbench](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/components/AnatomyWorkbench.jsx>), [MoleculeView](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/components/MoleculeView.jsx>) — existing practice cases/rubric and graphics. |
| S9 | [consequences](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/consequences.js>), [bacterial](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/engine/bacterial.js>), [Phase 5 contract](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/contracts/PHASE5_CURRICULUM.md>), [bacterial contract](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/contracts/PHASE6_BACTERIAL.md>) — bounded supporting models. |
| S10 | [sandboxSession](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/sandboxSession.js>), [journey](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/journey.js>), [Curriculum](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/Curriculum.jsx>) — supported independent preset and navigation model. |
| S11 | [mechanism profiles](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/profiles/mechanisms.json>), [reference registry](</C:/Users/Administrator/Self Study/SIASET/frontend/src/features/transposable-elements/profiles/references.json>) — scientific scope/provenance; registry statuses are not fresh full-text verification. |
| S12 | [Phase 6 implementation](</C:/Users/Administrator/Self Study/SIASET/PHASE6_REPORT.md>), [Phase 6 architecture](</C:/Users/Administrator/Self Study/SIASET/PHASE6_LEARNING_ARCHITECTURE_PLAN.md>) — bacterial baseline and prior all-topic plan. |
| S13 | [Phase 7 report](</C:/Users/Administrator/Self Study/SIASET/PHASE7_REPORT.md>), [scientific audit](</C:/Users/Administrator/Self Study/SIASET/PHASE7_SCIENTIFIC_AUDIT.md>), [release readiness](</C:/Users/Administrator/Self Study/SIASET/PHASE7_RELEASE_READINESS.md>) — tools/evidence and historical validation limits. |
| S14 | [Phase 7A specification](</C:/Users/Administrator/Self Study/SIASET/PHASE7A_TOPIC03_SCIENTIFIC_UX_SPECIFICATION.md>), [Phase 7B report](</C:/Users/Administrator/Self Study/SIASET/PHASE7B_TOPIC03_IMPLEMENTATION_REPORT.md>) — anatomy scientific/UX contract and implemented behavior. |
| S15 | [Phase 7C report](</C:/Users/Administrator/Self Study/SIASET/PHASE7C_DNA_JOURNEY_IMPLEMENTATION_REPORT.md>), [Phase 7D report](</C:/Users/Administrator/Self Study/SIASET/PHASE7D_VISUAL_EXPERIENCE_IMPLEMENTATION_REPORT.md>), [Phase 7E report](</C:/Users/Administrator/Self Study/SIASET/PHASE7E_UI_UX_POLISH_IMPLEMENTATION_REPORT.md>) — current Journey/workbench refinement and outstanding review. |

## 16. Exact original evidence and bank inventory

V: generated from current imports for this report. View numbers below are zero-based saved indices, not proposed task order. A requires all listed indices plus original exercise/check; PRED requires correct original context predictions plus exercise/check/check2; LAB uses §2.2. Item IDs are complete and case-sensitive.

| Topic | Exact original view/scenario order | Frozen bank item IDs |
|---|---|---|
| 01 / `introduction` | 0: Intact Ac<br>1: Ds alone<br>2: Ds with Ac | `introduction-primary` |
| 02 / `discovery` | 0: Maize observations<br>1: Ac absent<br>2: Ac present | `discovery-primary` |
| 03 / `anatomy` | 0: Boundaries<br>1: Genes<br>2: Insertion junction | `anatomy-primary`<br>`anatomy-evidence` |
| 04 / `classification` | 0: Ty: Class I<br>1: Tn5: Class II<br>2: Tn3: Class II | `classification-primary` |
| 05 / `dna-diversity` | 0: Tn5<br>1: Tn3 cointegrate<br>2: Tn3 resolution | `dna-diversity-primary` |
| 06 / `conservative` | Guided tn5; exact stages in §§4, 7 | `conservative-primary` |
| 07 / `replicative` | Guided tn3; exact stages in §§4, 7 | `replicative-primary`<br>`replicative-resolution` |
| 08 / `insertion-sequences` | 0: IS10<br>1: Composite comparison<br>2: Functional asymmetry | `insertion-sequences-primary` |
| 09 / `composite` | 0: Tn5<br>1: Tn10<br>2: Tn9 | `composite-primary` |
| 10 / `genomic-consequences` | 0: Insertion<br>1: Direct-repeat recombination<br>2: Inverted-repeat recombination<br>3: Unequal crossover | `genomic-consequences-primary`<br>`genomic-consequences-additional` |
| 11 / `phenotypes` | 0: Coding insertion<br>1: Intergenic insertion<br>2: Regulatory insertion<br>3: Condition changed | `phenotypes-primary`<br>`phenotypes-additional` |
| 12 / `expression` | 0: Promoter disruption<br>1: Outward promoter aligned<br>2: Outward promoter reversed<br>3: Operon termination<br>4: Read-through | `expression-primary`<br>`expression-additional` |
| 13 / `tsd` | 0: Tn5 junction<br>1: Tn3 junction<br>2: Non-universal outcome | `tsd-primary`<br>`tsd-additional`<br>`tsd-evidence` |
| 14 / `regulation` | 0: Maize: Ds without Ac<br>1: Maize: Ac supplied<br>2: Bacterial IS10: RNA-OUT<br>3: Bacterial IS10: promoter inactive<br>4: Arabidopsis CACTA1: silenced<br>5: Arabidopsis: ddm1 context | `regulation-primary`<br>`regulation-additional` |
| 15 / `bacterial-hgt` | 0: 1 · Identify bacterial DNA<br>1: 2 · Within-cell movement<br>2: 2 · Between-cell transfer<br>3: 2 · Nonconjugative plasmid<br>4: 3 · Resistance: starting state<br>5: 3 · Resistance: plasmid loading<br>6: 3 · Resistance: recipient acquisition<br>7: 4 · Tn7: glmS context<br>8: 4 · Tn7: transfer-related replication<br>9: 4 · Tn7: mismatched route<br>10: 5 · Integron cassette capture<br>11: 5 · Nested mobile DNA | `bacterial-hgt-primary`<br>`bacterial-hgt-additional`<br>`bacterial-hgt-evidence` |
