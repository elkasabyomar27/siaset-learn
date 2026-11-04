// Composite transposon architecture: two IS modules around cargo. Architecture only;
// it does not establish a transposition pathway or frequency.

export const MODULES = ['IS50', 'IS10', 'IS1'];
export const CARGO = {
  kan: 'Kanamycin resistance',
  tet: 'Tetracycline resistance',
  cam: 'Chloramphenicol resistance',
};
export const CARGO_GENE = {kan: 'kanᴿ', tet: 'tetᴿ', cam: 'camᴿ'};
export const REFERENCE = {
  Tn5: {module: 'IS50', arrangement: 'inverted', cargo: 'kan', note: 'Inverted IS50 modules around resistance cargo.'},
  Tn10: {module: 'IS10', arrangement: 'inverted', cargo: 'tet', note: 'Inverted IS10 modules; IS10-R supplies normal movement functions.'},
  Tn9: {module: 'IS1', arrangement: 'direct', cargo: 'cam', note: 'Directly repeated IS1 modules. These are not host-derived TSDs.'},
};
export const END_CHOICES = {
  outer: 'Outer ends of both modules',
  left: 'Both ends of the left module',
  right: 'Both ends of the right module',
};

export function arrangement({left, right}) {
  return left === right ? 'direct' : 'inverted';
}

export function matchElement(design) {
  const arr = arrangement(design);
  return Object.entries(REFERENCE).find(([, r]) => r.module === design.module && r.arrangement === arr && r.cargo === design.cargo)?.[0] ?? null;
}

/** Specific, ordered hints toward a target classical element. */
export function hintsToward(design, target) {
  const r = REFERENCE[target], hints = [];
  if (design.module !== r.module) hints.push(`${target} is built from ${r.module} modules.`);
  if (arrangement(design) !== r.arrangement) hints.push(`${target}'s modules are ${r.arrangement === 'direct' ? 'direct repeats: both point the same way' : 'inverted: they point in opposite directions'}.`);
  if (design.cargo !== r.cargo) hints.push(`${target} carries ${CARGO[r.cargo].toLowerCase()}.`);
  return hints;
}

/** Which parts move when transposase uses a given pair of ends. */
export function movingParts(ends) {
  if (ends === 'outer') return {parts: ['left', 'cargo', 'right'], text: 'Using the two outermost ends, everything between them moves together: both IS modules and the cargo. This is how the cargo gets carried.'};
  if (ends === 'left') return {parts: ['left'], text: 'Using the two ends of one module, only that IS moves. The cargo stays behind.'};
  if (ends === 'right') return {parts: ['right'], text: 'Using the two ends of one module, only that IS moves. The cargo stays behind.'};
  throw Error('Unknown end choice.');
}

/** End tabs used for a choice: each module has a left (0) and right (1) end. */
export function endsUsed(ends) {
  return {outer: [['left', 0], ['right', 1]], left: [['left', 0], ['left', 1]], right: [['right', 0], ['right', 1]]}[ends];
}

export function describeDesign(design) {
  const arr = arrangement(design), dir = v => v === 1 ? 'pointing right' : 'pointing left';
  return `${design.module} module ${dir(design.left)}, ${CARGO[design.cargo].toLowerCase()} cargo, ${design.module} module ${dir(design.right)}: ${arr === 'direct' ? 'direct repeats' : 'inverted repeats'}.`;
}
