import test, {describe, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {SYSTEMS} from '../mobilityGates.js';
import {mobilityIntent, controlKind} from '../hands-on/intents/mobility.js';
import {kernelIntent} from '../hands-on/intents/kernel.js';
import {anatomyIntent} from '../hands-on/intents/anatomy.js';
import {ANATOMY_CASES, LABELS, correctBoundaries, transposaseDirection, checkDissection} from '../anatomyLab.js';
import {startSsr} from './helpers/ssr.js';

const COMP = n => `/src/features/transposable-elements/components/${n}.jsx`;
const buttons = html => [...html.matchAll(/<g[^>]*role="button"[^>]*aria-label="([^"]*)"/g)].map(m => m[1]);
const noControlRow = html => {
  assert.doesNotMatch(html, /type="range"/);
  assert.doesNotMatch(html, /<button[^>]*class="[^"]*outline-button/, 'no outline-button lab row outside commitments');
};

describe('MobilityGates', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('MobilityGates'))).default; html = ssr.html(C, {mode: 'intro'}); });
  after(() => ssr.close());

  test('MobilityGates: gestures reach every option', () => {
    for (const [sys, def] of Object.entries(SYSTEMS)) {
      for (const c of def.controls) {
        const kind = controlKind(c);
        if (c.type === 'choice') {
          for (const v of Object.keys(c.options)) assert.deepEqual(mobilityIntent({kind: 'drop', target: 'cell', control: c.key, option: v}, def.defaults), {[c.key]: v}, `${sys}.${c.key}=${v}`);
          assert.equal(mobilityIntent({kind: 'drop', target: 'tray', control: c.key, option: 'Ac'}, {}), null);
        } else if (kind === 'assumption') {
          for (const v of [true, false]) assert.deepEqual(mobilityIntent({kind: 'assume', control: c.key, value: v}), {[c.key]: v});
          assert.match(c.key, /^(permissive|assume)/);
        } else if (kind === 'switch') {
          for (const cur of [true, false]) assert.deepEqual(mobilityIntent({kind: 'tap', target: 'switch', control: c.key}, {[c.key]: cur}), {[c.key]: !cur});
        } else {
          assert.deepEqual(mobilityIntent({kind: 'drop', target: 'cell', control: c.key}, {}), {[c.key]: true});
          assert.deepEqual(mobilityIntent({kind: 'drop', target: 'tray', control: c.key}, {}), {[c.key]: false});
        }
      }
    }
    assert.equal(mobilityIntent(null), null);
    assert.equal(mobilityIntent({kind: 'swipe', control: 'x'}), null);
  });

  test('MobilityGates: the old toggle row is gone and the cell has labelled targets', () => {
    assert.doesNotMatch(html, /mg-toggle/);
    noControlRow(html.replace(/<div class="cb-control mg-systems"[\s\S]*?<\/div><\/div>/, ''));
    const labels = buttons(html);
    assert.ok(labels.some(l => /Ac \(intact transposase gene\)/.test(l)));
    assert.ok(labels.some(l => /Active Ac elsewhere supplies protein in trans/.test(l)));
    assert.match(html, /<legend>Assumptions<\/legend>/);
    assert.match(html, /Assume permissive host conditions/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Maize Ac\/Ds cell/);
    assert.match(html, /Practice only/);
  });
});

