# SIASET Learn Phase 7A — Topic 03 scientific and UX specification

Planning report for Malek and the course professor · 3 November 2026

**Status: review-ready proposal; scientific approval pending. Planning only.** This report finalizes the proposed content and interaction contract for Topic 03, **Transposon Structure and Anatomy**, ID `anatomy`, route `/learn/transposable-elements/anatomy`. It does not implement the proposal or authorize implementation or release. Topic 13 remains the separate `tsd` lesson.

The Phase 6 learning architecture plan is the design input. Current local React/Vite source is the behavioral authority. Existing root documents named PHASE7_REPORT, PHASE7_SCIENTIFIC_AUDIT and PHASE7_RELEASE_READINESS describe earlier project work; their numbering does not establish that this new learning pilot exists or has passed review.

## 1. Evidence, scope and verification

**V = verified in current local source. P = proposed here. A = requires approval.** These labels concern provenance, not scientific certification. Source inspection proves what the program defines; it does not prove scientific validity, accessibility in a browser or learning efficacy.

| Evidence | Source and finding |
|---|---|
| V: identity and routes | `frontend/src/features/transposable-elements/curriculum/topics.json`, record order 3; `curriculum/lessons.js:23–28`; `topicHref` at lines 65–67; router in `frontend/src/main.jsx:28`. Topic ID and lesson ID both equal `anatomy`; learning kind is lesson; assessment includes evidence. |
| V: content | `curriculum/lessons.js:23–28`: two objectives, five terms, three original variants, two questions, two reference IDs and an explicit limitations paragraph. |
| V: displayed exploration | `components/LessonActivities.jsx`, `Exploration`: state initially null, renders variant 0 by fallback; each original view button sets selection and calls `onInspect(i)`. These are grouped pressed buttons, not an ARIA tab implementation. SVG shows a vertical backbone with rectangular labeled blocks. Its accessible name concatenates the block strings. No pre-insertion diagram, boundary selectors, gene assignments or tracing task exists. |
| V: questions and completion | `Lessons.jsx:33` connects original controls to repository writes and renders both questions plus reset, references and summary. `lessonProgress.js:7–26` requires all variant indices and correct current answers. Radio selection records immediately; there is no required-question Submit action. Feedback supplies the explanation on both wrong and correct selections. |
| V: persistence | `progressRepository.js`: legacy records plus operation replay; `useProgress.js` subscription; `PersistenceStatus.jsx` messages and retry. Details in §10. |
| V: assessment and labs | `assessment.js`, `tests/assessment-v1.json`, `learnerRecords.js`, `contracts/SCIENTIFIC_CONTRACTS.md`. Read-only module evaluation confirmed bank version 1, 25 generated items, exact serialized equality with the fixture and all 15 resolved topic destinations. No browser session was opened. |

Source paths below are relative to the project root `C:\Users\Administrator\Self Study\SIASET`. No application source, existing plan, scientific engine or fixture was edited. This pass used read-only source inspection and module evaluation; the only project write was this report. The verification limits are recorded in the delivery note at the end.

## 2. Verified Topic 03 baseline — preserve verbatim

**V objectives:** “Identify ends, coding regions and orientation.” / “Distinguish TIRs from TSDs.” Terms: TIR, TSD, orientation, transposase, cargo. Reference IDs: `tn5-ends`, `tn5-tsd`.

**V concept:** the selected representative TIR-bearing DNA element contains terminal recognition regions and internal genes; TSDs are external host-derived direct repeats; transposase genes encode movement machinery and accessory cargo serves other functions.

| Saved index / label | Exact block inventory, in source order | Exact explanatory annotation |
|---|---|---|
| 0 / Boundaries | `TSD →`; `TIR →`; `transposase →`; `← TIR`; `TSD →` | The outer TSDs are host-derived. Opposing terminal arrows represent inverted end motifs. |
| 1 / Genes | `TIR →`; `transposase →`; `cargo →`; `← TIR` | Coding arrows show schematic orientation; cargo and transposase have different roles. |
| 2 / Insertion junction | `host`; `TSD →`; `element →`; `TSD →`; `host` | Both TSD copies trace to one target site, not two elements. |

**V limitations:** “Generic TIR-bearing architecture, not every DNA element. The Tn5 19 bp recognition region is not a perfect 19 bp inverted repeat. No nucleotide sequence or scale is asserted.” The exploration additionally says it calculates no sequence, experimental outcome, physical scale or new molecular state. The existing three drawings are abstractions at different detail levels, not three measured maps of a named molecule. In particular, the Boundaries variant omits cargo and the junction variant collapses the element to one block.

| Required question | Options, zero-based order | Correct answer / original explanation |
|---|---|---|
| Which regions move as part of this element? | 0 Host TSDs; 1 Terminal ends and internal genes; 2 All nearby host DNA | 1 / TIRs lie inside element boundaries; TSDs lie outside. |
| Two flanking direct host repeats demonstrate what? | 0 Two element copies; 1 Target-site duplication | 1 / Count complete elements independently of the target repeats. |

