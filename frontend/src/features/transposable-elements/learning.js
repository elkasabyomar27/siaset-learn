export {guidedStages, stageForCursor} from './guidedStages.js';
import {guidedStages} from './guidedStages.js';
export const checkpoints = {
  tn5:{ question:'After conservative Tn5 transposition, how many element copies remain overall?', options:['One — the element moves from donor to target.','Two — a new copy is made while the donor copy remains.','Zero — the element is consumed.'],correct:0, explanation:'Conservative movement relocates the original element. The two new flanking repeats are host-derived TSDs; they are not additional element copies.' },
  tn3:{ question:'What distinguishes the completed Tn3 cointegrate from the initial replicons?',options:['Two separate circles with one copy overall.','One circle containing both backbones and two directly oriented Tn3 copies.','One circle with one Tn3 and no donor backbone.'],correct:1,explanation:'Replicative transposition adds a second Tn3 copy and joins donor and target into one circular cointegrate.' },
  resolution:{question:'What should TnpR-mediated resolution do to the two Tn3 copies?',options:['Remove one copy to restore a total of one.','Cut out both elements.','Separate the replicon structures while preserving two copies overall.'],correct:2,explanation:'Recombination at the internal res sites partitions the cointegrate into two replicon products. Each retains one recombinant Tn3. Physical decatenation is not modeled.'}
};
// Retain the existing title-list API for callers and saved numeric stage records.
export const stages = Object.fromEntries(Object.entries(guidedStages).map(([id, steps]) => [id, steps.map(step => step.title)]));
export function canAdvance(scenario, stage, answers) {
  const step = guidedStages[scenario]?.[stage];
  return !!step && !step.final && (!step.checkpoint || answers[step.checkpoint] === checkpoints[step.checkpoint].correct);
}
export function actionForStep(scenario, stage, targetBoundary) {
  const type = guidedStages[scenario]?.[stage]?.action;
  if (!type) return null;
  return type === 'tn3.resolve' ? {type} : {type, targetBoundary};
}
