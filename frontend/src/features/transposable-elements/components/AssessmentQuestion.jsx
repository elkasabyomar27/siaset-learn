import { Link } from 'react-router';
import topics from '../curriculum/topics.json' with { type: 'json' };
import references from '../profiles/references.json';
import { topicHref } from '../curriculum/lessons.js';
export default function AssessmentQuestion({
  q,
  i,
  answer,
  submitted,
  onAnswer
}) {
  return <section className="panel lesson-section"><p className="eyebrow">TOPIC {topics.find(t => t.id === q.topicId).order} · ITEM {i + 1}</p><fieldset className="lesson-question"><legend>{q.question}</legend>{q.options.map((option, index) => <label key={option}><input type="radio" name={q.id} disabled={submitted} checked={answer === index} onChange={() => onAnswer(index)} />{option}</label>)}</fieldset>{submitted && <><p className="feedback" role="status">{answer === q.correct ? 'Correct.' : 'Incorrect.'} Correct answer: {q.options[q.correct]}. {q.explanation}</p><Link to={topicHref(topics.find(t => t.id === q.topicId))}>Review this topic</Link><div className="reference-list">{q.references.map(id => {
          const r = references.find(r => r.id === id);
          return <a key={id} href={r.url} target="_blank" rel="noreferrer">{r.citation}</a>;
        })}</div></>}</section>;
}