**V completion contract:** `inspected` contains 0, 1 and 2, `exercise === 1`, `check === 1`. There is no anatomy `check2`. Opening the lesson previews Boundaries without recording index 0. Explicitly clicking it records index 0 even without interpreting the diagram. A later wrong required answer can remove completion; inspected indices remain until reset. This measures recorded review and current answers, not independent mastery.

**P compatibility decision:** retain every original label, index, question, option, key, explanation, reference and write path. Add optional practice adjacent to the existing exploration, rather than silently replacing these definitions. The original controls and required questions remain directly available when practice is skipped. Selecting a practice panel must not select an original view on the learner's behalf. Clearly label “Open original Boundaries view (records inspection)” if offering a shortcut to that canonical action. Neither loading an optional diagram nor matching a feature records inspection.

## 3. Proposed objectives and screen contract

**P success observations, without a new completion gate:**

1. Bracket both terminal recognition regions and every internal coding region while excluding host repeats and host backbone.
2. Assign transposase and cargo functions separately from reading the direction of each coding arrow.
3. Match both post-insertion repeat intervals to the same pre-insertion host interval; distinguish a source interval from its two resulting occurrences.
4. Count one complete element in the displayed post-insertion host molecule, independently of the repeat count.
5. Apply these distinctions to a fresh reversed element using supplied annotations, and qualify conclusions to the selected model.

**P entry copy:** “Practice reading an element map. Practice and hints do not change lesson completion. Draft practice is kept only while this lesson stays open. Your recorded lesson evidence is shown separately.” Show current original inspection and required-answer status, the original controls, an optional-workbench entry and a jump link to required questions. Do not require reading this copy or completing the workbench to navigate.

Workbench sections: Boundaries practice → Genes practice → Junction practice → Fresh example. These are optional in-page sections, not new curriculum IDs, routes, saved view indices or enforced prerequisites. Offer direct access to each section. All share one representative teaching architecture; captions explain when host context is hidden or element internals are collapsed. Current view, draft practice and recorded evidence are distinct states. A diagram highlight is a temporary annotation, never molecular evidence or a persisted inspection.

## 4. Proposed figure system and exact inventories

**P/A figure family:** one invented, generic TIR-bearing DNA element with transposase coding region T and accessory coding region C. It is neither a sequence map of Tn5 nor a Tn3 structure. No length, bp value, gene name, species, resistance phenotype or actual experimental result is assigned. Cargo is included for teaching the distinction, not asserted to occur in every element. No internal `res`, IS50/IS10 module, promoter or donor molecule is implied.

### 4.1 Conventions shared by every visual and text version

| Mark | Meaning and equivalent words |
|---|---|
| Horizontal host rail | A local host DNA interval; read left to right in a fixed reference frame. It is not a strand-level drawing. |
| Narrow end block with motif chevron | Terminal recognition region. Chevron describes symbolic motif orientation, not gene transcription or physical movement. Pair is drawn in inverted orientation. No perfect sequence complementarity is claimed. |
| Gene body with arrowhead | Annotated coding direction relative to the host reference: rightward or leftward. It is not a motion arrow or evidence of active expression. |
| Small matching host blocks with a separate repeat mark | Same host-derived target interval identity, in direct orientation. Repeat marks use their own key and text; do not reuse gene arrows without explanation. |
| Thin outside orientation label | “Element reference orientation: rightward/leftward.” This is a map convention, not an insertion direction or pathway. |
| Bracket with two endpoint markers | Current learner selection. Label it “Your bracket”; show inside/outside in text after checking. Do not initially draw the correct element bracket. |

Use existing scientific color tokens where appropriate. Host and element origin, gene role, focus, selection and correctness each require words or distinguishable shapes; color alone cannot encode any answer. Equal-sized blocks convey order only. Keep motifs, coding arrows and element-reference orientation as separate graphical layers and legend entries.

**P caption on every practice figure:** “Invented symbolic example of a TIR-bearing element. Not to scale; no nucleotide sequence or reaction mechanism is shown. Motif orientation, coding direction and element reference orientation use different marks.” A compact limitation remains visible even when the extended legend is collapsed.

### 4.2 Figure B — expanded boundaries, also used for Genes and post-insertion tracing

Eight blocks in left-to-right order, with nine selectable gaps. Block IDs are local figure labels, never storage or curriculum identifiers.

| Block | Figure content | Origin and role, supplied in the teaching legend |
|---|---|---|
| B0 | Host-left context H-L | Host backbone, outside insertion |
| B1 | Repeat occurrence q-L, direct mark rightward | Host target-derived interval |
| B2 | Terminal region E-L, motif rightward | Element terminal recognition region |
| B3 | T, coding arrow rightward | Element gene annotated as encoding transposase |
| B4 | C, coding arrow rightward | Element accessory gene, no movement function assigned here |
| B5 | Terminal region E-R, motif leftward | Element terminal recognition region |
| B6 | Repeat occurrence q-R, direct mark rightward | Host target-derived interval, matches B1 |
| B7 | Host-right context H-R | Host backbone, outside insertion |

