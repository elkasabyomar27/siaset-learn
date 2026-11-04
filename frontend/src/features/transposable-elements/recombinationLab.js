// Learner-facing wrapper around the lesson's rearrangement engine (engine/consequences.js).
// Products always come from rearrange(); this file only maps choices and describes results.
import { rearrange } from './engine/consequences.js';

export const ORIENTATIONS = {direct: 'Same direction (direct repeats)', inverted: 'Opposite directions (inverted repeats)'};
export const SUBSTRATES = {intramolecular: 'Within one chromosome', 'misaligned-sisters': 'Between misaligned sister chromatids'};

export function eventFor(orientation, substrate) {
  if (orientation === 'direct' && substrate === 'intramolecular') return 'deletion';
  if (orientation === 'inverted' && substrate === 'intramolecular') return 'inversion';
  if (orientation === 'direct' && substrate === 'misaligned-sisters') return 'duplication';
  return null;
}

/** Recombine two homologous copies. Returns products from the engine, or an explanation of why not. */
export function recombine({orientation, substrate, homology = true}) {
  if (!homology) return {ok: false, text: 'The two copies are not similar enough to pair: no homologous recombination is modelled.'};
  const event = eventFor(orientation, substrate);
  if (!event) return {ok: false, text: 'Inverted copies on misaligned sisters are not one of the selected outcomes in this lesson.'};
  const r = rearrange(event, {homology: true, orientation, substrate});
  return {ok: true, event, before: r.before.filter(b => !b.startsWith('/')), products: r.products.map((blocks, i) => ({blocks, topology: r.topology[i]})), mechanism: r.mechanism, text: SUMMARY[event]};
}

const SUMMARY = {
  deletion: 'Direct copies paired and recombined: segment X left the chromosome on a circle with one copy. The chromosome keeps one copy. Both products are traced here; what later happens to the circle is not modelled.',
  inversion: 'Inverted copies paired and recombined: segment X now reads in the opposite direction. No DNA is gained or lost.',
  duplication: 'Misaligned sisters crossed over unequally: one sister now has X twice, the other has lost X. Both products exist together.',
};

/** Count of each block label across products: used to show material is traced, not invented. */
export function blockTally(blockLists) {
  const tally = {};
  for (const blocks of blockLists) for (const b of blocks) { const key = b.replace(/[→←]/g, ''); tally[key] = (tally[key] || 0) + 1; }
  return tally;
}

export const RECOMB_GOALS = [
  {id: 'deletion', title: 'Excise a segment as a circle'},
  {id: 'inversion', title: 'Flip a segment without losing any DNA'},
  {id: 'duplication', title: 'Make a duplication (and find its partner)'},
  {id: 'no-pairing', title: 'Find a case where recombination cannot happen'},
];
