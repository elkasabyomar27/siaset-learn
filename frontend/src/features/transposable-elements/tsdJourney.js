// Symbolic model of how staggered strand transfer produces target-site duplications (TSDs).
// Positions are schematic host units, not nucleotides; no sequence is asserted.
// Rule taught: the element joins the two target strands at cuts `stagger` positions apart.
// Each flank is left with a single-stranded gap of that length; filling both gaps copies
// the same host interval twice, giving two direct repeats of `stagger` positions.

export const TSD_STAGES = [
  {id: 'target', title: 'Intact target DNA', note: 'Two host strands, paired along their whole length.'},
  {id: 'cut', title: 'Staggered cuts', note: 'The two strands are cut at different positions. Count the positions between the cuts.'},
  {id: 'join', title: 'Element joins', note: 'The element is joined to both cut ends. Each flank is left with a single-stranded gap.'},
  {id: 'fill', title: 'Gaps filled', note: 'DNA synthesis fills both gaps. The host interval between the cuts now appears on both sides.'},
];

export const ELEMENT_WIDTH = 8;
export const HOST_LENGTH = 20;
export const STAGGER_RANGE = [2, 10];
export const PRESETS = [{id: 'tn5', label: 'Tn5', stagger: 9}, {id: 'tn3', label: 'Tn3', stagger: 5}];

export function clampCut(cut, stagger, n = HOST_LENGTH) {
  const max = n - stagger - 2;
  return Math.max(2, Math.min(max, Math.round(cut)));
}

export function validSetup({cut, stagger, n = HOST_LENGTH}) {
  return Number.isInteger(stagger) && stagger >= STAGGER_RANGE[0] && stagger <= STAGGER_RANGE[1] &&
    Number.isInteger(cut) && cut === clampCut(cut, stagger, n);
}

/**
 * Layout for one stage. Host cells keep stable ids across stages so the view can animate them.
 * x is measured in position units from the left end of the drawing.
 */
export function tsdLayout({cut, stagger, stage, n = HOST_LENGTH, elementWidth = ELEMENT_WIDTH}) {
  if (!validSetup({cut, stagger, n})) throw Error('Invalid cut or stagger.');
  const stageIndex = typeof stage === 'number' ? stage : TSD_STAGES.findIndex(s => s.id === stage);
  if (stageIndex < 0 || stageIndex >= TSD_STAGES.length) throw Error('Unknown stage.');
  const inInterval = i => i >= cut && i < cut + stagger;
  const split = stageIndex >= 2;
  const shift = stagger + elementWidth;
  const cells = [];
  for (let i = 0; i < n; i++) {
    // Top strand is cut before `cut`; bottom strand before `cut + stagger`.
    const topRight = i >= cut, bottomRight = i >= cut + stagger;
    const marked = stageIndex >= 1 && inInterval(i);
    cells.push({id: `top-${i}`, strand: 'top', pos: i, x: split && topRight ? i + shift : i,
      piece: topRight ? 'right' : 'left', kind: marked ? 'tsd' : 'host', synthesized: false});
    cells.push({id: `bottom-${i}`, strand: 'bottom', pos: i, x: split && bottomRight ? i + shift : i,
      piece: bottomRight ? 'right' : 'left', kind: marked ? 'tsd' : 'host', synthesized: false});
  }
  const gaps = [], repeats = [];
  if (split) {
    for (let i = cut; i < cut + stagger; i++) {
      // Left flank: bottom strand overhangs, top strand opposite it is missing.
      // Right flank: top strand overhangs, bottom strand opposite it is missing.
      if (stageIndex === 2) {
        gaps.push({id: `gap-top-${i}`, strand: 'top', pos: i, x: i, piece: 'left'});
        gaps.push({id: `gap-bottom-${i}`, strand: 'bottom', pos: i, x: i + shift, piece: 'right'});
      } else {
        cells.push({id: `top-new-${i}`, strand: 'top', pos: i, x: i, piece: 'left', kind: 'tsd', synthesized: true});
        cells.push({id: `bottom-new-${i}`, strand: 'bottom', pos: i, x: i + shift, piece: 'right', kind: 'tsd', synthesized: true});
      }
    }
    if (stageIndex === 3) {
      repeats.push({side: 'left', x: cut, width: stagger, from: cut + 1, to: cut + stagger});
      repeats.push({side: 'right', x: cut + shift, width: stagger, from: cut + 1, to: cut + stagger});
    }
  }
  const nicks = stageIndex === 1 ? [{strand: 'top', x: cut}, {strand: 'bottom', x: cut + stagger}] : [];
  const element = split ? {x: cut + stagger, width: elementWidth} : null;
  return {stage: TSD_STAGES[stageIndex], stageIndex, cells, gaps, nicks, element, repeats,
    width: split ? n + shift : n, interval: {from: cut + 1, to: cut + stagger}};
}

export function tsdOutcome(stagger) {
  return {repeatLength: stagger, copies: 2};
}

/** Distinct answer choices for "how long is each repeat?", always containing the right one. */
export function lengthChoices(stagger) {
  return [...new Set([stagger, stagger * 2, stagger - 1, 0])].filter(v => v >= 0).sort((a, b) => a - b);
}

export function predictionFeedback(stagger, predicted) {
  if (predicted === stagger) return {correct: true, text: `Correct: each repeat is ${stagger} positions, the distance between the two cuts.`};
  if (predicted === stagger * 2) return {correct: false, text: `Each flank gets its own copy of the ${stagger}-position interval, so the repeats are ${stagger} positions each, not ${stagger * 2} in one block.`};
  if (predicted === 0) return {correct: false, text: `The gaps are filled, not removed. Filling them copies the ${stagger}-position interval onto both sides.`};
  return {correct: false, text: `Count the positions between the top and bottom cuts: there are ${stagger}, so each repeat is ${stagger} positions.`};
}

export function describeLayout(layout) {
  const {stageIndex, interval} = layout;
  const span = `host positions ${interval.from}–${interval.to}`;
  const Span = `Host positions ${interval.from}–${interval.to}`;
  return [
    `The target is an unbroken double strand of ${HOST_LENGTH} host positions.`,
    `The top strand is cut before position ${interval.from}; the bottom strand is cut after position ${interval.to}. The cuts are ${interval.to - interval.from + 1} positions apart, enclosing ${span}.`,
    `The element sits between the two host pieces. ${Span} are single-stranded on both flanks: bottom strand only on the left, top strand only on the right.`,
    `Both gaps are filled. ${Span} are now double-stranded on both sides of the element: two direct repeats of ${interval.to - interval.from + 1} positions.`,
  ][stageIndex];
}
