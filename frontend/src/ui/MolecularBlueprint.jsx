import { useRef } from 'react';
import { studentLabels } from '../features/transposable-elements/engine/contracts.js';

// A coordinate map of the existing feature objects; circular molecules are opened at origin 0.
export default function MolecularBlueprint({ molecule:m, onSelect, selected, zoom, targetBoundary, onBoundaryChange }) {
  const dragging = useRef(false);
  function place(e) {
    const rect=e.currentTarget.getBoundingClientRect();
    onBoundaryChange(Math.max(0,Math.min(m.length,Math.round((e.clientX-rect.left)/rect.width*m.length))));
  }
  return <section className="molecule-card blueprint-card"><div className="molecule-card-title"><h3>{m.name}</h3><span>COORDINATE MAP</span></div>
    <p className="blueprint-note">{m.topology==='circular'?'Circular molecule opened at origin 0.':'Linear molecule.'} {m.length.toLocaleString()} symbolic units.</p>
    <div className="blueprint-scroll"><div className="blueprint-sheet" style={{minWidth:`${zoom*100}%`}}>
      <div className="blueprint-ruler"><span>0</span><span>{Math.round(m.length/2)}</span><span>{m.length}</span></div>
      {onBoundaryChange&&<div className="blueprint-placement" aria-label="Drag to place the target boundary on the coordinate map" onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);place(e);}} onPointerMove={e=>{if(dragging.current)place(e);}} onPointerUp={()=>{dragging.current=false;}} onPointerCancel={()=>{dragging.current=false;}}><span style={{left:`${Number(targetBoundary||0)/m.length*100}%`}}>⌖<small>{targetBoundary}</small></span><p>DRAG TO POSITION</p></div>}
      {m.features.map(f=><button key={f.id} className={`blueprint-row ${f.kind.toLowerCase()} ${selected===f.id?'is-selected':''}`} style={{'--blueprint-color':`var(--scientific-${f.kind==='backbone'?(m.blocks.find(b=>b.id===f.id)?.sourceId||'gene'):f.kind.toLowerCase()})`}} disabled={!onSelect} aria-pressed={onSelect?selected===f.id:undefined} onClick={()=>onSelect?.({moleculeId:m.id,featureId:f.id})} title={`${f.label}: ${studentLabels(f.segments)} symbolic units`}><span className="blueprint-label"><b>{f.parentId?'↳ ':''}{f.label}</b><small>{studentLabels(f.segments)} · {f.orientation===1?'→':'←'}</small></span><span className="blueprint-lane">{f.segments.map(([a,z],i)=><i key={i} style={{left:`${a/m.length*100}%`,width:`${(z-a)/m.length*100}%`}}/>)}</span></button>)}
    </div></div><p className="blueprint-note">Select a track to inspect its evidence. Rows separate annotations; they do not represent individual DNA strands.</p>
  </section>;
}
