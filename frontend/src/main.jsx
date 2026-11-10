import { AuthProvider } from './auth/AuthProvider.jsx';
import ProgressSync from './auth/ProgressSync.jsx';
import RouteExperience from './RouteExperience.jsx';
import WorkspaceShell from './ui/WorkspaceShell.jsx';
import LearningOverview from './ui/LearningOverview.jsx';
import CurriculumOverview from './ui/CurriculumOverview.jsx';
import ReviewWorkspace from './ui/ReviewWorkspace.jsx';
import TopicWorkspace from './ui/TopicWorkspace.jsx';
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router';
import './styles.css';
import './theme.css';
import './scientific.css';
import './ui/redesign.css';
import './ui/guided-labs.css';
import './ui/experiment-bench.css';
import './ui/sidebar.css';
import './ui/curriculum-overview.css';
import './ui/section-families.css';
import './ui/topic-pages.css';

// Route pages load on demand so the overview does not download every lab and lesson up front.
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
const RouteLoading = () => <main className="dashboard route-loading" aria-busy="true"><p role="status">Loading…</p></main>;

function App() {
  return <BrowserRouter><RouteExperience/><a className="skip-link" href="#main-content">Skip to content</a><WorkspaceShell><Suspense fallback={<RouteLoading/>}><Routes><Route path="/account" element={<Account key="account"/>}/><Route path="/auth/callback" element={<Account key="callback"/>}/><Route path="/auth/recovery" element={<Account key="recovery"/>}/><Route path="/teach" element={<Teach/>}/><Route path="/teach/approve" element={<TeacherApprove/>}/><Route path="/teach/live/:sessionId" element={<QuizHost/>}/><Route path="/classes" element={<MyClasses/>}/><Route path="/play" element={<QuizPlay/>}/><Route path="/play/:sessionId" element={<QuizPlay/>}/><Route path="/lab/transposable-elements/sandbox" element={<Sandbox/>}/><Route path="/learn/transposable-elements/assessment" element={<ReviewWorkspace><Assessment/></ReviewWorkspace>}/><Route path="/learn/transposable-elements/progress" element={<ReviewWorkspace><ProgressDashboard/></ReviewWorkspace>}/><Route path="/learn/transposable-elements" element={<CurriculumOverview/>}/><Route path="/learn/transposable-elements/:topicId" element={<TopicWorkspace><Lessons/></TopicWorkspace>}/><Route path="/learn/dna-extraction/:topicId" element={<TopicWorkspace><Lessons/></TopicWorkspace>}/><Route path="/learn/dna-extraction" element={<Navigate replace to="/learn/transposable-elements#module-dna-extraction"/>}/><Route path="/" element={<LearningOverview/>}/><Route path="/lab/transposable-elements" element={<TopicWorkspace><Laboratory/></TopicWorkspace>}/><Route path="*" element={<main className="dashboard"><h1>Page not found</h1><Link to="/">Return to overview</Link></main>}/></Routes></Suspense></WorkspaceShell></BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><AuthProvider><ProgressSync/><App/></AuthProvider></React.StrictMode>);
