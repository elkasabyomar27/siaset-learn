import {MAX_BYTES, validateOperation} from './validate.js';

async function boundedJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Error('invalid_body');
  const reader = request.body?.getReader();
  if (!reader) throw Error('invalid_body');
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw Error('too_large'); }
      chunks.push(value);
    }
    const all = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(all));
  } finally { reader.releaseLock(); }
}

// Dependency injection permits the same request boundary to be exercised against PostgreSQL locally.
export function createWriteHandler({verifyUser, commit, allowedOrigins, enabled = false}) {
  return async request => {
    const origin = request.headers.get('origin');
    const headers = {'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin'};
    const respond = (status, body) => new Response(JSON.stringify(body), {status, headers});
    if (origin && !allowedOrigins.includes(origin)) return respond(403, {error: 'origin_denied'});
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      return respond(200, {});
    }
    if (request.method !== 'POST') return respond(405, {error: 'method_not_allowed'});
    if (!enabled) return respond(503, {error: 'foundation_write_disabled'});
    const authorization = request.headers.get('authorization') || '';
    if (!/^Bearer [^\s]+$/.test(authorization)) return respond(401, {error: 'sign_in_required'});
    let user;
    try { user = await verifyUser(authorization.slice(7)); } catch { return respond(401, {error: 'invalid_identity'}); }
    if (!user?.id || user.is_anonymous) return respond(401, {error: 'invalid_identity'});
    let operation;
    try { operation = await validateOperation(await boundedJson(request)); }
    catch (error) { return respond(error.message === 'too_large' ? 413 : 400, {error: 'invalid_operation'}); }
    try {
      const receipt = await commit(user.id, operation);
      if (receipt.reason === 'rate_limited') headers['Retry-After'] = '60';
      return respond(receipt.status === 'accepted' ? 200 : receipt.reason === 'rate_limited' ? 429 : 409, receipt);
    } catch { return respond(503, {error: 'commit_unavailable'}); }
  };
}
