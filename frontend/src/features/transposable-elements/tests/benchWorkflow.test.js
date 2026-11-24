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
