import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { HoldTarget } from '../hands-on/kit/HoldTarget.jsx';
import { SwipeTarget } from '../hands-on/kit/SwipeTarget.jsx';
import { HoldSwipeTarget } from '../hands-on/kit/HoldSwipeTarget.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { Track } from '../hands-on/kit/Track.jsx';
import { TapTarget } from '../hands-on/kit/TapTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { url } from '../hands-on/kit/HandsOnDefs.jsx';
import { demoHand, initialDemo } from '../hands-on/demoHand.js';
import { angleAt } from '../hands-on/gestures/index.js';
import { storyIntent } from '../hands-on/intents/story.js';
import { checkpoints } from '../learning.js';
import { boundaryFromAngle } from '../storyLab.js';
import './storyScenes.css';

// Schematic, hands-on scenes for the story labs. Interactions dispatch story actions; the engine
// (via storyLab.js) decides every molecular outcome. Angles are degrees clockwise from 12 o'clock.

export function polar(cx, cy, r, angle) {
  const a = (angle - 90) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
export function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}
/* ---------------- Shared scene shell ---------------- */
const NARROW_BELOW = 560; // container px under which the stacked layout is used
const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// What every story scene needs around its SVG: the container width (for the narrow layout), the
// local note and the single live region, focus that follows the flow (waiting for a held Enter or
// Space to be released), the demo hand, and one `act` that sends every gesture to the model.
function useStoryShell(scenario, dispatch, {flowKey, nextFocus, needKind, needKey}) {
  const box = useRef(null);
  const [boxW, setBoxW] = useState(0);
  const [note, setNote] = useState(null); // {text, s}: a local announcement, shown only for the state it was made in
  const [acted, setActed] = useState(false); // the live region stays empty until the first scene action
  const [demo, sendDemo] = useReducer(demoHand, undefined, () => initialDemo({reducedMotion: prefersReducedMotion()}));
  const focusIntent = useRef(false), keyHeld = useRef(false), pendingFocus = useRef(null);
  const ids = useRef({map: new WeakMap(), next: 0});
  const idOf = obj => { const {map} = ids.current; if (!map.has(obj)) map.set(obj, ++ids.current.next); return map.get(obj); };

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setBoxW(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Focus follows the flow. While Enter or Space is still held, wait for its release, so a
  // held key never starts the next target's gesture.
  const focusNow = useCallback(sel => box.current?.querySelector(sel)?.focus(), []);
  const requestFocus = useCallback(sel => {
    if (!sel) return;
    if (keyHeld.current) pendingFocus.current = sel; else focusNow(sel);
  }, [focusNow]);
  useEffect(() => {
    const up = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      keyHeld.current = false;
      if (pendingFocus.current) { focusNow(pendingFocus.current); pendingFocus.current = null; }
    };
    // Focus left the window mid-press: no key-up will come, so nothing is held any more.
    const blur = () => { keyHeld.current = false; pendingFocus.current = null; };
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [focusNow]);
  useEffect(() => {
    if (!focusIntent.current) return;
    focusIntent.current = false;
    requestFocus(nextFocus);
  }, [flowKey, nextFocus, requestFocus]);

  // Demo hand: which gesture the current step needs.
  useEffect(() => { sendDemo({type: 'need', kind: needKind, t: performance.now()}); }, [needKind, needKey]);
  useEffect(() => {
    const id = setInterval(() => sendDemo({type: 'tick', t: performance.now()}), 1000);
    return () => clearInterval(id);
  }, []);
  const activity = () => sendDemo({type: 'activity', t: performance.now()});
  const onKeyDownCapture = e => { activity(); if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) keyHeld.current = true; };

  // Every gesture goes to the model through storyIntent, refused or not.
  const act = gesture => {
    setActed(true);
    focusIntent.current = !!box.current?.contains(document.activeElement);
    const action = storyIntent(scenario, gesture);
    if (action) dispatch(action);
  };

  // The next-step line: the step hint as plain text until the first action, then one live region
  // carrying the model's message (✓/✗) and the hint, or a local note.
  const nextRow = (s, {freeMode, hint, extra}) => {
    const message = !freeMode && s.message
      ? <span className={`ts-msg ${s.message.ok ? 'is-good' : 'is-refused'}`}>{s.message.ok ? '✓ ' : '✗ '}{s.message.text} </span> : null;
    const localNote = note && note.s === s ? note.text : null;
    const live = acted || localNote != null || message != null;
    // A fresh node per model state or note, so an identical repeated refusal is announced again.
    const liveKey = localNote != null ? `n${idOf(note)}` : `s${idOf(s)}`;
    return <div className="ts-next-row">
      {!live && <p className="ts-step-hint">{hint}</p>}
      <NextStep className={live ? undefined : 'is-empty'}>{live ? <span key={liveKey}>{localNote ?? <>{message}{hint}</>}</span> : null}</NextStep>
      {extra}
    </div>;
  };

  const say = s => text => setNote({text, s});
  return {box, narrow: boxW > 0 && boxW < NARROW_BELOW, say, act, demo, sendDemo, requestFocus, activity, onKeyDownCapture, nextRow};
}

