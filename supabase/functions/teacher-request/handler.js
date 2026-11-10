// Teacher approval flow.
//   request  (signed-in user)  → stores a pending request and emails the site owner an approval link
//   review   (link holder)     → shows who asked, so the owner can decide
//   decide   (link holder)     → approves or declines once; the requester is emailed the outcome
// The approval link carries a random one-time token; only its SHA-256 hash is stored.
// Plain JS with injected dependencies so Node tests and the Deno Edge runtime share it.

const MAX_BODY = 8192;
const RESEND_AFTER_MS = 10 * 60 * 1000;
const DECLINED_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);

async function readJson(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw Error('invalid_body');
  const text = await request.text();
  if (text.length > MAX_BODY) throw Error('too_large');
  const body = JSON.parse(text);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('invalid_body');
  return body;
}

export function createTeacherRequestHandler({verifyUser, store, sendEmail, allowedOrigins, appOrigin, adminEmail,
  now = () => new Date(), makeToken = randomToken}) {
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
    if (!adminEmail || !appOrigin) return respond(503, {error: 'not_configured'});
    let body;
    try { body = await readJson(request); } catch { return respond(400, {error: 'invalid_body'}); }

    if (body.action === 'request') {
      const authorization = request.headers.get('authorization') || '';
      if (!/^Bearer [^\s]+$/.test(authorization)) return respond(401, {error: 'sign_in_required'});
      let user;
      try { user = await verifyUser(authorization.slice(7)); } catch { return respond(401, {error: 'invalid_identity'}); }
      if (!user?.id || user.is_anonymous || !user.email) return respond(401, {error: 'invalid_identity'});
      const school = clean(body.school, 200), reason = clean(body.reason, 1000);
      if (!school || !reason) return respond(400, {error: 'details_required'});
      const existing = await store.get(user.id), time = now();
      if (existing?.status === 'approved') return respond(200, {status: 'approved'});
      if (existing?.status === 'declined' && existing.decided_at && time - new Date(existing.decided_at) < DECLINED_COOLDOWN_MS)
        return respond(429, {error: 'recently_declined', status: 'declined'});
      if (existing?.status === 'pending' && existing.notified_at && time - new Date(existing.notified_at) < RESEND_AFTER_MS)
        return respond(200, {status: 'pending', alreadySent: true});
      const displayName = clean(user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0], 100) || 'Teacher';
      const token = makeToken();
      await store.savePending({user_id: user.id, display_name: displayName, school, reason,
        token_hash: await sha256Hex(token), notified_at: time.toISOString()});
      const link = `${appOrigin}/teach/approve?user=${encodeURIComponent(user.id)}&token=${encodeURIComponent(token)}`;
      try {
        await sendEmail({to: adminEmail, replyTo: user.email, subject: `SIASET teacher request: ${displayName}`, html:
          `<p><b>${escapeHtml(displayName)}</b> (${escapeHtml(user.email)}) asked to become a teacher on SIASET.</p>` +
          `<p><b>School / organisation:</b> ${escapeHtml(school)}<br><b>Why:</b> ${escapeHtml(reason)}</p>` +
          `<p><a href="${escapeHtml(link)}">Review and approve or decline</a></p>` +
          '<p style="color:#666">This link works once. If you did not expect this email you can ignore it.</p>'});
      } catch {
        // Allow an immediate retry when the email could not be sent.
        await store.savePending({user_id: user.id, display_name: displayName, school, reason, token_hash: null, notified_at: null});
        return respond(502, {error: 'email_failed'});
      }
      return respond(200, {status: 'pending'});
    }

    if (body.action === 'review' || body.action === 'decide') {
      const userId = String(body.user || ''), token = String(body.token || '');
      if (!UUID.test(userId) || token.length < 20 || token.length > 100) return respond(400, {error: 'invalid_link'});
      const hash = await sha256Hex(token);
      if (body.action === 'review') {
        const row = await store.get(userId);
        if (!row || row.token_hash !== hash) return respond(404, {error: 'link_used_or_invalid'});
        return respond(200, {display_name: row.display_name, school: row.school, reason: row.reason, created_at: row.created_at,
          email: await store.userEmail(userId)});
      }
      if (!['approve', 'decline'].includes(body.decision)) return respond(400, {error: 'invalid_decision'});
      const status = body.decision === 'approve' ? 'approved' : 'declined';
      const row = await store.decide(userId, hash, status, now().toISOString());
      if (!row) return respond(404, {error: 'link_used_or_invalid'});
      const email = await store.userEmail(userId);
      let notified = false;
      if (email) {
        try {
          await sendEmail({to: email, subject: status === 'approved' ? 'You are now a SIASET teacher' : 'Your SIASET teacher request',
            html: status === 'approved'
              ? `<p>Hi ${escapeHtml(row.display_name)}, your teacher access is approved.</p><p><a href="${escapeHtml(appOrigin)}/teach">Open your teacher space</a> to create classes, assignments and live quizzes.</p>`
              : `<p>Hi ${escapeHtml(row.display_name)}, your request for teacher access was not approved this time. You can keep learning with your account as usual.</p>`});
          notified = true;
        } catch { /* The decision stands even if the courtesy email fails. */ }
      }
      return respond(200, {status, display_name: row.display_name, notified});
    }
    return respond(400, {error: 'unknown_action'});
  };
}
