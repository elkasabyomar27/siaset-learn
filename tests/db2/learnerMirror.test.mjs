import test from 'node:test';
import assert from 'node:assert/strict';
import {createWriteHandler} from '../../server/handler.js';
import {database, commit, asRole, ownerA} from './database.mjs';
import {enqueue, drain, clearMirror, MIRROR_PREFIX, stableUuid, CONTRACT_VERSION as MIRROR_CONTRACT} from '../../frontend/src/features/transposable-elements/learnerMirror.js';
import {CONTRACT_VERSION, contractManifest, digest} from '../../server/validate.js';
import {createProgressSync} from '../../frontend/src/features/transposable-elements/progressSync.js';
import {questions} from '../../frontend/src/features/transposable-elements/assessment.js';
import {lessonById} from '../../frontend/src/features/transposable-elements/curriculum/lessons.js';

const origin = 'https://siaset-learn.vercel.app';
function memory() {
  const values = new Map();
  return {values, get length() { return values.size; }, key: i => [...values.keys()][i] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)};
}
/** A Supabase-like client: functions.invoke goes through the real learner-write handler and PostgreSQL. */
function client(db, {enabled = true} = {}) {
  const handler = createWriteHandler({enabled, allowedOrigins: [origin], verifyUser: async () => ({id: ownerA}),
    commit: async (owner, op) => (await commit(db, owner, [op]))[0]});
  const calls = [];
  return {calls,
    functions: {async invoke(name, {body}) {
      calls.push(body);
      assert.equal(name, 'learner-write');
      const response = await handler(new Request('http://local/functions/v1/learner-write', {method: 'POST', headers: {'Content-Type': 'application/json', Origin: origin, Authorization: 'Bearer token'}, body: JSON.stringify(body)}));
      if (response.ok) return {data: await response.json(), error: null};
      return {data: null, error: {context: response}};
    }},
    from: table => ({select: () => ({eq: async (_column, userId) => {
      assert.equal(table, 'learner_scopes');
      const {rows} = await asRole(db, 'authenticated', userId, 'select scope, epoch, revision, field_revisions from public.learner_scopes where user_id = $1', [userId]);
      return {data: rows, error: null};
    }})}),
  };
}
let clock = 0;
const op = (body, id = `op-${++clock}`) => ({version: 1, id, clock, ...body});
const intro = lessonById('introduction');
const answers = Object.fromEntries(questions.map(q => [q.id, q.correct]));

test('mirror uses the deployed contract version', () => assert.equal(MIRROR_CONTRACT, CONTRACT_VERSION));

