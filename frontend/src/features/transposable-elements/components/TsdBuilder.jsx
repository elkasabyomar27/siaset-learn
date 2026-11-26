import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { TSD_STAGES, PRESETS, STAGGER_RANGE, HOST_LENGTH, ELEMENT_WIDTH, clampCut, tsdLayout, lengthChoices, predictionFeedback, describeLayout } from '../tsdJourney.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { tsdIntent, fillGap } from '../hands-on/intents/tsd.js';
import '../hands-on/kit/geneticsScenes.css';
import './tsdBuilder.css';

const CELL = 20, TOP = 64, BOTTOM = 92, H = 22, PAD = 12, LABEL_W = 52, TRAY_Y = 204;
const MAX_UNITS = HOST_LENGTH + STAGGER_RANGE[1] + ELEMENT_WIDTH;
const VIEW_W = MAX_UNITS * CELL + LABEL_W + PAD, VIEW_H = 232;
const PREDICT_STAGE = 1, LAST = TSD_STAGES.length - 1;
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const NARROW = '(max-width: 640px)';
const subscribeNarrow = cb => { const m = window.matchMedia?.(NARROW); m?.addEventListener('change', cb); return () => m?.removeEventListener('change', cb); };
// Phones zoom the drawing to the current step so positions stay large enough to count.
const useNarrow = () => useSyncExternalStore(subscribeNarrow, () => !!window.matchMedia?.(NARROW).matches, () => false);
const inBox = (x0, y0, w, h) => (x, y) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;
const BOUNDARIES = Array.from({length: HOST_LENGTH - 3}, (_, i) => i + 2);

function Cell({ cell, hatch }) {
  const y = cell.strand === 'top' ? TOP : BOTTOM;
  return <g className={`tsd-cell tsd-cell--${cell.kind}${cell.synthesized ? ' tsd-cell--new' : ''}`} style={{ transform: `translate(${cell.x * CELL}px, ${y}px)` }}>
    <rect x="1" y="0" width={CELL - 2} height={H} rx="3" />
    {cell.synthesized && <rect className="tsd-hatch" fill={`url(#${hatch})`} x="1" y="0" width={CELL - 2} height={H} rx="3" />}
    {cell.strand === 'top' && <text className={`tsd-pos${cell.kind === 'tsd' ? ' tsd-pos--interval' : ''}`} x={CELL / 2} y="-6" textAnchor="middle">{cell.pos + 1}</text>}
  </g>;
}

