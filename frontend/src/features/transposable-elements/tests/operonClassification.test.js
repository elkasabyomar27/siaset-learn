import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateOperon, OPERON_GOALS } from '../operonModel.js';
import { CLASS_CARDS, checkPlacement, sortComplete } from '../classificationSort.js';

const run = c => simulateOperon(c);
const status = c => { const r = run(c); return [r.genes.A.status, r.genes.B.status]; };

test('baseline: no insertion leaves both genes transcribed from P', () => {
  assert.deepEqual(status({slot: 'none'}), ['unchanged', 'unchanged']);
});

test('lesson contexts reproduce the lesson outcomes', () => {
  // Promoter disruption: P disabled, sole promoter -> reduced.
  assert.deepEqual(status({slot: 'promoter'}), ['reduced', 'reduced']);
  // Outward promoter aligned: transcription permitted.
  assert.deepEqual(status({slot: 'promoter', tePromoter: 'right'}), ['permitted', 'permitted']);
  // Outward promoter reversed, no other promoter information: undetermined.
  assert.deepEqual(status({slot: 'promoter', tePromoter: 'left', assumeNoHidden: false}), ['undetermined', 'undetermined']);
  // Operon termination (polarity): A disrupted, terminator before B, no B promoter -> B reduced.
  assert.deepEqual(status({slot: 'geneA', terminator: true}), ['interrupted', 'reduced']);
  // Read-through: no effective terminator -> B permitted from P.
  const rt = run({slot: 'geneA', terminator: false});
  assert.equal(rt.genes.B.status, 'unchanged'); assert.ok(rt.genes.B.sources.includes('P'));
  // Exercise: independent promoter drives B -> B does not have to decrease.
  assert.notEqual(run({slot: 'geneA', terminator: true, bPromoter: true}).genes.B.status, 'reduced');
});

test('terminator between genes blocks only B; leftward promoter drives nothing in the operon', () => {
  assert.deepEqual(status({slot: 'between', terminator: true}), ['unchanged', 'reduced']);
  const left = run({slot: 'between', tePromoter: 'left', terminator: true});
  assert.equal(left.genes.B.status, 'reduced');
  assert.ok(left.notes.some(n => /does not drive/.test(n)));
  assert.throws(() => run({slot: 'nowhere'}));
});

test('every goal is reachable and none is met by the baseline', () => {
  const configs = [{slot: 'between', terminator: true}, {slot: 'promoter', tePromoter: 'right'}, {slot: 'geneA'}, {slot: 'promoter', assumeNoHidden: false}];
  for (const goal of OPERON_GOALS) {
    assert.equal(goal.done(run({slot: 'none'})), false, goal.id);
    assert.ok(configs.some(c => goal.done(run(c))), goal.id);
  }
});

test('classification: correct cells, axis-specific feedback, and Class II spans both copy outcomes', () => {
  assert.equal(checkPlacement('tn3', 'II', 'increase').correct, true);
  const wrongClass = checkPlacement('ty', 'II', 'increase');
  assert.equal(wrongClass.classOk, false); assert.match(wrongClass.text, /RNA copy/);
  const wrongCopies = checkPlacement('tn5', 'II', 'increase');
  assert.equal(wrongCopies.copiesOk, false); assert.match(wrongCopies.text, /same single element/);
  assert.throws(() => checkPlacement('nope', 'I', 'same'));
  const classII = CLASS_CARDS.filter(c => c.cls === 'II').map(c => c.copies);
  assert.ok(classII.includes('same') && classII.includes('increase'));
  const all = Object.fromEntries(CLASS_CARDS.map(c => [c.id, `${c.cls}-${c.copies}`]));
  assert.equal(sortComplete(all), true);
  assert.equal(sortComplete({...all, tn5: 'II-increase'}), false);
});
