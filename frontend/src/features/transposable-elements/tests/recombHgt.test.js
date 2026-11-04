import test from 'node:test';
import assert from 'node:assert/strict';
import { recombine, eventFor, blockTally } from '../recombinationLab.js';
import { newHgt, act, setPrereq, applySelection, cargoLocations, HGT_GOALS } from '../hgtLab.js';

test('orientation and substrate choose the engine event', () => {
  assert.equal(eventFor('direct', 'intramolecular'), 'deletion');
  assert.equal(eventFor('inverted', 'intramolecular'), 'inversion');
  assert.equal(eventFor('direct', 'misaligned-sisters'), 'duplication');
  assert.equal(eventFor('inverted', 'misaligned-sisters'), null);
});

test('recombination products conserve material: nothing invented or lost', () => {
  const del = recombine({orientation: 'direct', substrate: 'intramolecular'});
  assert.deepEqual(del.products.map(p => p.topology), ['linear', 'circular']);
  assert.deepEqual(blockTally(del.products.map(p => p.blocks)), blockTally([del.before]));
  const inv = recombine({orientation: 'inverted', substrate: 'intramolecular'});
  assert.ok(inv.products[0].blocks.includes('←X'));
  assert.deepEqual(blockTally(inv.products.map(p => p.blocks)), blockTally([inv.before]));
  const dup = recombine({orientation: 'direct', substrate: 'misaligned-sisters'});
  // Two sisters in, two products out: one gains X, the other loses it.
  assert.deepEqual(blockTally(dup.products.map(p => p.blocks)), blockTally([dup.before, dup.before]));
  assert.equal(dup.products[0].blocks.filter(b => b.startsWith('X')).length, 2);
  assert.equal(dup.products[1].blocks.filter(b => b.startsWith('X')).length, 0);
  assert.equal(recombine({orientation: 'direct', substrate: 'intramolecular', homology: false}).ok, false);
  assert.equal(recombine({orientation: 'inverted', substrate: 'misaligned-sisters'}).ok, false);
});

test('HGT: transposition stays in the donor; conjugation needs a loaded plasmid and every prerequisite', () => {
  let lab = newHgt();
  let r = act(lab, 'conjugate');
  assert.equal(r.ok, false); assert.match(r.text, /Transpose first/);
  r = act(lab, 'transpose'); lab = r.lab;
  assert.equal(r.ok, true); assert.equal(cargoLocations(lab).recipient, null);
  const blocked = act(setPrereq(lab, 'oriT', false), 'conjugate');
  assert.equal(blocked.ok, false); assert.match(blocked.text, /origin of transfer/);
  r = act(lab, 'conjugate'); lab = r.lab;
  assert.equal(r.ok, true); assert.ok(cargoLocations(lab).recipient);
});

test('selection reports growth only and never moves DNA', () => {
  let lab = act(newHgt(), 'transpose').lab;
  const before = structuredClone(lab.bact);
  const sel = applySelection(lab, true);
  assert.deepEqual(sel.result, {donor: 'grows', recipient: 'inhibited'});
  assert.deepEqual(sel.lab.bact, before);
  lab = act(lab, 'conjugate').lab;
  assert.deepEqual(applySelection(lab, false).result, {donor: 'undetermined', recipient: 'undetermined'});
  const log = [...act(newHgt(), 'conjugate').lab.log, ...sel.lab.log, ...lab.log];
  assert.deepEqual(HGT_GOALS.filter(g => g.done(log)).map(g => g.id), ['transpose', 'transfer', 'blocked', 'select']);
});
