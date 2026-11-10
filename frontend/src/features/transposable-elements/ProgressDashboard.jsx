import { useState } from 'react';
import { Link } from 'react-router';
import { allTopics as topics, modules } from './curriculum/modules.js';
import { topicHref } from './curriculum/lessons.js';
import { useProgress } from './useProgress.js';
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';
import { progressSummary, topicCompleted } from './learnerRecords.js';
import { scoreAssessment } from './assessment.js';
export default function ProgressDashboard() {
  const [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState('');
  const {
    progress,
    labs,
    attempts
  } = useProgress();
  const summary = progressSummary(topics, progress, labs),
    latest = attempts.at(-1);
  return <main className="laboratory"><h1>Your learning progress</h1><PersistenceStatus /><p>Not a secure certification. Past lab visits are not counted without a newly recorded completed review.</p><section className="metrics"><div><span>TOPICS COMPLETED</span><strong>{summary.completed}/{summary.total}</strong></div><div><span>CURRICULUM COMPLETION</span><strong>{summary.percentage}%</strong></div><div><span>ASSESSMENT ATTEMPTS</span><strong>{attempts.length}</strong></div></section><p>Denominator: all {summary.total} topics across {modules.length} modules = {topics.filter(t => t.learning.kind === 'lesson').length} interactive lessons plus {topics.filter(t => t.learning.kind === 'laboratory').length} guided laboratories. Sandbox activity and assessment scores do not complete topics.</p><section className="panel lesson-section"><h2>Learning milestones</h2><ul><li>{summary.completed >= 1 ? 'Achieved' : 'In progress'}: first completed topic</li><li>{labs.tn5 && labs.tn3 ? 'Achieved' : 'In progress'}: both guided mechanisms reviewed</li><li>{summary.completed === summary.total ? 'Achieved' : 'In progress'}: full curriculum reviewed</li></ul><h2>Latest cumulative score</h2>{latest ? <p>{scoreAssessment(latest.answers).correct}/{scoreAssessment(latest.answers).total} · {latest.date}</p> : <p>No submitted assessment yet.</p>}<button className="outline-button" onClick={() => progressRepository.refresh()}>Refresh local records</button><button className="outline-button" onClick={() => setConfirm(true)}>Reset assessment attempts only</button>{confirm && <div><p>This resets cumulative assessment history shown by SIASET. Lessons, guided records and sandbox sessions are unaffected.</p><button onClick={() => {
          const ok = progressRepository.resetAttempts();
          setMessage(ok ? 'Assessment history reset.' : 'Assessment history reset temporarily. Reloading or closing the page can restore unsaved records.');
          setConfirm(false);
        }}>Confirm removal of assessment attempts</button><button onClick={() => setConfirm(false)}>Cancel</button></div>}{message && <p role="status">{message}</p>}</section><div className="feature-actions"><Link className="outline-button" to="/learn/transposable-elements">Explore the curriculum</Link><Link className="outline-button" to="/learn/transposable-elements/assessment">Practice with the cumulative assessment</Link></div><p>Choose a topic below to continue or revisit it. Assessment practice is separate from topic completion.</p>{modules.map((module, m) => { const own = progressSummary(module.topics, progress, labs); return <section key={module.id} className="progress-module" aria-labelledby={`progress-${module.id}`}><h2 id={`progress-${module.id}`}>Module {m + 1} · {module.title} <small>{own.completed}/{own.total} completed</small></h2><ol className="lesson-path">{module.topics.map(t => <li key={t.id}><Link to={topicHref(t)}><span>{t.order}</span><b>{t.title}</b><small>{topicCompleted(t, progress, labs) ? 'Completed' : t.learning.kind === 'laboratory' ? 'Guided review not recorded' : 'Incomplete — continue lesson'}</small></Link></li>)}</ol></section>; })}</main>;
}
