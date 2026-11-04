import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressRepository, OP_PREFIX} from '../progressRepository.js';
import {STORAGE_KEY, isComplete} from '../lessonProgress.js';
import {LAB_KEY, ASSESSMENT_KEY, recordLab, appendAttempt} from '../learnerRecords.js';
import {lessons} from '../curriculum/lessons.js';
import {questions} from '../assessment.js';
import {newSandbox, runSandbox} from '../sandboxSession.js';

function environment() {
  const values = new Map(), targets = [];
  let denyRead = false, denyWrite = false, beforeWrite;
  const storage = {
    get length() { if (denyRead) throw Error('read'); return values.size; },
    key(i) { return [...values.keys()][i] ?? null; },
    getItem(key) { if (denyRead) throw Error('read'); return values.get(key) ?? null; },
    setItem(key, value) {
      if (denyWrite) throw Error('quota');
      const callback = beforeWrite; beforeWrite = undefined; callback?.();
      values.set(key, value);
    },
  };
  function tab(name) {
    const handlers = new Map(); targets.push(handlers);
    const events = {
      addEventListener(type, fn) { handlers.set(type, fn); },
      removeEventListener(type) { handlers.delete(type); },
    };
    let sequence = 0;
    return createProgressRepository({storage: () => storage, events, makeId: () => `${name}-${++sequence}`});
  }
  return {values, storage, tab,
    readFailure(value) { denyRead = value; }, writeFailure(value) { denyWrite = value; },
    beforeWrite(fn) { beforeWrite = fn; },
    emit(type, event = {}) { for (const handlers of targets) handlers.get(type)?.(event); },
  };
}
const correct = Object.fromEntries(questions.map(q => [q.id, q.correct]));

test('v1 records load without rewriting and completion rules are preserved', () => {
  const env = environment();
  const progress = Object.fromEntries(lessons.map(l => [l.id, {inspected: l.variants.map((_, i) => i), exercise: l.exercise.correct, check: l.check.correct, ...(l.check2 ? {check2: l.check2.correct} : {})}]));
  const raw = JSON.stringify({version: 1, records: progress}); env.values.set(STORAGE_KEY, raw);
  const repo = env.tab('a');
  assert.deepEqual(repo.getSnapshot().progress, progress);
  for (const lesson of lessons) assert.equal(isComplete(lesson.id, repo.getSnapshot().progress[lesson.id]), true);
  repo.recordLesson('introduction', 'exercise', 0);
  assert.equal(isComplete('introduction', repo.getSnapshot().progress.introduction), false);
  assert.equal(env.values.get(STORAGE_KEY), raw);
});

test('interleaved writes after both tabs read cannot overwrite independent operations', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  a.getSnapshot(); b.getSnapshot();
  env.beforeWrite(() => b.recordLesson('bacterial-hgt', 'inspect', 0));
  a.recordLesson('introduction', 'inspect', 1);
  const fresh = env.tab('fresh').getSnapshot();
  assert.deepEqual(fresh.progress.introduction.inspected, [1]);
  assert.deepEqual(fresh.progress['bacterial-hgt'].inspected, [0]);
  assert.equal([...env.values.keys()].filter(k => k.startsWith(OP_PREFIX)).length, 2);
});

test('different lessons completed from initially stale tabs both survive a fresh load', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  a.getSnapshot(); b.getSnapshot();
  function complete(repo, lesson) {
    for (let i = 0; i < lesson.variants.length; i++) repo.recordLesson(lesson.id, 'inspect', i);
    for (const kind of ['exercise', 'check', 'check2']) if (lesson[kind]) repo.recordLesson(lesson.id, kind, lesson[kind].correct);
  }
  env.beforeWrite(() => complete(b, lessons[1]));
  complete(a, lessons[0]);
  const snapshot = env.tab('reload').getSnapshot();
  for (const lesson of lessons.slice(0, 2)) assert.equal(isComplete(lesson.id, snapshot.progress[lesson.id]), true);
});

test('same-tab notifications, storage events, cleanup and cached snapshot identity', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  let notifications = 0; const unsubscribe = b.subscribe(() => notifications++);
  const first = b.getSnapshot(); assert.equal(b.getSnapshot(), first);
  a.recordLesson('introduction', 'check', 1);
  env.emit('storage', {key: [...env.values.keys()][0]});
  assert.equal(b.getSnapshot().progress.introduction.check, 1);
  const count = notifications; b.recordLesson('introduction', 'inspect', 0);
  assert.ok(notifications > count);
  const stable = b.getSnapshot(); env.emit('storage', {key: null}); assert.equal(b.getSnapshot(), stable);
  unsubscribe(); a.recordLesson('introduction', 'check', 0); env.emit('storage', {key: null});
  assert.equal(b.getSnapshot(), stable);
  b.subscribe(() => {}); assert.equal(b.getSnapshot().progress.introduction.check, 0);
});

test('inspection unions, current answers and scoped resets replay deterministically', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  a.recordLesson('introduction', 'inspect', 0); b.recordLesson('introduction', 'inspect', 1);
  a.recordLesson('introduction', 'inspect', 0); b.recordLesson('introduction', 'exercise', 1);
  a.recordLesson('introduction', 'exercise', 0);
  assert.deepEqual(a.getSnapshot().progress.introduction, {inspected: [0,1], exercise: 0});
  const entry = [...env.values.entries()][0]; env.values.set(...entry); // Same stable ID is idempotent.
  b.recordLesson('bacterial-hgt', 'inspect', 0); a.resetLesson('introduction');
  assert.equal(a.getSnapshot().progress.introduction, undefined);
  assert.deepEqual(a.getSnapshot().progress['bacterial-hgt'].inspected, [0]);
  b.recordLesson('introduction', 'check', 1);
  a.refresh(); assert.deepEqual(a.getSnapshot().progress.introduction, {check: 1});
});

