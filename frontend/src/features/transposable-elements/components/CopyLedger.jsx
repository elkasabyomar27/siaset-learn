import { useId, useMemo, useState } from 'react';
import { LANES, COPY_CHOICES, laneStages, copyFeedback } from '../copyLedger.js';
import MoleculeView from './MoleculeView.jsx';
import './partsBench.css';

function Lane({ id, onDone }) {
  const stages = useMemo(() => laneStages(id), [id]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const last = index === stages.length - 1, next = stages[index + 1];
  function advance() {
    const fb = copyFeedback(id, index + 1, guess);
    setFeedback(fb); setIndex(index + 1); setGuess(null);
    if (index + 1 === stages.length - 1) onDone(id);
  }
  return <section className="cl-lane" aria-label={LANES[id].name}>
    <header><b>{LANES[id].name}</b><span className="cl-count" aria-label={`${stages[index].summary.copies} element copies`}>{Array.from({length: stages[index].summary.copies}, (_, i) => <i key={i} />)}<em>{stages[index].summary.copies} cop{stages[index].summary.copies === 1 ? 'y' : 'ies'}</em></span></header>
    <ol className="cl-steps">{stages.map((s, i) => <li key={s.label} className={i === index ? 'current' : i < index ? 'done' : ''}>{s.label}</li>)}</ol>
    <div className="molecule-grid cl-molecules">{stages[index].state.molecules.map(m => <MoleculeView key={m.id} molecule={m} compact />)}</div>
    {feedback && <div className={`pb-verdict ${feedback.correct ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite"><b>{feedback.correct ? '✓' : '✗'}</b> {feedback.text}</div>}
    {!last ? <fieldset className="tsd-predict"><legend>Predict copies after “{next.label}”</legend>
      <div>{COPY_CHOICES.map(n => <button type="button" key={n} className={`outline-button${guess === n ? ' chosen' : ''}`} aria-pressed={guess === n} onClick={() => setGuess(n)}>{n}</button>)}</div>
      <div className="pb-actions"><button type="button" className="primary-button" disabled={guess === null} onClick={advance}>{next.label} →</button></div>
    </fieldset> : <p className="cl-done">Pathway complete.</p>}
    <table className="cl-table"><thead><tr><th scope="col">Stage</th><th scope="col">Copies</th><th scope="col"><abbr title="Molecules">Mols</abbr></th><th scope="col">Repeats</th></tr></thead>
      <tbody>{stages.slice(0, index + 1).map(s => <tr key={s.label}><td>{s.label}</td><td>{s.summary.copies}</td><td>{s.summary.structures}</td><td>{s.summary.tsdCount ? `${s.summary.tsdCount} × ${s.summary.tsdBp} bp` : '—'}</td></tr>)}</tbody></table>
  </section>;
}

export default function CopyLedger() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [done, setDone] = useState(() => new Set());
  const [round, setRound] = useState(0);
  const finish = id => setDone(prev => new Set(prev).add(id));
  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · COUNT THE COPIES</p>
    <h2 id={`${uid}-title`}>Two DNA transposons. Do they end with the same number of copies?</h2>
    <p className="pb-goal">Run each pathway with the real molecular engine. Predict the copy number before every step and watch the ledger fill in.</p>
    <div className="cl-lanes" key={round}><Lane id="tn5" onDone={finish} /><Lane id="tn3" onDone={finish} /></div>
    {done.size === 2 && <div className="pb-verdict is-good" role="status"><b>Both pathways complete.</b> Tn5 ends with 1 copy; Tn3 ends with 2, now in two separate molecules. Both are DNA transposons, so “DNA-based” does not decide the copy outcome. Resolution separates molecules; it does not remove a copy.</div>}
    <div className="pb-actions"><button type="button" className="outline-button" onClick={() => { setRound(r => r + 1); setDone(new Set()); }}>Start both again</button></div>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Calculated by the same engine as the guided labs; donor repair after Tn5 is not modelled, and Tn3 products may remain catenated.</p>
  </section>;
}
