import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { TSD_STAGES, PRESETS, STAGGER_RANGE, HOST_LENGTH, ELEMENT_WIDTH, clampCut, tsdLayout, lengthChoices, predictionFeedback, describeLayout } from '../tsdJourney.js';
import './tsdBuilder.css';

const CELL = 20, TOP = 64, BOTTOM = 92, H = 22, PAD = 12, LABEL_W = 52;
const MAX_UNITS = HOST_LENGTH + STAGGER_RANGE[1] + ELEMENT_WIDTH;
const VIEW_W = MAX_UNITS * CELL + LABEL_W + PAD, VIEW_H = 170;
const PREDICT_STAGE = 1, LAST = TSD_STAGES.length - 1;
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const NARROW = '(max-width: 640px)';
const subscribeNarrow = cb => { const m = window.matchMedia?.(NARROW); m?.addEventListener('change', cb); return () => m?.removeEventListener('change', cb); };
// Phones zoom the drawing to the current step so positions stay large enough to count.
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => !!window.matchMedia?.(NARROW).matches, () => false);

function Cell({ cell, hatch }) {
  const y = cell.strand === 'top' ? TOP : BOTTOM;
  return <g className={`tsd-cell tsd-cell--${cell.kind}${cell.synthesized ? ' tsd-cell--new' : ''}`} style={{ transform: `translate(${cell.x * CELL}px, ${y}px)` }}>
    <rect x="1" y="0" width={CELL - 2} height={H} rx="3" />
    {cell.synthesized && <rect className="tsd-hatch" fill={`url(#${hatch})`} x="1" y="0" width={CELL - 2} height={H} rx="3" />}
    {cell.strand === 'top' && <text className={`tsd-pos${cell.kind === 'tsd' ? ' tsd-pos--interval' : ''}`} x={CELL / 2} y="-6" textAnchor="middle">{cell.pos + 1}</text>}
  </g>;
}

