// Cross-device progress sync. The browser's progress log (progressRepository.js) is a set of
// immutable operations, each with a unique id and a Lamport clock, merged in (clock, id) order.
// Syncing is therefore set union: upload entries the account lacks, download entries this browser
// lacks, then let the repository re-read. Every device converges on the same progress.
import { OP_PREFIX, validOperation } from './progressRepository.js';
import { STORAGE_KEY, parseProgress } from './lessonProgress.js';
import { LAB_KEY, ASSESSMENT_KEY, readLabs, readAttempts } from './learnerRecords.js';
import * as learnerMirror from './learnerMirror.js';

export const OWNER_KEY = 'siaset-progress-owner-v1';
export const TABLE = 'progress_ops';
const LEGACY_KEYS = [STORAGE_KEY, LAB_KEY, ASSESSMENT_KEY];
const PAGE = 1000, BATCH = 200;

async function digest(text) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

function localOps(store) {
  const ops = new Map();
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key?.startsWith(OP_PREFIX)) continue;
    try {
      const op = JSON.parse(store.getItem(key));
      if (validOperation(op) && key === OP_PREFIX + op.id) ops.set(op.id, op);
    } catch { /* Damaged entries stay untouched and are not uploaded. */ }
  }
  return ops;
}

/**
 * Converts progress saved before the operation log existed into log entries, so it can sync.
 * Ids are content hashes, so converting the same data twice never duplicates it.
 */
export async function migrateLegacy(store) {
  if (!LEGACY_KEYS.some(key => store.getItem(key) !== null)) return 0;
  const adapter = {getItem: key => store.getItem(key)}, bodies = [];
  for (const [lessonId, record] of Object.entries(parseProgress(store.getItem(STORAGE_KEY)))) {
    for (const value of record.inspected || []) bodies.push({type: 'lesson', lessonId, kind: 'inspect', value});
    for (const kind of ['exercise', 'check', 'check2']) if (record[kind] !== undefined) bodies.push({type: 'lesson', lessonId, kind, value: record[kind]});
  }
  for (const record of Object.values(readLabs(adapter))) bodies.push({type: 'lab', record});
  for (const attempt of readAttempts(adapter)) bodies.push({type: 'attempt', attempt});
  let clock = 0;
  for (const [index, body] of bodies.entries()) {
    const op = {...body, version: 1, id: `legacy-${await digest(`${index}:${JSON.stringify(body)}`)}`, clock: ++clock};
    if (validOperation(op)) store.setItem(OP_PREFIX + op.id, JSON.stringify(op));
  }
  for (const key of LEGACY_KEYS) store.removeItem(key);
  return bodies.length;
}

/** Removes every progress entry from this browser (used after a successful sign-out sync). */
export function clearLocalProgress(store) {
  const keys = [];
  for (let i = 0; i < store.length; i++) { const key = store.key(i); if (key?.startsWith(OP_PREFIX)) keys.push(key); }
  for (const key of [...keys, ...LEGACY_KEYS, OWNER_KEY]) store.removeItem(key);
}

/** One full sync for `userId`. Returns {downloaded, uploaded, uploadedOps, synced: Set of ids known to the account}. */
export async function syncProgress(client, userId, store) {
  const owner = store.getItem(OWNER_KEY);
  // Leftovers from a different account (e.g. its session expired without signing out) are not merged.
  if (owner && owner !== userId) clearLocalProgress(store);
  await migrateLegacy(store);
  const local = localOps(store), remote = new Map();
  for (let from = 0; ; from += PAGE) {
    const {data, error} = await client.from(TABLE).select('op_id,op').eq('user_id', userId).order('op_id').range(from, from + PAGE - 1);
    if (error) throw Error('progress_download_failed');
    for (const row of data) if (row.op?.id === row.op_id && validOperation(row.op)) remote.set(row.op_id, row.op);
    if (data.length < PAGE) break;
  }
  let downloaded = 0;
  for (const [id, op] of remote) if (!local.has(id)) { store.setItem(OP_PREFIX + id, JSON.stringify(op)); downloaded++; }
  const missing = [...local.values()].filter(op => !remote.has(op.id));
  for (let i = 0; i < missing.length; i += BATCH) {
    const rows = missing.slice(i, i + BATCH).map(op => ({user_id: userId, op_id: op.id, op}));
    const {error} = await client.from(TABLE).upsert(rows, {onConflict: 'user_id,op_id', ignoreDuplicates: true});
    if (error) throw Error('progress_upload_failed');
  }
  store.setItem(OWNER_KEY, userId);
  return {downloaded, uploaded: missing.length, uploadedOps: missing, synced: new Set([...remote.keys(), ...local.keys()])};
}