/* ---------------- Tn5: cut and paste, on the hands-on kit ---------------- */
// Two layouts of the same scene: wide (side by side) and narrow (stacked, for phones).
const WIDE = {W: 760, H: 340, DY: 120, DX: [40, 440], EL: [180, 300], RING: [590, 190, 92], tray: [70, 292], capD: [40, 44], capT: [530, 78], gap: 24, lift: 56};
const NARROW = {W: 420, H: 620, DY: 112, DX: [16, 404], EL: [140, 280], RING: [210, 440, 112], tray: [40, 236], capD: [16, 40], capT: [150, 298], gap: 20, lift: 52};
const END_W = 16, RING_ZONE = 48, ARC_HALF = 16, TSD_W = 6, SWIPE_REACH = 80;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Ring touch band: 44 css px (44 units / scale), but never so wide it reaches the ring's centre hint.
export const ringTrackHit = (k, r) => Math.min(44 * k, 2 * (r - 40));
// Closed annular sector: a filled touch area along the ring between two angles.
function sector(cx, cy, r0, r1, a0, a1) {
  const [ox0, oy0] = polar(cx, cy, r1, a0), [ox1, oy1] = polar(cx, cy, r1, a1);
  const [ix1, iy1] = polar(cx, cy, r0, a1), [ix0, iy0] = polar(cx, cy, r0, a0), large = a1 - a0 > 180 ? 1 : 0;
  return `M ${ox0} ${oy0} A ${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${r0} ${r0} 0 ${large} 0 ${ix0} ${iy0} Z`;
}
const SIDES = ['left', 'right'];

function sceneLabel(s, free, inserted) {
  if (inserted) {
    const seen = s.inspected.length;
    return `Tn5 now sits in the circular target between two purple host repeats${seen ? ` (${seen} of 2 inspected)` : ''}. The donor is two separate broken pieces.`;
  }
  if (free) return 'Tn5 has been cut free and is held by transposase above the broken donor. The circular target ring is ready.';
  const held = s.bound.length, cut = s.cut.length;
  return `A linear donor DNA carries the gold Tn5 element between two ends; ${held} of 2 ends hold transposase${cut ? `, ${cut} of 2 cut` : ''}. A circular target has no Tn5.`;
}

function stepHint(s, {freeMode, free, inserted, answered}) {
  if (freeMode) return inserted ? 'Tap a purple repeat to inspect it.' : free ? 'Drag Tn5 onto the target ring. Keyboard: Enter picks it up and drops it on the ring; then the arrow keys choose the spot.' : 'Hold an end to bind transposase. Swipe down across a held end to cut it.';
  switch (s.stage) {
    case 0: return s.bound.length ? 'One end held. Now press and hold the other gold end.' : 'Press and hold a gold end of Tn5 until the ring fills.';
    case 1:
      if (free) return 'Tn5 is cut free. Drag it onto the target ring. Keyboard: Enter picks it up, Enter drops it on the ring, then the arrow keys choose the spot.';
      if (!answered) return 'Answer the prediction below the scene, then swipe down across each end to cut.';
      return s.cut.length ? 'One end cut. Now swipe down across the other end.' : 'Swipe down across a gold end to cut it.';
    case 2: return 'Tn5 is in the target ring. Tap it to inspect the insertion.';
    case 3: return s.inspected.length ? 'One repeat found. Tap the other purple repeat.' : 'Tap each purple repeat beside Tn5.';
    default: return 'Done. Review the result, then save your lab below.';
  }
}

// free: sandbox mode. Ends stay holdable until bound and swipeable once bound; nothing is highlighted.
export function Tn5Scene({ s, dispatch, free: freeMode = false }) {
  const [ghost, setGhost] = useState(null);
  const {stage, bound, cut} = s, free = cut.length === 2, inserted = stage >= 2;
  const answered = s.answers.tn5 === checkpoints.tn5.correct;

  const nextEnd = side => !bound.includes(side);
  const nextFocus = inserted
    ? stage === 2 && !freeMode ? '.ts-inserted' : stage === 3 ? (s.inspected.includes('target-tsd-left') ? '.ts-tsd-right' : '.ts-tsd-left') : null
    : free ? '.ts-tn5'
      : stage === 0 ? (nextEnd('left') ? '.ts-end-left' : '.ts-end-right')
        : (cut.includes('left') ? '.ts-end-right' : '.ts-end-left');
  // Demo hand: which gesture the current step needs, and where.
  const [needKind, needKey] = freeMode ? [null, 'free']
    : stage === 0 ? ['hold', `hold-${nextEnd('left') ? 'left' : 'right'}`]
      : stage === 1 && free ? ['drag', 'drag']
        : stage === 1 && answered ? ['swipe', `swipe-${cut.includes('left') ? 'right' : 'left'}`]
          : stage === 2 ? ['tap', 'tap-inserted']
            : stage === 3 ? ['tap', `tap-${s.inspected.includes('target-tsd-left') ? 'right' : 'left'}`]
              : [null, `none-${stage}`];
  const shell = useStoryShell('tn5', dispatch, {flowKey: `${stage}|${bound.length}|${cut.length}|${s.inspected.length}`, nextFocus, needKind, needKey});
  const {act} = shell, say = shell.say(s);
  const L = shell.narrow ? NARROW : WIDE;

  const after = shell.nextRow(s, {freeMode, hint: stepHint(s, {freeMode, free, inserted, answered}),
    extra: stage === 2 && !freeMode && <button type="button" className="ts-continue" onClick={() => act({kind: 'tap', target: 'inserted'})}>Continue</button>});

  return <div ref={shell.box} className="ts-scene" onPointerDownCapture={shell.activity} onKeyDownCapture={shell.onKeyDownCapture}>
    <BenchStage variant="molecular" width={L.W} height={L.H} label={sceneLabel(s, free, inserted)} after={after}>
      <Tn5Body s={s} L={L} freeMode={freeMode} free={free} inserted={inserted} answered={answered} act={act} say={say}
        ghost={ghost} setGhost={setGhost} demo={shell.demo} sendDemo={shell.sendDemo} requestFocus={shell.requestFocus} />
    </BenchStage>
  </div>;
}

