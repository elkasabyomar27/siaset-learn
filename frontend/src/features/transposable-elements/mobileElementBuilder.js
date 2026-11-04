// Teaching rules for assembling a mobile element from schematic parts. Qualitative only:
// no sequence, no IS family specifics, and no claim about transposition frequency.

export const IS_PARTS = {
  end: {label: 'Terminal end', short: 'End', hint: 'Recognised by transposase; marks a boundary of the element.'},
  transposase: {label: 'Transposase gene', short: 'Transposase', hint: 'Encodes the enzyme that recognises the ends and moves the element.'},
  cargo: {label: 'Resistance gene (cargo)', short: 'Cargo', hint: 'An accessory gene. Useful to the host, but not needed for movement.'},
  host: {label: 'Host DNA', short: 'Host DNA', hint: 'Ordinary chromosome DNA, not part of a typical element.'},
};
export const MAX_TRACK = 5;
export const MAX_ENDS = 2;

const count = (track, kind) => track.filter(k => k === kind).length;

export function canAdd(track, kind) {
  if (!IS_PARTS[kind] || track.length >= MAX_TRACK) return false;
  return kind !== 'end' || count(track, 'end') < MAX_ENDS;
}

/** Orientation of each terminal end: the first faces inward-right, the last inward-left (inverted). */
export function endOrientations(track) {
  const ends = track.map((k, i) => k === 'end' ? i : -1).filter(i => i >= 0);
  return Object.fromEntries(ends.map((i, n) => [i, n === 0 ? 1 : -1]));
}

/** Classify what the learner built. */
export function evaluateElement(track) {
  if (!track.length) return {id: 'empty', title: 'Start building', text: 'Add parts to the track. A movable element needs something to recognise and something to do the moving.'};
  const ends = count(track, 'end'), boundaries = track[0] === 'end' && track[track.length - 1] === 'end' && ends === 2;
  const inside = boundaries ? track.slice(1, -1) : [];
  if (!boundaries) return {id: 'missing-ends', title: 'No clear boundaries', movable: false,
    text: ends < 2 ? 'Transposase acts on terminal ends. Put one end at each edge so the element has two boundaries to recognise.'
      : 'Both ends must sit at the outer edges. Anything outside them is not part of the element.'};
  const hasTransposase = inside.includes('transposase'), hasCargo = inside.includes('cargo'), hasHost = inside.includes('host');
  if (!hasTransposase) return {id: 'no-transposase', title: 'Ends, but no machinery', movable: false,
    text: 'It has ends but cannot make its own transposase. It could only move if transposase from another element copy acted on these ends.'};
  if (hasHost) return {id: 'with-host', title: 'Host DNA trapped inside', movable: true,
    text: 'Anything between the ends travels with the element. Host DNA inside would move too, but it is not part of a typical insertion sequence.'};
  if (hasCargo) return {id: 'with-cargo', title: 'Movable, with cargo', movable: true,
    text: 'Ends plus transposase make it movable, and the cargo between the ends moves with it. Carrying cargo means it is no longer a simple IS.'};
  return {id: 'simple-is', title: 'A simple insertion sequence', movable: true,
    text: 'Two terminal ends and the transposase gene that acts on them, with no cargo. That is the core design of an insertion sequence.'};
}

export const IS_GOALS = [
  {id: 'simple-is', title: 'Build a simple insertion sequence'},
  {id: 'no-transposase', title: 'Build one that would need another copy’s transposase'},
  {id: 'with-cargo', title: 'Build a movable element that carries cargo'},
  {id: 'missing-ends', title: 'Find out what happens without proper ends'},
];
