// Stage-by-stage copy ledger for the two executable mechanisms, computed by the real engine.
import { newHistory, execute } from './engine/index.js';
import { outcomeSummary } from './labInsights.js';

export const LANES = {
  tn5: {name: 'Tn5 · conservative', steps: [{label: 'Start', action: null}, {label: 'Transpose', action: {type: 'tn5.transpose', targetBoundary: 200}}]},
  tn3: {name: 'Tn3 · replicative', steps: [{label: 'Start', action: null}, {label: 'Replicate', action: {type: 'tn3.replicate', targetBoundary: 200}}, {label: 'Resolve', action: {type: 'tn3.resolve', resolvaseAvailable: true}}]},
};

/** Every stage of a lane as engine states plus summaries. */
export function laneStages(lane) {
  const spec = LANES[lane];
  if (!spec) throw Error('Unknown lane.');
  let history = newHistory(lane);
  return spec.steps.map(step => {
    if (step.action) history = execute(history, step.action);
    return {label: step.label, state: history.state, summary: outcomeSummary(history.state)};
  });
}

export const COPY_CHOICES = [1, 2, 3];

export function copyFeedback(lane, stageIndex, predicted) {
  const stages = laneStages(lane), actual = stages[stageIndex].summary.copies, before = stages[stageIndex - 1]?.summary.copies;
  const correct = predicted === actual;
  const why = lane === 'tn5' ? 'Conservative transposition moves the one element; it is not copied.'
    : stageIndex === 1 ? 'Replication through the element makes a second copy inside one cointegrate.'
    : 'Resolution separates the cointegrate into two molecules; both copies remain.';
  return {correct, actual, before, text: `${correct ? 'Correct' : `Not quite: ${actual}, not ${predicted}`}. ${why}`};
}
