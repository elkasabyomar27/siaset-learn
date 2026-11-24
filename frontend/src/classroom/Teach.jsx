import {useState} from 'react';
import {Link} from 'react-router';
import {useAuth} from '../auth/AuthProvider.jsx';
import {teacherRequest, useTeacherStatus} from './api.js';
import TeacherClasses from './TeacherClasses.jsx';
import TeacherQuizzes from './TeacherQuizzes.jsx';
import ClassroomNav from './ClassroomNav.jsx';
import './classroom.css';

export function ClassroomGate({client, user, ready, children}) {
  if (!client) return <p className="class-notice">Accounts aren’t configured on this site, so classroom features are unavailable.</p>;
  if (!ready) return <p role="status">Checking your account…</p>;
  if (!user) return <div className="class-card class-empty"><h2>Sign in to use the classroom</h2><p>Classes, assignments and live quizzes are linked to your account.</p><Link className="class-button primary" to="/account">Sign in or create an account</Link></div>;
  return children;
}

function RequestTeacherAccess({client, teacher}) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      const result = await teacherRequest(client, {action: 'request', school: values.get('school'), reason: values.get('reason')});
      setMessage(result.alreadySent ? 'Your request was already sent. The site owner has been emailed.' : result.status === 'approved' ? 'You’re approved.' : 'Request sent. You’ll get an email once the site owner reviews it.');
      teacher.reload();
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  const pending = teacher.status === 'pending', declined = teacher.status === 'declined';
  return <section className="class-card teacher-request">
    <p className="class-eyebrow">TEACHER ACCESS</p>
    <h2>{pending ? 'Your request is waiting for approval' : declined ? 'Your last request was declined' : 'Become a teacher'}</h2>
    <p>{pending ? `Sent ${new Date(teacher.request.created_at).toLocaleDateString()}. The site owner reviews every request by email. You can update the details below and resend after 10 minutes.` : 'Teachers can create classes, post assignments and run live quizzes. Tell us a little about where you teach; every request is checked by the site owner.'}</p>
    <form onSubmit={submit} className="class-form">
      <label>School or organisation<input name="school" required maxLength={200} defaultValue={teacher.request?.school || ''} disabled={busy}/></label>
      <label>How will you use SIASET?<textarea name="reason" required maxLength={1000} rows={3} defaultValue={teacher.request?.reason || ''} disabled={busy}/></label>
      <button className="class-button primary" disabled={busy}>{busy ? 'Sending…' : pending ? 'Resend request' : 'Request teacher access'}</button>
    </form>
    {message && <p role="status" className="class-status">{message}</p>}
  </section>;
}

export default function Teach() {
  const {client, user, ready} = useAuth();
  const teacher = useTeacherStatus(client, user);
  const [tab, setTab] = useState('classes');
  return <main className="dashboard classroom-page">
    <ClassroomNav/>
    <header className="class-heading"><p className="class-eyebrow">SIASET / CLASSROOM</p><h1>Teach</h1><p>Run your classes, collect assignments and host live quizzes.</p></header>
    <ClassroomGate client={client} user={user} ready={ready}>
      {teacher.status === 'loading' ? <p role="status">Loading…</p>
        : teacher.status === 'unavailable' ? <p className="class-notice">The classroom isn’t set up on this site yet. The site owner needs to apply the classroom database update.</p>
        : teacher.status !== 'approved' ? <RequestTeacherAccess client={client} teacher={teacher}/>
        : <>
          <div className="class-tabs" role="tablist" aria-label="Teaching tools">
            <button role="tab" aria-selected={tab === 'classes'} onClick={() => setTab('classes')}>Classes &amp; assignments</button>
            <button role="tab" aria-selected={tab === 'quizzes'} onClick={() => setTab('quizzes')}>Live quizzes</button>
          </div>
          {tab === 'classes' ? <TeacherClasses client={client}/> : <TeacherQuizzes client={client}/>}
        </>}
    </ClassroomGate>
  </main>;
}
