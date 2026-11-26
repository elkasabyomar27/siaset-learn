// Gesture -> model-input mapping for CompositeBuilder. Outputs are what the old buttons passed:
// change({module}), change(d => ({left: -d.left})) / right, change({cargo}), and setEnds(id).
// An IS dropped on a side sets the shared `module` (the model has one module type for both sides);
// a swipe across a side flips that side's sign; the cargo gene dropped on the cargo sets `cargo`;
// the transposase dropped on an ends slot sets `ends` (the "Transposase acts on" choice).
import { MODULES, CARGO, END_CHOICES } from '../../compositeBuilder.js';

const SIDES = ['left', 'right'];

// design: {module, left, right, cargo}
export function compositeIntent(g, design = {}) {
  if (!g) return null;
  if (g.kind === 'drop') {
    if (g.part === 'module' && SIDES.includes(g.target) && MODULES.includes(g.module)) return {module: g.module};
    if (g.part === 'cargo' && g.target === 'cargo' && Object.hasOwn(CARGO, g.cargo)) return {cargo: g.cargo};
    if (g.part === 'transposase' && typeof g.target === 'string' && g.target.startsWith('ends-')) {
      const ends = g.target.slice(5);
      return Object.hasOwn(END_CHOICES, ends) ? {ends} : null;
    }
    return null;
  }
  if (g.kind === 'swipe' && SIDES.includes(g.target)) return {[g.target]: -design[g.target]};
  return null;
}