export default function TsdBuilder() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const hatch = `tsd-hatch-${uid}`;
  const [stagger, setStagger] = useState(9);
  const [cut, setCut] = useState(4);
  const [stage, setStage] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [challenge, setChallenge] = useState(false);
  const [playing, setPlaying] = useState(false);
  const layout = tsdLayout({ cut, stagger, stage });
  const gated = stage === PREDICT_STAGE && prediction === null;
  const feedback = prediction !== null ? predictionFeedback(stagger, prediction) : null;
  const narrow = useNarrow();
  const labelW = narrow ? PAD : LABEL_W;
  const viewW = narrow ? layout.width * CELL + labelW + PAD : VIEW_W;
  const offset = narrow ? labelW : ((MAX_UNITS - layout.width) / 2) * CELL + LABEL_W;

  useEffect(() => {
    if (!playing) return;
    if (stage >= LAST || gated) { setPlaying(false); return; }
    const timer = setTimeout(() => setStage(s => s + 1), 1700);
    return () => clearTimeout(timer);
  }, [playing, stage, gated]);

  function changeSetup(nextStagger, nextCut = cut) {
    setStagger(nextStagger);
    setCut(clampCut(nextCut, nextStagger));
    setPrediction(null);
    setPlaying(false);
    setStage(s => Math.min(s, PREDICT_STAGE));
  }
  function startChallenge() {
    let s;
    do s = randomInt(STAGGER_RANGE[0], STAGGER_RANGE[1]); while (s === stagger);
    setChallenge(true);
    changeSetup(s, randomInt(2, HOST_LENGTH - s - 2));
    setStage(PREDICT_STAGE);
  }
  function exitChallenge() { setChallenge(false); changeSetup(9, 4); setStage(0); }

  const showStagger = !challenge || stage > PREDICT_STAGE && prediction !== null;
  return <section className="lesson-section tsd-builder" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · BUILD THE REPEATS</p>
    <h2 id={`${uid}-title`}>{challenge ? 'Mystery element: count the cuts' : 'Where do the two repeats come from?'}</h2>
    <p className="tsd-goal">{challenge ? 'This element’s cut spacing is hidden. Count the positions between the cuts, predict the repeat length, then fill the gaps to check.' : 'Set where the strands are cut, then step through insertion. Predict how long each repeat will be before the gaps are filled.'}</p>

    <div className="tsd-controls">
      {!challenge ? <>
        <div className="tsd-presets" role="group" aria-label="Load a real element">
          {PRESETS.map(p => <button type="button" key={p.id} className="outline-button" aria-pressed={stagger === p.stagger} onClick={() => changeSetup(p.stagger)}>{p.label} <small>{p.stagger}-position stagger</small></button>)}
        </div>
        <label className="tsd-slider">Distance between cuts <b>{stagger}</b>
          <input type="range" min={STAGGER_RANGE[0]} max={STAGGER_RANGE[1]} value={stagger} onChange={e => changeSetup(Number(e.target.value))} />
        </label>
      </> : <p className="tsd-mystery" role="note"><b>?</b> Cut spacing hidden{showStagger ? ` — it was ${stagger}` : ''}</p>}
      <label className="tsd-slider">Cut position <b>{cut + 1}</b>
        <input type="range" min={2} max={HOST_LENGTH - stagger - 2} value={cut} onChange={e => changeSetup(stagger, Number(e.target.value))} />
      </label>
    </div>

    <figure className="tsd-stage-figure">
      <ol className="tsd-steps" aria-label="Insertion steps">
        {TSD_STAGES.map((s, i) => <li key={s.id} className={i === stage ? 'current' : i < stage ? 'done' : ''} aria-current={i === stage ? 'step' : undefined}><span>{i < stage ? '✓' : i + 1}</span>{s.title}</li>)}
      </ol>
      <div className="tsd-canvas">
        <svg viewBox={`0 0 ${viewW} ${VIEW_H}`} role="img" aria-label={describeLayout(layout)}>
          <defs>
            <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.5" height="6" fill="rgba(14,20,25,.55)" /></pattern>
          </defs>
          <g className="tsd-strand-labels"><text x="4" y={TOP + 15}>top</text><text x="4" y={BOTTOM + 15}>bottom</text></g>
          <g className="tsd-world" style={{ transform: `translateX(${offset}px)`}}>
            {layout.gaps.map(g => <rect key={g.id} className="tsd-gap" x={g.x * CELL + 1} y={g.strand === 'top' ? TOP : BOTTOM} width={CELL - 2} height={H} rx="3" />)}
            {layout.cells.map(c => <Cell key={c.id} cell={c} hatch={hatch} />)}
            {layout.element && <g className="tsd-element" style={{ transform: `translate(${layout.element.x * CELL}px, ${TOP - 4}px)` }}>
              <rect width={layout.element.width * CELL} height={BOTTOM - TOP + H + 8} rx="6" />
              <path className="tsd-tir" d={`M6 8 l10 ${(BOTTOM - TOP + H + 8) / 2 - 8} l-10 ${(BOTTOM - TOP + H + 8) / 2 - 8}`} />
              <path className="tsd-tir" d={`M${layout.element.width * CELL - 6} 8 l-10 ${(BOTTOM - TOP + H + 8) / 2 - 8} l10 ${(BOTTOM - TOP + H + 8) / 2 - 8}`} />
              <text x={layout.element.width * CELL / 2} y={(BOTTOM - TOP + H + 8) / 2 + 4} textAnchor="middle">Element</text>
            </g>}
            {layout.nicks.map(n => {
              const y = n.strand === 'top' ? TOP : BOTTOM;
              return <g key={n.strand} className="tsd-nick"><line x1={n.x * CELL} x2={n.x * CELL} y1={y - 6} y2={y + H + 6} /><text x={n.x * CELL} y={n.strand === 'top' ? y - 20 : y + H + 18} textAnchor="middle">✂</text></g>;
            })}
            {stage === PREDICT_STAGE && <g className="tsd-stagger-bracket"><line x1={cut * CELL} x2={(cut + stagger) * CELL} y1={BOTTOM + H + 30} y2={BOTTOM + H + 30} /><text x={(cut + stagger / 2) * CELL} y={BOTTOM + H + 46} textAnchor="middle">{showStagger ? `${stagger} positions apart` : '? positions apart'}</text></g>}
            {layout.repeats.map(r => <g key={r.side} className="tsd-repeat"><path d={`M${r.x * CELL} ${BOTTOM + H + 24} v8 h${r.width * CELL} v-8`} /><text x={(r.x + r.width / 2) * CELL} y={BOTTOM + H + 48} textAnchor="middle">Repeat · {r.width}</text></g>)}
          </g>
        </svg>
      </div>
      <figcaption className="tsd-legend">
        <span><i className="sw-host" />Host DNA</span><span><i className="sw-tsd" />Host interval between cuts</span><span><i className="sw-new" />New synthesis</span><span><i className="sw-element" />Element</span><span><i className="sw-gap" />Gap (one strand missing)</span>
      </figcaption>
    </figure>

    <div className="tsd-narration" role="status" aria-live="polite"><b>{stage + 1}. {layout.stage.title}.</b> {layout.stage.note}</div>

    {stage >= PREDICT_STAGE && <fieldset className="tsd-predict">
      <legend>Predict: after filling, how many positions long is <em>each</em> repeat?</legend>
      <div>{lengthChoices(stagger).map(v => <button type="button" key={v} className={`outline-button${prediction === v ? ' chosen' : ''}`} aria-pressed={prediction === v} disabled={stage > PREDICT_STAGE} onClick={() => setPrediction(v)}>{v}</button>)}</div>
      {stage < LAST ? <small>{prediction === null ? 'Choose a length to continue.' : 'Locked in. Continue to see if you were right.'}</small>
        : <p className={`feedback ${feedback.correct ? 'good' : ''}`}><b>{feedback.correct ? '✓ ' : '✗ '}</b>{feedback.text}</p>}
    </fieldset>}

    <div className="tsd-actions">
      <button type="button" className="outline-button" disabled={stage === 0} onClick={() => { setPlaying(false); setStage(s => s - 1); }}>← Back</button>
      <button type="button" className="outline-button" disabled={stage >= LAST || gated} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
      {stage < LAST ? <button type="button" className="primary-button" disabled={gated} onClick={() => { setPlaying(false); setStage(s => s + 1); }}>{gated ? 'Predict first' : 'Next step →'}</button>
        : <button type="button" className="primary-button" onClick={() => { setPrediction(null); setStage(0); }}>↺ Start again</button>}
      <span className="tsd-actions-spacer" />
      {stage === LAST && !challenge && <button type="button" className="outline-button" onClick={startChallenge}>Try a mystery element</button>}
      {stage === LAST && challenge && <button type="button" className="outline-button" onClick={startChallenge}>Another mystery</button>}
      {challenge && <button type="button" className="outline-button tsd-exit" onClick={exitChallenge}>Exit challenge</button>}
    </div>

    <details className="tsd-text"><summary>Read this diagram as text</summary><p>{describeLayout(layout)}</p></details>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Schematic positions, no sequence. For Tn3, the synthesis also copies the element (see Replicative Transposition).</p>
  </section>;
}
