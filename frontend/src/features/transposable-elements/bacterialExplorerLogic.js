// The investigate step of BacterialExplorer as a pure function. The lesson evidence rule lives here:
// a correct prediction reports the variant index (so the lesson records it as inspected), a wrong or
// missing one reports nothing. The view only renders the result and forwards `inspect`.
import {resistanceExample, bacterialTransition, targetingCompatible, predictionFeedback} from './engine/bacterial.js';

export function investigate(lesson, index, prediction) {
  const variant = lesson.variants[index];
  let model = null, note = 'Explanatory classification only; no molecular transition calculated.';
  if (Number.isInteger(variant.stage)) {
    model = resistanceExample(variant.stage);
    note = variant.stage === 0 ? 'Calculated initial symbolic state.' : 'Calculated bounded states: Tn5 insertion and conjugation remain separate operations.';
  }
  if (variant.activity === 'blocked') {
    const s = resistanceExample(1).state; s.transfer.conjugative = false;
    try { bacterialTransition(s, 'conjugate'); } catch (e) { note = `Calculated gate rejection: ${e.message}. State unchanged.`; model = {state: s, events: []}; }
  }
  if (['tnsd', 'tnse', 'mismatch'].includes(variant.activity)) {
    const compatible = targetingCompatible(variant.activity === 'tnsd' ? 'tnsd' : 'tnse', variant.activity === 'tnse' ? 'replication-transfer' : 'attTn7-glmS');
    note = `Context compatibility: ${compatible ? 'supported' : 'unsupported'}. No insertion state, coordinate or probability calculated.`;
  }
  const feedback = predictionFeedback(variant.outcome, prediction, variant.explanation);
  return {result: {model, note, ...feedback}, inspect: feedback.correct ? index : null};
}

// What the Test reasoning button does: show the result and, on a correct prediction only,
// record the inspection with exactly the same index.
export function runInvestigation(lesson, index, prediction, {onInspect, setResult}) {
  const r = investigate(lesson, index, prediction);
  setResult(r.result);
  if (r.inspect !== null) onInspect(r.inspect);
  return r;
}

export const predictionOptions = lesson => [...new Set(lesson.variants.map(v => v.outcome))];
