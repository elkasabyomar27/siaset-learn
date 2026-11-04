import test from 'node:test';
import assert from 'node:assert/strict';
import { newHistory, execute } from '../engine/index.js';
import { describeChange, outcomeSummary, friendlyError, INVESTIGATIONS, notebookEntry } from '../labInsights.js';

const tn5 = () => { const h = newHistory('tn5'); return [h.state, execute(h, {type: 'tn5.transpose', targetBoundary: 200}).state]; };
const tn3 = () => {
  const h0 = newHistory('tn3'), h1 = execute(h0, {type: 'tn3.replicate', targetBoundary: 200});
  return [h0.state, h1.state, execute(h1, {type: 'tn3.resolve', resolvaseAvailable: true}).state, h1];
};

test('Tn5 change: copy number conserved, element relocated, two host TSDs highlighted, donor left broken', () => {
  const [before, after] = tn5();
  const change = describeChange(before, after);
  assert.equal(change.headline, 'Tn5 moved into the target.');
  assert.match(change.items.find(i => i.kind === 'copies').text, /still 1.*moved; it was not copied/);
  assert.match(change.items.find(i => i.kind === 'tsd').text, /2 new host repeats \(9 bp each\)/);
  assert.ok(change.items.some(i => i.kind === 'donor'));
  assert.ok(change.highlight.target.includes('target-tsd-left') && change.highlight.target.includes('target-tsd-right'));
  assert.ok(change.highlight.target.includes('copy-1'));
  // Nothing in the unchanged backbone or element sub-sites is flagged.
  assert.ok(Object.values(change.highlight).flat().every(id => !id.includes(':') && !id.includes('backbone')));
});

test('Tn3 changes: cointegrate doubles copies; resolution keeps two copies in two molecules', () => {
  const [initial, cointegrate, resolved] = tn3();
  const fuse = describeChange(initial, cointegrate);
  assert.match(fuse.items.find(i => i.kind === 'copies').text, /1 → 2.*original was kept/);
  assert.match(fuse.items.find(i => i.kind === 'structures').text, /2 → 1/);
  assert.match(fuse.items.find(i => i.kind === 'tsd').text, /5 bp each/);
  const resolve = describeChange(cointegrate, resolved);
  assert.equal(resolve.headline, 'The cointegrate was resolved into two molecules.');
  assert.match(resolve.items.find(i => i.kind === 'copies').text, /still 2/);
  assert.match(resolve.items.find(i => i.kind === 'structures').text, /1 → 2/);
  assert.deepEqual(outcomeSummary(resolved).topologies, ['circular', 'circular']);
});

test('summaries never mutate engine states', () => {
  const [before, after] = tn5(), a = structuredClone(before), b = structuredClone(after);
  describeChange(before, after); outcomeSummary(after);
  assert.deepEqual(before, a); assert.deepEqual(after, b);
});

test('rejections are explained without codes, and investigations track the notebook', () => {
  const [, , , cointegrateHistory] = tn3();
  let rejection;
  try { execute(cointegrateHistory, {type: 'tn3.resolve', resolvaseAvailable: false}); } catch (e) { rejection = e; }
  assert.ok(rejection); assert.match(friendlyError(rejection), /TnpR resolvase is not available/); assert.doesNotMatch(friendlyError(rejection), /TNPR:/);
  const [t5a, t5b] = tn5(), [t3a, t3b, t3c] = tn3();
  const log = [
    notebookEntry({scenario: 'tn5', action: 'tn5.transpose', boundary: 895, before: t5a, after: t5b, prediction: 0, predictionCorrect: true}),
    notebookEntry({scenario: 'tn3', action: 'tn3.replicate', boundary: 200, before: t3a, after: t3b, prediction: 0, predictionCorrect: false}),
    notebookEntry({scenario: 'tn3', action: 'tn3.resolve', boundary: 200, tnpR: false, before: t3b, error: rejection}),
    notebookEntry({scenario: 'tn3', action: 'tn3.resolve', boundary: 200, tnpR: true, before: t3b, after: t3c}),
  ];
  assert.equal(log[2].ok, false); assert.equal(log[2].outcome.phase, 'cointegrate'); assert.equal(log[3].boundary, null);
  assert.deepEqual(INVESTIGATIONS.filter(i => i.done(log)).map(i => i.id), ['tn5-move', 'tn3-fuse', 'no-tnpr', 'resolve', 'origin', 'compare']);
  assert.deepEqual(INVESTIGATIONS.filter(i => i.done([])).map(i => i.id), []);
});
