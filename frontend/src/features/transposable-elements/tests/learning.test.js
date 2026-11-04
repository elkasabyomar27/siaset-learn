import test from 'node:test';
import assert from 'node:assert/strict';
import { stages,checkpoints,canAdvance,actionForStep } from '../learning.js';
test('Tn5 guided checkpoint gates the calculated molecular transition',()=>{
  assert.equal(stages.tn5.length,5);
  assert.equal(canAdvance('tn5',0,{}),true);
  assert.equal(canAdvance('tn5',1,{}),false);
  assert.equal(canAdvance('tn5',1,{tn5:1}),false);
  assert.equal(canAdvance('tn5',1,{tn5:checkpoints.tn5.correct}),true);
  assert.deepEqual(actionForStep('tn5',1,200),{type:'tn5.transpose',targetBoundary:200});
  assert.equal(actionForStep('tn5',0,200),null);
  assert.equal(canAdvance('tn5',4,{}),false);
});
test('Tn3 exposes six stages, two checkpoints and only two molecular actions',()=>{
  assert.equal(stages.tn3.length,6);
  assert.equal(canAdvance('tn3',1,{}),false);assert.equal(canAdvance('tn3',1,{tn3:1}),true);
  assert.equal(actionForStep('tn3',1,200),null);assert.deepEqual(actionForStep('tn3',2,200),{type:'tn3.replicate',targetBoundary:200});
  assert.equal(canAdvance('tn3',4,{resolution:0}),false);assert.equal(canAdvance('tn3',4,{resolution:2}),true);
  assert.deepEqual(actionForStep('tn3',4,200),{type:'tn3.resolve'});assert.equal(actionForStep('tn3',3,200),null);
});
