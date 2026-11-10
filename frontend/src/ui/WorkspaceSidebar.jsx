import { Link, NavLink } from 'react-router';
import Brand from '../Brand.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import Avatar from '../auth/Avatar.jsx';
import { profileDetails } from '../auth/profile.js';
import { useSyncStatus } from '../auth/ProgressSync.jsx';

const SYNC_NOTES = {off: 'Saved in this browser', syncing: 'Syncing to your account…', synced: 'Synced across your devices', error: 'Saved here · sync will retry'};
// Sidebar profile card and avatar styles live with the account page; load them eagerly because /account is lazy.
import '../auth/account.css';

const groups = [
  { label:'Learn', items:[['Overview','/','home'],['Curriculum','/learn/transposable-elements','book']] },
  { label:'Experiment', items:[['Guided labs','/lab/transposable-elements','flask'],['Sandbox','/lab/transposable-elements/sandbox','orbit']] },
  { label:'Reflect', items:[['Assessment','/learn/transposable-elements/assessment','check'],['Progress','/learn/transposable-elements/progress','chart']] },
  { label:'Classroom', items:[['My classes','/classes','class'],['Live quiz','/play','bolt'],['Teach','/teach','board']] },
];
const paths = {
  home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  book:'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
  flask:'M9 3h6M10 3v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3M7 15h10',
  orbit:'M12 3v2M12 19v2M3 12h2M19 12h2M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4',
  check:'M8 3h8v3H8zM8 4H5v17h14V4h-3M8 13l3 3 5-6',
  chart:'M4 3v18h17M8 16v-4M13 16V7M18 16v-7',
  user:'M4 21v-2a8 8 0 0 1 16 0v2',
  class:'M3 8l9-4 9 4-9 4-9-4ZM7 10v5c3 2 7 2 10 0v-5M21 8v6',
  bolt:'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  board:'M3 4h18v12H3zM8 20h8M12 16v4M7 9h6M7 12h9',
};
function NavIcon({name}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/>{name==='orbit'&&<><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></>}{name==='user'&&<circle cx="12" cy="7" r="4"/>}</svg>;
}

export default function WorkspaceSidebar({page,menuOpen,setMenuOpen,menuButton,collapsed,setCollapsed}) {
  const {user,ready}=useAuth();
  const profile=profileDetails(user), {status:syncStatus}=useSyncStatus();
  function destination(title,to,icon) {
    const lessonCurriculum=title==='Curriculum'&&page==='lesson';
    return <NavLink key={to} to={to} end={!lessonCurriculum&&!['/teach','/play'].includes(to)} className={({isActive})=>isActive||lessonCurriculum?'active':''} aria-current={lessonCurriculum?'page':undefined} aria-label={title} title={collapsed?title:undefined} onClick={()=>setMenuOpen(false)}><span className="sidebar-nav-icon"><NavIcon name={icon}/></span><span className="sidebar-link-label">{title}</span><span className="sidebar-active-indicator" aria-hidden="true"/></NavLink>;
  }
  return <aside className={`sidebar workspace-sidebar studio-sidebar${menuOpen?' is-menu-open':''}`} aria-label="Main navigation">
    <div className="studio-brand-row"><Link className="studio-brand" to="/" aria-label="SIASET Learn overview" onClick={()=>setMenuOpen(false)}><span className="studio-brand-full"><Brand tone="dark"/><span className="studio-learn-tag">LEARN</span></span><span className="studio-brand-icon"><Brand variant="icon" tone="dark"/></span></Link><button className="sidebar-collapse" onClick={()=>setCollapsed(value=>!value)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="workspace-navigation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-11-3 3 3 3"/></svg></button><button ref={menuButton} className="menu-toggle" aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={()=>setMenuOpen(value=>!value)}>{menuOpen?'Close':'Explore'}<span aria-hidden="true">{menuOpen?'×':'☰'}</span></button></div>
    <Link className="sidebar-course sidebar-account" to="/account" aria-label={user?'Manage your account profile':'Sign in or create an account'} onClick={()=>setMenuOpen(false)} title={collapsed?(user?profile.name||user.email:'Your account'):undefined}><Avatar user={user}/><div className="sidebar-profile-text"><span>{!ready?'CHECKING ACCOUNT':user?'YOUR ACCOUNT':'YOUR LEARNING SPACE'}</span><b>{!ready?'Please wait…':user?profile.name||'Your profile':'Make yourself at home'}</b><small>{user?user.email:'Sign in or create an account'}</small></div><span className="profile-card-arrow" aria-hidden="true">↗</span></Link>
    <nav id="workspace-navigation" className={`workspace-navigation studio-navigation${menuOpen?' is-open':''}`} aria-label="Workspace">
      {groups.map(group=><div className="sidebar-nav-group" key={group.label}><p className="sidebar-group-label">{group.label}</p>{group.items.map(([title,to,icon])=>destination(title,to,icon))}</div>)}
      <div className="sidebar-personal">{destination('Account','/account','user')}<div className="sidebar-bottom-note"><span className={`local-evidence-dot is-${syncStatus}`}/><div><b>Your learning, your pace.</b><span role="status">{SYNC_NOTES[syncStatus]}</span></div></div></div>
    </nav>
  </aside>;
}
