import topics from './curriculum/topics.json' with {type:'json'};
import {experimentFromParams} from './experimentRouting.js';

export function routePresentation(pathname, search = '') {
  pathname = pathname.replace(/\/+$/, '') || '/';
  const learn = '/learn/transposable-elements';
  const lab = '/lab/transposable-elements';
  if (pathname === '/') return {title: 'Overview', section: null, identity: '/'};
  if (pathname === lab) {
    const experiment = experimentFromParams(new URLSearchParams(search));
    return {title: `${experiment === 'tn3' ? 'Tn3 replicative' : 'Tn5 conservative'} guided laboratory`, section: 'labs', identity: `${lab}?experiment=${experiment}`};
  }
  const pages = {
    '/account': ['Your account', null],
    '/auth/callback': ['Verify sign-in', null],
    '/auth/recovery': ['Password recovery', null],
    [learn]: ['Transposable elements curriculum', 'curriculum'],
    [`${lab}/sandbox`]: ['Sandbox', 'sandbox'],
    [`${learn}/assessment`]: ['Cumulative assessment', 'assessment'],
    [`${learn}/progress`]: ['Your learning progress', 'progress'],
    '/teach': ['Teach', null],
    '/teach/approve': ['Review teacher request', null],
    '/classes': ['My classes', null],
    '/play': ['Join a live quiz', null],
  };
  if (pathname.startsWith('/teach/live/')) return {title: 'Live quiz host', section: null, identity: pathname};
  if (pathname.startsWith('/play/')) return {title: 'Live quiz', section: null, identity: pathname};
  const page = pages[pathname];
  if (page) return {title: page[0], section: page[1], identity: pathname};
  const topic = topics.find(t => t.lessonId && pathname === `${learn}/${t.id}`);
  return {title: topic ? `${topic.title} — Lesson ${topic.order}` : 'Page not found', section: topic ? 'curriculum' : null, identity: pathname};
}