function Tn5Body({ s, L, freeMode, free, inserted, answered, act, say, ghost, setGhost, demo, sendDemo, requestFocus }) {
  const {scale, ids} = useStage();
  const {stage, bound, cut} = s, {DY, DX, EL, RING, gap, lift} = L;
  const [cx, cy, r] = RING, elCx = (EL[0] + EL[1]) / 2, half = (EL[1] - EL[0]) / 2;
  const k = Math.max(1, 1 / (scale || 1)); // grow touch areas when the scene is drawn small
  const endHitMax = (EL[1] - EL[0] - END_W) / 2 - 2;
  const endX = side => side === 'left' ? EL[0] + END_W / 2 : EL[1] - END_W / 2;
  const carrying = useRef(false), lastAngle = useRef(null);
  const nearRing = (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= RING_ZONE;
  const zones = [{id: 'ring', label: 'Over the target ring. Press Enter to drop Tn5 there.', contains: nearRing}];

  const pointAngle = e => {
    const m = e.currentTarget.ownerSVGElement?.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()), a = nearRing(p.x, p.y) ? angleAt(p.x, p.y, cx, cy) : null;
    lastAngle.current = a;
    setGhost(a);
  };
  const trackPointer = e => { if (carrying.current) pointAngle(e); };

  const tsdBlock = inserted ? s.history.state.molecules.find(m => m.id === 'target')?.blocks.find(b => b.kind === 'tsd') : null;
  // Same mapping as the engine view: boundary / 900 units of the ring.
  const tsdAngle = inserted ? (s.boundary ?? 200) / 900 * 360 : null;

  const tube = (kind, x0, x1, y, h = 14) => <g transform={`translate(0 ${y})`}>
    <rect x={x0} y={-7} width={Math.max(0, x1 - x0)} height={14} rx={7} fill={url(ids.tube[kind])} transform={h === 14 ? undefined : `scale(1 ${h / 14})`} />
  </g>;
  // The class goes on an inner group: a CSS animation's transform would replace the translate attribute.
  const enzyme = (x, y, key, className) => <g key={key} transform={`translate(${x} ${y})`} filter={url(ids.contact)}>
    <g className={className}><circle r="15" fill={url(ids.enzyme)} /><text className="ts-enzyme-label" y="5" textAnchor="middle">T</text></g>
  </g>;
  const tir = (x, y) => <rect className="ts-tir" x={x - END_W / 2} y={y - 14} width={END_W} height={28} rx={5} filter={url(ids.contact)} />;

  // A gold end: hold to bind (stage 0; in the sandbox while unbound), then swipe down to cut.
  const end = side => {
    const x = endX(side), isBound = bound.includes(side), isCut = cut.includes(side);
    const Side = side === 'left' ? 'Left' : 'Right', band = Math.min(34 * k, endHitMax - 14);
    const reach = <rect className="ts-swipe-reach" x={x - 14 - band} y={DY - SWIPE_REACH} width={28 + 2 * band} height={2 * SWIPE_REACH} />;
    // Sandbox: an unbound end can be bound or cut, so the refused cut ("none is bound") stays reachable.
    if (freeMode && !isBound && !isCut) {
      return <HoldSwipeTarget key={`both-${side}`} className={`ts-end-${side}`} cx={x} cy={DY} line={{x1: x - 14, y1: DY, x2: x + 14, y2: DY}} band={band}
        label={`${Side} end of Tn5: press and hold to bind transposase, or swipe down across it to cut. Keyboard: hold Enter to bind, press Enter to cut`}
        onHold={() => act({kind: 'hold', target: `end-${side}`})} onSwipe={() => act({kind: 'swipe', target: `end-${side}`})}>
        {reach}{tir(x, DY)}
      </HoldSwipeTarget>;
    }
    if (!freeMode && stage === 0) {
      return <HoldTarget key={`hold-${side}`} className={`ts-end-${side}`} cx={x} cy={DY} hitR={Math.min(26 * k, endHitMax)} ringR={24}
        label={isBound ? `${Side} end of Tn5: transposase bound` : `Hold to bind transposase to the ${side} end of Tn5`}
        expected={!freeMode && !isBound} onHold={() => act({kind: 'hold', target: `end-${side}`})}>{tir(x, DY)}</HoldTarget>;
    }
    const expected = !freeMode && answered && !isCut;
    return <SwipeTarget key={`swipe-${side}`} className={`ts-end-${side}`} line={{x1: x - 14, y1: DY, x2: x + 14, y2: DY}} band={band}
      label={isCut ? `${Side} end of Tn5: cut` : `Cut the ${side} end of Tn5 (swipe down across it)`}
      expected={expected} onSwipe={() => act({kind: 'swipe', target: `end-${side}`})}>
      {/* Taller reach than the band: a downward stroke may start well above the DNA. */}
      {reach}{tir(x, DY)}
      {expected && <line className="ts-swipe-cue" x1={x} y1={DY - 46} x2={x} y2={DY + 46} />}
    </SwipeTarget>;
  };

  // The freed element, drawn around its own centre (for the Draggable).
  const freedTn5 = <g className="ts-liftoff" style={{'--ts-lift': `${lift}px`}}>
    <g filter={url(ids.lift)}>{tube('element', -half, half, 0, 24)}</g>
    <text className="ts-label" y="5" textAnchor="middle">Tn5 →</text>
    {SIDES.map(side => <g key={side}>{tir(side === 'left' ? -half + END_W / 2 : half - END_W / 2, 0)}</g>)}
    {SIDES.filter(side => bound.includes(side)).map(side => enzyme(side === 'left' ? -half + END_W / 2 : half - END_W / 2, -34, side))}
  </g>;

  // Demo hand position for the current need.
  const handAt = (() => {
    if (!demo.show) return null;
    if (demo.kind === 'hold') { const x = endX(bound.includes('left') ? 'right' : 'left'); return {from: {x, y: DY}}; }
    if (demo.kind === 'swipe') { const x = endX(cut.includes('left') ? 'right' : 'left'); return {from: {x, y: DY - 48}, to: {x, y: DY + 48}, text: 'Swipe down', labelAt: {x, y: DY + 74}}; } // label under the stroke, clear of the enzymes
    if (demo.kind === 'drag') { const [tx, ty] = polar(cx, cy, r, 300); return {from: {x: elCx, y: DY - lift}, to: {x: tx, y: ty}, text: 'Drag onto the ring'}; }
    if (demo.kind === 'tap' && tsdAngle != null) {
      const a = stage === 2 ? tsdAngle : tsdAngle + (s.inspected.includes('target-tsd-left') ? 1 : -1) * (ARC_HALF + TSD_W / 2);
      const [x, y] = polar(cx, cy, r, a); return {from: {x, y}};
    }
    return null;
  })();

  const leftShift = free || inserted ? -gap : cut.includes('left') ? -8 : 0, rightShift = free || inserted ? gap : cut.includes('right') ? 8 : 0;
  const hitHalf = clamp(ARC_HALF * k, ARC_HALF, 25), tsdSpan = clamp(32 * k, 32, 50), ringHit = clamp(26 * k, 26, 40);

  return <>
    <text className="ts-caption" x={L.capD[0]} y={L.capD[1]}>DONOR DNA · LINEAR</text>
    <text className="ts-caption" x={L.capT[0]} y={L.capT[1]}>TARGET DNA · CIRCULAR</text>

    {/* Donor: two pieces that spring apart when an end is cut */}
    <g filter={url(ids.contact)}>
      <g className="ts-donor-piece" style={{transform: `translateX(${leftShift}px)`}}>{tube('donor', DX[0], EL[0], DY)}</g>
      <g className="ts-donor-piece" style={{transform: `translateX(${rightShift}px)`}}>{tube('donor', EL[1], DX[1], DY)}</g>
    </g>
    {(free || inserted) && <>
      <text className="ts-note" x={EL[0] - gap - 4} y={DY + 34} textAnchor="end">broken end</text>
      <text className="ts-note" x={EL[1] + gap + 4} y={DY + 34}>broken end</text>
    </>}

    {/* Target ring */}
    <circle className="ts-ring-shadow" cx={cx} cy={cy + 6} r={r} />
    <circle className="ts-ring" cx={cx} cy={cy} r={r} filter={url(ids.shade)} />

    {/* Element still in the donor */}
    {!free && !inserted && <g>
      <g filter={url(ids.contact)}>{tube('element', EL[0], EL[1], DY, 24)}</g>
      <text className="ts-label" x={elCx} y={DY + 5} textAnchor="middle">Tn5 →</text>
      {bound.length === 2 && <path className="ts-synapsis" d={`M ${endX('left')} ${DY - 50} Q ${elCx} ${DY - 86} ${endX('right')} ${DY - 50}`} />}
      {SIDES.filter(side => bound.includes(side)).map(side => enzyme(endX(side), DY - 34, side, 'ts-pop'))}
      {SIDES.map(end)}
    </g>}

    {/* Idle transposase in the tray */}
    {!free && !inserted && (freeMode || stage === 0) && bound.length < 2 && <g>
      {[0, 1].filter(i => i >= bound.length).map(i => enzyme(L.tray[0] + (i - bound.length) * 40, L.tray[1], i, 'ts-idle-enzyme'))}
      <text className="ts-note" x={L.tray[0] - 15} y={L.tray[1] + 32}>transposase</text>
    </g>}

    {/* Freed Tn5: carry it to the ring (pointer), or Enter, then the ring's arrow keys (keyboard) */}
    {free && !inserted && <>
      <ellipse className="ts-ground-shadow" cx={elCx} cy={DY + 2} rx={half * 0.8} ry={7} />
      <Track className="ts-ring-track" cx={cx} cy={cy} r={r} value={80} ghostSpan={ARC_HALF} expected={!freeMode} hitWidth={ringTrackHit(k, r)}
        label="Target ring: arrow keys choose where Tn5 inserts, Enter inserts it here"
        onPreview={deg => say(`Spot ${deg}° on the ring. Press Enter to insert Tn5 here.`)}
        onConfirm={deg => act({kind: 'drop', target: 'ring', angle: deg})} />
      <text className="ts-hint" x={cx} y={cy + 5} textAnchor="middle">drop Tn5 here</text>
      {ghost != null && <path className="ts-ghost" d={arc(cx, cy, r, ghost - ARC_HALF, ghost + ARC_HALF)} />}
      <g onPointerMoveCapture={trackPointer} onPointerUpCapture={trackPointer}>
        <Draggable className="ts-tn5" x={elCx} y={DY - lift} zones={zones} expected={!freeMode}
          hit={{x: -half, y: -22 * k, width: 2 * half, height: 44 * k}}
          label="Tn5, cut free. Drag it onto the target ring, or press Enter to pick it up"
          carriedLabel="Carrying Tn5. Press Enter to drop it on the target ring, Escape to put it back"
          onCarry={active => { carrying.current = active; sendDemo({type: 'drag', active}); if (active) say('Carrying Tn5. Drop it on the blue target ring.'); else setGhost(null); }}
          onAnnounce={text => text && say(text)}
          onCancel={() => say('Tn5 is back in place. Drag it onto the blue target ring.')}
          onDrop={({via}) => {
            if (via === 'key') {
              say('Tn5 is over the ring. Use the arrow keys to choose the spot, then press Enter to insert it.');
              requestFocus('.ts-ring-track');
              return;
            }
            const a = lastAngle.current;
            if (a != null) act({kind: 'drop', target: 'ring', angle: a});
          }}>{freedTn5}</Draggable>
      </g>
    </>}

    {/* Inserted: the element and the two host repeats are tap targets */}
    {inserted && <g className="ts-pop">
      {!freeMode
        ? <TapTarget className="ts-inserted" label="Tn5 inserted in the target ring. Tap to inspect the insertion" expected={stage === 2}
          hit={{d: sector(cx, cy, r - ringHit, r + ringHit, tsdAngle - hitHalf, tsdAngle + hitHalf)}} onTap={() => act({kind: 'tap', target: 'inserted'})}>
          <path className="ts-arc ts-arc-element" d={arc(cx, cy, r, tsdAngle - ARC_HALF, tsdAngle + ARC_HALF)} filter={url(ids.shade)} />
        </TapTarget>
        : <path className="ts-arc ts-arc-element" d={arc(cx, cy, r, tsdAngle - ARC_HALF, tsdAngle + ARC_HALF)} filter={url(ids.shade)} />}
      {[['target-tsd-left', -1], ['target-tsd-right', 1]].map(([id, dir]) => {
        const seen = s.inspected.includes(id), word = dir < 0 ? 'left' : 'right';
        const a0 = tsdAngle + dir * ARC_HALF, a1 = a0 + dir * TSD_W, h0 = tsdAngle + dir * hitHalf, h1 = h0 + dir * tsdSpan;
        const [mx, my] = polar(cx, cy, r + 26, (a0 + a1) / 2);
        return <TapTarget key={id} className={`ts-tsd-${word}`} expected={!freeMode && stage === 3 && !seen}
          label={seen ? `${word === 'left' ? 'Left' : 'Right'} purple repeat: inspected` : `Inspect the ${word} purple repeat`}
          hit={{d: sector(cx, cy, r - ringHit, r + ringHit, Math.min(h0, h1), Math.max(h0, h1))}} onTap={() => act({kind: 'tap', target: id})}>
          <path className="ts-arc ts-arc-tsd" d={arc(cx, cy, r, Math.min(a0, a1), Math.max(a0, a1))} filter={url(ids.shade)} />
          {seen && <text className="ts-check" x={mx} y={my + 5} textAnchor="middle">✓</text>}
        </TapTarget>;
      })}
      <text className="ts-note" x={cx} y={cy + 4} textAnchor="middle">{tsdBlock ? `${tsdBlock.bp} bp repeats` : ''}</text>
    </g>}

    {handAt && <DemoHand show={demo.show} still={demo.still} from={handAt.from} to={handAt.to} text={handAt.text} labelAt={handAt.labelAt} />}
  </>;
}

