import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './database.mjs';

const teacherA = '0a000000-0000-4000-8000-00000000000a', teacherB = '0b000000-0000-4000-8000-00000000000b';
const studentA = '0c000000-0000-4000-8000-00000000000c', studentB = '0d000000-0000-4000-8000-00000000000d';
function as(db, sub, sql, params = []) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [sub, JSON.stringify({sub})]);
    return tx.query(sql, params);
  });
}
const op = (id, clock, body) => ({version: 1, id, clock, ...body});
const studentOps = [
  op('a-tsd-inspect', 1, {type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 0}),
  op('a-intro-inspect', 2, {type: 'lesson', lessonId: 'introduction', kind: 'inspect', value: 0}),
  op('a-lab-tn5', 3, {type: 'lab', record: {scenario: 'tn5', stage: 4, answers: {}, events: []}}),
  op('a-lab-tn3', 4, {type: 'lab', record: {scenario: 'tn3', stage: 5, answers: {}, events: []}}),
  op('a-attempt', 5, {type: 'attempt', attempt: {bankVersion: 1, date: '2026-11-24', answers: {}}}),
  op('a-tsd-reset', 6, {type: 'resetLesson', lessonId: 'tsd'}),
];

async function setup() {
  const db = await database();
  await db.exec(`insert into auth.users values ('${teacherA}'), ('${teacherB}'), ('${studentA}'), ('${studentB}')`);
  for (const t of [teacherA, teacherB]) await db.query("insert into public.teacher_requests (user_id, display_name, status) values ($1,'T','approved')", [t]);
  const {rows: [cls]} = await db.query("insert into public.classes (teacher_id, name) values ($1, 'Bio') returning id", [teacherA]);
  await db.query("insert into public.class_members (class_id, user_id, display_name) values ($1,$2,'Amira'), ($1,$3,'Ben')", [cls.id, studentA, studentB]);
  const {rows: [assignment]} = await db.query("insert into public.assignments (class_id, title, stations) values ($1, 'Mobile DNA', '{conservative,tsd}') returning id", [cls.id]);
  for (const entry of studentOps) await db.query('insert into public.progress_ops (user_id, op_id, op) values ($1,$2,$3)', [studentA, entry.id, JSON.stringify(entry)]);
  return {db, cls: cls.id, assignment: assignment.id};
}
const progressFor = (db, sub, assignment) => as(db, sub, 'select user_id, display_name, ops from public.assignment_station_progress($1)', [assignment]);

test('teacher gets only assigned-station entries for class members', async () => {
  const {db, assignment} = await setup();
  try {
    const {rows} = await progressFor(db, teacherA, assignment);
    assert.equal(rows.length, 2, 'one row per member');
    const ofA = rows.find(r => r.user_id === studentA);
    assert.deepEqual(ofA.ops.map(o => o.id).sort(), ['a-lab-tn5', 'a-tsd-inspect', 'a-tsd-reset']);
    const ofB = rows.find(r => r.user_id === studentB);
    assert.deepEqual(ofB.ops, []);
    assert.equal(ofB.display_name, 'Ben');
  } finally { await db.close(); }
});

test('non-teachers get nothing', async () => {
  const {db, assignment} = await setup();
  try {
    for (const caller of [teacherB, studentA]) assert.equal((await progressFor(db, caller, assignment)).rows.length, 0, caller);
  } finally { await db.close(); }
});

test('removed students disappear', async () => {
  const {db, cls, assignment} = await setup();
  try {
    await db.query('delete from public.class_members where class_id = $1 and user_id = $2', [cls, studentB]);
    const {rows} = await progressFor(db, teacherA, assignment);
    assert.equal(rows.some(r => r.user_id === studentB), false);
  } finally { await db.close(); }
});

test('stations column is validated', async () => {
  const {db, assignment} = await setup();
  try {
    const set = list => as(db, teacherA, 'update public.assignments set stations = $1 where id = $2', [list, assignment]);
    await assert.rejects(set(Array.from({length: 19}, (_, i) => `s${i}`)));
    await assert.rejects(set(['Bad_Id']));
    await assert.rejects(set(['tsd', 'tsd']));
    await set(['tsd']);
    assert.deepEqual((await db.query('select stations from public.assignments where id = $1', [assignment])).rows[0].stations, ['tsd']);
  } finally { await db.close(); }
});

test('students cannot set stations', async () => {
  const {db, assignment} = await setup();
  try {
    await assert.rejects(as(db, studentA, "update public.assignments set stations = '{tsd}' where id = $1 returning id", [assignment]).then(r => { if (!r.rows.length) throw Error('no row updated'); }));
  } finally { await db.close(); }
});

test('one row per member however many entries, so the API row limit never truncates', async () => {
  const {db, assignment} = await setup();
  try {
    await db.query(`insert into public.progress_ops (user_id, op_id, op)
      select $1, 'bulk-' || g, jsonb_build_object('version', 1, 'id', 'bulk-' || g, 'clock', 100 + g, 'type', 'lesson', 'lessonId', 'tsd', 'kind', 'inspect', 'value', 0)
      from generate_series(1, 1500) g`, [studentA]);
    const {rows} = await progressFor(db, teacherA, assignment);
    assert.equal(rows.length, 2);
    assert.equal(rows.find(r => r.user_id === studentA).ops.length, 1503);
  } finally { await db.close(); }
});
