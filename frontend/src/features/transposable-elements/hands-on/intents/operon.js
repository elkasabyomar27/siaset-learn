// Gesture -> model-input mapping for OperonExplorer. Outputs are the patches the old controls
// passed to set(): {slot}, {tePromoter}, {terminator}, {bPromoter}, {assumeNoHidden}.
import { SLOTS, TE_PROMOTER } from '../../operonModel.js';

const PROMOTER_CYCLE = Object.keys(TE_PROMOTER);

// current: {slot, tePromoter}. The old element-only controls were disabled without an element,
// and so are their gestures.
export function operonIntent(g, current = {}) {
  if (!g) return null;
  const placed = current.slot !== undefined && current.slot !== 'none';
  switch (g.kind) {
    case 'drop':
      if (g.part === 'element') {
        if (g.target === 'tray') return {slot: 'none'};
        return g.target !== 'none' && Object.hasOwn(SLOTS, g.target) ? {slot: g.target} : null;
      }
      if (g.part === 'terminator' && placed) return g.target === 'te' ? {terminator: true} : g.target === 'tray' ? {terminator: false} : null;
      if (g.part === 'bPromoter') return g.target === 'geneB' ? {bPromoter: true} : g.target === 'tray' ? {bPromoter: false} : null;
      return null;
    // A swipe across the promoter arrow turns it: none -> right -> left -> none.
    case 'swipe': {
      if (g.target !== 'promoter' || !placed) return null;
      const i = PROMOTER_CYCLE.indexOf(current.tePromoter);
      return {tePromoter: PROMOTER_CYCLE[(i + 1) % PROMOTER_CYCLE.length]};
    }
    case 'assume': return g.control === 'assumeNoHidden' ? {assumeNoHidden: !!g.value} : null;
    default: return null;
  }
}
