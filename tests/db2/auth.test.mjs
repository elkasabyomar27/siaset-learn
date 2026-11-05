import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {authOriginAllowed, publicAuthConfig, safeDestination} from '../../frontend/src/auth/config.js';
import {startAuthFlow, finishAuthFlow, restartAuthFlow} from '../../frontend/src/auth/flows.js';
import {authRequestError} from '../../frontend/src/auth/errors.js';
const memory = () => { const map = new Map(); return {getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map}; };
const locks = {request: async (_name, action) => action()};
const history = {state: {key: 1}, replaceState(_state, _unused, path) { this.path = path; }};
test('browser config fails closed for privileged/legacy keys and unsafe redirect values', () => {
  assert.equal(publicAuthConfig({}), null);
  assert.deepEqual(publicAuthConfig({VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic'}), {url: 'https://example.supabase.co', key: 'sb_publishable_synthetic'});
  for (const key of ['sb_secret_private', 'eyJ.role.service_role', '', undefined]) assert.throws(() => publicAuthConfig({VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: key}));
  for (const url of ['http://example.com', 'https://a:b@example.com', 'https://example.com/auth', 'https://example.com?token=x']) assert.throws(() => publicAuthConfig({VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic'}));
  for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', '/%2f%2fevil', '/account?next=evil', null]) assert.equal(safeDestination(next), '/account');
  assert.equal(safeDestination('/learn/transposable-elements'), '/learn/transposable-elements');
});
test('accounts are offered only on local dev origins and explicitly allowlisted https origins', () => {
  for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://[::1]:5173']) assert.equal(authOriginAllowed({}, origin), true);
  for (const origin of ['https://siaset-learn.vercel.app', 'https://siaset-learn-git-staging-x.vercel.app', undefined, '', 'not a url']) assert.equal(authOriginAllowed({}, origin), false);
  const env = {VITE_AUTH_ALLOWED_ORIGINS: ' https://siaset-learn.vercel.app/ , http://insecure.example, https://evil.example/path'};
  assert.equal(authOriginAllowed(env, 'https://siaset-learn.vercel.app'), true);
  for (const origin of ['https://siaset-learn-git-staging-x.vercel.app', 'http://insecure.example', 'https://evil.example', 'http://siaset-learn.vercel.app']) assert.equal(authOriginAllowed(env, origin), false);
});
test('auth initiation has a cross-tab lease, rejects unavailable storage/locks, and releases failed requests', async () => {
  const storage = memory(), options = {locks, storage, now: () => 1000, makeId: () => 'flow'};
  let calls = 0;
  await startAuthFlow('google', async () => { calls++; return {data: {}}; }, options);
  await assert.rejects(startAuthFlow('signup', async () => { calls++; }, options), /pending/);
  assert.equal(calls, 1);
  await restartAuthFlow(options);
  await assert.rejects(startAuthFlow('signup', async () => ({error: true}), options));
  assert.equal(storage.map.size, 0);
  await assert.rejects(startAuthFlow('google', async () => ({}), {...options, locks: null}));
  await assert.rejects(startAuthFlow('google', async () => ({}), {...options, storage: {getItem() { throw Error('unavailable'); }}}));
});
test('PKCE callback exchanges once, verifies identity, scrubs parameters, rejects stale/wrong recovery and cancelled links', async () => {
  const storage = memory(), options = {locks, storage, history, now: () => 1000};
  let exchanges = 0;
  const client = {auth: {exchangeCodeForSession: async () => { exchanges++; return {data: {session: {user: {id: 'synthetic'}}}}; }, getUser: async () => ({data: {user: {id: 'synthetic'}}})}};
  await startAuthFlow('google', async () => ({}), options);
  const url = 'https://app.example/auth/callback?code=synthetic-once&next=//evil.example';
  const first = finishAuthFlow(client, url, options), second = finishAuthFlow(client, url, options);
  assert.equal(first, second); assert.equal((await first).destination, '/account');
  assert.equal(exchanges, 1); assert.equal(history.path, '/auth/callback');
  assert.equal(storage.map.size, 0);
  await assert.rejects(finishAuthFlow(client, 'https://app.example/auth/callback?error=cancelled', options));
  await assert.rejects(finishAuthFlow(client, 'https://app.example/auth/recovery?code=no-flow', options));
  await startAuthFlow('google', async () => ({}), options);
  await assert.rejects(finishAuthFlow(client, 'https://app.example/auth/recovery?code=wrong-flow', options));
  await assert.rejects(finishAuthFlow(client, 'https://app.example/auth/callback?code=expired', {...options, now: () => 1000000}));
  await restartAuthFlow(options);
  await startAuthFlow('recovery', async () => ({}), options);
  assert.equal((await finishAuthFlow(client, 'https://app.example/auth/recovery?code=recovery-valid', options)).recovery, true);
  assert.equal(exchanges, 2);
});
test('account routes preserve learning integration and never import or write browser progress', async () => {
  const source = await readFile('frontend/src/auth/Account.jsx', 'utf8');
  for (const forbidden of ['progressRepository', 'learnerRecords', '.rpc(', '.from(', 'service_role', 'localStorage.setItem']) assert.equal(source.includes(forbidden), false);
  for (const sdk of ['signInWithPassword', 'signUp', 'resetPasswordForEmail', 'updateUser', 'signInWithOAuth', 'signOut']) assert.ok(source.includes(sdk));
  const main = await readFile('frontend/src/main.jsx', 'utf8');
  for (const path of ['/account', '/auth/callback', '/auth/recovery']) assert.ok(main.indexOf(`path="${path}"`) < main.indexOf('path="*"'));
});

test('explicit new signup/recovery requests supersede old email leases without blocking the SDK', async()=>{
  const storage=memory();let calls=0,sequence=0;
  const options={locks,storage,now:()=>1000,makeId:()=>`request-${++sequence}`,replacePending:true};
  for(const kind of ['signup','signup','recovery'])await startAuthFlow(kind,async()=>{calls++;return {data:{session:null}};},options);
  assert.equal(calls,3);assert.equal(JSON.parse(storage.getItem('siaset-auth-flow-v1')).kind,'recovery');
  storage.setItem('siaset-auth-flow-v1','malformed json');
  await startAuthFlow('signup',async()=>({data:{session:null}}),options);
  assert.equal(JSON.parse(storage.getItem('siaset-auth-flow-v1')).kind,'signup');
  await assert.rejects(startAuthFlow('signup',async()=>({error:{code:'over_email_send_rate_limit'}}),options),/wait a few minutes/);
  assert.equal(storage.map.size,0);
  await startAuthFlow('signup',async()=>({data:{session:{user:{id:'verified'}}}}),options);
  assert.equal(storage.map.size,0);
});
test('sign-in errors explain confirmation, invalid credentials and rate limits without raw diagnostics',()=>{
  assert.match(authRequestError({code:'email_not_confirmed'}).message,/Confirm your email/);
  assert.match(authRequestError({code:'invalid_credentials'}).message,/email or password is incorrect/);
  assert.match(authRequestError({status:429}).message,/wait a few minutes/);
  assert.doesNotMatch(authRequestError({message:'sensitive server diagnostic'}).message,/sensitive/);
});
test('callback exchange holds the same cross-tab lock and rejects malformed leases',async()=>{
  const storage=memory(),names=[],options={storage,history,now:()=>1000,locks:{request:async(name,action)=>{names.push(name);return action();}}};
  const client={auth:{exchangeCodeForSession:async()=>({data:{session:{user:{id:'owner'}}}}),getUser:async()=>({data:{user:{id:'owner'}}})}};
  storage.setItem('siaset-auth-flow-v1',JSON.stringify({kind:'signup'}));
  await assert.rejects(finishAuthFlow(client,'https://app.example/auth/callback?code=malformed-lease',options),/expired/);
  await startAuthFlow('signup',async()=>({data:{}}),{...options,makeId:()=> 'fresh'});
  assert.equal((await finishAuthFlow(client,'https://app.example/auth/callback?code=fresh-locked-callback',options)).owner,'owner');
  assert.deepEqual(names,['siaset-auth-flow','siaset-auth-flow','siaset-auth-flow']);
});
