import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router';
import {useAuth} from '../auth/AuthProvider.jsx';
import {profileDetails} from '../auth/profile.js';
import {formatDate, friendlyError, missingSetup, safeFileName} from './api.js';
import {ClassroomGate} from './Teach.jsx';
import {assignedTopics} from './stationResults.js';
import {useProgress} from '../features/transposable-elements/useProgress.js';
import {journeyStops} from '../features/transposable-elements/journey.js';
import {stationStatus, STATUS_LABEL} from '../ui/labData.js';
import ClassroomNav from './ClassroomNav.jsx';
import './classroom.css';

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.ppt,.pptx,.xlsx,.odt';
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.oasis.opendocument.text'];

/** The status pill: a file decides it when there is one; otherwise station progress does. */
export function assignmentPill({submission, overdue, stationsTotal, stationsDone}) {
  if (submission?.graded_at) return {label: 'Graded', tone: 'graded'};
  if (submission) return {label: 'Handed in', tone: 'done'};
  if (stationsTotal > 0 && stationsDone === stationsTotal) return {label: 'Stations done', tone: 'done'};
  return overdue ? {label: 'Overdue', tone: 'late'} : {label: 'To do', tone: ''};
}

/** Assigned stations with this student's own status (same rules as the Lab room). */
export function AssignedStations({stations, progress, labs}) {
  const topics = assignedTopics(stations);
  if (!topics.length) return null;
  const stops = journeyStops(progress, labs, '/classes');
  return <div className="station-assigned-wrap">
    <ul className="station-assigned" aria-label="Assigned stations">
      {topics.map(topic => { const stop = stops.find(s => s.id === topic.id), status = stationStatus(stop, progress);
        return <li key={topic.id}><b>{String(topic.order).padStart(2, '0')} · {topic.title}</b>
          <span className={`lab-status is-${status}`}>{STATUS_LABEL[status]}</span>
          <Link className="class-link" to={stop.href}>Open station</Link></li>; })}
    </ul>
    <p className="station-privacy">Your teacher can see your progress and answers on these stations.</p>
  </div>;
}

function AssignmentCard({client, user, cls, assignment, submission, onChanged}) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const {progress, labs} = useProgress();
  const assigned = assignedTopics(assignment.stations || []);
  const stops = assigned.length ? journeyStops(progress, labs, '/classes') : [];
  const stationsDone = assigned.filter(topic => stops.find(stop => stop.id === topic.id)?.completed).length;
  const overdue = assignment.due_at && new Date(assignment.due_at) < new Date();
  const pill = assignmentPill({submission, overdue, stationsTotal: assigned.length, stationsDone});
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget, values = new FormData(form), file = values.get('file');
    if (!file?.size) { setMessage('Choose a file to hand in.'); return; }
    if (file.size > MAX_BYTES) { setMessage('That file is too large. The limit is 25 MB.'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { setMessage('That file type isn’t allowed. Use PDF, Word, PowerPoint, Excel, text or an image.'); return; }
    setBusy(true); setMessage('');
    const path = `${cls.id}/${assignment.id}/${user.id}/${Date.now()}-${safeFileName(file.name)}`;
    try {
      const uploaded = await client.storage.from('class-submissions').upload(path, file, {contentType: file.type, upsert: false});
      if (uploaded.error) throw uploaded.error;
      const row = {file_path: path, file_name: file.name.slice(0, 200), file_size: file.size, note: String(values.get('note') || '').slice(0, 2000)};
      const saved = submission
        ? await client.from('submissions').update({...row, submitted_at: new Date().toISOString()}).eq('assignment_id', assignment.id).eq('user_id', user.id)
        : await client.from('submissions').insert({assignment_id: assignment.id, ...row});
      if (saved.error) { await client.storage.from('class-submissions').remove([path]); throw saved.error; }
      if (submission) await client.storage.from('class-submissions').remove([submission.file_path]);
      form.reset(); setMessage('Handed in. Your teacher can see it now.'); onChanged();
    } catch (error) { setMessage(friendlyError(error, 'The upload failed. Check your connection and try again.')); } finally { setBusy(false); }
  }
  async function view() {
    const {data, error} = await client.storage.from('class-submissions').createSignedUrl(submission.file_path, 300, {download: submission.file_name});
    if (error) setMessage(friendlyError(error, 'The file could not be opened.')); else window.open(data.signedUrl, '_blank', 'noopener');
  }
  return <article className="assignment-row student">
    <div className="assignment-title"><b>{assignment.title}</b>
      <span className={`class-pill ${pill.tone}`}>{pill.label}</span></div>
    <p className="class-muted">{assignment.due_at ? `Due ${formatDate(assignment.due_at)}` : 'No due date'}</p>
    {assignment.instructions && <p className="class-pre">{assignment.instructions}</p>}
    <AssignedStations stations={assignment.stations || []} progress={progress} labs={labs}/>
    {submission && <div className="my-submission">
      <span>Your file: <button className="class-link" onClick={view}>📎 {submission.file_name}</button> · {formatDate(submission.submitted_at)}</span>
      {submission.graded_at && <div className="feedback-box"><b>Grade: {submission.grade || '—'}</b>{submission.feedback && <p>{submission.feedback}</p>}</div>}
    </div>}
    <form className="class-form inline-form" onSubmit={submit}>
      <label>{submission ? 'Replace your file' : assigned.length ? 'Your file (optional)' : 'Your file'}<input name="file" type="file" accept={ACCEPT} required disabled={busy}/></label>
      <label className="wide">Note to your teacher (optional)<input name="note" maxLength={2000} disabled={busy}/></label>
      <button className="class-button primary" disabled={busy}>{busy ? 'Uploading…' : submission ? 'Hand in again' : 'Hand in'}</button>
    </form>
    {submission?.graded_at && <p className="class-muted">Handing in again clears the current grade so your teacher can mark the new file.</p>}
    {message && <p role="status" className="class-status">{message}</p>}
  </article>;
}

