import { useLayoutEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import Curriculum from '../features/transposable-elements/Curriculum.jsx';
import PersistenceStatus from '../features/transposable-elements/PersistenceStatus.jsx';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyStops, curriculumModules } from '../features/transposable-elements/journey.js';
import { allChapters, fields, fieldById, moduleById } from '../features/transposable-elements/curriculum/modules.js';
import { challengeFor } from '../features/transposable-elements/curriculum/stations.js';
import { stationStatus, STATUS_LABEL } from './labData.js';

// Progress ring for the station finder; brand palette only.
export function LearningCompass({stops}) {
  const completed=stops.filter(stop=>stop.completed).length;
  return <svg className="learning-compass" viewBox="0 0 300 300" role="img" aria-label={`${completed} of ${stops.length} stations completed`}>
    <circle cx="150" cy="150" r="132" fill="none" stroke="#CBD9E2" strokeDasharray="2 6"/>
    <circle cx="150" cy="150" r="107" fill="#EAF2F6" stroke="#CBD9E2"/>
    <circle cx="150" cy="150" r="77" fill="#FFFFFF" stroke="#CBD9E2"/>
    {stops.map((stop,index)=>{const angle=(index/stops.length*360-90)*Math.PI/180,x=150+107*Math.cos(angle),y=150+107*Math.sin(angle);return <g key={stop.id}><circle cx={x} cy={y} r="12" fill={stop.completed?'#176D80':'#FFFFFF'} stroke={stop.completed?'#176D80':'#CBD9E2'} strokeWidth="1.5"/><text x={x} y={y+3} textAnchor="middle" fill={stop.completed?'#FFFFFF':'#465E70'} fontSize="8">{stop.completed?'✓':stop.order}</text></g>;})}
    <text x="150" y="127" textAnchor="middle" fill="#465E70" fontSize="8" letterSpacing="2">YOUR LAB PATH</text>
    <text x="150" y="168" textAnchor="middle" fill="#10283F" fontSize="38" fontWeight="600">{completed}<tspan fontSize="17" fill="#526B7C"> / {stops.length}</tspan></text>
    <text x="150" y="190" textAnchor="middle" fill="#465E70" fontSize="9">stations completed</text>
  </svg>;
}

export default function CurriculumOverview(){
  const {progress,labs}=useProgress(),{pathname,search,hash}=useLocation();
  const [query,setQuery]=useState(''),[kind,setKind]=useState('all'),[field,setField]=useState('all');
  useLayoutEffect(()=>{
    const id=hash.slice(1);
    if(!['journey-all',...curriculumModules.map(module=>`module-${module.id}`),...allChapters.map(group=>`journey-${group.id}`)].includes(id))return;
    const target=document.getElementById(id);
    target?.focus({preventScroll:true});target?.scrollIntoView({block:'start',behavior:'auto'});
  },[hash]);
  const stops=journeyStops(progress,labs,pathname,search),completed=stops.filter(stop=>stop.completed).length;
  const next=stops.find(stop=>!stop.completed)||stops[0];
  const term=query.trim().toLocaleLowerCase();
  const filtering=!!term||kind!=='all'||field!=='all';
  const fieldOf=stop=>fieldById(moduleById(stop.module)?.field);
  const matches=stops.filter(stop=>(kind==='all'||stop.learning.kind===kind)&&(field==='all'||fieldOf(stop)?.id===field)&&(!term||[stop.title,...stop.learningObjectives,...stop.essentialTerminology].join(' ').toLocaleLowerCase().includes(term)));
  const clear=()=>{setQuery('');setKind('all');setField('all');};
  return <main className="laboratory curriculum-overview station-finder">
    <header className="finder-hero">
      <div>
        <p className="lab-eyebrow">STATION FINDER</p>
        <h1>What do you want to try?</h1>
        <p className="finder-lede">Search every field at once: titles, objectives and key terms. Every station is open.</p>
        <div className="course-facts"><span><b>{stops.length}</b> stations</span><span><b>{fields.length}</b> fields</span><span><b>{curriculumModules.length}</b> modules</span><span><b>{allChapters.length}</b> chapters</span><span><b>{stops.filter(stop=>stop.learning.kind==='laboratory').length}</b> hands-on labs</span></div>
      </div>
      <aside className="curriculum-progress-card"><LearningCompass stops={stops}/><div className="course-next"><span>{completed===stops.length?'REVISIT AT YOUR OWN PACE':'A PLACE TO BEGIN'}</span><Link to={next.href}><b>{String(next.order).padStart(2,'0')}</b>{next.title}<span aria-hidden="true">→</span></Link></div></aside>
    </header>
    <PersistenceStatus/>
    <section className="curriculum-finder finder-panel" aria-labelledby="curriculum-finder-title">
      <h2 id="curriculum-finder-title" className="sr-only">Search and filter stations</h2>
      <label className="curriculum-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><span className="sr-only">Search stations</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Try Tn5, regulation, or isopropanol…"/></label>
      <div className="finder-filters">
        <div role="group" aria-label="Field" className="lab-pills">{[{id:'all',title:'All fields'},...fields].map(f=><button key={f.id} type="button" aria-pressed={field===f.id} onClick={()=>setField(f.id)}>{f.title}</button>)}</div>
        <div role="group" aria-label="Station type" className="lab-pills">{[['all','Any type'],['lesson','Interactive lessons'],['laboratory','Hands-on labs']].map(([id,label])=><button key={id} type="button" aria-pressed={kind===id} onClick={()=>setKind(id)}>{label}</button>)}</div>
      </div>
    </section>
    {filtering&&<section className="curriculum-search-results" aria-label="Matching stations">
      <div className="search-results-summary"><p role="status">{matches.length} matching {matches.length===1?'station':'stations'}</p><button type="button" onClick={clear}>Clear filters</button></div>
      {matches.length?<ul className="finder-results">{matches.map(stop=>{const status=stationStatus(stop,progress);return <li key={stop.id}><Link to={stop.href} className="finder-row">
        <span className={`finder-num${stop.learning.kind==='laboratory'?' is-lab':''}`}>{String(stop.order).padStart(2,'0')}</span>
        <span className="finder-main"><b>{stop.title}</b><span>{challengeFor(stop.id)||stop.learningObjectives[0]}</span></span>
        <span className="finder-path">{fieldOf(stop)?.title} › {moduleById(stop.module)?.title} · {stop.learning.kind==='laboratory'?'Hands-on lab':'Interactive lesson'}</span>
        <span className={`lab-status is-${status}`}>{STATUS_LABEL[status]}{status==='done'?' ✓':''}</span>
      </Link></li>;})}</ul>
      :<div className="lab-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M9 3h6M10 3v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3"/><path d="M9.5 15.5l5-3"/></svg><h2>Nothing on this shelf yet</h2><p>No station matches{term?` “${query.trim()}”`:' these filters'}. Try a broader idea such as “insertion”, or search every field.</p><button type="button" className="lab-button" onClick={clear}>Show all stations</button></div>}
    </section>}
    <Curriculum collapsible={false}/>
    <section className="curriculum-endnote"><div><p className="lab-eyebrow">PUT THE IDEAS TO WORK</p><h2>Ready for the bench?</h2><p>Open the lab room to see every field, module and station in one place.</p></div><Link to="/lab">Go to the lab room <span aria-hidden="true">↗</span></Link></section>
  </main>;
}
