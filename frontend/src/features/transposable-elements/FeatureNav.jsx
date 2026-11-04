import {Link, useLocation} from 'react-router';
import {routePresentation} from './routePresentation.js';
const links = [
  ['curriculum', '/learn/transposable-elements', 'Curriculum'],
  ['labs', '/lab/transposable-elements', 'Guided labs'],
  ['sandbox', '/lab/transposable-elements/sandbox', 'Molecular sandbox'],
  ['assessment', '/learn/transposable-elements/assessment', 'Cumulative assessment'],
  ['progress', '/learn/transposable-elements/progress', 'Your progress'],
];
export default function FeatureNav() {
  const {pathname, search} = useLocation();
  const {section} = routePresentation(pathname, search);
  return <nav className="feature-nav" aria-label="Transposable element learning tools">
    {links.map(([id, to, label]) => <Link key={id} to={to} aria-current={section === id ? 'page' : undefined}>{label}</Link>)}
  </nav>;
}
