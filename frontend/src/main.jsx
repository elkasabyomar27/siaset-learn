import { AuthProvider } from './auth/AuthProvider.jsx';
import ProgressSync from './auth/ProgressSync.jsx';
import RouteExperience from './RouteExperience.jsx';
import WorkspaceShell from './ui/WorkspaceShell.jsx';
import Landing from './ui/Landing.jsx';
import CurriculumOverview from './ui/CurriculumOverview.jsx';
import ReviewWorkspace from './ui/ReviewWorkspace.jsx';
import TopicWorkspace from './ui/TopicWorkspace.jsx';
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import './styles.css';
import './theme.css';
import './scientific.css';
import './ui/redesign.css';
import './ui/guided-labs.css';
import './ui/experiment-bench.css';
import './ui/curriculum-overview.css';
import './ui/section-families.css';
import './ui/topic-pages.css';
import './ui/lab-shell.css';

// Route pages load on demand so the overview does not download every lab and lesson up front.
const LabRoom = lazy(() => import('./ui/LabRoom.jsx'));
const Account = lazy(() => import('./auth/Account.jsx'));
const Sandbox = lazy(() => import('./features/transposable-elements/Sandbox.jsx'));
const Assessment = lazy(() => import('./features/transposable-elements/Assessment.jsx'));
const ProgressDashboard = lazy(() => import('./features/transposable-elements/ProgressDashboard.jsx'));
const Lessons = lazy(() => import('./features/transposable-elements/Lessons.jsx'));
const Laboratory = lazy(() => import('./features/transposable-elements/Laboratory.jsx'));
const Teach = lazy(() => import('./classroom/Teach.jsx'));
const TeacherApprove = lazy(() => import('./classroom/TeacherApprove.jsx'));
const MyClasses = lazy(() => import('./classroom/MyClasses.jsx'));
const QuizHost = lazy(() => import('./classroom/QuizHost.jsx'));
const QuizPlay = lazy(() => import('./classroom/QuizPlay.jsx'));
const RouteLoading = () => <main className="lab-loading" aria-busy="true"><p role="status" className="lab-eyebrow">Setting up the bench…</p><div className="lab-skeleton wide"/><div className="lab-skeleton-grid"><div className="lab-skeleton"/><div className="lab-skeleton"/><div className="lab-skeleton"/><div className="lab-skeleton"/></div></main>;

function App() {
  return <BrowserRouter><RouteExperience/><a className="skip-link" href="#main-content">Skip to content</a><WorkspaceShell><Suspense fallback={<RouteLoading/>}><Routes><Route path="/account" element={<Account key="account"/>}/><Route path="/auth/callback" element={<Account key="callback"/>}/><Route path="/auth/recovery" element={<Account key="recovery"/>}/><Route path="/teach" element={<Teach/>}/><Route path="/teach/approve" element={<TeacherApprove/>}/><Route path="/teach/live/:sessionId" element={<QuizHost/>}/><Route path="/classes" element={<MyClasses/>}/><Route path="/play" element={<QuizPlay/>}/><Route path="/play/:sessionId" element={<QuizPlay/>}/><Route path="/lab" element={<LabRoom/>}/><Route path="/stations" element={<CurriculumOverview/>}/><Route path="/practice" element={<ReviewWorkspace><Assessment/></ReviewWorkspace>}/><Route path="/notebook" element={<ReviewWorkspace><ProgressDashboard/></ReviewWorkspace>}/><Route path="/lab/transposable-elements/sandbox" element={<Sandbox/>}/><Route path="/learn/transposable-elements/assessment" element={<ReviewWorkspace><Assessment/></ReviewWorkspace>}/><Route path="/learn/transposable-elements/progress" element={<ReviewWorkspace><ProgressDashboard/></ReviewWorkspace>}/><Route path="/learn/transposable-elements" element={<CurriculumOverview/>}/><Route path="/learn/transposable-elements/:topicId" element={<TopicWorkspace><Lessons/></TopicWorkspace>}/><Route path="/learn/dna-extraction/:topicId" element={<TopicWorkspace><Lessons/></TopicWorkspace>}/><Route path="/learn/dna-extraction" element={<Navigate replace to="/lab#module-dna-extraction"/>}/><Route path="/learn/bench-workflow/:topicId" element={<TopicWorkspace><Lessons/></TopicWorkspace>}/><Route path="/learn/bench-workflow" element={<Navigate replace to="/lab#module-bench-workflow"/>}/><Route path="/" element={<Landing/>}/><Route path="/lab/transposable-elements" element={<TopicWorkspace><Laboratory/></TopicWorkspace>}/><Route path="*" element={<main className="lab-not-found"><p className="lab-not-found-code">404</p><h1>This sample went missing.</h1><p>The page you asked for is not on any bench.</p><Link className="lab-button lab-button--amber" to="/lab">Back to the lab room</Link></main>}/></Routes></Suspense></WorkspaceShell><Analytics/></BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><AuthProvider><ProgressSync/><App/></AuthProvider></React.StrictMode>);
