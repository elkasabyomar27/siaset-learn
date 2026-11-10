import {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import {allQuestions as bank} from '../features/transposable-elements/assessment.js';
import {friendlyError, OPTION_STYLES} from './api.js';

const blank = () => ({text: '', options: ['', ''], correct: 0, seconds: 20});
// Bank questions that fit the live-quiz limits (2–4 options, short text).
const importable = bank.filter(q => q.options.length >= 2 && q.options.length <= 4 && q.question.length <= 300 && q.options.every(o => o.length <= 120));

function QuizEditor({client, quiz, onDone}) {
  const [title, setTitle] = useState(quiz?.title || ''), [items, setItems] = useState(() => quiz?.questions?.map(q => ({...q, options: [...q.options]})) || [blank()]);
  const [showBank, setShowBank] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const update = (i, patch) => setItems(list => list.map((q, j) => j === i ? {...q, ...patch} : q));
  const setOption = (i, k, value) => update(i, {options: items[i].options.map((o, j) => j === k ? value : o)});
  function removeOption(i, k) {
    const q = items[i];
    update(i, {options: q.options.filter((_, j) => j !== k), correct: q.correct === k ? 0 : q.correct > k ? q.correct - 1 : q.correct});
  }
  async function save(event) {
    event.preventDefault();
    const cleaned = items.map(q => ({text: q.text.trim(), options: q.options.map(o => o.trim()), correct: q.correct, seconds: Number(q.seconds)}));
    const bad = cleaned.findIndex(q => !q.text || q.options.some(o => !o));
    if (bad >= 0) { setMessage(`Question ${bad + 1} needs text in the question and every answer.`); return; }
    setBusy(true);
    const row = {title: title.trim(), questions: cleaned};
    const {error} = quiz ? await client.from('quizzes').update({...row, updated_at: new Date().toISOString()}).eq('id', quiz.id) : await client.from('quizzes').insert(row);
    setBusy(false);
    if (error) setMessage(friendlyError(error)); else onDone();
  }
  return <form className="class-card quiz-editor" onSubmit={save}>
    <div className="class-detail-head"><h2>{quiz ? 'Edit quiz' : 'New quiz'}</h2><button type="button" className="class-link" onClick={onDone}>Cancel</button></div>
    <label className="class-form">Quiz title<input value={title} onChange={e => setTitle(e.target.value)} required maxLength={160} placeholder="e.g. Transposons warm-up"/></label>
    {items.map((q, i) => <fieldset key={i} className="quiz-question-edit">
      <legend>Question {i + 1}</legend>
      <textarea aria-label={`Question ${i + 1} text`} value={q.text} onChange={e => update(i, {text: e.target.value})} maxLength={300} rows={2} placeholder="Type the question"/>
      <div className="option-grid">{q.options.map((o, k) => <div key={k} className={`option-edit option-${OPTION_STYLES[k].name}`}>
        <span aria-hidden="true">{OPTION_STYLES[k].shape}</span>
        <input aria-label={`Question ${i + 1} answer ${k + 1}`} value={o} onChange={e => setOption(i, k, e.target.value)} maxLength={120} placeholder={`Answer ${k + 1}`}/>
        <label title="Correct answer"><input type="radio" name={`correct-${i}`} checked={q.correct === k} onChange={() => update(i, {correct: k})}/> correct</label>
        {q.options.length > 2 && <button type="button" className="class-link" aria-label={`Remove answer ${k + 1}`} onClick={() => removeOption(i, k)}>✕</button>}
      </div>)}</div>
      <div className="question-tools">
        {q.options.length < 4 && <button type="button" className="class-link" onClick={() => update(i, {options: [...q.options, '']})}>+ Answer</button>}
        <label>Time <select value={q.seconds} onChange={e => update(i, {seconds: Number(e.target.value)})}>{[10, 20, 30, 45, 60, 90, 120].map(s => <option key={s} value={s}>{s} s</option>)}</select></label>
        <button type="button" className="class-link" disabled={i === 0} onClick={() => setItems(l => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>↑</button>
        <button type="button" className="class-link" disabled={i === items.length - 1} onClick={() => setItems(l => { const n = [...l]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}>↓</button>
        {items.length > 1 && <button type="button" className="class-link danger" onClick={() => setItems(l => l.filter((_, j) => j !== i))}>Delete question</button>}
      </div>
    </fieldset>)}
    <div className="question-tools">
      <button type="button" className="class-button" disabled={items.length >= 50} onClick={() => setItems(l => [...l, blank()])}>+ Add question</button>
      <button type="button" className="class-button" aria-expanded={showBank} onClick={() => setShowBank(v => !v)}>Add from SIASET question bank</button>
    </div>
    {showBank && <div className="bank-list">{importable.map(q => {
      const added = items.some(item => item.text === q.question);
      return <div key={q.id}><span>{q.question}</span><button type="button" className="class-link" disabled={added || items.length >= 50}
        onClick={() => setItems(l => [...l.filter(item => item.text || item.options.some(Boolean)), {text: q.question, options: [...q.options], correct: q.correct, seconds: 30}])}>{added ? 'Added' : '+ Add'}</button></div>;
    })}</div>}
    <button className="class-button primary" disabled={busy}>{busy ? 'Saving…' : 'Save quiz'}</button>
    {message && <p role="status" className="class-status">{message}</p>}
  </form>;
}

export default function TeacherQuizzes({client}) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null), [editing, setEditing] = useState(undefined), [message, setMessage] = useState('');
  const load = useCallback(async () => {
    const {data, error} = await client.from('quizzes').select('id, title, questions, updated_at').order('updated_at', {ascending: false});
    if (error) setMessage(friendlyError(error)); else setQuizzes(data);
  }, [client]);
  useEffect(() => { load(); }, [load]);
  async function host(quiz) {
    const {data, error} = await client.rpc('start_quiz_session', {p_quiz: quiz.id});
    if (error) setMessage(friendlyError(error)); else navigate(`/teach/live/${data[0].session_id}`);
  }
  if (editing !== undefined) return <QuizEditor client={client} quiz={editing} onDone={() => { setEditing(undefined); load(); }}/>;
  return <section className="class-card">
    <div className="class-detail-head"><div><p className="class-eyebrow">LIVE QUIZZES</p><h2>Your quizzes</h2></div><button className="class-button primary" onClick={() => setEditing(null)}>+ New quiz</button></div>
    <p className="class-muted">Host a quiz on the classroom screen. Students go to <b>Live quiz</b>, enter the PIN and answer on their phones. Faster correct answers score more.</p>
    {quizzes?.length === 0 && <p className="class-muted">No quizzes yet. Create one or start from the SIASET question bank.</p>}
    <ul className="quiz-list">{quizzes?.map(q => <li key={q.id}>
      <div><b>{q.title}</b><span className="class-muted">{q.questions.length} question{q.questions.length === 1 ? '' : 's'}</span></div>
      <button className="class-button primary" onClick={() => host(q)}>▶ Host live</button>
      <button className="class-button" onClick={() => setEditing(q)}>Edit</button>
      <button className="class-link danger" onClick={async () => { if (window.confirm(`Delete “${q.title}”?`)) { const {error} = await client.from('quizzes').delete().eq('id', q.id); setMessage(error ? friendlyError(error) : 'Quiz deleted.'); load(); } }}>Delete</button>
    </li>)}</ul>
    {message && <p role="status" className="class-status">{message}</p>}
  </section>;
}