**P textual equivalent, available before answering:** “Read left to right: B0 host-left context; B1 interval q-L with rightward repeat mark; B2 terminal region E-L with rightward motif mark; B3 T with rightward coding arrow; B4 C with rightward coding arrow; B5 terminal region E-R with leftward motif mark; B6 interval q-R with rightward repeat mark; B7 host-right context. The legend identifies the roles of T, C and the terminal regions; q-L and q-R have the same repeat identity.” Answer controls use these same labels. This is equivalent evidence, not a reduced or more revealing alternative.

**A difference from source:** adding host-context blocks and cargo to the optional Boundaries drawing expands the original five-block abstraction. The original remains available. Professor must approve the expanded generic architecture and its caption before any prototype calls it scientifically approved.

### 4.3 Figure J — pre/post insertion comparison

Pre-insertion target has **three** adjacent intervals: J0 = H-L; J1 = target interval q, one occurrence, repeat identity q with rightward reference mark; J2 = H-R. No element is present on this target. Post-insertion is Figure B. The displayed relationship is stipulated by the example, not inferred from matching colors alone.

**P textual equivalent:** “Before insertion, the host interval is H-L, q, H-R. After insertion, it is H-L, q-L, E-L, T, C, E-R, q-R, H-R, with marks and annotations listed in Figure B. q-L and q-R match the pre-insertion target identity q in direct orientation. The pre/post panels depict the same selected host locus. Donor DNA is not shown.”

Do not animate q splitting into halves or the element being copied. A static pair and optional learner-controlled connector highlights suffice. A connector means shared source-interval identity, not that the same physical atoms occupy both copies. No gap-filling chemistry, stagger length or donor fate is tested in Topic 03.

## 5. Boundaries task — controls, answer rubric and exhaustive error handling

**P prompt:** “Place the left and right boundaries of the complete element in Figure B. Include its terminal recognition regions and internal genes; exclude surrounding host DNA.” Two native selects: **Left boundary** and **Right boundary**, initially “Choose a gap”. Both offer all nine choices below, in reference order. No dragging is necessary.

| Gap | Exact choice text |
|---|---|
| g0 | Before B0, host-left context |
| g1 | Between B0 host-left context and B1 q-L |
| g2 | Between B1 q-L and B2 terminal E-L |
| g3 | Between B2 terminal E-L and B3 T |
| g4 | Between B3 T and B4 C |
| g5 | Between B4 C and B5 terminal E-R |
| g6 | Between B5 terminal E-R and B6 q-R |
| g7 | Between B6 q-R and B7 host-right context |
| g8 | After B7, host-right context |

**P answer key:** left g2 and right g6. The selected interval contains B2–B5 inclusive, one complete element. Grade semantic gap identities, never pixels or rounded coordinates. Two endpoints must both be correct for “Bracket correct”; preserve per-end diagnostics. Do not award partial lesson credit or a percentage. Left/right always refer to screen/reference position, even in the reversed example.

**P feedback dispatch, in priority order:** missing value → same/reversed endpoints → feature-inclusion differences. For valid left-before-right pairs, compare the selected block set against B2–B5. Every incorrect pair necessarily includes an external block, excludes an internal block, or both; enumerate the specific differences. Present multiple applicable errors without contradictory verdicts, in left-to-right order.

| Error class | Learner-facing feedback |
|---|---|
| Missing left/right | “Choose the [left/right] boundary before checking.” Keep Check available so keyboard users can discover the validation; link to the missing select. |
| Same gap twice | “These markers enclose no blocks. Choose two different gaps around the element.” |
| Left is after right | “The left marker is to the right of the right marker. Order the two markers in the host reference frame.” Do not silently swap them. |
| Includes B0 or B7 | “Your bracket includes [B0/B7], host backbone outside this element.” |
| Includes B1 or B6 | “Your bracket includes [q-L/q-R], a host-derived target repeat outside the element.” |
| Excludes B2 or B5 | “Your bracket leaves out terminal recognition region [E-L/E-R]. Both ends belong inside this element.” |
| Excludes B3 | “Your bracket leaves out T, the internal transposase coding region.” |
| Excludes B4 | “Your bracket leaves out C. Cargo has a different function, but it still belongs inside this element.” |
| Correct | “Your bracket contains both terminal regions and both internal genes, and excludes both host repeats and host contexts.” |

**P progressive hints:** H1 “Which labels identify host DNA, and which identify the element?” H2 “The two q occurrences flank the terminal regions; compare their origins.” H3 worked answer: “Use g2 and g6: E-L, T, C and E-R are inside; q-L and q-R are outside.” Hints open one at a time only on request. H3 may overlay the correct bracket but must label it “Worked answer” separately from the learner's retained markers. Any hint marks this case as supported practice.

## 6. Genes task — function and direction are separate answers

**P prompt:** “For each coding arrow, identify its annotated function and its direction in the host reference frame.” Use Figure B; the teaching legend states T encodes transposase and C is accessory cargo. This is annotation interpretation, not inference of biochemical function from arrow shape.