// Everything drawn inside the stage SVG. The cut marks, the element and the polymerase are the
// gestures; the strands and gaps come from tsdLayout exactly as before.
function TsdScene({ layout, hatch, offset, viewW, cut, stagger, stage, predicted, challenge, showStagger, filled, onGesture, setNote }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', stage);
  const shift = stagger + ELEMENT_WIDTH, send = g => { activity(); return onGesture(g); };
  const marks = stage <= PREDICT_STAGE;
  const markZones = mark => BOUNDARIES.map(b => ({id: `${mark}-${b}`, label: `position ${b + 1}`, x: offset + b * CELL, y: mark === 'top' ? TOP - 22 : BOTTOM + H + 22,
    contains: inBox(offset + b * CELL - CELL / 2, mark === 'top' ? TOP - 44 : BOTTOM - 8, CELL, mark === 'top' ? H + 56 : H + 62)}));
  const gapZone = [{id: 'gap', label: 'the gap between the cuts', contains: inBox(offset + cut * CELL - 10, TOP - 30, stagger * CELL + 20, BOTTOM - TOP + H + 60)}];
  const fillZones = [
    {id: 'left', label: 'the left gap', contains: inBox(offset + cut * CELL - 10, TOP - 20, stagger * CELL + 20, H + 40)},
    {id: 'right', label: 'the right gap', contains: inBox(offset + (cut + shift) * CELL - 10, BOTTOM - 20, stagger * CELL + 20, H + 40)},
  ];
  const markPiece = (mark, locked) => <g><circle className="gx-piece gx-piece-tir" r="14" style={{opacity: locked ? 0.6 : 1}} /><text className="gx-text" y="5" textAnchor="middle">✂</text></g>;
  const pos = mark => (mark === 'top' ? cut : cut + stagger);
  const dropCut = mark => ({zone}) => {
    setOver(null);
    const b = Number(zone.split('-')[1]);
    const p = send({kind: 'drop', part: 'cut', mark, pos: b});
    if (p) setNote(challenge ? 'Cut moved. Count the positions between the two cuts.' : `Cuts are ${p.stagger} positions apart, starting at position ${p.cut + 1}.`);
  };
  const handlers = {onCarry: drag, onOver: setOver, onAnnounce: t => t && setNote(`Drop on: ${t}.`)};
  return <>
    <defs><pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.5" height="6" fill="currentColor" opacity=".55" /></pattern></defs>
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
      {stage === 2 && filled.includes('left') && <rect className="gx-piece gx-piece-tsd" x={cut * CELL + 1} y={TOP} width={stagger * CELL - 2} height={H} rx="3" />}
      {stage === 2 && filled.includes('right') && <rect className="gx-piece gx-piece-tsd" x={(cut + shift) * CELL + 1} y={BOTTOM} width={stagger * CELL - 2} height={H} rx="3" />}
      {layout.nicks.map(n => {
        const y = n.strand === 'top' ? TOP : BOTTOM;
        return <g key={n.strand} className="tsd-nick"><line x1={n.x * CELL} x2={n.x * CELL} y1={y - 6} y2={y + H + 6} /></g>;
      })}
      {stage === PREDICT_STAGE && <g className="tsd-stagger-bracket"><line x1={cut * CELL} x2={(cut + stagger) * CELL} y1={BOTTOM + H + 30} y2={BOTTOM + H + 30} /><text x={(cut + stagger / 2) * CELL} y={BOTTOM + H + 46} textAnchor="middle">{showStagger ? `${stagger} positions apart` : '? positions apart'}</text></g>}
      {layout.repeats.map(r => <g key={r.side} className="tsd-repeat"><path d={`M${r.x * CELL} ${BOTTOM + H + 24} v8 h${r.width * CELL} v-8`} /><text x={(r.x + r.width / 2) * CELL} y={BOTTOM + H + 48} textAnchor="middle">Repeat · {r.width}</text></g>)}
    </g>
    {over && over.includes('-') && <rect className="gx-zone" data-over="true" x={offset + Number(over.split('-')[1]) * CELL - CELL / 2} y={over.startsWith('top') ? TOP - 44 : BOTTOM - 8} width={CELL} height={over.startsWith('top') ? H + 56 : H + 62} rx="6" />}
    {over === 'gap' && <rect className="gx-zone" data-over="true" x={offset + cut * CELL} y={TOP - 30} width={stagger * CELL} height={BOTTOM - TOP + H + 60} rx="8" />}
    {(over === 'left' || over === 'right') && <rect className="gx-zone" data-over="true" x={offset + (over === 'left' ? cut : cut + shift) * CELL} y={over === 'left' ? TOP - 4 : BOTTOM - 4} width={stagger * CELL} height={H + 8} rx="6" />}

    {marks && <Draggable className="gx-cutmark" x={offset + pos('top') * CELL} y={TOP - 22} zones={markZones('top')} hit={hitBox(28, 36, scale)} expected={stage === 0}
      label={`Top cut mark: before position ${cut + 1}. Drag it along the top strand to move the top cut`} carriedLabel="Carrying the top cut mark. Arrow keys move it along the strand, Enter drops it" {...handlers}
      onCancel={() => setNote('The cut mark stayed where it was.')} onDrop={dropCut('top')}>{markPiece('top', false)}</Draggable>}
    {marks && (challenge
      ? <g transform={`translate(${offset + pos('bottom') * CELL} ${BOTTOM + H + 22})`} role="img" aria-label={`Bottom cut mark: fixed after position ${cut + stagger}. The distance is hidden in this challenge, so count it`}>{markPiece('bottom', true)}</g>
      : <Draggable className="gx-cutmark" x={offset + pos('bottom') * CELL} y={BOTTOM + H + 22} zones={markZones('bottom')} hit={hitBox(28, 36, scale)}
        label={`Bottom cut mark: after position ${cut + stagger}. Drag it along the bottom strand to change the distance between the cuts`} carriedLabel="Carrying the bottom cut mark. Arrow keys move it along the strand, Enter drops it" {...handlers}
        onCancel={() => setNote('The cut mark stayed where it was.')} onDrop={dropCut('bottom')}>{markPiece('bottom', false)}</Draggable>)}

    {stage === PREDICT_STAGE && <Draggable className="gx-element" x={viewW / 2} y={TRAY_Y} zones={gapZone} hit={hitBox(100, 36, scale)} expected={predicted}
      label={predicted ? 'Element: drag it into the gap between the cuts' : 'Element: predict the repeat length first, then drag it into the gap'} carriedLabel="Carrying the element. Press Enter to drop it in the gap" {...handlers}
      onCancel={() => setNote('The element is back in the tray.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'element', target: zone}); setNote(p ? 'The element joined both cut ends. Each flank now has a single-stranded gap.' : 'Predict the repeat length first.'); }}>
      <rect className="gx-piece gx-piece-element" x="-50" y="-18" width="100" height="36" rx="8" /><text className="gx-text" y="5" textAnchor="middle">Element</text>
    </Draggable>}
    {stage === 2 && <Draggable className="gx-polymerase" x={viewW / 2} y={TRAY_Y} zones={fillZones} hit={hitBox(110, 36, scale)} expected
      label={`Polymerase: drag it onto each gap to fill it${filled.length ? `. ${filled.length} of 2 filled` : ''}`} carriedLabel="Carrying the polymerase. Arrow keys choose the left or right gap, Enter drops it" {...handlers}
      onCancel={() => setNote('The polymerase is back in the tray.')}
      onDrop={({zone}) => { setOver(null); const p = send({kind: 'drop', part: 'polymerase', target: zone}); if (p) setNote(`Filled the ${p.fill} gap.`); }}>
      <circle className="gx-piece" r="18" style={{fill: 'var(--scientific-tsd)'}} /><text className="gx-text" y="5" textAnchor="middle">pol</text>
    </Draggable>}
    <DemoHand show={demo.show && stage <= 2 && (stage !== PREDICT_STAGE || predicted)} still={demo.still}
      from={stage === 0 ? {x: offset + cut * CELL, y: TOP - 22} : {x: viewW / 2, y: TRAY_Y}}
      to={stage === 0 ? {x: offset + (cut + 2) * CELL, y: TOP - 22} : {x: offset + (cut + stagger / 2) * CELL, y: TOP + H + 14}}
      text={stage === 0 ? 'Drag a cut mark' : stage === 1 ? 'Drag the element into the gap' : 'Drag the polymerase onto each gap'} labelAt={{x: viewW / 2, y: TRAY_Y + 24}} />
  </>;
}

export default function TsdBuilder() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const hatch = `tsd-hatch-${uid}`;
  const [stagger, setStagger] = useState(9);
  const [cut, setCut] = useState(4);
  const [stage, setStage] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [filled, setFilled] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [challenge, setChallenge] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState('');
  const layout = tsdLayout({ cut, stagger, stage });
  const gated = stage === PREDICT_STAGE && prediction === null;
  const feedback = prediction !== null ? predictionFeedback(stagger, prediction) : null;
  const narrow = useNarrow();
  const labelW = narrow ? PAD : LABEL_W;
  const viewW = narrow ? layout.width * CELL + labelW + PAD : VIEW_W;
  const offset = narrow ? labelW : ((MAX_UNITS - layout.width) / 2) * CELL + LABEL_W;

  function go(s) { setStage(s); setFurthest(f => Math.max(f, s)); setFilled([]); }
  useEffect(() => {
    if (!playing) return;
    if (stage >= LAST || gated) { setPlaying(false); return; }
    const timer = setTimeout(() => go(stage + 1), 1700);
    return () => clearTimeout(timer);
  }, [playing, stage, gated]);

  function changeSetup(nextStagger, nextCut = cut, nextStage) {
    setStagger(nextStagger);
    setCut(clampCut(nextCut, nextStagger));
    setPrediction(null);
    setPlaying(false);
    const s = Math.min(nextStage ?? stage, PREDICT_STAGE);
    setStage(s);
    setFurthest(f => Math.min(Math.max(f, s), PREDICT_STAGE));
    setFilled([]);
  }
  function startChallenge() {
    let s;
    do s = randomInt(STAGGER_RANGE[0], STAGGER_RANGE[1]); while (s === stagger);
    setChallenge(true);
    changeSetup(s, randomInt(2, HOST_LENGTH - s - 2), PREDICT_STAGE);
    setFurthest(PREDICT_STAGE);
  }
  function exitChallenge() { setChallenge(false); changeSetup(9, 4, 0); setFurthest(0); }

  // The gestures reach the same inputs as the old sliders and Next button.
  function onGesture(g) {
    const p = tsdIntent(g, {cut, stagger, stage, predicted: prediction !== null, locked: challenge});
    if (!p) return null;
    if ('cut' in p && p.cut === cut && p.stagger === stagger) return p; // a no-op keeps the prediction
    setPlaying(false);
    if ('fill' in p) {
      const r = fillGap(filled, p.fill);
      if (r.done) { go(3); setNote('Both gaps are filled: the host interval now appears on both sides.'); } else setFilled(r.filled);
    } else if ('cut' in p) changeSetup(p.stagger, p.cut, p.stage);
    else if (p.stage !== undefined) go(p.stage);
    return p;
  }

  const showStagger = !challenge || stage > PREDICT_STAGE && prediction !== null;
  return <section className="lesson-section tsd-builder" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · BUILD THE REPEATS</p>
    <h2 id={`${uid}-title`}>{challenge ? 'Mystery element: count the cuts' : 'Where do the two repeats come from?'}</h2>
    <p className="tsd-goal">{challenge ? 'This element’s cut spacing is hidden. Drag the top cut mark, count the positions between the cuts, predict the repeat length, then fill the gaps to check.' : 'Drag the two cut marks to set where the strands are cut, then drag the element in and fill the gaps. Predict how long each repeat will be before the gaps are filled.'}</p>

    <div className="tsd-controls">
      {!challenge ? <>
        <div className="tsd-presets" role="group" aria-label="Load a real element">
          {PRESETS.map(p => <button type="button" key={p.id} className="outline-button" aria-pressed={stagger === p.stagger} onClick={() => changeSetup(p.stagger)}>{p.label} <small>{p.stagger}-position stagger</small></button>)}
        </div>
        <p className="tsd-distance">Distance between cuts <b>{stagger}</b> · cut position <b>{cut + 1}</b></p>
      </> : <p className="tsd-mystery" role="note"><b>?</b> Cut spacing hidden{showStagger ? ` — it was ${stagger}` : ''}</p>}
    </div>

    <figure className="tsd-stage-figure">
      <ol className="tsd-steps" aria-label="Insertion steps">
        {TSD_STAGES.map((s, i) => <li key={s.id} className={i === stage ? 'current' : i < stage ? 'done' : ''} aria-current={i === stage ? 'step' : undefined}><span>{i < stage ? '✓' : i + 1}</span>{s.title}</li>)}
      </ol>
      <div className="tsd-canvas gx-scroll" style={{'--gx-min': narrow ? '0px' : `${viewW}px`}}>
        <BenchStage variant="molecular" className="gx-stage" width={viewW} height={VIEW_H} label={describeLayout(layout)}
          after={<NextStep className="gx-note">{note || (stage === 0 ? 'Drag a cut mark along its strand.' : stage === PREDICT_STAGE ? 'Move the cuts, predict, then drag the element into the gap.' : stage === 2 ? 'Drag the polymerase onto each gap.' : 'The gaps are filled.')}</NextStep>}>
          <TsdScene layout={layout} hatch={hatch} offset={offset} viewW={viewW} cut={cut} stagger={stagger} stage={stage} predicted={prediction !== null} challenge={challenge} showStagger={showStagger} filled={filled} onGesture={onGesture} setNote={setNote} />
        </BenchStage>
      </div>
      <figcaption className="tsd-legend">
        <span><i className="sw-host" />Host DNA</span><span><i className="sw-tsd" />Host interval between cuts</span><span><i className="sw-new" />New synthesis</span><span><i className="sw-element" />Element</span><span><i className="sw-gap" />Gap (one strand missing)</span>
      </figcaption>
    </figure>

    <div className="tsd-narration" role="status" aria-live="polite"><b>{stage + 1}. {layout.stage.title}.</b> {layout.stage.note}</div>

    {stage >= PREDICT_STAGE && <fieldset className="tsd-predict">
      <legend>Predict: after filling, how many positions long is <em>each</em> repeat?</legend>
      <div>{lengthChoices(stagger).map(v => <button type="button" key={v} className={`outline-button${prediction === v ? ' chosen' : ''}`} aria-pressed={prediction === v} disabled={stage > PREDICT_STAGE} onClick={() => setPrediction(v)}>{v}</button>)}</div>
      {stage < LAST ? <small>{prediction === null ? 'Choose a length to continue.' : 'Locked in. Drag the element into the gap to see if you were right.'}</small>
        : <p className={`feedback ${feedback.correct ? 'good' : ''}`}><b>{feedback.correct ? '✓ ' : '✗ '}</b>{feedback.text}</p>}
    </fieldset>}

    <div className="tsd-actions">
      <button type="button" className="outline-button" disabled={stage === 0} onClick={() => { setPlaying(false); setStage(s => s - 1); setFilled([]); }}>← Back</button>
      <button type="button" className="outline-button" disabled={stage >= furthest || (stage === PREDICT_STAGE && gated)} onClick={() => { setPlaying(false); go(stage + 1); }}>Forward →</button>
      <button type="button" className="outline-button" disabled={stage >= LAST || gated} onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
      {stage === LAST && <button type="button" className="primary-button" onClick={() => { setPrediction(null); setStage(0); setFurthest(0); setFilled([]); }}>↺ Start again</button>}
      <span className="tsd-actions-spacer" />
      {stage === LAST && !challenge && <button type="button" className="outline-button" onClick={startChallenge}>Try a mystery element</button>}
      {stage === LAST && challenge && <button type="button" className="outline-button" onClick={startChallenge}>Another mystery</button>}
      {challenge && <button type="button" className="outline-button tsd-exit" onClick={exitChallenge}>Exit challenge</button>}
    </div>

    <details className="tsd-text"><summary>Read this diagram as text</summary><p>{describeLayout(layout)}</p></details>
    <p className="quiet">Practice only; it doesn’t change lesson completion. Schematic positions, no sequence. For Tn3, the synthesis also copies the element (see Replicative Transposition).</p>
  </section>;
}
