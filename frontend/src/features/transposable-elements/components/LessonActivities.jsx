import { useState } from 'react';
import { isCorrect } from '../lessonProgress.js';
export function Question({
  title,
  question,
  answer,
  onAnswer,
  name
}) {
  return <section className="lesson-section"><p className="eyebrow">{title}</p><fieldset className="lesson-question"><legend>{question.question}</legend>{question.options.map((option, i) => <label key={option}><input type="radio" name={name} checked={answer === i} onChange={() => onAnswer(i)} />{option}</label>)}</fieldset>{answer !== undefined && <p role="status" className={`feedback ${isCorrect(question, answer) ? 'good' : ''}`}>{isCorrect(question, answer) ? 'Correct. ' : 'Reconsider. '}{question.explanation}</p>}</section>;
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
      }}>{v.label}{inspected.includes(i) ? ' ✓' : ''}</button>)}</div><div className="scientific-diagram" tabIndex={0} role="region" aria-label="Scrollable symbolic diagram"><svg className="lesson-svg" viewBox={`0 0 600 ${60 + variant.blocks.length * 65}`} role="img" aria-label={`${variant.label}: ${variant.blocks.join(', ')}`}><title>{variant.label} — symbolic explanatory diagram</title><line x1="300" y1="25" x2="300" y2={variant.blocks.length * 65 + 25} stroke="#607481" strokeWidth="4" />{variant.blocks.map((block, i) => <g key={`${block}-${i}`}><rect x="70" y={35 + i * 65} width="460" height="44" rx="6" fill={block.includes('TSD') ? '#342840' : '#29291f'} stroke={block.includes('TSD') ? 'var(--scientific-tsd)' : 'var(--scientific-element)'} /><text x="300" y={62 + i * 65} fill="#f0e8d5" textAnchor="middle" fontSize="17">{block}</text></g>)}</svg></div><p role="status">{variant.explanation}</p><p className="quiet">Explanatory symbolic model. No sequence, experimental outcome, physical scale or new molecular state is calculated.</p></section>;
}