For T and C separately, provide a **Function** select with choices “Encodes transposase / movement machinery”, “Accessory function”, “Terminal recognition DNA”, “Host target repeat”; and a **Coding direction** select with “Rightward”, “Leftward”. Each begins unselected. Clicking a gene may focus its corresponding form row; selection is also available from text labels. Ends and q blocks are not coded genes in this example.

**P key:** T = movement machinery, rightward; C = accessory, rightward. Four independent comparisons. All four are required for “Gene interpretation correct”, but give separate role and direction feedback so a direction error never implies a wrong function.

| Error | Feedback |
|---|---|
| Missing field | “Choose [function/direction] for [T/C].” |
| T assigned accessory | “T is annotated as encoding transposase, the movement protein in this example.” |
| C assigned movement | “C is annotated as accessory cargo. Its rightward arrow does not make it a transposase gene.” |
| Either gene assigned recognition DNA | “[T/C] is a coding region here. E-L and E-R are terminal recognition DNA.” |
| Either gene assigned host repeat | “[T/C] lies inside the element; q-L and q-R are host target repeats.” |
| Wrong direction | “The [T/C] coding arrowhead points rightward in this drawing. Read direction separately from its function.” Cue only that coding arrow, not the terminal motifs. |
| All correct | “T encodes movement machinery and points rightward. C has an accessory function and also points rightward. Shared direction does not imply shared function or guaranteed expression.” |

**P hints:** H1 “Read each gene's functional annotation.” H2 “Use the gene arrowhead for coding direction; use the annotation for function.” H3 show the two keyed sentences above. Do not claim autonomy, transposase activity, a promoter, operon membership or resistance from these two arrows.

## 7. Junction task — source tracing and one-element counting

**P prompt:** “Using the before and after panels, match each post-insertion q interval to its pre-insertion source interval. Then count complete elements in the displayed post-insertion host molecule.” For q-L and q-R, provide separate source selects with J0 H-L, J1 q, J2 H-R, “Element terminal region”, “No source can be identified from the stated example”. Allow both selects to use the same source; do not enforce one-to-one matching. Count choices: 0, 1, 2, “Cannot determine”.

**P key:** q-L → J1 and q-R → J1; count = 1. Both q occurrences are host-derived, directly oriented repeats of one source interval. The one element includes E-L, T, C and E-R. Count is explicitly restricted to this displayed product, not the cell, donor plus target or all genomes.

| Error | Feedback |
|---|---|
| Missing source/count | “Choose a source for [q-L/q-R]” / “Choose the number of complete elements.” |
| J0 or J2 selected | “Compare repeat identity: [H-L/H-R] is neighboring host context; q matches J1.” |
| Element terminal selected | “The target before insertion contains q but no element. These q intervals have host-target origin; the terminal regions are different features.” |
| Cannot identify source | “This example explicitly pairs the same host locus before and after insertion and supplies matching q identities. Both occurrences trace to J1.” |
| Different sources assigned | “Both q occurrences match the same pre-insertion interval, J1. Two resulting occurrences need not have two different sources.” Also give any field-specific error above. |
| Count 0 | “The post-insertion map contains one pair of terminal regions with its internal genes.” |
| Count 2 | “Two host repeats flank one complete element. Count the complete E-L-to-E-R structure, rather than the repeat occurrences.” |
| Count cannot determine | “The displayed product has a fully annotated single element. Other unshown molecules are outside this count.” |
| Correct | “Both q occurrences trace to J1, one original host target interval. They flank one complete element in the displayed product.” |

**P hints:** H1 “What was present on the target before the element appeared?” H2 “Match q identity on each side to the pre-insertion strip; a source may be used twice.” H3 “Both sources are J1; bracket E-L through E-R once, so the displayed product contains one element.” A successful source match alone must not fill the count answer. Origin, occurrence count and element count remain distinct.

## 8. Fresh reversed-orientation example and independent rubric

**P/A Case U:** fresh labels, gene order and element orientation; fixed left-to-right host reference. Do not mirror the entire screen, reverse reading order, reverse host-repeat marks or reuse practice highlights. No initially correct bracket or revealing origin colors. The learner receives the complete legend and text equivalent as evidence. An accessible legend is not a hint.

Pre-insertion U0 = host context M; U1 = target interval r, rightward reference mark, one occurrence; U2 = host context N. Post-insertion has eight blocks:

| Block | Supplied visual/text evidence |
|---|---|
| X0 | Host context M |
| X1 | Interval r-a, repeat identity r, rightward repeat mark |
| X2 | Feature K, terminal recognition region, motif rightward |
| X3 | Gene V, coding arrow leftward; annotation: accessory function |
| X4 | Gene W, coding arrow leftward; annotation: encodes transposase |
| X5 | Feature L, terminal recognition region, motif leftward |
| X6 | Interval r-b, repeat identity r, rightward repeat mark |
| X7 | Host context N |

**P orientation construction:** this is the reversed counterpart of the generic element: the terminal previously on the right now appears at the left, the former rightward cargo now precedes the transposase and points left, and the former left end appears at the right with opposite motif orientation. Both host repeats stay direct in the unchanged host frame. An outside label says “Element reference orientation: leftward”. That label alone is insufficient to answer coding directions; the supplied coding arrows are the evidence.

