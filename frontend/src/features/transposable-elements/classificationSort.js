// Sort elements by intermediate (Class I: RNA + reverse transcription; Class II: DNA-based)
// and by copy outcome, to show that class alone does not fix copy number.

export const CLASS_CARDS = [
  {id: 'ty', name: 'Ty (yeast)', steps: ['DNA', 'RNA copy', 'reverse transcription', 'new DNA inserted'], cls: 'I', copies: 'increase',
    why: 'An RNA intermediate is reverse-transcribed into new DNA; the original stays, so copies increase.'},
  {id: 'tn5', name: 'Tn5', steps: ['element DNA', 'moved as DNA', 'target DNA'], cls: 'II', copies: 'same',
    why: 'DNA-based and conservative: the one element relocates.'},
  {id: 'tn3', name: 'Tn3', steps: ['element DNA', 'replicated as DNA', 'cointegrate'], cls: 'II', copies: 'increase',
    why: 'DNA-based but replicative: the cointegrate holds two copies. Class II is not always cut-and-paste.'},
  {id: 'hypo-rna', name: 'Hypothetical element X', steps: ['DNA', 'RNA copy', 'reverse transcription', 'new DNA'], cls: 'I', copies: 'increase', hypothetical: true,
    why: 'The RNA intermediate plus reverse transcription identifies Class I, even though the final product is DNA.'},
  {id: 'hypo-cut', name: 'Hypothetical element Y', steps: ['element DNA', 'cut out as DNA', 'pasted elsewhere'], cls: 'II', copies: 'same', hypothetical: true,
    why: 'No RNA step: DNA-based, and cut-and-paste keeps one copy.'},
];
export const CLASS_LABEL = {I: 'Class I · RNA intermediate', II: 'Class II · DNA-based'};
export const COPY_LABEL = {same: 'Copy number unchanged', increase: 'Copy number increases'};

export function checkPlacement(cardId, cls, copies) {
  const card = CLASS_CARDS.find(c => c.id === cardId);
  if (!card) throw Error('Unknown card.');
  const classOk = card.cls === cls, copiesOk = card.copies === copies;
  let text;
  if (classOk && copiesOk) text = card.why;
  else if (!classOk && copiesOk) text = card.steps.includes('RNA copy') ? 'Look for the intermediate: an RNA copy that is reverse-transcribed means Class I, even though the end product is DNA.' : 'There is no RNA step here: the movement is DNA-based, so Class II.';
  else if (classOk) text = card.copies === 'increase' ? 'Check the copy count: the original is kept and a new copy is made.' : 'Check the copy count: the same single element ends up somewhere else.';
  else text = 'Both axes need another look: first find the intermediate (RNA or DNA), then count copies before and after.';
  return {correct: classOk && copiesOk, classOk, copiesOk, text};
}

/** True once every card sits in its correct cell. */
export function sortComplete(placements) {
  return CLASS_CARDS.every(c => placements[c.id] === `${c.cls}-${c.copies}`);
}