export function ClassView({client, user, cls, onLeft}) {
  const [data, setData] = useState(null);
  const load = useCallback(async () => {
    const [assignments, submissions] = await Promise.all([
      client.from('assignments').select('*').eq('class_id', cls.id).order('created_at', {ascending: false}),
      client.from('submissions').select('*').eq('user_id', user.id),
    ]);
    setData({assignments: assignments.data || [], submissions: submissions.data || []});
  }, [client, cls.id, user.id]);
  useEffect(() => { load(); }, [load]);
  return <section className="class-card">
    <div className="class-detail-head"><div><p className="class-eyebrow">CLASS</p><h2>{cls.name}</h2></div>
      <button className="class-link danger" onClick={async () => { if (window.confirm(`Leave ${cls.name}? Your handed-in work stays with your teacher.`)) { await client.from('class_members').delete().eq('class_id', cls.id).eq('user_id', user.id); onLeft(); } }}>Leave class</button></div>
    {!data ? <p role="status">Loading…</p> : data.assignments.length === 0 ? <p className="class-muted">No assignments yet.</p>
      : data.assignments.map(a => <AssignmentCard key={a.id} client={client} user={user} cls={cls} assignment={a} submission={data.submissions.find(s => s.assignment_id === a.id)} onChanged={load}/>)}
  </section>;
}

export default function MyClasses() {
  const {client, user, ready} = useAuth();
  const [classes, setClasses] = useState(null), [selected, setSelected] = useState(null), [message, setMessage] = useState(''), [unavailable, setUnavailable] = useState(false);
  const load = useCallback(async () => {
    if (!client || !user) return;
    const {data, error} = await client.from('class_members').select('class_id, classes(id, name, teacher_id)').eq('user_id', user.id).order('joined_at');
    if (error) { if (missingSetup(error)) setUnavailable(true); else setMessage(friendlyError(error)); return; }
    const list = data.map(row => row.classes).filter(Boolean);
    setClasses(list);
    setSelected(current => current && list.some(c => c.id === current) ? current : list[0]?.id ?? null);
  }, [client, user]);
  useEffect(() => { load(); }, [load]);
  async function join(event) {
    event.preventDefault();
    const form = event.currentTarget, code = new FormData(form).get('code');
    const {data, error} = await client.rpc('join_class', {p_code: code, p_display_name: profileDetails(user).name || user.email.split('@')[0]});
    if (error) { setMessage(friendlyError(error)); return; }
    form.reset(); setMessage(`You joined ${data[0].class_name}.`); await load(); setSelected(data[0].class_id);
  }
  const current = classes?.find(c => c.id === selected);
  return <main className="dashboard classroom-page">
    <ClassroomNav/>
    <header className="class-heading"><p className="class-eyebrow">SIASET / CLASSROOM</p><h1>My classes</h1><p>Join your teacher’s class, hand in assignments and see your feedback.</p></header>
    <ClassroomGate client={client} user={user} ready={ready}>
      {unavailable ? <p className="class-notice">The classroom isn’t set up on this site yet.</p> : <div className="class-columns">
        <aside className="class-card class-list">
          <form className="class-form" onSubmit={join}><label>Class code<input name="code" required minLength={6} maxLength={6} autoCapitalize="characters" autoComplete="off" placeholder="ABC234" className="code-input"/></label><button className="class-button primary">Join class</button></form>
          {message && <p role="status" className="class-status">{message}</p>}
          <h2>Joined</h2>
          {classes?.length === 0 && <p className="class-muted">You haven’t joined a class yet. Ask your teacher for the 6-letter code.</p>}
          <ul>{classes?.map(c => <li key={c.id}><button aria-current={c.id === selected} onClick={() => setSelected(c.id)}><b>{c.name}</b></button></li>)}</ul>
          <Link className="class-button live-link" to="/play">🎮 Join a live quiz</Link>
        </aside>
        {current ? <ClassView key={current.id} client={client} user={user} cls={current} onLeft={() => { setSelected(null); setMessage(`You left ${current.name}.`); load(); }}/>
          : <section className="class-card class-empty"><p>Enter a class code to get started.</p></section>}
      </div>}
    </ClassroomGate>
  </main>;
}
