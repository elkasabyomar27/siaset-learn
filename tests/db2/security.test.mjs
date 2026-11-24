import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {validateOperation, contractManifest, CONTRACT_VERSION, digest} from '../../server/validate.js';
import {lessons} from '../../frontend/src/features/transposable-elements/curriculum/lessons.js';
import {createWriteHandler} from '../../server/handler.js';
import {database, commit, asRole, ownerA, ownerB, device} from './database.mjs';
import {newSandbox, runSandbox} from '../../frontend/src/features/transposable-elements/sandboxSession.js';

const envelope = (overrides = {}) => ({protocol_version: 1, contract_version: CONTRACT_VERSION, op_id: randomUUID(), device_id: device,
  device_seq: '1', expected_epoch: '0', expected_revision: '0', type: 'lesson', payload: {lessonId: 'introduction', kind: 'inspect', value: 0}, ...overrides});

test('pinned full assessment bank, 15 topics, and every lesson view across modules match canonical source', async () => {
  assert.deepEqual(contractManifest.questions, JSON.parse(await readFile('frontend/src/features/transposable-elements/tests/assessment-v1.json')));
  assert.equal(contractManifest.topics.length, 15);
  assert.deepEqual(contractManifest.lessons.map(l => l.id), lessons.map(l => l.id));
  assert.equal(contractManifest.lessons.length, 20);
  assert.equal(contractManifest.lessons.reduce((n, l) => n + l.variants.length, 0), 88);
  const pinned = JSON.parse(await readFile('supabase/contract-manifest.json', 'utf8'));
  assert.equal(pinned.version, CONTRACT_VERSION);
  const row = `'${CONTRACT_VERSION}', '${await digest(contractManifest)}', '${pinned.engine_sha256}'`;
  assert.ok((await readFile('supabase/seed.sql', 'utf8')).includes(row), 'seed registers the current contract');
  assert.ok((await readFile('supabase/migrations/20261124140000_contract_v3.sql', 'utf8')).includes(row), 'migration registers the current contract');
});

test('trusted validation rejects ownership, completion, score, partial submission, wrong stage and tampered events', async () => {
  for (const input of [envelope({user_id: ownerB}), envelope({protocol_version: 2}), envelope({device_seq: 1}),
    envelope({payload: {lessonId: 'introduction', kind: 'inspect', value: 3}}),
    envelope({payload: {lessonId: 'introduction', kind: 'completed', value: true}}),
    envelope({type: 'attempt', payload: {attempt: {bankVersion: 1, date: '2026-11-04', answers: {}}}})])
    await assert.rejects(validateOperation(input));
  for (const scenario of ['tn5', 'tn3']) {
    let h = runSandbox(newSandbox(scenario), 200);
    if (scenario === 'tn3') h = runSandbox(h, 200, true);
    const record = {scenario, stage: scenario === 'tn5' ? 4 : 5, answers: scenario === 'tn5' ? {tn5: 0} : {tn3: 1, resolution: 2}, events: h.events};
    await validateOperation(envelope({type: 'lab', payload: {record}}));
    await assert.rejects(validateOperation(envelope({type: 'lab', payload: {record: {...record, stage: 0}}})));
    const bad = structuredClone(record); bad.events[0].after = 'forged';
    await assert.rejects(validateOperation(envelope({type: 'lab', payload: {record: bad}})));
  }
});

