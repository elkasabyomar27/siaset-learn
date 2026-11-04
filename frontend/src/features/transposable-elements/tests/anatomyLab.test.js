import test from 'node:test';
import assert from 'node:assert/strict';
import { ANATOMY_CASES, LABELS, correctBoundaries, transposaseDirection, checkDissection, insideBracket } from '../anatomyLab.js';

const perfect = c => {
  const [left, right] = correctBoundaries(c);
  return {left, right, labels: Object.fromEntries(c.segments.map((s, i) => [i, s.kind])), direction: transposaseDirection(c)};
};

test('every case: TSDs outside the element, TIRs inverted at its edges, one transposase inside', () => {
  for (const c of ANATOMY_CASES) {
    const [L, R] = correctBoundaries(c), kinds = c.segments.map(s => s.kind);
    assert.equal(kinds[L], 'tir'); assert.equal(kinds[R - 1], 'tir');
    assert.equal(c.segments[L].dir, -c.segments[R - 1].dir, 'TIRs are inverted');
    const tsds = c.segments.map((s, i) => [s, i]).filter(([s]) => s.kind === 'tsd');
    assert.equal(tsds.length, 2); assert.equal(tsds[0][0].dir, tsds[1][0].dir, 'TSDs are direct repeats');
    for (const [, i] of tsds) assert.equal(insideBracket(i, L, R), false);
    assert.equal(kinds.slice(L, R).filter(k => k === 'transposase').length, 1);
    for (const k of kinds) assert.ok(LABELS[k]);
  }
  assert.equal(transposaseDirection(ANATOMY_CASES[1]), 'left');
});

test('a perfect dissection passes; each kind of mistake is caught with a specific hint', () => {
  for (const c of ANATOMY_CASES) assert.equal(checkDissection(c, perfect(c)).allOk, true);
  const c = ANATOMY_CASES[0], p = perfect(c);
  const wide = checkDissection(c, {...p, left: p.left - 1});
  assert.equal(wide.boundariesOk, false); assert.match(wide.boundaryHint, /outside the element/);
  const narrow = checkDissection(c, {...p, right: p.right - 1});
  assert.match(narrow.boundaryHint, /cuts inside/);
  assert.equal(checkDissection(c, {...p, right: p.left, left: p.right}).boundariesOk, true, 'marker order does not matter');
  const swapped = checkDissection(c, {...p, labels: {...p.labels, 3: 'cargo', 4: 'transposase'}});
  assert.deepEqual(swapped.labelResults.map((ok, i) => ok ? null : i).filter(x => x !== null), [3, 4]);
  assert.equal(checkDissection(c, {...p, direction: 'left'}).directionOk, false);
  assert.match(checkDissection(c, {labels: {}}).boundaryHint, /both boundary markers/);
});
