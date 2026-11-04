import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import WorkspaceSidebar from './WorkspaceSidebar.jsx';

export default function WorkspaceShell({ children }) {
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButton = useRef(null);
  const immersive = pathname.startsWith('/lab/');
  const surface = immersive ? 'immersive' : 'academic';
  const page = pathname.includes('/assessment') ? 'assessment' : pathname.includes('/progress') ? 'progress' : pathname.startsWith('/account') || pathname.startsWith('/auth/') ? 'account' : pathname.startsWith('/lab/') ? 'lab' : pathname === '/learn/transposable-elements' ? 'curriculum' : pathname.startsWith('/learn/') ? 'lesson' : 'overview';
  const experiment = new URLSearchParams(search).get('experiment') === 'tn3' ? 'Tn3' : 'Tn5';
  const label = page === 'lab' ? pathname.endsWith('/sandbox') ? 'Molecular sandbox' : `${experiment} guided laboratory` : page === 'lesson' ? 'Curriculum / Lesson' : page.charAt(0).toUpperCase() + page.slice(1);

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
    <div className="page"><header className="topbar"><span className="workspace-breadcrumb">Transposable elements <span className="slash">/</span> <b>{label}</b></span><span className="topbar-badge">{immersive ? 'MOLECULAR WORKSPACE' : 'MOLECULAR GENETICS'}</span></header><div id="main-content" tabIndex={-1}>{children}</div></div>
  </div>;
}
