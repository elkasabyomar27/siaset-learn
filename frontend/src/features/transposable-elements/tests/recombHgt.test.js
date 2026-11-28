import test from 'node:test';
import assert from 'node:assert/strict';
import { recombine, eventFor, blockTally } from '../recombinationLab.js';

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
