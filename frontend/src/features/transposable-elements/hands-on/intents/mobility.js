// Gesture -> model-input mapping for MobilityGates. Outputs are exactly the `patch` objects the
// old controls passed to update(): {[key]: value}. Returns null for gestures that mean nothing.
const EXPRESSION = new Set(['pIN', 'ddm1']);

export const isAssumption = key => /^(permissive|assume)/.test(key);
// choice -> drag an option into the cell; assumption -> Assumptions panel; switch -> drawn on the DNA;
// part -> drag a part into or out of the cell.
export const controlKind = c => c.type === 'choice' ? 'choice'
  : isAssumption(c.key) ? 'assumption' : EXPRESSION.has(c.key) ? 'switch' : 'part';

export function mobilityIntent(g, current = {}) {
  if (!g || !g.control) return null;
  switch (g.kind) {
    case 'drop':
      if (g.target === 'cell') return {[g.control]: g.option ?? true};
      if (g.target === 'tray' && g.option === undefined) return {[g.control]: false};
      return null;
    case 'tap': return g.target === 'switch' ? {[g.control]: !current[g.control]} : null;
    case 'assume': return {[g.control]: !!g.value};
    default: return null;
  }
}
