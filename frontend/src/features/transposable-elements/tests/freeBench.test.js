import test from 'node:test';
import assert from 'node:assert/strict';
import { newBench, benchAction, BENCH_GOALS } from '../freeBench.js';

const play = (b, actions) => actions.reduce(({bench, notebook}, a) => { const r = benchAction(bench, a); return {bench: r.bench, notebook: [...notebook, r.entry]}; }, {bench: b, notebook: []});

test('Tn5 bench: cutting needs bound transposase, insertion needs both cuts, a second insertion is refused', () => {
  const {bench, notebook} = play(newBench('tn5'), [
    {type: 'cut', end: 'left'},
    {type: 'insert', boundary: 300},
    {type: 'bind', end: 'left'}, {type: 'cut', end: 'left'}, {type: 'insert', boundary: 300},
    {type: 'bind', end: 'right'}, {type: 'cut', end: 'right'},
    {type: 'insert', boundary: 300},
    {type: 'insert', boundary: 500},
    {type: 'cut', end: 'left'},
  ]);
  assert.deepEqual(notebook.map(e => e.ok), [false, false, true, true, false, true, true, true, false, false]);
  assert.match(notebook[0].text, /none is bound/);
  assert.match(notebook[4].text, /Cut both ends/);
  assert.equal(bench.history.state.phase, 'inserted'); assert.equal(bench.history.events.length, 1);
  assert.equal(notebook[7].outcome.copies, 1); assert.equal(notebook[7].outcome.tsdBp, 9);
  assert.match(notebook[8].text, /initial donor/);
});

test('Tn3 bench: replication needs contact; resolve before cointegrate and without TnpR is refused', () => {
  const {bench, notebook} = play(newBench('tn3'), [
    {type: 'replicate'},
    {type: 'resolve'},
    {type: 'dock-target', boundary: 450},
    {type: 'replicate'},
    {type: 'resolve'},
    {type: 'enzyme', available: true},
    {type: 'resolve'},
    {type: 'replicate'},
  ]);
  assert.deepEqual(notebook.map(e => e.ok), [false, false, true, true, false, true, true, false]);
  assert.match(notebook[0].text, /not in contact/);
  assert.match(notebook[1].text, /cointegrate/);
  assert.match(notebook[4].text, /TnpR resolvase is not available/);
  assert.equal(bench.history.state.phase, 'resolved');
  assert.deepEqual([notebook[3].outcome.copies, notebook[3].outcome.structures], [2, 1]);
  assert.deepEqual([notebook[6].outcome.copies, notebook[6].outcome.structures], [2, 2]);
});

test('every investigation is reachable from bench play', () => {
  const a = play(newBench('tn5'), [{type: 'cut', end: 'left'}, {type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}, {type: 'cut', end: 'left'}, {type: 'cut', end: 'right'}, {type: 'insert', boundary: 10}, {type: 'insert', boundary: 20}]);
  const b = play(newBench('tn3'), [{type: 'dock-target', boundary: 100}, {type: 'replicate'}, {type: 'resolve'}, {type: 'enzyme', available: true}, {type: 'resolve'}]);
  const notebook = [...a.notebook, ...b.notebook];
  assert.deepEqual(BENCH_GOALS.filter(g => g.done(notebook)).map(g => g.id), BENCH_GOALS.map(g => g.id));
  assert.equal(BENCH_GOALS.filter(g => g.done([])).length, 0);
});
