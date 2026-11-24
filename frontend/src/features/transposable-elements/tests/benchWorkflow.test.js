import test from 'node:test';
import assert from 'node:assert/strict';
import references from '../profiles/references.json' with { type: 'json' };

const BENCH_REFS = ['qiagen-spectro', 'saiki1988', 'sigma-pcr', 'duewer2018', 'lee2012', 'neb-ecori', 'neb-hindiii', 'neb-bamhi'];

test('new bench references exist and are verified', () => {
  for (const id of BENCH_REFS) {
    const ref = references.find(r => r.id === id);
    assert.ok(ref, id);
    for (const key of ['citation', 'url', 'support', 'verification', 'verifiedOn']) assert.ok(ref[key], `${id}: ${key}`);
    assert.match(ref.url, /^https:\/\//, id);
    assert.equal(ref.verifiedOn, '2026-11-24', id);
  }
});

import * as bench from '../benchWorkflow.js';

test('quantify reads the worked sample from station 18', () => {
  const {a260, a280, a230} = bench.SAMPLE.readings;
  assert.deepEqual(bench.quantify({a260, a280, a230, volumeUl: bench.SAMPLE.volumeUl}), {concentration: 37.5, yieldNg: 1875, r280: 1.83, r230: 1.97, flags: []});
});

test('each quantification card gets its expected verdict', () => {
  assert.deepEqual(bench.QUANT_SAMPLES.map(c => c.verdict), ['pure', 'protein', 'rna', 'low230']);
  for (const card of bench.QUANT_SAMPLES) assert.equal(bench.verdictFor(bench.quantify({...card, volumeUl: 50})), card.verdict, card.id);
  assert.deepEqual(bench.QUANT_SAMPLES.map(c => bench.quantify({...c, volumeUl: 50}).r280), [1.83, 1.60, 2.05, 1.83]);
  assert.equal(bench.quantify({...bench.QUANT_SAMPLES[3], volumeUl: 50}).r230, 1.25);
});

test('purity flag thresholds are exact', () => {
  const flags = (a280, a230 = 2) => bench.quantify({a260: 1, a280: 1 / a280, a230: 1 / a230, volumeUl: 1}).flags;
  assert.deepEqual(flags(1.69), ['protein']);
  assert.deepEqual(flags(1.70), []);
  assert.deepEqual(flags(1.95), ['rna']);
  assert.deepEqual(flags(1.94), []);
  assert.deepEqual(flags(1.8, 1.79), ['low230']);
  assert.deepEqual(flags(1.8, 1.80), []);
});

test('the template carries about 1,100 genome copies into PCR', () => {
  assert.equal(bench.DS_DNA_NG_PER_UL_PER_A260, 50);
  assert.equal(bench.templateCopies(), 1136);
  assert.equal(bench.SAMPLE.ampliconBp, 850);
  assert.deepEqual(bench.SAMPLE.ladder, [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
});

test('quantify rejects impossible readings', () => {
  for (const bad of [{a280: 0}, {a230: -1}, {volumeUl: 0}]) assert.throws(() => bench.quantify({a260: 0.75, a280: 0.41, a230: 0.38, volumeUl: 50, ...bad}));
});

test('PCR outcomes follow the gates', () => {
  const run = patch => bench.runPcr({...bench.PCR.defaults, ...patch});
  assert.equal(run({}).outcome, 'single');
  assert.deepEqual(run({}).bands, [{bp: 850, intensity: 'strong', schematic: false}]);
  for (const [patch, outcome] of [[{primers: 'away'}, 'none'], [{primers: 'same'}, 'none'], [{anneal: 72}, 'none'], [{polymerase: 'mesophile'}, 'none'], [{anneal: 45}, 'extra'], [{cycles: 10}, 'weak'], [{cycles: 40}, 'single']])
    assert.equal(run(patch).outcome, outcome, JSON.stringify(patch));
  assert.deepEqual(run({}).gates.map(g => g.state), run({}).gates.map(() => 'open'));
  assert.equal(run({cycles: 40}).gates.find(g => g.id === 'cycles').state, 'restricted');
  assert.deepEqual(run({anneal: 45}).bands.map(b => [b.bp, b.schematic]), [[1300, true], [850, false], [420, true]]);
  assert.deepEqual(run({cycles: 10}).bands, [{bp: 850, intensity: 'faint', schematic: false}]);
  assert.deepEqual(run({primers: 'away'}).bands, []);
  for (const key of ['single', 'none', 'extra', 'weak']) assert.ok(bench.PCR_OUTCOMES[key].label, key);
});

test('PCR copy counts double per cycle; the exact-length product appears at cycle 3', () => {
  assert.deepEqual([1, 2, 3, 4].map(bench.exactLengthDuplexes), [0, 0, 2, 8]);
  assert.deepEqual(bench.pcrTable(5).map(r => r.total), [2, 4, 8, 16, 32]);
  assert.deepEqual(bench.pcrTable(5).map(r => r.cycle), [1, 2, 3, 4, 5]);
  assert.equal(bench.idealCopies(1100, 10), 1126400);
});

test('gel migration is log-linear and the product falls between 800 and 900', () => {
  const sizes = [...bench.SAMPLE.ladder, 850].sort((a, b) => a - b);
  for (const agarose of ['0.7', '1', '2']) for (const run of ['short', 'right']) {
    const pos = sizes.map(s => bench.migrate(s, agarose, run));
    for (let i = 1; i < pos.length; i++) assert.ok(pos[i] < pos[i - 1], `${agarose}/${run}`);
  }
  const at = s => bench.migrate(s, '1', 'right');
  assert.ok(at(900) < at(850) && at(850) < at(800));
  assert.equal(bench.estimateSize(at(850), '1', 'right'), 850);
  assert.deepEqual(bench.bracket(850), [800, 900]);
  assert.equal(Math.round(Math.sqrt(800 * 900)), 849);
  assert.ok(bench.migrate(100, '0.7', 'right') > 1, '100 bp runs off a 0.7% gel');
  assert.ok(bench.migrate(850, '2', 'right') < at(850), 'a 2% gel holds 850 bp back');
});

test('gel outcomes', () => {
  const run = (patch, opts) => bench.runGel({...bench.GEL.defaults, ...patch}, opts);
  assert.equal(run({}).outcome, 'resolved');
  const reversed = run({polarity: 'wells-positive'});
  assert.equal(reversed.outcome, 'ranOut');
  assert.ok(reversed.lanes.every(l => l.bands.length === 0));
  assert.equal(run({run: 'short'}).outcome, 'unseparated');
  assert.equal(run({}, {ethanolLane: true}).outcome, 'floats');
  const lanes = run({}).lanes;
  assert.deepEqual(lanes.map(l => l.id), ['ladder', 'product', 'ntc']);
  assert.deepEqual(lanes[1].bands.map(b => b.bp), [850]);
  assert.deepEqual(lanes[2].bands, []);
  const eth = run({}, {ethanolLane: true}).lanes.find(l => l.id === 'ethanol');
  assert.ok(eth.floats && eth.bands.length === 0);
  for (const key of ['resolved', 'ranOut', 'floats', 'unseparated']) assert.ok(bench.GEL_OUTCOMES[key].label, key);
});
