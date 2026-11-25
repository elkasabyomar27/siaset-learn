# Hands-on experiments: design

Date: 2026-11-25 · Status: awaiting approval

## Intent

The user asked for SIASET's interactive experiments to be **"more hands-on and look better"**.

Today, most experiments are rows of buttons, checkboxes and sliders that sit next to a picture. The user named the worst case: the Tn5 lab, where students "tap buttons under the scene". They added that the same goes for "all of them".

The goal is that every station feels like doing the experiment with your hands:

- hold a DNA end;
- swipe to cut;
- carry a transposon onto its target;
- tip a bottle into a tube;
- load a gel;
- spin a centrifuge.

The visuals should also be richer: animated, tactile and lightly 3D.

The users are students and teachers using SIASET as a virtual lab, many on school laptops and tablets. There are no real users yet, so this is the moment to set the interaction language for every future field and module.

## Decisions made with the user

1. **Interaction style: direct gestures.** Students act on the molecule or the equipment itself: press-and-hold, swipe, drag-and-drop, hold-to-pour, turn-a-dial. There is no tool tray. An animated demo hand teaches each move. The user chose this over a tool-tray design after trying working prototypes of both.
2. **Visual style: the ¾ bench.** A bench surface tilted away from the viewer in light 3D: CSS perspective on the bench plane, upright objects, soft contact shadows, and objects that lift and cast a larger shadow while carried. The user chose this over a flat bench.
3. **The pilot is the Tn5 lab.**
4. **Build approach: a shared hands-on kit, then reskin each experiment** (see Approaches).

The reference prototypes are in `.superpowers/brainstorm/886-1795598142/content/`. They are throwaway, not to be shipped.
- `tn5-interaction.html`, option B: Tn5 with gestures.
- `bench-gestures.html`: the precipitation bench, including the corrected pour. The bottle snaps into a pouring pose with its mouth above the tube and pivots at the neck. Its liquid stays level and drains. A visible stream runs into the tube. A live "x vol → mark" readout appears, and the target mark lights up.

## Goals

- **Every station is driven by gestures in the scene.** Each experiment *action* (bind, cut, insert, pour, pipette, load, spin, run, place, flip) is done directly in the scene. No row of action buttons sits under or beside the scene.
- **One consistent hands-on language** across all stations: the same gestures mean the same things everywhere, with the same feedback, hints and look.
- **A richer look:** shaded tubes for DNA and glassware, glossy enzymes, a ¾ bench, spring-like snaps, and lift-and-shadow while dragging.
- **Equivalent access for everyone.** Every gesture has a keyboard and screen-reader equivalent, 44 px targets, visible focus and a reduced-motion version.
- **Same science, same evidence.** Gestures produce exactly the settings and actions the current controls produce.

## Non-goals

- No changes to the scientific models or calculations:
  - `engine/*`;
  - every model `.js` (`kernelModel.js`, `dnaExtraction.js`, `benchWorkflow.js`, `storyLab.js`, `tsdJourney.js`, …);
  - `learning.js` and `guidedStages.js`.
- No changes to completion rules (`lessonProgress.isComplete`, `learnerRecords.validLabEvidence`/`topicCompleted`), saved-progress shapes (`progressRepository.js`) or the `learner-write` contract (`server/validate.js`). Lesson questions and views must not change, because that would change the contract fingerprint.
- The lesson page structure stays as it is. That covers objectives, the "Explore the molecule" view tabs (`Exploration`), the required questions (`Question`) and the completion summary. Those record evidence and are not experiments.
- The streak and "Explain it back" features are out of scope.
- No 3D or canvas engine and no new runtime dependencies.

## Anti-goals (failure even if it "works")

- Gestures that are only decoration, with the real controls still hidden in buttons.
- Anything that changes what a student's Notebook or the teacher dashboard shows for the same work.
- A keyboard or screen-reader path that is worse than today's buttons.
- Hidden gestures nobody discovers. Every move is taught by the demo hand, and an on-screen line says what to do next.
- Slow or janky on a modest school laptop or tablet.
- Colours from outside the brand palette.

