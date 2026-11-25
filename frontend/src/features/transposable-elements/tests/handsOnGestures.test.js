import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOLD_MS, TAP_SLOP, TAP_MS, SWIPE_BAND, DEMO_IDLE_MS,
  startHold, stepHold, startSwipe, stepSwipe, startDrag, stepDrag,
  trackStep, angleAt, startPour, stepPour, nearestMark, startDial, stepDial,
} from '../hands-on/gestures/index.js';

const run = (step, s, events) => events.reduce(step, s);
const ticks = (from, to, every = 50) => { const out = []; for (let t = from + every; t <= to; t += every) out.push({ type: 'tick', t }); return out; };

test('gesture constants are exported verbatim', () => {
  assert.deepEqual([HOLD_MS, TAP_SLOP, TAP_MS, SWIPE_BAND, DEMO_IDLE_MS], [700, 10, 350, 34, 8000]);
});

test('hold completes after 700 ms of ticks', () => {
  let s = startHold({});
  s = stepHold(s, { type: 'down', x: 0, y: 0, t: 0 });
  assert.equal(s.phase, 'holding');
  s = run(stepHold, s, ticks(0, 350));
  assert.ok(s.progress > 0.49 && s.progress < 0.51);
  s = run(stepHold, s, ticks(350, 700));
  assert.equal(s.phase, 'done');
  assert.ok(s.done);
});

test('hold up at 699 ms cancels', () => {
  let s = run(stepHold, startHold({}), [{ type: 'down', x: 0, y: 0, t: 0 }, { type: 'tick', t: 699 }, { type: 'up', x: 0, y: 0, t: 699 }]);
  assert.equal(s.phase, 'cancelled');
  assert.equal(s.done, null);
});

test('hold cancel event cancels', () => {
  const s = run(stepHold, startHold({}), [{ type: 'down', x: 0, y: 0, t: 0 }, { type: 'cancel', t: 100 }]);
  assert.equal(s.phase, 'cancelled');
  assert.equal(s.done, null);
});

test('hold via Enter key completes at 700 ms', () => {
  const s = run(stepHold, startHold({}), [{ type: 'key-down', key: 'Enter', t: 0 }, ...ticks(0, 700)]);
  assert.equal(s.phase, 'done');
  assert.ok(s.done);
});

test('hold fires once per press', () => {
  const s = run(stepHold, startHold({}), [{ type: 'down', x: 0, y: 0, t: 0 }, ...ticks(0, 700)]);
  const first = s.done;
  const later = run(stepHold, s, ticks(700, 2000));
  assert.equal(later.done, first);
  assert.equal(later.phase, 'done');
});

const seg = { x1: 170, y1: 120, x2: 206, y2: 120 };
const path = (...pts) => pts.map(([x, y], i) => ({ type: i ? 'move' : 'down', x, y, t: i * 20 }));

test('swipe: vertical stroke through the segment completes', () => {
  const s = run(stepSwipe, startSwipe({ line: seg }), path([188, 60], [188, 100], [188, 180]));
  assert.deepEqual(s.done, { via: 'pointer' });
});

test('swipe: stroke at x=250 (beyond segment plus band) does not complete', () => {
  const s = run(stepSwipe, startSwipe({ line: seg }), [...path([250, 60], [250, 100], [250, 180]), { type: 'up', x: 250, y: 180, t: 99 }]);
  assert.equal(s.done, null);
});

test('swipe: crossing within band past the end completes, beyond band does not', () => {
  assert.ok(run(stepSwipe, startSwipe({ line: seg }), path([230, 60], [230, 180])).done);
  assert.equal(run(stepSwipe, startSwipe({ line: seg }), path([241, 60], [241, 180])).done, null);
});

test('swipe: stroke along the segment does not complete', () => {
  assert.equal(run(stepSwipe, startSwipe({ line: seg }), path([150, 130], [188, 130], [230, 130])).done, null);
  assert.equal(run(stepSwipe, startSwipe({ line: seg }), path([150, 120], [188, 120], [230, 120])).done, null);
});

test('swipe: non-crossing stroke on one side does not complete', () => {
  assert.equal(run(stepSwipe, startSwipe({ line: seg }), path([188, 60], [188, 110], [200, 90])).done, null);
});

