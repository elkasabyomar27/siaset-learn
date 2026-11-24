// Dual-write: after the normal two-way sync uploads this browser's new progress entries, the same
// entries are also sent, one by one, through the server-validated learner-write function. It is a
// shadow copy only. Nothing here changes local progress, the progress_ops sync, or its status,
// and every failure is contained. Entries saved before dual-write existed, and converted legacy
// entries, are never sent: learner-write deliberately has no import step.

export const MIRROR_PREFIX = 'siaset-learner-mirror-v1:';
export const CONTRACT_VERSION = 'siaset-v2';
export const FUNCTION_NAME = 'learner-write';
const PER_RUN = 20;
const MAX_QUEUE = 2000;
const MAX_ATTEMPTS = 2;

async function sha256(text) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** A stable UUID (version 5 layout) derived from text, so the same entry always gets the same id. */
export async function stableUuid(text) {
  const h = await sha256(text);
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function randomUuid() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Server scope and payload for a local progress entry, or null when learner-write cannot take it. */
export function toServerOperation(op) {
  switch (op?.type) {
    case 'lesson': return {scope: `lesson:${op.lessonId}`, field: op.kind, payload: {lessonId: op.lessonId, kind: op.kind, value: op.value}};
    case 'resetLesson': return {scope: `lesson:${op.lessonId}`, payload: {lessonId: op.lessonId}};
    case 'lab': return {scope: `lab:${op.record?.scenario}`, payload: {record: {scenario: op.record.scenario, stage: op.record.stage, answers: op.record.answers, events: op.record.events}}};
    case 'attempt': return {scope: 'attempts', payload: {attempt: {bankVersion: op.attempt.bankVersion, date: op.attempt.date, answers: op.attempt.answers}}};
    case 'resetAttempts': return {scope: 'attempts', payload: {}};
    default: return null;
  }
}

const mirrorable = op => op && typeof op.id === 'string' && !op.id.startsWith('legacy-') && toServerOperation(op) !== null;

function load(store, userId) {
  try {
    const value = JSON.parse(store.getItem(MIRROR_PREFIX + userId));
    if (value && typeof value.deviceId === 'string' && Number.isSafeInteger(value.seq) && Array.isArray(value.queue)) return value;
  } catch { /* Damaged state starts over. */ }
  return {deviceId: randomUuid(), seq: 0, queue: []};
}
function save(store, userId, state) { store.setItem(MIRROR_PREFIX + userId, JSON.stringify(state)); }

/** Adds entries this browser has just uploaded to the mirror queue. */
export function enqueue(store, userId, ops) {
  const state = load(store, userId);
  const known = new Set(state.queue.map(item => item.op.id));
  for (const op of ops) if (mirrorable(op) && !known.has(op.id)) { state.queue.push({op, attempt: 0}); known.add(op.id); }
  state.queue = state.queue.slice(-MAX_QUEUE);
  save(store, userId, state);
  return state.queue.length;
}

/** Forgets the mirror state for one account (used when that account signs out of this browser). */
export function clearMirror(store, userId) { store.removeItem(MIRROR_PREFIX + userId); }

async function readScopes(client, userId) {
  const {data, error} = await client.from('learner_scopes').select('scope,epoch,revision,field_revisions').eq('user_id', userId);
  if (error) throw Error('scopes_unavailable');
  return new Map((data || []).map(row => [row.scope, {epoch: String(row.epoch ?? 0), revision: String(row.revision ?? 0), fields: {...(row.field_revisions || {})}}]));
}
const scopeOf = (scopes, scope) => scopes.get(scope) || {epoch: '0', revision: '0', fields: {}};

async function send(client, envelope) {
  const {data, error} = await client.functions.invoke(FUNCTION_NAME, {body: envelope});
  if (!error) return {status: 200, body: data};
  const response = error.context;
  let body = null;
  try { body = await response?.json?.(); } catch { /* Not JSON. */ }
  return {status: response?.status ?? 0, body};
}

/**
 * Sends up to PER_RUN queued entries. Returns {sent, accepted, dropped, remaining}. Throws nothing:
 * a network error, rate limit or outage simply leaves the rest queued for the next sync.
 */
export async function drain(client, userId, store) {
  const result = {sent: 0, accepted: 0, dropped: 0, remaining: 0};
  if (!client?.functions?.invoke || !client.from) return result;
  let state;
  try { state = load(store, userId); } catch { return result; }
  if (!state.queue.length) return result;
  let scopes;
  try { scopes = await readScopes(client, userId); } catch { result.remaining = state.queue.length; return result; }
  try {
    while (state.queue.length && result.sent < PER_RUN) {
      const item = state.queue[0];
      const server = toServerOperation(item.op);
      const scope = scopeOf(scopes, server.scope);
      const expectedRevision = item.op.type === 'lesson' ? String(scope.fields[server.field] ?? '0') : scope.revision;
      state.seq += 1;
      save(store, userId, state);
      const envelope = {
        protocol_version: 1, contract_version: CONTRACT_VERSION,
        op_id: await stableUuid(`${userId}:${item.op.id}:${item.attempt}`),
        device_id: state.deviceId, device_seq: String(state.seq),
        expected_epoch: scope.epoch, expected_revision: expectedRevision,
        type: item.op.type, payload: server.payload,
      };
      let reply;
      try { reply = await send(client, envelope); } catch { break; }
      result.sent++;
      const body = reply.body || {};
      if (reply.status === 200 && body.status === 'accepted') {
        const seq = String(body.server_seq ?? body.revision ?? scope.revision);
        const next = {epoch: String(body.epoch ?? scope.epoch), revision: seq, fields: item.op.type === 'resetLesson' ? {} : {...scope.fields}};
        if (item.op.type === 'lesson') next.fields[server.field] = seq;
        scopes.set(server.scope, next);
        state.queue.shift(); result.accepted++;
      } else if (reply.status === 409 && body.reason === 'id_reuse') {
        state.queue.shift(); result.accepted++; // Another device already recorded this entry.
      } else if (reply.status === 409 && ['revision_conflict', 'stale_epoch', 'stale_device_seq'].includes(body.reason)) {
        if (body.reason !== 'stale_device_seq') scopes.set(server.scope, {...scope, epoch: String(body.epoch ?? scope.epoch), revision: String(body.revision ?? scope.revision), fields: scope.fields});
        if (body.reason === 'revision_conflict' && item.op.type === 'lesson') scopes.get(server.scope).fields[server.field] = String(body.revision ?? '0');
        item.attempt += 1;
        if (item.attempt >= MAX_ATTEMPTS) { state.queue.shift(); result.dropped++; }
      } else if (reply.status === 400 || reply.status === 413) {
        state.queue.shift(); result.dropped++; // The server will never accept this entry.
      } else {
        break; // Rate limited, signed out, disabled or unavailable: try again on a later sync.
      }
      save(store, userId, state);
    }
  } finally {
    try { save(store, userId, state); } catch { /* Storage unavailable. */ }
  }
  result.remaining = state.queue.length;
  return result;
}
