import { Link, useLocation, useNavigate } from 'react-router';
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { journeyStops } from '../features/transposable-elements/journey.js';
import { allChapters, positionInModule, fieldForTopic } from '../features/transposable-elements/curriculum/modules.js';
import { challengeFor } from '../features/transposable-elements/curriculum/stations.js';

// Station frame: navigation, challenge and read-only completion. The lesson or lab inside owns every learning interaction.
export default function TopicWorkspace({children}){
  const {pathname,search}=useLocation(),navigate=useNavigate();
  const {progress,labs}=useProgress();
  const topics=journeyStops(progress,labs,pathname,search),index=topics.findIndex(topic=>topic.current),topic=topics[index];
  if(!topic)return children;
  const chapter=allChapters.find(group=>group.topics.includes(topic.id)),place=positionInModule(topic.id),field=fieldForTopic(topic.id);
  const lab=topic.learning.kind==='laboratory';
  const challenge=challengeFor(topic.id);
  return <div className={`topic-workspace station-frame${lab?' topic-workspace--lab':''}`}>
    <header className="topic-navigation station-bar">
      <div className="topic-path"><Link to="/lab">← Lab room</Link><span aria-hidden="true">/</span><span>{field?<>{field.title} › </>:null}{place?<>{place.module.title} › </>:null}{chapter?chapter.title:null}</span></div>
      <div className="topic-navigation-controls"><span className={`topic-evidence-state${topic.completed?' is-completed':''}`}><i aria-hidden="true"/>{topic.completed?'Completed':'Not completed yet'}</span><label><span className="sr-only">Jump to station</span><select value={topic.id} onChange={event=>navigate(topics.find(item=>item.id===event.target.value).href)}>{topics.map(item=><option key={item.id} value={item.id}>{String(item.order).padStart(2,'0')} / {item.title}</option>)}</select></label><div className="topic-arrows">{topics[index-1]?<Link to={topics[index-1].href} aria-label={`Previous station: ${topics[index-1].title}`} title={topics[index-1].title}>←</Link>:<span aria-hidden="true">←</span>}{topics[index+1]?<Link to={topics[index+1].href} aria-label={`Next station: ${topics[index+1].title}`} title={topics[index+1].title}>→</Link>:<span aria-hidden="true">→</span>}</div></div>
    </header>
    {challenge&&<section className="station-challenge" aria-label="Your challenge"><span className="station-challenge-label">YOUR CHALLENGE · STATION {String(topic.order).padStart(2,'0')}</span><p>{challenge}</p></section>}
    {children}
  </div>;
}
