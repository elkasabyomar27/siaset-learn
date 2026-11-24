// Presentation-only station copy: the one-line challenge that opens each station and the
// name of its hands-on activity. No learning rules, scoring or completion live here.
export const stationCopy = {
  introduction: { challenge: 'Can a gene really move? Find out which gates must open.', activity: 'Mobility gates' },
  discovery: { challenge: 'Grow maize kernels and see the spotting McClintock saw.', activity: 'Kernel grower' },
  anatomy: { challenge: 'Which parts of this DNA belong to the element?', activity: 'Anatomy lab' },
  classification: { challenge: 'Sort each element by what it moves through.', activity: 'Sorting bench' },
  'dna-diversity': { challenge: 'Track how many copies each pathway leaves behind.', activity: 'Copy ledger' },
  conservative: { challenge: 'Move Tn5 into the target, and find out what it leaves behind.', activity: 'Hands-on lab' },
  replicative: { challenge: 'Join two circles through Tn3, then separate them again.', activity: 'Hands-on lab' },
  'insertion-sequences': { challenge: 'Build the smallest element that can still move.', activity: 'Element builder' },
  composite: { challenge: 'Carry cargo between two insertion sequences.', activity: 'Composite builder' },
  'genomic-consequences': { challenge: 'What happens when two copies recombine?', activity: 'Recombination lab' },
  phenotypes: { challenge: 'Follow one insertion all the way to a visible trait.', activity: 'Phenotype explorer' },
  expression: { challenge: 'Switch operon parts and read what gets expressed.', activity: 'Operon explorer' },
  tsd: { challenge: 'Stagger the cut and watch a target-site duplication form.', activity: 'TSD builder' },
  regulation: { challenge: 'Which controls must allow movement before an element can hop?', activity: 'Mobility gates' },
  'bacterial-hgt': { challenge: 'When does mobile DNA end up in a different cell?', activity: 'HGT lab' },
  'extraction-principles': { challenge: 'Free DNA from cells, one reagent at a time.', activity: 'Reagent stages' },
  'isopropanol-precipitation': { challenge: 'Pull DNA out of solution with isopropanol.', activity: 'Protocol bench' },
  'ethanol-wash': { challenge: 'Wash away the salt without losing your pellet.', activity: 'Protocol bench' },
};

export const challengeFor = id => stationCopy[id]?.challenge;
export const activityFor = id => stationCopy[id]?.activity;