## Constraints

- **Brand.** UI chrome uses only the `theme.css` tokens (navy `#10283F`, teal `#176D80`, aqua `#68D9D1`, amber `#F5B75E`) and tints or shades derived from them with `color-mix()`. Molecule and diagram colours come from `scientific.css` (`--scientific-*`). Dark stages use `--color-molecular-*`. Logo files are unchanged.
- **CSS convention** (already tested for `benchWorkflow.css`; the new kit CSS follows it):
  - no hex or `rgb()` literals;
  - `animation` and `transition` only inside `@media (prefers-reduced-motion: no-preference)`;
  - targets at least 44 px.
- **Old styles go with the markup they styled.** *(Builder's call.)*
  - When an experiment is rewritten, its rules in `partsBench.css`, `storyLab.css` and `tsdBuilder.css` are deleted along with the markup.
  - Its new styles live in token-only CSS, and hex fills written into SVG are replaced by token-based classes.
  - The token checks cover the kit stylesheet and every new or rewritten experiment stylesheet.
  - Rules still used by experiments that haven't been remodelled yet stay until their own PR.
- **Existing tests keep passing unchanged.** That covers every logic test, plus the markup checks in `tests/benchComponents.test.js`: the hand-off card text, the "Practice only…" line, a disabled `Reveal` / `Run the cycler` / `Run the gel` / `Digest and run` button before a prediction, `role="img"` plus an `aria-label` on every SVG, and live regions that exist before a result. Pure functions now exported from component files stay exported with the same behaviour (`evaluateGel`, `gelStep`, `initialGel`, the `Verdict` part).
- **Tests run in Node** (`node --test`), using Vite `ssrLoadModule` and `renderToStaticMarkup`. There is no DOM or pointer simulation, so gesture behaviour must live in pure modules.
- **The current baseline** is checked before work starts. After PR #7 it was 184 frontend tests and 50 db2 tests; re-measure it on today's `origin/main`.
- **No merge without asking**, because `main` auto-deploys. No Supabase change is expected. If one turns out to be needed, ask first.

## Approaches

1. **A shared hands-on kit, then reskin each experiment.** *Chosen.* Gesture recognition and its keyboard equivalents are written once as pure modules. A small set of React building blocks sits on top: the ¾ bench, glassware, DNA tubes, enzymes, the demo hand and the readout. Each experiment's component is rewritten to use the kit, while its model module stays untouched and receives the same settings and actions. *Trade-offs:* more work up front in the pilot. After that, each module is faster and consistent, accessibility is solved once, and gesture logic can be tested in Node.
2. **Hand-build each experiment the way the prototypes were built.** *Trade-offs:* fastest for the pilot alone. But 20 experiments drift apart in feel, accessibility is redone (and missed) per station, and gesture logic ends up inside components that the Node tests cannot exercise.
3. **A 3D or canvas engine (three.js or PixiJS).** *Trade-offs:* true lighting and depth. But it adds a heavy dependency that runs badly on school hardware. A canvas is opaque to screen readers, so it would need a parallel hidden interface. It also breaks with the SVG and markup testing the project already relies on. The chosen ¾ bench gives most of the depth at none of that cost.

The user picked 1.

## Design

### The hands-on kit

A new folder `frontend/src/features/transposable-elements/hands-on/` (exact path left to the builder) holds three layers.

**1. Gesture logic: pure modules, no React, no DOM.**

Each recognizer is a small reducer, `(state, event) → state`. Pointer events and keyboard events are both normalised into one event vocabulary (`down`, `move`, `up`, `cancel`, `key-down`, `key-up`, `tick`). This is what makes both paths testable and equivalent.

| Gesture | Recognised when | Keyboard equivalent |
|---|---|---|
| **Tap / touch** (inspect, select) | pointer up within a small radius and time of the down | Enter or Space |
| **Press-and-hold** (bind, dispense salt, grow, replicate) | held about 700 ms; a progress ring fills; releasing early cancels | hold Enter or Space for the same time (key-down starts, key-up cancels), with the same ring |
| **Swipe across** (cut, flip an orientation) | the path crosses the target line within a tolerance band | Enter on the focused target, with the target's action named in its label ("Cut the left end") |
| **Drag and drop** (carry Tn5, place a card, load a tube, move a part) | the pointer is released over a drop zone; a ghost preview shows where it will land; magnet snap near the zone | Enter picks up; Tab or the arrow keys move through valid drop zones, which are announced; Enter drops; Escape cancels |
| **Position on a track** (point on the target ring, cut position on a strand) | the drop or pointer position maps to a value on the track | arrow keys step the position, Shift+arrow takes bigger steps, Enter confirms; the value is spoken |
| **Hold-to-pour / dispense to a mark** (alcohol, wash, agarose) | while the source is posed over the vessel and held, the volume rises at a fixed rate; on release it snaps to the nearest allowed mark | while focused on the vessel with a source held, hold Enter to pour, or press the arrow keys to step mark to mark; release or Enter confirms |
| **Turn a dial** (centrifuge spin, thermocycler settings, run time) | angular travel past a threshold, or a detent position | arrow keys move one detent each, Enter confirms |

Snap targets, tolerances and rates are named constants in these modules, so tests pin them down.

**2. Intent mapping, per experiment: pure.**

Each experiment gets a small function that turns completed gestures into the actions or settings its model already accepts. For example:

- the Tn5 gesture `hold(left-end)` becomes `{type: 'bind', end: 'left'}`;
- a pour that ends at the 0.7 mark becomes `{volumes: 0.7}` for `evaluatePrecipitation`.

These functions are where tests prove that gestures map to exactly what the old controls produced.

**3. React kit components, rendered with SVG and CSS.**

- **Stage pieces:** a ¾ bench stage (perspective floor and dark molecular stage variants), a magnetic drag layer, hold and swipe targets with enlarged invisible hit areas, a pour source and vessel, a dial, and a track.
- **Shared SVG definitions** for shaded DNA tubes, glass and enzyme spheres. These use `userSpaceOnUse` gradients and filters: the prototype found that `objectBoundingBox` gradients and filters vanish on flat lines.
- **The demo hand.**
- **A "what to do next" line**, which doubles as an `aria-live` region.
- **A live readout chip** (for example "0.33 vol → 0.2").

All styles go in one kit stylesheet that follows the CSS convention above.

### Interaction rules that apply everywhere

- **The scene is the control.** Experiment actions happen only in the scene. Two kinds of button stay real buttons:
  - **Commitment actions**, shown on the instrument or next to the result: *Reveal*, *Run*, *Save completed lab*, *Restart*. They are styled as the instrument's own button where there is one (the thermocycler's Run key, the gel tank's power switch). This also keeps the existing `benchComponents` markup checks valid.
  - **Prediction questions and checkpoints** (`Checkpoint`, the prediction fieldsets). These are questions, not lab actions, so they stay as radio or choice controls, restyled to match.
- **Model assumptions are not lab actions.** Examples: "Assume permissive host conditions" and "Assume no hidden promoters". They move into a small, labelled *Assumptions* switch panel beside the scene.
- **Highlight the expected move, but let the model judge the rest.** *(Builder's call.)* The expected next target pulses gently. Other targets stay touchable, focusable and labelled, and the model decides. A refused or premature attempt shows the model's existing message in the "next step" line (for example "Make a correct prediction before cutting"), never a silent failure.
  - This is required: the sandbox's `BENCH_GOALS` ("Try to cut an end without transposase", "Try to insert the same Tn5 twice", "Try to resolve without TnpR") are met only by refused attempts. Sorting activities such as ReagentStages and ClassificationSort teach through wrong drops.
  - In the sandbox, the inserted Tn5 stays draggable, so dragging it onto the ring again is the "insert twice" attempt.
  - Drop zones accept every drop and pass it to the model. Spring-back is only for drops outside any zone.
- **The demo hand** plays once the first time each gesture is needed. It replays after about 8 seconds of inactivity on that step. It never plays while the student is dragging. Under reduced motion it is replaced by a static arrow and text.
- **Feedback when an action completes:** a short spring snap, a "pop" on the changed molecule, and the same text as today in the live region. Physical touches match the action: the bottle drains, the liquid level rises, a pellet appears, the rotor spins.
- **Accessibility:**
  - every interactive scene element is a focusable element with a role and an action-naming `aria-label`;
  - focus follows the flow (after binding the left end, focus moves to the right end);
  - visible focus uses the existing `--color-focus` / `--color-focus-on-dark` tokens;
  - every SVG is `role="img"` with a descriptive label that updates with the state;
  - nothing depends on colour alone.
- **Reduced motion:** no animation or transition. Snaps are instant, the demo hand becomes static, and the rotor and stream are shown as still states.
- **Touch:** `touch-action: none` only on stage elements, so pages still scroll; pointer capture during drags.

### Visual language

- **Molecular scenes** (Tn5, Tn3, sandbox, builders): a dark stage (`--color-molecular-background`). DNA is drawn as shaded tubes with a highlight and a contact shadow, coloured from `--scientific-*`. Enzymes are glossy spheres. A carried object rises, its shadow grows and softens, and it springs back if dropped somewhere invalid. A cut opens a small gap with a spring.
- **Bench scenes** (DNA extraction, bench workflow): a ¾ bench, with the floor tilted by CSS perspective and objects standing upright. The bench objects are glass bottles, tubes with graduations, a pipette, an ice bucket, a centrifuge, a spectrophotometer, a thermocycler and a gel tank. Glass is translucent, and liquid colours are tints of the scientific and brand tokens.
- **Chrome:** brand tokens only. Readouts are navy chips with an aqua outline. Success, warning and error use the existing state tokens.

### The pilot: Tn5 lab (`Laboratory.jsx`, `StoryScenes.jsx`)

The pilot changes only the scene and the controls. The `storyLab.js` logic is untouched.

| Step (story stage) | Gesture | Dispatches (unchanged) |
|---|---|---|
| 0 Recruit transposase | press-and-hold each gold end | `{type:'bind', end}` |
| 1 Predict, then cut and carry | the prediction checkpoint stays a question; then swipe down across each end | `{type:'answer', …}`, then `{type:'cut', end}` |
| 1 (free) Insert | drag the lifted Tn5 onto the target ring; a ghost arc shows the landing site; keyboard uses the arrow keys on the ring | `{type:'insert', angle}` → `boundaryFromAngle` |
| 2 See what was calculated | tap the newly inserted element (or a *Continue* link in the next-step line) | `{type:'continue'}` |
| 3 Find the host repeats | tap each purple repeat | `{type:'inspect', feature}` |
| 4 Review and save | the *Save completed lab* button (a commitment action) | `progressRepository.recordLab(...)` (unchanged) |

The step instructions shown to students come from the `STORY[...].task` strings in `storyLab.js` ("Tap both ends…", "Tap a spot on the target ring…"). They are rewritten to describe the new gestures. *(Builder's call: these are display text only. They are not in the contract manifest, and `storyLab.test.js` checks only stage indices. Every function in `storyLab.js` and the stage mapping stay untouched.)*

The duplicate action buttons and the position slider under the scene are removed. *Restart lab*, the step list, the vitals strip, *What changed*, the engine view and the evidence section stay.

Tn3 (`Tn3Scene`) and the sandbox (`Sandbox.jsx`) share these scenes, so they are remodelled in the same PR:

- **Tn3:** drag the target circle to dock it at a spot; press-and-hold the replication fork to replicate; tap the copies; drag TnpR onto a res site (dropping it elsewhere removes it, matching `{type:'enzyme', available}`); *Resolve* is a commitment action.
- **Sandbox:** keeps its free mode, with the same gestures.

### Per-experiment mapping (the builder confirms each during its module)

Each row lists the gestures that replace today's controls. The model module and its inputs do not change.

**Genetics · Transposable Elements**

- **MobilityGates** (intro, regulation): the parts are drag-in pieces, dragged into or out of the "cell" (an active Ac element supplying protein in trans, the RNA-OUT antisense RNA, another transposase source). Expression states like "pIN promoter active" are switches drawn on the DNA. System choice stays a set of tabs. Assumptions go in the Assumptions panel.
- **KernelGrower:** drag the Ac element into or out of the genome (`ac`). Drag the "excision timing" marker along a development timeline (`timing`). The prediction stays a question. Press-and-hold the kernel to grow it; cells divide while you hold, and releasing early pauses.
- **AnatomyLab:** drag label tags onto segments; drag the two boundary brackets into gaps; swipe across the transposase arrow to flip its direction; *Check* is a commitment action.
- **ClassificationSort:** drag the cards into grid cells.
- **CopyLedger:** the copy-number guess stays a question. Press-and-hold the generation crank to advance a generation (`advance`).
- **MobileElementBuilder:** drag parts from a parts bin onto the DNA track, drag within the track to reorder, and drag off the track to remove (`canAdd` and `MAX_TRACK` still gate this). *Test* is a commitment action.
- **CompositeBuilder:** drag IS modules onto each side of the cargo, and swipe an IS to flip it (`left` / `right` sign). Drag the cargo gene in. The target choice stays tabs. *Run* is a commitment action.
- **RecombinationLab:** swipe the second copy to set its orientation. Drag the substrate card (one chromosome or misaligned sisters) into the stage. Then drag the two copies together to pair them, which runs `recombine`.
- **PhenotypeExplorer:** drag the element into a site on the gene (`site`). Known or unknown facts go in the Assumptions panel.
- **OperonExplorer:** drag the element into a slot (`slot`); swipe its promoter arrow to set its direction (`tePromoter`); drag a terminator or promoter piece onto the DNA (`terminator`, `bPromoter`). The assumption toggle goes in the Assumptions panel.
- **TsdBuilder:** drag the two cut marks along the top and bottom strands to set the stagger. Its presets stay as chips. Stages advance by gestures: drag the element into the gap, then drag the polymerase along to fill the gaps. The stage back and forward controls remain for review.
- **BacterialExplorer and ConsequenceExplorer** *(decided with the user: in scope, in PR B)*. These are the lesson explorers for bacterial-hgt, tsd and genomic-consequences.
  - The context tabs stay tabs, and the prediction stays a question (restyled as choice chips instead of a dropdown).
  - The scene shows the chosen context with the kit's visual language, and *Investigate* / *Calculate selected event* becomes the scene's commitment control.
  - They **record lesson evidence**: a correct prediction calls `onInspect(index)`. The remodel must call `onInspect` with exactly the same index, under exactly the same condition, and never anywhere else. Tests replay each variant with right and wrong predictions and assert the same `onInspect` calls as the current components.
  - The engine functions they call (`engine/bacterial.js`, `engine/consequences.js`) are unchanged.
- **HgtLab:** drag the donor cell to touch the recipient (`contact`). The plasmid features (transfer machinery, oriT) are drag-in parts. Press-and-hold to conjugate or transpose. Selection is a commitment action.

**Molecular Biology · DNA Extraction**

- **ReagentStages:** pour or pipette each reagent bottle into the stage tube where it does its job (`checkReagent`).
- **ProtocolBench, precipitation:** as in the prototype.
  - Choose the sample by picking the 200 µL or 700 µL tube from the rack.
  - Pour alcohol to a mark (0.2, 0.7, 1 or 2.5 vol), using isopropanol or ethanol.
  - Pipette sodium acetate.
  - Drag the tube to ice or leave it at room temperature.
  - Drag it into the centrifuge and turn the dial to spin. Not spinning means the "keep the pellet" step never happens.
- **ProtocolBench, wash:** pour the wash (none, water, 70% or 100% ethanol); drag the tube to the drying rack and turn the timer dial (none, brief, far too long); pipette the solvent (TE or water).
- **How both ProtocolBench benches start and finish** *(decided with the user)*:
  - Each bench **starts from an empty set-up**: an empty tube for precipitation, a fresh isopropanol pellet for the wash. The student builds the protocol step by step.
  - A requirements strip ticks as each requirement is met.
  - The verdict (`evaluatePrecipitation` / `evaluateWash`, unchanged) appears only when the final step is done: spinning for precipitation, dissolving for the wash.
  - A **Fresh tube** commitment button starts again, so the goals that need different set-ups (overflow, salty, no salt, lost, over-dried) are reached by repeating the build.
  - A step the student skipped is passed to the model as the "not done" value (for example no spin is `spin: false`, no wash is `wash: 'none'`), so every outcome the model knows stays reachable.
  - The model's defaults are no longer the starting display. They are still the values a fully "standard" build produces.

**Molecular Biology · Bench Workflow (stations 19–22)**

- **Spectrophotometer:** pipette the sample onto the pedestal (press-and-hold), swipe the arm down, read the screen. The verdict question stays a question. *Reveal* is a commitment action.
- **Thermocycler:** drag the primer tubes into place (facing, same strand or away), drag the polymerase tube in, and turn the dials for annealing temperature and cycles. The prediction stays a question. *Run the cycler* is the machine's Run key, which stays disabled until a prediction is made.
- **GelBench:** pour the agarose (0.7, 1 or 2%), drag the comb in and out, pipette into the wells, and drag the electrode leads (black or red to the well end) to set polarity. The run time is the power-supply dial. *Run the gel* is the supply's switch. Estimating the size means dragging a ruler line to the band.
- **DigestBench:** drag the enzyme tubes into the reaction tube, and drag the tube to the heat block. Choosing fragment sizes stays a question. *Digest and run* is a commitment action.

### Testing

The work is built test-first.

- **Gesture logic:** unit tests for each recognizer. They cover thresholds, cancelling, snapping and the keyboard path, and they show that the pointer path and the keyboard path produce the same completed gesture.
- **Intent mapping:** each experiment gets tests showing that its gestures produce exactly the actions or settings the old controls did. For Tn5, a scripted gesture sequence replays through `storyAction` to the same final stage and the same `recordLab` inputs as the button sequence did.
- **Markup** (SSR):
  - every remodelled experiment renders focusable, labelled scene targets;
  - it has no action-button row under the scene;
  - its SVGs have `role="img"` and a label;
  - a live region exists before any result;
  - the existing `benchComponents` checks still pass.
- **CSS:** the kit stylesheet passes the same token-only and motion-only-under-no-preference checks as `benchWorkflow.css`, and has 44 px targets.
- **Existing logic tests are not edited.**
- **Browser check of each experiment** with `preview_start` "frontend": mouse, touch emulation, keyboard only, reduced motion and the mobile width. Screenshots go in the PR.

### Rollout

The builder may adjust the batching. One PR per module:

1. **PR A, pilot:** the kit plus the story labs (Tn5, Tn3, sandbox). The user reviews the pilot in the browser before the rest starts.
2. **PR B, Genetics / Transposable Elements:** the twelve lesson experiments, plus BacterialExplorer and ConsequenceExplorer.
3. **PR C, Molecular Biology / DNA Extraction:** ReagentStages and both ProtocolBench benches.
4. **PR D, Molecular Biology / Bench Workflow:** stations 19–22.

Each PR starts from an up-to-date `origin/main`, touches only experiment files plus the kit, and passes `npm test`, `npm run test:db2`, `npm run lint` and `npm run build`. None is merged without the user's OK.

## Left to the builder

- Exact folder and file names, component APIs and the event vocabulary.
- Exact hold durations, swipe tolerances, pour rates and hint timings, within the stated intent: forgiving for children, no accidental triggers.
- The artwork details for each piece of equipment, within the visual language.
- How each experiment's layout adapts to mobile widths. Stages scale to fit; they never require horizontal scrolling.
- Whether a remodelled experiment needs extra explanatory text, as long as no lesson question or view changes.
- Confirming or adjusting the gesture for each experiment in the mapping above, when a better physical metaphor appears while building it, as long as it keeps the same model inputs.
