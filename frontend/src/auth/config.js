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

export function safeDestination(value) {
  // Fixed destinations avoid browser URL normalization and open redirects entirely.
  return ['/', '/account', '/learn/transposable-elements', '/learn/transposable-elements/progress'].includes(value)
    ? value : '/account';
}
