import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { HoldTarget } from '../hands-on/kit/HoldTarget.jsx';
import { SwipeTarget } from '../hands-on/kit/SwipeTarget.jsx';
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
function angleFromEvent(e, cx, cy) {
  const svg = e.currentTarget.ownerSVGElement, m = svg?.getScreenCTM();
  if (!m) return 0;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return (Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 450) % 360;
}
const press = fn => ({role: 'button', tabIndex: 0, onClick: fn, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }});

function RingTrack({ cx, cy, r, label, onPick }) {
  return <circle className="sl-ring-track" cx={cx} cy={cy} r={r} role="button" tabIndex={-1} aria-label={label} onClick={e => onPick(angleFromEvent(e, cx, cy))} />;
}

/* ---------------- Tn5: cut and paste, on the hands-on kit ---------------- */
// Two layouts of the same scene: wide (side by side) and narrow (stacked, for phones).
const WIDE = {W: 760, H: 340, DY: 120, DX: [40, 440], EL: [180, 300], RING: [590, 190, 92], tray: [70, 292], capD: [40, 44], capT: [530, 78], gap: 24, lift: 56};
const NARROW = {W: 420, H: 620, DY: 112, DX: [16, 404], EL: [140, 280], RING: [210, 440, 112], tray: [40, 236], capD: [16, 40], capT: [150, 298], gap: 20, lift: 52};
const NARROW_BELOW = 560; // container px under which the stacked layout is used
const END_W = 16, RING_ZONE = 48, ARC_HALF = 16, TSD_W = 6, SWIPE_REACH = 80;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Closed annular sector: a filled touch area along the ring between two angles.
function sector(cx, cy, r0, r1, a0, a1) {
  const [ox0, oy0] = polar(cx, cy, r1, a0), [ox1, oy1] = polar(cx, cy, r1, a1);
  const [ix1, iy1] = polar(cx, cy, r0, a1), [ix0, iy0] = polar(cx, cy, r0, a0), large = a1 - a0 > 180 ? 1 : 0;
  return `M ${ox0} ${oy0} A ${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${r0} ${r0} 0 ${large} 0 ${ix0} ${iy0} Z`;
}
const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
  const box = useRef(null);
  const [boxW, setBoxW] = useState(0);
  const [note, setNote] = useState(null); // {text, s}: a local announcement, shown only for the state it was made in
  const [ghost, setGhost] = useState(null);
  const [acted, setActed] = useState(false); // the live region stays empty until the first scene action
  const [demo, sendDemo] = useReducer(demoHand, undefined, () => initialDemo({reducedMotion: prefersReducedMotion()}));
  const focusIntent = useRef(false), keyHeld = useRef(false), pendingFocus = useRef(null);

  const {stage, bound, cut} = s, free = cut.length === 2, inserted = stage >= 2;
  const answered = s.answers.tn5 === checkpoints.tn5.correct;
  const L = boxW > 0 && boxW < NARROW_BELOW ? NARROW : WIDE;
  const say = text => setNote({text, s});

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
    window.addEventListener('keyup', up);
    return () => window.removeEventListener('keyup', up);
  }, [focusNow]);

  const nextEnd = side => !bound.includes(side);
  const nextFocus = inserted
    ? stage === 2 && !freeMode ? '.ts-inserted' : stage === 3 ? (s.inspected.includes('target-tsd-left') ? '.ts-tsd-right' : '.ts-tsd-left') : null
    : free ? '.ts-tn5'
      : stage === 0 ? (nextEnd('left') ? '.ts-end-left' : '.ts-end-right')
        : (cut.includes('left') ? '.ts-end-right' : '.ts-end-left');
  const flowKey = `${stage}|${bound.length}|${cut.length}|${s.inspected.length}`;
  useEffect(() => {
    if (!focusIntent.current) return;
    focusIntent.current = false;
    requestFocus(nextFocus);
  }, [flowKey, nextFocus, requestFocus]);

  // Every gesture goes to the model through storyIntent, refused or not.
  const act = gesture => {
    setActed(true);
    focusIntent.current = !!box.current?.contains(document.activeElement);
    const action = storyIntent('tn5', gesture);
    if (action) dispatch(action);
  };

  // Demo hand: which gesture the current step needs, and where.
  const [needKind, needKey] = freeMode ? [null, 'free']
    : stage === 0 ? ['hold', `hold-${nextEnd('left') ? 'left' : 'right'}`]
      : stage === 1 && free ? ['drag', 'drag']
        : stage === 1 && answered ? ['swipe', `swipe-${cut.includes('left') ? 'right' : 'left'}`]
          : stage === 2 ? ['tap', 'tap-inserted']
            : stage === 3 ? ['tap', `tap-${s.inspected.includes('target-tsd-left') ? 'right' : 'left'}`]
              : [null, `none-${stage}`];
  useEffect(() => { sendDemo({type: 'need', kind: needKind, t: performance.now()}); }, [needKind, needKey]);
  useEffect(() => {
    const id = setInterval(() => sendDemo({type: 'tick', t: performance.now()}), 1000);
    return () => clearInterval(id);
  }, []);
  const activity = () => sendDemo({type: 'activity', t: performance.now()});
  const onKeyDownCapture = e => { activity(); if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) keyHeld.current = true; };

  const message = !freeMode && s.message
    ? <span className={`ts-msg ${s.message.ok ? 'is-good' : 'is-refused'}`}>{s.message.ok ? '✓ ' : '✗ '}{s.message.text} </span> : null;
  const localNote = note && note.s === s ? note.text : null;
  const hint = stepHint(s, {freeMode, free, inserted, answered});
  const live = acted || localNote != null || message != null;
  const after = <div className="ts-next-row">
    {!live && <p className="ts-step-hint">{hint}</p>}
    <NextStep className={live ? undefined : 'is-empty'}>{live ? localNote ?? <span>{message}{hint}</span> : null}</NextStep>
    {stage === 2 && !freeMode && <button type="button" className="ts-continue" onClick={() => act({kind: 'tap', target: 'inserted'})}>Continue</button>}
  </div>;

  return <div ref={box} className="ts-scene" onPointerDownCapture={activity} onKeyDownCapture={onKeyDownCapture}>
    <BenchStage variant="molecular" width={L.W} height={L.H} label={sceneLabel(s, free, inserted)} after={after}>
      <Tn5Body s={s} L={L} freeMode={freeMode} free={free} inserted={inserted} answered={answered} act={act} say={say}
        ghost={ghost} setGhost={setGhost} demo={demo} sendDemo={sendDemo} requestFocus={requestFocus} />
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
    const holdable = freeMode ? !isBound : stage === 0;
    if (holdable) {
      return <HoldTarget key={`hold-${side}`} className={`ts-end-${side}`} cx={x} cy={DY} hitR={Math.min(26 * k, endHitMax)} ringR={24}
        label={isBound ? `${side === 'left' ? 'Left' : 'Right'} end of Tn5: transposase bound` : `Hold to bind transposase to the ${side} end of Tn5`}
        expected={!freeMode && !isBound} onHold={() => act({kind: 'hold', target: `end-${side}`})}>{tir(x, DY)}</HoldTarget>;
    }
    const expected = !freeMode && answered && !isCut, band = Math.min(34 * k, endHitMax - 14);
    return <SwipeTarget key={`swipe-${side}`} className={`ts-end-${side}`} line={{x1: x - 14, y1: DY, x2: x + 14, y2: DY}} band={band}
      label={isCut ? `${side === 'left' ? 'Left' : 'Right'} end of Tn5: cut` : `Cut the ${side} end of Tn5 (swipe down across it)`}
      expected={expected} onSwipe={() => act({kind: 'swipe', target: `end-${side}`})}>
      {/* Taller reach than the band: a downward stroke may start well above the DNA. */}
      <rect className="ts-swipe-reach" x={x - 14 - band} y={DY - SWIPE_REACH} width={28 + 2 * band} height={2 * SWIPE_REACH} />
      {tir(x, DY)}
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
    if (demo.kind === 'swipe') { const x = endX(cut.includes('left') ? 'right' : 'left'); return {from: {x, y: DY - 48}, to: {x, y: DY + 48}, text: 'Swipe down'}; }
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
      <Track className="ts-ring-track" cx={cx} cy={cy} r={r} value={80} ghostSpan={ARC_HALF} expected={!freeMode}
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

    {handAt && <DemoHand show={demo.show} still={demo.still} from={handAt.from} to={handAt.to} text={handAt.text} />}
  </>;
}

