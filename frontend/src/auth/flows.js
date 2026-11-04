import {safeDestination} from './config.js';
import {authRequestError} from './errors.js';
const FLOW_KEY = 'siaset-auth-flow-v1';
const MAX_AGE = 10 * 60 * 1000;
function readFlow(storage){try{return JSON.parse(storage.getItem(FLOW_KEY)||'null');}catch(error){if(error instanceof SyntaxError)return null;throw error;}}
// Explicit new email requests can supersede pending links, while Web Locks still serialize SDK work.
export async function startAuthFlow(kind, action, {locks = globalThis.navigator?.locks, storage = globalThis.localStorage,
  now = Date.now, makeId = () => crypto.randomUUID(), destination = '/account', replacePending = false} = {}) {
  if (!locks) throw Error('Use a browser supporting secure account coordination.');
  return locks.request('siaset-auth-flow', async () => {
    const previous = readFlow(storage);
    if (!replacePending && previous && Number.isFinite(previous.started) && now() >= previous.started && now() - previous.started < MAX_AGE) throw Error('Another sign-in or email link is pending. Finish it or restart the account flow.');
    const flow = {id: makeId(), kind, started: now(), destination: safeDestination(destination)};
    storage.setItem(FLOW_KEY, JSON.stringify(flow));
    try {
      const result = await action();
      if (result.error) throw authRequestError(result.error);
      if (result.data?.session) storage.removeItem(FLOW_KEY);
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
  history = globalThis.history, now = Date.now, locks = globalThis.navigator?.locks} = {}) {
  const url = new URL(href);
  const code = url.searchParams.get('code');
  const recovery = url.pathname === '/auth/recovery';
  history.replaceState(history.state, '', url.pathname);
  if (url.searchParams.has('error') || !code) return Promise.reject(Error('This link is invalid or cancelled. Restart sign-in in this browser.'));
  const key = `${url.pathname}:${code}`;
  if (exchanges.has(key)) return exchanges.get(key);
  const exchange = async () => {
    const flow = readFlow(storage);
    if (!flow || typeof flow.id !== 'string' || !flow.id || !['signup','google','recovery'].includes(flow.kind) || !Number.isFinite(flow.started) || now() - flow.started > MAX_AGE || flow.started > now() || recovery !== (flow.kind === 'recovery'))
      throw Error('This link has expired or belongs to a different browser flow. Request a new link.');
    const result = await client.auth.exchangeCodeForSession(code);
    if (result.error || !result.data.session) throw Error('This link could not be verified. Restart in the same browser.');
    const verified = await client.auth.getUser();
    if (verified.error || !verified.data.user || verified.data.user.id !== result.data.session.user.id)
      throw Error('Account verification failed. Restart sign-in.');
    storage.removeItem(FLOW_KEY);
    return {recovery, destination: safeDestination(flow.destination), owner: verified.data.user.id};
  };
  const promise = locks ? locks.request('siaset-auth-flow', exchange) : exchange();
  exchanges.set(key, promise);
  return promise;
}