/**
 * Keeps a signed-in browser in sync: right away, shortly after each local change, when the page
 * regains focus or the network returns, and every minute while visible. `status` is one of
 * off | syncing | synced | error.
 */
export function createProgressSync({repository, storage = () => globalThis.localStorage, events = globalThis.window,
  doc = globalThis.document, timers = globalThis, debounceMs = 1500, intervalMs = 60000, mirror = learnerMirror} = {}) {
  let session = null, running = null, again = false, debounce = null, interval = null, unsubscribe = null;
  let synced = new Set(), state = {status: 'off', lastSynced: null};
  const listeners = new Set();
  const set = next => { state = {...state, ...next}; for (const listener of listeners) listener(); };

  function unsyncedLocalChanges() {
    try {
      const store = storage();
      for (let i = 0; i < store.length; i++) { const key = store.key(i); if (key?.startsWith(OP_PREFIX) && !synced.has(key.slice(OP_PREFIX.length))) return true; }
    } catch { /* Storage unavailable: nothing to upload. */ }
    return false;
  }

  async function run() {
    if (!session) return false;
    if (running) { again = true; return running; }
    const current = session;
    set({status: 'syncing'});
    running = (async () => {
      try {
        const result = await syncProgress(current.client, current.userId, storage());
        if (session !== current) return false;
        synced = result.synced;
        repository.refresh();
        set({status: 'synced', lastSynced: Date.now()});
        // Dual-write: a shadow copy through learner-write. It never changes the sync result.
        try {
          const store = storage();
          mirror.enqueue(store, current.userId, result.uploadedOps || []);
          if (session === current) await mirror.drain(current.client, current.userId, store);
        } catch { /* The shadow copy is best effort. */ }
        return true;
      } catch {
        if (session === current) set({status: 'error'});
        return false;
      } finally {
        running = null;
        if (again && session === current) { again = false; run(); }
      }
    })();
    return running;
  }

  const schedule = () => { timers.clearTimeout(debounce); debounce = timers.setTimeout(run, debounceMs); };
  const onChange = () => { if (unsyncedLocalChanges()) schedule(); };
  const onVisible = () => { if (!doc || doc.visibilityState === 'visible') run(); };

  function stop() {
    session = null; synced = new Set();
    timers.clearTimeout(debounce); timers.clearInterval(interval);
    unsubscribe?.(); unsubscribe = null;
    events?.removeEventListener('focus', onVisible); events?.removeEventListener('online', onVisible);
    doc?.removeEventListener('visibilitychange', onVisible);
    set({status: 'off', lastSynced: null});
  }

  return {
    start(client, userId) {
      if (session?.client === client && session.userId === userId) return run();
      stop();
      session = {client, userId};
      unsubscribe = repository.subscribe(onChange);
      events?.addEventListener('focus', onVisible); events?.addEventListener('online', onVisible);
      doc?.addEventListener('visibilitychange', onVisible);
      interval = timers.setInterval(onVisible, intervalMs);
      return run();
    },
    stop,
    syncNow: run,
    /** Uploads everything, then clears this browser. Throws if the upload could not finish. */
    async signOut() {
      // Let any in-flight sync finish first, so the final run sees every local change.
      while (running) await running;
      if (session && !(await run())) throw Error('Your latest progress could not be saved to your account. Check your connection and try again.');
      const userId = session?.userId;
      stop();
      try { clearLocalProgress(storage()); if (userId) mirror.clearMirror(storage(), userId); } catch { /* Storage unavailable: nothing to clear. */ }
      repository.refresh();
    },
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
