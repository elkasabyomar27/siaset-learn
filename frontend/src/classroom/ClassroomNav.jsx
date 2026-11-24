import { NavLink } from 'react-router';

const LINKS = [['/classes', 'My classes'], ['/play', 'Live quiz'], ['/teach', 'Teach']];

/** The Classroom area's own menu, so students and would-be teachers can reach every classroom page. */
export default function ClassroomNav() {
  return <nav className="classroom-nav" aria-label="Classroom">
    {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === '/classes'}>{label}</NavLink>)}
  </nav>;
}
