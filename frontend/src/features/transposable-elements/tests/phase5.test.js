import test from 'node:test';
import assert from 'node:assert/strict';
import {phase5} from '../curriculum/phase5.js';
import {rearrange,tsdEvidence,insertionExample} from '../engine/consequences.js';
import {isComplete,updateProgress,parseProgress} from '../lessonProgress.js';
test('recombination outcomes retain reciprocal products and reject unsupported substrates',()=>{
  const context={homology:true,orientation:'direct',substrate:'intramolecular'};
  const before=structuredClone(context);
  const d=rearrange('deletion',context);
  assert.deepEqual(d.products,[['L','TE→','R'],['TE→','X→']]);
  assert.deepEqual(d.topology,['linear','circular']);
  assert.deepEqual(context,before);
  const inv=rearrange('inversion',{...context,orientation:'inverted'});
  assert.deepEqual(inv.products,[['L','TE→','←X','←TE','R']]);
  const dup=rearrange('duplication',{...context,substrate:'misaligned-sisters'});
  assert.equal(dup.products[0].filter(x=>x==='X→').length,2);
  assert.equal(dup.products[1].filter(x=>x==='X→').length,0);
  assert.equal(dup.products.flat().filter(x=>x==='TE→').length,4);
  assert.throws(()=>rearrange('deletion',{...context,homology:false}));
  assert.throws(()=>rearrange('inversion',context));
  assert.throws(()=>rearrange('duplication',context));
  assert.throws(()=>rearrange('unknown',context));
});
test('engine-derived TSD pairs trace the same host interval; TIRs remain inside elements',()=>{
  for(const [family,bp] of [['tn5',9],['tn3',5]]){
    const {pairs,state}=tsdEvidence(family);
    assert.equal(pairs.length,2);
    assert.ok(pairs.every(p=>p.bp===bp && p.sourceId==='target' && !p.parentId));
    assert.deepEqual(pairs[0].sourceSegments,pairs[1].sourceSegments);
    assert.equal(pairs[0].pairId,pairs[1].pairId);
    const ends=state.molecules.flatMap(m=>m.features.filter(f=>f.kind==='TIR'));
    assert.ok(ends.length>=2 && ends.every(f=>f.parentId));
  }
  assert.throws(()=>insertionExample('is608'));
});
test('phenotype and expression contexts preserve conditional and undetermined answers',()=>{
  assert.deepEqual(phase5.find(l=>l.id==='phenotypes').variants.map(v=>v.outcome),['likely altered','likely unchanged','undetermined','likely unchanged']);
  assert.deepEqual(phase5.find(l=>l.id==='expression').variants.map(v=>v.outcome),['reduced','permitted','undetermined','reduced','permitted']);
  assert.deepEqual(phase5.find(l=>l.id==='regulation').variants.map(v=>v.outcome),['not permitted','permitted','reduced','not permitted','reduced','undetermined']);
});
test('five Phase 5 lessons require both checks, all contexts, and preserve saved check2',()=>{
  assert.deepEqual(phase5.map(l=>l.id),['genomic-consequences','phenotypes','expression','tsd','regulation']);
  for(const l of phase5){
    let p={};
    for(let i=0;i<l.variants.length;i++) p=updateProgress(p,l.id,'inspect',i);
    p=updateProgress(p,l.id,'exercise',l.exercise.correct);
    p=updateProgress(p,l.id,'check',l.check.correct);
    assert.equal(isComplete(l.id,p[l.id]),false);
    p=updateProgress(p,l.id,'check2',l.check2.correct);
    assert.equal(isComplete(l.id,p[l.id]),true);
    const parsed=parseProgress(JSON.stringify({version:1,records:p}));
    assert.equal(isComplete(l.id,parsed[l.id]),true);
    for(const name of ['exercise','check','check2']){
      for(let i=0;i<l[name].options.length;i++) assert.equal(isComplete(l.id,updateProgress(p,l.id,name,i)[l.id]),i===l[name].correct);
    }
  }
});