**P textual equivalent:** “Before insertion: M, r, N. After insertion, from left to right: X0 M; X1 r-a with rightward repeat mark; X2 K with rightward terminal motif; X3 V with leftward coding arrow; X4 W with leftward coding arrow; X5 L with leftward terminal motif; X6 r-b with rightward repeat mark; X7 N. K and L are annotated terminal recognition regions; V is accessory and W encodes transposase. r-a and r-b share repeat identity r with U1. The panels represent the same stipulated host locus. The element reference orientation is leftward.” Do not hide annotations in hover-only content.

Tasks: choose both gaps, assign source for each repeat, count complete elements, assign each gene's function and direction, and select a reasoning statement. Gaps u0–u8 use the exact Figure B naming pattern with X labels; correct left is u2 (X1/X2) and correct right is u6 (X5/X6). Source choices are U0 M, U1 r, U2 N, terminal region and insufficient information. Gene choices and count choices match prior task semantics.

Reasoning choices, initially unselected:

1. “The terminal regions and intervening genes define one element; both outer r intervals trace to the single pre-insertion host interval. Coding arrows indicate direction separately from function.” **Key.**
2. “The two outer r intervals are two elements, because each repeat is a complete transposon.”
3. “The leftward coding arrows mean the host repeats must be inverted and the genes exchange functions.”
4. “The pre/post drawing proves that this element used conservative excision and that its donor was repaired.”

**P rubric, ten binary diagnostic criteria:** left gap; right gap; r-a source; r-b source; count; V function; W function; V direction; W direction; reasoning statement. Key: u2, u6, U1, U1, 1, accessory, transposase, leftward, leftward, statement 1. Display criterion-level results after submission; all ten are required for the local case verdict. No averaging can hide a boundary or origin error. Never alter the original required questions or progress from this result.

**P feedback:** reuse the feature-specific boundary, origin and count categories in §§5–7 with X/U labels. Function errors identify the supplied V/W annotation; direction errors identify the leftward arrowhead. Reasoning option 2: distinguish repeat occurrences from complete elements. Option 3: distinguish host frame, motif orientation, gene function and coding direction. Option 4: “These panels show anatomy and stated source relationships; they do not establish an excision pathway or donor repair.” A missing field is validation, not a scientific error, and does not consume a submitted attempt.

**P independence policy:** a complete first submission with all ten correct and no requested hint/reveal earns the transient label **“Solved this fresh example without hints”**. It is not a validated mastery score. Any hint/reveal, or a previous graded submission of this case, changes eligibility to **“Reviewed with support”**, even if later correct. After the first submission, show missed criteria and explanations. Do not call a repeated, corrected case independent. Permit supported retries with no penalty.

**P fresh retry Case U2:** alternative local case identifiers, target identity s, host contexts P/Q, and feature labels D/E for ends, A for accessory, Z for transposase. Order is P, s-a, D motif rightward, A coding leftward, Z coding leftward, E motif leftward, s-b, Q. Pre is P, s, Q. Correct gaps remain before D and after E, both sources are the middle pre interval, count 1, A accessory/leftward, Z transposase/leftward, same reasoning principle. No automatic answer transfer. Review both cases together: structural similarity means even first success on U2 shows limited transfer, not a broad estimate of mastery. After both have been seen, offer review without claiming another unseen item. Reload cannot reliably prove novelty because no case history is stored; after a new page session, wording must not claim the learner has never seen the case.

Fresh-case hints, on request, progress from “Read the supplied feature annotations” to “Keep host-reference direction separate from element orientation” to the complete keyed explanation. Show the independence-status change when a hint is requested; do not block access with an extra confirmation.

## 9. Accessibility, responsive layout and motion

All items below are **P future acceptance requirements**, not claims of current browser compliance.

- Provide figure captions, the ordered inventories and the same annotations in normal selectable text. Keep text and diagram synchronized. A screen-reader user must receive the same evidence, choices, error detail and independent-case eligibility as a visual user.
- Use labeled native selects/radio groups, fieldsets and legends; no precision drag, hover-only labels, timed task, keyboard drawing or compulsory animation. If SVG is redundant with a complete adjacent text version, avoid duplicate long announcements; maintain a short name and a direct “Read diagram as text” link. Do not hide the only supplied annotation from assistive technology.
- Make boundaries named gaps with full neighboring labels. Each gene has separately named Function and Coding direction controls. All connector operations have source selects. Do not use “this arrow” without a feature ID.
- Keep optional navigation as links/buttons or implement a complete tab pattern if later chosen; do not attach tab roles to the existing grouped buttons without their keyboard contract. Preserve visible focus, DOM reading order and the existing route heading/skip-link behavior.
- On Check, retain focus on the button, announce one concise result via a polite status region and offer links to erroneous fields. Do not announce the entire figure repeatedly. After incomplete validation, name the missing fields and provide focus links. Editing one answer clears its stale verdict and the aggregate success message, without erasing other draft answers.
- At a minimum 320 CSS px width and at 400% zoom, stack pre/post panels and form rows. Preserve reference order in a vertical list with explicit “left-to-right reference order” wording; arrows retain the words rightward/leftward rather than being reinterpreted as up/down. No two-dimensional scrolling is required to solve the task. A larger optional diagram may scroll, but the text/form path must fit.
- Use touch targets at least 44 CSS px, legible wrapped labels and sufficient contrast (target WCAG AA: 4.5:1 ordinary text, 3:1 large text and essential control/graphic boundaries). Test focus and selected states separately. Symbols and patterns accompany scientific colors.
- Default diagrams are static. Optional source highlights appear only after explicit input. No autoplay, parallax, camera movement, pulsing or motion-dependent answer. Under `prefers-reduced-motion`, remove transitions and use immediate changes; results, focus, information and independence eligibility are identical. No new persisted preference is necessary.
- Test keyboard-only and screen-reader completion of all four tasks, text-only parity, narrow layout, zoom and reduced motion before implementation acceptance. A planning report cannot pass those checks.

