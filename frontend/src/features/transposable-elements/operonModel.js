// Idealised bacterial operon P → A → B with one inserted element. Qualitative only and
// tied to explicit assumptions, matching the Gene Expression Effects lesson; not universal TE rules.
// Assumed inside the element: its terminator stops transcription arriving from upstream, and an
// outward promoter starts transcription at the element edge it faces.

export const SLOTS = {
  none: 'No insertion',
  promoter: 'In promoter P',
  geneA: 'Inside gene A',
  between: 'Between A and B',
};
export const TE_PROMOTER = {none: 'No outward promoter', right: 'Outward promoter →', left: 'Outward promoter ←'};
const ORDER = ['P', 'A', 'B'];
// Index of the gap the element sits in: 0 = at P, 1 = inside A, 2 = between A and B.
const SLOT_POS = {promoter: 0, geneA: 1, between: 2};

export const DEFAULT_OPERON = {slot: 'none', tePromoter: 'none', terminator: false, bPromoter: false, assumeNoHidden: true};

/** Rightward/leftward transcripts as [startIndex, endIndex) over ORDER-like positions, plus gene outcomes. */
export function simulateOperon(config) {
  const c = {...DEFAULT_OPERON, ...config};
  if (!SLOTS[c.slot] || !TE_PROMOTER[c.tePromoter]) throw Error('Invalid operon configuration.');
  const te = c.slot === 'none' ? null : SLOT_POS[c.slot];
  const transcripts = [];
  // Native promoter P (unless the element sits in it). Runs right until a terminator in the element.
  if (te !== 0) {
    const stop = te !== null && c.terminator ? te : 3;
    transcripts.push({source: 'P', direction: 'right', from: 0, to: stop, blocked: stop < 3});
  }
  if (te !== null && c.tePromoter === 'right') transcripts.push({source: 'TE', direction: 'right', from: te, to: 3, blocked: false});
  if (te !== null && c.tePromoter === 'left') transcripts.push({source: 'TE', direction: 'left', from: te, to: 0, blocked: false});
  if (c.bPromoter) transcripts.push({source: 'PB', direction: 'right', from: 2, to: 3, blocked: false});

  // Gene A occupies positions 1..2, B 2..3. A rightward transcript covers a gene if it spans it.
  const reaches = (t, gene) => {
    if (t.direction !== 'right') return false;
    const [s, e] = gene === 'A' ? [1, 2] : [2, 3];
    return t.from <= s && t.to >= e || (gene === 'A' && te === 1 && t.from === 1 && t.source === 'TE');
  };
  const genes = {};
  for (const gene of ['A', 'B']) {
    const sources = transcripts.filter(t => reaches(t, gene)).map(t => t.source);
    const interrupted = gene === 'A' && te === 1;
    let status, text;
    if (interrupted) { status = 'interrupted'; text = 'Coding sequence interrupted: a functional A protein is not expected, whatever the transcription.'; }
    else if (sources.includes('P')) { status = 'unchanged'; text = 'Transcribed from the native promoter P, as before.'; }
    else if (sources.length) { status = 'permitted'; text = `Transcribed from ${sources.includes('TE') ? 'the element’s outward promoter' : 'B’s own promoter'} instead of P.`; }
    else if (c.assumeNoHidden) { status = 'reduced'; text = `No modelled promoter reaches ${gene}: transcription is reduced.`; }
    else { status = 'undetermined'; text = `No modelled promoter reaches ${gene}, but other promoters might exist: undetermined.`; }
    genes[gene] = {status, text, sources};
  }
  const notes = [];
  if (te !== null && c.tePromoter === 'left') notes.push('The leftward outward promoter reads away from the operon direction; it does not drive A or B.');
  if (te !== null && c.terminator && te > 0) notes.push(te === 2 ? 'The element’s terminator blocks P’s transcript before B (polarity).' : 'The element’s terminator stops P’s transcript inside A.');
  if (te === 0) notes.push('The element sits in P, so P no longer starts transcription.');
  return {config: c, te, transcripts, genes, notes};
}

export const OPERON_GOALS = [
  {id: 'polarity', title: 'Silence B without touching B’s DNA', done: r => r.te === 2 && r.genes.A.status === 'unchanged' && ['reduced', 'undetermined'].includes(r.genes.B.status)},
  {id: 'rescue', title: 'Break promoter P, yet keep A and B transcribed', done: r => r.te === 0 && r.genes.A.status === 'permitted' && r.genes.B.status === 'permitted'},
  {id: 'readthrough', title: 'Interrupt A but keep B transcribed from P', done: r => r.genes.A.status === 'interrupted' && r.genes.B.sources.includes('P')},
  {id: 'unknown', title: 'Reach an honest “undetermined”', done: r => Object.values(r.genes).some(g => g.status === 'undetermined')},
];
