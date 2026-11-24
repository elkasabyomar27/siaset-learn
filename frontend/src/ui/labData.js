import { allChapters, fields, modulesInField, fieldForTopic } from '../features/transposable-elements/curriculum/modules.js';

// Read-only views over existing learner evidence. Nothing here records or changes progress.
export function stationStatus(stop, progress) {
  if (stop.completed) return 'done';
  const record = progress?.[stop.id];
  const started = record && ((record.inspected?.length ?? 0) > 0 || record.exercise !== undefined || record.check !== undefined || record.check2 !== undefined);
  return started ? 'progress' : 'new';
}

export const STATUS_LABEL = { done: 'Done', progress: 'In progress', new: 'New' };

export function chapterBadges(stops) {
  return allChapters.map(chapter => {
    const own = stops.filter(stop => chapter.topics.includes(stop.id));
    const done = own.filter(stop => stop.completed).length;
    return { id: chapter.id, title: chapter.title, module: chapter.module, done, total: own.length, earned: own.length > 0 && done === own.length };
  });
}

export function fieldSummaries(stops) {
  return fields.map(field => {
    const moduleIds = modulesInField(field.id).map(module => module.id);
    const own = stops.filter(stop => moduleIds.includes(stop.module));
    return { ...field, modules: moduleIds.length, total: own.length, done: own.filter(stop => stop.completed).length };
  });
}

export const fieldTitleForTopic = id => fieldForTopic(id)?.title ?? '';