## 10. Return, retry, reset, persistence and cross-tab behavior

### 10.1 Verified repository behavior

**V:** legacy keys are `siaset-lessons-v1`, `siaset-guided-labs-v1`, `siaset-assessments-v1`; operations use prefix `siaset-progress-op-v1:`. Legacy records are read rather than rewritten by the repository. Valid operations replay in ascending logical clock, then lexicographic ID order. Inspection unions indices; a required-answer operation replaces that answer; reset deletes that lesson record at its replay position. A later lesson operation can re-create part of a reset lesson. This is deterministic ordering, not a guarantee that a reset wins every concurrent action.

**V:** storage events refresh relevant records; focus and online events attempt flushing. A commit reads fresh state before appending an operation. Failed reads prevent writes; pending operations remain in memory. Status is read-failed, temporary or saved, with an independent damaged-data flag. UI retry flushes pending progress. Malformed/incompatible data is left untouched and valid records remain usable. Temporary progress can survive in-app navigation while the page remains loaded; reload/close can lose it. Optional practice has no persistence in the current source because it does not exist.

### 10.2 Proposed state contract and review cases

| Case | Required proposed behavior / compatibility assertion |
|---|---|
| Fresh visit | Original Boundaries preview but no inspection credit. Workbench fields empty; no verdict. Opening any optional section produces zero progress operations. |
| Partial returning record | Render the repository's actual indices and current answers. Never fill practice from those answers or infer independent success. Example: indices 0/2 and exercise 1 still need original index 1 and check 1. |
| Already complete | Show existing completed status. Offer optional practice without forcing reinspection or a new mastery gate. A failed practice attempt does not revoke completion. A wrong original required answer still does. |
| Switch optional sections | Preserve draft answers and hint-use status while the lesson instance remains mounted. Do not auto-submit, reveal or record original inspections. |
| Same-case retry | Retain inputs and requested hints; clear feedback when edited. Rechecking after feedback remains supported. No penalty or write. |
| Start fresh retry case | Clear all case-specific answers, feedback, overlays and hints. Keep session record of which local cases were seen so a viewed case is not relabeled unseen. Do not clear official evidence. |
| Navigate away / reload / browser Back | Draft workbench may be discarded when anatomy unmounts or the page reloads; entry copy promises only while-open retention. Returning reconstructs official evidence from the existing repository. Do not introduce URL query, session/local-storage keys or navigation blockers for drafts. |
| Reset practice | Clear practice drafts, overlays and feedback only. It cannot reset session exposure to turn a previously revealed case into an independent first attempt. Label explicitly “Clear practice answers”. |
| Existing Reset this lesson | Invoke the unchanged repository reset for anatomy. Clear local practice answers/feedback; retain any session exposure needed to avoid a false independent claim. Reset does not clear other lessons, labs or assessment attempts. Original selected-view highlight may remain as in current source; evidence summary must show the reset state. Do not auto-record that displayed view. |
| Another tab answers or inspects | Refresh official summary and original radio values through the repository. Keep local practice drafts and focus unchanged. Announce a concise evidence update only if useful; do not claim practice was saved or completed. |
| Another tab resets anatomy | Follow replayed official evidence, including any later valid operations. Avoid silently deleting current practice drafts from a generic snapshot change: the snapshot does not itself identify a reset. Show “Recorded lesson evidence changed; practice answers are separate.” Local reset can clear local drafts because its initiating action is known. |
| Concurrent reset/answer | Accept current ordered repository result; never replay a practice answer as an official answer to repair apparent missing evidence. Test reset-before-answer and answer-before-reset, plus equal-clock ID tie order. No new reset propagation semantics. |
| Blocked reads, quota/write failure, recovery | Keep existing persistence message and Retry saving progress accessible. Practice works in memory and never claims to fix saving. Retrying practice does not call repository retry; that is the existing dedicated action. Recovery may save pending official operations without altering draft practice. |
| Damaged/future records | Retain repository's warning and validation rules. Do not migrate, delete, normalize or infer completion from incompatible data. |

