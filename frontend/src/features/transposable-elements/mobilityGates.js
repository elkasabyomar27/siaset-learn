// System-specific mobility "gates", matching the Regulation and Introduction lessons.
// Outcomes are qualitative permissions, never predictions that an event will happen.

export const OUTCOME = {
  permitted: {label: 'Permitted', text: 'The modelled requirements are met. Movement is possible, not guaranteed.'},
  reduced: {label: 'Reduced', text: 'Movement capacity is lower than in the unrestricted condition.'},
  'not permitted': {label: 'Not permitted', text: 'A required gate is closed under the stated assumptions.'},
  undetermined: {label: 'Undetermined', text: 'Something needed for a prediction is unknown.'},
};

export const SYSTEMS = {
  maize: {
    name: 'Maize Ac/Ds',
    defaults: {element: 'Ds', acInTrans: false, permissiveHost: true},
    controls: [
      {key: 'element', type: 'choice', label: 'Element', options: {Ac: 'Ac (intact transposase gene)', Ds: 'Ds (no functional transposase)'}},
      {key: 'acInTrans', type: 'toggle', label: 'Active Ac elsewhere supplies protein in trans'},
      {key: 'permissiveHost', type: 'toggle', label: 'Assume permissive host conditions'},
    ],
  },
  is10: {
    name: 'Bacterial IS10',
    defaults: {pIN: true, rnaOut: true, otherSource: false},
    controls: [
      {key: 'pIN', type: 'toggle', label: 'pIN promoter active (transposase RNA made)'},
      {key: 'rnaOut', type: 'toggle', label: 'RNA-OUT pairs with the transposase RNA'},
      {key: 'otherSource', type: 'toggle', label: 'Another transposase source exists'},
    ],
  },
  cacta1: {
    name: 'Arabidopsis CACTA1',
    defaults: {ddm1: false},
    controls: [
      {key: 'ddm1', type: 'toggle', label: 'ddm1 mutant background (silencing relaxed)'},
    ],
  },
};

const gate = (id, label, state, note) => ({id, label, state, note});

/** Gates in pipeline order plus the overall outcome. state: open | restricted | closed | unknown. */
export function evaluateGates(system, settings) {
  const s = {...SYSTEMS[system]?.defaults, ...settings};
  if (!SYSTEMS[system]) throw Error('Unknown system.');
  if (system === 'maize') {
    const ownGene = s.element === 'Ac';
    const gates = [
      gate('ends', 'Compatible element ends', 'open', 'Ac and the selected Ds share compatible ends.'),
      gate('source', 'Transposase source', ownGene ? 'open' : s.acInTrans ? 'open' : 'closed',
        ownGene ? 'Ac encodes its own transposase.' : s.acInTrans ? 'Ac protein supplied in trans acts on the Ds ends.' : 'Ds cannot make transposase, and none is supplied.'),
      gate('host', 'Host conditions', s.permissiveHost ? 'open' : 'unknown', s.permissiveHost ? 'Assumed permissive.' : 'Not known.'),
    ];
    const autonomy = ownGene ? 'Autonomous: encodes its own movement machinery.' : `Non-autonomous${s.acInTrans ? ', complemented in trans. Supplying protein does not change what Ds encodes' : ': depends on transposase from elsewhere'}.`;
    return {gates, outcome: overall(gates), autonomy};
  }
  if (system === 'is10') {
    const gates = [
      gate('transcription', 'Transposase transcription (pIN)', s.pIN ? 'open' : 'closed', s.pIN ? 'pIN drives transposase RNA.' : 'pIN inactive: no transposase RNA from this copy.'),
      gate('translation', 'Translation of transposase RNA', !s.pIN ? 'closed' : s.rnaOut ? 'restricted' : 'open', !s.pIN ? 'No RNA to translate.' : s.rnaOut ? 'RNA-OUT pairing blocks ribosome access: less protein made.' : 'Unpaired RNA is translated.'),
      gate('protein', 'Transposase available', s.otherSource ? 'open' : !s.pIN ? 'closed' : s.rnaOut ? 'restricted' : 'open', s.otherSource ? 'Another source supplies transposase.' : 'Depends on this copy’s own production.'),
    ];
    return {gates: s.otherSource ? gates.map(g => g.id === 'protein' ? g : {...g, note: `${g.note} (bypassed by the other source)`}) : gates, outcome: s.otherSource ? 'permitted' : overall(gates)};
  }
  const gates = [
    gate('chromatin', 'Chromatin silencing (DDM1, methylation)', s.ddm1 ? 'open' : 'restricted', s.ddm1 ? 'Silencing constraint relaxed in ddm1.' : 'DDM1-associated chromatin and methylation repress CACTA1.'),
    gate('other', 'Other prerequisites', 'unknown', 'Not specified for a particular copy.'),
  ];
  return {gates, outcome: s.ddm1 ? 'undetermined' : 'reduced'};
}

function overall(gates) {
  if (gates.some(g => g.state === 'closed')) return 'not permitted';
  if (gates.some(g => g.state === 'unknown')) return 'undetermined';
  if (gates.some(g => g.state === 'restricted')) return 'reduced';
  return 'permitted';
}

/** Index of the first gate the signal cannot pass fully (closed or restricted), or gates.length. */
export function signalStops(gates) {
  const i = gates.findIndex(g => g.state === 'closed');
  return i === -1 ? gates.length : i;
}
