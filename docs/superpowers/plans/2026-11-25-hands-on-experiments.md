# Hands-on Experiments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the button-driven controls of every SIASET experiment with direct gestures (hold, swipe, drag, pour, dial) on a ¾ bench, without changing any science model, completion rule or saved record.

**Architecture:** The work has three layers.
- **Gesture recognizers:** pure reducers, `(state, event) → state`, fed by one normalised event vocabulary for pointer and keyboard. Node tests prove both paths give the same gesture.
- **Per-experiment intent mappers:** pure functions that turn completed gestures into the exact actions or settings each model already accepts.
- **A React kit:** SVG and CSS stage pieces, plus a thin `useGesture` hook that wires the DOM into the recognizers.

Each experiment's component is then rewritten on the kit, one PR per module.

**Tech Stack:** React 19, SVG, CSS (`color-mix()` over the `theme.css` tokens), Vite 7, and `node --test` with Vite `ssrLoadModule` plus `renderToStaticMarkup` for markup tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-25-hands-on-experiments-design.md`. Read it first: the per-experiment gesture mapping and the interaction rules live there, and they are not repeated here.

## Global Constraints

- **These stay byte-for-byte unchanged:**
  - `engine/*`, `learning.js`, `guidedStages.js`, `lessonProgress.js`, `learnerRecords.js`, `progressRepository.js` and `server/validate.js`;
  - every model module: `kernelModel.js`, `dnaExtraction.js`, `benchWorkflow.js`, `mobilityGates.js`, `anatomyLab.js`, `classificationSort.js`, `copyLedger.js`, `mobileElementBuilder.js`, `compositeBuilder.js`, `recombinationLab.js`, `phenotypeChain.js`, `operonModel.js`, `tsdJourney.js`, `hgtLab.js`, `freeBench.js`, `sandboxSession.js`, `benchStep.js`;
  - the logic in `storyLab.js`.
- **The only allowed `storyLab.js` edit** is the `task:` strings inside `STORY`.
- **No lesson question, view or topic JSON changes** (the contract fingerprint).
- **Existing test files are not edited.** New tests go in new files under `frontend/src/features/transposable-elements/tests/`, named `*.test.js`.
- **Pure functions exported from component files stay exported, with the same behaviour:** `evaluateGel`, `gelStep` and `initialGel` from `GelBench.jsx`, and `Verdict` from `BenchParts.jsx`.
- **Markup checks to keep:** `benchComponents.test.js` must keep finding the hand-off card ("From the last station"), "Practice only; it doesn’t change lesson completion.", a disabled button whose text starts with `Reveal` / `Run the cycler` / `Run the gel` / `Digest and run` before a prediction, `role="img"` with an `aria-label` on every SVG, and `<div role="status" aria-live="polite"></div>` before a result.
- **New and rewritten CSS:**
  - no `#hex` or `rgb()`/`rgba()` literals;
  - every `animation`/`transition` inside `@media (prefers-reduced-motion: no-preference) { … }`;
  - interactive targets `min-height: 44px` (HTML) or an invisible hit area of at least 44 px (SVG).
- **Colours:**
  - UI chrome uses `--color-*` from `theme.css`, mixed with `color-mix(in srgb, …)` for tints and shades;
  - molecules use `--scientific-*`;
  - dark stages use `--color-molecular-*`;
  - SVG fills come from classes or `var()`, never literals.
- **SVG gradients and filters** on lines or zero-height shapes use `gradientUnits="userSpaceOnUse"` / `filterUnits="userSpaceOnUse"`.
- **Gesture constants:** `HOLD_MS = 700`, `TAP_SLOP = 10` (px), `TAP_MS = 350`, `SWIPE_BAND = 34` (SVG units), `DEMO_IDLE_MS = 8000`.
- **Commitment actions stay real `<button>`s:** Reveal, Run…, Check, Test, Resolve, Save completed lab, Restart, Fresh tube. Prediction and checkpoint questions stay questions.
- **Every PR:**
  - starts from a fresh `git fetch && git rebase origin/main`;
  - runs `npm test` (baseline 187 passing on 2026-11-25), `npm run test:db2` (50), `npm run lint` and `npm run build`, all clean;
  - checks every remodelled experiment in the browser (`preview_start` "frontend"): mouse, keyboard only, emulated reduced motion and mobile width (375 px), with screenshots in the PR;
  - opens to `main` and is **never merged without asking the user**;
  - needs no Supabase change (ask the user first if one ever appears).

## Review Focus

These are the five input classes most likely to bite, and the test that pins each:

1. **A pointer cancel mid-gesture** (alt-tab, a touch scroll steals it) must leave nothing half-done. A held bind that is cancelled does not bind, and a carried Tn5 springs back. *Pinned in Task 1 (`cancel` tests for each recognizer).*
2. **A double completion.** A fast double-tap or a key held past `HOLD_MS` must fire the intent once. *Pinned in Task 1: `hold fires once per press`.*
3. **Keyboard drag with no valid zone** must announce it and return the item with Escape, and a keyboard user must never be trapped while carrying. *Pinned in Task 1: `keyboard drag with zero zones`.*
4. **Refused moves still reach the model.** A cut before transposase in the sandbox must dispatch and log a refusal. Gating it out in the UI would make the sandbox's `BENCH_GOALS` unreachable. *Pinned in Task 7: `sandbox reaches every BENCH_GOAL by gestures`.*
5. **Reaching every model outcome by building.** Overflow, no salt, unspun, lost and over-dried must each be reachable on the empty-start benches. *Pinned in Tasks 25 and 26: `every outcome is reachable from a build`.*

---

## File structure

All paths are relative to `frontend/src/features/transposable-elements/`.

```
hands-on/
  gestures/events.js        normalise pointer/keyboard → {type, x, y, t, key}
  gestures/hold.js          press-and-hold recognizer
  gestures/swipe.js         swipe-across-a-line recognizer
  gestures/drag.js          drag-and-drop (pointer + keyboard carry)
  gestures/track.js         position on a ring or line, with arrow-key stepping
  gestures/pour.js          hold-to-pour with snapping to marks
  gestures/dial.js          dial: travel threshold (spin) or detents (settings)
  gestures/index.js         re-exports and constants
  demoHand.js               pure policy: when the demo hand shows
  useGesture.js             React hook: DOM events → recognizer, pointer capture, rAF ticks
  kit/HandsOnDefs.jsx       shared SVG <defs> (DNA tubes, glass, enzyme sphere, shadows)
  kit/HoldTarget.jsx  kit/SwipeTarget.jsx  kit/Draggable.jsx  kit/Track.jsx
  kit/BenchStage.jsx        ¾ bench (perspective floor) and dark molecular stage
  kit/Vessel.jsx  kit/PourSource.jsx  kit/Dial.jsx
  kit/DemoHand.jsx  kit/NextStep.jsx  kit/Readout.jsx  kit/Assumptions.jsx
  kit/handsOn.css
  intents/story.js          Tn5/Tn3 (lab + sandbox) gesture → story/bench actions
  intents/<experiment>.js   one per remodelled experiment (Tasks 11–30)
tests/
  helpers/ssr.js            shared Vite SSR loader + html() (not a *.test.js file)
  handsOnGestures.test.js  handsOnKit.test.js  handsOnStory.test.js
  handsOnGenetics.test.js  handsOnExtraction.test.js  handsOnBench.test.js
```

Components keep their current file names and default exports, so `Lessons.jsx`, `Laboratory.jsx` and the routes need no changes beyond those this plan names.

---

# PR A: the kit and the story labs (pilot)

Branch: `claude/hands-on-pilot`. When this PR is open, stop and ask the user to review the pilot in the browser before starting PR B.

### Task 1: Gesture recognizers

**Files:**
- Create: `hands-on/gestures/{events,hold,swipe,drag,track,pour,dial,index}.js`
- Test: `tests/handsOnGestures.test.js`

**Interfaces:**
- **Produces the event vocabulary:**
  - `{type:'down'|'move'|'up'|'cancel', x, y, t}`;
  - `{type:'key-down'|'key-up', key, t}`;
  - `{type:'tick', t}`.
- **Produces these recognizers.** Each is `start(config) → state` plus `step(state, event) → state`. A completed gesture sets `state.done` (non-null) exactly once.
  - `hold`: `startHold({ms = HOLD_MS})` → `{phase:'idle'|'holding'|'done'|'cancelled', progress}`. Keys `Enter` and `' '` hold.
  - `swipe`: `startSwipe({line: {x1,y1,x2,y2}, band = SWIPE_BAND})`. `done` means the path crossed the segment within `band`. `key-down Enter` sets `done` with `{via:'key'}`.
  - `drag`: `startDrag({zones: [{id, contains(x,y)}]})` → `{phase:'idle'|'dragging'|'carrying'|'dropped'|'cancelled', x, y, over, zoneIndex}`.
    - **Pointer:** `done = {zone}` on `up` over a zone; `cancelled` on `up` outside or on `cancel`.
    - **Keyboard:** `Enter` in idle → `carrying`; `ArrowRight`/`ArrowDown`/`Tab` → next zone; `ArrowLeft`/`ArrowUp`/`Shift+Tab` → previous zone; `Enter` → `done = {zone, via:'key'}`; `Escape` → `cancelled`.
  - `track`: `trackStep(value, key, {step = 10, bigStep = 45, min = 0, max = 359, wrap = true}) → value` (Shift is passed as `key: 'Shift+ArrowRight'`), plus `angleAt(x, y, cx, cy) → 0..359` (degrees clockwise from 12 o'clock, the same convention as `StoryScenes.polar`).
  - `pour`: `startPour({marks, rate})`, where the value is in mark units and `rate` is units per second.
    - Pointer `down` followed by `tick`s raises `value`; `up` sets `done = {value, mark: nearestMark(value, marks)}`.
    - `ArrowUp`/`ArrowDown` step to the next or previous mark; `Enter` sets `done`.
  - `dial`: `startDial({center, threshold})` → `done` when the absolute angular travel ≥ `threshold` (radians), or `startDial({center, detents: [...values]})` → `detent` index; arrows move one detent and `Enter` sets `done = {value}`.
  - `nearestMark(value, marks) → mark`. Ties go to the lower mark.

- [ ] **Step 1: Write the failing tests** in `tests/handsOnGestures.test.js`:
  - **`hold`**:
    - completes after 700 ms of ticks;
    - an `up` at 699 ms → `cancelled`, `done === null`;
    - `cancel` → `cancelled`;
    - `key-down Enter` + ticks to 700 ms → `done`;
    - **`hold fires once per press`**: further ticks after `done` leave the same `done` object and the phase stays `'done'`.
  - **`swipe`**:
    - a vertical path crossing `{x1:188,y1:80,x2:188,y2:160}`'s horizontal midline within 34 units → `done`;
    - a path 40 units to the side → not done;
    - `cancel` mid-path → `cancelled`.
  - **`drag`**:
    - pointer drop inside zone `ring` → `done.zone === 'ring'`;
    - drop outside → `cancelled`;
    - the keyboard sequence Enter, ArrowRight, Enter over zones `[a, b]` → `done.zone === 'b'`;
    - Escape while carrying → `cancelled`;
    - **`keyboard drag with zero zones`**: Enter → `carrying` with `zoneIndex === -1`, then Escape → `cancelled`, and Enter never yields `done`;
    - **pointer and keyboard parity**: both paths onto `ring` produce `done.zone === 'ring'`.
  - **`track`**: `trackStep(355, 'ArrowRight')` is `5`; `trackStep(0, 'Shift+ArrowLeft')` is `315`; `angleAt(cx, cy - 10, cx, cy)` is `0`; `angleAt(cx + 10, cy, cx, cy)` is `90`.
  - **`pour`**:
    - with `marks [0.2,0.7,1,2.5]` and `rate 0.5`, holding 1.4 s then `up` → `done.mark === 0.7`;
    - `nearestMark(0.45, marks) === 0.2` (tie → lower);
    - ArrowUp ×2 from 0 → value 0.7, then Enter → `done.mark === 0.7`.
  - **`dial`**: travel of 1.6π with `threshold: 1.6 * Math.PI` → `done`; with detents `[45, 55, 72]`, ArrowRight from index 0 then Enter → `done.value === 55`.
- [ ] **Step 2:** Run `node --test frontend/src/features/transposable-elements/tests/handsOnGestures.test.js`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement the recognizers** to the interfaces above. Each is a plain reducer with no timers inside; time comes only from `event.t`. `index.js` exports `HOLD_MS`, `TAP_SLOP`, `TAP_MS`, `SWIPE_BAND` and `DEMO_IDLE_MS`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** with the message `Hands-on kit: gesture recognizers`.

### Task 2: Demo-hand policy, the shared SSR helper and the kit stylesheet

**Files:**
- Create: `hands-on/demoHand.js`, `tests/helpers/ssr.js`, `hands-on/kit/handsOn.css`
- Test: `tests/handsOnKit.test.js`

**Interfaces:**
- **`demoHand(state, event)`.** State is `{seen: Set<kind>, idleSince, dragging, reducedMotion}`. Events are `{type:'need', kind, t}`, `{type:'activity', t}`, `{type:'drag', active}` and `{type:'tick', t}`. It returns `{...state, show: kind|null, still: boolean}`.
  - It shows the first time a `kind` is needed.
  - It shows again after `DEMO_IDLE_MS` of no activity.
  - It never shows while `dragging`.
  - With `reducedMotion`, `still` is true (a static arrow and text are rendered instead of animation).
- **`tests/helpers/ssr.js`** exports `startSsr()` → `{load(path), html(Component, props), close()}`. It uses the same `createServer` options as `benchComponents.test.js` and wraps output in a `MemoryRouter`.

- [ ] **Step 1: Write the failing tests:**
  - `demo hand shows once per kind, again after 8 s idle, never while dragging, still under reduced motion`.
  - `handsOn.css follows the token and motion rules`. Assert all of these for `kit/handsOn.css`:
    - no `/#[0-9a-f]{3,8}\b/i`;
    - no `/rgba?\(/`;
    - no `animation|transition` outside `@media (prefers-reduced-motion: no-preference)` (use the same strip-regex as `benchComponents.test.js`);
    - it contains `min-height: 44px` and `touch-action: none`.
- [ ] **Step 2:** Run `node --test …/tests/handsOnKit.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement `demoHand.js` and the helper, and write `handsOn.css`.** The stylesheet contains:
  - the stage and bench classes (the ¾ floor is `transform: perspective(700px) rotateX(52deg)` with `transform-origin: 50% 100%`);
  - lift and shadow while carried;
  - the pulse on the expected target;
  - the hold progress ring;
  - the next-step line;
  - the readout chip (a navy chip with an aqua outline);
  - focus via `--color-focus-on-dark`;
  - `touch-action: none` on `.ho-stage` only.

  Tints come from `color-mix(in srgb, var(--color-brand-accent) 25%, transparent)` and similar.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit** with the message `Hands-on kit: demo-hand policy, SSR helper, stylesheet`.

### Task 3: Kit components

**Files:**
- Create: `hands-on/useGesture.js` and `hands-on/kit/{HandsOnDefs,HoldTarget,SwipeTarget,Draggable,Track,BenchStage,Vessel,PourSource,Dial,DemoHand,NextStep,Readout,Assumptions}.jsx`
- Test: `tests/handsOnKit.test.js` (append new tests)

**Interfaces:**
- **Consumes:** the Task 1 recognizers and the Task 2 `demoHand`.
- **`useGesture(start, config, onDone)`** returns `{handlers, state}`.
  - `handlers` are the `onPointerDown/Move/Up/Cancel` and `onKeyDown/KeyUp` props.
  - The hook converts client coordinates to SVG user space with `getScreenCTM().inverse()` (falling back to the bounding rect for HTML stages), calls `setPointerCapture`, drives `tick` with `requestAnimationFrame` while a hold or pour is active, and calls `onDone(state.done)` once.
- **Component props.** Every interactive component renders `role="button"`, `tabIndex={0}`, an `aria-label`, and a transparent hit area of at least 44 px.
  - `<HoldTarget label hitR onHold expected>{children}</HoldTarget>`, inside an SVG; it draws the progress ring while held.
  - `<SwipeTarget label line onSwipe expected>{children}</SwipeTarget>`.
  - `<Draggable label zones onDrop onCancel carriedLabel>{children}</Draggable>`. It lifts with a shadow while carried, and while keyboard-carrying it announces each zone's `label` through `NextStep`.
  - `<Track label cx cy r value onPreview onConfirm />`, a ring track: arrow keys preview with a ghost arc, Enter confirms.
  - `<BenchStage variant="bench"|"molecular" width height label>`, which scales to its container width with no horizontal scroll and exposes the stage scale to its children.
  - `<Vessel>`, `<PourSource>` and `<Dial>` are the HTML/SVG bench pieces with the gestures from Task 1.
  - `<DemoHand show still from to />`, `<NextStep>` (always rendered as `<div role="status" aria-live="polite">`, even when empty) and `<Readout>`.
  - `<Assumptions items values onChange />`, labelled switches in a `<fieldset>` titled "Assumptions".

- [ ] **Step 1: Write the failing SSR tests**, using `startSsr`:
  - `kit targets are labelled focusable buttons with 44 px hit areas`: render each target with a label and assert `role="button"`, `tabindex="0"`, the `aria-label`, and a hit element with `r` ≥ 22 or width and height ≥ 44.
  - `NextStep renders an empty live region before any message`.
  - `HandsOnDefs gradients on flat shapes use userSpaceOnUse`.
- [ ] **Step 2:** Run the file. Expected: FAIL.
- [ ] **Step 3: Implement the hook and the components.** Each component stays thin: no gesture logic beyond calling `useGesture`.
- [ ] **Step 4:** Run the file. Expected: PASS. Then run `npm run lint`. Expected: clean.
- [ ] **Step 5: Commit** with the message `Hands-on kit: React components`.

### Task 4: Story intent mapping (Tn5, Tn3, sandbox)

**Files:**
- Create: `hands-on/intents/story.js`
- Test: `tests/handsOnStory.test.js`

**Interfaces:**
- **Produces `storyIntent(scenario, gesture) → action | null`.** A gesture is `{kind:'hold'|'swipe'|'drop'|'tap'|'drag-off', target, angle?}`. It returns exactly the action shapes `storyAction` and `benchAction` already accept:
  - **Tn5:**
    - `hold end-left|end-right` → `{type:'bind', end}`;
    - `swipe end-*` → `{type:'cut', end}`;
    - `drop ring` + `angle` → `{type:'insert', angle}`;
    - `tap inserted` → `{type:'continue'}`;
    - `tap target-tsd-left|right` → `{type:'inspect', feature}`.
  - **Tn3:**
    - `drop target-circle` on `donor` + `angle` → `{type:'dock-target', angle}`;
    - `hold fork` → `{type:'replicate'}`;
    - `tap copy-1|copy-2` → `{type:'inspect', feature}`;
    - `drop tnpR` on `res` → `{type:'enzyme', available:true}`;
    - `drag-off tnpR` → `{type:'enzyme', available:false}`.
  - It returns `null` for gestures with no meaning. Callers keep converting `angle` → `boundary` with `boundaryFromAngle`, exactly as `Laboratory.jsx` and `Sandbox.jsx` do today.

- [ ] **Step 1: Write the failing tests:**
  - `Tn5 gestures replay to the same evidence as the button path`. Map the gesture sequence (hold left, hold right, answer 0, swipe left, swipe right, drop ring at angle 55, tap inserted, tap both TSDs) through `storyIntent` (converting the angle as the lab does) and reduce it with `storyAction`. Assert `isComplete`, `history.events.length === 1` and `validLabEvidence(evidence(s)) === true`, with the same `evidence` helper as `storyLab.test.js`. Assert the reduced state deep-equals the state reached by the literal action list using `boundary: boundaryFromAngle(55)`.
  - `Tn3 gestures replay to resolved, valid evidence`. This is the same replay for Tn3 and includes `drag-off tnpR` → a refused resolve message matching `/TnpR/`.
  - `premature gestures still reach the model`. A swipe before the prediction yields a `cut` action, whose `storyAction` result carries the message `/correct prediction/`.
- [ ] **Step 2:** Run the file. Expected: FAIL.
- [ ] **Step 3: Implement `story.js`** as a lookup table per scenario.
- [ ] **Step 4:** Run the file. Expected: PASS.
- [ ] **Step 5: Commit** with the message `Hands-on: story gesture intents`.

### Task 5: Tn5 scene on the kit (the pilot)

**Files:**
- Modify: `components/StoryScenes.jsx` (`Tn5Scene`), `Laboratory.jsx`, and the `storyLab.js` `STORY.tn5[*].task` strings only.
- Modify: `components/storyLab.css`. Delete rules made obsolete by the rewrite; new styles go in `handsOn.css` or a new token-only `components/storyScenes.css`.
- Test: `tests/handsOnStory.test.js` (append new tests)

**Interfaces:**
- **Consumes:** the kit (Task 3) and `storyIntent` (Task 4).
- **`Tn5Scene({s, dispatch, free})` keeps its signature.** `dispatch` now receives `storyIntent` output.

- [ ] **Step 1: Write the failing SSR tests.** Render `Laboratory` inside a `MemoryRouter` at `/lab/transposable-elements?experiment=tn5` and assert:
  - `Tn5 lab has no action buttons under the scene`. There is no `<button>` whose text matches `/Bind (left|right) end|Cut (left|right) end|Insert Tn5 here|Inspect the insertion|(Left|Right) repeat/`, and no `input[type=range]`.
  - `Tn5 scene targets are labelled`. There are `role="button"` elements labelled `/Hold to bind transposase to the left end/` and `/…right end/`.
  - `Tn5 scene keeps a live region and an SVG label`. There is an empty `role="status"` live region, and the scene SVG carries `role="img"` and an `aria-label`.
  - `STORY task text names the gestures`. `STORY.tn5[0].task` matches `/hold/i`, `STORY.tn5[1].task` matches `/swipe/i`, and no `STORY.tn5` task contains `Tap both ends`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Rewrite `Tn5Scene` with the kit, following the spec's pilot table.**
  - DNA is drawn as shaded tubes from `HandsOnDefs`.
  - The ends are `HoldTarget`s (stage 0, or always in `free`), then `SwipeTarget`s (stage 1).
  - The freed Tn5 is a `Draggable` with a ghost arc over the `ring` zone, with a `Track` for the keyboard.
  - The inserted element and the TSDs are tap targets.
  - The demo hand and `NextStep` follow `demoHand`.
  - In `Laboratory.jsx`, delete the scene-action buttons and the `sl-site` slider. Keep the checkpoint, *Save completed lab*, *Restart lab*, the steps list, the vitals, `WhatChanged`, the engine view and `LabEvidence`.
  - Rewrite the `STORY.tn5` task strings to describe hold, swipe, drag and tap.
- [ ] **Step 4:** Run `npm test`. Expected: all pass, the 187 baseline included.
- [ ] **Step 5: Check it in the browser** with `preview_start` "frontend" at `/lab/transposable-elements?experiment=tn5`:
  - the full run by mouse;
  - the full run by keyboard only (Tab, hold Enter, Enter, arrows);
  - with emulated `prefers-reduced-motion: reduce`;
  - at a 375 px width.

  The browser console must be clean. Take screenshots.
- [ ] **Step 6: Commit** with the message `Tn5 lab: hands-on gestures on the kit`.

### Task 6: Tn3 scene on the kit

**Files:**
- Modify: `components/StoryScenes.jsx` (`Tn3Scene`), `Laboratory.jsx` and the `STORY.tn3[*].task` strings.
- Test: `tests/handsOnStory.test.js` (append)

- [ ] **Step 1: Write the failing tests:**
  - **`Tn3 lab has no action buttons under the scene`:** none of `Join target here|Start replication|Tn3 copy (1|2)|Dock TnpR on res`. A `Resolve` button is still present.
  - **Labelled targets:** `/Drag the target circle/`, `/Hold the replication fork/`.
  - **Task strings:** `STORY.tn3[0].task` matches `/drag/i`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Rewrite `Tn3Scene`:**
  - the target circle is a `Draggable` docking onto the donor;
  - the fork is a `HoldTarget`;
  - the copies are tap targets;
  - TnpR is a `Draggable` onto the res zone, and dragging it off removes it;
  - *Resolve* stays a button.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Check it in the browser**, as in Task 5, at `?experiment=tn3`.
- [ ] **Step 6: Commit** with the message `Tn3 lab: hands-on gestures on the kit`.

### Task 7: Sandbox on the kit

**Files:**
- Modify: `Sandbox.jsx`
- Test: `tests/handsOnStory.test.js` (append)

- [ ] **Step 1: Write the failing tests:**
  - **`sandbox reaches every BENCH_GOAL by gestures`:** reduce gesture sequences through `storyIntent` → `benchAction` and collect notebook entries. The sequences are:
    - swipe an unbound end (refused, matching `/none is bound/`);
    - hold, hold, swipe, swipe, drop ring (insert ok);
    - drop ring again (refused, matching `/initial donor/`);
    - Tn3: dock, hold fork, resolve without TnpR (refused), drop TnpR on res, resolve.

    Assert that every `BENCH_GOALS[i].done(notebook)` is true.
  - **SSR:** the "Tools" row of buttons is gone (no `Bind transposase ·`, `✂ Cut ·` or `Insert Tn5 →`). *Fresh molecules* and *Clear notebook* stay.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Rewrite the sandbox controls** to the shared scenes in `free` mode. In `free`, the inserted Tn5 stays a `Draggable`, so a second drop is the "insert twice" attempt. Replace the "Tap parts of the scene, or use the tools below" note with gesture text.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Check it in the browser** at `/lab/transposable-elements/sandbox`: reach all six investigations by mouse, then by keyboard.
- [ ] **Step 6: Commit** with the message `Sandbox: hands-on gestures on the kit`.

### Task 8: Pilot PR

- [ ] **Step 1:** `git fetch && git rebase origin/main`, then run `npm test`, `npm run test:db2`, `npm run lint` and `npm run build`. Expected: all clean.
- [ ] **Step 2:** Push and open the PR to `main` with `gh` ("Hands-on experiments: kit and story labs (pilot)"). Include the screenshots and the spec link.
- [ ] **Step 3: Stop.** Ask the user to try the pilot in the preview or the PR deployment, and fold their feedback into the kit before PR B.

---

# PR B: Genetics / Transposable Elements

Branch: `claude/hands-on-genetics`, cut from `main` after PR A merges, or stacked on PR A if the user asks.

Every task in this PR follows the same shape. The per-experiment specifics are below.

**Common shape for each task:**
- **Files:** create `hands-on/intents/<name>.js`; modify `components/<Name>.jsx`; delete that component's now-unused rules in `partsBench.css` or `tsdBuilder.css`; put new styles in token-only CSS; append tests to `tests/handsOnGenetics.test.js`.
- **Interface:** `<name>Intent(gesture, current) → patch | action | null`. Its output is exactly what the component's current handlers pass into the model or into `setState`.
- **Steps:**
  1. Write failing tests:
     - (a) the intent produces the same model inputs as the old controls for every option (named `<Name>: gestures reach every option`);
     - (b) an SSR render has no old control row (the listed button texts, no `input[type=range]` or `checkbox` for lab actions) and has labelled `role="button"` targets;
     - (c) the SVGs keep `role="img"` with labels.
  2. Run and see them fail.
  3. Rewrite the component on the kit, following the spec's mapping row.
  4. Run `npm test` and see it pass.
  5. Check it in the browser at its lesson URL: mouse, keyboard, reduced motion and 375 px.
  6. Commit with the message `<Name>: hands-on gestures`.

| Task | Component (lesson id) | Intent covers | Old controls that must be gone |
|---|---|---|---|
| 9 | `MobilityGates` (introduction, regulation) | per `SYSTEMS[*].controls`: choice/part controls → drag a part in or out of the cell; expression toggles → switches drawn on the DNA; keys named `permissive*`/`assume*` → `Assumptions` | the `mg-toggle` checkboxes for lab parts |
| 10 | `KernelGrower` (discovery) | `ac` by dragging Ac into or out of the genome; `timing` 0..1 by dragging along the development timeline (Track; keyboard steps of 0.05); grow by holding the kernel | the `Ac present` checkbox, `type="range"` and the "Grow the kernel" button |
| 11 | `AnatomyLab` (anatomy) | label tags dropped on segments → `labels[i]`; brackets dropped in gaps → `left`/`right`; a swipe on the arrow → `direction`; *Check* stays a button | the per-label buttons, the gap buttons and the direction buttons |
| 12 | `ClassificationSort` (classification) | card dropped on cell `(cls, copies)` → `checkPlacement(card, cls, copies)`; wrong drops are accepted and show the hint | select-then-click cell buttons |
| 13 | `CopyLedger` (dna-diversity) | hold the generation crank → `advance`; the guess stays a question | the "advance" primary button |
| 14 | `MobileElementBuilder` (insertion-sequences) | drag from the bin → `add(kind)` gated by `canAdd`; drag within the track → reorder; drag off → `remove(i)`; *Test* stays a button | the part buttons and the ↑ ↓ ✕ buttons |
| 15 | `CompositeBuilder` (composite) | an IS dropped on a side plus a swipe to flip → `{left, right}` signs; cargo and module dropped in → `{cargo, module}`; *Run* stays a button | the cargo, module, ends and flip buttons |
| 16 | `RecombinationLab` (genomic-consequences) | a swipe on the copy → `orientation`; the substrate card dropped → `substrate`; dragging the copies together → run | the orientation and substrate buttons and the "run" primary button |
| 17 | `PhenotypeExplorer` (phenotypes) | the element dropped on a gene site → `site`; `promoterInfo`, `backup` and `medium` → `Assumptions` | the site option buttons |
| 18 | `OperonExplorer` (expression) | the element dropped in a slot → `slot`; a swipe on the promoter → `tePromoter`; terminator and promoter pieces dropped → `terminator`, `bPromoter`; `assumeNoHidden` → `Assumptions` | the slot and promoter buttons; the lab-part checkboxes |
| 19 | `TsdBuilder` (tsd) | dragging the two cut marks → the stagger (`STAGGER_RANGE` 2–10, clamped by `clampCut`); presets stay chips; stage advance by gestures (element into the gap, polymerase along the gaps); back and forward stay for review | both `type="range"` inputs and the next-stage primary button (Back and *Start the challenge* stay) |
| 20 | `HgtLab` (bacterial-hgt) | the donor cell dragged to the recipient → `setPrereq(lab, 'contact', true)`; plasmid parts dropped → `conjugative`, `oriT`; holding → `act(lab, 'conjugate'|'transpose')`; the selection stays a button | the prereq checkboxes and the conjugate and transpose buttons |
| 21 | `BacterialExplorer` (bacterial-hgt) | see the evidence rule below | the `<select>` prediction (now choice chips) |
| 22 | `ConsequenceExplorer` (tsd, genomic-consequences) | see the evidence rule below | the `<select>` prediction (now choice chips) |

**The evidence rule for Tasks 21–22.** These two components call `onInspect(index)`, which records lesson evidence.

- Add the test `<Name>: onInspect calls are identical`. Render the old and new components with a spy `onInspect` for every lesson that uses them (`lessonById('bacterial-hgt')`, `lessonById('tsd')`, `lessonById('genomic-consequences')`). Drive every variant with the correct prediction and with one wrong prediction, using the component's exported pure `investigate`/`reveal` helper.
- To make this testable, first extract the current `investigate` / `reveal` bodies into `<name>Logic.js` (a pure function `(lesson, index, prediction) → {result, inspect: index|null}`) *before* the rewrite, with a test that passes against the current behaviour. Then rewrite the view on top of it.
- Assert that the sequence of `onInspect` arguments is the same as for the original, and that it is called only on a correct prediction.

**Task 23: Genetics PR.** This is the same as Task 8, but titled "Hands-on experiments: Genetics / Transposable Elements". Ask the user before merging.

---

# PR C: Molecular Biology / DNA Extraction

Branch: `claude/hands-on-extraction`.

### Task 24: ReagentStages

This follows the common shape. The intent is: a reagent bottle poured or pipetted into stage tube `stageId` → `checkReagent(reagentId, stageId)`. Wrong drops are accepted and show the hint text. Completion is `reagentsSorted(placed)`. Gone: the select-then-click cards and cells.

### Task 25: Precipitation bench, built from empty

**Files:**
- Create: `hands-on/intents/precipitationBuild.js`
- Modify: `components/ProtocolBench.jsx` (the `precipitation` branch and `Tube`)
- Test: `tests/handsOnExtraction.test.js`

**Interfaces:**
- **Produces the reducer `buildStep(build, step) → build`.** It starts from `newBuild() = {sample:null, alcohol:null, volumes:0, salt:false, temperature:'room', spin:false, done:false}`. The steps are:
  - `{type:'pick-sample', sample: 200|700}`, which is only valid first;
  - `{type:'pour', alcohol, mark}`, where `mark ∈ [0.2,0.7,1,2.5]`, and a second alcohol is refused with a message;
  - `{type:'salt'}`;
  - `{type:'place', where:'ice'|'room'}`;
  - `{type:'spin'}`, which needs a sample and some alcohol (otherwise it is refused with the message "Add the alcohol first.") and sets `spin:true` and `done:true`;
  - `{type:'fresh'}` → `newBuild()`.
- **Produces `buildSettings(build) → settings`** for `evaluatePrecipitation`. It maps `ice` → `temperature:'ice'` and `room` → `'room'`.
- **Produces `buildChecks(build) → [{id, label, met}]`** for the requirement strip: sample chosen, alcohol poured, salt, spun.

- [ ] **Step 1: Write the failing tests:**
  - `a standard build equals the old defaults`: `buildSettings` after pick 700, pour isopropanol 0.7, salt, room, spin deep-equals `PRECIPITATION.defaults`.
  - `every outcome is reachable from a build`: builds that produce `evaluatePrecipitation(...).outcome` `pellet`, `salty` (ice), `overflow` (700 with ethanol at 2.5), `poor` (no salt), and `poor` via an unspun state (`buildSettings` of a build without spin has `spin:false`).
  - `no verdict until spun`: SSR of the bench shows the requirement strip, no outcome label, and an empty `role="status"` region.
  - `old controls are gone`: no `.cb-control` option buttons and no `mg-toggle` checkboxes.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3: Implement the reducer and rewrite the bench** with `BenchStage variant="bench"` and the pieces from the prototype (`.superpowers/brainstorm/886-1795598142/content/bench-gestures.html`):
  - the sample rack;
  - the bottles, as a `PourSource` with the pour pose pivoting at the neck, level draining liquid, a stream and a `Readout` "x vol → mark";
  - the salt pipette (hold);
  - the ice bucket (the tube sits behind its front);
  - the centrifuge (`Dial` with `threshold: 1.6 * Math.PI`);
  - the *Fresh tube* button.

  The goals list is evaluated on `buildSettings` after each `done`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Check it in the browser** at `/learn/transposable-elements/isopropanol-precipitation`: reach all five goals by mouse, then by keyboard.
- [ ] **Step 6: Commit** with the message `Precipitation bench: build it by hand`.

### Task 26: Wash bench, built from a fresh pellet

This follows Task 25's pattern, in `hands-on/intents/washBuild.js`.

- **Build state:** `newWash() = {wash:null, dry:null, solvent:null, done:false}`.
- **Steps:**
  - `{type:'wash', with:'water'|'e70'|'e100'}`;
  - `{type:'dry', for:'none'|'brief'|'long'}`, set with a timer `Dial` using `detents ['none','brief','long']`;
  - `{type:'dissolve', in:'te'|'water'}`, which sets `done`;
  - `fresh`.
- **Settings:** `washSettings(build)` maps skipped steps to `wash:'none'` and `dry:'none'`.
- **Tests:**
  - `a standard build equals the old defaults` (no wash, brief dry, TE dissolve → `WASH.defaults`);
  - `every outcome is reachable from a build` (`clean`, `lost`, `salty`, `ethanol`, `hard`, each via `evaluateWash`);
  - `no verdict until dissolved`.
- **Browser check:** `/learn/transposable-elements/ethanol-wash`.
- **Commit message:** `Wash bench: build it by hand`.

### Task 27: Extraction PR

This is the same as Task 8. Ask the user before merging.

---

# PR D: Molecular Biology / Bench Workflow (stations 19–22)

Branch: `claude/hands-on-bench`. These benches use `benchStep.js` (`set`, `predict`, `reveal`, `reset`) and keep the hand-off card. Gestures produce `{type:'set', patch}`. The prediction stays a question, and the commitment buttons keep their exact text so `benchComponents.test.js` passes unchanged.

Each task follows the common shape, with tests appended to `tests/handsOnBench.test.js`. The test (a) for each one is `<Name>: gestures produce every set patch`, which covers every option of its config.

| Task | Component | Intent → `set` patch | Must stay |
|---|---|---|---|
| 28 | `Spectrophotometer` | holding the pipette on the pedestal → loads the card sample; a swipe on the arm → reading shown; verdict chips stay a question | a `Reveal…` button, disabled until predicted |
| 29 | `Thermocycler` | primer tubes dropped in the facing / same / away slots → `primers`; the polymerase tube dropped → `polymerase`; detent dials → `anneal` (45/55/72), `cycles` (10/20/30/40) | `Run the cycler` as the machine key, disabled until predicted; the cycle table and the "schematic" note |
| 30 | `GelBench` | agarose poured to the 0.7/1/2% mark → `agarose`; electrode leads dragged → `polarity`; the run dial → `run`; a ruler line dragged to a band → `estimate` | `Run the gel` as the supply switch; the exports `evaluateGel`, `gelStep` and `initialGel` unchanged |
| 31 | `DigestBench` | enzyme tubes dropped in the reaction tube → the enzyme set; the tube dropped on the heat block → digest; size chips stay a question | a `Digest and run` button, disabled until predicted |

**Task 32: Bench PR.** This is the same as Task 8. Ask the user before merging. Afterwards, add a hand-over note to the shared notes folder: `C:\Users\Administrator\AppData\Roaming\Claude\side-session-notes\local_901b8b25-651d-4308-83a7-9fafdf10acef\hands-on-experiments.md`. It should cover the PR links, the kit API summary, and anything a future module needs.
