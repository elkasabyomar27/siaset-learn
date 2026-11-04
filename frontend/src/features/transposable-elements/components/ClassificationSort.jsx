import { useId, useState } from 'react';
import { CLASS_CARDS, CLASS_LABEL, COPY_LABEL, checkPlacement, sortComplete } from '../classificationSort.js';
import './partsBench.css';

const ROWS = ['increase', 'same'], COLS = ['I', 'II'];

export default function ClassificationSort() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [placed, setPlaced] = useState({});
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const tray = CLASS_CARDS.filter(c => !placed[c.id]);
  const done = sortComplete(placed);

  function drop(cls, copies) {
    if (!selected) { setFeedback({correct: false, text: 'First pick an element card, then choose a box.'}); return; }
    const card = CLASS_CARDS.find(c => c.id === selected), result = checkPlacement(selected, cls, copies);
    setFeedback({...result, name: card.name});
    if (result.correct) { setPlaced(p => ({...p, [selected]: `${cls}-${copies}`})); setSelected(null); }
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · SORT BY INTERMEDIATE</p>
    <h2 id={`${uid}-title`}>Follow the intermediate, then count the copies.</h2>
    <p className="pb-goal">Pick an element, read its pathway, and place it in the grid. Class depends on the intermediate; copy number is a separate question.</p>

    <div className="cs-tray" role="group" aria-label="Elements to sort">
      {tray.length === 0 ? <p className="quiet">All elements sorted.</p> : tray.map(card => <button type="button" key={card.id} className={`cs-card${selected === card.id ? ' is-selected' : ''}`} aria-pressed={selected === card.id} onClick={() => { setSelected(card.id); setFeedback(null); }}>
        <b>{card.name}{card.hypothetical && <small> · hypothetical</small>}</b>
        <span className="cs-steps">{card.steps.map((s, i) => <span key={s}>{i > 0 && <i aria-hidden="true">→</i>}<em className={/RNA|reverse/.test(s) ? 'is-rna' : ''}>{s}</em></span>)}</span>
      </button>)}
    </div>

    <div className="cs-grid" role="group" aria-label="Classification grid">
      <span className="cs-corner" aria-hidden="true" />
      {COLS.map(c => <span key={c} className="cs-col-head">{CLASS_LABEL[c]}</span>)}
      {ROWS.map(r => <div key={r} className="cs-row">
        <span className="cs-row-head">{COPY_LABEL[r]}</span>
        {COLS.map(c => {
          const here = CLASS_CARDS.filter(card => placed[card.id] === `${c}-${r}`);
          return <button type="button" key={c} className={`cs-cell${selected ? ' is-target' : ''}`} onClick={() => drop(c, r)} aria-label={`Place in ${CLASS_LABEL[c]}, ${COPY_LABEL[r]}${here.length ? `; contains ${here.map(h => h.name).join(', ')}` : ''}`}>
            {here.map(card => <span key={card.id} className="cs-placed">✓ {card.name}</span>)}
            {!here.length && <span className="cs-empty">{selected ? 'Place here' : ''}</span>}
          </button>;
        })}
      </div>)}
    </div>

    {feedback && <div className={`pb-verdict${feedback.correct ? ' is-good' : ' is-bad'}`} role="status" aria-live="polite"><b>{feedback.correct ? `✓ ${feedback.name} placed.` : feedback.name ? `✗ Not that box for ${feedback.name}.` : ''}</b> {feedback.text}</div>}
    {done && <div className="pb-verdict is-good" role="status"><b>All sorted.</b> Class II appears in both rows: Tn5 keeps one copy while Tn3 makes two. Knowing the class alone does not tell you the copy outcome.</div>}
    <div className="pb-actions"><button type="button" className="outline-button" disabled={!Object.keys(placed).length} onClick={() => { setPlaced({}); setSelected(null); setFeedback(null); }}>Start over</button></div>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Hypothetical elements are teaching examples, not named biological elements.</p>
  </section>;
}
