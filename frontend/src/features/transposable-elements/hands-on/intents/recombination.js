// Gesture -> model-input mapping for RecombinationLab. Outputs are what the old controls set:
// {orientation}, {substrate}, {homology} and {run: true} (what the "Recombine" button did).
import { SUBSTRATES } from '../../recombinationLab.js';

// current: {orientation}
export function recombinationIntent(g, current = {}) {
  if (!g) return null;
  switch (g.kind) {
    // A swipe across the second copy turns it round.
    case 'swipe': return g.target === 'copy2' ? {orientation: current.orientation === 'inverted' ? 'direct' : 'inverted'} : null;
    case 'drop':
      if (g.part === 'substrate' && g.target === 'stage') return Object.hasOwn(SUBSTRATES, g.substrate) ? {substrate: g.substrate} : null;
      // Pairing the two copies is the old run button.
      if (g.part === 'copy' && g.target === 'copy2') return {run: true};
      return null;
    case 'assume': return g.control === 'homology' ? {homology: !!g.value} : null;
    default: return null;
  }
}
