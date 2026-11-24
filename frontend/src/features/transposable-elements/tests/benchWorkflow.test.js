import test from 'node:test';
import assert from 'node:assert/strict';
import references from '../profiles/references.json' with { type: 'json' };

const BENCH_REFS = ['qiagen-spectro', 'saiki1988', 'sigma-pcr', 'duewer2018', 'lee2012', 'neb-ecori', 'neb-hindiii', 'neb-bamhi'];

test('new bench references exist and are verified', () => {
  for (const id of BENCH_REFS) {
    const ref = references.find(r => r.id === id);
    assert.ok(ref, id);
    for (const key of ['citation', 'url', 'support', 'verification', 'verifiedOn']) assert.ok(ref[key], `${id}: ${key}`);
    assert.match(ref.url, /^https:\/\//, id);
    assert.equal(ref.verifiedOn, '2026-11-24', id);
  }
});