test('concurrent conflicting answers converge by clock then operation ID', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  env.beforeWrite(() => b.recordLesson('introduction', 'exercise', 0));
  a.recordLesson('introduction', 'exercise', 1);
  a.refresh(); b.refresh();
  assert.deepEqual(a.getSnapshot(), b.getSnapshot());
  assert.equal(a.getSnapshot().progress.introduction.exercise, 0);
});

test('read and write failures retain app memory, retry merges unseen saved work', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  env.writeFailure(true);
  assert.equal(a.recordLesson('introduction', 'inspect', 0), false);
  assert.equal(a.getSnapshot().status, 'temporary');
  const unsubscribe = a.subscribe(() => {}); unsubscribe(); // Navigation unmount.
  a.subscribe(() => {}); assert.deepEqual(a.getSnapshot().progress.introduction.inspected, [0]);
  env.writeFailure(false); b.recordLesson('bacterial-hgt', 'inspect', 0);
  assert.equal(a.retry(), true); assert.equal(a.getSnapshot().status, 'saved');
  assert.deepEqual(a.getSnapshot().progress['bacterial-hgt'].inspected, [0]);
  env.readFailure(true); assert.equal(a.recordLesson('introduction', 'check', 1), false);
  assert.equal(a.getSnapshot().status, 'read-failed');
  assert.equal(a.getSnapshot().progress.introduction.check, 1);
  env.readFailure(false); env.emit('focus'); assert.equal(a.getSnapshot().status, 'saved');
  const reloaded = env.tab('reload').getSnapshot(); assert.deepEqual(reloaded.progress, a.getSnapshot().progress);
});

test('failed writes do not claim persistence; reload cannot recover memory-only changes', () => {
  const env = environment(), a = env.tab('a'); env.writeFailure(true);
  a.recordLesson('introduction', 'check', 1);
  assert.equal(env.tab('reload').getSnapshot().progress.introduction, undefined);
  assert.equal(a.getSnapshot().progress.introduction.check, 1);
});

test('corrupt and future data stay untouched while valid records and new changes survive', () => {
  const env = environment();
  env.values.set(STORAGE_KEY, '{broken'); env.values.set(LAB_KEY, '{"version":99}');
  env.values.set(OP_PREFIX + 'bad', 'null');
  const repo = env.tab('a'); assert.equal(repo.getSnapshot().damaged, true);
  repo.recordLesson('introduction', 'inspect', 0);
  assert.equal(env.values.get(STORAGE_KEY), '{broken');
  assert.equal(env.values.get(LAB_KEY), '{"version":99}');
  assert.equal(env.values.get(OP_PREFIX + 'bad'), 'null');
  assert.deepEqual(repo.getSnapshot().progress.introduction.inspected, [0]);
  assert.equal(repo.recordLesson('introduction', 'check', 999), false);
});

test('lab validation, simultaneous assessment appends and reset use the same repository', () => {
  const env = environment(), a = env.tab('a'), b = env.tab('b');
  const history = runSandbox(newSandbox('tn5'), 200);
  assert.equal(a.recordLab(history, 0, {tn5:0}), false);
  assert.equal(a.recordLab(history, 4, {tn5:0}), true);
  env.beforeWrite(() => b.appendAttempt(correct, '2026-11-03T12:00:00Z'));
  assert.equal(a.appendAttempt(correct, '2026-11-03T12:00:00Z'), true);
  a.refresh(); assert.equal(a.getSnapshot().attempts.length, 2);
  a.resetAttempts(); assert.equal(a.getSnapshot().attempts.length, 0);
  assert.ok(a.getSnapshot().labs.tn5);
  b.appendAttempt(correct, '2026-11-03T13:00:00Z'); a.refresh(); assert.equal(a.getSnapshot().attempts.length, 1);
  assert.equal(a.appendAttempt({}, 'invalid'), false);
  assert.equal(env.values.has(ASSESSMENT_KEY), false);
});

test('legacy guided reviews and assessments remain readable and untouched after new writes', () => {
  const env = environment();
  const history = runSandbox(newSandbox('tn5'), 200);
  recordLab(history, 4, {tn5:0}, env.storage);
  appendAttempt(correct, '2026-11-02T12:00:00Z', env.storage);
  const originalLabs = env.values.get(LAB_KEY), originalAttempts = env.values.get(ASSESSMENT_KEY);
  const repo = env.tab('a');
  assert.ok(repo.getSnapshot().labs.tn5);
  assert.equal(repo.getSnapshot().attempts.length, 1);
  repo.appendAttempt(correct, '2026-11-03T12:00:00Z');
  assert.equal(repo.getSnapshot().attempts.length, 2);
  repo.resetAttempts(); assert.equal(repo.getSnapshot().attempts.length, 0);
  assert.equal(env.values.get(LAB_KEY), originalLabs);
  assert.equal(env.values.get(ASSESSMENT_KEY), originalAttempts);
  assert.equal(env.tab('reload').getSnapshot().attempts.length, 0);
});

test('retries preserve operation IDs and do not append duplicate attempts', () => {
  const env = environment(), repo = env.tab('a');
  env.writeFailure(true); repo.appendAttempt(correct, '2026-11-03T12:00:00Z');
  assert.equal(repo.retry(), false);
  assert.equal(repo.getSnapshot().attempts.length, 1);
  env.writeFailure(false); assert.equal(repo.retry(), true); repo.retry();
  assert.equal(env.tab('reload').getSnapshot().attempts.length, 1);
  assert.deepEqual([...env.values.keys()], [OP_PREFIX + 'a-1']);
});
