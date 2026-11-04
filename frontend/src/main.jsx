import topics from './features/transposable-elements/curriculum/topics.json' with {type:'json'};
import Brand from './Brand.jsx';
import Account from './auth/Account.jsx';
import RouteExperience from './RouteExperience.jsx';
import Sandbox from './features/transposable-elements/Sandbox.jsx';
import Assessment from './features/transposable-elements/Assessment.jsx';
import ProgressDashboard from './features/transposable-elements/ProgressDashboard.jsx';
import FeatureNav from './features/transposable-elements/FeatureNav.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router';
import Lessons from './features/transposable-elements/Lessons.jsx';
import Laboratory from './features/transposable-elements/Laboratory.jsx';
import './styles.css';
import './theme.css';
import './scientific.css';

function Dashboard() {
  return <main className="dashboard brand-home"><section className="home-hero"><div><p className="eyebrow">SIASET / MOLECULAR GENETICS</p><Brand variant="full" className="hero-logo"/><h1>Small elements.<br/><em>Remarkable movement.</em></h1><p className="intro">Explore how DNA moves, changes and carries information. Learn through guided experiments, molecular evidence and thoughtful predictions.</p><div className="home-actions"><Link className="primary-button" to="/learn/transposable-elements">Explore the curriculum</Link><Link className="outline-button" to="/lab/transposable-elements">Enter guided laboratory</Link></div></div><div className="hero-emblem"><Brand variant="icon" tone="dark"/><p>OBSERVE · PREDICT · UNDERSTAND</p><span>Transposable Elements<br/>Virtual Laboratory</span></div></section><section className="home-summary" aria-label="Learning environment"><span><b>{topics.length}</b> connected curriculum topics</span><span><b>{topics.filter(t=>t.learning.kind==='laboratory').length}</b> guided molecular mechanisms</span><span><b>1</b> place to follow the evidence</span></section><section className="home-features"><div className="home-section-title"><p className="eyebrow">YOUR LEARNING WORKSPACE</p><h2>Choose where to begin.</h2><p>Start with the foundations or investigate a molecular mechanism.</p></div><div className="home-card-grid">{[
['01','Build your understanding','A connected curriculum, from mobile DNA fundamentals to bacterial gene transfer.','/learn/transposable-elements','Open curriculum'],
['02','Follow DNA in motion','Inspect Tn5 and Tn3, predict their outcomes and review calculated molecular structures.','/lab/transposable-elements','Explore guided labs'],
['03','Test a molecular idea','Compare the two supported mechanisms in a bounded, independent sandbox.','/lab/transposable-elements/sandbox','Enter sandbox'],
['04','Connect the concepts',`Practice mechanism-based reasoning across all ${topics.length} topics.`,'/learn/transposable-elements/assessment','Take assessment'],
['05','See your progress','Review your locally saved lessons, guided experiments and assessment attempts.','/learn/transposable-elements/progress','View progress']
].map(([number,title,description,path,label])=><Link className="home-card" to={path} key={path}><span className="home-card-number">{number}</span><h3>{title}</h3><p>{description}</p><strong>{label} <span aria-hidden="true">↗</span></strong></Link>)}</div></section><footer className="home-footer"><Brand variant="compact"/><p>Symbolic educational models · Evidence and limitations documented · Progress stored in this browser</p></footer></main>;
}

function App() {
  return <BrowserRouter><RouteExperience/><a className="skip-link" href="#main-content">Skip to content</a><div className="app"><aside className="sidebar"><Link className="brand" to="/" aria-label="SiaSet home"><Brand tone="dark"/></Link><div className="sidebar-label">WORKSPACE</div><NavLink to="/" end>◈ <span>Overview</span></NavLink><NavLink to="/lab/transposable-elements">⌬ <span>TE laboratory</span></NavLink><NavLink to="/learn/transposable-elements"><span>TE curriculum</span></NavLink><NavLink to="/account">Account</NavLink><div className="sidebar-footer"><span className="status-dot"/> LOCAL LEARNING ENVIRONMENT<p>Molecular genetics<br/>Scientific model v1</p></div></aside><div className="page"><header className="topbar"><span>TRANSPOSABLE ELEMENTS <span className="slash">/</span> <b>MOLECULAR GENETICS</b></span><span className="topbar-badge">SIASET LEARN</span></header><div id="main-content" tabIndex={-1}><Routes><Route path="/account" element={<Account key="account"/>}/><Route path="/auth/callback" element={<Account key="callback"/>}/><Route path="/auth/recovery" element={<Account key="recovery"/>}/><Route path="/lab/transposable-elements/sandbox" element={<Sandbox/>}/><Route path="/learn/transposable-elements/assessment" element={<Assessment/>}/><Route path="/learn/transposable-elements/progress" element={<ProgressDashboard/>}/><Route path="/learn/transposable-elements" element={<Lessons/>}/><Route path="/learn/transposable-elements/:topicId" element={<Lessons/>}/><Route path="/" element={<Dashboard/>}/><Route path="/lab/transposable-elements" element={<Laboratory/>}/><Route path="*" element={<main className="dashboard"><h1>Page not found</h1><Link to="/">Return to overview</Link></main>}/></Routes></div></div></div></BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
