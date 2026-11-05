export function publicAuthConfig(env = {}) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return null;
  try {
    const parsed = new URL(url);
    const local = ['127.0.0.1', 'localhost'].includes(parsed.hostname);
    if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) ||
        parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' ||
        !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw Error();
    return {url: parsed.origin, key};
  } catch { throw new Error('Account setup requires a valid project URL and publishable key.'); }
}

// Email and OAuth links only work on origins listed in Supabase's redirect allowlist. Accounts are
// therefore offered only on local dev origins and on origins named in VITE_AUTH_ALLOWED_ORIGINS, so a
// production or preview deployment never sends links that would land on Supabase's fallback Site URL.
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
export function authOriginAllowed(env = {}, origin) {
  let current;
  try { current = new URL(origin); } catch { return false; }
  if (current.origin !== origin) return false;
  if (LOCAL_HOSTS.includes(current.hostname) && ['http:', 'https:'].includes(current.protocol)) return true;
  if (current.protocol !== 'https:') return false;
  return String(env.VITE_AUTH_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
    .some(value => { try { const allowed = new URL(value); return allowed.protocol === 'https:' && allowed.origin === value.replace(/\/$/, '') && allowed.origin === origin; } catch { return false; } });
}

export function safeDestination(value) {
  // Fixed destinations avoid browser URL normalization and open redirects entirely.
  return ['/', '/account', '/learn/transposable-elements', '/learn/transposable-elements/progress'].includes(value)
    ? value : '/account';
}
