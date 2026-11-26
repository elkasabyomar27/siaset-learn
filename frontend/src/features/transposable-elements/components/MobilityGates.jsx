import { useId, useState } from 'react';
import { SYSTEMS, OUTCOME, evaluateGates, signalStops } from '../mobilityGates.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { TapTarget } from '../hands-on/kit/TapTarget.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { Assumptions } from '../hands-on/kit/Assumptions.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { mobilityIntent, controlKind } from '../hands-on/intents/mobility.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

const SHORT = {acInTrans: 'Ac protein (in trans)', rnaOut: 'RNA-OUT', otherSource: 'Other source'};
const W = 600, H = 250, CELL = {x: 16, y: 16, w: 400, h: 218}, TRAY = {x: 436, y: 16, w: 148, h: 218}, DNA_Y = 160;
const inRect = r => (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const trayAt = i => ({x: TRAY.x + TRAY.w / 2, y: 62 + 50 * i});

// The cell: parts are dragged into or out of it, expression switches sit on the DNA.
function Cell({ system, s, update, setNote }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', system);
  const controls = SYSTEMS[system].controls;
  const pieces = [];
  controls.forEach(c => {
    const kind = controlKind(c);
    if (kind === 'choice') Object.entries(c.options).forEach(([v, label]) => pieces.push({c, kind, option: v, full: label, short: v, on: s[c.key] === v}));
    else if (kind === 'part') pieces.push({c, kind, full: c.label, short: SHORT[c.key] ?? c.key, on: !!s[c.key]});
  });
  const switches = controls.filter(c => controlKind(c) === 'switch');
  const zones = [{id: 'cell', label: 'the cell', contains: inRect(CELL)}, {id: 'tray', label: 'outside the cell', contains: inRect(TRAY)}];
  let partNo = 0;
  return <>
    <rect className="gx-zone" data-over={over === 'cell'} x={CELL.x} y={CELL.y} width={CELL.w} height={CELL.h} rx="14" />
    <rect className="gx-zone" data-over={over === 'tray'} x={TRAY.x} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx="14" />
    <text className="gx-small" x={CELL.x + 14} y={CELL.y + 20}>CELL</text>
    <text className="gx-small" x={TRAY.x + 14} y={TRAY.y + 20}>OUTSIDE THE CELL</text>
    <line className="gx-dna" x1="40" x2="392" y1={DNA_Y} y2={DNA_Y} />
    {system === 'maize' && <rect className="gx-solid" x="148" y={DNA_Y - 24} width="136" height="48" rx="8" />}
    {system === 'is10' && <>
      <rect className="gx-piece-tir" x="100" y={DNA_Y - 18} width="80" height="36" rx="6" /><text className="gx-text" x="140" y={DNA_Y + 5} textAnchor="middle">pIN</text>
      <rect className="gx-piece-gene" x="220" y={DNA_Y - 18} width="140" height="36" rx="6" /><text className="gx-text" x="290" y={DNA_Y + 5} textAnchor="middle">transposase gene</text>
    </>}
    {system === 'cacta1' && <><rect className="gx-piece-element" x="148" y={DNA_Y - 20} width="136" height="40" rx="8" /><text className="gx-text" x="216" y={DNA_Y + 5} textAnchor="middle">CACTA1</text></>}
    {switches.map(c => {
      const x = system === 'is10' ? 140 : 216, y = DNA_Y - 52, on = !!s[c.key];
      return <TapTarget key={c.key} label={`${c.label}: ${on ? 'on' : 'off'}. Activate to turn it ${on ? 'off' : 'on'}`} hit={{cx: x, cy: y, r: 22 / Math.max(scale, 0.05)}}
        onTap={() => { activity(); const p = mobilityIntent({kind: 'tap', target: 'switch', control: c.key}, s); if (p) { update(p); setNote(`${c.label}: ${p[c.key] ? 'on' : 'off'}.`); } }}>
        <g className="gx-switch" data-on={on}><rect className="gx-switch-track" x={x - 22} y={y - 11} width="44" height="22" rx="11" /><circle className="gx-switch-knob" cx={on ? x + 11 : x - 11} cy={y} r="8" /></g>
        <text className="gx-small" x={x} y={y - 18} textAnchor="middle">{on ? 'ON' : 'OFF'}</text>
      </TapTarget>;
    })}
    {pieces.map((p, idx) => {
      const partX = 80 + 130 * partNo;
      if (p.kind === 'part') partNo += 1;
      const pos = p.kind === 'choice' ? (p.on ? {x: 216, y: DNA_Y} : trayAt(idx)) : (p.on ? {x: partX, y: 70} : trayAt(idx));
      const label = p.kind === 'choice' ? `${p.full}${p.on ? ', in the element slot' : ''}. Drag it into the cell to use it`
        : p.on ? `${p.full}: in the cell. Drag it out of the cell to remove it` : `${p.full}: outside the cell. Drag it into the cell`;
      return <Draggable key={`${p.c.key}-${p.option ?? ''}`} className="gx-part" x={pos.x} y={pos.y} zones={zones} expected={idx === 0 && !p.on && p.kind === 'part'}
        hit={hitBox(112, 40, scale)} label={label} carriedLabel={`Carrying ${p.full}. Press Enter to drop it, arrow keys to choose the cell or outside`}
        onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote(`${p.short} is back where it was.`)}
        onDrop={({zone}) => {
          const patch = mobilityIntent({kind: 'drop', control: p.c.key, option: p.option, target: zone}, s);
          setOver(null);
          if (patch) { update(patch); setNote(zone === 'cell' ? `${p.short} is in the cell.` : `${p.short} is outside the cell.`); }
          else setNote(`${p.short} cannot be removed. Drag the other element in to swap it.`);
        }}>
        <rect className={p.kind === 'choice' && p.on ? 'gx-piece gx-piece-element' : 'gx-piece'} x="-56" y="-20" width="112" height="40" rx="8" />
        <text className="gx-text" y="5" textAnchor="middle">{p.short}</text>
      </Draggable>;
    })}
    {pieces.length > 0 && !pieces.some(p => p.on && p.kind === 'part') && <DemoHand show={demo.show} still={demo.still} from={trayAt(0)} to={{x: 150, y: 90}} text="Drag a part into the cell" labelAt={{x: 300, y: 44}} />}
  </>;
}

