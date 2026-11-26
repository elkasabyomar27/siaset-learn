import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import MoleculeView from './components/MoleculeView.jsx';
import { WhatChanged } from '../../ui/ExperimentBench.jsx';
import { copies } from './engine/model.js';
import { Tn5Scene, Tn3Scene } from './components/StoryScenes.jsx';
import { newBench, benchAction, BENCH_GOALS } from './freeBench.js';
import { boundaryFromAngle } from './storyLab.js';
import './components/storyLab.css';

/** One sandbox attempt: a scene gesture's action (angle -> target site), judged by the free bench. */
export function sandboxAction(bench, action) {
  return benchAction(bench, action.angle === undefined ? action : {...action, boundary: boundaryFromAngle(action.angle)});
}

// Free hands-on sandbox: the story-lab scenes without a script. Any gesture, any order; the engine
// decides what happens. Session-only: nothing here records lesson or lab completion.
export default function Sandbox() {
  const [bench, setBenchState] = useState(() => newBench('tn5'));
  // Mirror of the latest bench so rapid taps never act on a stale render.
  const latest = useRef(bench);
  const setBench = next => { latest.current = typeof next === 'function' ? next(latest.current) : next; setBenchState(latest.current); };
  const [notebook, setNotebook] = useState([]);
  const [inspected, setInspected] = useState([]);
  const {scenario} = bench, state = bench.history.state, phase = state.phase;
  const done = new Set(BENCH_GOALS.filter(g => g.done(notebook)).map(g => g.id));

  function dispatch(action) {
    if (action.type === 'inspect') setInspected(list => list.includes(action.feature) ? list : [...list, action.feature]);
    const r = sandboxAction(latest.current, action);
    setBench(r.bench);
    setNotebook(n => [...n, r.entry]);
  }
  function restart(next = scenario) { setBench(newBench(next)); setInspected([]); }

  // The scenes are shared with the story labs; map bench state onto the scene's stage vocabulary.
  // Memoized: the scene keys its live line and local notes on this object, so it must change only
  // when the bench (or what was inspected) does.
  const scene = useMemo(() => {
    const p = bench.history.state.phase;
    return bench.scenario === 'tn5'
      ? {...bench, inspected, answers: {}, stage: p === 'inserted' ? 3 : bench.bound.length === 2 ? 1 : 0}
      : {...bench, inspected, answers: {}, stage: p === 'resolved' ? 5 : p === 'cointegrate' ? 4 : bench.joined ? 2 : 0};
  }, [bench, inspected]);

  return <main className="laboratory hands-on-lab story-lab sandbox-bench">
    <header className="bench-header"><div><p className="eyebrow">SIASET / FREE EXPLORATION</p><h1>Your DNA playground.</h1><p>No script. Try any step in any order, even the wrong ones, and see what the engine allows.</p></div><div className="bench-mode"><span>MOLECULAR SANDBOX</span><small>Session only · never records progress</small></div></header>
    <div className="bench-switcher" role="group" aria-label="Choose an element"><button aria-pressed={scenario === 'tn5'} onClick={() => scenario !== 'tn5' && restart('tn5')}><span>01</span><b>Tn5</b><small>Conservative / cut and paste</small></button><button aria-pressed={scenario === 'tn3'} onClick={() => scenario !== 'tn3' && restart('tn3')}><span>02</span><b>Tn3</b><small>Replicative / copy and join</small></button><Link to="/lab/transposable-elements">Guided labs ↗</Link></div>

    <section className="sl-stage-wrap" aria-label="Free bench scene">
      <div className="sl-vitals"><span>ELEMENT COPIES <b>{copies(state).length}</b></span><span>DNA MOLECULES <b>{state.molecules.length}</b></span><span>STATE <b>{phase === 'initial' ? 'Separate DNA' : phase === 'inserted' ? 'Inserted' : phase === 'cointegrate' ? 'Cointegrate' : 'Resolved'}</b></span>{scenario === 'tn3' && <span>TnpR <b>{bench.tnpR ? 'docked' : 'absent'}</b></span>}</div>
      {scenario === 'tn5' ? <Tn5Scene s={scene} dispatch={dispatch} free /> : <Tn3Scene s={scene} dispatch={dispatch} free />}
      <p className="sl-scene-note">{scenario === 'tn5'
        ? 'Hold an end to bind transposase. Swipe down across an end to cut it. Drag Tn5 onto the ring, even twice. Schematic: not to scale, no sequence.'
        : 'Drag the target onto the donor. Hold the fork to replicate. Drag TnpR onto a res site, then press Resolve. Schematic: not to scale, no sequence.'}</p>
    </section>

    {/* The scene's next-step line is the one live region for scene feedback, Resolve's included. */}
    <section className="sl-task" aria-label="Bench">
      <p className="eyebrow">AT THE BENCH · ANY ORDER</p>
      <p>{scenario === 'tn5'
        ? 'Everything happens in the scene. Keyboard: Tab to a part; hold Enter to bind an end, press Enter to cut it; Enter picks Tn5 up and drops it on the ring, then the arrow keys choose the spot.'
        : 'Everything except Resolve happens in the scene. Keyboard: Tab to a part; Enter picks up and drops, arrow keys choose, hold Enter on the fork to replicate.'}</p>
      <div className="sl-actions">
        {/* Resolve is a commitment action: a real button, available at any time so the engine can refuse it. */}
        {scenario === 'tn3' && <button type="button" className="primary-button" onClick={() => dispatch({type: 'resolve'})}>Resolve →</button>}
        <button type="button" className="account-text-button sl-restart" onClick={() => restart()}>Fresh molecules</button>
      </div>
      <WhatChanged change={bench.change} onDismiss={() => setBench(b => ({...b, change: null}))} />
    </section>

    <div className="sb-columns">
      <section className="investigations" aria-label="Investigations"><div className="investigations-head"><p className="eyebrow">INVESTIGATIONS</p><b>{done.size} / {BENCH_GOALS.length}</b></div><ul>{BENCH_GOALS.map(g => <li key={g.id} className={done.has(g.id) ? 'done' : ''}><span aria-hidden="true">{done.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{done.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul></section>
      <details className="sl-engine" open={bench.history.events.length > 0}><summary>Engine view: the calculated molecules</summary>
        <div className="molecule-grid bench-molecules">{state.molecules.map(m => <MoleculeView key={`${m.id}-${state.revision}`} molecule={m} compact highlight={bench.change?.highlight?.[m.id]} />)}</div>
      </details>
    </div>

    <section className="lab-notebook" aria-label="Experiment notebook"><div className="lab-notebook-head"><div><p className="eyebrow">EXPERIMENT NOTEBOOK</p><h2>Everything you tried.</h2></div>{notebook.length > 0 && <button type="button" className="outline-button" onClick={() => setNotebook([])}>Clear notebook</button>}</div>
      {notebook.length === 0 ? <p className="quiet">Every attempt, including the ones the engine refuses, is logged here. Kept until you leave this page.</p>
        : <div className="lab-notebook-scroll"><table><thead><tr><th scope="col">#</th><th scope="col">Element</th><th scope="col">Action</th><th scope="col">Result</th><th scope="col">Copies</th><th scope="col">Molecules</th><th scope="col">What happened</th></tr></thead>
          <tbody>{notebook.map((e, i) => <tr key={i} className={e.ok ? '' : 'rejected'}><td>{i + 1}</td><td>{e.scenario === 'tn5' ? 'Tn5' : 'Tn3'}</td><td>{e.name}{e.detail && <small>{e.detail}</small>}</td><td className={e.ok ? 'right' : 'wrong'}>{e.ok ? '✓' : '✗ refused'}</td><td>{e.outcome?.copies ?? '—'}</td><td>{e.outcome?.structures ?? '—'}</td><td>{e.text}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="sandbox-science"><p className="eyebrow">MODEL BOUNDARIES</p><h2>Explore freely. Read the evidence carefully.</h2><p>{scenario === 'tn5' ? 'Donor fragments remain unrepaired. One element remains overall; TIRs are internal, while the two 9 bp TSDs are host-derived.' : 'The cointegrate contains two directly oriented copies with internal res sites. Resolution retains two copies and target-side 5 bp TSDs. Products may remain catenated; decatenation is not calculated.'}</p><p className="quiet">Diagrams are not sequence maps, strand-level simulations or molecular kinetics. Only engine transitions change the molecules; the binding and cutting steps are teaching gestures. Target sites are symbolic placements and predict no insertion preference.</p></section>
  </main>;
}