describe('KernelGrower', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('KernelGrower'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('KernelGrower: gestures reach every option', () => {
    assert.deepEqual(kernelIntent({kind: 'drop', target: 'genome'}), {ac: true});
    assert.deepEqual(kernelIntent({kind: 'drop', target: 'outside'}), {ac: false});
    // Every old slider value 0, 0.05 ... 1 is reachable from a position on the clock.
    for (let i = 0; i <= 20; i++) {
      const want = i / 20, deg = Math.min(359, Math.round(want * 360));
      assert.equal(kernelIntent({kind: 'track', value: deg}, {ac: true}).timing, want, `timing ${want}`);
    }
    assert.equal(kernelIntent({kind: 'track', value: 90}, {ac: false}), null, 'the old slider was disabled without Ac');
    assert.deepEqual(kernelIntent({kind: 'hold', target: 'kernel'}, {ac: true, prediction: 'large', growing: false}), {grow: true});
    assert.equal(kernelIntent({kind: 'hold', target: 'kernel'}, {ac: true, prediction: null}), null, 'no prediction: refused');
    assert.equal(kernelIntent({kind: 'hold', target: 'kernel'}, {prediction: 'large', growing: true}), null, 'still growing: refused');
  });

  test('KernelGrower: the checkbox, slider and grow button are gone; targets are labelled', () => {
    assert.doesNotMatch(html, /type="checkbox"/);
    assert.doesNotMatch(html, /<button[^>]*primary-button/);
    assert.doesNotMatch(html, /Grow the kernel/);
    const labels = buttons(html);
    assert.ok(labels.some(l => /^Ac element/.test(l)));
    assert.ok(labels.some(l => /^Excision timing/.test(l)));
    assert.ok(labels.some(l => /^Hold to grow the kernel/.test(l)));
    assert.match(html, /<fieldset class="tsd-predict">/, 'the prediction stays a question');
    assert.match(html, /role="img" aria-label="A colourless kernel, not grown yet\."/);
    assert.match(html, /Practice only/);
  });
});

describe('AnatomyLab', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('AnatomyLab'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('AnatomyLab: gestures reach every option', () => {
    for (const c of ANATOMY_CASES) {
      let w = {left: null, right: null, labels: {}, direction: null};
      const apply = g => { const p = anatomyIntent(g, w); assert.ok(p, JSON.stringify(g)); w = {...w, ...p}; return p; };
      // Every gap takes either bracket, as {left: g} / {right: g}.
      for (let g = 0; g <= c.segments.length; g++) for (const b of ['left', 'right']) assert.deepEqual(anatomyIntent({kind: 'drop', target: 'gap', index: g, bracket: b}, w), {[b]: g});
      // Every label on every segment, as the old per-label button wrote it.
      c.segments.forEach((_, i) => Object.keys(LABELS).forEach(tag => assert.deepEqual(anatomyIntent({kind: 'drop', target: 'segment', index: i, tag}, {labels: {}}), {labels: {[i]: tag}})));
      // A full correct dissection by gestures alone is graded as solved.
      const [L, R] = correctBoundaries(c);
      apply({kind: 'drop', target: 'gap', index: L, bracket: 'left'}); apply({kind: 'drop', target: 'gap', index: R, bracket: 'right'});
      c.segments.forEach((s, i) => apply({kind: 'drop', target: 'segment', index: i, tag: s.kind}));
      const want = transposaseDirection(c);
      for (let n = 0; n < 2 && w.direction !== want; n++) apply({kind: 'swipe', target: 'arrow'}); // a swipe flips the reading
      assert.equal(w.direction, want);
      assert.equal(checkDissection(c, w).allOk, true, c.id);
      // A wrong tag still reaches the model, which then marks it wrong.
      const wrong = anatomyIntent({kind: 'drop', target: 'segment', index: 0, tag: 'cargo'}, w).labels;
      assert.equal(checkDissection(c, {...w, labels: wrong}).labelResults[0], false);
    }
    assert.equal(anatomyIntent({kind: 'tap', target: 'segment', index: 3}).selected, 3);
    assert.equal(anatomyIntent({kind: 'drop', target: 'gap', index: 1, bracket: 'middle'}), null);
  });

  test('AnatomyLab: the label, gap and direction buttons are gone; targets are labelled', () => {
    assert.doesNotMatch(html, /class="al-gap/);
    assert.doesNotMatch(html, /class="al-labels"/);
    assert.doesNotMatch(html, /al-direction/);
    assert.doesNotMatch(html, /Rightward|Leftward/);
    const labels = buttons(html);
    assert.equal(labels.filter(l => /^Name tag:/.test(l)).length, Object.keys(LABELS).length);
    assert.equal(labels.filter(l => /^Segment \d/.test(l)).length, ANATOMY_CASES[0].segments.length);
    assert.ok(labels.some(l => /^Left bracket/.test(l)) && labels.some(l => /^Right bracket/.test(l)));
    assert.ok(labels.some(l => /^Transposase reading direction/.test(l)));
    assert.match(html, /Check my dissection/, 'Check stays a button');
    assert.match(html, /Practice only/);
  });
});

// @@MORE@@
