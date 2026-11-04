import {useEffect, useRef, useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router';
import {getAuthClient} from './client.js';
import {finishAuthFlow, restartAuthFlow, startAuthFlow} from './flows.js';
import './account.css';

export default function Account() {
  const location = useLocation(), navigate = useNavigate();
  const [client] = useState(() => { try { return getAuthClient(); } catch { return null; } });
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const [recoveryOwner, setRecoveryOwner] = useState(null);
  const callback = useRef(null);
  const callbackRoute = ['/auth/callback', '/auth/recovery'].includes(location.pathname);

  useEffect(() => {
    if (!client) return;
    let active = true, revision = 0;
    const {data: {subscription}} = client.auth.onAuthStateChange((_event, session) => {
      revision++;
      if (active) { setUser(session?.user ?? null); setReady(true); }
    });
    const initialRevision = revision;
    client.auth.getUser().then(({data, error}) => {
      if (active && initialRevision === revision) { setUser(error ? null : data.user); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);

  useEffect(() => {
    if (!callbackRoute) return;
    if (!client) {
      window.history.replaceState(window.history.state, '', location.pathname);
      return;
    }
    let active = true;
    // Retain URL before history scrubbing, including StrictMode's second setup.
    callback.current ??= finishAuthFlow(client, window.location.href);
    callback.current.then(result => {
      if (!active) return;
      if (result.recovery) { setRecoveryOwner(result.owner); setMessage('Link verified. Choose a new password.'); }
      else navigate(result.destination, {replace: true});
    }).catch(() => { if (active) setMessage('This link could not be verified. Restart sign-in in the browser where you requested it.'); });
    return () => { active = false; };
  }, [client, callbackRoute, location.pathname, navigate]);

  async function run(action) {
    setBusy(true); setMessage('');
    try { await action(); }
    catch (error) { setMessage(error.message || 'Account request failed. Please try again.'); }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form), intent = event.nativeEvent.submitter?.value || 'login';
    const email = String(values.get('email') || ''), password = String(values.get('password') || '');
    form.reset();
    await run(async () => {
      if (['login', 'signup', 'update'].includes(intent) && password.length < (intent === 'login' ? 1 : 12)) throw Error('Enter a password. New passwords need at least 12 characters.');
      if (intent === 'update') {
        const verified = await client.auth.getUser();
        if (!recoveryOwner || verified.error || verified.data.user?.id !== recoveryOwner) throw Error('Request a new recovery link.');
        const result = await client.auth.updateUser({password});
        if (result.error) throw Error('Password could not be updated. Request a new link or check the password requirements.');
        setRecoveryOwner(null); navigate('/account', {replace: true}); setMessage('Password updated.');
      } else if (intent === 'login') {
        const result = await client.auth.signInWithPassword({email, password});
        if (result.error) throw Error('Sign-in failed. Check your details or use password recovery.');
        setMessage('Signed in. Learning remains saved in this browser.');
      } else {
        await startAuthFlow(intent === 'recover' ? 'recovery' : 'signup', () => intent === 'recover'
          ? client.auth.resetPasswordForEmail(email, {redirectTo: `${window.location.origin}/auth/recovery`})
          : client.auth.signUp({email, password, options: {emailRedirectTo: `${window.location.origin}/auth/callback`}}));
        setMessage('If this request is eligible, check your email. Open the link in this browser within 10 minutes.');
      }
    });
  }

  return <main className="dashboard account-page"><h1>Your account</h1>
    <p>Learning progress stays in this browser. Signing in does not upload or associate existing progress with an account. Account learning and import will be enabled in a later phase.</p>
    {!client ? <p role="status">Accounts are not configured in this environment. You can continue learning without signing in.</p> : <>
      <p role="status" aria-live="polite">{message || (!ready ? 'Checking account…' : user ? `Signed in as ${user.email || 'verified account'}.` : 'You are learning without an account.')}</p>
      {recoveryOwner ? <form onSubmit={submit}><label>New password<input name="password" type="password" minLength={12} required autoComplete="new-password"/></label><button value="update" disabled={busy}>Update password</button></form>
        : callbackRoute ? <Link to="/account">Return to account sign-in</Link>
          : user ? <button disabled={busy} onClick={() => run(async () => {
            const result = await client.auth.signOut({scope: 'local'});
            if (result.error) throw Error('Sign-out could not be confirmed. Please try again.');
            setRecoveryOwner(null); setMessage('Signed out on this device. Browser learning is still available.');
          })}>Sign out on this device</button> : <>
            <form onSubmit={submit}><label>Email<input name="email" type="email" required autoComplete="email" maxLength={254}/></label>
              <label>Password<input name="password" type="password" autoComplete="current-password"/></label>
              <button value="login" disabled={busy || !ready}>Sign in</button><button value="signup" disabled={busy || !ready}>Create account</button><button value="recover" disabled={busy || !ready}>Email password recovery link</button>
            </form>
            <button disabled={busy || !ready} onClick={() => run(() => startAuthFlow('google', () => client.auth.signInWithOAuth({provider: 'google', options: {redirectTo: `${window.location.origin}/auth/callback`}})))}>Continue with Google</button>
          </>}
      <button disabled={busy} onClick={() => run(async () => { await restartAuthFlow(); setRecoveryOwner(null); navigate('/account', {replace: true}); setMessage('Flow restarted. Earlier email links may no longer work.'); })}>Restart pending sign-in or email flow</button>
    </>}
    <p><Link to="/learn/transposable-elements">Continue learning in this browser</Link></p>
  </main>;
}
