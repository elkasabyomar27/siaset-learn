import AssessmentQuestion from './components/AssessmentQuestion.jsx';
import { useState } from 'react';
import { Link } from 'react-router';
import topics from './curriculum/topics.json' with { type: 'json' };
import { questions, scoreAssessment } from './assessment.js';
import { useProgress } from './useProgress.js';
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';
export default function Assessment() {
  const {
    attempts
  } = useProgress();
  const [answers, setAnswers] = useState({}),
    [submitted, setSubmitted] = useState(false),
    [notice, setNotice] = useState('');
  const latest = attempts.at(-1),
    score = scoreAssessment(answers);
  function submit(e) {
    e.preventDefault();
    if (score.answered !== score.total) return;
    const date = new Date().toISOString();
    const saved = progressRepository.appendAttempt(answers, date);
    setSubmitted(true);
    setNotice(saved ? 'Attempt saved.' : 'Attempt kept temporarily while this page remains loaded, including internal navigation. Reloading or closing can lose it.');
  }
  return <main className="laboratory"><h1>Cumulative assessment</h1><PersistenceStatus /><p>Local practice, not a formal qualification. {questions.length} deterministic questions cover all {topics.length} topics. Each correct answer earns one point; no negative marking. Lesson completion is separate.</p>{latest && <p>Latest saved/in-session attempt: {scoreAssessment(latest.answers).correct}/{questions.length} · {latest.date}. Attempts: {attempts.length}.</p>}<p role="status">Answered {score.answered} of {score.total}.</p><form onSubmit={submit}>{questions.map((q, i) => <AssessmentQuestion key={q.id} q={q} i={i} answer={answers[q.id]} submitted={submitted} onAnswer={value => setAnswers(current => ({
        ...current,
        [q.id]: value
      }))} />)}<div className="lesson-section"><button className="primary-button" disabled={submitted || score.answered !== score.total}>Submit all answers</button></div></form>{submitted && <section className="panel lesson-section"><h2 role="status">Score: {score.correct}/{score.total} ({Math.round(score.correct / score.total * 100)}%)</h2><ul>{score.topics.map(t => <li key={t.topicId}>{topics.find(x => x.id === t.topicId).title}: {t.correct}/{t.total} · {t.correct === t.total ? 'Strength demonstrated on these items' : 'Review recommended'}</li>)}</ul><button className="outline-button" onClick={() => {
        setAnswers({});
        setSubmitted(false);
        setNotice('New attempt. Earlier submitted attempts and lessons are unchanged.');
      }}>Retry with blank answers</button><div className="feature-actions"><Link className="outline-button" to="/learn/transposable-elements/progress">View assessment history and progress</Link><Link className="outline-button" to="/learn/transposable-elements">Return to the curriculum</Link></div></section>}{notice && <p role="status">{notice}</p>}<p className="quiet">Feedback and keys appear after submission. Prior scores are recomputed from saved answers. An unfinished draft is not persisted.</p></main>;
}