/* ---------------- Tn3: copy, join, separate, on the hands-on kit ---------------- */
// Wide: circles side by side, the target joins from the right. Narrow: stacked, the target joins from below.
// face: the donor angle that faces the docked target (Tn3 sits there). Cointegrate: copy angles,
// backbone arcs and the target-side repeats. tCap: the target caption's offset from its centre.
const WIDE3 = {
  W: 760, H: 340, D: [220, 180, 82], T: [570, 180, 82], face: 90, tCap: -96, forkNote: [305, 300, 'middle'],
  CO: [385, 180, 118], copies: [270, 90], donorArc: [290, 430], targetArc: [110, 250], tsds: [[248, 253], [107, 112]], tray: [680, 290], coCap: [385, 36],
  RES: [[290, 185, 88], [470, 185, 88]], resCap: -104, note: [380, 322],
};
const NARROW3 = {
  W: 420, H: 620, D: [210, 130, 74], T: [210, 470, 74], face: 180, tCap: 96, forkNote: [246, 212, 'start'],
  CO: [210, 300, 120], copies: [0, 180], donorArc: [200, 340], targetArc: [20, 160], tsds: [[17, 22], [158, 163]], tray: [210, 566], coCap: [210, 40],
  RES: [[210, 160, 86], [210, 418, 86]], resCap: -100, note: [210, 596],
};
const EL3_HALF = 25, COPY_HALF = 17, JOIN_HALF = 10, DOCK_REACH = 50, RES_REACH = 58, TNPR_OUT = 64;
const COPY_IDS = ['copy-1', 'copy-2'];
const xy = ([x, y]) => ({x, y});

