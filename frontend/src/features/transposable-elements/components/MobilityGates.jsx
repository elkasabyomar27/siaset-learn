import { useId, useState } from 'react';
import { SYSTEMS, OUTCOME, evaluateGates, signalStops } from '../mobilityGates.js';
import './partsBench.css';

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
  function switchSystem(k) { setSystem(k); record(k, settings[k]); }

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · {mode === 'intro' ? 'WHAT MAKES AN ELEMENT AUTONOMOUS?' : 'MOBILITY GATES'}</p>
    <h2 id={`${uid}-title`}>{mode === 'intro' ? 'Who brings the machinery?' : 'Open a gate. Does that mean it moves?'}</h2>
    <p className="pb-goal">{mode === 'intro' ? 'Switch between Ac and Ds and decide where transposase comes from. Watch the signal pass, or stop, at each gate.' : 'Each system controls movement differently. Change the conditions and see which gate opens, narrows or closes.'}</p>

    {systems.length > 1 && <div className="cb-control mg-systems" role="group" aria-label="Choose a system"><span>System</span><div>{systems.map(k => <button type="button" key={k} className="outline-button" aria-pressed={system === k} onClick={() => switchSystem(k)}>{SYSTEMS[k].name}</button>)}</div></div>}

    <div className="cb-controls">
      {SYSTEMS[system].controls.map(c => c.type === 'choice'
        ? <div key={c.key} className="cb-control" role="group" aria-label={c.label}><span>{c.label}</span><div>{Object.entries(c.options).map(([v, label]) => <button type="button" key={v} className="outline-button" aria-pressed={s[c.key] === v} onClick={() => update({[c.key]: v})}>{label}</button>)}</div></div>
        : <label key={c.key} className="mg-toggle"><input type="checkbox" checked={!!s[c.key]} onChange={e => update({[c.key]: e.target.checked})} /> {c.label}</label>)}
    </div>

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
