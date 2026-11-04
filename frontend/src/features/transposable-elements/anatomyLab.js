// Topic 3: dissect an inserted element. The learner brackets the element, names each segment from
// clues, and reads the transposase direction. Invented symbolic examples; no sequence is asserted.

export const LABELS = {
  host: 'Host DNA',
  tsd: 'Target-site duplication (host repeat)',
  tir: 'Terminal inverted repeat (element end)',
  transposase: 'Transposase gene',
  cargo: 'Cargo gene',
};

const seg = (kind, dir, clue) => ({kind, dir, clue});
const HOST_L = seg('host', 0, 'Ordinary chromosome DNA. Its sequence continues normally on this side.');
const HOST_R = seg('host', 0, 'Ordinary chromosome DNA, continuing on this side.');
const TSD = seg('tsd', 1, 'A short stretch that exactly matches another stretch on the far side, read in the same direction. It was copied from the target site.');
const TIR_L = seg('tir', 1, 'A short terminal sequence. A matching copy sits at the other end, but reversed. Transposase binds here.');
const TIR_R = seg('tir', -1, 'A short terminal sequence that matches the other end in reverse. Transposase binds here.');

export const ANATOMY_CASES = [
  {id: 'forward', name: 'Element 1', segments: [HOST_L, TSD, TIR_L,
    seg('transposase', 1, 'A long coding region. Its protein recognises and binds this element’s ends.'),
    seg('cargo', 1, 'A coding region whose protein inactivates an antibiotic. Not needed for movement.'), TIR_R, TSD, HOST_R]},
  {id: 'reversed', name: 'Element 2', segments: [HOST_L, TSD, TIR_L,
    seg('cargo', -1, 'A coding region whose protein pumps a drug out of the cell. Not needed for movement.'),
    seg('transposase', -1, 'A long coding region. Its protein cuts DNA at this element’s ends.'), TIR_R, TSD, HOST_R]},
  {id: 'minimal', name: 'Element 3', segments: [HOST_L, TSD, TIR_L,
    seg('transposase', 1, 'The only coding region here. Its protein is the element’s movement enzyme.'), TIR_R, TSD, HOST_R]},
];

/** Gap i sits before segment i (0..segments.length). The element runs from the first TIR to the last. */
export function correctBoundaries(c) {
  const first = c.segments.findIndex(s => s.kind === 'tir'), last = c.segments.map(s => s.kind).lastIndexOf('tir');
  return [first, last + 1];
}

export function transposaseDirection(c) {
  return c.segments.find(s => s.kind === 'transposase').dir === 1 ? 'right' : 'left';
}

/** Grade a dissection: boundaries, every label, and the transposase direction. */
export function checkDissection(c, {left, right, labels = {}, direction}) {
  const [L, R] = correctBoundaries(c);
  const lo = Math.min(left ?? -1, right ?? -1), hi = Math.max(left ?? -1, right ?? -1);
  const boundariesOk = lo === L && hi === R;
  let boundaryHint = null;
  if (!boundariesOk) {
    if (left == null || right == null) boundaryHint = 'Place both boundary markers.';
    else if (lo < L || hi > R) boundaryHint = 'Your bracket includes DNA outside the element. Host repeats sit outside the element ends.';
    else boundaryHint = 'Your bracket cuts inside the element. Both terminal ends belong to the element.';
  }
  const labelResults = c.segments.map((s, i) => labels[i] === s.kind);
  const directionOk = direction === transposaseDirection(c);
  return {boundariesOk, boundaryHint, labelResults, labelsOk: labelResults.every(Boolean), directionOk,
    allOk: boundariesOk && labelResults.every(Boolean) && directionOk};
}

/** True when a segment lies inside the learner's bracket. */
export function insideBracket(i, left, right) {
  if (left == null || right == null) return false;
  return i >= Math.min(left, right) && i < Math.max(left, right);
}