function tn3Label(s, parked) {
  const {stage} = s;
  if (stage === 5) return 'Two separate circles, donor and target, each with one Tn3; they may remain linked.';
  if (stage >= 3) return `One large Tn3 cointegrate circle: both backbones and two Tn3 copies pointing the same way (${s.inspected.length} of 2 inspected). TnpR is ${s.tnpR ? 'docked on a res site' : 'waiting off the DNA'}.`;
  if (stage >= 1) return `Donor and target circles touch at target site ${s.boundary ?? 0}; Tn3’s ends are joined to the target. A replication fork waits at Tn3.`;
  return parked ? 'The target circle touches the donor, which carries one Tn3. Choose the spot on the target ring where Tn3 joins.'
    : 'A donor circle carries one Tn3; a separate target circle has none.';
}

function tn3Hint(s, {freeMode, answeredRes, parked}) {
  const {stage} = s;
  if (freeMode) return stage === 5 ? 'Resolved. Use Fresh molecules to start again.'
    : stage >= 3 ? 'Tap a Tn3 copy to inspect it. Drag TnpR onto a res site, or off the DNA to remove it.'
      : stage >= 1 ? 'Hold the replication fork to replicate through Tn3.'
        : 'Drag the target circle onto the donor circle. The side that touches the donor is where Tn3 joins.';
  switch (stage) {
    case 0: return parked ? 'Use the arrow keys to choose the spot on the target ring, then press Enter to join Tn3 there.'
      : 'Drag the target circle onto the donor circle; the side that touches the donor is where Tn3 joins. Keyboard: Enter picks it up, Enter docks it, then the arrow keys choose the spot.';
    case 1: return 'The circles are joined. Answer the prediction below the scene.';
    case 2: return 'Press and hold the replication fork until the ring fills, to copy Tn3.';
    case 3: return s.inspected.length ? 'One copy inspected. Tap the other Tn3 copy.' : 'Tap each Tn3 copy in the cointegrate.';
    case 4:
      if (!answeredRes) return 'Answer the prediction below the scene, then drag TnpR onto a res site and press Resolve.';
      return s.tnpR ? 'TnpR is on res. Press Resolve below the scene. Dragging TnpR off the DNA removes it.' : 'Drag TnpR onto a red res site in either copy. Keyboard: Enter picks it up, the arrow keys choose a site, Enter docks it.';
    default: return 'Done. Review the result, then save your lab below.';
  }
}

