import { Link } from 'react-router';
import Brand from '../Brand.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import Avatar from '../auth/Avatar.jsx';
import { profileDetails } from '../auth/profile.js';
import { useSyncStatus } from '../auth/ProgressSync.jsx';
// Avatar styles live with the account page; load them eagerly because /account is lazy.
import '../auth/account.css';

const SYNC_NOTES = {off: 'Saved in this browser', syncing: 'Syncing…', synced: 'Synced', error: 'Saved here · sync will retry'};

// The lab's single navigation, shown as a top bar. The file keeps its historical name.
export const destinations = [
  ['Lab room', '/lab'],
  ['Station finder', '/stations'],
  ['Notebook', '/notebook'],
  ['Practice', '/practice'],
  ['Classroom', '/classes'],
];

export function currentDestination(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return null;
  if (path === '/stations' || path === '/learn/transposable-elements') return 'Station finder';
  if (path === '/notebook' || path.endsWith('/progress') || path.startsWith('/account') || path.startsWith('/auth/')) return 'Notebook';
  if (path === '/practice' || path.endsWith('/assessment')) return 'Practice';
  if (path.startsWith('/classes') || path.startsWith('/play') || path.startsWith('/teach')) return 'Classroom';
  return 'Lab room';
}

export default function WorkspaceSidebar({pathname, landing, menuOpen, setMenuOpen, menuButton}) {
  const {user, ready} = useAuth();
  const profile = profileDetails(user), {status: syncStatus} = useSyncStatus();
  const current = currentDestination(pathname);
  const close = () => setMenuOpen(false);
  return <header className={`lab-header${landing ? ' lab-header--landing' : ''}`}>
    <div className="lab-header-inner">
      <Link className="lab-brand" to="/" aria-label="SIASET Learn overview" onClick={close}><Brand tone="dark"/></Link>
      <button ref={menuButton} type="button" className="lab-menu-toggle" aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? 'Close' : 'Menu'}<span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
      <nav id="workspace-navigation" className={`lab-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        {landing
          ? <><a href="#how" onClick={close}>How it works</a><a href="#fields" onClick={close}>Fields</a><a href="#teachers" onClick={close}>For teachers</a></>
          : destinations.map(([title, to]) => <Link key={to} to={to} aria-label={title} aria-current={current === title ? 'page' : undefined} onClick={close}>{title}</Link>)}
      </nav>
      <div className="lab-account">
        {user && <span className={`lab-sync is-${syncStatus}`} role="status"><i aria-hidden="true"/>{SYNC_NOTES[syncStatus]}</span>}
        {landing
          ? <>{!user && <Link className="lab-signin" to="/account" onClick={close}>Sign in</Link>}<Link className="lab-cta" to="/lab" onClick={close}>{user ? 'Go to lab room' : 'Enter the lab'}</Link></>
          : user
            ? <Link className="lab-avatar" to="/account" aria-label={`Your account: ${profile.name || user.email}`} title={profile.name || user.email} onClick={close}><Avatar user={user}/></Link>
            : <Link className="lab-signin" to="/account" onClick={close}>{ready ? 'Sign in' : 'Checking…'}</Link>}
      </div>
    </div>
  </header>;
}
