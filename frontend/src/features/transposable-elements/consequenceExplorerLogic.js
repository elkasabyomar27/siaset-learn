// The reveal step of ConsequenceExplorer as a pure function. The lesson evidence rule lives here:
// a correct prediction reports the variant index, a wrong or missing one reports nothing.
import {rearrange, insertionExample, tsdEvidence} from './engine/consequences.js';

export function reveal(lesson, index, prediction) {
  const variant = lesson.variants[index];
  if (!prediction) return {result: null, inspect: null};
  let calculated = null;
  if (lesson.id === 'genomic-consequences') {
    calculated = index === 0 ? insertionExample('tn5') : rearrange(variant.outcome, {homology: true, orientation: index === 2 ? 'inverted' : 'direct', substrate: index === 3 ? 'misaligned-sisters' : 'intramolecular'});
  }
  if (lesson.id === 'tsd' && index < 2) calculated = tsdEvidence(index === 0 ? 'tn5' : 'tn3');
  const correct = prediction === variant.outcome;
  return {result: {calculated, correct}, inspect: correct ? index : null};
}

// What the reveal button does: show the result and, on a correct prediction only, record the
// inspection with exactly the same index.
export function runReveal(lesson, index, prediction, {onInspect, setResult}) {
  const r = reveal(lesson, index, prediction);
  if (r.result) setResult(r.result);
  if (r.inspect !== null) onInspect(r.inspect);
  return r;
}

export const predictionOptions = lesson => [...new Set(lesson.variants.map(v => v.outcome))];
