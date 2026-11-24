import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressRepository, replayProgress, OP_PREFIX} from '../progressRepository.js';
import {lessonById} from '../curriculum/lessons.js';

function memory() {
  const values = new Map();
  return {values, get length() { return values.size; }, key: i => [...values.keys()][i] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)};
}
const storedOps = store => [...store.values.entries()].filter(([key]) => key.startsWith(OP_PREFIX)).map(([, value]) => JSON.parse(value));

test('replay matches the repository', () => {
  const store = memory();
  let n = 0;
  const repo = createProgressRepository({storage: () => store, events: null, makeId: () => `id-${++n}`});
  const intro = lessonById('introduction');
  repo.recordLesson('introduction', 'inspect', 0);
  repo.recordLesson('introduction', 'exercise', intro.exercise.correct);
  repo.recordLesson('tsd', 'inspect', 1);
  repo.resetLesson('tsd');
  repo.resetAttempts();
  const {progress, labs, attempts} = repo.getSnapshot();
  assert.deepEqual(replayProgress(storedOps(store)), {progress, labs, attempts});
});

test('order is by clock then id, not array order', () => {
  const state = replayProgress([
    {version: 1, id: 'b', clock: 5, type: 'resetLesson', lessonId: 'tsd'},
    {version: 1, id: 'a', clock: 3, type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 0},
  ]);
  assert.equal(state.progress.tsd, undefined);
});

test('invalid entries are skipped', () => {
  const state = replayProgress([{version: 2, id: 'x', clock: 1, type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 0}]);
  assert.deepEqual(state, {progress: {}, labs: {}, attempts: []});
});

test('replay does not mutate its inputs', () => {
  const ops = [{version: 1, id: 'a', clock: 1, type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 0}];
  const base = {progress: {}, labs: {}, attempts: []};
  const copy = structuredClone([ops, base]);
  replayProgress(ops, base);
  assert.deepEqual([ops, base], copy);
});
