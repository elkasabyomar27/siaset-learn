import test, {describe, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement, Fragment} from 'react';
import {demoHand, initialDemo} from '../hands-on/demoHand.js';
import {DEMO_IDLE_MS, startTrack, stepTrack} from '../hands-on/gestures/index.js';
import {keyName} from '../hands-on/useGesture.js';
import {startSsr} from './helpers/ssr.js';

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

// ---------- Task 3: kit components (SSR) and the track recognizer ----------
const KIT = '/src/features/transposable-elements/hands-on/kit/';
const attr = (tag, name) => Number((tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1]);
const hitTags = html => html.match(/<(?:circle|rect)\b[^>]*class="[^"]*\bho-hit\b[^"]*"[^>]*>/g) || [];

test('track: pointer maps with angleAt, arrows preview (Shift = big step), Enter confirms, Escape clears', () => {
  let s = startTrack({cx: 0, cy: 0, value: 90});
  assert.equal(s.preview, null);
  s = stepTrack(s, {type: 'key-down', key: 'ArrowRight', t: 0});
  assert.equal(s.preview, 100);
  s = stepTrack(s, {type: 'key-down', key: 'Shift+ArrowLeft', t: 1});
  assert.equal(s.preview, 55);
  s = stepTrack(s, {type: 'key-down', key: 'Escape', t: 2});
  assert.equal(s.preview, null);
  assert.equal(s.done, null);
  s = stepTrack(s, {type: 'key-down', key: 'ArrowLeft', t: 3});
  s = stepTrack(s, {type: 'key-down', key: 'Enter', t: 4});
  assert.deepEqual(s.done, {value: 80, via: 'key'});
  assert.equal(stepTrack(s, {type: 'key-down', key: 'ArrowRight', t: 5}), s, 'done is sticky');
  let p = startTrack({cx: 0, cy: 0, value: 0});
  p = stepTrack(p, {type: 'down', x: 10, y: 0, t: 0});
  assert.equal(p.preview, 90);
  p = stepTrack(p, {type: 'move', x: 0, y: 10, t: 1});
  assert.equal(p.preview, 180);
  p = stepTrack(p, {type: 'up', x: 0, y: 10, t: 2});
  assert.deepEqual(p.done, {value: 180, via: 'pointer'});
  let c = stepTrack(startTrack({cx: 0, cy: 0, value: 0}), {type: 'down', x: 10, y: 0, t: 0});
  c = stepTrack(c, {type: 'cancel', t: 1});
  assert.equal(c.preview, null);
  assert.equal(c.done, null);
  assert.equal(stepTrack(startTrack({value: 30}), {type: 'key-down', key: 'Enter', t: 0}).done.value, 30, 'Enter with no preview confirms the current value');
});

test('useGesture keyName folds Shift into the key the recognizers expect', () => {
  assert.equal(keyName({key: 'Tab', shiftKey: true}), 'Shift+Tab');
  assert.equal(keyName({key: 'ArrowLeft', shiftKey: true}), 'Shift+ArrowLeft');
  assert.equal(keyName({key: 'Enter', shiftKey: false}), 'Enter');
  assert.equal(keyName({key: ' ', shiftKey: true}), ' ', 'Space stays Space');
  assert.equal(keyName({key: 'Shift', shiftKey: true}), 'Shift');
});

