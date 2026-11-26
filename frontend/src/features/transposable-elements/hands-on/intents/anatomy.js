// Gesture -> model-input mapping for AnatomyLab. Outputs are the patches the old controls passed to
// update(): {labels}, {left} / {right}, {direction}, and {selected} for tapping a segment.
export const BRACKETS = ['left', 'right'];

// current: the case's work state {left, right, labels, direction}
export function anatomyIntent(g, current = {}) {
  if (!g) return null;
  switch (g.kind) {
    case 'drop':
      if (g.target === 'segment' && Number.isInteger(g.index) && g.tag) return {labels: {...(current.labels ?? {}), [g.index]: g.tag}};
      if (g.target === 'gap' && Number.isInteger(g.index) && BRACKETS.includes(g.bracket)) return {[g.bracket]: g.index};
      return null;
    // The transposase arrow has two readings; each swipe across it flips to the other one.
    case 'swipe': return g.target === 'arrow' ? {direction: current.direction === 'right' ? 'left' : 'right'} : null;
    case 'tap': return g.target === 'segment' && Number.isInteger(g.index) ? {selected: g.index} : null;
    default: return null;
  }
}