const ICON = {open: '✓', restricted: '◐', closed: '✕', unknown: '?'};
const STATE_LABEL = {open: 'open', restricted: 'restricted', closed: 'closed', unknown: 'unknown'};

// Goals depend on the lesson: Introduction focuses on autonomy, Regulation on reaching every outcome.
const GOALS = {
  intro: [
    {id: 'ac-alone', title: 'Show that Ac can move on its own', done: (sys, r, s) => sys === 'maize' && s.element === 'Ac' && r.outcome === 'permitted'},
    {id: 'ds-stuck', title: 'Leave Ds without any transposase', done: (sys, r, s) => sys === 'maize' && s.element === 'Ds' && r.outcome === 'not permitted'},
    {id: 'ds-helped', title: 'Let Ds move with help from Ac', done: (sys, r, s) => sys === 'maize' && s.element === 'Ds' && s.acInTrans && r.outcome === 'permitted'},
    {id: 'unknown', title: 'Show that capacity is not a guarantee', done: (sys, r) => r.outcome === 'undetermined'},
  ],
  regulation: Object.keys(OUTCOME).map(o => ({id: o, title: `Reach “${OUTCOME[o].label}” in any system`, done: (sys, r) => r.outcome === o})),
};

export default function MobilityGates({ mode = 'regulation' }) {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const systems = mode === 'intro' ? ['maize'] : Object.keys(SYSTEMS);
  const [system, setSystem] = useState(systems[0]);
  const [settings, setSettings] = useState(() => Object.fromEntries(Object.entries(SYSTEMS).map(([k, v]) => [k, v.defaults])));
  const [reached, setReached] = useState(() => new Set());
  const s = settings[system], result = evaluateGates(system, s), stop = signalStops(result.gates);
  const goals = GOALS[mode];

  function record(sys, sysSettings) {
    const r = evaluateGates(sys, sysSettings);
    setReached(seen => { const add = goals.filter(g => g.done(sys, r, sysSettings) && !seen.has(g.id)); return add.length ? new Set([...seen, ...add.map(g => g.id)]) : seen; });
  }
  function update(patch) {
    setSettings(prev => {
      const next = {...prev, [system]: {...prev[system], ...patch}};
      record(system, next[system]);
      return next;
    });
  }
  const [note, setNote] = useState('');
  const assumptions = SYSTEMS[system].controls.filter(c => controlKind(c) === 'assumption');
  function switchSystem(k) { setSystem(k); record(k, settings[k]); }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · {mode === 'intro' ? 'WHAT MAKES AN ELEMENT AUTONOMOUS?' : 'MOBILITY GATES'}</p>
    <h2 id={`${uid}-title`}>{mode === 'intro' ? 'Who brings the machinery?' : 'Open a gate. Does that mean it moves?'}</h2>
    <p className="pb-goal">{mode === 'intro' ? 'Switch between Ac and Ds and decide where transposase comes from. Watch the signal pass, or stop, at each gate.' : 'Each system controls movement differently. Change the conditions and see which gate opens, narrows or closes.'}</p>

    {systems.length > 1 && <div className="cb-control mg-systems" role="group" aria-label="Choose a system"><span>System</span><div>{systems.map(k => <button type="button" key={k} className="outline-button" aria-pressed={system === k} onClick={() => switchSystem(k)}>{SYSTEMS[k].name}</button>)}</div></div>}

    <div className="gx-scroll" style={{'--gx-min': '600px'}}>
      <BenchStage variant="molecular" className="gx-stage" width={W} height={H} label={`${SYSTEMS[system].name} cell. Drag parts into or out of the cell and use the switches on the DNA.`}
        after={<NextStep className="gx-note">{note || 'Drag a part into the cell, or flip a switch on the DNA, and watch the gates change.'}</NextStep>}>
        <Cell key={system} system={system} s={s} update={update} setNote={setNote} />
      </BenchStage>
    </div>
    <Assumptions items={assumptions.map(c => ({key: c.key, label: c.label}))} values={s} onChange={(key, value) => { const p = mobilityIntent({kind: 'assume', control: key, value}); if (p) update(p); }} />

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>{SYSTEMS[system].name.toUpperCase()} · REQUIREMENTS IN ORDER</span><span>{result.gates.filter(g => g.state === 'open').length} / {result.gates.length} gates open</span></div>
      <ol className="mg-pipeline" aria-label="Gates in order">
        {result.gates.map((g, i) => <li key={g.id} className={`mg-gate mg-gate--${g.state}${i < stop ? ' is-reached' : ''}`}>
          <span className="mg-node" aria-hidden="true">{ICON[g.state]}</span>
          <b>{g.label}</b><small className="mg-state">{STATE_LABEL[g.state]}</small><p>{g.note}</p>
          {i < stop && <span className="mg-pulse" aria-hidden="true" style={{animationDelay: `${i * .35}s`}} />}
        </li>)}
        <li className={`mg-gate mg-outcome mg-outcome--${result.outcome.replace(' ', '-')}`}>
          <span className="mg-node" aria-hidden="true">{result.outcome === 'permitted' ? '➜' : result.outcome === 'not permitted' ? '■' : result.outcome === 'reduced' ? '↘' : '?'}</span>
          <b>Mobility</b><small className="mg-state">{OUTCOME[result.outcome].label}</small><p>{OUTCOME[result.outcome].text}</p>
        </li>
      </ol>
      <figcaption>Qualitative gates under stated assumptions. No frequencies; host and element mechanisms are not interchangeable.</figcaption>
    </figure>

    <div className={`pb-verdict ${result.outcome === 'permitted' ? 'is-good' : result.outcome === 'not permitted' ? 'is-bad' : ''}`} role="status" aria-live="polite"><b>{OUTCOME[result.outcome].label}.</b> {OUTCOME[result.outcome].text}{result.autonomy && <><br /><b>Autonomy:</b> {result.autonomy}</>}</div>

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {goals.length}</p>
      <ul>{goals.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion. “Permitted” means the modelled requirements are met, not that an insertion will happen.</p>
  </section>;
}
