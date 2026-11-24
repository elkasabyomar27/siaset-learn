import test from 'node:test';
import assert from 'node:assert/strict';
import {assignedTopics, buildResults, stationTotals} from '../../../classroom/stationResults.js';
import {replayProgress} from '../progressRepository.js';
import {topicCompleted} from '../learnerRecords.js';
import {lessonById} from '../curriculum/lessons.js';
import {allTopics} from '../curriculum/modules.js';
import {newSandbox, runSandbox} from '../sandboxSession.js';

let clock = 0;
const op = body => ({version: 1, id: `op-${++clock}`, clock, ...body});
const row = (user, name, entry) => ({user_id: user, display_name: name, ops: entry ? [entry] : []});
function completeLessonOps(lessonId) {
  const lesson = lessonById(lessonId), ops = lesson.variants.map((_, i) => op({type: 'lesson', lessonId, kind: 'inspect', value: i}));
  for (const kind of ['exercise', 'check', 'check2']) if (lesson[kind]) ops.push(op({type: 'lesson', lessonId, kind, value: lesson[kind].correct}));
  return ops;
}
const tn5Op = () => op({type: 'lab', record: {scenario: 'tn5', stage: 4, answers: {tn5: 0}, events: runSandbox(newSandbox('tn5'), 200).events}});

test('done equals topicCompleted', () => {
  for (const topic of allTopics) {
    const ops = topic.learning.kind === 'laboratory' ? (topic.learning.experiment === 'tn5' ? [tn5Op()] : null) : completeLessonOps(topic.lessonId);
    if (!ops) continue;
    const [student] = buildResults(ops.map(entry => row('u1', 'Amira', entry)), [topic]);
    const state = replayProgress(ops);
    assert.equal(student.stations[topic.id].status, 'done', topic.id);
    assert.equal(topicCompleted(topic, state.progress, state.labs), true, topic.id);
  }
});

test('partial lesson is in progress', () => {
  const [tsd] = assignedTopics(['tsd']);
  const [student] = buildResults([row('u1', 'Amira', op({type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 0}))], [tsd]);
  assert.equal(student.stations.tsd.status, 'progress');
  assert.equal(student.stations.tsd.detail.inspected, 1);
  assert.equal(student.stations.tsd.detail.views, lessonById('tsd').variants.length);
});

test('wrong answers show as incorrect', () => {
  const [intro] = assignedTopics(['introduction']);
  const lesson = lessonById('introduction'), wrong = (lesson.exercise.correct + 1) % lesson.exercise.options.length;
  const [student] = buildResults([row('u1', 'Amira', op({type: 'lesson', lessonId: 'introduction', kind: 'exercise', value: wrong}))], [intro]);
  const question = student.stations.introduction.detail.questions[0];
  assert.equal(question.key, 'exercise');
  assert.equal(question.label, 'Applied reasoning');
  assert.equal(question.correct, false);
  assert.equal(question.answerText, lesson.exercise.options[wrong]);
});

test('member without progress is new everywhere', () => {
  const topics = assignedTopics(['conservative', 'tsd']);
  const [student] = buildResults([row('u2', 'Ben', null)], topics);
  assert.deepEqual(topics.map(t => student.stations[t.id].status), ['new', 'new']);
  assert.equal(student.stations.conservative.detail.kind, 'lab');
  assert.equal(student.stations.conservative.detail.saved, false);
});

test('unknown station ids are skipped', () => {
  assert.deepEqual(assignedTopics(['tsd', 'no-such']).map(t => t.id), ['tsd']);
});

test('students are sorted by name and grouped by user', () => {
  const [tsd] = assignedTopics(['tsd']);
  const results = buildResults([row('u2', 'Ben', null), row('u1', 'Amira', op({type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 0})), row('u1', 'Amira', op({type: 'lesson', lessonId: 'tsd', kind: 'inspect', value: 1}))], [tsd]);
  assert.deepEqual(results.map(r => r.name), ['Amira', 'Ben']);
  assert.equal(results[0].stations.tsd.detail.inspected, 2);
});

test('totals', () => {
  const [intro] = assignedTopics(['introduction']);
  const lesson = lessonById('introduction'), wrong = (lesson.check.correct + 1) % lesson.check.options.length;
  const rows = [
    ...completeLessonOps('introduction').map(e => row('u1', 'A', e)),
    ...completeLessonOps('introduction').map(e => row('u2', 'B', e)),
    row('u3', 'C', op({type: 'lesson', lessonId: 'introduction', kind: 'check', value: wrong})),
  ];
  assert.deepEqual(stationTotals(buildResults(rows, [intro]), [intro]), {introduction: {done: 2, total: 3, mostMissed: 'Knowledge check'}});
  assert.deepEqual(stationTotals(buildResults(rows.slice(0, -1), [intro]), [intro]).introduction.mostMissed, null);
});