// free: sandbox mode (optional; nothing is highlighted and the model message is left to the page).
export function Tn3Scene({ s, dispatch, free: freeMode = false }) {
  const [ghost, setGhost] = useState(null);
  const [parkedFor, setParkedFor] = useState(null); // the history a keyboard dock was made in: Restart un-parks
  const [resAt, setResAt] = useState(0); // which res site TnpR sits on
  const {stage} = s, parked = stage === 0 && parkedFor === s.history;
  const answeredRes = s.answers.resolution === checkpoints.resolution.correct;

  // Stage 1: the dragged target is gone, so focus waits on the fork; Tab goes on to the prediction.
  const nextFocus = stage === 0 ? (parked ? null : '.t3-target') : stage <= 2 ? '.t3-fork'
    : stage === 3 ? (s.inspected.includes('copy-1') ? '.t3-copy-2' : '.t3-copy-1') : stage === 4 ? '.t3-tnpr' : null;
  const [needKind, needKey] = freeMode ? [null, 'free']
    : stage === 0 && !parked ? ['drag', 'drag-target']
      : stage === 2 ? ['hold', 'hold-fork']
        : stage === 3 ? ['tap', `tap-${s.inspected.includes('copy-1') ? 2 : 1}`]
          : stage === 4 && answeredRes && !s.tnpR ? ['drag', 'drag-tnpr']
            : [null, `none-${stage}`];
  const shell = useStoryShell('tn3', dispatch, {flowKey: `${stage}|${s.inspected.length}|${s.tnpR}|${resAt}`, nextFocus, needKind, needKey});
  const L = shell.narrow ? NARROW3 : WIDE3;
  const after = shell.nextRow(s, {freeMode, hint: tn3Hint(s, {freeMode, answeredRes, parked})});

  return <div ref={shell.box} className="ts-scene t3-scene" onPointerDownCapture={shell.activity} onKeyDownCapture={shell.onKeyDownCapture}>
    <BenchStage variant="molecular" width={L.W} height={L.H} label={tn3Label(s, parked)} after={after}>
      <Tn3Body s={s} L={L} freeMode={freeMode} answeredRes={answeredRes} parked={parked} park={() => setParkedFor(s.history)}
        resAt={resAt} setResAt={setResAt} act={shell.act} say={shell.say(s)} ghost={ghost} setGhost={setGhost}
        demo={shell.demo} sendDemo={shell.sendDemo} requestFocus={shell.requestFocus} />
    </BenchStage>
  </div>;
}