/* ---------------- Tn3: copy, join, separate ---------------- */
const DONOR3 = [220, 180, 82], TARGET3 = [545, 180, 82], CO = [385, 180, 118];
const COPY_SPAN = 34;

export function Tn3Scene({ s, dispatch }) {
  const {stage} = s, docked = stage >= 1, co = stage >= 3 && stage < 5, resolved = stage === 5;
  const shift = docked && !co && !resolved ? -158 : 0;
  const copyArc = (cx, cy, r, centre, id) => {
    const seen = s.inspected.includes(id), can = stage === 3 && !seen;
    return <path key={id} className={`sl-element-arc${can ? ' is-target' : ''}${seen ? ' is-done' : ''}`} d={arc(cx, cy, r, centre - COPY_SPAN / 2, centre + COPY_SPAN / 2)} {...(can ? press(() => dispatch({type: 'inspect', feature: id})) : {})} aria-label={can ? `Inspect Tn3 ${id === 'copy-1' ? 'copy 1' : 'copy 2'}` : undefined} />;
  };
  const res = (cx, cy, r, angle, i) => { const [x, y] = polar(cx, cy, r, angle), can = stage === 4;
    return <g key={i}><circle className={`sl-res${can ? ' is-target' : ''}`} cx={x} cy={y} r="7" {...(can ? press(() => dispatch({type: 'enzyme', available: !s.tnpR})) : {})} aria-label={can ? (s.tnpR ? 'Remove TnpR from res' : 'Dock TnpR on this res site') : undefined} />{stage === 4 && s.tnpR && <g className="sl-tnp sl-tnpr" style={{transform: `translate(${x}px, ${y - 24}px)`}}><circle r="12" /><text y="4" textAnchor="middle">R</text></g>}</g>; };
  return <svg className="sl-scene" viewBox="0 0 760 340" aria-label={resolved ? 'Two separate circles, donor and target, each with one Tn3; they may remain linked.' : co ? 'One large cointegrate circle containing both backbones and two Tn3 copies pointing the same way.' : docked ? 'Donor and target circles touch; Tn3 ends will be joined to the target.' : 'A donor circle carries one Tn3; a separate target circle has none.'}>
    {!co && !resolved && <>
      <text className="sl-caption" x={DONOR3[0] - 50} y="72">DONOR · CIRCULAR</text>
      <circle className="sl-backbone sl-donor" cx={DONOR3[0]} cy={DONOR3[1]} r={DONOR3[2]} fill="none" />
      <path className="sl-element-arc" d={arc(...DONOR3, 70, 120)} />{res(...DONOR3, 95, 'd')}
      <g style={{transform: `translateX(${shift}px)`}} className="sl-slide">
        <text className="sl-caption" x={TARGET3[0] - 50} y="72">TARGET · CIRCULAR</text>
        <circle className="sl-backbone sl-target" cx={TARGET3[0]} cy={TARGET3[1]} r={TARGET3[2]} fill="none" />
        {stage === 0 && <><circle className="sl-ring-glow" cx={TARGET3[0]} cy={TARGET3[1]} r={TARGET3[2]} /><RingTrack cx={TARGET3[0]} cy={TARGET3[1]} r={TARGET3[2]} label="Choose this target site" onPick={a => dispatch({type: 'dock-target', angle: a})} /><text className="sl-hint" x={TARGET3[0]} y={TARGET3[1] + 5} textAnchor="middle">tap the ring</text></>}
      </g>
      {docked && <path className="sl-transfer" d={`M ${polar(...DONOR3, 70)[0]} ${polar(...DONOR3, 70)[1]} Q 330 60 ${TARGET3[0] - 158 + 10} ${TARGET3[1] - TARGET3[2] + 8} M ${polar(...DONOR3, 120)[0]} ${polar(...DONOR3, 120)[1]} Q 330 300 ${TARGET3[0] - 158 + 10} ${TARGET3[1] + TARGET3[2] - 8}`} />}
    </>}
    {co && <g className="sl-pop">
      <text className="sl-caption" x={CO[0] - 70} y="44">COINTEGRATE · ONE CIRCLE</text>
      <path className="sl-backbone sl-donor" d={arc(...CO, 200, 340)} fill="none" />
      <path className="sl-backbone sl-target" d={arc(...CO, 20, 160)} fill="none" />
      {copyArc(...CO, 0, 'copy-1')}{copyArc(...CO, 180, 'copy-2')}
      {res(...CO, 0, 'r1')}{res(...CO, 180, 'r2')}
      {[20, 160].map(a => <path key={a} className="sl-tsd" d={arc(...CO, a === 20 ? 17 : 160, a === 20 ? 22 : 165)} />)}
      <text className="sl-note" x={CO[0]} y={CO[1] - 6} textAnchor="middle">donor backbone (left) + target backbone (right)</text>
      <text className="sl-note" x={CO[0]} y={CO[1] + 14} textAnchor="middle">two Tn3 copies, same direction</text>
    </g>}
    {resolved && <g className="sl-pop">
      <text className="sl-caption" x="200" y="62">DONOR REPLICON</text><text className="sl-caption" x="460" y="62">TARGET REPLICON</text>
      <circle className="sl-backbone sl-donor" cx="290" cy="185" r="88" fill="none" /><path className="sl-element-arc" d={arc(290, 185, 88, 330, 10)} />
      <circle className="sl-backbone sl-target" cx="470" cy="185" r="88" fill="none" /><path className="sl-element-arc" d={arc(470, 185, 88, 350, 30)} />
      <path className="sl-tsd" d={arc(470, 185, 88, 344, 349)} /><path className="sl-tsd" d={arc(470, 185, 88, 31, 36)} />
      <text className="sl-note" x="380" y="318" textAnchor="middle">Circles may remain linked; unlinking is not modelled.</text>
    </g>}
  </svg>;
}
