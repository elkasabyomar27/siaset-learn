import { useId, useState } from 'react';
import { REAGENTS, STAGES, checkReagent, reagentsSorted } from '../dnaExtraction.js';
import './partsBench.css';

// Lesson 16 hands-on: pick a reagent, then the stage where it does its job.
export default function ReagentStages() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [placed, setPlaced] = useState({});
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const tray = REAGENTS.filter(r => !placed[r.id]);
  const done = reagentsSorted(placed);

  function drop(stage) {
    if (!selected) { setFeedback({correct: false, text: 'First pick a reagent, then choose a stage.'}); return; }
    const reagent = REAGENTS.find(r => r.id === selected), result = checkReagent(selected, stage);
    setFeedback({...result, name: reagent.name});
    if (result.correct) { setPlaced(p => ({...p, [selected]: stage})); setSelected(null); }
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · BUILD THE PROTOCOL</p>
    <h2 id={`${uid}-title`}>Every reagent has a job. When does it do it?</h2>
    <p className="pb-goal">Pick a reagent from the shelf, then place it in the stage where it acts. Think about what each one does to membranes, proteins, RNA or DNA.</p>

    <div className="cs-tray" role="group" aria-label="Reagents to place">
      {tray.length === 0 ? <p className="quiet">Every reagent is placed.</p> : tray.map(r => <button type="button" key={r.id} className={`cs-card${selected === r.id ? ' is-selected' : ''}`} aria-pressed={selected === r.id} onClick={() => { setSelected(r.id); setFeedback(null); }}>
        <b>{r.name}</b>
      </button>)}
    </div>

    <ol className="rs-stages" aria-label="Protocol stages in order">
      {STAGES.map((stage, i) => {
        const here = REAGENTS.filter(r => placed[r.id] === stage.id);
        return <li key={stage.id}><button type="button" className={`cs-cell rs-stage${selected ? ' is-target' : ''}`} onClick={() => drop(stage.id)} aria-label={`Place in stage ${i + 1}, ${stage.label}: ${stage.note}${here.length ? `; contains ${here.map(h => h.name).join(', ')}` : ''}`}>
          <span className="rs-stage-head"><b>{String(i + 1).padStart(2, '0')} · {stage.label}</b><small>{stage.note}</small></span>
          {here.map(r => <span key={r.id} className="cs-placed">✓ {r.name}</span>)}
          {!here.length && <span className="cs-empty">{selected ? 'Place here' : ''}</span>}
        </button></li>;
      })}
    </ol>

    {feedback && <div className={`pb-verdict${feedback.correct ? ' is-good' : ' is-bad'}`} role="status" aria-live="polite"><b>{feedback.correct ? `✓ ${feedback.name} placed.` : feedback.name ? `✗ Not that stage for ${feedback.name}.` : ''}</b> {feedback.text}</div>}
    {done && <div className="pb-verdict is-good" role="status"><b>Protocol assembled.</b> Open the cells and protect the DNA, digest what you don’t want, remove the proteins, then bring the DNA out of solution and wash it.</div>}
    <div className="pb-actions"><button type="button" className="outline-button" disabled={!Object.keys(placed).length} onClick={() => { setPlaced({}); setSelected(null); setFeedback(null); }}>Start over</button></div>
    <p className="quiet">Practice only; it doesn’t change lesson completion. A salting-out workflow is shown; phenol–chloroform and silica kits use different clean-up chemistry.</p>
  </section>;
}
