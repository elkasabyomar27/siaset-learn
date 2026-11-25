import LabEvidence from './components/LabEvidence.jsx';
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';
import { experimentFromParams, selectExperiment } from './experimentRouting.js';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import references from './profiles/references.json';
import profiles from './profiles/mechanisms.json';
import { copies } from './engine/model.js';
import { guidedStages } from './learning.js';
import Checkpoint from './components/Checkpoint.jsx';
import MoleculeView from './components/MoleculeView.jsx';
import { WhatChanged } from '../../ui/ExperimentBench.jsx';
import { Tn5Scene, Tn3Scene } from './components/StoryScenes.jsx';
import { STORY, newStory, storyAction, boundaryFromAngle, isComplete } from './storyLab.js';
import './components/storyLab.css';

// Topics 6 and 7: hands-on story labs. Molecular changes come from the engine; progress maps onto
// the original guided stages, so recorded completion evidence keeps the same contract.
export default function Laboratory() {
  const [params, setParams] = useSearchParams();
  const scenario = experimentFromParams(params);
  function changeScenario(value) {
    if (value !== scenario) setParams(current => selectExperiment(current, value));
  }
  return <StoryLab key={scenario} scenario={scenario} changeScenario={changeScenario} />;
}

function StoryLab({ scenario, changeScenario }) {
  const [s, setS] = useState(() => newStory(scenario));
  const [site, setSite] = useState(80);
  const [saved, setSaved] = useState(null);
  const steps = STORY[scenario], step = steps[s.stage], guided = guidedStages[scenario][s.stage];
  const activeProfile = profiles.find(p => p.id === scenario);
  const referenceIds = scenario === 'tn3' ? [...activeProfile.references, ...profiles.find(p => p.id === 'tn3-resolution').references] : activeProfile.references;
  const activeRefs = references.filter(r => referenceIds.includes(r.id));
  const dispatch = action => setS(prev => storyAction(prev, action.angle === undefined ? action : {...action, boundary: boundaryFromAngle(action.angle)}));
  const state = s.history.state;

  function save() {
    setSaved(progressRepository.recordLab(s.history, s.stage, s.answers)
      ? {ok: true, text: 'Lab saved. It now counts towards your progress.'}
      : {ok: false, text: 'Not saved to browser storage. Your result stays on this page until you leave or reload.'});
  }

  return <main className="laboratory hands-on-lab story-lab">
    <header className="bench-header"><div><p className="eyebrow">SIASET / HANDS-ON LAB · TOPIC {scenario === 'tn5' ? '06' : '07'}</p><h1>{scenario === 'tn5' ? 'Cut and paste a transposon.' : 'Copy, join, then separate.'}</h1><p>{scenario === 'tn5' ? 'Do each step yourself: hold the ends, cut, carry and insert Tn5.' : 'Join two circles through Tn3, copy it, then separate the circles with TnpR.'}</p></div></header>
    <div className="bench-switcher" role="group" aria-label="Choose experiment"><button aria-pressed={scenario === 'tn5'} onClick={() => changeScenario('tn5')}><span>06</span><b>Tn5</b><small>Conservative / cut and paste</small></button><button aria-pressed={scenario === 'tn3'} onClick={() => changeScenario('tn3')}><span>07</span><b>Tn3</b><small>Replicative / copy and join</small></button><Link to="/lab/transposable-elements/sandbox">Open the sandbox →</Link></div>
    <PersistenceStatus />

    <ol className="sl-steps" aria-label="Lab steps">{steps.map((x, i) => <li key={x.title} className={i === s.stage ? 'current' : i < s.stage ? 'done' : ''} aria-current={i === s.stage ? 'step' : undefined}><span>{i < s.stage ? '✓' : i + 1}</span>{x.title}</li>)}</ol>

    <section className="sl-stage-wrap" aria-label="Hands-on scene">
      <div className="sl-vitals"><span>ELEMENT COPIES <b>{copies(state).length}</b></span><span>DNA MOLECULES <b>{state.molecules.length}</b></span><span>STATE <b>{state.phase === 'initial' ? 'Separate DNA' : state.phase === 'inserted' ? 'Inserted' : state.phase === 'cointegrate' ? 'Cointegrate' : 'Resolved'}</b></span></div>
      {scenario === 'tn5' ? <Tn5Scene s={s} dispatch={dispatch} /> : <Tn3Scene s={s} dispatch={dispatch} />}
      <p className="sl-scene-note">Schematic scene: not to scale, no sequence. Molecular results are calculated by the lab engine.</p>
    </section>

    <section className="sl-task" aria-live="polite">
      <p className="eyebrow">STEP {s.stage + 1} OF {steps.length}{guided.explanatory ? ' · EXPLANATORY' : ''}</p>
      <h2>{step.title}</h2><p>{step.task}</p>
      {guided.checkpoint && !(guided.checkpoint === 'tn3' && s.stage > 1) && <Checkpoint id={guided.checkpoint} answer={s.answers[guided.checkpoint]} onAnswer={value => dispatch({type: 'answer', checkpoint: guided.checkpoint, value})} />}
      <div className="sl-actions">
        {/* Tn5 is done entirely in the scene. Tn3's controls stay until its scene moves onto the kit. */}
        {scenario === 'tn3' && s.stage === 0 && <><label className="sl-site">Ring position <input type="range" min="0" max="359" value={site} onChange={e => setSite(Number(e.target.value))} /><b>{boundaryFromAngle(site)}</b></label>
          <button type="button" className="primary-button" onClick={() => dispatch({type: 'dock-target', angle: site})}>Join target here →</button><small className="sl-or">or tap the ring in the scene</small></>}
        {scenario === 'tn3' && s.stage === 2 && <button type="button" className="primary-button" onClick={() => dispatch({type: 'replicate'})}>Start replication →</button>}
        {scenario === 'tn3' && s.stage === 3 && ['copy-1', 'copy-2'].map(id => <button key={id} type="button" className="outline-button" disabled={s.inspected.includes(id)} onClick={() => dispatch({type: 'inspect', feature: id})}>{s.inspected.includes(id) ? '✓ ' : ''}Tn3 {id === 'copy-1' ? 'copy 1' : 'copy 2'}</button>)}
        {scenario === 'tn3' && s.stage === 4 && <><button type="button" className="outline-button" aria-pressed={s.tnpR} onClick={() => dispatch({type: 'enzyme', available: !s.tnpR})}>{s.tnpR ? '✓ TnpR docked on res' : 'Dock TnpR on res'}</button><button type="button" className="primary-button" onClick={() => dispatch({type: 'resolve'})}>Resolve →</button></>}
        {isComplete(s) && <button type="button" className="primary-button" onClick={save}>Save completed lab</button>}
        <button type="button" className="account-text-button sl-restart" onClick={() => { setS(newStory(scenario)); setSaved(null); }}>Restart lab</button>
      </div>
      {/* Tn5 shows the model's message in the scene's next-step line instead. */}
      {s.message && scenario !== 'tn5' && <div className={`sl-message${s.message.ok ? ' is-good' : ''}`} role="status">{s.message.text}</div>}
      {saved && <div className={`sl-message${saved.ok ? ' is-good' : ''}`} role="status">{saved.text}</div>}
      <WhatChanged change={s.change} onDismiss={() => setS(prev => ({...prev, change: null}))} />
    </section>

    <details className="sl-engine" open={s.history.events.length > 0}><summary>Engine view: the calculated molecules</summary>
      <div className="molecule-grid bench-molecules">{state.molecules.map(m => <MoleculeView key={`${m.id}-${state.revision}`} molecule={m} compact highlight={s.change?.highlight?.[m.id]} />)}</div>
    </details>

    {isComplete(s) && <section className="panel lesson-section learning-transitions" aria-label="Continue learning"><h2>Continue your learning pathway</h2><p>Save the lab above to record it. Following a link does not record completion.</p><div className="feature-actions"><Link className="outline-button" to={scenario === 'tn5' ? '/lab/transposable-elements?experiment=tn3' : '/learn/transposable-elements/insertion-sequences'}>{scenario === 'tn5' ? 'Next: Tn3 copy-and-join lab' : 'Next: Insertion Sequences'}</Link><Link className="outline-button" to="/learn/transposable-elements/progress">Review your progress</Link></div></section>}
    <LabEvidence scenario={scenario} activeProfile={activeProfile} activeRefs={activeRefs} /><Link className="foundations-link" to="/learn/transposable-elements">Study the foundational lessons ↗</Link>
  </main>;
}
