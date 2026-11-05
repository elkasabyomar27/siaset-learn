import { useEffect, useRef, useState } from 'react';

/**
 * Destructive, so it asks first: one click opens an inline confirmation that names what will be
 * cleared, with Cancel focused so a stray Enter or tap does nothing. Render with key={lessonId}.
 */
export default function LessonReset({title, onReset}) {
  const [state, setState] = useState('idle'), cancel = useRef(null), trigger = useRef(null);
  useEffect(() => { if (state === 'confirming') cancel.current?.focus(); }, [state]);
  function close() { setState('idle'); requestAnimationFrame(() => trigger.current?.focus()); }
  return <div className="lesson-reset">
    {state === 'confirming'
      ? <div className="lesson-reset-confirm" role="group" aria-labelledby="lesson-reset-question">
        <p id="lesson-reset-question"><b>Clear your answers for “{title}”?</b> The views you inspected and your answers will be removed, including on your other signed-in devices. This can’t be undone.</p>
        <div><button type="button" className="danger-button" onClick={() => { onReset(); setState('done'); }}>Clear my answers</button>
          <button type="button" ref={cancel} className="outline-button" onClick={close}>Cancel</button></div>
      </div>
      : <button type="button" ref={trigger} className="lesson-reset-trigger" onClick={() => setState('confirming')}>Reset this lesson…</button>}
    {state === 'done' && <p role="status">Lesson reset. You can start again from the top.</p>}
  </div>;
}
