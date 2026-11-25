// Pure gesture -> action mapping for the Tn5 / Tn3 story labs. Returns exactly the action shapes
// storyAction accepts, or null. Callers convert `angle` to `boundary` with boundaryFromAngle.
const endOf = t => (t === 'end-left' ? 'left' : t === 'end-right' ? 'right' : null);

const TABLE = {
  tn5: {
    hold: g => endOf(g.target) && {type: 'bind', end: endOf(g.target)},
    swipe: g => endOf(g.target) && {type: 'cut', end: endOf(g.target)},
    drop: g => g.target === 'ring' && Number.isFinite(g.angle) ? {type: 'insert', angle: g.angle} : null,
    tap: g => g.target === 'inserted' ? {type: 'continue'}
      : ['target-tsd-left', 'target-tsd-right'].includes(g.target) ? {type: 'inspect', feature: g.target} : null,
  },
  tn3: {
    // `drop tnpR` / `drop target-circle`: emit only for drops that landed on the res / donor zone.
    drop: g => g.target === 'target-circle' && Number.isFinite(g.angle) ? {type: 'dock-target', angle: g.angle}
      : g.target === 'tnpR' ? {type: 'enzyme', available: true} : null,
    hold: g => g.target === 'fork' ? {type: 'replicate'} : null,
    tap: g => ['copy-1', 'copy-2'].includes(g.target) ? {type: 'inspect', feature: g.target} : null,
    'drag-off': g => g.target === 'tnpR' ? {type: 'enzyme', available: false} : null,
  },
};

export function storyIntent(scenario, gesture) {
  const table = Object.hasOwn(TABLE, scenario) ? TABLE[scenario] : null;
  const rule = table && gesture && Object.hasOwn(table, gesture.kind) ? table[gesture.kind] : null;
  return rule ? rule(gesture) || null : null;
}
