import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phase6} from '../curriculum/phase6.js';
import {lessons,topicHref} from '../curriculum/lessons.js';
import {initialBacteria,bacterialTransition,resistanceExample,targetingCompatible,predictionFeedback} from '../engine/bacterial.js';
import {isComplete,updateProgress,parseProgress} from '../lessonProgress.js';
test('Topic 15 completes the original curriculum with five activity groups and traceable references',()=>{
 const topics=JSON.parse(readFileSync(new URL('../curriculum/topics.json',import.meta.url)));
 const refs=JSON.parse(readFileSync(new URL('../profiles/references.json',import.meta.url)));
 assert.equal(topics.length,15);assert.equal(lessons.length,13);
 assert.equal(topics[14].id,phase6.id);assert.equal(topics[14].status,'implemented');
 assert.equal(topicHref(topics[14]),'/learn/transposable-elements/bacterial-hgt');
 for(const id of phase6.references)assert.ok(refs.some(r=>r.id===id));
 for(const activity of ['identify','movement','resistance','tnsd','tnse','integron','classification'])assert.ok(phase6.variants.some(v=>v.activity===activity));
 assert.ok(phase6.variants.find(v=>v.activity==='integron').outcome.includes('site-specific'));
});
test('transposition preserves cellular ownership, transfer adds a recipient copy and preserves donor and chromosomes',()=>{
 const initial=initialBacteria(),saved=structuredClone(initial);
 const load=bacterialTransition(initial,'transpose');
 assert.deepEqual(initial,saved);assert.deepEqual(load.state.cells,initial.cells);
 assert.equal(load.event.scope,'within donor cell');assert.equal(load.state.phase,'loaded');
 const moved=bacterialTransition(load.state,'conjugate');
 assert.deepEqual(moved.state.cells.map(c=>c.chromosome),['donor-chromosome','recipient-chromosome']);
 assert.deepEqual(moved.state.cells[0].plasmids,['target']);assert.deepEqual(moved.state.cells[1].plasmids,['recipient-target']);
 assert.equal(moved.state.recipientPlasmid.lineageId,'target');
 assert.notStrictEqual(moved.state.recipientPlasmid.blocks,load.state.molecular.molecules.find(m=>m.id==='target').blocks);
 assert.equal(moved.event.scope,'between donor and recipient cells');
 assert.deepEqual(resistanceExample(2).events.map(e=>e.type),['transpose','conjugate']);
 assert.throws(()=>resistanceExample(3));
});
test('every conjugation prerequisite fails without mutation; repeated and unsupported events reject',()=>{
 const loaded=resistanceExample(1).state;
 for(const key of ['conjugative','oriT','machinery','contact','compatibleRecipient']){
  const bad=structuredClone(loaded);bad.transfer[key]=false;const saved=structuredClone(bad);
  assert.throws(()=>bacterialTransition(bad,'conjugate'));assert.deepEqual(bad,saved);
 }
 assert.throws(()=>bacterialTransition(initialBacteria(),'conjugate'));
 assert.throws(()=>bacterialTransition(loaded,'transpose'));
 assert.throws(()=>bacterialTransition(loaded,'cassette-capture'));
 assert.throws(()=>bacterialTransition(resistanceExample(2).state,'conjugate'));
});
test('Tn7 routes are context-specific, not interchangeable or guaranteed insertions',()=>{
 assert.equal(targetingCompatible('tnsd','attTn7-glmS'),true);
 assert.equal(targetingCompatible('tnse','replication-transfer'),true);
 assert.equal(targetingCompatible('tnsd','replication-transfer'),false);
 assert.equal(targetingCompatible('tnse','attTn7-glmS'),false);
 assert.equal(targetingCompatible('tnsd','attTn7-glmS',false),false);
 assert.throws(()=>targetingCompatible('integrase','attTn7-glmS'));
});
test('Topic 15 prediction feedback, all scenarios, two checks and persistence gate completion',()=>{
 let p={};const l=phase6;
 assert.equal(isComplete(l.id,undefined),false);
 for(const [i,v] of l.variants.entries()){
  assert.equal(predictionFeedback(v.outcome,'wrong',v.explanation).correct,false);
  const good=predictionFeedback(v.outcome,v.outcome,v.explanation);assert.equal(good.correct,true);assert.ok(good.text.includes(v.explanation));
  p=updateProgress(p,l.id,'inspect',i);
 }
 for(const key of ['exercise','check'])p=updateProgress(p,l.id,key,l[key].correct);
 assert.equal(isComplete(l.id,p[l.id]),false);
 p=updateProgress(p,l.id,'check2',l.check2.correct);
 assert.equal(isComplete(l.id,p[l.id]),true);
 assert.equal(isComplete(l.id,parseProgress(JSON.stringify({version:1,records:p}))[l.id]),true);
 assert.ok(l.variants.find(v=>v.activity==='resistance'&&v.stage===2).outcome.includes('undetermined'));
});