test('swipe: cancel mid-path cancels', () => {
  const c = run(stepSwipe, startSwipe({ line: seg }), [...path([188, 60], [188, 90]), { type: 'cancel', t: 50 }]);
  assert.equal(c.phase, 'cancelled');
  assert.equal(c.done, null);
});

test('swipe Enter key completes via key', () => {
  const s = stepSwipe(startSwipe({ line: seg }), { type: 'key-down', key: 'Enter', t: 0 });
  assert.deepEqual(s.done, { via: 'key' });
});

test('hold: key auto-repeat after done does not re-arm or fire again', () => {
  let s = run(stepHold, startHold({}), [{ type: 'key-down', key: 'Enter', t: 0 }, ...ticks(0, 700)]);
  const first = s.done;
  s = run(stepHold, s, [{ type: 'key-down', key: 'Enter', t: 750 }, { type: 'key-down', key: 'Enter', t: 800 }, ...ticks(800, 2000)]);
  assert.equal(s.done, first);
  assert.equal(s.phase, 'done');
  s = run(stepHold, s, [{ type: 'key-up', key: 'Enter', t: 2100 }, { type: 'key-down', key: 'Enter', t: 2200 }]);
  assert.equal(s.phase, 'holding');
  assert.equal(s.done, null);
});

test('hold: pointer up does not abort a key hold; trackStep ignores unknown keys', () => {
  const s = run(stepHold, startHold({}), [{ type: 'key-down', key: 'Enter', t: 0 }, { type: 'up', x: 0, y: 0, t: 10 }]);
  assert.equal(s.phase, 'holding');
  assert.equal(trackStep(40, undefined), 40);
  assert.equal(trackStep(40, 'Tab'), 40);
});

test('pour: cancel keeps the poured value, emits no done, and the next down resumes', () => {
  let s = run(stepPour, startPour({ marks, rate: 0.5 }), [{ type: 'down', x: 0, y: 0, t: 0 }, ...ticks(0, 1000), { type: 'cancel', t: 1000 }]);
  assert.equal(s.phase, 'cancelled');
  assert.equal(s.done, null);
  assert.ok(Math.abs(s.value - 0.5) < 1e-9);
  s = run(stepPour, s, [{ type: 'down', x: 0, y: 0, t: 5000 }, ...ticks(5000, 5400), { type: 'up', x: 0, y: 0, t: 5400 }]);
  assert.ok(Math.abs(s.value - 0.7) < 1e-9);
  assert.equal(s.done.mark, 0.7);
});

test('dial: cancel mid-turn cancels without done', () => {
  const s = run(stepDial, startDial({ center: { x: 0, y: 0 }, threshold: Math.PI }), [
    { type: 'down', x: 1, y: 0, t: 0 }, { type: 'move', x: 0, y: 1, t: 10 }, { type: 'cancel', t: 20 }]);
  assert.equal(s.phase, 'cancelled');
  assert.equal(s.done, null);
});

const ring = { id: 'ring', contains: (x, y) => Math.hypot(x - 100, y - 100) <= 30 };
const box = { id: 'box', contains: x => x > 200 };

test('drag pointer drop inside zone completes', () => {
  const s = run(stepDrag, startDrag({ zones: [ring] }), [
    { type: 'down', x: 10, y: 10, t: 0 }, { type: 'move', x: 100, y: 100, t: 10 }, { type: 'up', x: 100, y: 100, t: 20 }]);
  assert.equal(s.done.zone, 'ring');
  assert.equal(s.phase, 'dropped');
});

test('drag drop outside cancels; cancel event cancels', () => {
  const out = run(stepDrag, startDrag({ zones: [ring] }), [{ type: 'down', x: 10, y: 10, t: 0 }, { type: 'up', x: 10, y: 10, t: 20 }]);
  assert.equal(out.phase, 'cancelled');
  assert.equal(out.done, null);
  const c = run(stepDrag, startDrag({ zones: [ring] }), [{ type: 'down', x: 10, y: 10, t: 0 }, { type: 'cancel', t: 5 }]);
  assert.equal(c.phase, 'cancelled');
});

const key = k => ({ type: 'key-down', key: k, t: 0 });