describe('kit components (SSR)', () => {
  let ssr;
  before(async () => { ssr = await startSsr(); });
  after(() => ssr.close());
  const load = async name => (await ssr.load(`${KIT}${name}.jsx`))[name];

  test('kit targets are labelled focusable buttons with 44 px hit areas', async () => {
    const cases = [
      ['HoldTarget', {label: 'Bind transposase to the left end', onHold() {}}],
      ['HoldTarget', {label: 'Small hold', hitR: 8, onHold() {}}],
      ['SwipeTarget', {label: 'Cut the left end', line: {x1: 0, y1: 0, x2: 0, y2: 30}, onSwipe() {}}],
      ['SwipeTarget', {label: 'Flip', line: {x1: 0, y1: 0, x2: 5, y2: 0}, band: 4, onSwipe() {}}],
      ['Draggable', {label: 'Pick up the Tn5 complex', zones: [], onDrop() {}}],
      ['Track', {label: 'Choose the insertion point on the target ring', cx: 0, cy: 0, r: 90, value: 0, onConfirm() {}}],
    ];
    for (const [name, props] of cases) {
      const html = ssr.html(await load(name), props);
      assert.match(html, /role="button"/, `${name} role`);
      assert.match(html, /tabindex="0"/, `${name} tabindex`);
      assert.ok(html.includes(`aria-label="${props.label}"`), `${name} aria-label`);
      const hits = hitTags(html);
      assert.ok(hits.length >= 1, `${name} has a hit element`);
      for (const tag of hits) {
        const ok = tag.startsWith('<circle') ? attr(tag, 'r') >= 22 : attr(tag, 'width') >= 44 && attr(tag, 'height') >= 44;
        assert.ok(ok, `${name} hit area is at least 44 px: ${tag}`);
      }
    }
  });

  test('expected targets carry the pulse class; others do not', async () => {
    const HoldTarget = await load('HoldTarget');
    assert.match(ssr.html(HoldTarget, {label: 'a', onHold() {}, expected: true}), /ho-expected/);
    assert.doesNotMatch(ssr.html(HoldTarget, {label: 'a', onHold() {}}), /ho-expected/);
    const SwipeTarget = await load('SwipeTarget');
    assert.match(ssr.html(SwipeTarget, {label: 'a', line: {x1: 0, y1: 0, x2: 0, y2: 30}, onSwipe() {}, expected: true}), /ho-expected/);
  });

  test('NextStep renders an empty live region before any message', async () => {
    const NextStep = await load('NextStep');
    assert.equal(ssr.html(NextStep, {}), '<div class="ho-next" role="status" aria-live="polite"></div>');
    assert.match(ssr.html(NextStep, {children: 'Hold the left end'}), /role="status" aria-live="polite">Hold the left end<\/div>/);
  });

  test('HandsOnDefs gradients on flat shapes use userSpaceOnUse', async () => {
    const HandsOnDefs = await load('HandsOnDefs');
    const html = ssr.html(HandsOnDefs, {idPrefix: 'sc1'});
    const linear = html.match(/<linearGradient\b[^>]*>/g) || [];
    const filters = html.match(/<filter\b[^>]*>/g) || [];
    assert.ok(linear.length >= 4, 'a tube gradient per DNA kind');
    assert.ok(filters.length >= 3, 'tube shading, contact and lift filters');
    for (const tag of linear) assert.match(tag, /gradientUnits="userSpaceOnUse"/, tag);
    for (const tag of filters) assert.match(tag, /filterUnits="userSpaceOnUse"/, tag);
    for (const kind of ['donor', 'target', 'element', 'tsd']) {
      assert.ok(html.includes(`id="sc1-tube-${kind}"`), `tube gradient for ${kind}`);
      assert.ok(html.includes(`var(--scientific-${kind})`), `${kind} colour comes from its token`);
    }
    for (const id of ['sc1-enzyme', 'sc1-tube-shade', 'sc1-contact', 'sc1-lift']) assert.ok(html.includes(`id="${id}"`), id);
    assert.doesNotMatch(html, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'tokens only');
  });

  test('BenchStage: both variants, labelled, scalable, and two stages never share ids', async () => {
    const BenchStage = await load('BenchStage');
    const one = ssr.html(BenchStage, {variant: 'molecular', width: 760, height: 340, label: 'Tn5 scene'});
    assert.match(one, /class="ho-stage ho-molecular"/);
    assert.match(one, /viewBox="0 0 760 340"/);
    assert.match(one, /width="100%"/);
    assert.match(one, /aria-label="Tn5 scene"/);
    const bench = ssr.html(BenchStage, {variant: 'bench', width: 600, height: 300, label: 'Bench'});
    assert.match(bench, /ho-bench/);
    assert.match(bench, /ho-floor/);
    const Two = () => createElement(Fragment, null,
      createElement(BenchStage, {width: 10, height: 10, label: 'a'}),
      createElement(BenchStage, {width: 10, height: 10, label: 'b'}));
    const ids = [...ssr.html(Two).matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    assert.ok(ids.length > 0);
    assert.equal(new Set(ids).size, ids.length, 'ids are unique across stages');
    for (const id of ids) assert.match(id, /^[A-Za-z][\w-]*$/, 'ids are safe inside url(#...)');
  });

  test('DemoHand: hidden without show, static arrow and text when still, aria-hidden', async () => {
    const DemoHand = await load('DemoHand');
    assert.equal(ssr.html(DemoHand, {show: null, from: {x: 0, y: 0}, to: {x: 50, y: 0}}), '');
    const still = ssr.html(DemoHand, {show: 'drag', still: true, from: {x: 0, y: 0}, to: {x: 50, y: 0}});
    assert.match(still, /aria-hidden="true"/);
    assert.match(still, /data-moving="false"/);
    assert.match(still, /ho-hand-arrow/);
    assert.match(still, /Drag/);
    const moving = ssr.html(DemoHand, {show: 'hold', still: false, from: {x: 0, y: 0}, to: {x: 0, y: 0}});
    assert.match(moving, /data-moving="true"/);
    assert.doesNotMatch(moving, /ho-hand-arrow/);
  });
});
