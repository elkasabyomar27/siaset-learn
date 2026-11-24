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

// ── Shared gate shape (as in dnaExtraction.js): open / restricted / closed ──
const gate = (id, label, state, note) => ({id, label, state, note});

// ── Station 20: PCR ── Primer Tm is taken as 60 °C; annealing ~5 °C below Tm is typical.
export const PRIMER_TM = 60;
export const PCR = {
  defaults: {primers: 'facing', anneal: 55, polymerase: 'taq', cycles: 30},
  controls: [
    {key: 'primers', label: 'Primers', options: {facing: 'Facing each other', same: 'Both on one strand', away: 'Pointing away'}},
    {key: 'anneal', label: `Annealing temperature (primer Tm ≈ ${PRIMER_TM} °C)`, options: [['45', '45 °C'], ['55', '55 °C'], ['72', '72 °C']]},
    {key: 'polymerase', label: 'Polymerase', options: {taq: 'Thermostable (Taq)', mesophile: 'Not heat-stable'}},
    {key: 'cycles', label: 'Cycles', options: [['10', '10'], ['20', '20'], ['30', '30'], ['40', '40']]},
  ],
};
export const PCR_OUTCOMES = {
  single: {label: 'single product', tone: 'good', text: 'One band at the expected size: the primers bracket one target and copy it.'},
  none: {label: 'no product', tone: 'bad', text: 'A requirement for amplification is missing, so the target is not copied.'},
  extra: {label: 'extra bands', tone: 'warn', text: 'The target is made, but primers also bound loosely elsewhere and made other products.'},
  weak: {label: 'weak product', tone: 'warn', text: 'The right product, but too few cycles to make much of it.'},
};

export function runPcr(settings) {
  const s = {...PCR.defaults, ...settings};
  const anneal = Number(s.anneal), cycles = Number(s.cycles);
  const gates = [
    gate('primers', 'Primers bracket the target', s.primers === 'facing' ? 'open' : 'closed',
      s.primers === 'facing' ? 'Forward and reverse primers point toward each other, so each new strand carries the other primer’s site.'
        : s.primers === 'same' ? 'Both primers bind the same strand, so new strands never serve as templates for each other: copies only add up linearly, far too few to see.'
        : 'Primers pointing away copy outward and never define a region between them.'),
    gate('polymerase', 'Polymerase survives denaturation', s.polymerase === 'taq' ? 'open' : 'closed',
      s.polymerase === 'taq' ? 'Taq polymerase from Thermus aquaticus tolerates the repeated heating steps.' : 'A non-heat-stable enzyme is inactivated by the first denaturation step.'),
    gate('anneal', 'Primers bind only their sites', anneal >= PRIMER_TM + 5 ? 'closed' : anneal <= PRIMER_TM - 10 ? 'restricted' : 'open',
      anneal >= PRIMER_TM + 5 ? `At ${anneal} °C, well above the primer Tm, primers barely stay bound.`
        : anneal <= PRIMER_TM - 10 ? `At ${anneal} °C primers also bind partly matching sites.` : `About 5 °C below the Tm: primers bind their own sites.`),
    gate('cycles', 'Enough cycles', cycles <= 10 ? 'restricted' : cycles >= 40 ? 'restricted' : 'open',
      cycles <= 10 ? 'Ten cycles make only about a thousand-fold more product.' : cycles >= 40 ? 'The reaction has levelled off by then; extra cycles add little and raise the risk of side products.' : `${cycles} cycles take the product well into the visible range.`),
  ];
  const outcome = gates.some(g => g.state === 'closed') ? 'none' : cycles <= 10 ? 'weak' : anneal <= PRIMER_TM - 10 ? 'extra' : 'single';
  const target = {bp: SAMPLE.ampliconBp, intensity: outcome === 'weak' ? 'faint' : 'strong', schematic: false};
  const bands = outcome === 'none' ? [] : outcome === 'extra'
    ? [{bp: 1300, intensity: 'faint', schematic: true}, target, {bp: 420, intensity: 'faint', schematic: true}] : [target];
  return {gates, outcome, bands};
}

export const idealCopies = (start, n) => start * 2 ** n;
/** Exact-length duplexes from one template duplex after n ideal cycles. */
export const exactLengthDuplexes = n => Math.max(0, 2 ** n - 2 * n);
export const pcrTable = (cycles = 5) => Array.from({length: cycles}, (_, i) => ({cycle: i + 1, total: 2 ** (i + 1), exact: exactLengthDuplexes(i + 1)}));

