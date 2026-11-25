import test, {describe, before, after} from 'node:test';
import assert from 'node:assert/strict';
import { newStory, storyAction, isComplete, boundaryFromAngle } from '../storyLab.js';
import { validLabEvidence } from '../learnerRecords.js';
import { storyIntent } from '../hands-on/intents/story.js';
import { startSsr } from './helpers/ssr.js';

const evidence = s => ({scenario: s.scenario, stage: s.stage, answers: s.answers, events: s.history.events.slice(0, s.history.cursor)});
const run = (s, actions) => actions.reduce(storyAction, s);
const toAction = (scenario, g) => {
  const a = g.type === 'answer' ? g : storyIntent(scenario, g);
  return a && a.angle !== undefined ? {...a, boundary: boundaryFromAngle(a.angle)} : a;
};
const replay = (scenario, steps) => steps.reduce((s, g) => storyAction(s, toAction(scenario, g)), newStory(scenario));
const hold = target => ({kind: 'hold', target}), swipe = target => ({kind: 'swipe', target}), tap = target => ({kind: 'tap', target});

test('Tn5 gestures replay to the same evidence as the button path', () => {
  const s = replay('tn5', [
    hold('end-left'), hold('end-right'), {type: 'answer', checkpoint: 'tn5', value: 0},
    swipe('end-left'), swipe('end-right'),
    {kind: 'drop', target: 'ring', angle: 55}, tap('inserted'), tap('target-tsd-left'), tap('target-tsd-right'),
  ]);
  assert.ok(isComplete(s));
  assert.equal(s.history.events.length, 1);
  assert.equal(validLabEvidence(evidence(s)), true);
  const literal = run(newStory('tn5'), [
    {type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}, {type: 'answer', checkpoint: 'tn5', value: 0},
    {type: 'cut', end: 'left'}, {type: 'cut', end: 'right'}, {type: 'insert', angle: 55, boundary: boundaryFromAngle(55)},
    {type: 'continue'}, {type: 'inspect', feature: 'target-tsd-left'}, {type: 'inspect', feature: 'target-tsd-right'},
  ]);
  assert.deepEqual(s, literal);
});

test('Tn3 gestures replay to resolved, valid evidence', () => {
  let s = replay('tn3', [
    {kind: 'drop', target: 'target-circle', angle: 80}, {type: 'answer', checkpoint: 'tn3', value: 1},
    hold('fork'), tap('copy-1'), tap('copy-2'), {type: 'answer', checkpoint: 'resolution', value: 2},
  ]);
  s = storyAction(s, {type: 'resolve'});
  assert.match(s.message.text, /TnpR/);
  s = storyAction(s, storyIntent('tn3', {kind: 'drop', target: 'tnpR'}));
  s = storyAction(s, storyIntent('tn3', {kind: 'drag-off', target: 'tnpR'}));
  s = storyAction(s, {type: 'resolve'});
  assert.match(s.message.text, /TnpR/);
  s = run(s, [storyIntent('tn3', {kind: 'drop', target: 'tnpR'}), {type: 'resolve'}]);
  assert.ok(isComplete(s));
  assert.equal(s.history.state.phase, 'resolved');
  assert.equal(validLabEvidence(evidence(s)), true);
});

test('premature gestures still reach the model; meaningless ones map to null', () => {
  const act = storyIntent('tn5', swipe('end-left'));
  assert.deepEqual(act, {type: 'cut', end: 'left'});
  const bound = run(newStory('tn5'), [{type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}]);
  assert.match(storyAction(bound, act).message.text, /correct prediction/);
  assert.equal(storyIntent('tn5', tap('ring')), null);
  assert.equal(storyIntent('tn3', swipe('fork')), null);
  assert.equal(storyIntent('nope', hold('fork')), null);
});

test('storyIntent ignores inherited gesture kinds', () => {
  for (const kind of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    assert.equal(storyIntent('tn5', {kind, target: 'end-left'}), null, kind);
    assert.equal(storyIntent('tn3', {kind, target: 'fork'}), null, kind);
  }
});

test('STORY task text names the gestures', async () => {
  const {STORY} = await import('../storyLab.js');
  assert.match(STORY.tn5[0].task, /hold/i);
  assert.match(STORY.tn5[1].task, /swipe/i);
  assert.match(STORY.tn5[1].task, /drag/i);
  assert.match(STORY.tn5[3].task, /tap/i);
  for (const step of STORY.tn5) assert.doesNotMatch(step.task, /Tap both ends/);
});

