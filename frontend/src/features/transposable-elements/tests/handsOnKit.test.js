import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {demoHand, initialDemo} from '../hands-on/demoHand.js';
import {DEMO_IDLE_MS} from '../hands-on/gestures/index.js';

test('demo hand shows once per kind, again after 8 s idle, never while dragging, still under reduced motion', () => {
  let s = initialDemo();
  assert.equal(s.show, null);
  s = demoHand(s, {type: 'need', kind: 'drag', t: 0});
  assert.equal(s.show, 'drag', 'first need shows');
  assert.equal(s.still, false);
  s = demoHand(s, {type: 'activity', t: 100});
  assert.equal(s.show, null, 'activity hides it');
  s = demoHand(s, {type: 'need', kind: 'drag', t: 200});
  assert.equal(s.show, null, 'same kind is not shown twice straight away');
  s = demoHand(s, {type: 'tick', t: 100 + DEMO_IDLE_MS - 1});
  assert.equal(s.show, null, 'not yet idle long enough');
  s = demoHand(s, {type: 'tick', t: 100 + DEMO_IDLE_MS});
  assert.equal(s.show, 'drag', 'shows again after idle');
  s = demoHand(s, {type: 'drag', active: true});
  assert.equal(s.show, null, 'never while dragging');
  s = demoHand(s, {type: 'tick', t: 100 + 3 * DEMO_IDLE_MS});
  assert.equal(s.show, null, 'still hidden while dragging, however long');
  s = demoHand(s, {type: 'need', kind: 'hold', t: 100 + 3 * DEMO_IDLE_MS});
  assert.equal(s.show, null, 'a new kind waits for the drag to end');
  s = demoHand(s, {type: 'drag', active: false});
  assert.equal(s.dragging, false);
  assert.equal(s.show, 'hold', 'the deferred kind shows when the drag ends');
  const fresh = demoHand(initialDemo({reducedMotion: true}), {type: 'need', kind: 'swipe', t: 0});
  assert.equal(fresh.show, 'swipe');
  assert.equal(fresh.still, true, 'reduced motion renders a static arrow and text');
  assert.equal(demoHand(initialDemo(), {type: 'need', kind: 'x', t: 0}).seen.has('x'), true);
});

test('demo hand: still is false without reduced motion', () => {
  const s = demoHand(initialDemo(), {type: 'need', kind: 'drag', t: 0});
  assert.equal(s.still, false);
  assert.equal(initialDemo().still, false);
});

test('demo hand: a step change to a seen kind clears the old demo and resets the idle clock', () => {
  let s = initialDemo();
  s = demoHand(s, {type: 'need', kind: 'A', t: 0});
  s = demoHand(s, {type: 'activity', t: 10});
  s = demoHand(s, {type: 'need', kind: 'B', t: 20});
  s = demoHand(s, {type: 'activity', t: 30});
  s = demoHand(s, {type: 'tick', t: 30 + DEMO_IDLE_MS});
  assert.equal(s.show, 'B');
  s = demoHand(s, {type: 'need', kind: 'A', t: 9000});
  assert.equal(s.kind, 'A');
  assert.equal(s.show, null, 'B demo must not linger for step A');
  assert.equal(s.idleSince, 9000);
  s = demoHand(s, {type: 'tick', t: 9001});
  assert.equal(s.show, null, 'no immediate replay after a step change');
  s = demoHand(s, {type: 'tick', t: 9000 + DEMO_IDLE_MS});
  assert.equal(s.show, 'A');
});

test('handsOn.css follows the token and motion rules', () => {
  const css = readFileSync(new URL('../hands-on/kit/handsOn.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(css, /rgba?\(/);
  const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\n\}/g, '');
  assert.doesNotMatch(outside, /animation|transition/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /perspective\(700px\) rotateX\(52deg\)/);
});