test('drag keyboard Enter, ArrowRight, Enter picks second zone', () => {
  const a = { id: 'a', contains: () => false }, b = { id: 'b', contains: () => false };
  const s = run(stepDrag, startDrag({ zones: [a, b] }), [key('Enter'), key('ArrowRight'), key('Enter')]);
  assert.equal(s.done.zone, 'b');
  assert.equal(s.done.via, 'key');
});

test('drag keyboard Escape while carrying cancels; Shift+Tab goes back', () => {
  const s = run(stepDrag, startDrag({ zones: [ring, box] }), [key('Enter'), key('Escape')]);
  assert.equal(s.phase, 'cancelled');
  const back = run(stepDrag, startDrag({ zones: [ring, box] }), [key('Enter'), key('Tab'), key('Shift+Tab')]);
  assert.equal(back.zoneIndex, 0);
});

test('keyboard drag with zero zones', () => {
  let s = stepDrag(startDrag({ zones: [] }), key('Enter'));
  assert.equal(s.phase, 'carrying');
  assert.equal(s.zoneIndex, -1);
  s = stepDrag(s, key('Enter'));
  assert.equal(s.done, null);
  s = stepDrag(s, key('Escape'));
  assert.equal(s.phase, 'cancelled');
  assert.equal(s.done, null);
});

test('drag pointer and keyboard parity onto ring', () => {
  const ptr = run(stepDrag, startDrag({ zones: [box, ring] }), [{ type: 'down', x: 0, y: 0, t: 0 }, { type: 'up', x: 100, y: 100, t: 5 }]);
  const kbd = run(stepDrag, startDrag({ zones: [box, ring] }), [key('Enter'), key('ArrowRight'), key('Enter')]);
  assert.equal(ptr.done.zone, 'ring');
  assert.equal(kbd.done.zone, 'ring');
});

test('trackStep and angleAt', () => {
  assert.equal(trackStep(355, 'ArrowRight'), 5);
  assert.equal(trackStep(0, 'Shift+ArrowLeft'), 315);
  assert.equal(trackStep(0, 'ArrowLeft', { wrap: false }), 0);
  assert.equal(trackStep(7, 'x'), 7);
  assert.equal(angleAt(50, 40, 50, 50), 0);
  assert.equal(angleAt(60, 50, 50, 50), 90);
  assert.equal(angleAt(50, 60, 50, 50), 180);
  assert.equal(angleAt(40, 50, 50, 50), 270);
});

const marks = [0.2, 0.7, 1, 2.5];

test('pour: hold 1.4 s at 0.5/s then release lands on 0.7', () => {
  const s = run(stepPour, startPour({ marks, rate: 0.5 }), [{ type: 'down', x: 0, y: 0, t: 0 }, ...ticks(0, 1400), { type: 'up', x: 0, y: 0, t: 1400 }]);
  assert.equal(s.done.mark, 0.7);
});

test('nearestMark ties go to the lower mark', () => {
  assert.equal(nearestMark(0.45, marks), 0.2);
  assert.equal(nearestMark(2, marks), 2.5);
});

test('pour keyboard: ArrowUp twice then Enter', () => {
  const s = run(stepPour, startPour({ marks, rate: 0.5 }), [key('ArrowUp'), key('ArrowUp')]);
  assert.equal(s.value, 0.7);
  assert.equal(stepPour(s, key('Enter')).done.mark, 0.7);
});

test('dial: angular travel reaches threshold', () => {
  const center = { x: 0, y: 0 };
  const pts = []; for (let i = 0; i <= 16; i++) { const a = i * 0.1 * Math.PI; pts.push({ type: i ? 'move' : 'down', x: Math.cos(a), y: Math.sin(a), t: i * 10 }); }
  const s = run(stepDial, startDial({ center, threshold: 1.6 * Math.PI }), pts);
  assert.ok(s.done);
  const short = run(stepDial, startDial({ center, threshold: 1.6 * Math.PI }), pts.slice(0, 10));
  assert.equal(short.done, null);
});

test('dial detents: ArrowRight then Enter', () => {
  const s = run(stepDial, startDial({ center: { x: 0, y: 0 }, detents: [45, 55, 72] }), [key('ArrowRight'), key('Enter')]);
  assert.equal(s.done.value, 55);
  assert.equal(s.detent, 1);
});
