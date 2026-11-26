// Gesture -> model-input mapping for CopyLedger: holding the generation crank is exactly what the old
// "advance" button did, and the old button was disabled until a copy-number guess was chosen.
// current: {guess}. The guess itself stays a question.
export function copyLedgerIntent(g, current = {}) {
  if (!g || g.kind !== 'hold' || g.target !== 'crank') return null;
  return current.guess === null || current.guess === undefined ? null : {type: 'advance'};
}
