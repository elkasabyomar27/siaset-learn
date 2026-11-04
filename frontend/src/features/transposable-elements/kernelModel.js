// Schematic maize kernel sectoring (Discovery lesson): Ds sits in a pigment gene, so cells are
// colourless. Where Ac-dependent excision happens, pigment can be restored in that cell and every
// descendant, giving a sector. Earlier events make larger sectors. Not a reconstructed experiment,
// no rates are measured, and Ds derivatives differ.

export const GENERATIONS = 6;          // divisions shown; each splits a block into 4
export const SIZE = 64;                // kernel grid in units (2^GENERATIONS)

/** Small deterministic RNG so a seed always grows the same kernel. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/** Per-generation excision chance; timing 0 = early in development, 1 = late. */
export function excisionChance(gen, timing, generations = GENERATIONS) {
  const centre = timing * (generations - 1);
  return 0.16 * Math.exp(-((gen - centre) ** 2) / 1.6);
}

/**
 * Grows the kernel. Returns pigmented sectors (each from one excision event) and summary stats.
 * Without Ac there is no transposase for this Ds, so no excision and no sectors.
 */
export function growKernel({ac, timing = 0.5, seed = 1, generations = GENERATIONS}) {
  const random = rng(seed), sectors = [];
  let blocks = [{x: 0, y: 0, size: 2 ** generations}];
  for (let gen = 0; gen < generations; gen++) {
    const next = [];
    for (const b of blocks) {
      if (ac && random() < excisionChance(gen, timing, generations)) { sectors.push({...b, gen}); continue; }
      const h = b.size / 2;
      next.push({x: b.x, y: b.y, size: h}, {x: b.x + h, y: b.y, size: h}, {x: b.x, y: b.y + h, size: h}, {x: b.x + h, y: b.y + h, size: h});
    }
    blocks = next;
  }
  const total = (2 ** generations) ** 2, pigmented = sectors.reduce((n, s) => n + s.size ** 2, 0);
  return {
    sectors, colourless: blocks, generations,
    stats: {
      spots: sectors.length,
      pigmentedFraction: pigmented / total,
      meanSpotArea: sectors.length ? pigmented / sectors.length : 0,
      areaChecks: pigmented + blocks.reduce((n, b) => n + b.size ** 2, 0) === total,
    },
  };
}

/** Kernel appearance in words, used for text equivalents and goals. */
export function describeKernel(result, ac) {
  const {spots, meanSpotArea, pigmentedFraction} = result.stats;
  if (!ac) return {pattern: 'colourless', text: 'Colourless kernel: without Ac, the selected Ds cannot leave the pigment gene.'};
  if (!spots) return {pattern: 'colourless', text: 'No excision happened in this kernel by chance. Grow another one.'};
  const big = meanSpotArea >= 64, pct = Math.round(pigmentedFraction * 100);
  return big
    ? {pattern: 'large', text: `${spots} large purple sector${spots === 1 ? '' : 's'} (${pct}% pigmented): excisions happened early, so many descendant cells inherited the restored gene.`}
    : {pattern: 'small', text: `${spots} small purple spots (${pct}% pigmented): excisions happened late, so each affected only a few cells.`};
}

export const KERNEL_GOALS = [
  {id: 'colourless', title: 'Grow a kernel with no spots because Ac is missing'},
  {id: 'large', title: 'Grow a kernel with a few large sectors'},
  {id: 'small', title: 'Grow a kernel with many small spots'},
];
