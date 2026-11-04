import { NavLink } from 'react-router';

export default function SectionSwitcher({section='learn'}){
  const review=section==='review';
  const items=review?[['Assessment','/learn/transposable-elements/assessment'],['Progress','/learn/transposable-elements/progress']]:[['Overview','/'],['Curriculum','/learn/transposable-elements']];
  return <div className={`section-switcher ${review?'section-switcher--review':''}`}><span>{review?'CHECK & REFLECT':'THE LEARNING FIELD GUIDE'}</span><nav aria-label={review?'Assessment and progress':'Overview and curriculum'}>{items.map(([label,to])=><NavLink key={to} to={to} end>{label}<span aria-hidden="true">↗</span></NavLink>)}</nav></div>;
}
