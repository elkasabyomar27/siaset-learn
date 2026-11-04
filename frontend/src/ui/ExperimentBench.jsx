import { useRef, useState } from 'react';
import MoleculeView from '../features/transposable-elements/components/MoleculeView.jsx';

export function EnzymeDock({ available, onChange }) {
  const [over, setOver] = useState(false);
  const slot = useRef(null);
  const held = useRef(false);
  const origin = useRef({x:0,y:0});
  const [offset,setOffset] = useState({x:0,y:0});
  function insideSlot(e) {
    const rect=slot.current?.getBoundingClientRect();
    return !!rect && e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom;
  }
  return <section className={`enzyme-dock ${available?'is-docked':''} ${over?'is-over':''}`}>
    <div className="dock-title"><span>RESOLUTION ENZYME</span><b>{available?'TnpR available':'TnpR unavailable'}</b></div>
    <div className="dock-interaction"><div className="enzyme-token" style={{transform:`translate(${offset.x}px,${offset.y}px)`,zIndex:offset.x||offset.y?2:0}} onPointerDown={e=>{e.preventDefault();held.current=true;origin.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(held.current){setOver(insideSlot(e));setOffset({x:e.clientX-origin.current.x,y:e.clientY-origin.current.y});}}} onPointerUp={e=>{if(held.current&&insideSlot(e))onChange(true);held.current=false;setOver(false);setOffset({x:0,y:0});}} onPointerCancel={()=>{held.current=false;setOver(false);setOffset({x:0,y:0});}} aria-label="Draggable TnpR token"><span aria-hidden="true">✣</span> TnpR<small>drag to dock →</small></div>
      <div className="enzyme-slot" ref={slot}><span aria-hidden="true">{available?'✣':'+'}</span>{available?'Docked':'Drop TnpR here'}</div></div>
    <label><input type="checkbox" checked={available} onChange={e=>onChange(e.target.checked)}/> TnpR resolvase available</label><small>Drag to dock, or use the switch. This sets enzyme availability; it does not calculate resolution.</small>
  </section>;
}

// Plain-language summary of the latest calculated event, shown where the learner's attention already is.
export function WhatChanged({ change, onDismiss }) {
  if (!change) return null;
  function show() {
    const target = document.querySelector('.bench-molecules');
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  }
  return <section className="what-changed" role="status" aria-live="polite"><div className="what-changed-head"><span aria-hidden="true">✦</span><div><p className="eyebrow">WHAT JUST CHANGED</p><h3>{change.headline}</h3></div>{onDismiss&&<button type="button" className="what-changed-close" onClick={onDismiss} aria-label="Dismiss summary">×</button>}</div>
    <ul>{change.items.map(item=><li key={item.kind+item.text} className={`change-${item.kind}`}>{item.text}</li>)}</ul>
    <button type="button" className="what-changed-show" onClick={show}>See it on the DNA ↓</button><small className="what-changed-hint">New features glow in the diagram.</small></section>;
}

export function EventScrubber({ history, onSeek }) {
  return <section className="event-scrubber" aria-label="Molecular event history"><div><b>Event time machine</b><span>{history.cursor} / {history.events.length} calculated events</span></div><label><span className="sr-only">Recorded molecular event</span><input type="range" min="0" max={history.events.length} step="1" value={history.cursor} disabled={!history.events.length} onChange={e=>onSeek(Number(e.target.value))}/></label><div className="event-ticks"><span>Initial molecules</span><span>{history.cursor ? history.events[history.cursor-1]?.type : 'No event applied'}</span></div><p>Scrub recorded states. Explanatory teaching stages are separate.</p></section>;
}

