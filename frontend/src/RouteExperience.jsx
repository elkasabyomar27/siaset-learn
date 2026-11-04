import {useLayoutEffect, useRef} from 'react';
import {useLocation, useNavigationType} from 'react-router';
import {routePresentation} from './features/transposable-elements/routePresentation.js';

// Keep route accessibility separate from scientific and learner state.
export default function RouteExperience() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map());
  const previousIdentity = useRef(null);
  const {title, identity} = routePresentation(location.pathname, location.search);

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    document.title = `${title} | SIASET Learn`;
    const changed = previousIdentity.current !== null && previousIdentity.current !== identity;
    previousIdentity.current = identity;
    if (changed) {
      const heading = document.querySelector('#main-content h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({preventScroll: true});
      const position = navigationType === 'POP' && positions.current.get(location.key);
      window.scrollTo({left: position?.x ?? 0, top: position?.y ?? 0, behavior: 'instant'});
    }
    const remember = () => positions.current.set(location.key, {x: window.scrollX, y: window.scrollY});
    window.addEventListener('scroll', remember, {passive: true});
    return () => { remember(); window.removeEventListener('scroll', remember); };
  }, [identity, title, location.key, navigationType]);
  return null;
}