test('stable ids are valid UUIDs and repeat for the same entry', async () => {
  const a = await stableUuid('x'), b = await stableUuid('x');
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('uploaded entries are recorded through learner-write; legacy entries are never imported', async () => {
  const db = await database();
  try {
    const store = memory(), api = client(db);
    const ops = [
      op({type: 'lesson', lessonId: 'introduction', kind: 'inspect', value: 0}),
      op({type: 'lesson', lessonId: 'introduction', kind: 'exercise', value: intro.exercise.correct}),
      op({type: 'lesson', lessonId: 'introduction', kind: 'exercise', value: 0}),
      op({type: 'attempt', attempt: {bankVersion: 1, date: '2026-11-24T10:00:00.000Z', answers}}),
      op({type: 'lesson', lessonId: 'introduction', kind: 'inspect', value: 1}, 'legacy-abc'),
    ];
    assert.equal(enqueue(store, ownerA, ops), 4);
    const result = await drain(api, ownerA, store);
    assert.deepEqual(result, {sent: 4, accepted: 4, dropped: 0, remaining: 0});
    const {rows: [lesson]} = await db.query("select record from public.lesson_progress where lesson_id = 'introduction'");
    assert.deepEqual(lesson.record, {inspected: [0], exercise: 0});
    assert.equal((await db.query('select count(*)::int as n from public.assessment_attempts')).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int as n from public.learner_operations')).rows[0].n, 4);
    // Nothing left to send; a second run makes no requests.
    assert.deepEqual(await drain(api, ownerA, store), {sent: 0, accepted: 0, dropped: 0, remaining: 0});
    assert.equal(api.calls.length, 4);
    assert.ok(api.calls.every(call => call.contract_version === CONTRACT_VERSION));
  } finally { await db.close(); }
});

test('the same entry sent from two browsers is recorded once', async () => {
  const db = await database();
  try {
    const entry = op({type: 'lesson', lessonId: 'discovery', kind: 'inspect', value: 0});
    const first = memory(), second = memory();
    enqueue(first, ownerA, [entry]); enqueue(second, ownerA, [entry]);
    assert.equal((await drain(client(db), ownerA, first)).accepted, 1);
    assert.deepEqual(await drain(client(db), ownerA, second), {sent: 1, accepted: 1, dropped: 0, remaining: 0});
    assert.equal((await db.query('select count(*)::int as n from public.learner_operations')).rows[0].n, 1);
  } finally { await db.close(); }
});

test('a reset moves the epoch and later answers still land', async () => {
  const db = await database();
  try {
    const store = memory();
    enqueue(store, ownerA, [
      op({type: 'lesson', lessonId: 'anatomy', kind: 'inspect', value: 0}),
      op({type: 'resetLesson', lessonId: 'anatomy'}),
      op({type: 'lesson', lessonId: 'anatomy', kind: 'inspect', value: 1}),
    ]);
    assert.equal((await drain(client(db), ownerA, store)).accepted, 3);
    const {rows: [row]} = await db.query("select record, epoch from public.lesson_progress where lesson_id = 'anatomy'");
    assert.deepEqual(row.record, {inspected: [1]});
    assert.equal(Number(row.epoch), 1);
  } finally { await db.close(); }
});

test('a disabled or unreachable function keeps entries queued for the next sync', async () => {
  const db = await database();
  try {
    const store = memory();
    enqueue(store, ownerA, [op({type: 'lesson', lessonId: 'classification', kind: 'inspect', value: 0})]);
    assert.deepEqual(await drain(client(db, {enabled: false}), ownerA, store), {sent: 1, accepted: 0, dropped: 0, remaining: 1});
    const offline = {...client(db), functions: {invoke: async () => { throw Error('offline'); }}};
    assert.equal((await drain(offline, ownerA, store)).remaining, 1);
    assert.equal((await drain(client(db), ownerA, store)).accepted, 1);
    clearMirror(store, ownerA);
    assert.equal(store.getItem(MIRROR_PREFIX + ownerA), null);
  } finally { await db.close(); }
});

test('a failing mirror never changes the normal sync result', async () => {
  const progressOps = {from: () => ({
    select: () => { const q = {eq: () => q, order: () => q, range: async () => ({data: [], error: null})}; return q; },
    upsert: async () => ({error: null}),
  })};
  const store = memory();
  store.setItem('siaset-progress-op-v1:op-x', JSON.stringify(op({type: 'lesson', lessonId: 'introduction', kind: 'inspect', value: 0}, 'op-x')));
  const timers = {setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}};
  const sync = createProgressSync({repository: {subscribe: () => () => {}, refresh() {}}, storage: () => store, events: null, doc: null, timers,
    mirror: {enqueue() { throw Error('boom'); }, drain() { throw Error('boom'); }, clearMirror() {}}});
  assert.equal(await sync.start(progressOps, ownerA), true);
  assert.equal(sync.getSnapshot().status, 'synced');
});

test('an answer changed by another device meanwhile is retried once with the fresh revision', async () => {
  const db = await database();
  try {
    const api = client(db), invoke = api.functions.invoke;
    let raced = false;
    api.functions.invoke = async (name, args) => {
      if (!raced) {
        raced = true; // Another device answers first, after this browser read the scopes.
        await commit(db, ownerA, [{protocol_version: 1, contract_version: CONTRACT_VERSION, op_id: crypto.randomUUID(), device_id: '44444444-4444-4444-8444-444444444444',
          device_seq: '1', expected_epoch: '0', expected_revision: '0', type: 'lesson', scope: 'lesson:introduction', field: 'exercise',
          payload: {lessonId: 'introduction', kind: 'exercise', value: 1}, contract_hash: await digest(contractManifest), payload_hash: 'a'.repeat(64)}]);
      }
      return invoke(name, args);
    };
    const store = memory();
    enqueue(store, ownerA, [op({type: 'lesson', lessonId: 'introduction', kind: 'exercise', value: intro.exercise.correct})]);
    const result = await drain(api, ownerA, store);
    assert.equal(result.remaining, 0);
    assert.equal(result.accepted, 1);
    assert.equal(result.sent, 2);
    const {rows: [lesson]} = await db.query("select record from public.lesson_progress where lesson_id = 'introduction'");
    assert.equal(lesson.record.exercise, intro.exercise.correct);
  } finally { await db.close(); }
});
