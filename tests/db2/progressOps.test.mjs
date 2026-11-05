import test from 'node:test';
import assert from 'node:assert/strict';
import {database, ownerA, ownerB} from './database.mjs';

const op = (id, extra = {}) => ({id, version: 1, clock: 1, type: 'resetAttempts', ...extra});
function as(db, role, sub, sql, params = [], claims = {}) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [sub || '', JSON.stringify({sub, ...claims})]);
    return tx.query(sql, params);
  });
}
const insert = 'insert into public.progress_ops (user_id, op_id, op) values ($1, $2, $3)';

test('progress log entries are readable and appendable only by their signed-in owner', async () => {
  const db = await database();
  await as(db, 'authenticated', ownerA, insert, [ownerA, 'a1', JSON.stringify(op('a1'))]);
  await as(db, 'authenticated', ownerB, insert, [ownerB, 'b1', JSON.stringify(op('b1'))]);
  await assert.rejects(as(db, 'authenticated', ownerA, insert, [ownerB, 'a2', JSON.stringify(op('a2'))]), /row-level security/);
  await assert.rejects(as(db, 'authenticated', ownerA, insert, [ownerA, 'a3', JSON.stringify(op('a3'))], {is_anonymous: true}), /row-level security/);
  await assert.rejects(as(db, 'anon', '', insert, [ownerA, 'a4', JSON.stringify(op('a4'))]), /permission denied/);
  const ids = async (sub, claims) => (await as(db, 'authenticated', sub, 'select op_id from public.progress_ops order by op_id', [], claims)).rows.map(row => row.op_id);
  assert.deepEqual(await ids(ownerA), ['a1']);
  assert.deepEqual(await ids(ownerB), ['b1']);
  assert.deepEqual(await ids(ownerA, {is_anonymous: true}), []);
  await assert.rejects(as(db, 'authenticated', ownerA, "update public.progress_ops set op_id = 'x'"), /permission denied/);
  await assert.rejects(as(db, 'authenticated', ownerA, 'delete from public.progress_ops'), /permission denied/);
});

test('progress log rejects malformed entries and ignores re-uploads', async () => {
  const db = await database();
  const add = (id, value) => as(db, 'authenticated', ownerA, insert, [ownerA, id, JSON.stringify(value)]);
  for (const [id, value] of [['m1', op('other')], ['m2', op('m2', {version: 2})], ['m3', op('m3', {type: 'drop'})], ['m4', op('m4', {clock: 0})], ['m5', op('m5', {clock: '5'})], ['m6', op('m6', {pad: 'x'.repeat(70000)})]])
    await assert.rejects(add(id, value), /violates check constraint/, id);
  await add('ok', op('ok'));
  const again = await as(db, 'authenticated', ownerA, `${insert} on conflict do nothing returning op_id`, [ownerA, 'ok', JSON.stringify(op('ok'))]);
  assert.equal(again.rows.length, 0);
});
