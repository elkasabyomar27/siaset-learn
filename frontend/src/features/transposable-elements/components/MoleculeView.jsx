import { useRef, useState } from 'react';
import { studentLabels } from '../engine/contracts.js';
import MolecularBlueprint from '../../../ui/MolecularBlueprint.jsx';
const colors={donor:'var(--scientific-donor)',target:'var(--scientific-target)',element:'var(--scientific-element)',tsd:'var(--scientific-tsd)',res:'var(--scientific-res)',TIR:'var(--scientific-tir)',gene:'var(--scientific-gene)'};
function point(cx,cy,r,angle){const a=(angle-90)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];}
function arc(start,end,r=69){const [x,y]=point(120,100,r,start),[xx,yy]=point(120,100,r,end);return `M ${x} ${y} A ${r} ${r} 0 ${end-start>180?1:0} 1 ${xx} ${yy}`;}
export default function MoleculeView({molecule:m,onSelect,selected,compact=false,zoom=1,targetBoundary,onBoundaryChange,supportedPositions,view='structure',highlight=[]}) {
 const [hovered,setHovered]=useState(null),dragging=useRef(false);
 const circular=m.topology==='circular',placement=circular&&typeof onBoundaryChange==='function';
 const inspected=m.features.find(f=>f.id===(hovered||selected));
 const choose=f=>onSelect?.({moleculeId:m.id,featureId:f.id});
 const interactive=f=>typeof onSelect!=='function'?{}:({role:'button',tabIndex:0,'aria-label':`${f.label}, ${studentLabels(f.segments)}, schematic units`,'aria-pressed':selected===f.id,onClick:()=>choose(f),onPointerEnter:()=>setHovered(f.id),onPointerLeave:()=>setHovered(null),onKeyDown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(f);}}});
 const featureColor=f=>f.kind==='backbone'?colors[m.blocks.find(b=>b.id===f.id)?.sourceId]:colors[f.kind]||colors.gene;
 function placeFromPointer(e){
  const matrix=e.currentTarget.ownerSVGElement.getScreenCTM();if(!matrix)return;
  const local=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  const angle=(Math.atan2(local.y-100,local.x-120)*180/Math.PI+450)%360;
  const boundary=Math.round(angle/360*m.length);
  onBoundaryChange(supportedPositions?supportedPositions.reduce((best,p)=>Math.abs(p-boundary)<Math.abs(best-boundary)?p:best):boundary);
 }
 function placementKey(e){
  if(!['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key))return;
  e.preventDefault();const up=e.key==='ArrowRight'||e.key==='ArrowUp',values=supportedPositions;
  const next=e.key==='Home'?0:e.key==='End'?m.length:values?values[Math.max(0,Math.min(values.length-1,values.indexOf(targetBoundary)+(up?1:-1)))]:Math.max(0,Math.min(m.length,Number(targetBoundary)+(up?1:-1)*(e.shiftKey?10:1)));
  onBoundaryChange(next);
 }
 const [markerX,markerY]=point(120,100,88,Number(targetBoundary||0)/m.length*360),[dnaX,dnaY]=point(120,100,69,Number(targetBoundary||0)/m.length*360);
 if(view==='blueprint')return <MolecularBlueprint molecule={m} onSelect={onSelect} selected={selected} zoom={zoom} targetBoundary={targetBoundary} onBoundaryChange={onBoundaryChange?value=>onBoundaryChange(supportedPositions?supportedPositions.reduce((best,p)=>Math.abs(p-value)<Math.abs(best-value)?p:best):value):undefined}/>;
 return <section className={`molecule-card ${compact?'compact':''} ${onSelect?'':'molecule-static'}`}>
 <div className="molecule-card-title"><h3>{m.name}</h3><span>{circular?'CIRCULAR':'LINEAR'}</span></div>
 <div className="molecule-viewport"><svg className="molecule-svg" style={{width:`${zoom*100}%`}} viewBox="0 0 240 205" role="group" aria-label={`${m.name}; ${m.length} symbolic units; ${m.blocks.filter(b=>b.kind==='element').length} element copies`}>
 {circular?<circle cx="120" cy="100" r="69" fill="none" stroke="#293039" strokeWidth="8"/>:<><line x1="18" y1="100" x2="222" y2="100" stroke="#293039" strokeWidth="7"/><path d="M18 90v20 M222 90v20" stroke="#77828c"/></>}
 {m.features.filter(f=>!f.parentId).map(f=><g key={f.id} {...interactive(f)} className={`molecular-feature ${selected===f.id?'selected':''}${highlight.includes(f.id)?' is-new':''}`}><title>{`${f.label} · ${studentLabels(f.segments)} symbolic units`}</title>{f.segments.map(([a,z],i)=>{const start=a/m.length*359.5,end=z/m.length*359.5,d=arc(start,Math.max(start+1.4,end));return <g key={i}>{circular?<><path d={d} fill="none" stroke="transparent" strokeWidth="22"/><path d={d} fill="none" stroke={featureColor(f)} strokeWidth={f.kind==='element'?13:7}/></>:<><line x1={18+a/m.length*204} x2={18+z/m.length*204} y1="100" y2="100" stroke="transparent" strokeWidth="24"/><line x1={18+a/m.length*204} x2={18+z/m.length*204} y1="100" y2="100" stroke={featureColor(f)} strokeWidth={f.kind==='element'?15:7}/></>}</g>;})}</g>)}
 {m.features.filter(f=>f.kind==='res'||f.kind==='TIR').map(f=>{const [a,z]=f.segments[0],angle=(a+z)/2/m.length*359.5,[x,y]=circular?point(120,100,69,angle):[18+(a+z)/2/m.length*204,100];return <g key={f.id} {...interactive(f)} className={`molecular-feature ${selected===f.id?'selected':''}`}><title>{`${f.label} · ${studentLabels(f.segments)} symbolic units`}</title><circle cx={x} cy={y} r="9" fill="transparent"/><circle cx={x} cy={y} r={f.kind==='res'?4:2.5} fill={colors[f.kind]} stroke="#0b0e11" strokeWidth="1"/></g>;})}
 {m.features.filter(f=>f.kind==='element').map(f=>{const [a,z]=f.segments[0],angle=(a+z)/2/m.length*359.5,[x,y]=circular?point(120,100,69,angle):[18+(a+z)/2/m.length*204,100];return <polygon key={`direction-${f.id}`} points="-3,-4 4,0 -3,4" transform={`translate(${x},${y}) rotate(${(circular?angle:0)+(f.orientation===1?0:180)})`} fill="#342c1c" pointerEvents="none"><title>{`Element orientation ${f.orientation===1?'forward':'reverse'}`}</title></polygon>;})}
 {circular?<g pointerEvents="none"><text x="120" y="96" textAnchor="middle" fill="#e9e9e4" fontSize="18">{m.id==='cointegrate'?'D + T':m.backboneIds.join(' + ').toUpperCase()}</text><text x="120" y="113" textAnchor="middle" fill="#a7b8cb" fontSize="9">{m.length.toLocaleString()} MODEL UNITS</text><text x="120" y="133" textAnchor="middle" fill="var(--scientific-element)" fontSize="11">{m.blocks.filter(b=>b.kind==='element').length} element {m.blocks.filter(b=>b.kind==='element').length===1?'copy':'copies'}</text></g>:<text x="120" y="133" textAnchor="middle" fill="#a7b8cb" fontSize="11">{m.length} symbolic units · {m.endStatus==='unrepaired'?'unrepaired ends':'schematic donor'}</text>}
 {placement&&<><circle className="placement-orbit" cx="120" cy="100" r="88" fill="none" stroke="#87dcff" strokeWidth="1" strokeDasharray="2 4"/><line x1={markerX} y1={markerY} x2={dnaX} y2={dnaY} stroke="#bceeff" strokeWidth="1.5" pointerEvents="none"/><circle cx={dnaX} cy={dnaY} r="5" fill="none" stroke="#e2f7ff" strokeWidth="1.5" pointerEvents="none"/>
 <circle className="placement-track" cx="120" cy="100" r="88" fill="none" stroke="transparent" strokeWidth="24" onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);placeFromPointer(e);}} onPointerMove={e=>{if(dragging.current)placeFromPointer(e);}} onPointerUp={e=>{dragging.current=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{dragging.current=false;}}/>
 <g className="placement-handle" transform={`translate(${markerX},${markerY})`} role="slider" tabIndex="0" aria-label="Target placement on DNA" aria-valuemin="0" aria-valuemax={m.length} aria-valuenow={Number(targetBoundary)||0} aria-valuetext={`Boundary ${targetBoundary}; symbolic placement${supportedPositions?'; supported fixtures only':''}`} onKeyDown={placementKey}><circle r="9" fill="#bceeff" stroke="#071521" strokeWidth="2" pointerEvents="none"/><path d="M-4 0h8 M0 -4v8" stroke="#0d3242" strokeWidth="1.4" pointerEvents="none"/></g></>}
 <text x="120" y="201" textAnchor="middle" fill="#9aafc4" fontSize="8">{placement?'DRAG THE OUTER RING · PLACEMENT CONTROL':'SCHEMATIC · NOT TO SCALE'}</text>
 </svg></div>
 {placement&&<div className="placement-readout"><span>⌖ TARGET BOUNDARY</span><strong>{targetBoundary}<small> / {m.length}</small></strong></div>}
 <div className="feature-pills">{m.features.filter(f=>f.kind!=='backbone').map(f=>onSelect?<button key={f.id} onClick={()=>choose(f)} onPointerEnter={()=>setHovered(f.id)} onPointerLeave={()=>setHovered(null)} aria-pressed={selected===f.id} className={`feature-pill ${f.kind.toLowerCase()}${highlight.includes(f.id)?' is-new':''}`} title={`${studentLabels(f.segments)} symbolic units`}>{f.label}{['element','TIR'].includes(f.kind)?` ${f.orientation===1?'→':'←'}`:''}</button>:<span key={f.id} className={`feature-pill ${f.kind.toLowerCase()}`}>{f.label}</span>)}</div>
 {!compact&&onSelect&&<div className="probe-readout" aria-live="polite">{inspected?<><b>{inspected.label}</b><span>{studentLabels(inspected.segments)} · {inspected.kind} · {inspected.orientation===1?'forward →':'reverse ←'}</span></>:<><b>Explore the molecule</b><span>Hover to preview · select a feature to pin its evidence</span></>}</div>}
 </section>;
}
