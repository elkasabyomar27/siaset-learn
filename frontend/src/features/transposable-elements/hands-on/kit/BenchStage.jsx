import {createContext, useContext, useEffect, useId, useMemo, useRef, useState} from 'react';
import {HandsOnDefs, defIds, safeId} from './HandsOnDefs.jsx';
import {cls} from './cls.js';
import './handsOn.css';

const StageContext = createContext({scale: 1, width: 0, height: 0, ids: defIds('ho')});

// {scale, width, height, ids}: scale = rendered px per viewBox unit; ids = this
// stage's HandsOnDefs ids (use with url() from HandsOnDefs.jsx).
export const useStage = () => useContext(StageContext);

/**
 * Stage for a hands-on scene. variant "molecular" = dark molecular stage;
 * "bench" = 3/4 bench with a perspective floor behind upright objects.
 * Children are SVG content in a width x height viewBox; the SVG fills the
 * container's width (no horizontal scroll) and includes this stage's HandsOnDefs.
 * `after` renders HTML below the SVG (e.g. <NextStep>).
 */
export function BenchStage({variant = 'molecular', width, height, label, className, children, after}) {
  const prefix = safeId(useId());
  const box = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setScale(entry.contentRect.width / width); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  const value = useMemo(() => ({scale, width, height, ids: defIds(prefix)}), [scale, width, height, prefix]);
  return <div ref={box} className={cls('ho-stage', variant === 'bench' ? 'ho-bench' : 'ho-molecular', className)}>
    {variant === 'bench' && <div className="ho-floor" aria-hidden="true" />}
    <svg className="ho-svg" viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet" role="group" aria-label={label}>
      <HandsOnDefs idPrefix={prefix} width={width} height={height} />
      <StageContext.Provider value={value}>{children}</StageContext.Provider>
    </svg>
    {after}
  </div>;
}
