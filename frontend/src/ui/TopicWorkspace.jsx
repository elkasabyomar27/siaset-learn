import { Link, useLocation, useNavigate } from 'react-router';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyGroups, journeyStops } from '../features/transposable-elements/journey.js';

// Navigation and read-only completion. The original lesson/lab owns every learning interaction.
export default function TopicWorkspace({children}){
  const {pathname,search}=useLocation(),navigate=useNavigate();
  const {progress,labs}=useProgress();
  const topics=journeyStops(progress,labs,pathname,search),index=topics.findIndex(topic=>topic.current),topic=topics[index];
  if(!topic)return children;
  const chapter=journeyGroups.find(group=>group.topics.includes(topic.id));
  const lab=topic.learning.kind==='laboratory';
  return <div className={`topic-workspace${lab?' topic-workspace--lab':''}`}>
    <header className="topic-navigation"><div className="topic-path"><Link to="/learn/transposable-elements">← Field guide</Link><span aria-hidden="true">/</span><span>{chapter?.title}</span></div><div className="topic-navigation-controls"><span className={`topic-evidence-state${topic.completed?' is-completed':''}`}><i aria-hidden="true"/>{topic.completed?'Completed from evidence':lab?'Guided review not recorded':'Not completed yet'}</span><label><span className="sr-only">Jump to topic</span><select value={topic.id} onChange={event=>navigate(topics.find(item=>item.id===event.target.value).href)}>{topics.map(item=><option key={item.id} value={item.id}>{String(item.order).padStart(2,'0')} / {item.title}</option>)}</select></label><div className="topic-arrows">{topics[index-1]?<Link to={topics[index-1].href} aria-label={`Previous topic: ${topics[index-1].title}`} title={topics[index-1].title}>←</Link>:<span aria-hidden="true">←</span>}{topics[index+1]?<Link to={topics[index+1].href} aria-label={`Next topic: ${topics[index+1].title}`} title={topics[index+1].title}>→</Link>:<span aria-hidden="true">→</span>}</div></div></header>
    <div className="topic-edition"><span>TOPIC {String(topic.order).padStart(2,'0')} <i>/ {topics.length}</i></span><b>{lab?'GUIDED MOLECULAR EXPERIMENT':'THE SIASET FIELD GUIDE'}</b><span>{lab?'Inspect · Predict · Calculate':'Read · Explore · Reason'}</span></div>
    {children}
  </div>;
}
