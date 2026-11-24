// Hands-on models for Module 2 (DNA Extraction & Purification). Every outcome is a
// qualitative teaching category under stated assumptions, never a predicted yield.

// ── Lesson 16: place each reagent in the protocol stage where it does its job ──
export const STAGES = [
  {id: 'lysis', label: 'Lyse', note: 'Open cells, protect DNA'},
  {id: 'digest', label: 'Digest', note: 'Break down proteins and RNA'},
  {id: 'cleanup', label: 'Clean up', note: 'Separate proteins from DNA'},
  {id: 'recover', label: 'Recover', note: 'Bring DNA out of solution and clean it'},
];

export const REAGENTS = [
  {id: 'sds', name: 'SDS (detergent)', stages: ['lysis'], why: 'SDS disrupts lipid membranes and denatures proteins, releasing the cell contents.'},
  {id: 'edta', name: 'EDTA', stages: ['lysis'], why: 'EDTA chelates Mg²⁺, which DNases need, so DNA is protected from the moment the cells open.'},
  {id: 'protk', name: 'Proteinase K', stages: ['digest', 'lysis'], why: 'Proteinase K digests proteins, including nucleases and DNA-bound proteins. It is often added with the lysis buffer.'},
  {id: 'rnase', name: 'RNase A', stages: ['digest', 'lysis'], why: 'RNase A degrades RNA, which would otherwise precipitate with the DNA.'},
  {id: 'nacl', name: 'Saturated NaCl', stages: ['cleanup'], why: 'Concentrated salt “salts out” proteins; centrifugation pellets them and the DNA stays in the supernatant.'},
  {id: 'iso', name: 'Salt + isopropanol', stages: ['recover'], why: 'Cations neutralize the DNA backbone and alcohol lowers its solubility, so DNA precipitates.'},
  {id: 'eth70', name: '70% ethanol', stages: ['recover'], why: 'The wash removes salt and residual isopropanol while the DNA stays pelleted.'},
];

export function checkReagent(reagentId, stageId) {
  const reagent = REAGENTS.find(r => r.id === reagentId);
  if (!reagent) throw Error('Unknown reagent.');
  if (!STAGES.some(s => s.id === stageId)) throw Error('Unknown stage.');
  if (reagent.stages.includes(stageId)) return {correct: true, text: reagent.why};
  const hints = {
    sds: 'A detergent acts on membranes, so it is needed at the very start to open cells.',
    edta: 'Nucleases are released as soon as cells open; EDTA has to be there from the start.',
    protk: 'Proteinase K breaks proteins down; it does not separate them or recover DNA.',
    rnase: 'RNase A breaks RNA down; it acts before DNA is recovered.',
    nacl: 'Saturated salt here removes proteins from the lysate, before the DNA is recovered.',
    iso: 'Alcohol plus salt is what brings DNA out of solution at the end.',
    eth70: 'The wash cleans an existing DNA pellet, so it comes last.',
  };
  return {correct: false, text: hints[reagentId]};
}

export const reagentsSorted = placed => REAGENTS.every(r => r.stages.includes(placed[r.id]));

// ── Shared gate logic (mirrors the mobility gates: open / restricted / closed) ──
const gate = (id, label, state, note) => ({id, label, state, note});

// ── Lesson 17: precipitation tube ──
// Options are [value, label] pairs or objects; pairs keep numeric choices in order.
export const TUBE_CAPACITY_UL = 1500;
export const PRECIPITATION = {
  defaults: {sample: 700, alcohol: 'isopropanol', volumes: 0.7, salt: true, temperature: 'room', spin: true},
  controls: [
    {key: 'sample', label: 'Sample volume', options: [['200', '200 µL'], ['700', '700 µL']]},
    {key: 'alcohol', label: 'Alcohol', options: {isopropanol: 'Isopropanol', ethanol: 'Ethanol'}},
    {key: 'volumes', label: 'Alcohol added (× sample volume)', options: [['0.2', '0.2 vol'], ['0.7', '0.7 vol'], ['1', '1 vol'], ['2.5', '2.5 vol']]},
    {key: 'temperature', label: 'Incubation', options: {room: 'Room temperature', ice: 'On ice, long'}},
    {key: 'salt', label: 'Add sodium acetate to 0.3 M', type: 'toggle'},
    {key: 'spin', label: 'Centrifuge and keep the pellet', type: 'toggle'},
  ],
};
export const PRECIPITATION_OUTCOMES = {
  pellet: {label: 'DNA pellets', tone: 'good', text: 'Charge is neutralized, the alcohol fraction is sufficient and the DNA is collected. Ready for a 70% ethanol wash.'},
  salty: {label: 'Pellet, with salt', tone: 'warn', text: 'DNA precipitates, but salt is likely to come down with it. A wash will be important.'},
  poor: {label: 'Poor recovery', tone: 'bad', text: 'A requirement for precipitation or collection is missing, so little DNA ends up in the pellet.'},
  overflow: {label: 'Does not fit', tone: 'bad', text: 'Sample plus alcohol exceeds the tube. Split the sample, or choose an alcohol that needs less volume.'},
};

