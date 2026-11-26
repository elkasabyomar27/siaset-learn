import test, {describe, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {SYSTEMS} from '../mobilityGates.js';
import {mobilityIntent, controlKind} from '../hands-on/intents/mobility.js';
import {kernelIntent} from '../hands-on/intents/kernel.js';
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

// @@MORE@@