export default function ExperimentBench({ state, initial, compare, onCompare, referenceLabel='Initial molecules', selection, onSelect, targetBoundary, onBoundaryChange, supportedPositions, highlight, children }) {
  const [zoom,setZoom] = useState(1);
  const [view,setView] = useState('structure');
  return <section className="experiment-canvas" aria-label="Interactive DNA workbench">
    <div className="canvas-topline"><div><span className="bench-live-dot"/> STRUCTURAL OBSERVATORY</div><span>REV {String(state.revision).padStart(2,'0')} / {state.phase.toUpperCase()}</span></div>
    <div className="canvas-tools"><div><h2>Follow the DNA.</h2><p>{onBoundaryChange?view==='blueprint'?'Drag along the target coordinate map to place the boundary. Select a track to inspect its evidence.':'Drag the target ring to choose a site. Probe a DNA feature to see what it contains.':'Probe a feature. Compare structures. Revisit an event.'}</p></div><div className="lens-controls"><label>Lens <input aria-label="Diagram zoom" type="range" min="1" max="1.8" step="0.1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><output>{Math.round(zoom*100)}%</output></label><button onClick={()=>setZoom(1)} aria-label="Reset diagram zoom">Fit</button></div></div>
    <div className="canvas-view-switch" role="group" aria-label="Molecule view"><button aria-pressed={view==='structure'} onClick={()=>setView('structure')}>◎ Structure</button><button aria-pressed={view==='blueprint'} onClick={()=>setView('blueprint')}>☷ Feature blueprint</button><span>{view==='blueprint'?'Unfold the annotations. Trace what belongs inside the element.':'Explore topology and element placement.'}</span></div>
    <div className="canvas-legend legend"><span><i className="donor"/>Donor</span><span><i className="target"/>Target</span><span><i className="element"/>Element →</span><span><i className="tsd"/>Host TSD</span><span><i className="res"/>res</span><label><input type="checkbox" checked={compare} onChange={e=>onCompare(e.target.checked)}/> Evidence comparison</label></div>
    {compare && <div className="reference-drawer"><div className="reference-label">REFERENCE / {referenceLabel}</div><div className="molecule-grid">{initial.molecules.map(m=><MoleculeView key={m.id} molecule={m} compact/>)}</div><div className="reference-label">CURRENT CALCULATED STRUCTURE ↓</div></div>}
    <div className={`molecule-grid bench-molecules ${state.phase==='cointegrate'?'cointegrate-grid':''}`}>{state.molecules.map(m=><MoleculeView key={m.id} molecule={m} zoom={zoom} view={view} onSelect={onSelect} selected={selection?.moleculeId===m.id?selection.featureId:null} targetBoundary={targetBoundary} onBoundaryChange={m.id==='target'?onBoundaryChange:undefined} supportedPositions={supportedPositions} highlight={highlight?.[m.id]}/>)}</div>
    {onBoundaryChange && <div className="placement-console"><div><b>⌖ Place the insertion boundary</b><p>{supportedPositions?'The dial snaps to the four supported sandbox fixtures.':'The marker sets a symbolic target boundary; it does not predict insertion preference.'}</p></div><label><span>Target boundary</span>{supportedPositions?<select value={targetBoundary} onChange={e=>onBoundaryChange(Number(e.target.value))}>{supportedPositions.map(p=><option key={p} value={p}>{p}{p===895?' · origin-crossing':p===900?' ≡ 0':''}</option>)}</select>:<input type="number" min="0" max="900" step="1" value={targetBoundary} onChange={e=>onBoundaryChange(e.target.value===''?'':Number(e.target.value))}/>}</label><label className="placement-range"><span className="sr-only">Target placement slider</span><input type="range" min="0" max={supportedPositions?supportedPositions.length-1:900} step="1" value={supportedPositions?supportedPositions.indexOf(targetBoundary):targetBoundary} onChange={e=>onBoundaryChange(supportedPositions?supportedPositions[Number(e.target.value)]:Number(e.target.value))}/><span>0 <b>900 ≡ 0</b></span></label></div>}
    <p className="canvas-disclaimer">Symbolic structural model · not a sequence map or kinetic simulation. Small features are enlarged. Placement ring and lens are interface tools.</p>
    {children}
  </section>;
}
