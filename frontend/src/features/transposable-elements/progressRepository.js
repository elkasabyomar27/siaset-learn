import { STORAGE_KEY, parseProgress, updateProgress } from './lessonProgress.js';
import { LAB_KEY, ASSESSMENT_KEY, readLabs, readAttempts, validLabEvidence } from './learnerRecords.js';
import { BANK_VERSION, scoreAssessment } from './assessment.js';
import { lessonById } from './curriculum/lessons.js';

export const OP_PREFIX = 'siaset-progress-op-v1:';
const empty = () => ({ progress: {}, labs: {}, attempts: [] });
const compare = (a, b) => a.clock - b.clock || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function operationId() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  // getRandomValues also works on HTTP origins where randomUUID is unavailable.
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

function validAttempt(attempt) {
  try {
    const score = scoreAssessment(attempt.answers);
    return attempt.bankVersion === BANK_VERSION && typeof attempt.date === 'string' &&
      Number.isFinite(Date.parse(attempt.date)) && score.answered === score.total;
  } catch { return false; }
}

function validOperation(op) {
  if (!op || op.version !== 1 || typeof op.id !== 'string' || !op.id ||
      !Number.isSafeInteger(op.clock) || op.clock < 1) return false;
  switch (op.type) {
    case 'lesson': return updateProgress({}, op.lessonId, op.kind, op.value)[op.lessonId] !== undefined;
    case 'resetLesson': return !!lessonById(op.lessonId);
    case 'lab': return validLabEvidence(op.record);
    case 'attempt': return validAttempt(op.attempt);
    case 'resetAttempts': return true;
    default: return false;
  }
}

function apply(state, op) {
  switch (op.type) {
    case 'lesson': state.progress = updateProgress(state.progress, op.lessonId, op.kind, op.value); break;
    case 'resetLesson': delete state.progress[op.lessonId]; break;
    case 'lab': state.labs[op.record.scenario] = op.record; break;
    case 'attempt': state.attempts.push(op.attempt); break;
    case 'resetAttempts': state.attempts = []; break;
  }
}

// Each operation owns a unique key: no shared read/modify/write record can lose
// an unrelated tab's update. The v1 legacy keys are read, never rewritten.
export function createProgressRepository({
  storage = () => globalThis.localStorage,
  events = globalThis.window,
  makeId = operationId,
} = {}) {
  let base = empty(), known = new Map(), pending = new Map(), clock = 0;
  let initialized = false, snapshot, signature;
  let readFailed = false, writeFailed = false, damaged = false;
  const listeners = new Set();

  function publish() {
    const state = structuredClone(base);
    const operations = new Map([...known, ...pending]);
    for (const op of [...operations.values()].sort(compare)) apply(state, op);
    const next = { ...state, status: readFailed ? 'read-failed' : pending.size || writeFailed ? 'temporary' : 'saved', damaged };
    const nextSignature = JSON.stringify(next);
    if (signature === nextSignature) return;
    signature = nextSignature;
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function read() {
    try {
      const store = storage();
      const raw = new Map([STORAGE_KEY, LAB_KEY, ASSESSMENT_KEY].map(key => [key, store.getItem(key)]));
      let invalid = false;
      for (const [key, value] of raw) {
        if (value === null) continue;
        try {
          const parsed = JSON.parse(value);
          if (parsed?.version !== 1 || (key === ASSESSMENT_KEY ? !Array.isArray(parsed.attempts)
            : !parsed.records || typeof parsed.records !== 'object' || Array.isArray(parsed.records))) invalid = true;
        } catch { invalid = true; }
      }
      const adapter = { getItem: key => raw.get(key) };
      const nextBase = { progress: parseProgress(raw.get(STORAGE_KEY)), labs: readLabs(adapter), attempts: readAttempts(adapter) };
      const nextKnown = new Map();
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key?.startsWith(OP_PREFIX)) continue;
        const value = store.getItem(key);
        try {
          const op = JSON.parse(value);
          if (!validOperation(op) || key !== OP_PREFIX + op.id) { invalid = true; continue; }
          nextKnown.set(op.id, op);
        } catch { invalid = true; }
      }
      base = nextBase;
      known = nextKnown;
      for (const op of known.values()) clock = Math.max(clock, op.clock);
      readFailed = false;
      damaged = invalid;
      return store;
    } catch { readFailed = true; return null; }
  }

  function sync() { initialized = true; read(); publish(); }

  function flush() {
    initialized = true;
    const store = read();
    // Never write while reads fail: there may be unseen persisted work.
    if (store) {
      writeFailed = false;
      for (const [id, op] of pending) {
        try {
          store.setItem(OP_PREFIX + id, JSON.stringify(op));
          known.set(id, op);
          pending.delete(id);
        } catch { writeFailed = true; break; }
      }
    }
    publish();
    return !readFailed && !pending.size && !writeFailed;
  }

  function commit(data) {
    sync();
    const op = structuredClone({ ...data, version: 1, id: makeId(), clock: ++clock });
    if (!validOperation(op)) return false;
    pending.set(op.id, op);
    return flush();
  }

  function onStorage(event) {
    if (event.key === null || [STORAGE_KEY, LAB_KEY, ASSESSMENT_KEY].includes(event.key) || event.key?.startsWith(OP_PREFIX)) sync();
  }

  return {
    getSnapshot() { if (!initialized) sync(); return snapshot; },
    subscribe(listener) {
      if (!listeners.size) {
        events?.addEventListener('storage', onStorage);
        events?.addEventListener('focus', flush);
        events?.addEventListener('online', flush);
      }
      listeners.add(listener);
      sync();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          events?.removeEventListener('storage', onStorage);
          events?.removeEventListener('focus', flush);
          events?.removeEventListener('online', flush);
        }
      };
    },
    refresh: sync,
    retry: flush,
    recordLesson: (lessonId, kind, value) => commit({ type: 'lesson', lessonId, kind, value }),
    resetLesson: lessonId => commit({ type: 'resetLesson', lessonId }),
    recordLab(history, stage, answers) {
      return commit({ type: 'lab', record: { scenario: history.state.scenario, stage, answers,
        events: history.events.slice(0, history.cursor) } });
    },
    appendAttempt(answers, date) { return commit({ type: 'attempt', attempt: { bankVersion: BANK_VERSION, date, answers } }); },
    resetAttempts: () => commit({ type: 'resetAttempts' }),
  };
}

export const progressRepository = createProgressRepository();
