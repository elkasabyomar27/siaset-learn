import test from 'node:test';
import assert from 'node:assert/strict';
import {database, ownerA as teacher, ownerB as student} from './database.mjs';

const outsider = '44444444-4444-4444-8444-444444444444';
function as(db, sub, sql, params = [], claims = {}) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${sub ? 'authenticated' : 'anon'}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [sub || '', JSON.stringify({sub, ...claims})]);
    return tx.query(sql, params);
  });
}
const one = async (...args) => (await as(...args)).rows[0];
async function setup() {
  const db = await database();
  await db.exec(`insert into auth.users values ('${outsider}')`);
  return db;
}
async function approve(db, user) {
  await db.query("insert into public.teacher_requests (user_id, display_name, status) values ($1,'T','approved')", [user]);
}
const questions = [
  {text: 'Ds needs?', options: ['Ac', 'Nothing'], correct: 0, seconds: 20},
  {text: 'TSDs are?', options: ['Inside', 'Outside', 'Both'], correct: 1, seconds: 10},
];

test('only approved teachers can create classes, and request status is the only switch', async () => {
  const db = await setup();
  await assert.rejects(as(db, teacher, "insert into public.classes (name) values ('Bio 1')"), /row-level security/);
  // Browsers cannot write their own approval or read the token hash.
  await assert.rejects(as(db, teacher, "insert into public.teacher_requests (user_id, display_name, status) values ($1,'T','approved')", [teacher]), /permission denied/);
  await db.query("insert into public.teacher_requests (user_id, display_name, token_hash) values ($1,'T',repeat('a',64))", [teacher]);
  await assert.rejects(as(db, teacher, 'select token_hash from public.teacher_requests'), /permission denied/);
  assert.equal((await one(db, teacher, 'select status from public.teacher_requests')).status, 'pending');
  assert.equal((await one(db, teacher, 'select public.is_teacher() t')).t, false);
  await db.query("update public.teacher_requests set status='approved' where user_id=$1", [teacher]);
  assert.equal((await one(db, teacher, 'select public.is_teacher() t')).t, true);
  assert.equal((await one(db, teacher, 'select public.is_teacher() t', [], {is_anonymous: true})).t, false);
  const cls = await one(db, teacher, "insert into public.classes (name) values ('Bio 1') returning id, join_code");
  assert.match(cls.join_code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal((await as(db, student, 'select user_id from public.teacher_requests')).rows.length, 0);
});

test('students join with a code, see only their own class data, and classmates stay private', async () => {
  const db = await setup();
  await approve(db, teacher);
  const cls = await one(db, teacher, "insert into public.classes (name) values ('Bio 1') returning id, join_code");
  assert.equal((await as(db, student, 'select * from public.classes')).rows.length, 0);
  await assert.rejects(as(db, student, "select * from public.join_class('ZZZZZZ','Sam')"), /class_not_found/);
  await assert.rejects(as(db, teacher, 'select * from public.join_class($1,$2)', [cls.join_code, 'Me']), /own_class/);
  const joined = await one(db, student, 'select * from public.join_class($1,$2)', [cls.join_code.toLowerCase(), ' Sam ']);
  assert.equal(joined.class_name, 'Bio 1');
  await one(db, outsider, 'select * from public.join_class($1,$2)', [cls.join_code, 'Ola']);
  assert.equal((await as(db, student, 'select * from public.classes')).rows.length, 1);
  assert.deepEqual((await as(db, student, 'select display_name from public.class_members')).rows, [{display_name: 'Sam'}]);
  assert.equal((await as(db, teacher, 'select * from public.class_members')).rows.length, 2);
  // Students cannot rename the class or post assignments.
  assert.equal((await as(db, student, "update public.classes set name='x' returning id")).rows.length, 0);
  await assert.rejects(as(db, student, "insert into public.assignments (class_id,title) values ($1,'x')", [cls.id]), /row-level security/);
  // Teacher removes a student; a new code locks out the old one.
  await as(db, teacher, 'delete from public.class_members where user_id=$1', [outsider]);
  const code = (await one(db, teacher, 'select public.new_join_code($1) c', [cls.id])).c;
  assert.notEqual(code, cls.join_code);
  await assert.rejects(as(db, outsider, 'select * from public.join_class($1,$2)', [cls.join_code, 'Ola']), /class_not_found/);
  await assert.rejects(as(db, student, 'select public.new_join_code($1)', [cls.id]), /not_your_class/);
});

test('submissions: students upload into their own folder, teachers grade, a new upload clears the grade', async () => {
  const db = await setup();
  await approve(db, teacher);
  const cls = await one(db, teacher, "insert into public.classes (name) values ('Bio 1') returning id, join_code");
  const hw = await one(db, teacher, "insert into public.assignments (class_id,title) values ($1,'Essay') returning id", [cls.id]);
  await one(db, student, 'select * from public.join_class($1,$2)', [cls.join_code, 'Sam']);
  const path = `${cls.id}/${hw.id}/${student}/essay.pdf`;
  const upload = (sub, name) => as(db, sub, "insert into storage.objects (bucket_id,name) values ('class-submissions',$1)", [name]);
  await assert.rejects(upload(outsider, `${cls.id}/${hw.id}/${outsider}/x.pdf`), /row-level security/);
  await assert.rejects(upload(student, `${cls.id}/${hw.id}/${teacher}/x.pdf`), /row-level security/);
  await assert.rejects(upload(student, `${cls.id}/${hw.id}/${student}/../x.pdf`), /row-level security/);
  await upload(student, path);
  assert.equal((await as(db, teacher, "select name from storage.objects where bucket_id='class-submissions'")).rows.length, 1);
  assert.equal((await as(db, outsider, "select name from storage.objects where bucket_id='class-submissions'")).rows.length, 0);

  const submit = 'insert into public.submissions (assignment_id,file_path,file_name,file_size) values ($1,$2,$3,$4)';
  await assert.rejects(as(db, student, submit, [hw.id, `${cls.id}/${hw.id}/${outsider}/essay.pdf`, 'essay.pdf', 10]), /check constraint|row-level/);
  await assert.rejects(as(db, student, "insert into public.submissions (assignment_id,file_path,file_name,file_size,grade) values ($1,$2,'e',1,'A+')", [hw.id, path]), /permission denied/);
  await as(db, student, submit, [hw.id, path, 'essay.pdf', 10]);
  await assert.rejects(as(db, student, 'select public.grade_submission($1,$2,$3,$4)', [hw.id, student, 'A+', 'me']), /not_your_class/);
  await as(db, teacher, 'select public.grade_submission($1,$2,$3,$4)', [hw.id, student, 'B', 'Good start']);
  assert.deepEqual(await one(db, student, 'select grade, feedback from public.submissions'), {grade: 'B', feedback: 'Good start'});
  await as(db, student, 'update public.submissions set file_path=$1, file_name=$2 where assignment_id=$3', [`${cls.id}/${hw.id}/${student}/v2.pdf`, 'v2.pdf', hw.id]);
  assert.deepEqual(await one(db, student, 'select grade, feedback from public.submissions'), {grade: null, feedback: null});
  assert.equal((await as(db, outsider, 'select * from public.submissions')).rows.length, 0);
});

test('live quiz: answers stay hidden until reveal, scoring is server-side, repeats and late answers are refused', async () => {
  const db = await setup();
  await approve(db, teacher);
  await assert.rejects(as(db, teacher, "insert into public.quizzes (title,questions) values ('Bad', $1)",
    [JSON.stringify([{text: 'x', options: ['a'], correct: 0, seconds: 20}])]), /check constraint/);
  await assert.rejects(as(db, student, "insert into public.quizzes (title,questions) values ('Q', $1)", [JSON.stringify(questions)]), /row-level security/);
  const quiz = await one(db, teacher, "insert into public.quizzes (title,questions) values ('TE quiz', $1) returning id", [JSON.stringify(questions)]);
  assert.equal((await as(db, student, 'select * from public.quizzes')).rows.length, 0);
  await assert.rejects(as(db, student, 'select * from public.start_quiz_session($1)', [quiz.id]), /not_your_quiz/);
  const game = await one(db, teacher, 'select * from public.start_quiz_session($1)', [quiz.id]);
  assert.match(game.pin, /^\d{6}$/);

  assert.equal((await as(db, student, 'select * from public.quiz_sessions')).rows.length, 0);
  await one(db, student, 'select public.join_quiz($1,$2)', [game.pin, 'Sam']);
  await assert.rejects(as(db, outsider, 'select public.join_quiz($1,$2)', [game.pin, 'sam']), /nickname_taken/);
  await one(db, outsider, 'select public.join_quiz($1,$2)', [game.pin, 'Ola']);
  await assert.rejects(as(db, student, 'select * from public.quiz_answer($1,0)', [game.session_id]), /question_closed/);
  const advance = (from, index) => one(db, teacher, 'select public.quiz_advance($1,$2,$3) s', [game.session_id, from, index]);
  await assert.rejects(as(db, student, "select public.quiz_advance($1,'lobby',-1)", [game.session_id]), /not_your_game/);

  assert.equal((await advance('lobby', -1)).s, 'question');
  // A repeated click from the lobby screen does not skip ahead.
  assert.equal((await advance('lobby', -1)).s, 'question');
  assert.equal((await one(db, teacher, 'select question_index from public.quiz_sessions')).question_index, 0);
  const live = await one(db, student, 'select current, correct_option from public.quiz_sessions');
  assert.deepEqual(live, {current: {text: 'Ds needs?', options: ['Ac', 'Nothing'], seconds: 20}, correct_option: null});
  await assert.rejects(as(db, student, 'select * from public.quiz_answer($1,5)', [game.session_id]), /invalid_choice/);
  const right = await one(db, student, 'select * from public.quiz_answer($1,0)', [game.session_id]);
  assert.ok(right.points >= 500 && right.points <= 1000, String(right.points));
  await assert.rejects(as(db, student, 'select * from public.quiz_answer($1,1)', [game.session_id]), /already_answered/);
  assert.equal((await one(db, outsider, 'select * from public.quiz_answer($1,1)', [game.session_id])).points, 0);
  // Players see only their own answers; the host sees all.
  assert.equal((await as(db, student, 'select * from public.quiz_answers')).rows.length, 1);
  assert.equal((await as(db, teacher, 'select * from public.quiz_answers')).rows.length, 2);

  assert.equal((await advance('question', 0)).s, 'reveal');
  assert.equal((await advance('question', 0)).s, 'reveal');
  assert.deepEqual(await one(db, student, 'select correct_option, answer_counts from public.quiz_sessions'), {correct_option: 0, answer_counts: {0: 1, 1: 1}});
  const board = (await as(db, outsider, 'select nickname, score, correct_count from public.quiz_players order by score desc')).rows;
  assert.deepEqual(board.map(r => [r.nickname, r.correct_count]), [['Sam', 1], ['Ola', 0]]);

  // Second question: a late answer is refused.
  assert.equal((await advance('reveal', 0)).s, 'question');
  await db.query("update public.quiz_sessions set question_started_at = now() - interval '30 seconds'");
  await assert.rejects(as(db, student, 'select * from public.quiz_answer($1,1)', [game.session_id]), /question_closed/);
  await advance('question', 1);
  assert.equal((await advance('reveal', 1)).s, 'finished');
  await assert.rejects(as(db, student, 'select public.join_quiz($1,$2)', [game.pin, 'Sam']), /game_not_found/);
});

test('classroom functions and tables are closed to signed-out visitors', async () => {
  const db = await setup();
  for (const sql of ['select * from public.classes', 'select * from public.quiz_sessions', "select public.join_quiz('123456','x')", "select * from public.join_class('ABCDEF','x')"])
    await assert.rejects(as(db, '', sql), /permission denied/, sql);
  await assert.rejects(as(db, student, "select * from public.join_class('ABCDEF','x')", [], {is_anonymous: true}), /sign_in_required/);
});
