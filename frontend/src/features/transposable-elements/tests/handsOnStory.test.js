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
  // Every story scene is on the kit now, so the old-markup focus rule is gone too.
  assert.doesNotMatch(story, /\[role=["']?button["']?\]:focus-visible/);
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

test('Laboratory: Tn5 and Tn3 each have one live region for scene feedback', async () => {
  const ssr = await startSsr();
  try {
    const Laboratory = (await ssr.load('/src/features/transposable-elements/Laboratory.jsx')).default;
    const tn5 = ssr.html(Laboratory, {}, {url: '/lab/transposable-elements?experiment=tn5'});
    assert.doesNotMatch(tn5, /<section class="sl-task" aria-live/);
    const tn3 = ssr.html(Laboratory, {}, {url: '/lab/transposable-elements?experiment=tn3'});
    assert.doesNotMatch(tn3, /<section class="sl-task" aria-live/);
  } finally { await ssr.close(); }
});

describe('Tn3 lab on the kit (SSR)', () => {
  let ssr, html, mod;
  before(async () => {
    ssr = await startSsr();
    const Laboratory = (await ssr.load('/src/features/transposable-elements/Laboratory.jsx')).default;
    html = ssr.html(Laboratory, {}, {url: '/lab/transposable-elements?experiment=tn3'});
    mod = await ssr.load('/src/features/transposable-elements/components/StoryScenes.jsx');
  });
  after(() => ssr.close());
  const buttonTexts = page => [...page.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));

  test('Tn3 lab has no action buttons under the scene', () => {
    for (const text of buttonTexts(html)) assert.doesNotMatch(text, /Join target here|Start replication|Tn3 copy (1|2)|Dock TnpR on res/);
    assert.doesNotMatch(html, /<input[^>]*type="range"/);
    assert.match(html, /Restart lab/);
    // Resolve is a commitment action and stays a real button at its step.
    const s = run(newStory('tn3'), [{type: 'dock-target', boundary: 200}, {type: 'answer', checkpoint: 'tn3', value: 1}, {type: 'replicate'},
      {type: 'inspect', feature: 'copy-1'}, {type: 'inspect', feature: 'copy-2'}]);
    assert.equal(s.stage, 4);
    const scene = ssr.html(mod.Tn3Scene, {s, dispatch() {}});
    for (const text of buttonTexts(scene)) assert.doesNotMatch(text, /Dock TnpR|Resolve/, 'no HTML buttons inside the scene');
  });

  test('Tn3 Resolve stays a button in the lab', async () => {
    const src = (await import('node:fs')).readFileSync(new URL('../Laboratory.jsx', import.meta.url), 'utf8');
    assert.match(src, /<button[^>]*onClick=\{\(\) => dispatch\(\{type: 'resolve'\}\)\}>Resolve/);
  });

  test('Tn3 scene targets are labelled', () => {
    assert.match(html, /role="button"[^>]*aria-label="Drag the target circle[^"]*"/);
    assert.match(html, /<svg[^>]*class="ho-svg"[^>]*role="group"[^>]*aria-label="[^"]*Tn3[^"]*"/);
    assert.match(html, /<div class="ho-next[^"]*" role="status" aria-live="polite"><\/div>/);
    const joined = run(newStory('tn3'), [{type: 'dock-target', boundary: 200}, {type: 'answer', checkpoint: 'tn3', value: 1}]);
    assert.equal(joined.stage, 2);
    const fork = ssr.html(mod.Tn3Scene, {s: joined, dispatch() {}});
    assert.match(fork, /role="button"[^>]*aria-label="Hold the replication fork[^"]*"/);
    assert.match(fork, /<svg[^>]*role="group"[^>]*aria-label="[^"]*site 200[^"]*"/, 'label follows the state');
    const co = run(joined, [{type: 'replicate'}]);
    const coHtml = ssr.html(mod.Tn3Scene, {s: co, dispatch() {}});
    assert.match(coHtml, /role="button"[^>]*aria-label="Inspect Tn3 copy 1[^"]*"/);
    assert.match(coHtml, /role="button"[^>]*aria-label="Inspect Tn3 copy 2[^"]*"/);
    assert.match(coHtml, /role="button"[^>]*aria-label="Drag TnpR onto a res site[^"]*"/);
  });

  test('Tn3 resolved scene keeps the linked-circles note', () => {
    const s = run(newStory('tn3'), [{type: 'dock-target', boundary: 200}, {type: 'answer', checkpoint: 'tn3', value: 1}, {type: 'replicate'},
      {type: 'inspect', feature: 'copy-1'}, {type: 'inspect', feature: 'copy-2'}, {type: 'answer', checkpoint: 'resolution', value: 2},
      {type: 'enzyme', available: true}, {type: 'resolve'}]);
    assert.equal(s.stage, 5);
    assert.match(ssr.html(mod.Tn3Scene, {s, dispatch() {}}), /Circles may remain linked; unlinking is not modelled\./);
  });

  test('Tn3 scene still renders the sandbox stage mapping', async () => {
    const {newBench} = await import('../freeBench.js');
    const bench = newBench('tn3');
    for (const stage of [0, 2, 4, 5]) assert.match(ssr.html(mod.Tn3Scene, {s: {...bench, inspected: [], answers: {}, stage}, dispatch() {}}), /class="ho-svg"/);
  });

  test('Tn3 task strings name the gestures', async () => {
    const {STORY} = await import('../storyLab.js');
    assert.match(STORY.tn3[0].task, /drag/i);
    assert.match(STORY.tn3[2].task, /hold/i);
    assert.match(STORY.tn3[3].task, /tap/i);
    assert.match(STORY.tn3[4].task, /drag/i);
    assert.doesNotMatch(STORY.tn3[0].task, /Tap a spot/);
  });
});

test('story-lab CSS keeps only rules something still uses', async () => {
  const {readFileSync} = await import('node:fs');
  const story = readFileSync(new URL('../components/storyLab.css', import.meta.url), 'utf8');
  for (const gone of ['.sl-scene', '.sl-ring-track', '.sl-res', '.sl-tnp', '.sl-or', '.is-target', '.sl-element-arc']) {
    assert.ok(!story.includes(gone + ' ') && !story.includes(gone + '{') && !story.includes(gone + ','), `${gone} removed`);
  }
  // Task 7: the sandbox's site slider is gone too, so nothing uses .sl-site any more.
  assert.doesNotMatch(story, /\.sl-site/, 'the sandbox has no site slider');
});

describe('Sandbox on the kit', () => {
  let ssr, Sandbox, sandboxAction, scenes, freeBench;
  before(async () => {
    ssr = await startSsr();
    ({default: Sandbox, sandboxAction} = await ssr.load('/src/features/transposable-elements/Sandbox.jsx'));
    scenes = await ssr.load('/src/features/transposable-elements/components/StoryScenes.jsx');
    freeBench = await import('../freeBench.js');
  });
  after(() => ssr.close());
  const buttonTexts = page => [...page.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));

  test('sandbox reaches every BENCH_GOAL by gestures', () => {
    const {newBench, BENCH_GOALS} = freeBench;
    const notebook = [];
    // A gesture goes through storyIntent (as the scene does); `resolve` is the page's Resolve button.
    const play = (scenario, steps, b = newBench(scenario)) => steps.reduce((bench, g) => {
      const action = g.type ? g : storyIntent(scenario, g);
      assert.ok(action, `gesture maps to an action: ${JSON.stringify(g)}`);
      const r = sandboxAction(bench, action);
      notebook.push(r.entry);
      return r.bench;
    }, b);
    const last = () => notebook.at(-1);

    let b = play('tn5', [swipe('end-left')]);
    assert.equal(last().ok, false);
    assert.match(last().text, /none is bound/);
    b = play('tn5', [hold('end-left'), hold('end-right'), swipe('end-left'), swipe('end-right'), {kind: 'drop', target: 'ring', angle: 120}], b);
    assert.equal(last().action, 'insert');
    assert.equal(last().ok, true);
    assert.equal(b.history.state.phase, 'inserted');
    assert.equal(b.boundary, boundaryFromAngle(120), 'the drop angle becomes the target site');
    play('tn5', [{kind: 'drop', target: 'ring', angle: 200}], b);
    assert.equal(last().ok, false);
    assert.match(last().text, /initial donor/);

    // Refused before the circles touch: the fork is there to hold anyway.
    play('tn3', [hold('fork')]);
    assert.equal(last().ok, false);
    assert.match(last().text, /not in contact/);
    let t = play('tn3', [{kind: 'drop', target: 'target-circle', angle: 270}, hold('fork'), {type: 'resolve'}]);
    assert.equal(last().ok, false);
    assert.match(last().text, /TnpR/);
    t = play('tn3', [{kind: 'drop', target: 'tnpR'}, {type: 'resolve'}], t);
    assert.equal(t.history.state.phase, 'resolved');

    for (const goal of BENCH_GOALS) assert.ok(goal.done(notebook), goal.id);
  });

  test('the tools row is gone; Fresh molecules and Clear notebook stay', async () => {
    const html = ssr.html(Sandbox, {}, {url: '/lab/transposable-elements/sandbox'});
    for (const text of buttonTexts(html)) assert.doesNotMatch(text, /Bind transposase ·|✂ Cut ·|Insert Tn5 →|Bring circles together|Replicate →|Dock TnpR/);
    assert.doesNotMatch(html, /<input[^>]*type="range"/);
    assert.doesNotMatch(html, /use the tools below/);
    assert.match(html, /Fresh molecules/);
    assert.match(html, /role="button"[^>]*aria-label="Left end of Tn5: press and hold to bind transposase/);
    const src = (await import('node:fs')).readFileSync(new URL('../Sandbox.jsx', import.meta.url), 'utf8');
    assert.match(src, /Clear notebook/);
    assert.match(src, /<Tn3Scene[^>]*\bfree\b/, 'Tn3 runs in free mode');
    assert.doesNotMatch(src, /sl-message/, 'the scene line is the one live region for scene feedback');
    assert.match(src, /useMemo/, 'the scene object is stable between unrelated renders');
    assert.match(src, /onClick=\{\(\) => dispatch\(\{type: 'resolve'\}\)\}>Resolve/, 'Resolve stays a real button');
  });

  test('free scenes carry the model message in their one live region', () => {
    const {newBench} = freeBench;
    const r = sandboxAction(newBench('tn5'), {type: 'cut', end: 'left'});
    const html = ssr.html(scenes.Tn5Scene, {s: {...r.bench, inspected: [], answers: {}, stage: 0}, dispatch() {}, free: true});
    assert.match(html, /role="status" aria-live="polite"><span>[^<]*<span class="ts-msg is-refused">✗ Nothing cuts the left end/);
    assert.equal(html.match(/aria-live/g).length, 1);
  });

  test('free Tn5: the inserted element stays draggable onto the ring', () => {
    const {newBench} = freeBench;
    let b = newBench('tn5');
    for (const a of [{type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}, {type: 'cut', end: 'left'}, {type: 'cut', end: 'right'}, {type: 'insert', angle: 90}]) b = sandboxAction(b, a).bench;
    const html = ssr.html(scenes.Tn5Scene, {s: {...b, inspected: [], answers: {}, stage: 3}, dispatch() {}, free: true});
    assert.match(html, /role="button"[^>]*aria-label="Tn5, inserted in the ring[^"]*"/);
    assert.match(html, /class="[^"]*ts-ring-track/);
    assert.match(html, /aria-label="Inspect the left purple repeat"/);
  });

  test('free Tn3: the fork is present before the circles touch', () => {
    const html = ssr.html(scenes.Tn3Scene, {s: {...freeBench.newBench('tn3'), inspected: [], answers: {}, stage: 0}, dispatch() {}, free: true});
    assert.match(html, /role="button"[^>]*aria-label="Hold the replication fork[^"]*"/);
    assert.match(html, /role="button"[^>]*aria-label="Drag the target circle[^"]*"/);
    assert.doesNotMatch(html, /ho-expected/, 'nothing is highlighted in free mode');
  });
});
