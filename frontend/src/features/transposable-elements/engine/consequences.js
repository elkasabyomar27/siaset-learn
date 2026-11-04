import {createInitial, transition} from './index.js';
// Independent symbolic block algebra, not a nucleotide or strand-level simulator.
export function rearrange(event, context = {homology:true, orientation:'direct', substrate:'intramolecular'}) {
  if (!context.homology) throw new Error('Homologous TE copies required');
  const before = ['L','TE→','X→','TE→','R'];
  if (event === 'deletion' && context.orientation === 'direct' && context.substrate === 'intramolecular') return {before, products:[['L','TE→','R'],['TE→','X→']], mechanism:'Homologous recombination between direct TE repeats; excised circle retained', topology:['linear','circular']};
  if (event === 'inversion' && context.orientation === 'inverted' && context.substrate === 'intramolecular') return {before:['L','TE→','X→','←TE','R'],products:[['L','TE→','←X','←TE','R']], mechanism:'Homologous recombination between inverted TE repeats',topology:['linear']};
  if (event === 'duplication' && context.orientation === 'direct' && context.substrate === 'misaligned-sisters') return {before:[...before,'/ sister: L TE→ X→ TE→ R'],products:[['L','TE→','X→','TE→','X→','TE→','R'],['L','TE→','R']],mechanism:'Unequal reciprocal crossover between misaligned sister chromatids; duplication AND deletion products',topology:['linear','linear']};
  throw new Error('Unsupported orientation or substrate for this event');
}
export function insertionExample(family) {
  if (!['tn5','tn3'].includes(family)) throw new Error('Unsupported family');
  const initial = createInitial(family);
  return {initial, result:transition(initial,{type:family === 'tn5' ? 'tn5.transpose' : 'tn3.replicate',targetBoundary:200}).state};
}
export function tsdEvidence(family) {
  const {result} = insertionExample(family);
  const pairs = result.molecules.flatMap(m => m.blocks.filter(b => b.kind === 'tsd'));
  return {state:result,pairs};
}
