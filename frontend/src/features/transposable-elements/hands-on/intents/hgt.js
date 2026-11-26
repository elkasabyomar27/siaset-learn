// Gesture -> model-input mapping for HgtLab. Outputs are what the old controls passed on:
// {prereq, value} -> setPrereq(lab, prereq, value), {act} -> act(lab, 'conjugate' | 'transpose'),
// {assume} -> the selection assumption. "Add antibiotic selection" stays a button.
import { PREREQS } from '../../hgtLab.js';

const PARTS = ['conjugative', 'oriT'];

export function hgtIntent(g) {
  if (!g) return null;
  switch (g.kind) {
    case 'drop':
      // The donor cell dragged to the recipient makes contact; dragged away it breaks it.
      if (g.part === 'donor') return g.target === 'recipient' ? {prereq: 'contact', value: true} : g.target === 'apart' ? {prereq: 'contact', value: false} : null;
      // Plasmid parts dropped on the plasmid panel are on the plasmid; dropped back in the tray they are not.
      if (PARTS.includes(g.part)) return g.target === 'plasmid' ? {prereq: g.part, value: true} : g.target === 'tray' ? {prereq: g.part, value: false} : null;
      return null;
    case 'hold':
      return g.target === 'tn5' ? {act: 'transpose'} : g.target === 'bridge' ? {act: 'conjugate'} : null;
    case 'assume':
      if (g.control === 'selection') return {assume: !!g.value};
      return g.control === 'compatibleRecipient' && Object.hasOwn(PREREQS, g.control) ? {prereq: g.control, value: !!g.value} : null;
    default: return null;
  }
}
