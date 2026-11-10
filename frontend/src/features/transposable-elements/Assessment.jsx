import AssessmentQuestion from './components/AssessmentQuestion.jsx';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import topics from './curriculum/topics.json' with { type: 'json' };
import { modules, moduleById, allTopics } from './curriculum/modules.js';
import { questions, scoreAssessment, moduleBanks, scoreModulePractice } from './assessment.js';
import { useProgress } from './useProgress.js';
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';

// The saved cumulative assessment is the transposable-element bank v1. Other modules get a
// practice assessment with the same questions-then-feedback flow; their scores are not saved.
export default function Assessment() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('module');
  const module = moduleBanks[requested] ? moduleById(requested) : modules[0];
  const saved = module.id === modules[0].id;
  return <main className="laboratory"><h1>{saved ? 'Cumulative assessment' : `${module.title} assessment`}</h1>
    <nav className="exploration-tabs assessment-modules" aria-label="Choose a module">{modules.map((m, i) => <button key={m.id} type="button" className="outline-button" aria-pressed={m.id === module.id} onClick={() => setParams(i === 0 ? {} : {module: m.id})}>Module {i + 1} · {m.title}</button>)}</nav>
    {saved ? <SavedAssessment key="saved" /> : <ModulePractice key={module.id} module={module} />}
  </main>;
}

function SavedAssessment() {
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
  return <><PersistenceStatus /><p>Local practice, not a formal qualification. {questions.length} deterministic questions cover all {topics.length} Transposable Elements topics. Each correct answer earns one point; no negative marking. Lesson completion is separate.</p>{latest && <p>Latest saved/in-session attempt: {scoreAssessment(latest.answers).correct}/{questions.length} · {latest.date}. Attempts: {attempts.length}.</p>}<p role="status">Answered {score.answered} of {score.total}.</p><form onSubmit={submit}>{questions.map((q, i) => <AssessmentQuestion key={q.id} q={q} i={i} answer={answers[q.id]} submitted={submitted} onAnswer={value => setAnswers(current => ({
        ...current,
        [q.id]: value
      }))} />)}<div className="lesson-section"><button className="primary-button" disabled={submitted || score.answered !== score.total}>Submit all answers</button></div></form>{submitted && <section className="panel lesson-section"><h2 role="status">Score: {score.correct}/{score.total} ({Math.round(score.correct / score.total * 100)}%)</h2><ul>{score.topics.map(t => <li key={t.topicId}>{topics.find(x => x.id === t.topicId).title}: {t.correct}/{t.total} · {t.correct === t.total ? 'Strength demonstrated on these items' : 'Review recommended'}</li>)}</ul><button className="outline-button" onClick={() => {
        setAnswers({});
        setSubmitted(false);
        setNotice('New attempt. Earlier submitted attempts and lessons are unchanged.');
      }}>Retry with blank answers</button><div className="feature-actions"><Link className="outline-button" to="/learn/transposable-elements/progress">View assessment history and progress</Link><Link className="outline-button" to="/learn/transposable-elements">Return to the curriculum</Link></div></section>}{notice && <p role="status">{notice}</p>}<p className="quiet">Feedback and keys appear after submission. Prior scores are recomputed from saved answers. An unfinished draft is not persisted.</p></>;
}

function ModulePractice({ module }) {
  const bank = moduleBanks[module.id];
  const [answers, setAnswers] = useState({}), [submitted, setSubmitted] = useState(false);
  const score = scoreModulePractice(module.id, answers);
  return <><p>Practice, not a formal qualification. {bank.length} questions cover all {module.topics.length} {module.title} topics. Each correct answer earns one point; no negative marking. Lesson completion is separate, and practice scores for this module are not saved.</p><p role="status">Answered {score.answered} of {score.total}.</p><form onSubmit={e => { e.preventDefault(); if (score.answered === score.total) setSubmitted(true); }}>{bank.map((q, i) => <AssessmentQuestion key={q.id} q={q} i={i} answer={answers[q.id]} submitted={submitted} onAnswer={value => setAnswers(current => ({...current, [q.id]: value}))} />)}<div className="lesson-section"><button className="primary-button" disabled={submitted || score.answered !== score.total}>Submit all answers</button></div></form>{submitted && <section className="panel lesson-section"><h2 role="status">Score: {score.correct}/{score.total} ({Math.round(score.correct / score.total * 100)}%)</h2><ul>{score.topics.map(t => <li key={t.topicId}>{allTopics.find(x => x.id === t.topicId).title}: {t.correct}/{t.total} · {t.correct === t.total ? 'Strength demonstrated on these items' : 'Review recommended'}</li>)}</ul><button className="outline-button" onClick={() => { setAnswers({}); setSubmitted(false); }}>Retry with blank answers</button><div className="feature-actions"><Link className="outline-button" to="/learn/transposable-elements/progress">View your progress</Link><Link className="outline-button" to="/learn/transposable-elements">Return to the curriculum</Link></div></section>}<p className="quiet">Feedback and keys appear after submission.</p></>;
}
