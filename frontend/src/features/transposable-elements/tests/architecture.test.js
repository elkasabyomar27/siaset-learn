import test from 'node:test';
import assert from 'node:assert/strict';
import topics from '../curriculum/topics.json' with {type:'json'};
import bankV1 from './assessment-v1.json' with {type:'json'};
import {questions,buildQuestions,BANK_VERSION} from '../assessment.js';
import {topicHref} from '../curriculum/lessons.js';
import {adjacentTopics} from '../curriculum/navigation.js';
import {topicCompleted,progressSummary,validLabEvidence} from '../learnerRecords.js';
import {guidedStages,stageForCursor,canAdvance,actionForStep,checkpoints} from '../learning.js';
import {newHistory,execute,seek} from '../engine/index.js';

test('assessment v1 remains exactly compatible: order, IDs, keys, wording and references',()=>{
  assert.equal(BANK_VERSION,1);
  assert.deepEqual(questions,bankV1);
  const reordered=[...topics].reverse().map((topic,index)=>({...topic,order:index*10+100}));
  const rebuilt=buildQuestions(reordered);
  for(const topic of reordered) assert.deepEqual(rebuilt.filter(q=>q.topicId===topic.id),bankV1.filter(q=>q.topicId===topic.id));
});

test('curriculum routing and lab completion depend on explicit metadata, not numbers or positions',()=>{
  for(const topic of topics){
    const renumbered={...topic,order:900};
    assert.equal(topicHref(renumbered),topicHref(topic));
    if(topic.learning.kind==='laboratory'){
      assert.equal(topicCompleted(renumbered,{},{}),false);
      assert.equal(topicCompleted(renumbered,{}, {[topic.learning.experiment]:{}}),true);
    }
  }
  const labs=topics.filter(t=>t.learning.kind==='laboratory');
  assert.deepEqual(progressSummary(labs,{}, {tn5:{}}),{completed:1,total:2,percentage:50});
  assert.deepEqual(progressSummary([],{},{}),{completed:0,total:0,percentage:0});
  const curriculum=[{id:'last',order:40},{id:'first',order:2},{id:'middle',order:12}];
  assert.deepEqual(adjacentTopics('middle',curriculum),{previous:curriculum[1],next:curriculum[0]});
  assert.equal(adjacentTopics('first',curriculum).previous,undefined);
  assert.deepEqual(adjacentTopics('missing',curriculum),{});
});

test('all guided stages track actual engine cursors and preserve review gates through undo/redo',()=>{
  for(const scenario of ['tn5','tn3']){
    let history=newHistory(scenario);
    const answers={};
    const steps=guidedStages[scenario];
    assert.equal(new Set(steps.map(s=>s.id)).size,steps.length);
    for(const [index,step] of steps.entries()){
      assert.equal(history.cursor,step.cursor);
      assert.ok(step.note&&step.title);
      if(step.checkpoint){
        assert.equal(canAdvance(scenario,index,answers),false);
        answers[step.checkpoint]=checkpoints[step.checkpoint].correct;
        assert.equal(canAdvance(scenario,index,answers),true);
      }
      assert.equal(canAdvance(scenario,index,answers),!step.final);
      assert.equal(validLabEvidence({scenario,stage:index,answers,events:history.events.slice(0,history.cursor)}),!!step.final);
      const action=actionForStep(scenario,index,200);
      if(action) history=execute(history,{...action,...(step.enzymeGate?{resolvaseAvailable:true}:{})});
    }
    for(let cursor=history.events.length;cursor>=0;cursor--){
      const sought=seek(history,cursor);
      const step=steps[stageForCursor(scenario,sought.cursor)];
      assert.ok(step.historyLanding);
      assert.equal(step.cursor,cursor);
    }
    for(let cursor=0;cursor<=history.events.length;cursor++) assert.equal(steps[stageForCursor(scenario,seek(history,cursor).cursor)].cursor,cursor);
    assert.throws(()=>stageForCursor(scenario,99));
  }
  assert.equal(canAdvance('tn5',-1,{}),false);
});