test('story-lab CSS: no global focus override; new scene CSS uses tokens and gated motion', async () => {
  const {readFileSync} = await import('node:fs');
  const story = readFileSync(new URL('../components/storyLab.css', import.meta.url), 'utf8');
  // A bare [role=button]:focus-visible rule gave kit targets a second focus indicator.
  assert.doesNotMatch(story, /(^|[},])\s*\[role=["']?button["']?\]:focus-visible/m);
  assert.match(story, /\.sl-scene \[role=button\]:focus-visible/, 'old-markup scenes keep a focus indicator');
  const scenes = readFileSync(new URL('../components/storyScenes.css', import.meta.url), 'utf8');
  assert.doesNotMatch(scenes, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'tokens only');
  const outside = scenes.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*$/, '');
  assert.doesNotMatch(outside, /animation\s*:|transition\s*:/, 'motion only inside the no-preference block');
});

describe('Tn5 lab on the kit (SSR)', () => {
  let ssr, html;
  before(async () => {
    ssr = await startSsr();
    const Laboratory = (await ssr.load('/src/features/transposable-elements/Laboratory.jsx')).default;
    html = ssr.html(Laboratory, {}, {url: '/lab/transposable-elements?experiment=tn5'});
  });
  after(() => ssr.close());

  test('Tn5 lab has no action buttons under the scene', () => {
    const buttons = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
    assert.ok(buttons.length > 0, 'page still has its commitment buttons');
    for (const text of buttons) {
      assert.doesNotMatch(text, /Bind (left|right) end|Cut (left|right) end|Insert Tn5 here|Inspect the insertion|(Left|Right) repeat/);
    }
    assert.doesNotMatch(html, /<input[^>]*type="range"/);
    assert.match(html, /Restart lab/);
  });

  test('Tn5 scene targets are labelled', () => {
    assert.match(html, /role="button"[^>]*aria-label="Hold to bind transposase to the left end[^"]*"/);
    assert.match(html, /role="button"[^>]*aria-label="Hold to bind transposase to the right end[^"]*"/);
  });

  test('Tn5 scene keeps a live region and an SVG label', () => {
    assert.match(html, /<div class="ho-next[^"]*" role="status" aria-live="polite"><\/div>/);
    // R7: the scene SVG holds interactive targets, so it is a labelled group, not an img.
    assert.match(html, /<svg[^>]*class="ho-svg"[^>]*role="group"[^>]*aria-label="[^"]*Tn5[^"]*"/);
  });
});

describe('Tn5 scene in free mode (SSR)', () => {
  let ssr, mod;
  before(async () => { ssr = await startSsr(); mod = await ssr.load('/src/features/transposable-elements/components/StoryScenes.jsx'); });
  after(() => ssr.close());

  test('an unbound end can be cut in free mode; the model refuses it', async () => {
    const {newBench, benchAction} = await import('../freeBench.js');
    const bench = newBench('tn5');
    const html = ssr.html(mod.Tn5Scene, {s: {...bench, inspected: [], answers: {}, stage: 0}, dispatch() {}, free: true});
    for (const side of ['Left', 'Right']) {
      assert.match(html, new RegExp(`role="button"[^>]*aria-label="${side} end of Tn5: press and hold to bind transposase, or swipe down across it to cut[.] Keyboard: hold Enter to bind, press Enter to cut"`));
    }
    const cut = storyIntent('tn5', {kind: 'swipe', target: 'end-left'});
    assert.deepEqual(cut, {type: 'cut', end: 'left'});
    const r = benchAction(bench, cut);
    assert.equal(r.entry.ok, false);
    assert.match(r.bench.message.text, /none is bound/);
  });

  test('ring touch band is 44 css px at any scale, capped short of the centre hint', () => {
    for (const scale of [1, 0.73, 0.6, 0.45]) assert.ok(Math.abs(mod.ringTrackHit(1 / scale, 92) * scale - 44) < 1e-9 || mod.ringTrackHit(1 / scale, 92) === 2 * (92 - 40));
    assert.equal(mod.ringTrackHit(1 / 0.73, 92) * 0.73, 44);
    assert.equal(mod.ringTrackHit(4, 92), 104, 'cap: the band never reaches the centre hint');
  });
});

test('Laboratory: Tn5 has one live region for scene feedback', async () => {
  const ssr = await startSsr();
  try {
    const Laboratory = (await ssr.load('/src/features/transposable-elements/Laboratory.jsx')).default;
    const tn5 = ssr.html(Laboratory, {}, {url: '/lab/transposable-elements?experiment=tn5'});
    assert.doesNotMatch(tn5, /<section class="sl-task" aria-live/);
    const tn3 = ssr.html(Laboratory, {}, {url: '/lab/transposable-elements?experiment=tn3'});
    assert.match(tn3, /<section class="sl-task" aria-live="polite"/);
  } finally { await ssr.close(); }
});
