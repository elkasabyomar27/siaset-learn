import ConceptDiagram, {CellOwnershipDiagram} from '../../ui/ConceptDiagram.jsx';
import {useState} from 'react';
import {resistanceExample, bacterialTransition, targetingCompatible, predictionFeedback} from './engine/bacterial.js';
function Cells({state}) {
  return <CellOwnershipDiagram state={state}/>;
}
export default function BacterialExplorer({lesson,inspected=[],onInspect}) {
  const [index,setIndex]=useState(0);
  const [prediction,setPrediction]=useState('');
  const [result,setResult]=useState(null);
  const variant=lesson.variants[index];
  function investigate(){
    let model=null, note='Explanatory classification only; no molecular transition calculated.';
    if(Number.isInteger(variant.stage)){model=resistanceExample(variant.stage);note=variant.stage===0?'Calculated initial symbolic state.':'Calculated bounded states: Tn5 insertion and conjugation remain separate operations.';}
    if(variant.activity==='blocked'){
      const s=resistanceExample(1).state;s.transfer.conjugative=false;
      try{bacterialTransition(s,'conjugate');}catch(e){note=`Calculated gate rejection: ${e.message}. State unchanged.`;model={state:s,events:[]};}
    }
    if(['tnsd','tnse','mismatch'].includes(variant.activity)){
      const compatible=targetingCompatible(variant.activity==='tnsd'?'tnsd':'tnse',variant.activity==='tnse'?'replication-transfer':'attTn7-glmS');
      note=`Context compatibility: ${compatible?'supported':'unsupported'}. No insertion state, coordinate or probability calculated.`;
    }
    const feedback=predictionFeedback(variant.outcome,prediction,variant.explanation);
    setResult({model,note,...feedback});if(feedback.correct)onInspect(index);
  }
  return <section className="lesson-section"><p className="eyebrow">03 / BACTERIAL DNA AND TRANSFER EXPLORER</p><h2>Inspect the system, then predict</h2><div className="exploration-tabs" role="group" aria-label="Bacterial scientific scenarios">{lesson.variants.map((v,i)=><button key={v.label} className="outline-button" aria-pressed={i===index} onClick={()=>{setIndex(i);setPrediction('');setResult(null);}}>{v.label}{inspected.includes(i)?' ✓':''}</button>)}</div>{Number.isInteger(variant.stage)&&<Cells state={resistanceExample(Math.max(0,variant.stage-1)).state}/>}<ConceptDiagram title={variant.label} blocks={variant.blocks}/><p><b>Defined context:</b> {variant.explanation}</p><label>Predict or classify this scenario<select value={prediction} onChange={e=>{setPrediction(e.target.value);setResult(null);}}><option value="">Choose a supported interpretation</option>{[...new Set(lesson.variants.map(v=>v.outcome))].map(o=><option key={o}>{o}</option>)}</select></label><button className="primary-button" disabled={!prediction} onClick={investigate}>Test reasoning</button>{result&&<><p role="status" className={`feedback ${result.correct?'good':''}`}>{result.text}</p><p>{result.note}</p>{result.model&&<><h3>Calculated cell ownership</h3><Cells state={result.model.state}/><ol>{result.model.events.map((e,i)=><li key={i}>{e.type}: {e.from} → {e.to}; {e.scope}</li>)}</ol><p className="quiet">Chromosomes are retained symbolic identity markers, not simulated whole bacterial genomes. Completed conjugation copies the plasmid into the recipient while retaining the donor copy. Gene acquisition does not establish phenotypic resistance.</p></>}</>}<p className="quiet">Correctly classify every context, then answer the applied question and both checks. No clinical outcome or transfer efficiency is predicted.</p></section>;
}
