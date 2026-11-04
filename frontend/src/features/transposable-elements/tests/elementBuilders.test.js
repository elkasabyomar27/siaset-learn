import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateElement, canAdd, endOrientations, IS_GOALS, MAX_TRACK } from '../mobileElementBuilder.js';
import { arrangement, matchElement, hintsToward, movingParts, endsUsed, describeDesign, REFERENCE } from '../compositeBuilder.js';

test('mobile element verdicts follow the ends + transposase rule', () => {
  const v = t => evaluateElement(t).id;
  assert.equal(v([]), 'empty');
  assert.equal(v(['end', 'transposase', 'end']), 'simple-is');
  assert.equal(v(['end', 'transposase', 'cargo', 'end']), 'with-cargo');
  assert.equal(v(['end', 'cargo', 'end']), 'no-transposase');
  assert.equal(v(['end', 'end']), 'no-transposase');
  assert.equal(v(['transposase', 'end']), 'missing-ends');
  assert.equal(v(['end', 'transposase']), 'missing-ends');
  assert.equal(v(['host', 'end', 'transposase', 'end']), 'missing-ends');
  assert.equal(v(['end', 'transposase', 'host', 'end']), 'with-host');
  assert.equal(evaluateElement(['end', 'cargo', 'end']).movable, false);
  assert.equal(evaluateElement(['end', 'transposase', 'end']).movable, true);
  // Every goal is reachable.
  for (const goal of IS_GOALS) assert.ok([[], ['end', 'transposase', 'end'], ['end', 'end'], ['end', 'transposase', 'cargo', 'end'], ['transposase']].some(t => v(t) === goal.id), goal.id);
});

test('track limits: at most two ends and five parts; ends are inverted', () => {
  assert.equal(canAdd(['end', 'end'], 'end'), false);
  assert.equal(canAdd(['end'], 'end'), true);
  assert.equal(canAdd(Array(MAX_TRACK).fill('cargo'), 'transposase'), false);
  assert.equal(canAdd([], 'nonsense'), false);
  assert.deepEqual(endOrientations(['end', 'transposase', 'end']), {0: 1, 2: -1});
});

test('composite architecture: orientation decides direct vs inverted; each classical element is matchable', () => {
  assert.equal(arrangement({left: 1, right: -1}), 'inverted');
  assert.equal(arrangement({left: -1, right: 1}), 'inverted');
  assert.equal(arrangement({left: 1, right: 1}), 'direct');
  assert.equal(matchElement({module: 'IS50', left: 1, right: -1, cargo: 'kan'}), 'Tn5');
  assert.equal(matchElement({module: 'IS10', left: 1, right: -1, cargo: 'tet'}), 'Tn10');
  assert.equal(matchElement({module: 'IS1', left: 1, right: 1, cargo: 'cam'}), 'Tn9');
  assert.equal(matchElement({module: 'IS1', left: 1, right: -1, cargo: 'cam'}), null);
  assert.deepEqual(Object.values(REFERENCE).map(r => r.arrangement), ['inverted', 'inverted', 'direct']);
});

test('hints name exactly the mismatched features', () => {
  assert.deepEqual(hintsToward({module: 'IS1', left: 1, right: 1, cargo: 'cam'}, 'Tn9'), []);
  const hints = hintsToward({module: 'IS50', left: 1, right: -1, cargo: 'kan'}, 'Tn9');
  assert.equal(hints.length, 3);
  assert.match(hints[1], /direct repeats/);
});

test('outer ends move the whole unit; one module’s ends move only that IS', () => {
  assert.deepEqual(movingParts('outer').parts, ['left', 'cargo', 'right']);
  assert.deepEqual(movingParts('left').parts, ['left']);
  assert.match(movingParts('right').text, /cargo stays behind/);
  assert.throws(() => movingParts('middle'));
  assert.deepEqual(endsUsed('outer'), [['left', 0], ['right', 1]]);
  assert.match(describeDesign({module: 'IS1', left: 1, right: 1, cargo: 'cam'}), /direct repeats/);
});
