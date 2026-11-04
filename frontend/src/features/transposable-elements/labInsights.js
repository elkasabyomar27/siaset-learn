// Read-only summaries of engine states for learners. Nothing here calculates molecular structure;
// it only compares states the engine already produced.
import { copies } from './engine/model.js';

const elementHome = state => {
  const homes = {};
  for (const m of state.molecules) for (const b of m.blocks) if (b.kind === 'element') homes[b.copyId] = m;
  return homes;
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Compact facts about one state, used for the notebook and comparisons. */
export function outcomeSummary(state) {
  const tsds = state.molecules.flatMap(m => m.blocks.filter(b => b.kind === 'tsd'));
  return {
    phase: state.phase,
    copies: copies(state).length,
    structures: state.molecules.length,
    topologies: state.molecules.map(m => m.topology),
    tsdCount: tsds.length,
    tsdBp: tsds[0]?.bp ?? null,
    resSites: state.molecules.reduce((n, m) => n + m.features.filter(f => f.kind === 'res').length, 0),
  };
}

/**
 * What changed between two engine states, phrased for learners.
 * highlight maps molecule id -> feature ids that are new in `after`.
 */
export function describeChange(before, after) {
  const prior = new Set(before.molecules.flatMap(m => m.features.map(f => `${m.id}|${f.id}`)));
  const highlight = {};
  for (const m of after.molecules) for (const f of m.features) {
    if (f.kind === 'backbone' || f.parentId) continue;
    if (!prior.has(`${m.id}|${f.id}`)) (highlight[m.id] ||= []).push(f.id);
  }
  const a = outcomeSummary(before), b = outcomeSummary(after), items = [];
  if (b.copies !== a.copies) items.push({kind: 'copies', text: `Element copies: ${a.copies} → ${b.copies}. ${b.copies > a.copies ? 'A new copy was made; the original was kept.' : 'A copy was lost.'}`});
  else items.push({kind: 'copies', text: `Element copies: still ${b.copies}. ${after.scenario === 'tn5' ? 'The element moved; it was not copied.' : 'No copy was added or lost.'}`});
  const homesBefore = elementHome(before), homesAfter = elementHome(after);
  for (const [copyId, m] of Object.entries(homesAfter)) {
    const was = homesBefore[copyId];
    if (!was) items.push({kind: 'element', text: `New copy: in the ${m.name}.`});
    else if (was.id !== m.id || was.name !== m.name) items.push({kind: 'element', text: `Now in the ${m.name} (was: ${was.name}).`});
  }
  if (b.tsdCount > a.tsdCount) items.push({kind: 'tsd', text: `${plural(b.tsdCount - a.tsdCount, 'new host repeat')} (${b.tsdBp} bp each) flank the element. They come from the target DNA.`});
  if (b.structures !== a.structures) items.push({kind: 'structures', text: `DNA molecules: ${a.structures} → ${b.structures}.`});
  if (b.resSites !== a.resSites) items.push({kind: 'res', text: `res sites: ${a.resSites} → ${b.resSites}.`});
  if (after.scenario === 'tn5' && before.phase === 'initial' && after.phase !== 'initial') items.push({kind: 'donor', text: 'The donor is left in two broken pieces (repair not modelled).'});
  const headline = {
    inserted: 'Tn5 moved into the target.',
    cointegrate: 'Donor and target fused into one cointegrate.',
    resolved: 'The cointegrate was resolved into two molecules.',
  }[after.phase] || 'The molecules changed.';
  return {headline, items, highlight};
}

/** Learner-facing text for an engine rejection. The engine message is already plain language. */
export function friendlyError(error) {
  if (error?.code === 'TNPR') return 'Nothing happened: TnpR resolvase is not available, so the cointegrate cannot be resolved. Dock TnpR and try again.';
  return `Nothing changed: ${error?.message || 'the engine could not apply this step.'}`;
}

/** Sandbox investigations; each is satisfied by entries in the experiment notebook. */
export const INVESTIGATIONS = [
  {id: 'tn5-move', title: 'Move Tn5 and count the copies', done: log => log.some(e => e.action === 'tn5.transpose' && e.ok)},
  {id: 'tn3-fuse', title: 'Make a Tn3 cointegrate', done: log => log.some(e => e.action === 'tn3.replicate' && e.ok)},
  {id: 'no-tnpr', title: 'Try to resolve without TnpR', done: log => log.some(e => e.action === 'tn3.resolve' && !e.ok)},
  {id: 'resolve', title: 'Resolve the cointegrate with TnpR', done: log => log.some(e => e.action === 'tn3.resolve' && e.ok)},
  {id: 'origin', title: 'Insert across the origin (boundary 895)', done: log => log.some(e => e.boundary === 895 && e.ok && e.action !== 'tn3.resolve')},
  {id: 'compare', title: 'Run both mechanisms and compare copy numbers', done: log => ['tn5', 'tn3'].every(s => log.some(e => e.scenario === s && e.ok))},
];

export function notebookEntry({scenario, action, boundary, tnpR, prediction, predictionCorrect, before, after, error}) {
  const ok = !error;
  return {
    scenario, action, boundary: action === 'tn3.resolve' ? null : boundary, tnpR: action === 'tn3.resolve' ? tnpR : null,
    prediction, predictionCorrect, ok,
    outcome: ok ? outcomeSummary(after) : outcomeSummary(before),
    note: ok ? describeChange(before, after).headline : friendlyError(error),
  };
}