function Tn3Body({ s, L, freeMode, answeredRes, parked, park, resAt, setResAt, act, say, ghost, setGhost, demo, sendDemo, requestFocus }) {
  const {scale, ids} = useStage();
  const {stage} = s, guided = !freeMode;
  const k = Math.max(1, 1 / (scale || 1)); // grow touch areas when the scene is drawn small
  const [dx, dy, dr] = L.D, [, , tr] = L.T, face = L.face, join = (face + 180) % 360;
  const dock = xy(polar(dx, dy, dr + tr + 6, face)), home = xy(L.T), fork = xy(polar(dx, dy, dr + 3, face));
  const [cx, cy, cr] = L.CO;

  // Target circle carry: the item's centre follows the pointer from where it was grabbed.
  const grab = useRef({x: 0, y: 0}), lastAngle = useRef(null), carrying = useRef(false);
  const centreOf = (x, y) => ({x: x - grab.current.x, y: y - grab.current.y});
  const nearDonor = c => Math.hypot(c.x - dx, c.y - dy) <= dr + tr + DOCK_REACH;
  // The spot on the target ring that faces the donor is where Tn3 joins.
  const facing = c => angleAt(dx, dy, c.x, c.y);
  const svgPoint = e => {
    const m = e.currentTarget.ownerSVGElement?.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null;
  };
  const onGrab = e => { const p = svgPoint(e); if (p) grab.current = {x: p.x - home.x, y: p.y - home.y}; };
  const trackPointer = e => {
    if (!carrying.current) return;
    const p = svgPoint(e);
    if (!p) return;
    const c = centreOf(p.x, p.y), a = nearDonor(c) ? facing(c) : null;
    lastAngle.current = a;
    setGhost(a);
  };
  const donorZone = [{id: 'donor', label: 'Touching the donor circle. Press Enter to dock the target there.', contains: (x, y) => nearDonor(centreOf(x, y))}];

  // TnpR: res zones (magnets just outside each copy's res site); docked, anywhere else is "off the DNA".
  const resDot = i => xy(polar(cx, cy, cr, L.copies[i]));
  const resSeat = i => xy(polar(cx, cy, cr + TNPR_OUT, L.copies[i]));
  const nearRes = (i, x, y) => { const [mx, my] = polar(cx, cy, cr + TNPR_OUT / 2, L.copies[i]); return Math.hypot(x - mx, y - my) <= RES_REACH; };
  const resZones = [0, 1].map(i => ({id: `res-${i}`, label: `Over the res site in Tn3 copy ${i + 1}. Press Enter to dock TnpR there.`, contains: (x, y) => nearRes(i, x, y), ...resSeat(i)}));
  const offZone = {id: 'off', label: 'Off the DNA. Press Enter to remove TnpR.', contains: (x, y) => !nearRes(0, x, y) && !nearRes(1, x, y)};
  const seat = s.tnpR ? resSeat(resAt) : xy(L.tray);

  const ring = (kind, x, y, r, extra) => <g key={`${kind}-${x}-${y}`}>
    <circle className="ts-ring-shadow" cx={x} cy={y + 6} r={r} />
    <circle className={`ts-ring t3-ring-${kind}`} cx={x} cy={y} r={r} filter={url(ids.shade)} />
    {extra}
  </g>;
  const elementArc = (x, y, r, a0, a1, key) => <path key={key} className="ts-arc ts-arc-element" d={arc(x, y, r, a0, a1)} filter={url(ids.shade)} />;
  const res = (x, y, key) => <circle key={key} className="t3-res" cx={x} cy={y} r="6" />;
  const donor = <>
    <text className="ts-caption" x={dx} y={dy - dr - 14} textAnchor="middle">DONOR · CIRCULAR</text>
    {ring('donor', dx, dy, dr)}
    {elementArc(dx, dy, dr, face - EL3_HALF, face + EL3_HALF)}
    {res(...polar(dx, dy, dr, face))}
  </>;
  // The target circle, drawn around its own centre.
  const target = (spot) => <>
    <text className="ts-caption" x="0" y={L.tCap} textAnchor="middle">TARGET · CIRCULAR</text>
    {ring('target', 0, 0, tr)}
    {spot != null && <path className="ts-ghost" d={arc(0, 0, tr, spot - JOIN_HALF, spot + JOIN_HALF)} />}
  </>;
  const tnprBody = <g filter={url(ids.contact)}>
    <circle className="t3-tnpr-body" r="16" />
    <ellipse className="t3-gloss" cx="-5" cy="-6" rx="6" ry="4" />
    <text className="ts-enzyme-label" y="5" textAnchor="middle">R</text>
  </g>;

  const handAt = (() => {
    if (!demo.show) return null;
    if (demo.kind === 'drag' && stage === 0) return {from: home, to: dock, text: 'Drag onto the donor', labelAt: {x: home.x, y: home.y - Math.sign(L.tCap) * (tr + 22)}}; // clear of the caption
    if (demo.kind === 'drag') return {from: xy(L.tray), to: resSeat(0), text: 'Drag onto res'};
    if (demo.kind === 'hold') return {from: fork};
    if (demo.kind === 'tap') return {from: xy(polar(cx, cy, cr, L.copies[s.inspected.includes('copy-1') ? 1 : 0]))};
    return null;
  })();
  const copyHit = clamp(26 * k, 26, 40), copySpan = clamp(COPY_HALF * k, COPY_HALF + 4, 32);

  return <>
    {/* Before replication: the donor, and the target circle the learner brings to it */}
    {stage <= 2 && donor}
    {stage === 0 && !parked && <g onPointerDownCapture={onGrab} onPointerMoveCapture={trackPointer} onPointerUpCapture={trackPointer}>
      <Draggable className="t3-target" x={home.x} y={home.y} zones={donorZone} expected={guided}
        hit={{x: -tr - 12, y: -tr - 12, width: 2 * tr + 24, height: 2 * tr + 24}}
        label="Drag the target circle onto the donor circle to dock it, or press Enter to pick it up"
        carriedLabel="Carrying the target circle. Press Enter to dock it on the donor, Escape to put it back"
        onCarry={active => { carrying.current = active; sendDemo({type: 'drag', active}); if (active) say('Carrying the target circle. Bring it to touch the donor.'); else setGhost(null); }}
        onAnnounce={text => text && say(text)}
        onCancel={() => say('The target circle is back in place. Drag it onto the donor circle.')}
        onDrop={({via}) => {
          if (via === 'key') {
            park();
            say('The target touches the donor. Use the arrow keys to choose the spot on the target ring, then press Enter to join Tn3 there.');
            requestFocus('.t3-target-track');
            return;
          }
          const a = lastAngle.current;
          if (a != null) act({kind: 'drop', target: 'target-circle', angle: a});
        }}>{target(ghost)}</Draggable>
    </g>}
    {/* Keyboard dock: the target waits against the donor; its ring chooses the joining spot */}
    {parked && <>
      <g transform={`translate(${dock.x} ${dock.y})`}>{target(null)}</g>
      <Track className="t3-target-track" cx={dock.x} cy={dock.y} r={tr} value={join} ghostSpan={JOIN_HALF} expected={guided} hitWidth={ringTrackHit(k, tr)}
        label="Target ring: arrow keys choose where Tn3 joins it, Enter joins it here"
        onPreview={deg => say(`Spot ${deg}° on the target ring (site ${boundaryFromAngle(deg)}). Press Enter to join Tn3 here.`)}
        onConfirm={deg => act({kind: 'drop', target: 'target-circle', angle: deg})} />
    </>}

    {/* Joined: strand transfer links Tn3's ends to the target; the fork waits at Tn3 */}
    {(stage === 1 || stage === 2) && <g className="ts-pop">
      <g transform={`translate(${dock.x} ${dock.y})`}>{target(null)}</g>
      {elementArc(dock.x, dock.y, tr, join - JOIN_HALF, join + JOIN_HALF)}
      {[-1, 1].map(side => {
        const [x0, y0] = polar(dx, dy, dr, face + side * EL3_HALF), [x1, y1] = polar(dock.x, dock.y, tr, join - side * JOIN_HALF);
        return <line key={side} className="t3-transfer" x1={x0} y1={y0} x2={x1} y2={y1} />;
      })}
      <text className="ts-note" x={dock.x} y={dock.y + 5} textAnchor="middle">site {s.boundary ?? 0}</text>
      <HoldTarget className="t3-fork" cx={fork.x} cy={fork.y} hitR={Math.min(26 * k, 40)} ringR={26}
        label="Hold the replication fork to copy Tn3 and fuse the circles" expected={guided && stage === 2}
        onHold={() => act({kind: 'hold', target: 'fork'})}>
        <g transform={`translate(${fork.x} ${fork.y}) rotate(${face - 90})`} filter={url(ids.contact)}>
          <path className="t3-fork-arms" d="M -16 0 L 0 0 L 15 -11 M 0 0 L 15 11" />
          <circle className="t3-fork-hub" r="5" />
        </g>
      </HoldTarget>
      <text className="ts-note" x={L.forkNote[0]} y={L.forkNote[1]} textAnchor={L.forkNote[2]}>replication fork</text>
    </g>}

    {/* Cointegrate: one circle, two copies to tap, res sites for TnpR */}
    {(stage === 3 || stage === 4) && <g className="ts-pop">
      <text className="ts-caption" x={L.coCap[0]} y={L.coCap[1]} textAnchor="middle">COINTEGRATE · ONE CIRCLE</text>
      <circle className="ts-ring-shadow" cx={cx} cy={cy + 6} r={cr} />
      <path className="ts-arc t3-arc-donor" d={arc(cx, cy, cr, ...L.donorArc)} filter={url(ids.shade)} />
      <path className="ts-arc t3-arc-target" d={arc(cx, cy, cr, ...L.targetArc)} filter={url(ids.shade)} />
      {L.tsds.map(([a0, a1]) => <path key={a0} className="ts-arc ts-arc-tsd" d={arc(cx, cy, cr, a0, a1)} filter={url(ids.shade)} />)}
      {COPY_IDS.map((id, i) => {
        const a = L.copies[i], seen = s.inspected.includes(id), [lx, ly] = polar(cx, cy, cr - 32, a);
        return <TapTarget key={id} className={`t3-${id}`} expected={guided && stage === 3 && !seen}
          label={seen ? `Tn3 copy ${i + 1}: inspected` : `Inspect Tn3 copy ${i + 1}`}
          hit={{d: sector(cx, cy, cr - copyHit, cr + copyHit, a - copySpan, a + copySpan)}} onTap={() => act({kind: 'tap', target: id})}>
          {elementArc(cx, cy, cr, a - COPY_HALF, a + COPY_HALF)}
          <text className={seen ? 'ts-check t3-copy-label' : 'ts-note t3-copy-label'} x={lx} y={ly + 5} textAnchor="middle">{seen ? '✓ ' : ''}copy {i + 1}</text>
        </TapTarget>;
      })}
      {[0, 1].map(i => res(resDot(i).x, resDot(i).y, `res-${i}`))}
      <text className="ts-note" x={cx} y={cy - 6} textAnchor="middle">donor + target backbones</text>
      <text className="ts-note" x={cx} y={cy + 14} textAnchor="middle">two Tn3 copies, same direction</text>
      {!s.tnpR && <text className="ts-note" x={L.tray[0]} y={L.tray[1] + 34} textAnchor="middle">TnpR</text>}
      <Draggable key={s.tnpR ? `tnpr-res-${resAt}` : 'tnpr-tray'} className="t3-tnpr" x={seat.x} y={seat.y}
        zones={s.tnpR ? [...resZones, offZone] : resZones} expected={guided && stage === 4 && answeredRes && !s.tnpR}
        hit={{x: -22 * k, y: -22 * k, width: 44 * k, height: 44 * k}}
        label={s.tnpR ? `TnpR docked on the res site in copy ${resAt + 1}. Drag it off the DNA to remove it, or press Enter to pick it up` : 'Drag TnpR onto a res site to dock it, or press Enter to pick it up'}
        carriedLabel={s.tnpR ? 'Carrying TnpR. Arrow keys choose a res site or off the DNA, Enter drops it, Escape puts it back' : 'Carrying TnpR. Arrow keys choose a res site, Enter docks it, Escape puts it back'}
        onCarry={active => { sendDemo({type: 'drag', active}); if (active) say(s.tnpR ? 'Carrying TnpR. Drop it on a res site, or anywhere off the DNA to remove it.' : 'Carrying TnpR. Drop it on a red res site.'); }}
        onAnnounce={text => text && say(text)}
        onCancel={() => say(s.tnpR ? 'TnpR is back on its res site.' : 'TnpR is back off the DNA. Drag it onto a red res site.')}
        onDrop={({zone}) => {
          if (zone === 'off') { act({kind: 'drag-off', target: 'tnpR'}); return; }
          setResAt(zone === 'res-1' ? 1 : 0);
          act({kind: 'drop', target: 'tnpR'});
        }}>{tnprBody}</Draggable>
    </g>}

    {/* Resolved: two circles, one Tn3 each */}
    {stage === 5 && <g className="ts-pop">
      {L.RES.map(([x, y, r], i) => <g key={i}>
        <text className="ts-caption" x={x} y={y + L.resCap} textAnchor="middle">{i ? 'TARGET REPLICON' : 'DONOR REPLICON'}</text>
        {ring(i ? 'target' : 'donor', x, y, r)}
        {elementArc(x, y, r, i ? -10 : -30, i ? 30 : 10)}
        {i === 1 && <><path className="ts-arc ts-arc-tsd" d={arc(x, y, r, -16, -11)} filter={url(ids.shade)} /><path className="ts-arc ts-arc-tsd" d={arc(x, y, r, 31, 36)} filter={url(ids.shade)} /></>}
      </g>)}
      <text className="ts-note" x={L.note[0]} y={L.note[1]} textAnchor="middle">Circles may remain linked; unlinking is not modelled.</text>
    </g>}

    {handAt && <DemoHand show={demo.show} still={demo.still} from={handAt.from} to={handAt.to} text={handAt.text} labelAt={handAt.labelAt} />}
  </>;
}
