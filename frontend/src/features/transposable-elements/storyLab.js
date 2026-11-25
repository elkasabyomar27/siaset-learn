// Hands-on story labs for Tn5 (topic 6) and Tn3 (topic 7).
// The learner performs physical-looking actions, but every molecular change is calculated by the
// engine, and progress maps onto the original guided stage indices so saved completion evidence
// (validLabEvidence: final stage, correct checkpoints, replayable events) is unchanged.
import { newHistory, execute } from './engine/index.js';
import { guidedStages, checkpoints } from './learning.js';
import { describeChange, friendlyError } from './labInsights.js';

export const FINAL_STAGE = {tn5: guidedStages.tn5.length - 1, tn3: guidedStages.tn3.length - 1};

/** Story steps shown to learners, each tied to a guided stage index. */
export const STORY = {
  tn5: [
    {stage: 0, title: 'Recruit transposase', task: 'Press and hold each gold end of Tn5 until the ring fills, to bind a transposase to each end.'},
    {stage: 1, title: 'Predict, then cut and carry', task: 'Predict the copy number. Then swipe down across each end to cut Tn5 free, and drag it onto the target ring.'},
    {stage: 2, title: 'See what was calculated', task: 'Tn5 is now in the target. The donor is left in two broken pieces. Tap the inserted Tn5 to inspect the insertion.'},
    {stage: 3, title: 'Find the host repeats', task: 'Tap each purple repeat that now flanks Tn5 in the target.'},
    {stage: 4, title: 'Review and save', task: 'One element moved; the target site was duplicated. Save your completed lab.'},
  ],
  tn3: [
    {stage: 0, title: 'Bring the circles together', task: 'Tap a spot on the target ring to choose where Tn3 will join it.'},
    {stage: 1, title: 'Predict the joined product', task: 'Strand transfer joins Tn3’s ends to the target. Predict the structure that replication will complete.'},
    {stage: 2, title: 'Replicate through Tn3', task: 'Start replication. DNA synthesis copies Tn3 and fuses both circles into one cointegrate.'},
    {stage: 3, title: 'Inspect the cointegrate', task: 'Tap both Tn3 copies in the cointegrate.'},
    {stage: 4, title: 'Resolve with TnpR', task: 'Predict what resolution does, dock TnpR on a res site, then resolve.'},
    {stage: 5, title: 'Review and save', task: 'Two circles, one Tn3 each: resolution separated them without removing a copy. Save your completed lab.'},
  ],
};

export function newStory(scenario) {
  if (!['tn5', 'tn3'].includes(scenario)) throw Error('Unknown scenario.');
  return {scenario, stage: 0, answers: {}, history: newHistory(scenario), bound: [], cut: [], inspected: [], boundary: null, tnpR: false, change: null, message: null};
}

const answered = (s, id) => s.answers[id] === checkpoints[id].correct;
const add = (list, v) => list.includes(v) ? list : [...list, v];
const note = (s, text, ok = false) => ({...s, message: {text, ok}});

/** Apply one learner action. Invalid or premature actions return the state with a message only. */
export function storyAction(s, action) {
  const {scenario, stage} = s;
  if (action.type === 'answer') {
    const step = guidedStages[scenario][stage];
    if (step?.checkpoint !== action.checkpoint) return note(s, 'That question is not open right now.');
    const next = {...s, answers: {...s.answers, [action.checkpoint]: action.value}, message: null};
    // An explanatory checkpoint stage (Tn3 strand transfer) completes as soon as the prediction is right.
    return scenario === 'tn3' && stage === 1 && answered(next, 'tn3') ? {...next, stage: 2} : next;
  }
  if (scenario === 'tn5') {
    if (action.type === 'bind' && stage === 0) {
      const bound = add(s.bound, action.end);
      return {...s, bound, stage: bound.length === 2 ? 1 : 0, message: bound.length === 2 ? {ok: true, text: 'Both ends are held by transposase and brought together.'} : null};
    }
    if (action.type === 'cut' && stage === 1) {
      if (!answered(s, 'tn5')) return note(s, 'Make a correct prediction before cutting.');
      return {...s, cut: add(s.cut, action.end), message: null};
    }
    if (action.type === 'insert' && stage === 1) {
      if (s.cut.length < 2) return note(s, 'Cut Tn5 free at both ends first.');
      const boundary = clampBoundary(action.boundary);
      return engineStep({...s, boundary}, {type: 'tn5.transpose', targetBoundary: boundary}, 2);
    }
    if (action.type === 'continue' && stage === 2) return {...s, stage: 3, message: null};
    if (action.type === 'inspect' && stage === 3 && ['target-tsd-left', 'target-tsd-right'].includes(action.feature)) {
      const inspected = add(s.inspected, action.feature);
      return {...s, inspected, stage: inspected.length === 2 ? 4 : 3, message: {ok: true, text: 'A 9 bp host repeat: target DNA copied on each side of Tn5, not part of the element.'}};
    }
  } else {
    if (action.type === 'dock-target' && stage === 0) return {...s, boundary: clampBoundary(action.boundary), stage: 1, message: {ok: true, text: 'Target chosen. Tn3’s ends will be joined to the target here.'}};
    if (action.type === 'replicate' && stage === 2) return engineStep(s, {type: 'tn3.replicate', targetBoundary: s.boundary}, 3);
    if (action.type === 'inspect' && stage === 3 && ['copy-1', 'copy-2'].includes(action.feature)) {
      const inspected = add(s.inspected, action.feature);
      return {...s, inspected, stage: inspected.length === 2 ? 4 : 3, message: {ok: true, text: 'A complete Tn3 copy with its own res site. Both copies point the same way.'}};
    }
    if (action.type === 'enzyme' && stage === 4) return {...s, tnpR: !!action.available, message: null};
    if (action.type === 'resolve' && stage === 4) {
      if (!answered(s, 'resolution')) return note(s, 'Make a correct prediction about resolution first.');
      return engineStep(s, {type: 'tn3.resolve', resolvaseAvailable: s.tnpR}, 5);
    }
  }
  return note(s, 'That step is not available yet.');
}

function engineStep(s, action, nextStage) {
  try {
    const history = execute(s.history, action);
    return {...s, history, stage: nextStage, change: describeChange(s.history.state, history.state), message: null};
  } catch (e) {
    return note(s, friendlyError(e));
  }
}

export function clampBoundary(value) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(899, n)) : 200;
}

/** Ring angle (degrees clockwise from top) → target boundary in symbolic units. */
export function boundaryFromAngle(angle, length = 900) {
  return clampBoundary(((angle % 360) + 360) % 360 / 360 * length);
}

export function isComplete(s) {
  return s.stage === FINAL_STAGE[s.scenario];
}
