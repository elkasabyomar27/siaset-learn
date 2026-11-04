import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitial,transition,replay,newHistory,execute,seek,reset,validateState } from '../engine/index.js';
import { copies,molecule,totalLength } from '../engine/model.js';
import { intervalSegments } from '../engine/contracts.js';
const replicate={type:'tn3.replicate',targetBoundary:200};const resolve={type:'tn3.resolve'};
const cointegrate=()=>transition(createInitial('tn3'),replicate).state;
function rebuild(state){state.molecules=state.molecules.map(m=>molecule(m.id,m.name,m.topology,m.blocks,{...(m.parentId?{parentId:m.parentId}:{}),...(m.parentIds?{parentIds:m.parentIds}:{})}));return state;}
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}
test('Tn3 starts with two circles and one intact donor copy',()=>{
  const s=createInitial('tn3');validateState(s);assert.equal(copies(s).length,1);assert.ok(s.molecules.every(m=>m.topology==='circular'));
  assert.equal(s.molecules[1].blocks.filter(b=>b.kind==='element').length,0);
  assert.ok(['tnpA','tnpR','res','bla','tir-left','tir-right'].every(key=>copies(s)[0].sites.some(f=>f.key===key)));
});
test('a single origin-crossing annotation preserves its identity and ordered segments',()=>{
  const s=createInitial('tn3');const t=s.molecules[1];
  s.molecules[1]=molecule(t.id,t.name,t.topology,t.blocks,{annotations:[{id:'origin-crossing',kind:'annotation',label:'Symbolic origin-crossing feature',orientation:1,segments:intervalSegments(890,20,900,'circular')}]});
  validateState(s);const features=s.molecules[1].features.filter(f=>f.id==='origin-crossing');assert.equal(features.length,1);assert.deepEqual(features[0].segments,[[890,900],[0,10]]);
  assert.throws(()=>transition(s,replicate));
});
test('completed cointegrate has traceable circular order, two direct copies, internal res and flanking five-base target junctions',()=>{
  const initial=freeze(createInitial('tn3'));const saved=structuredClone(initial);const {state,event}=transition(initial,replicate);
  assert.deepEqual(initial,saved);assert.equal(state.molecules.length,1);const c=state.molecules[0];assert.equal(c.topology,'circular');assert.equal(c.length,2205);
  assert.deepEqual(c.backboneIds,['donor','target']);assert.deepEqual(copies(state).map(b=>b.orientation),[1,1]);
  assert.equal(copies(state)[1].derivedFrom,'copy-1');assert.equal(c.features.filter(f=>f.kind==='res').length,2);
  for(const copy of copies(state)){const res=copy.sites.find(s=>s.key==='res');assert.equal(res.orientation,copy.orientation);assert.ok(res.start>0&&res.end<copy.length);}
  assert.deepEqual(c.blocks.map(b=>b.kind),['backbone','element','tsd','backbone','backbone','tsd','element']);
  const tsd=c.blocks.filter(b=>b.kind==='tsd');assert.ok(tsd.every(b=>b.bp===5));assert.deepEqual(tsd.map(b=>b.sourceSegments),[[[200,205]],[[200,205]]]);
  assert.deepEqual(replay(initial,[event]),state);
});
test('resolution calculates two circular products with one recombinant Tn3 each and conserved material',()=>{
  const initial=freeze(cointegrate());const saved=structuredClone(initial);const {state}=transition(initial,resolve);
  assert.deepEqual(initial,saved);assert.equal(state.phase,'resolved');assert.equal(totalLength(state),2205);
  assert.deepEqual(state.molecules.map(m=>[m.id,m.length,m.topology]),[['donor',1000,'circular'],['target',1205,'circular']]);
  for(const m of state.molecules){const es=m.blocks.filter(b=>b.kind==='element');assert.equal(es.length,1);assert.equal(es[0].recombinantOf.length,2);assert.equal(m.parentId,'cointegrate');}
  assert.deepEqual(state.molecules.map(m=>m.backboneIds),[['donor'],['target']]);
  assert.equal(state.molecules[0].blocks.filter(b=>b.kind==='tsd').length,0);assert.equal(state.molecules[1].blocks.filter(b=>b.kind==='tsd').length,2);
  assert.match(state.topologyNote,/catenated/);assert.match(state.topologyNote,/not simulated/);
});
test('resolution gates fail unchanged for missing/reversed res, wrong orientation, missing TnpR and malformed junctions',()=>{
  const cases=[
    s=>{s.enzymes.resolvase=false;},
    s=>{copies(s)[0].sites=copies(s)[0].sites.filter(f=>f.key!=='res');rebuild(s);},
    s=>{copies(s)[1].sites.find(f=>f.key==='res').orientation=-1;rebuild(s);},
    s=>{copies(s)[1].orientation=-1;rebuild(s);},
    s=>{s.molecules[0].topology='linear';},
    s=>{const b=s.molecules[0].blocks;b.reverse();rebuild(s);}
  ];
  for(const change of cases){const s=cointegrate();change(s);const saved=structuredClone(s);assert.throws(()=>transition(s,resolve));assert.deepEqual(s,saved);}
  const s=cointegrate();const saved=structuredClone(s);assert.throws(()=>transition(s,{...resolve,resolvaseAvailable:false}),{code:'TNPR'});assert.deepEqual(s,saved);
  assert.throws(()=>transition(createInitial('tn3'),resolve));assert.throws(()=>transition(transition(s,resolve).state,resolve));
});
test('Tn3 transposition preconditions and cross-mechanism operations reject',()=>{
  const s=createInitial('tn3');s.enzymes.transposase=false;assert.throws(()=>transition(s,replicate));
  assert.throws(()=>transition(createInitial('tn5'),replicate));assert.throws(()=>transition(createInitial('tn3'),{type:'tn5.transpose',targetBoundary:200}));
  assert.throws(()=>transition(cointegrate(),replicate));
});
test('Tn3 undo/redo/reset, deterministic replay and corrupted events',()=>{
  const initial=newHistory('tn3');const middle=execute(initial,replicate);const final=execute(middle,resolve);
  assert.deepEqual(seek(final,1).state,middle.state);assert.deepEqual(seek(final,0).state,initial.state);assert.deepEqual(seek(seek(final,0),2).state,final.state);
  assert.deepEqual(reset(final),initial);assert.deepEqual(replay(final.initial,final.events),final.state);
  const events=structuredClone(final.events);events[1].after='corrupted';assert.throws(()=>replay(final.initial,events));
  events[1]=structuredClone(final.events[1]);events[1].references=[];assert.throws(()=>replay(final.initial,events));
});
test('Tn3 boundary rotation including crossing target origin keeps all backbone material',()=>{
  for(const p of [0,1,200,895,899,900]){
    const mid=transition(createInitial('tn3'),{...replicate,targetBoundary:p});const end=transition(mid.state,resolve);validateState(end.state);assert.equal(totalLength(end.state),2205);
  }
  assert.deepEqual(transition(createInitial('tn3'),{...replicate,targetBoundary:0}).state,transition(createInitial('tn3'),{...replicate,targetBoundary:900}).state);
});
test('independent worked examples match calculated public outputs',()=>{
  const fixtures=JSON.parse(readFileSync(new URL('../fixtures/worked-examples.json',import.meta.url)));
  for(const f of fixtures){const s=f.id==='tn3-resolution'?cointegrate():createInitial(f.scenario);const out=transition(s,f.action).state;assert.equal(out.phase,f.expected.phase);assert.equal(copies(out).length,f.expected.copies);assert.equal(totalLength(out),f.expected.totalLength);assert.equal(out.molecules.length,f.expected.molecules);}
});
