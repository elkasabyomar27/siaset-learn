import { Link } from 'react-router';
import topics from '../features/transposable-elements/curriculum/topics.json' with { type: 'json' };
import { useProgress } from '../features/transposable-elements/useProgress.js';
import { topicCompleted } from '../features/transposable-elements/learnerRecords.js';
import { topicHref } from '../features/transposable-elements/curriculum/lessons.js';

export default function ContinueLearning() {
  const { progress, labs } = useProgress();
  const completed = topics.filter(topic => topicCompleted(topic, progress, labs)).length;
  const next = topics.find(topic => !topicCompleted(topic, progress, labs));
  return <section className="home-continue" aria-label="Continue your learning">
    <div><p className="eyebrow">{completed ? 'YOUR NEXT CHAPTER' : 'A GOOD PLACE TO START'}</p><h2>{next ? next.title : 'Every topic reviewed. Keep exploring.'}</h2><p>{completed ? `${completed} of ${topics.length} topics completed from recorded evidence.` : 'Begin with the foundations. All 15 topics are open to you.'} Progress stays in this browser.</p></div>
    <Link className="outline-button" to={next ? topicHref(next) : '/learn/transposable-elements'}>{completed && next ? 'Continue learning' : next ? 'Start learning' : 'Revisit curriculum'} <span aria-hidden="true">→</span></Link>
  </section>;
}
