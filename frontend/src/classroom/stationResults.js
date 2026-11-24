// Read-only results for a teacher's assignment dashboard. Every rule comes from the student-side
// code (replayProgress, topicCompleted, lesson definitions), so "Done" here always matches the
// student's own Notebook. Nothing in this file records or changes progress.
import { replayProgress } from '../features/transposable-elements/progressRepository.js';
import { topicCompleted } from '../features/transposable-elements/learnerRecords.js';
import { isCorrect } from '../features/transposable-elements/lessonProgress.js';
import { lessonById } from '../features/transposable-elements/curriculum/lessons.js';
import { allTopics } from '../features/transposable-elements/curriculum/modules.js';

const QUESTIONS = [['exercise', 'Applied reasoning'], ['check', 'Knowledge check'], ['check2', 'Knowledge check 2']];

/** Topics for the assignment's station ids, in the teacher's order; unknown ids are skipped. */
export function assignedTopics(stationIds = []) {
  return stationIds.map(id => allTopics.find(topic => topic.id === id)).filter(Boolean);
}

function lessonResult(topic, state) {
  const lesson = lessonById(topic.lessonId), record = state.progress[topic.lessonId] || {};
  const questions = QUESTIONS.filter(([key]) => lesson[key]).map(([key, label]) => {
    const answer = record[key];
    return {key, label, answer, answerText: answer === undefined ? undefined : lesson[key].options[answer],
      correct: answer === undefined ? undefined : isCorrect(lesson[key], answer)};
  });
  const inspected = record.inspected?.length ?? 0;
  const started = inspected > 0 || questions.some(q => q.answer !== undefined);
  const status = topicCompleted(topic, state.progress, state.labs) ? 'done' : started ? 'progress' : 'new';
  return {status, detail: {kind: 'lesson', inspected, views: lesson.variants.length, questions}};
}

function labResult(topic, state) {
  const record = state.labs[topic.learning.experiment];
  const saved = topicCompleted(topic, state.progress, state.labs);
  return {status: saved ? 'done' : 'new', detail: {kind: 'lab', saved, answers: saved ? record.answers : undefined}};
}

/** One entry per student (sorted by name), each with a result per topic. */
export function buildResults(rows, topics) {
  const byUser = new Map();
  for (const row of rows) {
    const entry = byUser.get(row.user_id) || {userId: row.user_id, name: row.display_name, ops: []};
    if (row.op) entry.ops.push(row.op);
    byUser.set(row.user_id, entry);
  }
  return [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name)).map(({userId, name, ops}) => {
    const state = replayProgress(ops);
    const stations = Object.fromEntries(topics.map(topic => [topic.id,
      topic.learning?.kind === 'laboratory' ? labResult(topic, state) : lessonResult(topic, state)]));
    return {userId, name, stations};
  });
}

/** Per topic: how many students are done, and the question label answered wrong most often. */
export function stationTotals(results, topics) {
  return Object.fromEntries(topics.map(topic => {
    const misses = new Map();
    for (const student of results) for (const q of student.stations[topic.id]?.detail.questions || [])
      if (q.correct === false) misses.set(q.label, (misses.get(q.label) || 0) + 1);
    const mostMissed = [...misses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return [topic.id, {done: results.filter(s => s.stations[topic.id]?.status === 'done').length, total: results.length, mostMissed}];
  }));
}
