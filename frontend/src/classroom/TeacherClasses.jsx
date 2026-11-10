import {useCallback, useEffect, useState} from 'react';
import {formatDate, friendlyError} from './api.js';

function useRows(load, deps) {
  const [rows, setRows] = useState(null), [error, setError] = useState('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => { const {data, error: e} = await load(); if (e) setError(friendlyError(e)); else { setError(''); setRows(data); } }, deps);
  useEffect(() => { reload(); }, [reload]);
  return [rows, reload, error];
}

function Submissions({client, assignment, roster}) {
  const [rows, reload, error] = useRows(() => client.from('submissions').select('*').eq('assignment_id', assignment.id).order('submitted_at'), [client, assignment.id]);
  const [message, setMessage] = useState('');
  async function open(row) {
    const {data, error: e} = await client.storage.from('class-submissions').createSignedUrl(row.file_path, 300, {download: row.file_name});
    if (e) setMessage(friendlyError(e, 'The file could not be opened.')); else window.open(data.signedUrl, '_blank', 'noopener');
  }
  async function grade(event, row) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const {error: e} = await client.rpc('grade_submission', {p_assignment: assignment.id, p_student: row.user_id, p_grade: values.get('grade'), p_feedback: values.get('feedback')});
    setMessage(e ? friendlyError(e) : `Saved feedback for ${roster[row.user_id] || 'student'}.`);
    reload();
  }
  if (error) return <p className="class-error">{error}</p>;
  if (!rows) return <p role="status">Loading submissions…</p>;
  const missing = Object.keys(roster).filter(id => !rows.some(r => r.user_id === id));
  return <div className="submissions">
    <p className="class-muted">{rows.length} of {Object.keys(roster).length} handed in{missing.length ? ` · waiting on ${missing.map(id => roster[id]).join(', ')}` : ''}</p>
    {rows.map(row => {
      const late = assignment.due_at && new Date(row.submitted_at) > new Date(assignment.due_at);
      return <article key={row.user_id} className="submission-row">
        <div><b>{roster[row.user_id] || 'Former student'}</b><span className="class-muted"> · {formatDate(row.submitted_at)}{late && <em className="class-late"> late</em>}</span>
          <button className="class-link" onClick={() => open(row)}>📎 {row.file_name}</button>
          {row.note && <p className="class-note">“{row.note}”</p>}</div>
        <form className="grade-form" onSubmit={event => grade(event, row)}>
          <label>Grade<input name="grade" maxLength={40} defaultValue={row.grade || ''} placeholder="e.g. 18/20"/></label>
          <label>Feedback<textarea name="feedback" maxLength={2000} rows={2} defaultValue={row.feedback || ''}/></label>
          <button className="class-button">{row.graded_at ? 'Update' : 'Save'}</button>
        </form>
      </article>;
    })}
    {message && <p role="status" className="class-status">{message}</p>}
  </div>;
}

