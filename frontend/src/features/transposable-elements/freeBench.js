// Free hands-on sandbox: any action, any order. Physical preconditions (transposase must hold an
// end before it can cut; Tn5 must be free before it can be inserted; circles must touch before
// replication) give teaching feedback; every molecular change is decided by the engine. Nothing here
// records progress.
import { newHistory, execute } from './engine/index.js';
import { describeChange, friendlyError, outcomeSummary } from './labInsights.js';
import { clampBoundary } from './storyLab.js';

export function newBench(scenario) {
  if (!['tn5', 'tn3'].includes(scenario)) throw Error('Unknown scenario.');
  return {scenario, history: newHistory(scenario), bound: [], cut: [], joined: false, boundary: null, tnpR: false, change: null, message: null};
}

const ACTION_NAME = {bind: 'Bind transposase', cut: 'Cut an end', insert: 'Insert Tn5', 'dock-target': 'Bring circles together', replicate: 'Replicate', enzyme: 'TnpR', resolve: 'Resolve', inspect: 'Inspect'};

/** Returns {bench, entry}: the new bench and a notebook entry describing the attempt. */
export function benchAction(b, action) {
  const phase = b.history.state.phase, log = (ok, text, extra = {}) => ({bench: {...b, ...extra, message: {ok, text}}, entry: {scenario: b.scenario, action: action.type, name: ACTION_NAME[action.type] || action.type, ok, text, detail: action.end || (action.boundary != null ? `site ${clampBoundary(action.boundary)}` : action.available != null ? (action.available ? 'docked' : 'removed') : '')}});
  if (b.scenario === 'tn5') {
    if (action.type === 'bind') {
      if (phase !== 'initial') return log(false, 'Tn5 has already left the donor. Restart to try again.');
      if (b.bound.includes(action.end)) return log(false, `Transposase already holds the ${action.end} end.`);
      const bound = [...b.bound, action.end];
      return log(true, bound.length === 2 ? 'Both ends are held and brought together.' : `Transposase bound to the ${action.end} end. The other end is still free.`, {bound});
    }
    if (action.type === 'cut') {
      if (phase !== 'initial') return log(false, 'There is nothing left to cut: Tn5 has already moved.');
      if (!b.bound.includes(action.end)) return log(false, `Nothing cuts the ${action.end} end: transposase is the enzyme that cuts, and none is bound there.`);
      if (b.cut.includes(action.end)) return log(false, `The ${action.end} end is already cut.`);
      const cut = [...b.cut, action.end];
      return log(true, cut.length === 2 ? 'Both ends cut. Tn5 is free, held by transposase. The donor is broken.' : `The ${action.end} end is cut; Tn5 is still attached at the other end.`, {cut});
    }
    if (action.type === 'insert') {
      if (phase === 'initial' && b.cut.length < 2) return log(false, 'Tn5 is still attached to the donor. Cut both ends first.');
      return engine(b, {type: 'tn5.transpose', targetBoundary: clampBoundary(action.boundary)}, log, {boundary: clampBoundary(action.boundary)});
    }
    if (action.type === 'inspect') return log(true, 'A 9 bp host repeat: target DNA copied on each side of Tn5, not part of the element.');
  } else {
    if (action.type === 'dock-target') {
      if (phase !== 'initial') return log(false, 'The circles are already joined into a cointegrate. Restart to choose another site.');
      return log(true, `Target brought into contact at site ${clampBoundary(action.boundary)}.`, {joined: true, boundary: clampBoundary(action.boundary)});
    }
    if (action.type === 'replicate') {
      if (phase === 'initial' && !b.joined) return log(false, 'The two circles are not in contact. Bring the target to the donor first.');
      return engine(b, {type: 'tn3.replicate', targetBoundary: b.boundary}, log);
    }
    if (action.type === 'enzyme') return log(true, action.available ? 'TnpR docked on res.' : 'TnpR removed.', {tnpR: !!action.available});
    if (action.type === 'resolve') return engine(b, {type: 'tn3.resolve', resolvaseAvailable: b.tnpR}, log);
    if (action.type === 'inspect') return log(true, 'A complete Tn3 copy with its own res site.');
  }
  return log(false, 'That action does not apply to this element.');
}

function engine(b, action, log, extra = {}) {
  try {
    const history = execute(b.history, action);
    const change = describeChange(b.history.state, history.state);
    const res = log(true, change.headline, {...extra, history, change});
    return {...res, entry: {...res.entry, outcome: outcomeSummary(history.state)}};
  } catch (e) {
    return log(false, friendlyError(e));
  }
}

/** Sandbox investigations, satisfied by notebook entries. */
export const BENCH_GOALS = [
  {id: 'cut-unbound', title: 'Try to cut an end without transposase', done: n => n.some(e => e.action === 'cut' && !e.ok && /none is bound/.test(e.text))},
  {id: 'tn5-move', title: 'Move Tn5 into the target', done: n => n.some(e => e.action === 'insert' && e.ok)},
  {id: 'tn5-twice', title: 'Try to insert the same Tn5 twice', done: n => n.some(e => e.action === 'insert' && !e.ok && /initial donor/.test(e.text))},
  {id: 'tn3-fuse', title: 'Make a Tn3 cointegrate', done: n => n.some(e => e.action === 'replicate' && e.ok)},
  {id: 'no-tnpr', title: 'Try to resolve without TnpR', done: n => n.some(e => e.action === 'resolve' && !e.ok && /TnpR/.test(e.text))},
  {id: 'resolve', title: 'Resolve the cointegrate with TnpR', done: n => n.some(e => e.action === 'resolve' && e.ok)},
];
