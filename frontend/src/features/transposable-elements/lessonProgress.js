import { lessonById, lessons } from './curriculum/lessons.js';
export const STORAGE_KEY = 'siaset-lessons-v1';
export function readProgress(storage) {
  try { return parseProgress((storage ?? globalThis.localStorage).getItem(STORAGE_KEY)); }
  catch { return {}; }
}
export function isCorrect(question, answer) {
  return Number.isInteger(answer) && answer >= 0 && answer < question.options.length && answer === question.correct;
}
export function isComplete(id, record) {
  const lesson = lessonById(id);
  return !!lesson && !!record && lesson.variants.every((_, i) => record.inspected?.includes(i)) && isCorrect(lesson.exercise, record.exercise) && isCorrect(lesson.check, record.check) && (!lesson.check2 || isCorrect(lesson.check2, record.check2));
}
export function updateProgress(progress, id, kind, value) {
  const lesson = lessonById(id);
  if (!lesson) return progress;
  const record = progress[id] || {};
  if (kind === 'inspect' && Number.isInteger(value) && value >= 0 && value < lesson.variants.length) {
    return {...progress, [id]: {...record, inspected: [...new Set([...(record.inspected || []), value])]}};
  }
  if (['exercise','check','check2'].includes(kind) && lesson[kind] && Number.isInteger(value) && value >= 0 && value < lesson[kind].options.length) return {...progress, [id]: {...record, [kind]: value}};
  return progress;
}
export function parseProgress(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed.records || typeof parsed.records !== 'object') return {};
    let result = {};
    for (const lesson of lessons) {
      const record = parsed.records[lesson.id];
      if (!record || typeof record !== 'object') continue;
      for (const index of Array.isArray(record.inspected) ? record.inspected : []) result = updateProgress(result, lesson.id, 'inspect', index);
      for (const kind of ['exercise','check','check2']) result = updateProgress(result, lesson.id, kind, record[kind]);
    }
    return result;
  } catch { return {}; }
}