function ClassDetail({client, cls, onChanged, onDeleted}) {
  const [members, reloadMembers] = useRows(() => client.from('class_members').select('user_id, display_name, joined_at').eq('class_id', cls.id).order('display_name'), [client, cls.id]);
  const [assignments, reloadAssignments] = useRows(() => client.from('assignments').select('*').eq('class_id', cls.id).order('created_at', {ascending: false}), [client, cls.id]);
  const [openId, setOpenId] = useState(null), [message, setMessage] = useState(''), [confirmDelete, setConfirmDelete] = useState(false);
  const roster = Object.fromEntries((members || []).map(m => [m.user_id, m.display_name]));
  async function act(promise, done) { const {error} = await promise; setMessage(error ? friendlyError(error) : done); return !error; }
  async function addAssignment(event) {
    event.preventDefault();
    const form = event.currentTarget, values = new FormData(form), due = values.get('due');
    if (await act(client.from('assignments').insert({class_id: cls.id, title: values.get('title'), instructions: values.get('instructions'), due_at: due ? new Date(due).toISOString() : null}), 'Assignment posted.')) { form.reset(); reloadAssignments(); }
  }
  return <section className="class-card">
    <div className="class-detail-head">
      <div><p className="class-eyebrow">CLASS</p><h2>{cls.name}</h2></div>
      <div className="join-code"><span>Join code</span><strong>{cls.join_code}</strong>
        <button className="class-link" onClick={async () => { if (await act(client.rpc('new_join_code', {p_class: cls.id}), 'New code created. The old code no longer works.')) onChanged(); }}>New code</button></div>
    </div>
    <p className="class-muted">Students open <b>My classes</b>, sign in and enter this code.</p>

    <h3>Assignments</h3>
    <form className="class-form inline-form" onSubmit={addAssignment}>
      <label>Title<input name="title" required maxLength={160}/></label>
      <label>Due (optional)<input name="due" type="datetime-local"/></label>
      <label className="wide">Instructions<textarea name="instructions" maxLength={5000} rows={2}/></label>
      <button className="class-button primary">Post assignment</button>
    </form>
    {assignments?.length === 0 && <p className="class-muted">No assignments yet.</p>}
    {assignments?.map(a => <article key={a.id} className="assignment-row">
      <button className="assignment-toggle" aria-expanded={openId === a.id} onClick={() => setOpenId(openId === a.id ? null : a.id)}>
        <b>{a.title}</b><span className="class-muted">{a.due_at ? `Due ${formatDate(a.due_at)}` : 'No due date'}</span><span aria-hidden="true">{openId === a.id ? '▾' : '▸'}</span></button>
      {openId === a.id && <div className="assignment-body">
        {a.instructions && <p className="class-pre">{a.instructions}</p>}
        <Submissions client={client} assignment={a} roster={roster}/>
        <button className="class-link danger" onClick={async () => { if (window.confirm(`Delete “${a.title}” and all its submissions?`) && await act(client.from('assignments').delete().eq('id', a.id), 'Assignment deleted.')) reloadAssignments(); }}>Delete assignment</button>
      </div>}
    </article>)}

    <h3>Students ({members?.length ?? '…'})</h3>
    {members?.length === 0 && <p className="class-muted">No one has joined yet. Share the join code {cls.join_code}.</p>}
    <ul className="roster">{members?.map(m => <li key={m.user_id}><span>{m.display_name}</span><span className="class-muted">joined {new Date(m.joined_at).toLocaleDateString()}</span>
      <button className="class-link danger" onClick={async () => { if (window.confirm(`Remove ${m.display_name} from ${cls.name}?`) && await act(client.from('class_members').delete().eq('class_id', cls.id).eq('user_id', m.user_id), `${m.display_name} removed.`)) reloadMembers(); }}>Remove</button></li>)}</ul>

    <div className="class-danger-zone">{confirmDelete
      ? <><span>Delete {cls.name}, its assignments and all submissions? This can’t be undone.</span><button className="class-button danger" onClick={async () => { if (await act(client.from('classes').delete().eq('id', cls.id), 'Class deleted.')) onDeleted(); }}>Delete class</button><button className="class-button" onClick={() => setConfirmDelete(false)}>Cancel</button></>
      : <button className="class-link danger" onClick={() => setConfirmDelete(true)}>Delete this class…</button>}</div>
    {message && <p role="status" className="class-status">{message}</p>}
  </section>;
}

export default function TeacherClasses({client}) {
  const [classes, reload, error] = useRows(() => client.from('classes').select('id, name, join_code, created_at').order('created_at'), [client]);
  const [selected, setSelected] = useState(null), [message, setMessage] = useState('');
  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget, name = new FormData(form).get('name');
    const {data, error: e} = await client.from('classes').insert({name}).select('id').single();
    if (e) setMessage(friendlyError(e)); else { form.reset(); setMessage(''); await reload(); setSelected(data.id); }
  }
  const current = classes?.find(c => c.id === selected) || null;
  return <div className="class-columns">
    <aside className="class-card class-list">
      <h2>Your classes</h2>
      {error && <p className="class-error">{error}</p>}
      {classes?.length === 0 && <p className="class-muted">Create your first class to get a join code.</p>}
      <ul>{classes?.map(c => <li key={c.id}><button aria-current={c.id === selected} onClick={() => setSelected(c.id)}><b>{c.name}</b><span>{c.join_code}</span></button></li>)}</ul>
      <form className="class-form" onSubmit={create}><label>New class name<input name="name" required maxLength={120} placeholder="e.g. Genetics — Group A"/></label><button className="class-button primary">Create class</button></form>
      {message && <p role="status" className="class-status">{message}</p>}
    </aside>
    {current ? <ClassDetail key={current.id} client={client} cls={current} onChanged={reload} onDeleted={() => { setSelected(null); reload(); }}/>
      : <section className="class-card class-empty"><p>Select a class to see its students, assignments and submissions.</p></section>}
  </div>;
}
