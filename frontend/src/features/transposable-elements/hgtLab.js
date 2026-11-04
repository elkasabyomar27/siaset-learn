// Two-cell bacterial activity on top of engine/bacterial.js. Transposition and conjugation are engine
// operations; selection here only reports growth under explicit assumptions and never moves DNA.
import { initialBacteria, bacterialTransition } from './engine/bacterial.js';

export const PREREQS = {
  conjugative: 'Plasmid encodes transfer machinery',
  oriT: 'Plasmid has an origin of transfer (oriT)',
  contact: 'Cells are in contact',
  compatibleRecipient: 'Recipient is compatible',
};

export function newHgt() {
  return {bact: initialBacteria(), selection: null, log: []};
}

export function setPrereq(lab, key, value) {
  const bact = structuredClone(lab.bact);
  bact.transfer[key] = value;
  if (key === 'conjugative') bact.transfer.machinery = value;
  return {...lab, bact};
}

/** Where the Tn5 resistance cargo is, per cell. */
export function cargoLocations(lab) {
  const loaded = lab.bact.phase !== 'initial';
  return {
    donor: loaded ? 'on the donor’s plasmid' : 'on a donor DNA fragment',
    recipient: lab.bact.recipientPlasmid ? 'on the recipient’s new plasmid copy' : null,
  };
}

export function act(lab, action) {
  try {
    const {state, event} = bacterialTransition(lab.bact, action);
    const text = action === 'transpose'
      ? 'Tn5 moved from the fragment onto the plasmid. Same cell: this is transposition, not gene transfer.'
      : 'The loaded plasmid was copied into the recipient cell. This is horizontal gene transfer by conjugation.';
    return {lab: {...lab, bact: state, selection: null, log: [...lab.log, {action, ok: true, scope: event.scope, text}]}, ok: true, text};
  } catch (e) {
    const text = action === 'transpose'
      ? 'Nothing happened: Tn5 has already moved in this model.'
      : lab.bact.phase === 'initial'
        ? 'Nothing transferred: the plasmid does not carry Tn5 yet. Transpose first.'
        : lab.bact.phase === 'transferred' ? 'Nothing happened: the recipient already received the plasmid in this model.'
        : `Nothing transferred: a conjugation requirement is missing (${Object.entries(PREREQS).filter(([k]) => !lab.bact.transfer[k]).map(([, v]) => v).join('; ')}).`;
    return {lab: {...lab, log: [...lab.log, {action, ok: false, text}]}, ok: false, text, error: e.message};
  }
}

/** Growth on antibiotic, per cell. Selection acts on cells; it does not transport DNA. */
export function applySelection(lab, assumeExpressed) {
  const where = cargoLocations(lab), result = {};
  for (const cell of ['donor', 'recipient']) {
    result[cell] = !where[cell] ? 'inhibited' : assumeExpressed ? 'grows' : 'undetermined';
  }
  const text = assumeExpressed
    ? 'Cells carrying an expressed resistance gene grow; others are inhibited. The antibiotic did not move any DNA.'
    : 'Carrying a resistance gene does not guarantee resistance: without knowing it is expressed and sufficient, growth is undetermined.';
  return {lab: {...lab, selection: {result, assumeExpressed}, log: [...lab.log, {action: 'select', ok: true, text}]}, result, text};
}

export const HGT_GOALS = [
  {id: 'transpose', title: 'Move Tn5 without changing which cell has it', done: log => log.some(e => e.action === 'transpose' && e.ok)},
  {id: 'transfer', title: 'Get the resistance gene into the recipient cell', done: log => log.some(e => e.action === 'conjugate' && e.ok)},
  {id: 'blocked', title: 'Watch a transfer fail', done: log => log.some(e => e.action === 'conjugate' && !e.ok)},
  {id: 'select', title: 'Apply selection and see it moves no DNA', done: log => log.some(e => e.action === 'select')},
];