This deliberately refines the Phase 6 reset proposal: a locally invoked reset can clear drafts; a remote reset cannot safely be inferred from an undifferentiated repository snapshot. Neither remote evidence changes nor automatic refresh should erase a learner's unrelated draft inputs.

## 11. Scientific assumptions, evidence limits and approval register

**V/P distinction:** existing annotations are documented in §2; the generic cases in §§4–8 are new instructional constructions. Their source relationships are stipulated. They must not be labeled experimental observations, simulated events, exact molecular maps or new calculated outputs.

| Claim / limitation | Basis and proposed treatment | Approval |
|---|---|---|
| Terminal regions inside; host repeats outside | Existing anatomy concept and question. Preserve in both figure and text. | Professor verifies new bracket positions and distractors. |
| Two repeats from one target interval | Existing junction annotation; pre/post source diagram is new. Match identity and origin, not atoms or an asserted duplication mechanism. Sequence similarity alone in an unknown biological sample would not establish this history. | Professor approves stipulated relationship, source choices and caption. |
| Generic inverted end motifs | Existing symbolic arrows, expanded with separate motif convention. Do not imply perfect repeats or universal TIR-bearing architecture. | Professor approves graphic conventions and exact terminology. |
| Tn5/IS50 recognition detail | Local anatomy warns against a perfect 19 bp inverted-repeat claim. External primary work distinguishes recognition regions from short inverted-repeat sequence structure. This report retains the caveat, without mapping generic E-L/E-R to specific Tn5 outside/inside ends. | Professor reviews precise caveat and whether a separate citation note is needed; no new sequence drawing until approved. |
| T and C gene roles | Supplied fictional annotations, consistent with existing teaching distinction. No enzyme activity, cargo phenotype or universal gene arrangement follows. | Professor approves fictional gene inventory; Malek approves terminology level. |
| Reversed Case U / U2 | Reverses element order and coding arrows while preserving fixed host reference and direct repeats. Does not represent a recombination event or a second insertion. | Professor signs both full figure/text inventories and all ten answer criteria. |
| Count one | One complete element in this displayed product. Does not establish total cellular copy number or distinguish conservative/replicative pathways. | Professor checks scope of every count prompt. |
| No mechanistic inference | Donor, repair, staggered strand-transfer geometry, DNA polarity, proteins, expression, target preference, kinetics and topology are not shown or solved. Topic 13 and existing labs retain their separate scope. | Professor checks no caption/feedback exceeds evidence. |
| Independent-case wording | No new certified mastery measure. Hints, repeated cases and session-only history limit interpretation. | Malek and professor approve wording and observation rubric. |

**External primary-source spot checks performed for this report:**

