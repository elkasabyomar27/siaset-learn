import LabEvidence from './components/LabEvidence.jsx';
import topics from './curriculum/topics.json' with { type: 'json' };
import { progressRepository } from './progressRepository.js';
import PersistenceStatus from './PersistenceStatus.jsx';
import { experimentFromParams, selectExperiment } from './experimentRouting.js';
import FeatureNav from './FeatureNav.jsx';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Curriculum from './Curriculum.jsx';
import references from './profiles/references.json';
import profiles from './profiles/mechanisms.json';
import { newHistory, execute, seek, reset, replay } from './engine/index.js';
import { copies } from './engine/model.js';
import LabInspector from './components/LabInspector.jsx';
import { guidedStages, stageForCursor, canAdvance, actionForStep } from './learning.js';
import ExperimentBench, { EnzymeDock, EventScrubber, WhatChanged } from '../../ui/ExperimentBench.jsx';
import { describeChange, friendlyError } from './labInsights.js';
import Checkpoint from './components/Checkpoint.jsx';
export default function Laboratory() {
  const [params, setParams] = useSearchParams();
  const scenario = experimentFromParams(params);
  function changeScenario(value) {
    if (value !== scenario) setParams(current => selectExperiment(current, value));
  }
  return <LaboratorySession key={scenario} scenario={scenario} changeScenario={changeScenario} />;
}
function LaboratorySession({
  scenario,
  changeScenario
}) {
  const [history, setHistory] = useState(() => newHistory(scenario));
  const [stage, setStage] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selection, setSelection] = useState(null);
  const [compare, setCompare] = useState(false);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [targetBoundary, setTargetBoundary] = useState(200);
  const [resolvase, setResolvase] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastChange, setLastChange] = useState(null);
  const steps = guidedStages[scenario];
  const step = steps[stage];
  const state = history.state;
  const selectedMolecule = state.molecules.find(m => m.id === selection?.moleculeId);
  const selectedFeature = selectedMolecule?.features.find(f => f.id === selection?.featureId);
  const activeProfile = profiles.find(p => p.id === scenario);
  const referenceIds = scenario === 'tn3' ? [...activeProfile.references, ...profiles.find(p => p.id === 'tn3-resolution').references] : activeProfile.references;
  const activeRefs = references.filter(r => referenceIds.includes(r.id));
  function advance() {
    try {
      if (!canAdvance(scenario, stage, answers)) return;
      let action = actionForStep(scenario, stage, targetBoundary);
      if (action?.type === 'tn3.resolve') action = {
        ...action,
        resolvaseAvailable: resolvase
      };
      if (action) {
        const next = execute(history, action);
        setHistory(next);
        setLastChange(describeChange(history.state, next.state));
      }
      setStage(stage + 1);
      setError('');
      setSelection(null);
      setNotice('');
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  function moveHistory(delta) {
    try {
      const h = seek(history, history.cursor + delta);
      setHistory(h);
      setStage(stageForCursor(scenario, h.cursor));
      setSelection(null);
      setLastChange(null);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  function startOver() {
    setHistory(reset(history));
    setStage(0);
    setAnswers({});
    setSelection(null);
    setResolvase(true);
    setLastChange(null);
    setError('');
    setNotice('Experiment reset to its initial molecular state.');
  }
  function verifyReplay() {
    try {
      const result = replay(history.initial, history.events.slice(0, history.cursor));
      setHistory({
        ...history,
        state: result
      });
      setNotice(`Replayed ${history.cursor} molecular event(s). State reconstruction matches the recorded result.`);
    } catch (e) {
      setError(e.message);
    }
  }
  const checkpointId = step.checkpoint;
  return <main className="laboratory hands-on-lab"><FeatureNav />
    <header className="bench-header"><div><p className="eyebrow">SIASET / GUIDED EXPERIMENT {scenario==='tn5'?'01':'02'}</p><h1>{scenario==='tn5'?'Move a transposon.':'Build a cointegrate.'}</h1><p>Touch the model. Follow the evidence. Understand the mechanism.</p></div><div className="bench-mode"><span>GUIDED WORKBENCH</span><button className="outline-button" onClick={()=>setShowCurriculum(!showCurriculum)} aria-expanded={showCurriculum}>Curriculum · {topics.length}</button></div></header>
    <div className="bench-switcher" role="group" aria-label="Choose experiment"><button aria-pressed={scenario==='tn5'} onClick={()=>changeScenario('tn5')}><span>01</span><b>Tn5</b><small>Conservative / move one copy</small></button><button aria-pressed={scenario==='tn3'} onClick={()=>changeScenario('tn3')}><span>02</span><b>Tn3</b><small>Replicative / follow two copies</small></button><Link to="/lab/transposable-elements/sandbox">Free exploration ↗</Link></div>
    <PersistenceStatus />{showCurriculum&&<Curriculum collapsible={false}/>}
    <div className="bench-layout">
      <aside className="mission-panel" aria-label="Guided experiment task">
        <div className="mission-count"><span>YOUR EXPERIMENT</span><b>{String(stage+1).padStart(2,'0')}<small> / {steps.length}</small></b></div>
        <progress aria-label="Teaching stage progress" value={stage+1} max={steps.length}/>
        <nav className="mission-steps" aria-label="Guided experiment steps">{steps.map((item,i)=><div key={item.id} className={i===stage?'current':i<stage?'done':''} aria-current={i===stage?'step':undefined}><span>{i<stage?'✓':i+1}</span><b>{item.title}</b></div>)}</nav>
        <section className="mission-task" key={step.id}><p className="eyebrow">{step.explanatory?'EXPLANATORY · NO MOLECULAR CHANGE':checkpointId?'MAKE YOUR PREDICTION':'OBSERVE & INVESTIGATE'}</p><h2>{step.title}</h2><p>{step.note}</p></section>
        {checkpointId&&<Checkpoint id={checkpointId} answer={answers[checkpointId]} onAnswer={value=>setAnswers({...answers,[checkpointId]:value})}/>}
        {step.enzymeGate&&<EnzymeDock available={resolvase} onChange={setResolvase}/>}
        {step.boundaryControl&&<div className="gesture-hint"><span>⌖</span><p><b>Your first move</b>Drag the glowing outer ring around the target DNA. The boundary readout updates as you move.</p></div>}
        <WhatChanged change={lastChange} onDismiss={()=>setLastChange(null)}/>{error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
        {step.final?<div className="explicit-completion"><p>Review complete. Save your evidence explicitly.</p><button className="primary-button" onClick={()=>setNotice(progressRepository.recordLab(history,stage,answers)?'Guided review saved in this browser.':'Review not saved to browser storage. Valid evidence remains temporary while the page is loaded; reloading or closing can lose it.')}>Record completed guided review</button></div>:<><button className="primary-button mission-advance" disabled={!canAdvance(scenario,stage,answers)} onClick={advance}>{step.actionLabel||'Continue investigation'} <span>→</span></button>{checkpointId&&!canAdvance(scenario,stage,answers)&&<p className="advance-hint">Make a correct prediction to unlock the next step.</p>}</>}
      </aside>
      <div className="bench-center">
        <section className="bench-vitals" aria-label="Molecular state summary"><div><span>ELEMENT COPIES</span><strong>{String(copies(state).length).padStart(2,'0')}</strong><small>{scenario==='tn5'?'conserved overall':'total across structures'}</small></div><div><span>MOLECULAR STATE</span><strong>{state.phase==='initial'?'Separate DNA':state.phase==='cointegrate'?'Cointegrate':state.phase==='resolved'?'Resolved products':'Target insertion'}</strong></div><div><span>HOST-DERIVED TSD</span><strong>{scenario==='tn5'?9:5}<small> bp</small></strong><small>{state.phase==='initial'?'expected after insertion':'target-site duplication'}</small></div></section>
        <ExperimentBench state={state} initial={history.initial} compare={compare} onCompare={setCompare} selection={selection} onSelect={setSelection} targetBoundary={targetBoundary} onBoundaryChange={step.boundaryControl?setTargetBoundary:undefined} highlight={lastChange?.highlight}/>
        {state.phase==='resolved'&&<p className="topology-warning">{state.topologyNote}</p>}
        <EventScrubber history={history} onSeek={cursor=>moveHistory(cursor-history.cursor)}/>
        <div className="bench-history-actions"><button disabled={history.cursor===0} onClick={()=>moveHistory(-1)} aria-label="Undo molecular event">↶ Undo</button><button disabled={history.cursor===history.events.length} onClick={()=>moveHistory(1)} aria-label="Redo molecular event">↷ Redo</button><button onClick={verifyReplay}>↻ Replay recorded events</button><button onClick={startOver}>Reset experiment</button></div>
        <LabInspector selectedFeature={selectedFeature} selectedMolecule={selectedMolecule} history={history} scenario={scenario}/>
      </div>
    </div>
    {step.final&&<section className="panel lesson-section learning-transitions" aria-label="Continue learning"><h2>Continue your learning pathway</h2><p>Use “Record completed guided review” above to record this review before moving on. Following a link does not record completion.</p><div className="feature-actions"><Link className="outline-button" to={scenario==='tn5'?'/lab/transposable-elements?experiment=tn3':'/learn/transposable-elements/insertion-sequences'}>{scenario==='tn5'?'Next: Tn3 replicative laboratory':'Next: Insertion Sequences'}</Link><Link className="outline-button" to="/learn/transposable-elements/progress">Review your progress</Link></div></section>}
    <LabEvidence scenario={scenario} activeProfile={activeProfile} activeRefs={activeRefs}/><Link className="foundations-link" to="/learn/transposable-elements">Study the foundational lessons ↗</Link><footer className="lab-footer"><span>SIASET LEARN / TRANSPOSABLE ELEMENTS</span><span>SCIENTIFIC MODEL v1 · PHASES 1–3</span></footer>
  </main>;
}
