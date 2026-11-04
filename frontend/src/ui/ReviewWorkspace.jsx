import SectionSwitcher from './SectionSwitcher.jsx';

export default function ReviewWorkspace({children}){
  return <div className="review-workspace"><SectionSwitcher section="review"/>{children}</div>;
}
