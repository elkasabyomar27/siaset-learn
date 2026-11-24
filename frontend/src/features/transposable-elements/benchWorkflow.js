// Hands-on models for the Bench Workflow module (stations 19–22). One worked sample runs
// through all four stations. Outcomes are qualitative teaching categories under stated
// assumptions; band positions and the PCR plateau are schematic, never measurements.

const round = (x, step) => Math.round(x / step) * step;
const round2 = x => Math.round(x * 100) / 100;

// ── The worked sample: clean genomic DNA from station 18 ──
export const SAMPLE = {
  volumeUl: 50,
  readings: {a260: 0.75, a280: 0.41, a230: 0.38}, // 10 mm path equivalent
  dilution: 10,
  templateUl: 1,
  pgPerHaploidGenome: 3.3,
  ampliconBp: 850, // a schematic teaching amplicon, not a real human locus
  ladder: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
};

// ── Station 19: quantification ──
export const DS_DNA_NG_PER_UL_PER_A260 = 50;
// Teaching cut-offs, not instrument specifications.
export const PURITY_CUTOFFS = {protein: 1.7, rna: 1.95, low230: 1.8};

export const QUANT_SAMPLES = [
  {id: 'yours', label: 'Your DNA (from the wash)', a260: 0.75, a280: 0.41, a230: 0.38, verdict: 'pure'},
  {id: 'protein', label: 'Protein carried over', a260: 0.75, a280: 0.47, a230: 0.40, verdict: 'protein'},
  {id: 'rna', label: 'RNase skipped', a260: 0.90, a280: 0.44, a230: 0.45, verdict: 'rna'},
  {id: 'low230', label: 'Carryover from the prep', a260: 0.75, a280: 0.41, a230: 0.60, verdict: 'low230'},
];

export const VERDICTS = {
  pure: {label: 'pure DNA', text: 'Both ratios are in the usual range for pure DNA. Nothing here suggests protein or a 230 nm absorber.'},
  protein: {label: 'protein contamination', text: 'A260/A280 well below about 1.8: something absorbing near 280 nm, most often protein, came along with the DNA.'},
  rna: {label: 'RNA contamination', text: 'A260/A280 near 2.0 is typical of RNA. RNA also absorbs at 260 nm, so the DNA concentration is overestimated.'},
  low230: {label: 'low A260/A230 contaminant', text: 'A260/A230 well below 1.8: something absorbing near 230 nm came along. The ratio flags a problem; it does not say what.'},
};

export function quantify({a260, a280, a230, volumeUl}) {
  if (!(a260 >= 0) || !(a280 > 0) || !(a230 > 0) || !(volumeUl > 0)) throw Error('Readings and volume must be positive.');
  const concentration = round(a260 * DS_DNA_NG_PER_UL_PER_A260, 0.1);
  const r280 = round2(a260 / a280), r230 = round2(a260 / a230);
  const flags = [];
  if (r280 < PURITY_CUTOFFS.protein) flags.push('protein');
  if (r280 >= PURITY_CUTOFFS.rna) flags.push('rna');
  if (r230 < PURITY_CUTOFFS.low230) flags.push('low230');
  return {concentration: round2(concentration), yieldNg: Math.round(a260 * DS_DNA_NG_PER_UL_PER_A260 * volumeUl), r280, r230, flags};
}

export const verdictFor = ({flags}) => ['protein', 'rna', 'low230'].find(f => flags.includes(f)) ?? 'pure';

/** Haploid human genome copies in the PCR template (3.3 pg per haploid genome). */
export function templateCopies(sample = SAMPLE) {
  const {a260, a280, a230} = sample.readings;
  const ng = quantify({a260, a280, a230, volumeUl: sample.volumeUl}).concentration / sample.dilution * sample.templateUl;
  return Math.round(ng * 1000 / sample.pgPerHaploidGenome);
}
