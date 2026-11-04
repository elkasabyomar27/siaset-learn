import {newSandbox,runSandbox,sandboxPositions} from './sandboxSession.js';
import {useState} from 'react';
import {seek,reset,replay} from './engine/index.js';
import {copies} from './engine/model.js';
import Checkpoint from './components/Checkpoint.jsx';
import {checkpoints} from './learning.js';
import FeatureNav from './FeatureNav.jsx';
import LabInspector from './components/LabInspector.jsx';
import ExperimentBench, { EnzymeDock, EventScrubber, WhatChanged } from '../../ui/ExperimentBench.jsx';
import {describeChange, friendlyError, notebookEntry, INVESTIGATIONS} from './labInsights.js';

const actionFor=(scenario,phase)=>phase==='initial'?(scenario==='tn5'?'tn5.transpose':'tn3.replicate'):'tn3.resolve';
const trim=text=>text.replace(/\.$/,'');
const mechanismName={'tn5.transpose':'Tn5 transposition','tn3.replicate':'Tn3 cointegrate','tn3.resolve':'Tn3 resolution'};

export default function Sandbox(){
 const [history,setHistory]=useState(()=>newSandbox('tn5'));
 const [position,setPosition]=useState(200),[answer,setAnswer]=useState(undefined),[resolution,setResolution]=useState(undefined);
 const [tnpR,setTnpR]=useState(false),[compare,setCompare]=useState(false),[selection,setSelection]=useState(null),[message,setMessage]=useState('');
 const [comparison,setComparison]=useState('initial');
 const [lastChange,setLastChange]=useState(null),[verdict,setVerdict]=useState(null);
 const [notebook,setNotebook]=useState([]);
 const state=history.state,scenario=state.scenario;
 const comparisonState=comparison==='previous'&&history.cursor>0?seek(history,history.cursor-1).state:history.initial;
 const selectedMolecule=state.molecules.find(m=>m.id===selection?.moleculeId),feature=selectedMolecule?.features.find(f=>f.id===selection?.featureId);
 const checkpointId=state.phase==='initial'?scenario:'resolution';
 const prediction=state.phase==='initial'?answer:resolution;
 const allowed=state.phase==='initial'||scenario==='tn3'&&state.phase==='cointegrate';
 const doneIds=new Set(INVESTIGATIONS.filter(i=>i.done(notebook)).map(i=>i.id));

 function run(){
  const action=actionFor(scenario,state.phase),q=checkpoints[checkpointId];
  const base={scenario,action,boundary:position,tnpR,prediction:q.options[prediction],predictionCorrect:prediction===q.correct,before:state};
  try{
   const next=runSandbox(history,position,tnpR);
   setHistory(next);setSelection(null);setMessage('');
   setLastChange(describeChange(state,next.state));
   setVerdict({correct:prediction===q.correct,choice:q.options[prediction],answer:q.options[q.correct],explanation:q.explanation});
   setNotebook(log=>[...log,notebookEntry({...base,after:next.state})]);
  }catch(e){
   setMessage(friendlyError(e));setVerdict(null);
   setNotebook(log=>[...log,notebookEntry({...base,error:e})]);
  }
 }
 function historyAction(action){try{setHistory(action());setSelection(null);setLastChange(null);setVerdict(null);setMessage('History reconstructed from recorded molecular events.');}catch(e){setMessage(friendlyError(e));}}
 function fresh(value=scenario,note='New experiment. Your notebook is kept.'){setHistory(newSandbox(value));setAnswer(undefined);setResolution(undefined);setSelection(null);setLastChange(null);setVerdict(null);setTnpR(false);setMessage(note);}
 function changeScenario(value){if(value!==scenario)fresh(value,'New independent sandbox session. Your notebook is kept.');}

 return <main className="laboratory hands-on-lab sandbox-bench"><FeatureNav/>
 <header className="bench-header"><div><p className="eyebrow">SIASET / FREE EXPLORATION</p><h1>Your DNA playground.</h1><p>Predict. Run the experiment. Find out if you were right.</p></div><div className="bench-mode"><span>MOLECULAR SANDBOX</span><small>Independent, in-memory session</small></div></header>
 <div className="bench-switcher" role="group" aria-label="Mechanism preset"><button aria-pressed={scenario==='tn5'} onClick={()=>changeScenario('tn5')}><span>01</span><b>Tn5</b><small>Conservative / move one copy</small></button><button aria-pressed={scenario==='tn3'} onClick={()=>changeScenario('tn3')}><span>02</span><b>Tn3</b><small>Replicative / follow two copies</small></button></div>
 <p className="sandbox-independence">Independent session. Sandbox actions never complete a guided topic. Only the selected Tn5 and Tn3 fixtures are supported.</p>
 <div className="bench-layout"><aside className="mission-panel" aria-label="Sandbox experiment controls">
 <div className="mission-count"><span>EXPERIMENT DESIGN</span><b>⌖</b></div><section className="mission-task"><p className="eyebrow">{state.phase==='initial'?'01 / SET UP YOUR EXPERIMENT':state.phase==='cointegrate'?'02 / TEST RESOLUTION':'03 / INVESTIGATE THE EVIDENCE'}</p><h2>{state.phase==='initial'?'Where will it land?':state.phase==='cointegrate'?'Can it resolve?':'What changed?'}</h2><p>{state.phase==='initial'?'Drag the outer target ring to pick a site (try 895, across the origin). Make a prediction, then run it.':state.phase==='cointegrate'?'Predict the products. Dock TnpR, or leave it out and see what the engine does.':'Inspect the host-derived repeats, compare with the reference, or start a new experiment.'}</p></section>
 {allowed&&<Checkpoint id={checkpointId} answer={prediction} onAnswer={state.phase==='initial'?setAnswer:setResolution} reveal={false}/>}
 {scenario==='tn3'&&state.phase==='cointegrate'&&<EnzymeDock available={tnpR} onChange={setTnpR}/>}
 {allowed?<button className="primary-button mission-advance" disabled={prediction===undefined} onClick={run}>{state.phase==='initial'?(scenario==='tn5'?'Run Tn5 transposition':'Form Tn3 cointegrate'):'Resolve cointegrate'} <span>→</span></button>
  :<button className="primary-button mission-advance" onClick={()=>fresh()}>Start a new experiment <span>↺</span></button>}
 {allowed&&prediction===undefined&&<p className="advance-hint">Choose a prediction to unlock the run. Any prediction works; you will find out if it was right.</p>}
 {verdict&&<section className={`prediction-verdict ${verdict.correct?'is-right':'is-wrong'}`} role="status"><b>{verdict.correct?'✓ Your prediction matched.':'✗ Not what you predicted.'}</b><p>You predicted: “{trim(verdict.choice)}”</p>{!verdict.correct&&<p>The engine produced: “{trim(verdict.answer)}”</p>}<p>{verdict.explanation}</p></section>}
 <WhatChanged change={lastChange} onDismiss={()=>setLastChange(null)}/>
 {message&&<p role="status" className={message.startsWith('Nothing')?'error':'notice'}>{message}</p>}
 <section className="investigations" aria-label="Investigations"><div className="investigations-head"><p className="eyebrow">INVESTIGATIONS</p><b>{doneIds.size} / {INVESTIGATIONS.length}</b></div><ul>{INVESTIGATIONS.map(i=><li key={i.id} className={doneIds.has(i.id)?'done':''}><span aria-hidden="true">{doneIds.has(i.id)?'✓':'○'}</span>{i.title}<span className="sr-only">{doneIds.has(i.id)?' (done)':' (not yet)'}</span></li>)}</ul></section>
 <div className="reference-control"><label>Comparison reference<select value={comparison} onChange={e=>setComparison(e.target.value)}><option value="initial">Initial molecules</option><option value="previous">Before latest event (cointegrate before resolution)</option></select></label><p>Turn on Evidence comparison in the workbench.</p></div>
 </aside><div className="bench-center">
 <section className="bench-vitals" aria-label="Molecular state summary"><div><span>ELEMENT COPIES</span><strong>{String(copies(state).length).padStart(2,'0')}</strong><small>total across structures</small></div><div><span>MOLECULAR STATE</span><strong>{state.phase==='initial'?'Separate DNA':state.phase==='cointegrate'?'Cointegrate':state.phase==='resolved'?'Resolved products':'Target insertion'}</strong></div><div><span>HOST-DERIVED TSD</span><strong>{scenario==='tn5'?9:5}<small> bp</small></strong><small>{state.phase==='initial'?'expected after insertion':'target-site duplication'}</small></div></section>
 <ExperimentBench state={state} initial={comparisonState} referenceLabel={comparison==='previous'&&history.cursor>0?'Before latest event':'Initial molecules'} compare={compare} onCompare={setCompare} selection={selection} onSelect={setSelection} targetBoundary={position} onBoundaryChange={state.phase==='initial'?setPosition:undefined} supportedPositions={sandboxPositions} highlight={lastChange?.highlight}/>
 <EventScrubber history={history} onSeek={cursor=>historyAction(()=>seek(history,cursor))}/>
 <div className="bench-history-actions"><button disabled={!history.cursor} onClick={()=>historyAction(()=>seek(history,history.cursor-1))}>↶ Undo</button><button disabled={history.cursor===history.events.length} onClick={()=>historyAction(()=>seek(history,history.cursor+1))}>↷ Redo</button><button onClick={()=>historyAction(()=>({...history,state:replay(history.initial,history.events.slice(0,history.cursor))}))}>↻ Replay recorded events</button><button onClick={()=>{setHistory(reset(history));setAnswer(undefined);setResolution(undefined);setSelection(null);setLastChange(null);setVerdict(null);setMessage('Only this sandbox session was reset. Your notebook is kept.');}}>Reset sandbox session</button></div>
 <section className="lab-notebook" aria-label="Experiment notebook"><div className="lab-notebook-head"><div><p className="eyebrow">EXPERIMENT NOTEBOOK</p><h2>Compare your runs.</h2></div>{notebook.length>0&&<button type="button" className="outline-button" onClick={()=>setNotebook([])}>Clear notebook</button>}</div>
  {notebook.length===0?<p className="quiet">Every run is recorded here so you can compare mechanisms, sites and predictions. Kept until you leave this page.</p>
  :<div className="lab-notebook-scroll"><table><thead><tr><th scope="col">#</th><th scope="col">Experiment</th><th scope="col">Site</th><th scope="col">Prediction</th><th scope="col">Copies</th><th scope="col">Molecules</th><th scope="col">Repeats</th><th scope="col">Result</th></tr></thead><tbody>{notebook.map((e,i)=><tr key={i} className={e.ok?'':'rejected'}><td>{i+1}</td><td>{mechanismName[e.action]}{e.tnpR!==null&&<small>{e.tnpR?' · TnpR docked':' · no TnpR'}</small>}</td><td>{e.boundary??'—'}</td>{e.ok?<td className={e.predictionCorrect?'right':'wrong'}>{e.predictionCorrect?'✓':'✗'} <small>{e.prediction}</small></td>:<td>— <small>not tested (no run)</small></td>}<td>{e.outcome.copies}</td><td>{e.outcome.structures}</td><td>{e.outcome.tsdCount?`${e.outcome.tsdCount} × ${e.outcome.tsdBp} bp`:'—'}</td><td>{e.note}</td></tr>)}</tbody></table></div>}
 </section>
 <LabInspector selectedFeature={feature} selectedMolecule={selectedMolecule} history={history} scenario={scenario}/>
 <details className="event-provenance"><summary>Calculated event provenance · {history.cursor} events</summary><ol>{history.events.slice(0,history.cursor).map(e=><li key={e.id}>{e.explanation}<p className="quiet">{e.id} · {e.references.join(', ')} · revision {e.fromRevision} → {e.toRevision}</p></li>)}</ol></details>
 </div></div>
 <section className="sandbox-science"><p className="eyebrow">MODEL BOUNDARIES</p><h2>Explore freely. Read the evidence carefully.</h2><p>{scenario==='tn5'?'Donor fragments remain unrepaired. One element remains overall; TIRs are internal, while the two 9 bp TSDs are host-derived.':'The cointegrate contains two directly oriented copies with internal res sites. Resolution retains two copies and target-side 5 bp TSDs. Products may remain catenated; decatenation is not calculated.'}</p><p className="quiet">Tn5 terminal labels denote recognition regions; the 19 bp recognition region is not a perfect 19 bp inverted repeat. Tn3 uses the selected intact E. coli interplasmid cointegrate pathway, not an obligatory pathway for every Tn3 event. Diagrams are not sequence maps, strand-level simulations or molecular kinetics. Only engine transitions enter the event log. Internal boundaries are zero-based. Feature labels are one-based inclusive symbolic units; these choices predict no insertion preference.</p></section>
 </main>;
}
