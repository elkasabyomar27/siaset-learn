import { allTopics, modules } from './curriculum/modules.js';
import { topicHref } from './curriculum/lessons.js';
import { topicCompleted } from './learnerRecords.js';
import { experimentFromParams } from './experimentRouting.js';

// Chapters of the original transposable-element module (kept as the established export).
export const journeyGroups = modules[0].chapters;
// Every module with its chapters, in curriculum order.
export const curriculumModules = modules;

export function journeyStops(progress, labs, pathname, search = '') {
  const path = pathname.replace(/\/+$/, '');
  const currentHref = path === '/lab/transposable-elements'
    ? `${path}?experiment=${experimentFromParams(new URLSearchParams(search))}` : path;
  return allTopics.map(topic => ({
    ...topic, module: modules.find(module => module.topics.includes(topic)).id, href: topicHref(topic), current: topicHref(topic) === currentHref,
    completed: topicCompleted(topic, progress, labs),
  }));
}

// Keep native anchor scrolling/history and explicitly move keyboard focus.
export function focusJourneyTarget(event) {
  const id = event.currentTarget.hash.slice(1);
  event.currentTarget.ownerDocument.getElementById(id)?.focus({ preventScroll: true });
}
