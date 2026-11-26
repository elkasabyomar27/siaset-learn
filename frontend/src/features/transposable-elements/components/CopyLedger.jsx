import { useId, useMemo, useState } from 'react';
import { LANES, COPY_CHOICES, laneStages, copyFeedback } from '../copyLedger.js';
import MoleculeView from './MoleculeView.jsx';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { HoldTarget } from '../hands-on/kit/HoldTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand } from '../hands-on/kit/useDemoHand.js';
import { copyLedgerIntent } from '../hands-on/intents/copyLedger.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

// The generation crank: press and hold to run the next step of the pathway.
function CrankScene({ lane, next, index, guess, onAdvance, setNote }) {
  const {scale} = useStage();
  const {demo, activity} = useDemoHand('hold', `${lane}-${index}`);
  return <>
    <circle className="gx-crank" cx="70" cy="60" r="34" />
    <line className="gx-crank-handle" x1="70" y1="60" x2="70" y2="34" />
    <circle cx="70" cy="60" r="6" className="gx-piece" />
    <text className="gx-text" x="130" y="56">Generation crank</text>
    <text className="gx-small" x="130" y="76">next: {next.label}</text>
    <HoldTarget className="cl-crank" label={`Hold the crank to run “${next.label}” for ${LANES[lane].name}`} cx={70} cy={60} hitR={Math.max(34, 22 / Math.max(scale, 0.05))} ringR={42} expected={guess !== null}
      onHold={() => { activity(); if (onAdvance()) setNote(`${next.label} done.`); else setNote('Choose your copy-number guess first, then hold the crank.'); }} />
    <DemoHand show={demo.show} still={demo.still} from={{x: 70, y: 60}} text="Press and hold the crank" labelAt={{x: 70, y: 116}} />
  </>;
}

function Lane({ id, onDone }) {
  const stages = useMemo(() => laneStages(id), [id]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const last = index === stages.length - 1, next = stages[index + 1];
  const [note, setNote] = useState('');
  function advance() {
    if (!copyLedgerIntent({kind: 'hold', target: 'crank'}, {guess})) return false;
    const fb = copyFeedback(id, index + 1, guess);
    setFeedback(fb); setIndex(index + 1); setGuess(null);
    if (index + 1 === stages.length - 1) onDone(id);
    return true;
  }
  return <section className="cl-lane" aria-label={LANES[id].name}>
    <header><b>{LANES[id].name}</b><span className="cl-count" aria-label={`${stages[index].summary.copies} element copies`}>{Array.from({length: stages[index].summary.copies}, (_, i) => <i key={i} />)}<em>{stages[index].summary.copies} cop{stages[index].summary.copies === 1 ? 'y' : 'ies'}</em></span></header>
    <ol className="cl-steps">{stages.map((s, i) => <li key={s.label} className={i === index ? 'current' : i < index ? 'done' : ''}>{s.label}</li>)}</ol>
    <div className="molecule-grid cl-molecules">{stages[index].state.molecules.map(m => <MoleculeView key={m.id} molecule={m} compact />)}</div>
    {feedback && <div className={`pb-verdict ${feedback.correct ? 'is-good' : 'is-bad'}`} role="status" aria-live="polite"><b>{feedback.correct ? '✓' : '✗'}</b> {feedback.text}</div>}
    {!last && <BenchStage variant="molecular" width={260} height={124} label={`${LANES[id].name}: generation crank. Press and hold it to run the next step.`}
      after={<NextStep className="gx-note">{note || 'Choose a guess, then press and hold the crank.'}</NextStep>}>
      <CrankScene lane={id} next={next} index={index} guess={guess} onAdvance={advance} setNote={setNote} />
    </BenchStage>}
    {!last ? <fieldset className="tsd-predict"><legend>Predict copies after “{next.label}”</legend>
      <div>{COPY_CHOICES.map(n => <button type="button" key={n} className={`outline-button${guess === n ? ' chosen' : ''}`} aria-pressed={guess === n} onClick={() => setGuess(n)}>{n}</button>)}</div>
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
