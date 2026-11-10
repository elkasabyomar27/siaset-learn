import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import WorkspaceSidebar from './WorkspaceSidebar.jsx';
import { allTopics, moduleForTopic } from '../features/transposable-elements/curriculum/modules.js';

export default function WorkspaceShell({ children }) {
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButton = useRef(null);
  const immersive = pathname.startsWith('/lab/');
  const surface = immersive ? 'immersive' : 'academic';
  const page = pathname.startsWith('/teach') ? 'teach' : pathname.startsWith('/classes') ? 'classes' : pathname.startsWith('/play') ? 'play' : pathname.includes('/assessment') ? 'assessment' : pathname.includes('/progress') ? 'progress' : pathname.startsWith('/account') || pathname.startsWith('/auth/') ? 'account' : pathname.startsWith('/lab/') ? 'lab' : pathname === '/learn/transposable-elements' ? 'curriculum' : pathname.startsWith('/learn/') ? 'lesson' : 'overview';
  const experiment = new URLSearchParams(search).get('experiment') === 'tn3' ? 'Tn3' : 'Tn5';
  const classroomLabels = {teach: pathname.startsWith('/teach/live') ? 'Live quiz host' : pathname.startsWith('/teach/approve') ? 'Teacher request' : 'Teach', classes: 'My classes', play: 'Live quiz'};
  const lessonTopic = page === 'lesson' ? allTopics.find(topic => pathname.replace(/\/+$/, '') === `${moduleForTopic(topic.id).basePath}/${topic.id}`) : null;
  const label = classroomLabels[page] || (page === 'lab' ? pathname.endsWith('/sandbox') ? 'Sandbox' : `${experiment} guided laboratory` : page === 'lesson' ? lessonTopic?.title || 'Lesson' : page.charAt(0).toUpperCase() + page.slice(1));
  const area = classroomLabels[page] ? 'Classroom' : lessonTopic ? moduleForTopic(lessonTopic.id).title : page === 'lab' ? 'Transposable Elements' : 'SIASET Learn';

  useEffect(() => {
    if (!menuOpen) return;
    const escape = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);

  return <div className="app workspace-shell" data-sidebar={collapsed?'compact':'expanded'} data-surface={surface} data-page={page} data-guided-lab={page === 'lab' && !pathname.endsWith('/sandbox') ? 'true' : undefined} data-workbench={page === 'lab' ? 'true' : undefined}>
    <WorkspaceSidebar page={page} menuOpen={menuOpen} setMenuOpen={setMenuOpen} menuButton={menuButton} collapsed={collapsed} setCollapsed={setCollapsed}/>
    <div className="page"><header className="topbar"><span className="workspace-breadcrumb">{area} <span className="slash">/</span> <b>{label}</b></span><span className="topbar-badge">{immersive ? 'MOLECULAR WORKSPACE' : classroomLabels[page] ? 'CLASSROOM' : 'MOLECULAR GENETICS'}</span></header><div id="main-content" tabIndex={-1}>{children}</div></div>
  </div>;
}
