import {cls} from './cls.js';

// "What to do next" line. Always rendered (even empty) so the live region exists
// before the first message, which screen readers need to announce it.
export function NextStep({children, className}) {
  return <div className={cls('ho-next', className)} role="status" aria-live="polite">{children}</div>;
}