// ── Station 21: gel electrophoresis ── Schematic log-linear model: distance from the well
// falls with log(size). Windows are teaching values per agarose %, not measured ranges.
export const GEL = {
  defaults: {agarose: '1', polarity: 'wells-negative', run: 'right'},
  controls: [
    {key: 'agarose', label: 'Agarose', options: [['0.7', '0.7%'], ['1', '1%'], ['2', '2%']]},
    {key: 'polarity', label: 'Wells sit at the', options: {'wells-negative': 'Negative (black) electrode', 'wells-positive': 'Positive (red) electrode'}},
    {key: 'run', label: 'Run time', options: {short: 'Stopped early', right: 'Run until the dye front is near the end'}},
  ],
};
export const GEL_WINDOWS = {'0.7': [300, 12000], '1': [70, 1300], '2': [30, 1100]};
export const RUN_FACTOR = {short: 0.25, right: 0.9};
export const GEL_OUTCOMES = {
  resolved: {label: 'band resolved', tone: 'good', text: 'The ladder spreads out and the product runs as one clear band you can size.'},
  ranOut: {label: 'DNA runs out of the gel', tone: 'bad', text: 'DNA is negative and moves toward the positive electrode. With the wells at the positive end it leaves the gel into the buffer.'},
  floats: {label: 'sample floats out', tone: 'bad', text: 'Ethanol left in the sample makes it lighter than the loading mix, so it rises out of the well instead of sinking in.'},
  unseparated: {label: 'bands not separated', tone: 'warn', text: 'The gel was stopped too early: the bands are still bunched near the wells.'},
};

const span = agarose => { const [lo, hi] = GEL_WINDOWS[agarose]; return [Math.log10(lo), Math.log10(hi)]; };
/** Fraction of the lane from the well; above 1 means the band ran off the gel. */
export function migrate(sizeBp, agarose, run) {
  const [lo, hi] = span(agarose);
  return RUN_FACTOR[run] * (hi - Math.log10(sizeBp)) / (hi - lo);
}
export function estimateSize(pos, agarose, run) {
  const [lo, hi] = span(agarose);
  return Math.round(10 ** (hi - pos / RUN_FACTOR[run] * (hi - lo)) / 10) * 10;
}
export function bracket(bp, ladder = SAMPLE.ladder) {
  return [Math.max(...ladder.filter(s => s <= bp)), Math.min(...ladder.filter(s => s >= bp))];
}

export function runGel(settings, {ethanolLane = false} = {}) {
  const s = {...GEL.defaults, ...settings};
  const reversed = s.polarity === 'wells-positive';
  const bands = sizes => reversed ? [] : sizes.map(bp => ({bp, pos: migrate(bp, s.agarose, s.run)}));
  const lanes = [
    {id: 'ladder', bands: bands(SAMPLE.ladder)},
    {id: 'product', bands: ethanolLane ? [] : bands([SAMPLE.ampliconBp])},
    {id: 'ntc', bands: []},
    ...(ethanolLane ? [{id: 'ethanol', bands: [], floats: true}] : []),
  ];
  const outcome = reversed ? 'ranOut' : ethanolLane ? 'floats' : s.run === 'short' ? 'unseparated' : 'resolved';
  return {lanes, outcome};
}

// ── Station 22: restriction digest ── Site positions are a defined teaching map for the
// schematic amplicon. Sizes use the top-strand cut position; overhang bases are not counted.
export const ENZYMES = {
  EcoRI: {site: 'GAATTC', cut: 'G^AATTC', at: [300]},
  HindIII: {site: 'AAGCTT', cut: 'A^AGCTT', at: [700]},
  BamHI: {site: 'GGATCC', cut: 'G^GATCC', at: []},
};
export const SIZE_CHOICES = [150, 300, 400, 550, 700, 850];

const uniqueDesc = sizes => [...new Set(sizes.filter(s => s > 0))].sort((a, b) => b - a);
export const cutsFor = names => [...new Set(names.flatMap(n => ENZYMES[n]?.at ?? []))].sort((a, b) => a - b);

/** Fragment sizes (unique, descending) from cutting a molecule of lengthBp at the given positions. */
export function digest(lengthBp, cuts, {topology = 'linear', partial = false} = {}) {
  const sites = [...new Set(cuts)].filter(c => c > 0 && c < lengthBp).sort((a, b) => a - b);
  if (topology === 'circular') {
    if (sites.length <= 1) return [lengthBp];
    return uniqueDesc(sites.map((c, i) => i ? c - sites[i - 1] : lengthBp - sites.at(-1) + c));
  }
  const points = [0, ...sites, lengthBp];
  if (!partial) return uniqueDesc(points.slice(1).map((p, i) => p - points[i]));
  return uniqueDesc(points.flatMap((p, i) => points.slice(i + 1).map(q => q - p)));
}

export const fragmentsMatch = (predicted, actual) => {
  const a = new Set(predicted), b = new Set(actual);
  return a.size === b.size && [...a].every(x => b.has(x));
};
