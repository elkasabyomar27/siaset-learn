// Practice-only conjugation experiments for station 15 (F+ x F-, and Hfr formation + interrupted mating).
// Pure data and functions; nothing here is saved to lesson progress. Facts come from the Microbial Genetics
// "Conjugation" notes. Anything the notes do not give (gene names, entry times, scale) is marked EXAMPLE.

/** Experiment A: the six steps of the F+ x F- figure. */
export const F_STEPS = [
  {label: 'Donor F+ (tet-R) next to recipient F- (tet-S).', contact: false, nick: false, recipient: 'none'},
  {label: 'Pilin retracts and a mating pair forms. The F plasmid is nicked at oriT and bound by ssDNA-binding protein.', contact: true, nick: true, recipient: 'none'},
  {label: 'One DNA strand is transferred into the F- recipient, mediated by ssDNA-binding protein and helicase.', contact: true, nick: true, recipient: 'single'},
  {label: 'The complement strand is synthesized in the recipient.', contact: true, nick: true, recipient: 'double'},
  {label: 'Transfer and synthesis are complete. The cells separate, each with a full circular F plasmid.', contact: false, nick: false, recipient: 'circular'},
  {label: 'End state: both cells are F+ (tet-R). The donor keeps its copy and the recipient is now a donor.', contact: false, nick: false, recipient: 'circular'},
];

export const ZOOM_NOTES = [
  'Both donor and recipient make a complementary strand; the donor replaces what it passed on.',
  'Replication pushes the single strand into the recipient, where lagging-strand-type synthesis makes it double-stranded.',
  'When replication completes, the old and new oriT sites meet and a nick between them lets the plasmid recircularize.',
  'Transfer starts at oriT in a special unidirectional, leading-strand mode. oriV is for ordinary maintenance replication.',
];

export const CELL_TYPES = {
  'F+': {pilus: true, text: 'F+ cells carry the F plasmid, which encodes pilin, so they make a sex pilus.'},
  'F-': {pilus: false, text: 'F- cells lack the sex pilus, so they can only receive DNA.'},
};

export const fStatus = step => ({donor: 'F+', recipient: step >= 4 ? 'F+' : 'F-'});

/** Which cell the student picks as donor. Only a cell that makes a pilus can start a mating pair. */
export function pickDonor(choice) {
  if (!CELL_TYPES[choice]?.pilus) {
    return {ok: false, text: 'An F- cell cannot make a sex pilus, so it cannot start a mating pair. The F+ cell has to be the donor.'};
  }
  return {ok: true, text: 'The F+ cell is the donor: it can make the pilus and transfers one way to the F- recipient.'};
}

/**
 * Mixed culture, expected-value model (not stochastic). Each round an F+ cell meets an F- cell with chance `rate`
 * times the F- fraction; the F- recipient becomes F+. F+ cells are inhibited from mating with other F+ cells, so
 * F+ x F+ contacts add nothing. Returns the F+ count after each round, rounded for display.
 */
export function mixedCulture({total = 48, start = 3, rate = 0.6, rounds = 12} = {}) {
  let f = start;
  const counts = [Math.round(f)];
  for (let i = 0; i < rounds; i++) {
    f = Math.min(total, f + rate * f * (total - f) / total);
    counts.push(Math.round(f));
  }
  return counts;
}

/** Experiment B1: F integrates by homologous recombination between matching IS copies. */
export function integrateF(sharedIS) {
  if (!sharedIS) {
    return {ok: false, hfr: false, text: 'No matching IS element on the chromosome means no homologous sequence to cross over at. F stays a separate plasmid.'};
  }
  return {ok: true, hfr: true, text: 'A crossover between the matching IS copies on F and the chromosome inserts F into the chromosome, flanked by IS on both sides. This is homologous recombination, not transposition. The cell is now Hfr.'};
}

/** Experiment B2: interrupted mating. EXAMPLE genes and entry times; the notes give none. */
export const HFR_GENES = [
  {id: 'A', entry: 6},
  {id: 'B', entry: 12},
  {id: 'C', entry: 20},
  {id: 'D', entry: 28},
];
export const HFR_STOPS = [10, 17, 25];   // time points on the figure
export const HFR_SCALE_MIN = 100;        // EXAMPLE schematic: minutes for the whole chromosome; the bridge breaks well before this
export const HFR_MAX_MIN = 30;

export const transferredGenes = minutes => HFR_GENES.filter(g => g.entry <= minutes).map(g => g.id);
export const transferredFraction = minutes => Math.min(minutes, HFR_SCALE_MIN) / HFR_SCALE_MIN;

export const COMPARE = [
  ['F location', 'Separate plasmid', 'Integrated in the chromosome'],
  ['What transfers', 'Mostly F itself', 'F start plus a large chromosome portion'],
  ['Recombination in recipient', 'Rare', 'High frequency'],
  ['Use', 'Spreads F', 'Gene mapping by interrupted mating'],
];

export const CJ_QUIZ = [
  {id: 'both', q: 'After F+ × F-, what are the two cells?', options: ['Both F+', 'Donor F+, recipient still F-', 'Both F-'], correct: 0,
    why: 'The donor keeps its copy of F and the recipient receives one, so both are F+.'},
  {id: 'integration', q: 'How does F integrate into the chromosome to make an Hfr cell?', options: ['Transposition of F', 'Homologous recombination between matching IS elements', 'It never integrates'], correct: 1,
    why: 'Matching IS sequences on F and the chromosome give a site for an occasional crossover.'},
  {id: 'whole', q: 'Why is the whole chromosome rarely transferred?', options: ['The recipient refuses it', 'The mating bridge usually breaks first', 'oriV stops transfer'], correct: 1,
    why: 'Transfer is possible in theory, but the bridge usually breaks, so the recipient gets only part.'},
  {id: 'use', q: 'What is an Hfr strain used for?', options: ['Gene mapping by interrupted mating', 'Making F- cells', 'Replicating oriV'], correct: 0,
    why: 'Stopping the mating at different times shows the order in which genes enter the recipient.'},
];

export const CJ_GOALS = [
  {id: 'transfer', title: 'Run F+ × F- to the end state', done: p => p.maxStep >= 5},
  {id: 'blocked', title: 'Try an F- cell as donor and see why it fails', done: p => p.triedF},
  {id: 'integrate', title: 'Make an Hfr cell by IS crossover', done: p => p.hfr},
  {id: 'interrupt', title: 'Stop the mating at 10, 17 and 25 minutes', done: p => HFR_STOPS.every(s => p.stops.includes(s))},
];

export const newProgress = () => ({maxStep: 0, triedF: false, hfr: false, stops: []});

/** Goal progress reducer: events are {type:'step',step} | 'triedF' | 'hfr' | {type:'stop',minutes}. Never moves backwards. */
export function record(p, e) {
  if (e.type === 'step') return {...p, maxStep: Math.max(p.maxStep, e.step)};
  if (e.type === 'triedF') return {...p, triedF: true};
  if (e.type === 'hfr') return {...p, hfr: true};
  if (e.type === 'stop') return HFR_STOPS.includes(e.minutes) && !p.stops.includes(e.minutes) ? {...p, stops: [...p.stops, e.minutes]} : p;
  return p;
}

/** Interrupted mating needs an Hfr cell: only an integrated F drags the chromosome along. */
export const matingUnlocked = integ => !!integ?.hfr;
