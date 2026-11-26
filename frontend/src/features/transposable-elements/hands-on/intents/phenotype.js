// Gesture -> model-input mapping for PhenotypeExplorer. Outputs are the patches the old option
// buttons passed to set(): {site}, {promoterInfo}, {backup}, {medium}.
import { SITES, PROMOTER_INFO, BACKUP, MEDIUM } from '../../phenotypeChain.js';

export const ASSUMPTIONS = {promoterInfo: PROMOTER_INFO, backup: BACKUP, medium: MEDIUM};

export function phenotypeIntent(g) {
  if (!g) return null;
  if (g.kind === 'drop') return g.part === 'element' && Object.hasOwn(SITES, g.target) ? {site: g.target} : null;
  if (g.kind === 'assume') return Object.hasOwn(ASSUMPTIONS, g.control) && Object.hasOwn(ASSUMPTIONS[g.control], g.value) ? {[g.control]: g.value} : null;
  return null;
}
