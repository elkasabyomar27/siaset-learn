import {lessonById, lessons} from '../frontend/src/features/transposable-elements/curriculum/lessons.js';
import topics from '../frontend/src/features/transposable-elements/curriculum/topics.json' with {type: 'json'};
import {updateProgress} from '../frontend/src/features/transposable-elements/lessonProgress.js';
import {validLabEvidence} from '../frontend/src/features/transposable-elements/learnerRecords.js';
import {questions, scoreAssessment, BANK_VERSION} from '../frontend/src/features/transposable-elements/assessment.js';

export const CONTRACT_VERSION = 'siaset-v1';
export const MAX_BYTES = 65536;
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const decimal = value => typeof value === 'string' && /^(0|[1-9][0-9]{0,17})$/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function requireCondition(condition) { if (!condition) throw Error('invalid_operation'); }
function keys(value, allowed) { requireCondition(object(value) && Object.keys(value).every(key => allowed.includes(key))); }
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function digest(value) {
  const data = new TextEncoder().encode(canonical(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export const contractManifest = {
  version: CONTRACT_VERSION, topics, lessons: lessons.map(l => ({id: l.id, variants: l.variants, exercise: l.exercise, check: l.check, check2: l.check2 ?? null})), questions,
};

// New cloud protocol only. Anonymous/legacy records are never reinterpreted here.
export async function validateOperation(input) {
  keys(input, ['protocol_version', 'contract_version', 'op_id', 'device_id', 'device_seq', 'expected_epoch', 'expected_revision', 'type', 'payload']);
  requireCondition(new TextEncoder().encode(JSON.stringify(input)).length <= MAX_BYTES && input.protocol_version === 1 && input.contract_version === CONTRACT_VERSION);
  requireCondition(uuid(input.op_id) && uuid(input.device_id) && decimal(input.device_seq) && input.device_seq !== '0' && decimal(input.expected_epoch) && decimal(input.expected_revision));
  let scope, field = 'scope', payload;
  const p = input.payload;
  switch (input.type) {
    case 'lesson': {
      keys(p, ['lessonId', 'kind', 'value']);
      requireCondition(typeof p.lessonId === 'string' && typeof p.kind === 'string' && !!updateProgress({}, p.lessonId, p.kind, p.value)[p.lessonId]);
      scope = `lesson:${p.lessonId}`; field = p.kind; payload = p; break;
    }
    case 'resetLesson':
      keys(p, ['lessonId']); requireCondition(!!lessonById(p.lessonId)); scope = `lesson:${p.lessonId}`; payload = p; break;
    case 'lab':
      keys(p, ['record']); keys(p.record, ['scenario', 'stage', 'answers', 'events']);
      requireCondition(validLabEvidence(p.record));
      scope = `lab:${p.record.scenario}`; payload = p; break;
    case 'attempt': {
      keys(p, ['attempt']); keys(p.attempt, ['bankVersion', 'date', 'answers']);
      const score = scoreAssessment(p.attempt.answers);
      requireCondition(p.attempt.bankVersion === BANK_VERSION && typeof p.attempt.date === 'string' && p.attempt.date.length <= 100 && Number.isFinite(Date.parse(p.attempt.date)) && score.answered === score.total);
      scope = 'attempts'; payload = {...p, score}; break;
    }
    case 'resetAttempts': keys(p, []); scope = 'attempts'; payload = p; break;
    default: throw Error('invalid_operation');
  }
  const normalized = {...input, scope, field, payload, contract_hash: await digest(contractManifest)};
  return {...normalized, payload_hash: await digest(normalized)};
}
