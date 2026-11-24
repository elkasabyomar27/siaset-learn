import { useCallback, useEffect, useRef, useState } from 'react';
import { assignedTopics, buildResults, stationTotals } from './stationResults.js';

const num = topic => String(topic.order).padStart(2, '0');
const LABEL = { done: 'Done', progress: 'In progress', new: 'Not started' };

function cellText(result) {
  if (result.status === 'done') return '✓ Done';
  if (result.status === 'progress') return `◐ ${result.detail.inspected}/${result.detail.views} views`;
  return '○ Not started';
}

function Detail({ student, topic, result, onClose }) {
  return <div className="station-detail" role="region" aria-label={`${student.name}, ${num(topic)} ${topic.title}`}>
    <div className="station-detail-head"><b>{student.name} · {num(topic)} {topic.title}</b>
      <button type="button" className="class-link" onClick={onClose}>Close</button></div>
    <p>Status: {LABEL[result.status]}</p>
    {result.detail.kind === 'lesson'
      ? <><p>Views inspected: {result.detail.inspected} of {result.detail.views}</p>
        <ul>{result.detail.questions.map(q => <li key={q.key}><b>{q.label}:</b> {q.answer === undefined ? 'Not answered' : <>{q.answerText} · {q.correct ? '✓ Correct' : '✗ Not correct'}</>}</li>)}</ul></>
      : <p>{result.detail.saved ? 'Completed lab review saved.' : 'No completed lab review saved yet.'}</p>}
  </div>;
}

/** Presentational dashboard for one load state; StationDashboard below fetches the data. */
export function StationDashboardView({ load, topics, results, totals, submissions = [], joinCode, onRefresh }) {
  const [open, setOpen] = useState(null);
  if (load === 'loading') return <div className="station-dashboard" aria-busy="true"><p role="status" className="class-muted">Loading progress…</p></div>;
  if (load === 'error') return <div className="station-dashboard"><p role="alert" className="class-status">Couldn’t load progress. Check your connection.</p>
    <button type="button" className="class-button" onClick={onRefresh}>Try again</button></div>;
  if (!results.length) return <div className="station-dashboard"><p className="class-muted">No students yet. Share the join code <b>{joinCode}</b>.</p></div>;
  const complete = results.filter(s => topics.every(t => s.stations[t.id]?.status === 'done')).length;
  const files = new Map(submissions.map(s => [s.user_id, s]));
  const showFiles = submissions.length > 0;
  const refreshing = load === 'refreshing';
  const current = open && results.find(s => s.userId === open.userId);
  const currentTopic = open && topics.find(t => t.id === open.topicId);
  return <div className="station-dashboard" aria-busy={refreshing ? 'true' : undefined}>
    <div className="station-dashboard-head"><p><b>{complete} of {results.length} complete</b> <span className="class-muted">· every assigned station done</span></p>
      <span role="status" className="class-muted">{refreshing ? 'Updating…' : ''}</span>
      <button type="button" className="class-button" onClick={onRefresh}>Refresh</button></div>
    <div className="station-grid-scroll">
      <table className="station-grid">
        <thead><tr><th scope="col">Student</th>{topics.map(t => <th key={t.id} scope="col" title={t.title}>{num(t)} {t.title}</th>)}{showFiles && <th scope="col">File</th>}</tr></thead>
        <tbody>
          {results.map(student => <tr key={student.userId}><th scope="row">{student.name}</th>
            {topics.map(t => { const r = student.stations[t.id]; return <td key={t.id}>
              <button type="button" className={`station-cell is-${r.status}`} aria-label={`${student.name}, ${num(t)} ${t.title}: ${LABEL[r.status]}`}
                aria-expanded={open?.userId === student.userId && open?.topicId === t.id} onClick={() => setOpen({ userId: student.userId, topicId: t.id })}>{cellText(r)}</button></td>; })}
            {showFiles && <td>{files.get(student.userId)?.file_name ?? '—'}</td>}</tr>)}
        </tbody>
        <tfoot>
          <tr><th scope="row">Done</th>{topics.map(t => <td key={t.id}>{totals[t.id].done}/{totals[t.id].total}</td>)}{showFiles && <td>{submissions.length} files</td>}</tr>
          <tr><th scope="row">Most missed</th>{topics.map(t => <td key={t.id}>{totals[t.id].mostMissed ?? '—'}</td>)}{showFiles && <td/>}</tr>
        </tfoot>
      </table>
    </div>
    {current && currentTopic && <Detail student={current} topic={currentTopic} result={current.stations[currentTopic.id]} onClose={() => setOpen(null)}/>}
  </div>;
}

/** Loads class members' progress for the assigned stations once, with a Refresh button. */
export default function StationDashboard({ client, assignment, joinCode }) {
  const [state, setState] = useState({ load: 'loading', rows: [], files: [] });
  const latest = useRef(0);
  const fetchRows = useCallback(async () => {
    const request = ++latest.current;
    // After the first load, keep the table (and the focused Refresh button) on screen while updating.
    setState(s => ({ ...s, load: s.load === 'ready' ? 'refreshing' : 'loading' }));
    let next;
    try {
      const [progress, files] = await Promise.all([
        client.rpc('assignment_station_progress', { p_assignment: assignment.id }),
        client.from('submissions').select('user_id, file_name').eq('assignment_id', assignment.id),
      ]);
      next = progress.error ? { load: 'error', rows: [], files: [] } : { load: 'ready', rows: progress.data || [], files: files.data || [] };
    } catch { next = { load: 'error', rows: [], files: [] }; }
    if (request === latest.current) setState(next); // Ignore answers to older, superseded requests.
  }, [client, assignment.id]);
  useEffect(() => { fetchRows(); }, [fetchRows]);
  const topics = assignedTopics(assignment.stations);
  const results = buildResults(state.rows, topics);
  return <StationDashboardView load={state.load} topics={topics} results={results} totals={stationTotals(results, topics)}
    submissions={state.files} joinCode={joinCode} onRefresh={fetchRows}/>;
}
