import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressRepository, OP_PREFIX} from '../progressRepository.js';
import {createProgressSync, syncProgress, migrateLegacy, OWNER_KEY} from '../progressSync.js';
import {STORAGE_KEY} from '../lessonProgress.js';
import {ASSESSMENT_KEY} from '../learnerRecords.js';
import {questions} from '../assessment.js';

const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const answers = Object.fromEntries(questions.map(q => [q.id, q.correct]));

function memory() {
  const values = new Map();
  return {values, get length() { return values.size; }, key: i => [...values.keys()][i] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)};
}
/** In-memory stand-in for the Supabase table, enforcing the same owner-only access as RLS. */
function server() {
  const rows = new Map(), state = {failDownload: false, failUpload: false};
  const client = userId => ({from: () => ({
    select() {
      const query = {eq(_column, value) { query.user = value; return query; }, order() { return query; },
        async range(from, to) {
          if (state.failDownload) return {data: null, error: {message: 'offline'}};
          const data = [...rows.values()].filter(row => row.user_id === userId && row.user_id === query.user)
            .sort((a, b) => a.op_id < b.op_id ? -1 : 1).slice(from, to + 1).map(row => ({op_id: row.op_id, op: structuredClone(row.op)}));
          return {data, error: null};
        }};
      return query;
    },
    async upsert(list) {
      if (state.failUpload || list.some(row => row.user_id !== userId)) return {error: {message: 'denied'}};
      for (const row of list) if (!rows.has(`${row.user_id}|${row.op_id}`)) rows.set(`${row.user_id}|${row.op_id}`, structuredClone(row));
      return {error: null};
    },
  })});
  return {rows, state, client};
}
function device(name) {
  const storage = memory();
  let sequence = 0;
  const repository = createProgressRepository({storage: () => storage, events: null, makeId: () => `${name}-${++sequence}`});
  return {storage, repository};
}

test('progress made on one device appears on another after both sync, in the same order', async () => {
  const cloud = server(), laptop = device('laptop'), phone = device('phone');
  laptop.repository.recordLesson('introduction', 'inspect', 0);
  laptop.repository.appendAttempt(answers, '2026-11-05T10:00:00Z');
  assert.deepEqual(await syncProgress(cloud.client(userA), userA, laptop.storage).then(r => [r.uploaded, r.downloaded]), [2, 0]);
  assert.deepEqual(await syncProgress(cloud.client(userA), userA, phone.storage).then(r => [r.uploaded, r.downloaded]), [0, 2]);
  phone.repository.refresh();
  assert.deepEqual(phone.repository.getSnapshot().progress.introduction.inspected, [0]);
  assert.equal(phone.repository.getSnapshot().attempts.length, 1);

  // The phone's later reset is ordered after the laptop's attempt on every device.
  phone.repository.recordLesson('introduction', 'inspect', 1);
  phone.repository.resetAttempts();
  await syncProgress(cloud.client(userA), userA, phone.storage);
  await syncProgress(cloud.client(userA), userA, laptop.storage);
  laptop.repository.refresh();
  for (const {repository} of [laptop, phone]) {
    assert.deepEqual(repository.getSnapshot().progress.introduction.inspected, [0, 1]);
    assert.equal(repository.getSnapshot().attempts.length, 0);
  }
  assert.equal(cloud.rows.size, 4);
});

test('each account only sees its own progress, and another account’s leftovers are not merged', async () => {
  const cloud = server(), shared = device('shared');
  shared.repository.recordLesson('introduction', 'inspect', 0);
  await syncProgress(cloud.client(userA), userA, shared.storage);
  assert.equal(shared.storage.getItem(OWNER_KEY), userA);
  // A's session ended without signing out; B signs in on the same browser.
  const result = await syncProgress(cloud.client(userB), userB, shared.storage);
  assert.deepEqual([result.uploaded, result.downloaded], [0, 0]);
  shared.repository.refresh();
  assert.equal(shared.repository.getSnapshot().progress.introduction, undefined);
  assert.equal([...cloud.rows.values()].filter(row => row.user_id === userB).length, 0);
});

test('guest progress made before the first sign-in is merged into the account', async () => {
  const cloud = server(), guest = device('guest');
  guest.repository.recordLesson('introduction', 'inspect', 1);
  const result = await syncProgress(cloud.client(userA), userA, guest.storage);
  assert.equal(result.uploaded, 1);
});

test('progress saved in the older format is converted once, without duplicates across devices', async () => {
  const cloud = server(), legacy = JSON.stringify({version: 1, records: {introduction: {inspected: [0, 1]}}});
  const attempts = JSON.stringify({version: 1, attempts: [{bankVersion: 1, date: '2026-11-01T00:00:00Z', answers}]});
  const first = device('first'), second = device('second');
  for (const {storage} of [first, second]) { storage.setItem(STORAGE_KEY, legacy); storage.setItem(ASSESSMENT_KEY, attempts); }
  assert.equal(await migrateLegacy(first.storage), 3);
  assert.equal(first.storage.getItem(STORAGE_KEY), null);
  assert.equal(await migrateLegacy(first.storage), 0);
  await syncProgress(cloud.client(userA), userA, first.storage);
  await syncProgress(cloud.client(userA), userA, second.storage);
  assert.equal(cloud.rows.size, 3);
  second.repository.refresh();
  assert.deepEqual(second.repository.getSnapshot().progress.introduction.inspected, [0, 1]);
  assert.equal(second.repository.getSnapshot().attempts.length, 1);
});

test('sign-out uploads everything, then clears the browser; a failed upload keeps the data', async () => {
  const cloud = server(), laptop = device('laptop');
  const timers = {setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}};
  const sync = createProgressSync({repository: laptop.repository, storage: () => laptop.storage, events: null, doc: null, timers});
  assert.equal(await sync.start(cloud.client(userA), userA), true);
  assert.equal(sync.getSnapshot().status, 'synced');
  laptop.repository.recordLesson('introduction', 'inspect', 0);

  cloud.state.failUpload = true;
  await assert.rejects(sync.signOut(), /could not be saved/);
  assert.equal(sync.getSnapshot().status, 'error');
  assert.equal([...laptop.storage.values.keys()].filter(key => key.startsWith(OP_PREFIX)).length, 1);

  cloud.state.failUpload = false;
  await sync.signOut();
  assert.equal(sync.getSnapshot().status, 'off');
  assert.equal(laptop.storage.values.size, 0);
  assert.equal(laptop.repository.getSnapshot().progress.introduction, undefined);
  assert.equal(cloud.rows.size, 1);
});
