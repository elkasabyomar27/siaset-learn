import test from 'node:test';
import assert from 'node:assert/strict';
import {readProgress, STORAGE_KEY, isComplete} from '../lessonProgress.js';
test('shared reader reflects current persisted completion without writing or caching', () => {
  let records = {introduction:{inspected:[0,1,2],exercise:1,check:1},'bacterial-hgt':{inspected:[0]}};
  const storage = {getItem(key){assert.equal(key,STORAGE_KEY);return JSON.stringify({version:1,records});}};
  assert.equal(isComplete('introduction',readProgress(storage).introduction),true);
  records.introduction.exercise=0;
  assert.equal(isComplete('introduction',readProgress(storage).introduction),false);
  records.introduction.exercise=1;
  assert.equal(isComplete('introduction',readProgress(storage).introduction),true);
  delete records['bacterial-hgt'];
  assert.equal(readProgress(storage)['bacterial-hgt'],undefined);
  assert.equal(isComplete('introduction',readProgress(storage).introduction),true);
});
test('shared reader tolerates missing, malformed and inaccessible storage', () => {
  for(const value of [null,'bad','{}']) assert.deepEqual(readProgress({getItem:()=>value}),{});
  assert.deepEqual(readProgress({getItem(){throw new Error('denied');}}),{});
});
