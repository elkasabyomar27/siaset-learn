import {safeDestination} from './config.js';
const FLOW_KEY = 'siaset-auth-flow-v1';
const MAX_AGE = 10 * 60 * 1000;
// Web Locks serialize initiation across tabs; the persistent lease spans redirects/email waiting.
export async function startAuthFlow(kind, action, {locks = globalThis.navigator?.locks, storage = globalThis.localStorage,
  now = Date.now, makeId = () => crypto.randomUUID(), destination = '/account'} = {}) {
  if (!locks) throw Error('Use a browser supporting secure account coordination.');
  return locks.request('siaset-auth-flow', async () => {
    const previous = JSON.parse(storage.getItem(FLOW_KEY) || 'null');
    if (previous && now() - previous.started < MAX_AGE) throw Error('Another sign-in or email link is pending. Finish it or restart the account flow.');
    const flow = {id: makeId(), kind, started: now(), destination: safeDestination(destination)};
    storage.setItem(FLOW_KEY, JSON.stringify(flow));
    try {
      const result = await action();
      if (result.error) throw Error('Unable to complete the account request. Check your details and try again.');
      return result;
    } catch (error) { storage.removeItem(FLOW_KEY); throw error; }
  });
}
export async function restartAuthFlow({locks = globalThis.navigator?.locks, storage = globalThis.localStorage} = {}) {
  if (!locks) throw Error('Secure account coordination is unavailable.');
  await locks.request('siaset-auth-flow', () => storage.removeItem(FLOW_KEY));
}

// Module-level promise is shared across StrictMode remounts. No automatic SDK URL exchange.
const exchanges = new Map();
export function finishAuthFlow(client, href, {storage = globalThis.localStorage,
  history = globalThis.history, now = Date.now} = {}) {
  const url = new URL(href);
  const code = url.searchParams.get('code');
  const recovery = url.pathname === '/auth/recovery';
  history.replaceState(history.state, '', url.pathname);
  if (url.searchParams.has('error') || !code) return Promise.reject(Error('This link is invalid or cancelled. Restart sign-in in this browser.'));
  const key = `${url.pathname}:${code}`;
  if (exchanges.has(key)) return exchanges.get(key);
  const promise = (async () => {
    const flow = JSON.parse(storage.getItem(FLOW_KEY) || 'null');
    if (!flow || now() - flow.started > MAX_AGE || flow.started > now() || recovery !== (flow.kind === 'recovery'))
      throw Error('This link has expired or belongs to a different browser flow. Request a new link.');
    const result = await client.auth.exchangeCodeForSession(code);
    if (result.error || !result.data.session) throw Error('This link could not be verified. Restart in the same browser.');
    const verified = await client.auth.getUser();
    if (verified.error || !verified.data.user || verified.data.user.id !== result.data.session.user.id)
      throw Error('Account verification failed. Restart sign-in.');
    storage.removeItem(FLOW_KEY);
    return {recovery, destination: safeDestination(flow.destination), owner: verified.data.user.id};
  })();
  exchanges.set(key, promise);
  return promise;
}