test('real PostgreSQL grants/RLS deny anonymous, cross-owner access, direct writes and privileged RPC', async () => {
  const db = await database();
  try {
    await commit(db, ownerA, [await validateOperation(envelope())]);
    const allTables = (await db.query("select tablename from pg_tables where schemaname='public'")).rows.map(r => r.tablename);
    // Classroom tables have their own teacher/student rules (classroom.test.mjs); every table is still closed to anon.
    const classroom = ['teacher_requests', 'classes', 'class_members', 'assignments', 'submissions', 'quizzes', 'quiz_sessions', 'quiz_players', 'quiz_answers'];
    for (const table of allTables) await assert.rejects(asRole(db, 'anon', null, `select * from public.${table}`), /permission denied/);
    const tables = allTables.filter(table => !classroom.includes(table));
    for (const table of tables) {
      await assert.rejects(asRole(db, 'anon', null, `select * from public.${table}`), /permission denied/);
      assert.equal((await asRole(db, 'authenticated', ownerB, `select * from public.${table}`)).rows.length, 0);
      assert.ok((await asRole(db, 'authenticated', ownerA, `select * from public.${table}`)).rows.every(r => r.user_id === ownerA));
      await assert.rejects(asRole(db, 'authenticated', ownerA, `delete from public.${table}`), /permission denied/);
      await assert.rejects(asRole(db, 'authenticated', ownerA, `update public.${table} set user_id=$1`, [ownerB]), /permission denied/);
      // progress_ops is the one browser-writable table: owners may append to their own sync log only
      // (full coverage in progressOps.test.mjs). Every other table stays service-write-only.
      if (table === 'progress_ops') await assert.rejects(asRole(db, 'authenticated', ownerA, `insert into public.${table}(user_id,op_id,op) values($1,'x','{"id":"x","version":1,"clock":1,"type":"resetAttempts"}')`, [ownerB]), /row-level security/);
      else await assert.rejects(asRole(db, 'authenticated', ownerA, `insert into public.${table}(user_id) values($1)`, [ownerA]), /permission denied/);
    }
    for (const role of ['anon', 'authenticated']) {
      await assert.rejects(asRole(db, role, ownerA, 'select public.commit_learner_batch($1,$2)', [ownerB, '[]']), /permission denied/);
      await assert.rejects(asRole(db, role, ownerA, 'select * from private.contract_manifests'), /permission denied/);
    }
    const policies = await db.query("select count(*)::int as count from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity");
    assert.equal(policies.rows[0].count, 0);
    await assert.rejects(db.query('insert into public.current_lab_reviews values ($1,$2,$3)', [ownerB, 'tn5', 'foreign-review']), /foreign key/);
  } finally { await db.close(); }
});

test('transaction receipts, id reuse, field conflicts, inspection union, reset epochs and rollback', async () => {
  const db = await database();
  try {
    const first = await validateOperation(envelope());
    const receipt = await commit(db, ownerA, [first]);
    assert.equal(receipt[0].server_seq, '1');
    assert.deepEqual(await commit(db, ownerA, [first]), receipt);
    const changed = await validateOperation({...firstInput(first), payload: {...first.payload, value: 1}});
    assert.equal((await commit(db, ownerA, [changed]))[0].reason, 'id_reuse');
    const inspect = await validateOperation(envelope({device_seq: '2', payload: {...first.payload, value: 1}}));
    await commit(db, ownerA, [inspect]);
    assert.deepEqual((await db.query('select record from public.lesson_progress')).rows[0].record.inspected, [0, 1]);
    const answer = await validateOperation(envelope({device_seq: '3', payload: {lessonId: 'introduction', kind: 'exercise', value: 0}}));
    await commit(db, ownerA, [answer]);
    const stale = await validateOperation(envelope({device_seq: '4', payload: {...answer.payload, value: 1}}));
    assert.equal((await commit(db, ownerA, [stale]))[0].reason, 'revision_conflict');
    const reset = await validateOperation(envelope({device_seq: '5', type: 'resetLesson', expected_revision: '3', payload: {lessonId: 'introduction'}}));
    assert.equal((await commit(db, ownerA, [reset]))[0].epoch, '1');
    assert.equal((await commit(db, ownerA, [await validateOperation(envelope({device_seq: '6'}))]))[0].reason, 'stale_epoch');
    assert.equal((await db.query('select * from public.lesson_progress')).rows.length, 0);
    const fresh = await validateOperation(envelope({device_seq: '7', expected_epoch: '1'}));
    const invalid = {...fresh, op_id: randomUUID(), contract_version: 'future'};
    await assert.rejects(commit(db, ownerA, [fresh, invalid]), /unsupported_contract/);
    assert.equal((await db.query('select * from public.lesson_progress')).rows.length, 0);
    assert.equal((await db.query('select last_seq::text from public.learner_heads')).rows[0].last_seq, '4');
  } finally { await db.close(); }
});
function firstInput(op) { const {scope: _s, field: _f, payload_hash: _h, contract_hash: _c, ...input} = op; return input; }

