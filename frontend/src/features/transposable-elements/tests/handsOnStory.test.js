import test from 'node:test';
import assert from 'node:assert/strict';
import { newStory, storyAction, isComplete, boundaryFromAngle } from '../storyLab.js';
import { validLabEvidence } from '../learnerRecords.js';
import { storyIntent } from '../hands-on/intents/story.js';

const evidence = s => ({scenario: s.scenario, stage: s.stage, answers: s.answers, events: s.history.events.slice(0, s.history.cursor)});
const run = (s, actions) => actions.reduce(storyAction, s);
const toAction = (scenario, g) => {
  const a = g.type === 'answer' ? g : storyIntent(scenario, g);
  return a && a.angle !== undefined ? {...a, boundary: boundaryFromAngle(a.angle)} : a;
};
const replay = (scenario, steps) => steps.reduce((s, g) => storyAction(s, toAction(scenario, g)), newStory(scenario));
const hold = target => ({kind: 'hold', target}), swipe = target => ({kind: 'swipe', target}), tap = target => ({kind: 'tap', target});

test('Tn5 gestures replay to the same evidence as the button path', () => {
  const s = replay('tn5', [
    hold('end-left'), hold('end-right'), {type: 'answer', checkpoint: 'tn5', value: 0},
    swipe('end-left'), swipe('end-right'),
    {kind: 'drop', target: 'ring', angle: 55}, tap('inserted'), tap('target-tsd-left'), tap('target-tsd-right'),
  ]);
  assert.ok(isComplete(s));
  assert.equal(s.history.events.length, 1);
  assert.equal(validLabEvidence(evidence(s)), true);
  const literal = run(newStory('tn5'), [
    {type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}, {type: 'answer', checkpoint: 'tn5', value: 0},
    {type: 'cut', end: 'left'}, {type: 'cut', end: 'right'}, {type: 'insert', angle: 55, boundary: boundaryFromAngle(55)},
    {type: 'continue'}, {type: 'inspect', feature: 'target-tsd-left'}, {type: 'inspect', feature: 'target-tsd-right'},
  ]);
  assert.deepEqual(s, literal);
});

test('Tn3 gestures replay to resolved, valid evidence', () => {
  let s = replay('tn3', [
    {kind: 'drop', target: 'target-circle', angle: 80}, {type: 'answer', checkpoint: 'tn3', value: 1},
    hold('fork'), tap('copy-1'), tap('copy-2'), {type: 'answer', checkpoint: 'resolution', value: 2},
  ]);
  s = storyAction(s, {type: 'resolve'});
  assert.match(s.message.text, /TnpR/);
  s = storyAction(s, storyIntent('tn3', {kind: 'drop', target: 'tnpR'}));
  s = storyAction(s, storyIntent('tn3', {kind: 'drag-off', target: 'tnpR'}));
  s = storyAction(s, {type: 'resolve'});
  assert.match(s.message.text, /TnpR/);
  s = run(s, [storyIntent('tn3', {kind: 'drop', target: 'tnpR'}), {type: 'resolve'}]);
  assert.ok(isComplete(s));
  assert.equal(s.history.state.phase, 'resolved');
  assert.equal(validLabEvidence(evidence(s)), true);
});

test('premature gestures still reach the model; meaningless ones map to null', () => {
  const act = storyIntent('tn5', swipe('end-left'));
  assert.deepEqual(act, {type: 'cut', end: 'left'});
  const bound = run(newStory('tn5'), [{type: 'bind', end: 'left'}, {type: 'bind', end: 'right'}]);
  assert.match(storyAction(bound, act).message.text, /correct prediction/);
  assert.equal(storyIntent('tn5', tap('ring')), null);
  assert.equal(storyIntent('tn3', swipe('fork')), null);
  assert.equal(storyIntent('nope', hold('fork')), null);
});
