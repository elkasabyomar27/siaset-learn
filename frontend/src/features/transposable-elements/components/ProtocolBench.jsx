import { useId, useState } from 'react';
import { PRECIPITATION, PRECIPITATION_OUTCOMES, evaluatePrecipitation, WASH, WASH_OUTCOMES, evaluateWash, TUBE_CAPACITY_UL } from '../dnaExtraction.js';
import './partsBench.css';

const ICON = {open: '✓', restricted: '◐', closed: '✕'};

const BENCHES = {
  precipitation: {
    eyebrow: 'HANDS-ON · PRECIPITATION BENCH', title: 'Set up the tube. Will the DNA come down?',
    goal: 'Choose the sample, alcohol, volume and conditions. Each requirement is a gate; the DNA only pellets cleanly when every gate is open.',
    config: PRECIPITATION, outcomes: PRECIPITATION_OUTCOMES, evaluate: evaluatePrecipitation,
    goals: [
      {id: 'iso', title: 'Pellet DNA with isopropanol', done: (s, r) => s.alcohol === 'isopropanol' && r.outcome === 'pellet'},
      {id: 'eth', title: 'Pellet DNA with ethanol', done: (s, r) => s.alcohol === 'ethanol' && r.outcome === 'pellet'},
      {id: 'overflow', title: 'Find a set-up that overflows the tube', done: (s, r) => r.outcome === 'overflow'},
      {id: 'salt', title: 'Show how salt co-precipitates', done: (s, r) => r.outcome === 'salty'},
      {id: 'nosalt', title: 'Show why salt is needed', done: (s, r) => !s.salt && r.fits},
    ],
    note: 'Qualitative requirements from standard protocols. Volumes are typical ranges, not a yield calculation.',
  },
  wash: {
    eyebrow: 'HANDS-ON · WASH & DRY BENCH', title: 'Wash the pellet, dry it, dissolve it.',
    goal: 'Start from a fresh isopropanol pellet. Choose a wash, a drying time and a solvent, then read the quality report.',
    config: WASH, outcomes: WASH_OUTCOMES, evaluate: evaluateWash,
    goals: [
      {id: 'clean', title: 'Get clean DNA', done: (s, r) => r.outcome === 'clean'},
      {id: 'lost', title: 'Show how a wash can lose the DNA', done: (s, r) => r.outcome === 'lost'},
      {id: 'salty', title: 'Leave salt behind', done: (s, r) => r.outcome === 'salty'},
      {id: 'ethanol', title: 'Leave ethanol in the tube', done: (s, r) => r.outcome === 'ethanol'},
      {id: 'hard', title: 'Over-dry the pellet', done: (s, r) => r.outcome === 'hard'},
    ],
    note: 'Qualitative outcomes. Purity ratios are typical reference values for pure DNA, not a calculated measurement.',
  },
};

function Tube({result, settings, clip}) {
  const liquidTop = 150 - Math.min(result.fill, 1) * 120;
  const pellet = result.outcome === 'pellet' || result.outcome === 'salty';
  return <svg className="pr-tube" viewBox="0 0 120 190" role="img" aria-label={`Tube holding ${result.total} of ${TUBE_CAPACITY_UL} µL${result.fits ? '' : ', overflowing'}${pellet ? ', with a pellet' : ''}`}>
    <path d="M30 20h60v110q0 40-30 48q-30-8-30-48Z" fill="#16222a" stroke="currentColor" strokeWidth="2"/>
    <clipPath id={clip}><path d="M31 21h58v109q0 39-29 47q-29-8-29-47Z"/></clipPath>
    <g clipPath={`url(#${clip})`}>
      <rect x="30" y={liquidTop} width="60" height={190 - liquidTop} fill={settings.alcohol === 'isopropanol' ? '#cfe3ef' : '#d9ecd9'}/>
      {pellet && <ellipse cx="60" cy="168" rx="9" ry="4" fill={result.outcome === 'salty' ? '#f3f0e6' : '#ffffffcc'} stroke="#7a8f86" strokeDasharray={result.outcome === 'salty' ? '0' : '2 2'}/>}
    </g>
    {!result.fits && <path d="M30 20q-6 10-8 26M90 20q6 10 8 26" stroke="#b14b4b" strokeWidth="3" fill="none" strokeLinecap="round"/>}
    <text x="60" y="14" textAnchor="middle" fontSize="9" fill="currentColor">{result.total} µL</text>
    <line x1="92" y1="30" x2="100" y2="30" stroke="currentColor"/><text x="102" y="33" fontSize="7" fill="currentColor">1.5 mL</text>
  </svg>;
}

export default function ProtocolBench({kind}) {
  const bench = BENCHES[kind];
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [settings, setSettings] = useState(bench.config.defaults);
  const [reached, setReached] = useState(() => new Set());
  const result = bench.evaluate(settings), outcome = bench.outcomes[result.outcome];

  function update(patch) {
    const next = {...settings, ...patch}, r = bench.evaluate(next);
    setSettings(next);
    setReached(seen => { const add = bench.goals.filter(g => g.done(next, r) && !seen.has(g.id)); return add.length ? new Set([...seen, ...add.map(g => g.id)]) : seen; });
  }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">{bench.eyebrow}</p>
    <h2 id={`${uid}-title`}>{bench.title}</h2>
    <p className="pb-goal">{bench.goal}</p>

    <div className="cb-controls">
      {bench.config.controls.map(c => c.type === 'toggle'
        ? <label key={c.key} className="mg-toggle"><input type="checkbox" checked={!!settings[c.key]} onChange={e => update({[c.key]: e.target.checked})} /> {c.label}</label>
        : <div key={c.key} className="cb-control" role="group" aria-label={c.label}><span>{c.label}</span><div>{(Array.isArray(c.options) ? c.options : Object.entries(c.options)).map(([value, label]) => <button type="button" key={value} className="outline-button" aria-pressed={String(settings[c.key]) === value} onClick={() => update({[c.key]: typeof bench.config.defaults[c.key] === 'number' ? Number(value) : value})}>{label}</button>)}</div></div>)}
    </div>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>REQUIREMENTS IN ORDER</span><span>{result.gates.filter(g => g.state === 'open').length} / {result.gates.length} met</span></div>
      <div className={kind === 'precipitation' ? 'pr-layout' : undefined}>
        {kind === 'precipitation' && <Tube result={result} settings={settings} clip={`${uid}-tube`} />}
        <ol className="mg-pipeline" aria-label="Requirements in order">
          {result.gates.map(g => <li key={g.id} className={`mg-gate mg-gate--${g.state}`}>
            <span className="mg-node" aria-hidden="true">{ICON[g.state]}</span>
            <b>{g.label}</b><small className="mg-state">{g.state === 'open' ? 'met' : g.state === 'restricted' ? 'partly met' : 'not met'}</small><p>{g.note}</p>
          </li>)}
        </ol>
      </div>
      <figcaption>{bench.note}</figcaption>
    </figure>

    <div className={`pb-verdict ${outcome.tone === 'good' ? 'is-good' : outcome.tone === 'bad' ? 'is-bad' : ''}`} role="status" aria-live="polite"><b>{outcome.label}.</b> {outcome.text}{result.purity && <><br /><b>Purity check:</b> {result.purity}.</>}</div>

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {bench.goals.length}</p>
      <ul>{bench.goals.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <div className="pb-actions"><button type="button" className="outline-button" onClick={() => setSettings(bench.config.defaults)}>Reset the bench</button></div>
    <p className="quiet">Practice only; it doesn’t change lesson completion.</p>
  </section>;
}