test('immutable lab reviews and assessment scores retain canonical evidence and scoped attempt resets', async () => {
  const db = await database();
  try {
    const answers = Object.fromEntries(contractManifest.questions.map(q => [q.id, q.correct]));
    const attempt = {bankVersion: 1, date: '2026-11-04T10:00:00Z', answers};
    const one = await validateOperation(envelope({type: 'attempt', payload: {attempt}}));
    const two = await validateOperation(envelope({device_seq: '2', type: 'attempt', payload: {attempt}}));
    assert.equal((await commit(db, ownerA, [one, two])).length, 2);
    const rows = (await db.query('select * from public.assessment_attempts order by server_seq')).rows;
    assert.equal(rows.length, 2); assert.deepEqual(rows[0].answers, answers); assert.equal(rows[0].score.correct, 25);
    assert.notEqual(rows[0].attempt_id, rows[1].attempt_id);
    await commit(db, ownerA, [one]);
    assert.equal((await db.query('select * from public.assessment_attempts')).rows.length, 2);
    await assert.rejects(validateOperation(envelope({type: 'attempt', payload: {attempt, score: {correct: 25}}})));
    const h = runSandbox(newSandbox('tn5'), 200);
    const record = {scenario: 'tn5', stage: 4, answers: {tn5: 0}, events: h.events};
    const lab = await validateOperation(envelope({device_seq: '3', type: 'lab', payload: {record}}));
    await commit(db, ownerA, [lab]);
    assert.deepEqual((await db.query('select record from public.lab_reviews')).rows[0].record, record);
    const reset = await validateOperation(envelope({device_seq: '4', type: 'resetAttempts', expected_revision: '2', payload: {}}));
    await commit(db, ownerA, [reset]);
    assert.equal((await db.query('select * from public.assessment_attempts a join public.learner_scopes s on a.user_id=s.user_id and s.scope=\'attempts\' and a.attempt_epoch=s.epoch')).rows.length, 0);
    assert.equal((await db.query('select * from public.lab_reviews')).rows.length, 1);
    assert.equal((await db.query('select * from public.assessment_attempts')).rows.length, 2);
  } finally { await db.close(); }
});

test('separate owners, duplicate requests, device fences and account rate cap remain isolated', async () => {
  const db = await database();
  try {
    const operation = await validateOperation(envelope());
    const responses = await Promise.all([commit(db, ownerA, [operation]), commit(db, ownerA, [operation])]);
    assert.deepEqual(responses[0], responses[1]);
    await commit(db, ownerB, [operation]);
    assert.equal((await asRole(db, 'authenticated', ownerB, 'select * from public.learner_operations')).rows.length, 1);
    const stale = await validateOperation(envelope());
    assert.equal((await commit(db, ownerA, [stale]))[0].reason, 'stale_device_seq');
    await db.query('update public.learner_heads set rate_count=120 where user_id=$1', [ownerA]);
    const next = await validateOperation(envelope({device_seq: '2'}));
    assert.equal((await commit(db, ownerA, [next]))[0].reason, 'rate_limited');
    assert.equal((await db.query('select * from public.operation_receipts where user_id=$1 and op_id=$2', [ownerA, next.op_id])).rows.length, 0);
    await db.query("update public.learner_heads set rate_window=now()-interval '2 minutes' where user_id=$1", [ownerA]);
    assert.equal((await commit(db, ownerA, [next]))[0].status, 'accepted');
    // PGlite serializes transactions on one connection; real multi-connection lock races remain a staging gate.
  } finally { await db.close(); }
});

test('HTTP endpoint authenticates server-side, bounds streaming body, derives owner and commits to PostgreSQL', async () => {
  const db = await database(); let verifies = 0;
  try {
    const handler = createWriteHandler({enabled: true, allowedOrigins: ['http://127.0.0.1:5173'],
      verifyUser: async token => { verifies++; if (token !== 'synthetic-valid') throw Error(); return {id: ownerA}; },
      commit: async (owner, op) => (await commit(db, owner, [op]))[0]});
    const request = (input, token = 'synthetic-valid', origin = 'http://127.0.0.1:5173') => new Request('http://local/write', {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Origin: origin}, body: JSON.stringify(input)});
    assert.equal((await handler(request(envelope(), 'forged'))).status, 401);
    assert.equal((await handler(request(envelope(), 'synthetic-valid', 'https://evil.example'))).status, 403);
    assert.equal((await handler(request(envelope({user_id: ownerB})))).status, 400);
    assert.equal((await handler(request({padding: 'x'.repeat(70000)}))).status, 413);
    const response = await handler(request(envelope()));
    assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.json()).status, 'accepted');
    assert.equal((await db.query('select user_id from public.learner_operations')).rows[0].user_id, ownerA);
    assert.ok(verifies >= 4);
    const disabled = createWriteHandler({allowedOrigins: [], verifyUser() { throw Error(); }});
    assert.equal((await disabled(new Request('http://local/write', {method: 'POST'}))).status, 503);
  } finally { await db.close(); }
});
