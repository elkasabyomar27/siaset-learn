import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {benchStep, initialStep} from '../benchStep.js';

const evaluate = s => ({outcome: s.ok ? 'good' : 'bad'});

test('benchStep: reveal needs a prediction; changing a setting clears the old verdict', () => {
  let s = initialStep({ok: true});
  assert.deepEqual(s, {settings: {ok: true}, prediction: '', result: null});
  assert.equal(benchStep(s, {type: 'reveal', evaluate}), s, 'no prediction, no reveal');
  s = benchStep(s, {type: 'predict', value: 'good'});
  s = benchStep(s, {type: 'reveal', evaluate});
  assert.deepEqual(s.result, {outcome: 'good', correct: true});
  const changed = benchStep(s, {type: 'set', patch: {ok: false}});
  assert.deepEqual(changed, {settings: {ok: false}, prediction: '', result: null});
  const wrong = benchStep(benchStep(changed, {type: 'predict', value: 'good'}), {type: 'reveal', evaluate});
  assert.equal(wrong.result.correct, false);
  assert.equal(benchStep(wrong, {type: 'predict', value: 'bad'}).result, null, 'a new prediction hides the old result');
  assert.deepEqual(benchStep(wrong, {type: 'reset', settings: {ok: true}}), initialStep({ok: true}));
});

let server, mods = {};
before(async () => {
  server = await createServer({root: fileURLToPath(new URL('../../../../', import.meta.url)), server: {middlewareMode: true, hmr: false}, appType: 'custom', logLevel: 'error'});
  for (const name of ['Spectrophotometer', 'Thermocycler', 'GelBench', 'DigestBench', 'GelImage'])
    mods[name] = (await server.ssrLoadModule(`/src/features/transposable-elements/components/${name}.jsx`)).default;
});
after(async () => { await server?.close(); });

const html = (name, props = {}) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(mods[name], props)));

test('every bench opens with the hand-off card, predicts before it reveals, and says it is practice', () => {
  const handoff = {Spectrophotometer: /50 µL/, Thermocycler: /37\.5 ng\/µL/, GelBench: /850 bp/, DigestBench: /850 bp/};
  for (const [name, value] of Object.entries(handoff)) {
    const out = html(name);
    assert.match(out, /From the last station/, name);
    assert.match(out, value, name);
    assert.match(out, /Practice only; it doesn’t change lesson completion\./, name);
    assert.match(out, /<button[^>]*disabled=""[^>]*>(Reveal|Run the cycler|Run the gel|Digest and run)/, name);
    for (const svg of out.match(/<svg[^>]*>/g) || []) assert.match(svg, /role="img"[^>]*aria-label="[^"]+"|aria-label="[^"]+"[^>]*role="img"/, name);
  }
});

test('the thermocycler shows the cycle table and the plateau is labelled schematic', () => {
  const out = html('Thermocycler');
  assert.match(out, /about 1,100/);
  for (const n of ['2', '4', '8', '16', '32']) assert.match(out, new RegExp(`<td>${n}</td>`));
  assert.match(out, /schematic/i);
});

test('GelImage names every band in its label and drops bands that ran off', () => {
  const out = html('GelImage', {caption: 'test gel', lanes: [{id: 'ladder', label: 'Ladder', bands: [{bp: 100, pos: 1.2}, {bp: 800, pos: 0.4}]}, {id: 'product', label: 'PCR product', bands: [{bp: 850, pos: 0.38}]}]});
  assert.match(out, /aria-label="[^"]*PCR product: 850 bp[^"]*"/);
  assert.match(out, /100 bp ran off the gel/);
  assert.match(out, /aria-label="test gel\. Wells/);
  assert.match(html('GelImage', {caption: '1% gel.', lanes: []}), /aria-label="1% gel\. Wells/, 'one full stop, not two');
  assert.equal((out.match(/class="gel-band/g) || []).length, 2);
});

test('bench styles use tokens only and animate only without reduced motion', () => {
  const css = readFileSync(new URL('../components/benchWorkflow.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(css, /rgba?\(/);
  const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*?\n\}/g, '');
  assert.doesNotMatch(outside, /animation|transition/);
  assert.match(css, /min-height:\s*44px/);
  const sci = readFileSync(new URL('../../../scientific.css', import.meta.url), 'utf8');
  for (const v of ['--scientific-gel', '--scientific-band', '--scientific-ladder']) assert.match(sci, new RegExp(v));
});

test('the gel shows the electrode set-up the learner chose', () => {
  const lanes = [{id: 'ladder', label: 'Ladder', bands: []}];
  const reversed = html('GelImage', {caption: 'Gel.', lanes, polarity: 'wells-positive'});
  assert.match(reversed, /aria-label="Gel\. Wells at the positive electrode; DNA moves away from the wells, out of the gel\./);
  assert.match(html('GelImage', {caption: 'Gel.', lanes}), /Wells at the negative electrode; DNA runs toward the positive electrode/);
});

test('hand-off values are computed, and an early-stopped gel cannot be sized', async () => {
  for (const [file, literal] of [['Thermocycler', '1.83'], ['GelBench', '100–1,000']]) {
    const src = readFileSync(new URL(`../components/${file}.jsx`, import.meta.url), 'utf8');
    assert.ok(!src.includes(literal), `${file} types ${literal} instead of computing it`);
  }
  const {evaluateGel} = await server.ssrLoadModule('/src/features/transposable-elements/components/GelBench.jsx');
  assert.equal(evaluateGel({agarose: '1', polarity: 'wells-negative', run: 'short', ethanol: false}).outcome, 'none');
  assert.equal(evaluateGel({agarose: '1', polarity: 'wells-negative', run: 'right', ethanol: false}).outcome, '800-900');
  assert.match(html('Thermocycler'), /A260\/A280 1\.83/);
  assert.match(html('GelBench'), /100–1,000 bp/);
});