- [Berg et al. (1982), Inverted repeats of Tn5 are transposable elements](https://pmc.ncbi.nlm.nih.gov/articles/PMC346254/): abstract supports separating IS50 modules, short imperfect terminal-repeat structure and host target repeats. It does not supply the invented generic two-gene figure.
- [Johnson and Reznikoff (1983), Sequences essential for transposition at the termini of IS50](https://pmc.ncbi.nlm.nih.gov/articles/PMC390041/): primary abstract reports recognition regions of about 19 bp. This is a distinct concept from asserting a perfect inverted-repeat sequence across that entire region.
- [Berg et al. (1983), Specificity of transposon Tn5 insertion](https://pmc.ncbi.nlm.nih.gov/articles/PMC1202227/): primary study addresses Tn5 target-site specificity; its Tn5-specific evidence does not justify a universal target-repeat length or an unbiased insertion claim.

These are limited primary-page/indexed-abstract checks, not a full-paper or full-curriculum scientific review. A direct follow-up open of the IS50 recognition paper encountered a browser verification page; its indexed primary abstract supplied the recognition-length statement. Existing registry verification labels describe earlier checks and remain unchanged. No nucleotide strings have been imported. Actual bp labels, named Tn5/IS50 sequence alignments, named resistance genes or a strand-level insertion drawing are **outside this proposal** and would require a separately reviewed figure and source mapping.

## 12. Compatibility freeze — all 15 identities and destinations

**V resolved from current metadata and `topicHref`; P requirement to preserve exactly.**

| # | ID | Destination |
|---|---|---|
| 01 | `introduction` | `/learn/transposable-elements/introduction` |
| 02 | `discovery` | `/learn/transposable-elements/discovery` |
| 03 | `anatomy` | `/learn/transposable-elements/anatomy` |
| 04 | `classification` | `/learn/transposable-elements/classification` |
| 05 | `dna-diversity` | `/learn/transposable-elements/dna-diversity` |
| 06 | `conservative` | `/lab/transposable-elements?experiment=tn5` |
| 07 | `replicative` | `/lab/transposable-elements?experiment=tn3` |
| 08 | `insertion-sequences` | `/learn/transposable-elements/insertion-sequences` |
| 09 | `composite` | `/learn/transposable-elements/composite` |
| 10 | `genomic-consequences` | `/learn/transposable-elements/genomic-consequences` |
| 11 | `phenotypes` | `/learn/transposable-elements/phenotypes` |
| 12 | `expression` | `/learn/transposable-elements/expression` |
| 13 | `tsd` | `/learn/transposable-elements/tsd` |
| 14 | `regulation` | `/learn/transposable-elements/regulation` |
| 15 | `bacterial-hgt` | `/learn/transposable-elements/bacterial-hgt` |

Preserve original ordering, titles, previous/next relationships and navigation freedom. No topic locking or Journey implementation belongs to this phase. Preserve 13 lesson units plus two explicitly recorded valid guided reviews in the 15-topic denominator. Tn5 and Tn3 engines, stage/checkpoint identities, events, replay, undo/redo, model coordinates, 9 bp/5 bp TSD contracts and scientific limitations remain unchanged. In particular, optional anatomy diagrams must never be passed to an engine as computed molecular state.

Bank version 1 and all 25 question objects remain byte-for-byte equivalent in serialized content to the published fixture: IDs, order, wording, options, correct indices, explanations and references. `anatomy-primary` and `anatomy-evidence` still derive from the original two anatomy questions. Never edit lesson definitions to add optional case questions: doing so could silently change the generated bank. No new schema, operation type, persistence key, progress denominator or mastery flag.

## 13. Concise review checklist and go/no-go criteria

### Scientific and UX review sheet

| Reviewer | Review item | Status |
|---|---|---|
| Professor | Figure B inventory, g2/g6 bracket, all boundary error classes | Pending |
| Professor | T/C annotations, distinction between coding and motif marks | Pending |
| Professor | Figure J source identity, one-element count scope, no invented mechanism | Pending |
| Professor | Cases U/U2 reversed construction, direct host repeats, text parity, ten-part key | Pending |
| Professor | Tn5 recognition caveat and adequacy of source support | Pending |
| Malek | Vocabulary, optional placement, device targets, clear recorded-evidence versus practice wording | Pending |
| Malek + professor | Hint progression, independent/support labels, usefulness of distractors | Pending |
| Future implementer/reviewer | Original write paths, bank and storage invariance; local versus remote reset behavior | Specification supplied; implementation untested |
| Future accessibility reviewer | Keyboard, screen reader, text-only, 320 px, zoom and reduced-motion walkthroughs | Not run; future prototype required |

Reviewers should record approve / revise / unresolved, the relevant figure or section, exact requested correction, reviewer name and date. No signature or approval is presumed from this report.

**Go to a separately authorized prototype only when:** professor approves every new figure inventory and answer rubric; Malek approves terminology and optional flow; both agree no task depends on unprovided scientific information; all blocking diagram ambiguities are resolved in the document; and the unchanged compatibility baseline is accepted. **Current decision: no-go for implementation pending these reviews and separate authorization.** The planning deliverable itself can be reviewed now.

**Future prototype go/no-go checks:**

1. Canonical-action parity: pilot off/on produces identical original records. Practice, hints, retries, fresh-case submission and optional-panel navigation produce no repository operations.
2. Old partial record: `[0,2]`, exercise 1, missing check remains incomplete after perfect practice. Original Genes selection plus correct original check completes it. Wrong original check makes it incomplete again.
3. All boundary choices produce the defined structural feedback; correct gene function with wrong direction is diagnosed separately. Same-source matching is permitted twice. Reversed element does not reverse host repeats or reading order.
4. First unaided, hinted, failed-then-corrected, fresh-retry and exposed-case return labels follow §8 without storing mastery or claiming prior novelty after reload.
5. Fresh, complete, partial, local reset, remote reset, concurrent answer/reset, damaged data, failed reads/writes and recovery follow §10 without losing unrelated drafts or modifying repository semantics.
6. All four tasks are solvable with keyboard and text alone; screen-reader result announcements and focus are usable; narrow/zoom layouts do not hide evidence; reduced motion changes no result.
7. All 15 destinations and the full 25-object bank match the frozen baseline. Existing Tn3/Tn5 replay and guided-recording acceptance remain unchanged. Run the relevant established regression checks at that future phase; do not interpret this document's inspection as a new regression-suite pass.

Any false completion, practice-triggered write, altered bank question, wrong reversed-orientation rubric, inaccessible required input or unsupported biological claim is a **no-go**. Cosmetic refinements may remain nonblocking only if they preserve legibility, contrast, focus and scientific distinctions. Release/deployment is a separate decision and is not authorized by this planning report.

## 14. Delivery verification note

Completed: local source and Phase 6 plan inspection, read-only metadata/route evaluation, 25-question fixture equality check, bounded primary-source spot checks and document consistency review. Browser testing, learning-effect observation, professor sign-off and implementation checks remain outstanding by design. No Git operations or deployment were performed.

Verification limit: an attempted 73-file before/after hash check could not be completed because its temporary baseline was unavailable in the subsequent command environment. No hash-invariance result is claimed. The action record contains no application edits: only this Markdown report was created and revised. The bank equality and resolved-route checks succeeded independently. No full test suite, build or browser acceptance run was performed for this planning-only change.
