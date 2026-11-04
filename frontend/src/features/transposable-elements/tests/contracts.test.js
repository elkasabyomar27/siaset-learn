import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boundary, intervalSegments, studentLabels, validateFeature, validateEvent, SCHEMA_VERSION } from '../engine/contracts.js';
const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const topics = read('curriculum/topics.json');
const scenarios = read('curriculum/scenarios.json');
const profiles = read('profiles/mechanisms.json');
const refs = read('profiles/references.json');
const fixtures = read('fixtures/worked-examples.json');
test('15 topics retain original numbering, order and complete registry fields', () => {
  assert.equal(topics.length, 15);
  assert.deepEqual(topics.map(t => t.order), Array.from({ length: 15 }, (_, i) => i + 1));
  assert.equal(new Set(topics.map(t => t.id)).size, 15);
  assert.equal(topics[5].id, 'conservative'); assert.equal(topics[6].id, 'replicative');
  for (const t of topics) for (const key of ['learningObjectives','essentialTerminology','mechanismProfiles','plannedActivities','assessmentObjectives','references']) assert.ok(t[key].length, `${t.id}: ${key}`);
  assert.ok(topics.every(t => t.status !== 'planned')); 
});
test('scenario/profile/reference relationships have valid unique IDs', () => {
  for (const list of [scenarios,profiles,refs,fixtures]) assert.equal(new Set(list.map(v => v.id)).size,list.length);
  for (const t of topics) for (const id of t.mechanismProfiles) assert.ok(profiles.some(p => p.id === id));
  for (const s of scenarios) {
    assert.ok(topics.some(t => t.id === s.topicId));
    for (const id of s.profileIds) assert.ok(profiles.some(p => p.id === id));
    if (s.status === 'planned') assert.deepEqual(s.actions, []);
  }
  for (const entry of [...profiles,...topics]) for (const id of entry.references) assert.ok(refs.some(r => r.id === id));
  for (const p of profiles) { for (const key of ['element','context','evidenceStatus','sequenceProvenance','assumptions','limitations','unresolvedQuestions']) assert.ok(p[key]?.length); assert.ok(p.references.length,`${p.id} needs verified references`); }
  for (const r of refs) { assert.equal(new URL(r.url).protocol,'https:'); assert.ok(r.verification); }
});
test('coordinate conversions and origin-crossing feature remain one identity', () => {
  assert.equal(boundary(100,100,'circular'),0);
  assert.equal(boundary(100,100,'linear'),100);
  assert.deepEqual(intervalSegments(90,20,100,'circular'),[[90,100],[0,10]]);
  assert.deepEqual(intervalSegments(100,5,100,'circular'),[[0,5]]);
  const f = { id:'crossing', orientation:1, segments:intervalSegments(90,20,100,'circular') };
  validateFeature(f,100); assert.equal(studentLabels(f.segments),'91–100, 1–10');
  assert.throws(() => intervalSegments(90,20,100,'linear'));
  for (const v of [-1,101,NaN,1.2]) assert.throws(() => boundary(v,100,'circular'));
  assert.throws(() => validateFeature({ ...f, segments:[[0,10],[5,15]] },100));
});
test('independent fixture arithmetic and mechanism-specific TSD contracts', () => {
  const [tn5,tn3,res] = fixtures;
  assert.equal(tn5.expected.totalLength,1900+9);
  assert.equal(tn3.expected.totalLength,1900+300+5);
  assert.equal(res.expected.totalLength,tn3.expected.totalLength);
  assert.equal(res.expected.copies,tn3.expected.copies);
  assert.equal(profiles.find(p=>p.id==='tn5').tsdBp,9);
  assert.equal(profiles.find(p=>p.id==='tn3').tsdBp,5);
  for (const f of fixtures) assert.ok(f.initial && f.action && f.expected && f.invariants.length && f.limitations.length);
});
test('event schema and incompatible versions fail closed', () => {
  const event = {schemaVersion:SCHEMA_VERSION,id:'event-1',type:'tn5.transpose',action:{type:'tn5.transpose'},before:'{}',after:'{}',fromRevision:0,toRevision:1,references:['tn5-conservative']};
  assert.equal(validateEvent(event),true);
  assert.throws(()=>validateEvent({...event,schemaVersion:2}));
  assert.throws(()=>validateEvent({...event,toRevision:4}));
  assert.throws(()=>validateEvent({...event,action:null}));
});
