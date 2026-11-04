import topics from './curriculum/topics.json' with { type: 'json' };
import { topicHref } from './curriculum/lessons.js';
import { topicCompleted } from './learnerRecords.js';
import { experimentFromParams } from './experimentRouting.js';

export const journeyGroups = [
  { id: 'recognize', title: 'Recognize an element', question: 'What is the evidence for mobility, which DNA belongs to the element, and what moves through which intermediate?', topics: ['introduction', 'discovery', 'anatomy', 'classification'] },
  { id: 'mechanism', title: 'Follow a mechanism', question: 'What happens to copies and replicons during the two worked pathways?', topics: ['dna-diversity', 'conservative', 'replicative'] },
  { id: 'architecture', title: 'Read genetic architecture', question: 'How are movement functions and cargo organized into modules?', topics: ['insertion-sequences', 'composite'] },
  { id: 'insertion', title: 'Interpret an insertion', question: 'Which structural, phenotypic, transcriptional and junction-level claims follow from the evidence?', topics: ['genomic-consequences', 'phenotypes', 'expression', 'tsd'] },
  { id: 'context', title: 'Place movement in context', question: 'What permits movement, and when does DNA enter a different cell?', topics: ['regulation', 'bacterial-hgt'] },
];

export function journeyStops(progress, labs, pathname, search = '') {
  const path = pathname.replace(/\/+$/, '');
  const currentHref = path === '/lab/transposable-elements'
    ? `${path}?experiment=${experimentFromParams(new URLSearchParams(search))}` : path;
  return [...topics].sort((a, b) => a.order - b.order).map(topic => ({
    ...topic, href: topicHref(topic), current: topicHref(topic) === currentHref,
    completed: topicCompleted(topic, progress, labs),
  }));
}

// Keep native anchor scrolling/history and explicitly move keyboard focus.
export function focusJourneyTarget(event) {
  const id = event.currentTarget.hash.slice(1);
  event.currentTarget.ownerDocument.getElementById(id)?.focus({ preventScroll: true });
}
