import test from 'node:test';
import assert from 'node:assert/strict';
import { newStory, storyAction, isComplete, boundaryFromAngle, FINAL_STAGE, STORY } from '../storyLab.js';
import { validLabEvidence } from '../learnerRecords.js';
import { guidedStages } from '../learning.js';

const run = (s, actions) => actions.reduce(storyAction, s);
const evidence = s => ({scenario: s.scenario, stage: s.stage, answers: s.answers, events: s.history.events.slice(0, s.history.cursor)});

test('story steps map onto every original guided stage', () => {
  for (const sc of ['tn5', 'tn3']) assert.deepEqual(STORY[sc].map(x => x.stage), guidedStages[sc].map((_, i) => i));
});

test('Tn5 story produces valid completion evidence through the engine', () => {
  const s = run(newStory('tn5'), [
    {type: 'bind', end: 'left'}, {type: 'bind', end: 'right'},
    {type: 'answer', checkpoint: 'tn5', value: 0},
    {type: 'cut', end: 'left'}, {type: 'cut', end: 'right'},
    {type: 'insert', boundary: 137.4},
    {type: 'continue'},
    {type: 'inspect', feature: 'target-tsd-left'}, {type: 'inspect', feature: 'target-tsd-right'},
  ]);
  assert.equal(s.stage, FINAL_STAGE.tn5); assert.ok(isComplete(s));
  assert.equal(s.history.events.length, 1);
  assert.equal(s.history.state.phase, 'inserted');
  assert.equal(validLabEvidence(evidence(s)), true);
});

test('Tn5 story gates: no cutting before a correct prediction, no insertion before both cuts', () => {
  let s = run(newStory('tn5'), [{type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}, {type: 'answer', checkpoint: 'tn5', value: 1}, {type: 'cut', end: 'left'}]);
  assert.deepEqual(s.cut, []); assert.match(s.message.text, /correct prediction/);
  s = run(s, [{type: 'answer', checkpoint: 'tn5', value: 0}, {type: 'cut', end: 'left'}, {type: 'insert', boundary: 200}]);
  assert.equal(s.stage, 1); assert.equal(s.history.events.length, 0); assert.match(s.message.text, /both ends/);
  assert.equal(run(newStory('tn5'), [{type: 'insert', boundary: 200}]).history.events.length, 0);
});

test('Tn3 story: replication, rejected resolution without TnpR, then valid evidence', () => {
  let s = run(newStory('tn3'), [
    {type: 'dock-target', boundary: boundaryFromAngle(80)},
    {type: 'answer', checkpoint: 'tn3', value: 1},
    {type: 'replicate'},
    {type: 'inspect', feature: 'copy-1'}, {type: 'inspect', feature: 'copy-2'},
    {type: 'answer', checkpoint: 'resolution', value: 2},
    {type: 'resolve'},
  ]);
  assert.equal(s.stage, 4); assert.equal(s.history.state.phase, 'cointegrate'); assert.match(s.message.text, /TnpR/);
  s = run(s, [{type: 'enzyme', available: true}, {type: 'resolve'}]);
  assert.equal(s.stage, FINAL_STAGE.tn3); assert.equal(s.history.state.phase, 'resolved');
  assert.equal(s.history.events.length, 2);
  assert.equal(validLabEvidence(evidence(s)), true);
  assert.equal(s.change.headline, 'The cointegrate was resolved into two molecules.');
});

test('wrong Tn3 prediction keeps the learner at strand transfer; angles map onto the ring', () => {
  const s = run(newStory('tn3'), [{type: 'dock-target', boundary: 200}, {type: 'answer', checkpoint: 'tn3', value: 0}]);
  assert.equal(s.stage, 1);
  assert.equal(boundaryFromAngle(0), 0); assert.equal(boundaryFromAngle(90), 225); assert.equal(boundaryFromAngle(-90), 675); assert.equal(boundaryFromAngle(359.9), 899);
  assert.throws(() => newStory('tn7'));
});
