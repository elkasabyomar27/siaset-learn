import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitial, transition, replay, newHistory, execute, seek, reset, validateState } from '../engine/index.js';
import { copies, molecule, totalLength } from '../engine/model.js';
const action={type:'tn5.transpose',targetBoundary:200};
test('Tn5 calculated structure matches independent fixture, with one element and preserved terminal identities',()=>{
  const initial=createInitial(); const saved=structuredClone(initial); const {state,event}=transition(initial,action);
  assert.deepEqual(initial,saved); assert.equal(copies(state).length,1); assert.equal(copies(state)[0].copyId,'copy-1');
  const target=state.molecules.find(m=>m.id==='target');
  assert.equal(target.length,1209); assert.equal(totalLength(state),1909); assert.equal(state.molecules.length,3);
  assert.deepEqual(target.features.filter(f=>f.kind==='TIR').map(f=>f.id),['copy-1:tir-left','copy-1:tir-right']);
  const blocks=target.blocks; assert.deepEqual(blocks.slice(0,3).map(b=>b.kind),['tsd','element','tsd']);
  assert.deepEqual(blocks[0].sourceSegments,[[200,209]]); assert.deepEqual(blocks[0].sourceSegments,blocks[2].sourceSegments);
  assert.ok(blocks.filter(b=>b.kind==='tsd').every(b=>b.bp===9&&b.sourceId==='target'));
  assert.equal(state.donorRepair,'unresolved'); assert.ok(state.molecules.filter(m=>m.parentId==='donor').every(m=>m.endStatus==='unrepaired'&&m.topology==='linear'));
  assert.deepEqual(replay(initial,[event]),state);
});
test('Tn5 origin crossing and L=0 equivalence, without invented sequence',()=>{
  const initial=createInitial();
  assert.deepEqual(transition(initial,{...action,targetBoundary:0}).state,transition(initial,{...action,targetBoundary:900}).state);
  const state=transition(initial,{...action,targetBoundary:897}).state;
  const tsd=state.molecules.find(m=>m.id==='target').blocks[0]; assert.deepEqual(tsd.sourceSegments,[[897,900],[0,6]]); validateState(state);
});
test('Tn5 invalid operations reject without mutation',()=>{
  for(const change of [s=>{s.enzymes.transposase=false;},s=>{const d=s.molecules[0];d.blocks[1].sites.shift();s.molecules[0]=molecule(d.id,d.name,d.topology,d.blocks);}]){
    const state=createInitial();change(state);const saved=structuredClone(state);assert.throws(()=>transition(state,action));assert.deepEqual(state,saved);
  }
  for(const targetBoundary of [-1,901,0.5,undefined]) assert.throws(()=>transition(createInitial(),{...action,targetBoundary}));
  const done=transition(createInitial(),action).state;assert.throws(()=>transition(done,action));
  assert.throws(()=>transition({...createInitial(),schemaVersion:2},action));
  assert.throws(()=>transition(createInitial(),{type:'unknown'}));
});
test('history undo/redo/reset and event tampering fail closed',()=>{
  const h=execute(newHistory(),action);assert.deepEqual(seek(h,0).state,h.initial);assert.deepEqual(seek(seek(h,0),1).state,h.state);
  assert.equal(reset(h).events.length,0);assert.deepEqual(reset(h).state,h.initial);
  const event=structuredClone(h.events[0]);event.action.targetBoundary=250;assert.throws(()=>replay(h.initial,[event]));
  const branch=execute(seek(h,0),{...action,targetBoundary:300});assert.equal(branch.events.length,1);assert.notDeepEqual(branch.state,h.state);
});
