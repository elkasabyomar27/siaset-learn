import test from 'node:test';
import assert from 'node:assert/strict';
import { growKernel, describeKernel, excisionChance, GENERATIONS } from '../kernelModel.js';
import { laneStages, copyFeedback } from '../copyLedger.js';

test('no Ac means no excision and a colourless kernel, whatever the seed', () => {
  for (let seed = 1; seed < 20; seed++) {
    const k = growKernel({ac: false, seed});
    assert.equal(k.stats.spots, 0); assert.equal(k.stats.pigmentedFraction, 0);
    assert.equal(describeKernel(k, false).pattern, 'colourless');
  }
});

test('area is conserved and the same seed grows the same kernel', () => {
  const a = growKernel({ac: true, timing: 0.4, seed: 7}), b = growKernel({ac: true, timing: 0.4, seed: 7});
  assert.equal(a.stats.areaChecks, true);
  assert.deepEqual(a.sectors, b.sectors);
  assert.ok(a.sectors.every(s => s.gen >= 0 && s.gen < GENERATIONS));
});

test('earlier excision makes larger sectors on average than late excision', () => {
  const mean = timing => { let area = 0, n = 0; for (let seed = 1; seed <= 200; seed++) { const k = growKernel({ac: true, timing, seed}); if (k.stats.spots) { area += k.stats.meanSpotArea; n++; } } return area / n; };
  assert.ok(mean(0) > 4 * mean(1), `early ${mean(0)} vs late ${mean(1)}`);
  assert.ok(excisionChance(0, 0) > excisionChance(5, 0));
  assert.ok(excisionChance(5, 1) > excisionChance(0, 1));
});

test('both sector patterns are reachable with Ac', () => {
  const patterns = new Set();
  for (let seed = 1; seed <= 60; seed++) for (const t of [0, 1]) patterns.add(describeKernel(growKernel({ac: true, timing: t, seed}), true).pattern);
  assert.ok(patterns.has('large') && patterns.has('small'));
});

test('copy ledger uses the engine: Tn5 keeps one copy, Tn3 goes 1 → 2 → 2 across two molecules', () => {
  assert.deepEqual(laneStages('tn5').map(s => s.summary.copies), [1, 1]);
  const tn3 = laneStages('tn3');
  assert.deepEqual(tn3.map(s => s.summary.copies), [1, 2, 2]);
  assert.deepEqual(tn3.map(s => s.summary.structures), [2, 1, 2]);
  assert.equal(laneStages('tn5')[1].summary.tsdBp, 9);
  assert.equal(copyFeedback('tn3', 1, 2).correct, true);
  assert.match(copyFeedback('tn3', 2, 1).text, /both copies remain/);
  assert.throws(() => laneStages('tn7'));
});
