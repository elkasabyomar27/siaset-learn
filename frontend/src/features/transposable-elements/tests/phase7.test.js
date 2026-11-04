import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newSandbox,runSandbox,sandboxPositions} from '../sandboxSession.js';
import {seek,replay,reset} from '../engine/index.js';
import {copies} from '../engine/model.js';
import {questions,scoreAssessment} from '../assessment.js';
import {lessons} from '../curriculum/lessons.js';
import {LAB_KEY,ASSESSMENT_KEY,validLabEvidence,recordLab,readLabs,appendAttempt,readAttempts,progressSummary,topicCompleted,loadRecord,saveRecord} from '../learnerRecords.js';
const read=p=>JSON.parse(readFileSync(new URL(`../${p}`,import.meta.url)));
const topics=read('curriculum/topics.json');
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
const allCorrect=()=>Object.fromEntries(questions.map(q=>[q.id,q.correct]));
test('sandbox presets and all bounded placements preserve mechanism-specific structures and history',()=>{
 assert.throws(()=>newSandbox('tn7'));
 for(const scenario of ['tn5','tn3'])for(const boundary of sandboxPositions){
  const initial=newSandbox(scenario),snapshot=structuredClone(initial);
  const h=runSandbox(initial,boundary);
  assert.deepEqual(initial,snapshot);assert.equal(copies(h.state).length,scenario==='tn5'?1:2);
  const tsds=h.state.molecules.flatMap(m=>m.blocks.filter(b=>b.kind==='tsd'));
  assert.equal(tsds.length,2);assert.ok(tsds.every(b=>b.bp===(scenario==='tn5'?9:5)));
  assert.deepEqual(tsds[0].sourceSegments,tsds[1].sourceSegments);
  assert.ok(h.state.molecules.flatMap(m=>m.features.filter(f=>f.kind==='TIR')).every(f=>f.parentId));
  assert.deepEqual(seek(h,0).state,initial.state);assert.deepEqual(seek(seek(h,0),1).state,h.state);
  assert.deepEqual(replay(h.initial,h.events),h.state);assert.deepEqual(reset(h).state,initial.state);
  if(scenario==='tn5'){assert.equal(h.state.donorRepair,'unresolved');}
  else {
   assert.equal(h.state.molecules.length,1);assert.deepEqual(copies(h.state).map(c=>c.orientation),[1,1]);
   assert.equal(h.state.molecules[0].features.filter(f=>f.kind==='res').length,2);
   const saved=structuredClone(h);assert.throws(()=>runSandbox(h,boundary,false));assert.deepEqual(h,saved);
   const resolved=runSandbox(h,boundary,true);assert.equal(resolved.state.molecules.length,2);assert.equal(copies(resolved.state).length,2);
   assert.deepEqual(replay(resolved.initial,resolved.events),resolved.state);
  }
  assert.throws(()=>runSandbox(initial,201));assert.deepEqual(initial,snapshot);
 }
});
test('assessment covers all fifteen topics in order with explicit evidence and validated keys',()=>{
 assert.equal(questions.length,25);assert.equal(new Set(questions.map(q=>q.id)).size,25);
 assert.deepEqual([...new Set(questions.map(q=>q.topicId))],topics.map(t=>t.id));
 const refs=read('profiles/references.json');for(const q of questions){assert.ok(q.explanation);for(const id of q.references)assert.ok(refs.some(r=>r.id===id));}
 assert.equal(scoreAssessment(allCorrect()).correct,25);assert.equal(scoreAssessment({}).answered,0);
 for(const value of [null,[],{unknown:0},{[questions[0].id]:'1'},{[questions[0].id]:-1},{[questions[0].id]:99}])assert.throws(()=>scoreAssessment(value));
 const wrong=allCorrect();wrong[questions[0].id]=(questions[0].correct+1)%questions[0].options.length;
 assert.equal(scoreAssessment(wrong).correct,24);assert.equal(scoreAssessment(wrong).topics[0].correct,0);
});
test('assessment persistence, retry and scoped removal never touch lesson records',()=>{
 const s=memory();s.setItem('siaset-lessons-v1','original');
 assert.equal(appendAttempt(allCorrect(),'2026-11-02T12:00:00Z',s),true);
 assert.equal(appendAttempt(allCorrect(),'2026-11-02T13:00:00Z',s),true);
 assert.equal(readAttempts(s).length,2);assert.throws(()=>appendAttempt({},'2026-11-02',s));
 assert.equal(scoreAssessment(readAttempts(s)[0].answers).correct,25);
 saveRecord(ASSESSMENT_KEY,{version:1,attempts:[]},s);assert.deepEqual(readAttempts(s),[]);
 assert.equal(s.getItem('siaset-lessons-v1'),'original');
});
test('guided completion requires reviewed final state, correct predictions and replay-valid events; sandbox grants nothing',()=>{
 const s=memory();assert.deepEqual(readLabs(s),{});
 for(const scenario of ['tn5','tn3']){
  let h=runSandbox(newSandbox(scenario),200);const answers=scenario==='tn5'?{tn5:0}:{tn3:1,resolution:2};const finalStage=scenario==='tn5'?4:5;
  if(scenario==='tn3')h=runSandbox(h,200,true);
  assert.equal(recordLab(h,0,answers,s),false);assert.equal(recordLab(h,finalStage,{},s),false);
  assert.equal(recordLab(h,finalStage,answers,s),true);
  const record=readLabs(s)[scenario];assert.ok(validLabEvidence(record));
  const corrupt=structuredClone(record);corrupt.events[0].after='bad';assert.equal(validLabEvidence(corrupt),false);
 }
 const progress=Object.fromEntries(topics.filter(t=>![6,7].includes(t.order)).map(t=>[t.id,{inspected:Array.from({length:12},(_,i)=>i),exercise:1,check:1,check2:1}]));
 const emptySummary=progressSummary(topics,{},{});assert.deepEqual(emptySummary,{completed:0,total:15,percentage:0});
 assert.equal(progressSummary(topics,{},readLabs(s)).completed,2);
 assert.equal(topicCompleted(topics[5],progress,{}),false);
 assert.equal(topicCompleted(topics[5],progress,readLabs(s)),true);
 const allLessons=Object.fromEntries(lessons.map(l=>[l.id,{inspected:l.variants.map((_,i)=>i),exercise:l.exercise.correct,check:l.check.correct,...(l.check2?{check2:l.check2.correct}:{})}]));
 assert.deepEqual(progressSummary(topics,allLessons,readLabs(s)),{completed:15,total:15,percentage:100});
 delete allLessons.introduction;
 assert.equal(progressSummary(topics,allLessons,readLabs(s)).completed,14);
});
test('new storage safely rejects malformed/outdated/forged records and inaccessible storage',()=>{
 const s=memory();for(const raw of ['bad','null','{}','{"version":2}']){s.setItem(LAB_KEY,raw);s.setItem(ASSESSMENT_KEY,raw);assert.deepEqual(readLabs(s),{});assert.deepEqual(readAttempts(s),[]);}
 s.setItem(LAB_KEY,JSON.stringify({version:1,records:{tn5:{completed:true}}}));assert.deepEqual(readLabs(s),{});
 const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
 assert.equal(loadRecord(LAB_KEY,denied),null);assert.equal(saveRecord(LAB_KEY,{version:1},denied),false);
});
test('Phase 7 static routes precede generic topic route and build entry remains integrated',()=>{
 const source=readFileSync(new URL('../../../main.jsx',import.meta.url),'utf8');
 for(const route of ['/lab/transposable-elements/sandbox','/learn/transposable-elements/assessment','/learn/transposable-elements/progress'])assert.ok(source.indexOf(`path="${route}"`)>0&&source.indexOf(`path="${route}"`)<source.indexOf('path="/learn/transposable-elements/:topicId"'));
});
