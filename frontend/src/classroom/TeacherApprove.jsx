import {useEffect, useState} from 'react';
import {useAuth} from '../auth/AuthProvider.jsx';
import {formatDate, teacherRequest} from './api.js';
import './classroom.css';

// Opened from the approval email. The one-time token in the link is the permission to decide;
// the reviewer does not need to be signed in.
export default function TeacherApprove() {
  const {client} = useAuth();
  const [link] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {user: params.get('user') || '', token: params.get('token') || ''};
  });
  const [request, setRequest] = useState(null), [result, setResult] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    // Keep the token out of browser history and referrers once it has been read.
    window.history.replaceState(window.history.state, '', '/teach/approve');
    if (!client) return;
    teacherRequest(client, {action: 'review', ...link}).then(setRequest).catch(error => setMessage(error.message));
  }, [client, link]);
  async function decide(decision) {
    setBusy(true);
    try { setResult(await teacherRequest(client, {action: 'decide', ...link, decision})); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <main className="dashboard classroom-page">
    <header className="class-heading"><p className="class-eyebrow">SIASET / TEACHER REQUEST</p><h1>Review teacher request</h1></header>
    {!client ? <p className="class-notice">Accounts aren’t configured on this site.</p>
      : result ? <section className="class-card"><h2>{result.status === 'approved' ? `✓ ${result.display_name} is now a teacher` : `${result.display_name}’s request was declined`}</h2>
          <p>{result.notified ? 'They’ve been emailed the outcome.' : 'The outcome email could not be sent, so let them know yourself.'}</p></section>
      : message ? <p className="class-notice">{message}</p>
      : !request ? <p role="status">Checking the link…</p>
      : <section className="class-card teacher-review">
          <dl><dt>Name</dt><dd>{request.display_name}</dd><dt>Email</dt><dd>{request.email || '—'}</dd><dt>School / organisation</dt><dd>{request.school}</dd><dt>How they’ll use SIASET</dt><dd className="class-pre">{request.reason}</dd><dt>Requested</dt><dd>{formatDate(request.created_at)}</dd></dl>
          <p className="class-muted">Teachers can create classes, see their own students’ submissions and host live quizzes. This link works once.</p>
          <div className="question-tools"><button className="class-button primary" disabled={busy} onClick={() => decide('approve')}>Approve teacher</button><button className="class-button danger" disabled={busy} onClick={() => decide('decline')}>Decline</button></div>
        </section>}
  </main>;
}