export function evaluatePrecipitation(settings) {
  const s = {...PRECIPITATION.defaults, ...settings};
  const sample = Number(s.sample), volumes = Number(s.volumes), total = Math.round(sample * (1 + volumes));
  const iso = s.alcohol === 'isopropanol';
  const [min, max] = iso ? [0.6, 1] : [2, 3];
  const fits = total <= TUBE_CAPACITY_UL;
  const enough = volumes >= min;
  const excessIso = iso && volumes > max;
  const cold = iso && s.temperature === 'ice';
  const gates = [
    gate('fit', 'Fits the 1.5 mL tube', fits ? 'open' : 'closed', `${sample} µL + ${Math.round(sample * volumes)} µL alcohol = ${total} µL.`),
    gate('charge', 'Backbone charge neutralized', s.salt ? 'open' : 'closed', s.salt ? 'Na⁺ from sodium acetate shields the phosphate backbone.' : 'Assume a low-salt sample: little to neutralize the negative backbone.'),
    gate('alcohol', 'Enough alcohol', enough ? 'open' : 'closed', iso ? `Isopropanol: about 0.6–0.7 volume (up to 1) is typical; ${volumes} vol chosen.` : `Ethanol: about 2–2.5 volumes is typical; ${volumes} vol chosen.`),
    gate('salt', 'Salt stays in solution', cold || excessIso ? 'restricted' : 'open', cold ? 'Cold isopropanol makes salt co-precipitate.' : excessIso ? 'Excess isopropanol makes salt co-precipitate.' : iso ? 'Room-temperature isopropanol keeps most salt dissolved.' : 'Salt is more soluble in ethanol; chilling is common.'),
    gate('collect', 'DNA collected', s.spin ? 'open' : 'closed', s.spin ? 'Centrifugation pellets the DNA; the supernatant is removed carefully.' : 'Without a spin, pouring off the liquid discards the precipitate.'),
  ];
  const outcome = !fits ? 'overflow' : gates.some(g => g.state === 'closed') ? 'poor' : gates.some(g => g.state === 'restricted') ? 'salty' : 'pellet';
  return {gates, outcome, total, fits, fill: Math.min(total / TUBE_CAPACITY_UL, 1.08)};
}

// ── Lesson 18: wash and dry ──
export const WASH = {
  defaults: {wash: 'none', dry: 'brief', solvent: 'te'},
  controls: [
    {key: 'wash', label: 'Wash the pellet with', options: {none: 'No wash', water: 'Water', e70: '70% ethanol', e100: '100% ethanol'}},
    {key: 'dry', label: 'Then dry the pellet', options: {none: 'Not at all', brief: 'Briefly, air-dry', long: 'Far too long'}},
    {key: 'solvent', label: 'Dissolve in', options: {te: 'TE buffer', water: 'Nuclease-free water'}},
  ],
};
export const WASH_OUTCOMES = {
  clean: {label: 'Clean DNA', tone: 'good', text: 'Salt removed, ethanol evaporated, pellet redissolves. Ready for measurement and enzymes.'},
  lost: {label: 'DNA lost', tone: 'bad', text: 'The wash dissolved the DNA and it was poured away.'},
  salty: {label: 'Salt remains', tone: 'warn', text: 'Salt (and with no wash, isopropanol) stays with the DNA.'},
  ethanol: {label: 'Ethanol carryover', tone: 'warn', text: 'Leftover ethanol can inhibit enzymes and make samples float out of gel wells.'},
  hard: {label: 'Hard to dissolve', tone: 'warn', text: 'The over-dried pellet is slow to redissolve, especially large genomic DNA.'},
};

export function evaluateWash(settings) {
  const s = {...WASH.defaults, ...settings};
  const lost = s.wash === 'water';
  const saltLeft = s.wash === 'none' || s.wash === 'e100';
  const gates = [
    gate('keep', 'DNA stays in the pellet', lost ? 'closed' : 'open', lost ? 'DNA dissolves in water and leaves with the wash.' : s.wash === 'none' ? 'Nothing is added, so nothing is lost.' : 'DNA is insoluble in the ethanol wash.'),
    gate('salt', 'Salt removed', lost ? 'closed' : saltLeft ? 'restricted' : 'open', s.wash === 'e70' ? 'The 30% water fraction dissolves salt.' : s.wash === 'e100' ? 'Almost no water to dissolve salt.' : lost ? 'The DNA went with the salt.' : 'No wash, so salt and isopropanol remain.'),
    gate('alcohol', 'Alcohol evaporated', lost ? 'closed' : s.dry === 'none' ? 'restricted' : 'open', s.dry === 'none' ? 'Residual alcohol is still in the tube.' : 'Volatile ethanol evaporates during drying.'),
    gate('dissolve', 'Pellet redissolves', lost ? 'closed' : s.dry === 'long' ? 'restricted' : 'open', s.dry === 'long' ? 'Over-dried DNA is slow to redissolve.' : s.solvent === 'te' ? 'TE (Tris + EDTA) buffers pH and inhibits nucleases.' : 'Water dissolves DNA; it offers no buffering or nuclease protection.'),
  ];
  const outcome = lost ? 'lost' : saltLeft ? 'salty' : s.dry === 'none' ? 'ethanol' : s.dry === 'long' ? 'hard' : 'clean';
  // Qualitative purity flag only; numbers are typical reference values, not a calculation.
  const purity = lost ? 'nothing to measure' : saltLeft ? 'A260/A230 may not show it: leftover NaCl or sodium acetate often leaves the ratio looking normal, yet the salt can still interfere with enzymes and how bands run on a gel' : 'A260/A230 in the usual 1.8–2.2 range expected';
  return {gates, outcome, purity};
}
