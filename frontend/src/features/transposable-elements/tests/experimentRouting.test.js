import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentFromParams, selectExperiment} from '../experimentRouting.js';

test('experiment URL defaults and direct links are deterministic', () => {
  for (const query of ['', 'experiment=unknown', 'experiment=TN3', 'experiment=']) assert.equal(experimentFromParams(new URLSearchParams(query)), 'tn5');
  for (const id of ['tn5', 'tn3']) assert.equal(experimentFromParams(new URLSearchParams({experiment:id})), id);
});

test('switching preserves unrelated parameters and leaves the previous URL available for history', () => {
  const initial = new URLSearchParams('experiment=tn5&mode=guided&tag=a&tag=b');
  const next = selectExperiment(initial, 'tn3');
  assert.equal(experimentFromParams(next), 'tn3');
  assert.equal(experimentFromParams(initial), 'tn5');
  assert.deepEqual(next.getAll('tag'), ['a', 'b']);
  assert.equal(next.get('mode'), 'guided');
  assert.equal(experimentFromParams(new URLSearchParams(next.toString())), 'tn3');
});
