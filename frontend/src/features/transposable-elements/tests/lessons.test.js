import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons, topicHref} from '../curriculum/lessons.js';
import {isCorrect, isComplete, updateProgress, parseProgress} from '../lessonProgress.js';
const read = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url)));
const topics = read('curriculum/topics.json');
test('Phase 4 maps exactly seven lessons to original topics, retaining future scope', () => {
  assert.deepEqual(lessons.filter(l=>!l.check2).map(l => topics.find(t => t.id === l.id).order), [1,2,3,4,5,8,9]);
  assert.deepEqual(topics.map(t => t.order), Array.from({length:15}, (_,i) => i+1));
  assert.equal(topics[14].status,'implemented'); assert.equal(topicHref(topics[14]),'/learn/transposable-elements/bacterial-hgt');
  assert.equal(topicHref(topics[5]),'/lab/transposable-elements?experiment=tn5');
  assert.equal(topicHref(topics[6]),'/lab/transposable-elements?experiment=tn3');
  for (const l of lessons.filter(l => topics.some(t => t.id === l.id))) {
    const t = topics.find(t => t.id === l.id);
    assert.equal(t.lessonId,l.id); assert.equal(t.status,'implemented');
    assert.ok(t.plannedActivities.includes(l.exercise.question));
    assert.equal(topicHref(t),`/learn/transposable-elements/${l.id}`);
  }
});
test('all lessons have scientific content, references, exploration and distinct reasoning checks', () => {
  const refs = read('profiles/references.json');
  for (const l of lessons) {
    assert.ok(l.objectives.length >= 2 && l.terms.length && l.concept && l.limitations);
    assert.ok(l.variants.length >= 3);
    for (const v of l.variants) assert.ok(v.label && v.blocks.length && v.explanation);
    for (const id of l.references) assert.ok(refs.some(r => r.id === id));
    assert.notEqual(l.exercise.question,l.check.question);
    for (const q of [l.exercise,l.check,l.check2].filter(Boolean)) {
      assert.ok(q.explanation);
      q.options.forEach((_,i) => assert.equal(isCorrect(q,i),i === q.correct));
      for (const bad of [undefined,null,'1',-1,99,NaN,0.5]) assert.equal(isCorrect(q,bad),false);
    }
  }
});
test('completion requires all inspections and both correct answers, never page access', () => {
  for (const l of lessons) {
    let p = {};
    assert.equal(isComplete(l.id,p[l.id]),false);
    p = updateProgress(p,l.id,'exercise',l.exercise.correct);
    p = updateProgress(p,l.id,'check',l.check.correct);
    assert.equal(isComplete(l.id,p[l.id]),false);
    p = updateProgress(p,l.id,'inspect',0);
    p = updateProgress(p,l.id,'inspect',1);
    assert.equal(isComplete(l.id,p[l.id]),false);
    const before = structuredClone(p);
    p = updateProgress(p,l.id,'inspect',2);
    assert.deepEqual(before[l.id].inspected,[0,1]);
    for(let i=3;i<l.variants.length;i++) p=updateProgress(p,l.id,'inspect',i);
    if(l.check2) p=updateProgress(p,l.id,'check2',l.check2.correct);
    assert.equal(isComplete(l.id,p[l.id]),true);
    p = updateProgress(p,l.id,'exercise',(l.exercise.correct+1)%l.exercise.options.length);
    assert.equal(isComplete(l.id,p[l.id]),false);
  }
});
test('storage validates version, drops malformed fields and ignores claimed completion', () => {
  for (const raw of ['broken','null','{}','{"version":2,"records":{}}']) assert.deepEqual(parseProgress(raw),{});
  const raw = JSON.stringify({version:1,records:{introduction:{completed:true,inspected:[0,0,-1,1,2,99],exercise:1,check:1},unknown:{completed:true}}});
  const p = parseProgress(raw);
  assert.deepEqual(p.introduction.inspected,[0,1,2]);
  assert.equal(isComplete('introduction',p.introduction),true);
  assert.equal(p.unknown,undefined);
  assert.equal(isComplete('unknown',{}),false);
  const invalid = updateProgress(p,'introduction','inspect',-1);
  assert.strictEqual(invalid,p);
});
