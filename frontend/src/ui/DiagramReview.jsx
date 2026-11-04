import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import ConceptDiagram, {CellOwnershipDiagram} from './ConceptDiagram.jsx';
import {lessons} from '../features/transposable-elements/curriculum/lessons.js';
import topics from '../features/transposable-elements/curriculum/topics.json';
import {resistanceExample} from '../features/transposable-elements/engine/bacterial.js';
import './diagram-review.css';

function DiagramReview(){
  const [lessonId,setLessonId]=useState('introduction'),[index,setIndex]=useState(0);
  const lesson=lessons.find(item=>item.id===lessonId),variant=lesson.variants[index];
  return <main className="diagram-review"><header><p>SIASET / LESSON FIGURES</p><h1>A lighter way to read a model.</h1><span>Design preview · original lesson labels · no learning records are written</span></header><section className="diagram-review-controls"><label>Preview a lesson<select value={lessonId} onChange={event=>{setLessonId(event.target.value);setIndex(0);}}>{lessons.map(item=><option key={item.id} value={item.id}>{topics.find(topic=>topic.id===item.id)?.title||item.id}</option>)}</select></label><div role="group" aria-label="Preview scenario">{lesson.variants.map((item,i)=><button key={i} aria-pressed={i===index} onClick={()=>setIndex(i)}>{item.label}</button>)}</div></section><ConceptDiagram title={variant.label} blocks={variant.blocks}/><p className="diagram-review-context">{variant.explanation}</p>{lesson.id==='bacterial-hgt'&&Number.isInteger(variant.stage)&&<CellOwnershipDiagram state={resistanceExample(Math.max(0,variant.stage-1)).state}/>}<aside className="diagram-review-status"><b>Ready for the lesson pages</b><p>This preview uses the existing lesson data. Applying the new renderer to the lessons needs the narrow protected-component exception described in the review.</p></aside></main>;
}
createRoot(document.getElementById('diagram-review-root')).render(<DiagramReview/>);
