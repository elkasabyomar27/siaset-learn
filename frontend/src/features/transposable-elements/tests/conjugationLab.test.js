import test from 'node:test';
import assert from 'node:assert/strict';
import { F_STEPS, fStatus, pickDonor, mixedCulture, integrateF, transferredGenes, transferredFraction, HFR_STOPS, CJ_QUIZ, CJ_GOALS, newProgress, record, matingUnlocked } from '../conjugationLab.js';

test('F+ x F- ends with both cells F+', () => {
  assert.equal(F_STEPS.length, 6);
  assert.deepEqual(fStatus(0), {donor: 'F+', recipient: 'F-'});
  assert.deepEqual(fStatus(3), {donor: 'F+', recipient: 'F-'});
  assert.deepEqual(fStatus(4), {donor: 'F+', recipient: 'F+'});
  assert.deepEqual(fStatus(5), {donor: 'F+', recipient: 'F+'});
  assert.deepEqual(F_STEPS.map(s => s.recipient), ['none', 'none', 'single', 'double', 'circular', 'circular']);
});

test('only a cell with a pilus can be the donor', () => {
  assert.equal(pickDonor('F+').ok, true);
  assert.equal(pickDonor('F-').ok, false);
});

test('mixed culture spreads F+ without inventing cells', () => {
  const c = mixedCulture({total: 48, start: 3});
  assert.equal(c[0], 3);
  assert.ok(c.every((n, i) => i === 0 || n >= c[i - 1]));
  assert.ok(c.every(n => n <= 48));
  assert.ok(c.at(-1) > 40);
  assert.deepEqual(mixedCulture({total: 48, start: 0}).every(n => n === 0), true);
});

test('Hfr formation needs a shared IS element', () => {
  assert.equal(integrateF(true).hfr, true);
  assert.equal(integrateF(false).hfr, false);
  assert.match(integrateF(true).text, /not transposition/);
});

test('interrupted mating transfers genes in order, only partly', () => {
  assert.deepEqual(transferredGenes(0), []);
  const sets = HFR_STOPS.map(transferredGenes);
  assert.ok(sets.every((s, i) => i === 0 || s.length >= sets[i - 1].length));
  assert.ok(sets.at(-1).length > sets[0].length);
  assert.ok(transferredFraction(25) < 1);
  assert.equal(transferredFraction(1000), 1);
});

test('quiz answers are in range and goals read progress', () => {
  for (const q of CJ_QUIZ) assert.ok(q.correct >= 0 && q.correct < q.options.length);
  const p = {maxStep: 5, triedF: true, hfr: true, stops: [10, 17, 25]};
  assert.ok(CJ_GOALS.every(g => g.done(p)));
  assert.ok(CJ_GOALS.every(g => !g.done({maxStep: 0, triedF: false, hfr: false, stops: []})));
});

test('interrupted mating is locked until F has integrated', () => {
  assert.equal(matingUnlocked(null), false);
  assert.equal(matingUnlocked(integrateF(false)), false);
  assert.equal(matingUnlocked(integrateF(true)), true);
});

test('goal progress records each event once and never goes backwards', () => {
  let p = newProgress();
  p = record(p, {type: 'step', step: 3}); p = record(p, {type: 'step', step: 1});
  assert.equal(p.maxStep, 3);
  for (const m of [10, 17, 17, 99, 25]) p = record(p, {type: 'stop', minutes: m});
  assert.deepEqual(p.stops, [10, 17, 25]);
  assert.equal(CJ_GOALS.find(g => g.id === 'interrupt').done(p), true);
  assert.equal(CJ_GOALS.find(g => g.id === 'integrate').done(p), false);
  p = record(p, {type: 'hfr'});
  assert.equal(CJ_GOALS.find(g => g.id === 'integrate').done(p), true);
});
