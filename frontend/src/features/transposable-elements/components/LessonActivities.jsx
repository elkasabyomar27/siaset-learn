import ConceptDiagram from '../../../ui/ConceptDiagram.jsx';
import { useState } from 'react';
import { isCorrect } from '../lessonProgress.js';
export function Question({
  title,
  question,
  answer,
  onAnswer,
  name
}) {
  const answered = answer !== undefined, correct = answered && isCorrect(question, answer);
  // The chosen option carries its verdict in colour, icon and text, so a wrong choice never looks "selected-green".
  const verdict = i => answer !== i ? '' : correct ? 'answer-correct' : 'answer-incorrect';
  return <section className="lesson-section"><p className="eyebrow">{title}</p><fieldset className="lesson-question"><legend>{question.question}</legend>{question.options.map((option, i) => <label key={option} className={verdict(i)}><input type="radio" name={name} checked={answer === i} onChange={() => onAnswer(i)} /><span className="answer-text">{option}</span>{answer === i && <span className="answer-verdict">{correct ? '✓ Correct' : '✗ Not quite'}</span>}</label>)}</fieldset>{answered && <p role="status" className={`feedback ${correct ? 'good' : ''}`}><b>{correct ? 'Correct. ' : 'Not quite — try another option. '}</b>{correct ? '' : 'Hint: '}{question.explanation}</p>}</section>;
}
export function Exploration({
  lesson,
  inspected = [],
  onInspect
}) {
  const [selected, setSelected] = useState(null);
  const variant = lesson.variants[selected ?? 0];
  return <section className="lesson-section"><p className="eyebrow">03 / EXPLORE THE MOLECULE</p><h2>Inspect, compare, explain</h2><p>Select every view and use its evidence to answer the reasoning exercise.</p><div className="exploration-tabs" role="group" aria-label="Molecular views">{lesson.variants.map((v, i) => <button className="outline-button" key={v.label} aria-pressed={selected === i} onClick={() => {
        setSelected(i);
        onInspect(i);
      }}>{v.label}{inspected.includes(i) ? ' ✓' : ''}</button>)}</div><ConceptDiagram title={variant.label} blocks={variant.blocks}/><p role="status">{variant.explanation}</p></section>;
}
