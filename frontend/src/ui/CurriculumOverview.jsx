import { useLayoutEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import Curriculum from '../features/transposable-elements/Curriculum.jsx';
import FeatureNav from '../features/transposable-elements/FeatureNav.jsx';
import PersistenceStatus from '../features/transposable-elements/PersistenceStatus.jsx';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyStops, journeyGroups, focusJourneyTarget } from '../features/transposable-elements/journey.js';
import SectionSwitcher from './SectionSwitcher.jsx';

export function LearningCompass({stops}) {
  const completed=stops.filter(stop=>stop.completed).length;
  return <svg className="learning-compass" viewBox="0 0 300 300" role="img" aria-label={`${completed} of ${stops.length} curriculum topics completed`}>
    <circle cx="150" cy="150" r="132" fill="none" stroke="#d7e5db" strokeDasharray="2 6"/>
    <circle cx="150" cy="150" r="107" fill="#f2f6ed" stroke="#cbded0"/>
    <circle cx="150" cy="150" r="77" fill="#fffefa" stroke="#d5e3d8"/>
    {stops.map((stop,index)=>{const angle=(index/stops.length*360-90)*Math.PI/180,x=150+107*Math.cos(angle),y=150+107*Math.sin(angle);return <g key={stop.id}><circle cx={x} cy={y} r="12" fill={stop.completed?'#2e765b':'#fffefa'} stroke={stop.completed?'#2e765b':'#a7c3af'} strokeWidth="1.5"/><text x={x} y={y+3} textAnchor="middle" fill={stop.completed?'white':'#526e5c'} fontSize="8">{stop.completed?'✓':stop.order}</text></g>;})}
    <text x="150" y="127" textAnchor="middle" fill="#5c7969" fontSize="8" letterSpacing="2">YOUR LEARNING PATH</text>
    <text x="150" y="168" textAnchor="middle" fill="#234a39" fontSize="38" fontWeight="500">{completed}<tspan fontSize="17" fill="#829787"> / {stops.length}</tspan></text>
    <text x="150" y="190" textAnchor="middle" fill="#5c7969" fontSize="9">topics completed</text>
  </svg>;
}

export default function CurriculumOverview(){
  const {progress,labs}=useProgress(),{pathname,search,hash}=useLocation();
  const [query,setQuery]=useState(''),[kind,setKind]=useState('all');
  useLayoutEffect(()=>{
    const id=hash.slice(1);
    if(!['journey-all',...journeyGroups.map(group=>`journey-${group.id}`)].includes(id))return;
    const target=document.getElementById(id);
    target?.focus({preventScroll:true});target?.scrollIntoView({block:'start',behavior:'auto'});
  },[hash]);
  const stops=journeyStops(progress,labs,pathname,search),completed=stops.filter(stop=>stop.completed).length;
  const next=stops.find(stop=>!stop.completed)||stops[0];
  const term=query.trim().toLocaleLowerCase();
  const filtering=!!term||kind!=='all';
  const matches=stops.filter(stop=>(kind==='all'||stop.learning.kind===kind)&&(!term||[stop.title,...stop.learningObjectives,...stop.essentialTerminology].join(' ').toLocaleLowerCase().includes(term)));
  return <main className="laboratory curriculum-overview"><FeatureNav/><SectionSwitcher/>
    <header className="curriculum-hero"><div className="curriculum-hero-copy"><p className="eyebrow">THE SIASET FIELD GUIDE / MOLECULAR GENETICS</p><h1>Big ideas.<br/><em>Moving DNA.</em></h1><p className="curriculum-lede">From the first evidence of mobile DNA to the mechanisms that reshape genomes. Build your understanding, one connected idea at a time.</p><div className="curriculum-hero-actions"><Link className="primary-button" to={next.href}>{completed===0?'Start learning':completed===stops.length?'Revisit the curriculum':'Continue learning'} <span aria-hidden="true">↗</span></Link><a href="#journey-all" onClick={focusJourneyTarget}>Explore all topics <span aria-hidden="true">↓</span></a></div><div className="course-facts"><span><b>{stops.length}</b> topics</span><span><b>{journeyGroups.length}</b> connected chapters</span><span><b>{stops.filter(stop=>stop.learning.kind==='laboratory').length}</b> guided labs</span><span>Every topic is open</span></div></div><aside className="curriculum-progress-card"><LearningCompass stops={stops}/><div className="course-next"><span>{completed===stops.length?'REVISIT AT YOUR OWN PACE':'A PLACE TO BEGIN'}</span><Link to={next.href}><b>{String(next.order).padStart(2,'0')}</b>{next.title}<span aria-hidden="true">→</span></Link></div><p>Completion comes from learning evidence, not page visits.</p></aside></header>
    <PersistenceStatus/>
    <section className="curriculum-finder" aria-labelledby="curriculum-finder-title"><div><p className="eyebrow">FOLLOW A QUESTION</p><h2 id="curriculum-finder-title">What would you like to explore?</h2></div><div className="curriculum-search-controls"><label className="curriculum-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><span className="sr-only">Search curriculum topics</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Try Tn5, regulation, or target-site duplication…"/></label><label><span className="sr-only">Topic type</span><select value={kind} onChange={event=>setKind(event.target.value)}><option value="all">All topics</option><option value="lesson">Interactive lessons</option><option value="laboratory">Guided laboratories</option></select></label></div>
      {filtering&&<div className="curriculum-search-results"><div className="search-results-summary"><p role="status">{matches.length} matching {matches.length===1?'topic':'topics'}</p><button onClick={()=>{setQuery('');setKind('all');}}>Clear search</button></div>{matches.length?<ul>{matches.map(stop=><li key={stop.id}><Link to={stop.href}><span>{String(stop.order).padStart(2,'0')}</span><div><b>{stop.title}</b><small>{stop.learning.kind==='laboratory'?'Guided laboratory':'Interactive lesson'} · {stop.completed?'Completed':'Incomplete'}</small><p>{stop.learningObjectives[0]}</p></div><span aria-hidden="true">↗</span></Link></li>)}</ul>:<p className="curriculum-no-results">No matching topics. Try another concept or choose All topics.</p>}</div>}
    </section>
    <Curriculum collapsible={false}/>
    <section className="curriculum-endnote"><div><p className="eyebrow">PUT THE IDEAS TO WORK</p><h2>Ready to follow a molecule?</h2><p>Inspect, predict, and explore the structural evidence in the guided workbenches.</p></div><Link to="/lab/transposable-elements">Enter the guided labs <span aria-hidden="true">↗</span></Link></section>
  </main>;
}
