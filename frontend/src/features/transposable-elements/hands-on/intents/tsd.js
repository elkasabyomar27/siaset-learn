// Gesture -> model-input mapping for TsdBuilder. Outputs are what the old controls produced:
// the two sliders become {stagger, cut} (same limits and clamping), and the old "Next step"
// button becomes {stage: 2} / {fill: side} / {stage: 3}, still gated behind the prediction.
import { STAGGER_RANGE, clampCut } from '../../tsdJourney.js';

const clampStagger = n => Math.max(STAGGER_RANGE[0], Math.min(STAGGER_RANGE[1], Math.round(n)));
export const SIDES = ['left', 'right'];

// A cut mark dropped on boundary `pos`: the top mark moves the top cut (the bottom cut stays put,
// so the stagger changes), the bottom mark moves the bottom cut (the top cut stays, the stagger
// changes). With the stagger hidden (`locked`, the mystery element) only the cut position moves.
// current: {cut, stagger, stage, predicted, locked}
export function tsdIntent(g, current = {}) {
  if (!g) return null;
  const {cut = 4, stagger = 9, stage = 0, predicted = false, locked = false} = current;
  if (g.kind !== 'drop') return null;
  if (g.part === 'cut' && Number.isFinite(g.pos)) {
    if (locked) return g.mark === 'top' ? {cut: clampCut(g.pos, stagger), stagger, stage: 1} : null;
    if (g.mark === 'top') { const s = clampStagger(cut + stagger - g.pos); return {cut: clampCut(g.pos, s), stagger: s, stage: 1}; }
    if (g.mark === 'bottom') { const s = clampStagger(g.pos - cut); return {cut: clampCut(cut, s), stagger: s, stage: 1}; }
    return null;
  }
  // The element is dropped into the gap once the length has been predicted.
  if (g.part === 'element' && g.target === 'gap') return stage === 1 && predicted ? {stage: 2} : null;
  // The polymerase fills the left gap and the right gap; the stage advances when both are filled.
  if (g.part === 'polymerase' && SIDES.includes(g.target)) return stage === 2 ? {fill: g.target} : null;
  return null;
}

// Filling gaps: returns the new set of filled sides and whether the gaps are all filled.
export function fillGap(filled, side) {
  const next = filled.includes(side) ? filled : [...filled, side];
  return {filled: next, done: SIDES.every(s => next.includes(s))};
}
