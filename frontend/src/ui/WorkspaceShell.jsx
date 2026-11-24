import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import WorkspaceSidebar from './WorkspaceSidebar.jsx';

export default function WorkspaceShell({ children }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const path = pathname.replace(/\/+$/, '') || '/';
  const landing = path === '/';
  const immersive = pathname.startsWith('/lab/');
  // data-page values are kept so existing page-level styles keep applying.
  const page = landing ? 'landing' : path === '/lab' ? 'lab-room' : pathname.startsWith('/teach') ? 'teach' : pathname.startsWith('/classes') ? 'classes' : pathname.startsWith('/play') ? 'play' : (pathname.includes('/assessment') || path === '/practice') ? 'assessment' : (pathname.includes('/progress') || path === '/notebook') ? 'progress' : pathname.startsWith('/account') || pathname.startsWith('/auth/') ? 'account' : pathname.startsWith('/lab/') ? 'lab' : (path === '/learn/transposable-elements' || path === '/stations') ? 'curriculum' : pathname.startsWith('/learn/') ? 'lesson' : 'overview';

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

  return <div className="app workspace-shell lab-shell" data-surface={immersive ? 'immersive' : 'academic'} data-page={page} data-guided-lab={page === 'lab' && !pathname.endsWith('/sandbox') ? 'true' : undefined} data-workbench={page === 'lab' ? 'true' : undefined}>
    <WorkspaceSidebar pathname={pathname} landing={landing} menuOpen={menuOpen} setMenuOpen={setMenuOpen} menuButton={menuButton}/>
    <div className="lab-page"><div id="main-content" tabIndex={-1}>{children}</div></div>
  </div>;
}
