import test from 'node:test';
import assert from 'node:assert/strict';
import {createTeacherRequestHandler, sha256Hex} from '../../supabase/functions/teacher-request/handler.js';

const user = {id: '11111111-1111-4111-8111-111111111111', email: 'sam@school.test', user_metadata: {display_name: 'Sam <b>'}};
function setup({failEmail = false} = {}) {
  const rows = new Map(), mail = [];
  let clock = new Date('2026-11-10T10:00:00Z');
  const store = {
    get: async id => rows.get(id) ?? null,
    savePending: async row => rows.set(row.user_id, {...rows.get(row.user_id), ...row, status: 'pending', decided_at: null, created_at: 'x'}),
    decide: async (id, hash, status, at) => {
      const row = rows.get(id);
      if (!row || row.status !== 'pending' || row.token_hash !== hash) return null;
      Object.assign(row, {status, decided_at: at, token_hash: null});
      return row;
    },
    userEmail: async () => user.email,
  };
  let n = 0;
  const handler = createTeacherRequestHandler({
    store, adminEmail: 'owner@site.test', appOrigin: 'https://app.test', allowedOrigins: ['https://app.test'],
    verifyUser: async token => { if (token !== 'good') throw Error(); return user; },
    sendEmail: async message => { if (failEmail) throw Error('down'); mail.push(message); },
    now: () => clock, makeToken: () => `token-${++n}-abcdefghijklmnopqrstuvwxyz`,
  });
  const call = async (body, {auth, origin = 'https://app.test'} = {}) => {
    const response = await handler(new Request('https://fn.test', {method: 'POST', headers: {
      'content-type': 'application/json', origin, ...(auth ? {authorization: `Bearer ${auth}`} : {})}, body: JSON.stringify(body)}));
    return {status: response.status, body: await response.json()};
  };
  return {rows, mail, call, tick: ms => { clock = new Date(clock.getTime() + ms); }};
}
const linkParams = message => Object.fromEntries(new URL(message.html.match(/href="([^"]+)"/)[1].replace(/&amp;/g, '&')).searchParams);

test('a signed-in request emails the owner a one-time approval link, and approval emails the teacher', async () => {
  const {rows, mail, call} = setup();
  assert.equal((await call({action: 'request', school: 'X', reason: 'Y'})).status, 401);
  assert.equal((await call({action: 'request', school: 'X', reason: 'Y'}, {auth: 'bad'})).status, 401);
  assert.equal((await call({action: 'request', school: '', reason: 'Y'}, {auth: 'good'})).body.error, 'details_required');
  assert.equal((await call({action: 'request', school: 'Cairo High', reason: 'Teach <script>'}, {auth: 'good'})).body.status, 'pending');
  assert.equal(mail.length, 1);
  assert.equal(mail[0].to, 'owner@site.test');
  assert.doesNotMatch(mail[0].html, /<script>|Sam <b>/);
  assert.match(mail[0].html, /Sam &lt;b&gt;/);
  const {user: id, token} = linkParams(mail[0]);
  assert.equal(id, user.id);
  assert.equal(rows.get(user.id).token_hash, await sha256Hex(token));
  assert.notEqual(rows.get(user.id).token_hash, token);

  assert.equal((await call({action: 'review', user: id, token: 'x'.repeat(30)})).status, 404);
  const review = await call({action: 'review', user: id, token});
  assert.deepEqual([review.body.school, review.body.email], ['Cairo High', user.email]);
  assert.equal((await call({action: 'decide', user: id, token, decision: 'maybe'})).status, 400);
  const decided = await call({action: 'decide', user: id, token, decision: 'approve'});
  assert.deepEqual([decided.body.status, decided.body.notified], ['approved', true]);
  assert.equal(mail[1].to, user.email);
  assert.match(mail[1].subject, /now a SIASET teacher/);
  // The link works once.
  assert.equal((await call({action: 'decide', user: id, token, decision: 'decline'})).status, 404);
  assert.equal(rows.get(user.id).status, 'approved');
  assert.equal((await call({action: 'request', school: 'X', reason: 'Y'}, {auth: 'good'})).body.status, 'approved');
});

test('repeat requests are rate limited, declines cool down, and foreign origins are refused', async () => {
  const {mail, call, tick} = setup();
  await call({action: 'request', school: 'S', reason: 'R'}, {auth: 'good'});
  assert.equal((await call({action: 'request', school: 'S', reason: 'R'}, {auth: 'good'})).body.alreadySent, true);
  assert.equal(mail.length, 1);
  tick(11 * 60 * 1000);
  await call({action: 'request', school: 'S', reason: 'R'}, {auth: 'good'});
  assert.equal(mail.length, 2);
  // Only the newest link is valid.
  assert.equal((await call({action: 'review', ...linkParams(mail[0])})).status, 404);
  await call({action: 'decide', ...linkParams(mail[1]), decision: 'decline'});
  assert.equal((await call({action: 'request', school: 'S', reason: 'R'}, {auth: 'good'})).status, 429);
  tick(25 * 60 * 60 * 1000);
  assert.equal((await call({action: 'request', school: 'S', reason: 'R'}, {auth: 'good'})).body.status, 'pending');
  assert.equal((await call({action: 'request'}, {auth: 'good', origin: 'https://evil.test'})).status, 403);
});

test('a failed email leaves the request retryable', async () => {
  const {rows, call} = setup({failEmail: true});
  assert.equal((await call({action: 'request', school: 'S', reason: 'R'}, {auth: 'good'})).status, 502);
  assert.equal(rows.get(user.id).notified_at, null);
  assert.equal(rows.get(user.id).token_hash, null);
});
