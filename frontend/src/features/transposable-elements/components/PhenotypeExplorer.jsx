import { useId, useState } from 'react';
import { SITES, PROMOTER_INFO, BACKUP, MEDIUM, DEFAULT_PHENO, PHENO_GOALS, phenotypeChain } from '../phenotypeChain.js';
import { BenchStage, useStage } from '../hands-on/kit/BenchStage.jsx';
import { Draggable } from '../hands-on/kit/Draggable.jsx';
import { DemoHand } from '../hands-on/kit/DemoHand.jsx';
import { NextStep } from '../hands-on/kit/NextStep.jsx';
import { AssumptionChoices } from '../hands-on/kit/ChoiceChips.jsx';
import { useDemoHand, hitBox } from '../hands-on/kit/useDemoHand.js';
import { phenotypeIntent } from '../hands-on/intents/phenotype.js';
import '../hands-on/kit/geneticsScenes.css';
import './partsBench.css';

// Fixed pseudo-random colony positions so the plate looks natural but stays stable between renders.
const COLONIES = Array.from({length: 26}, (_, i) => {
  const a = i * 2.39996, r = 14 + (i * 37 % 46);
  return [80 + Math.cos(a) * r, 80 + Math.sin(a) * r, 3 + (i * 7 % 4)];
});

function Plate({ outcome }) {
  const shown = outcome === 'likely unchanged' ? COLONIES : outcome === 'likely altered' ? COLONIES.slice(0, 2) : COLONIES.slice(0, 12);
  return <svg className={`ph-plate ph-plate--${outcome.replace(' ', '-')}`} viewBox="0 0 160 160" role="img" aria-label={`Illustrative growth plate: ${outcome}`}>
    <circle cx="80" cy="80" r="74" className="ph-dish" />
    <circle cx="80" cy="80" r="66" className="ph-agar" />
    {shown.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className="ph-colony" style={{animationDelay: `${i * 30}ms`}} />)}
    {outcome === 'undetermined' && <text x="80" y="96" textAnchor="middle" className="ph-unknown">?</text>}
  </svg>;
}

// Gene sites on the DNA, in SVG units.
const VIEW_W = 640, VIEW_H = 220, DNA_Y = 150;
const SITE_AT = {regulatory: {x: 40, w: 120, label: 'promoter'}, coding: {x: 180, w: 280, label: 'enzyme coding region'}, intergenic: {x: 490, w: 120, label: 'intergenic'}};
const SITE_NAME = {regulatory: 'the enzyme’s promoter', coding: 'the enzyme’s coding region', intergenic: 'an intergenic site'};
const centre = id => SITE_AT[id].x + SITE_AT[id].w / 2;

// The element is dragged onto a site of the gene; where it lands is the insertion site.
function PhenoScene({ site, onGesture, setNote }) {
  const {scale} = useStage();
  const [over, setOver] = useState(null);
  const {demo, activity, drag} = useDemoHand('drag', site);
  const zones = Object.entries(SITE_AT).map(([id, z]) => ({id, label: SITE_NAME[id], contains: (x, y) => x >= z.x && x <= z.x + z.w && y >= DNA_Y - 70 && y <= DNA_Y + 50}));
  return <>
    <text className="gx-small" x="12" y="18">ELEMENT: drag it onto a site of the gene</text>
    <line className="gx-dna" x1="20" x2="620" y1={DNA_Y + 15} y2={DNA_Y + 15} />
    {Object.entries(SITE_AT).map(([id, z]) => <g key={id}>
      <rect className={id === 'intergenic' ? 'gx-zone' : id === 'coding' ? 'gx-piece gx-piece-gene' : 'gx-piece gx-piece-tir'} data-over={over === id} x={z.x} y={DNA_Y} width={z.w} height="30" rx="7" style={id === 'intergenic' ? undefined : {opacity: 0.85}} />
      <text className="gx-text" x={z.x + z.w / 2} y={DNA_Y + 20} textAnchor="middle">{z.label}</text>
    </g>)}
    {over && <rect className="gx-zone" data-over="true" x={SITE_AT[over].x - 4} y={DNA_Y - 70} width={SITE_AT[over].w + 8} height="124" rx="12" />}
    <Draggable className="gx-element" x={centre(site)} y={DNA_Y - 36} zones={zones} hit={hitBox(96, 40, scale)} expected={false}
      label={`Element: inserted in ${SITE_NAME[site]}. Drag it onto the promoter, the coding region or the intergenic site`}
      carriedLabel="Carrying the element. Press Enter to drop it, arrow keys to choose a site"
      onCarry={drag} onOver={setOver} onAnnounce={t => t && setNote(`Drop on: ${t}.`)} onCancel={() => setNote('The element is back where it was.')}
      onDrop={({zone}) => { setOver(null); activity(); const p = onGesture({kind: 'drop', part: 'element', target: zone}); if (p) setNote(`The element sits in ${SITE_NAME[p.site]}.`); }}>
      <rect className="gx-piece gx-piece-element" x="-48" y="-20" width="96" height="40" rx="8" /><text className="gx-text" y="5" textAnchor="middle">element</text>
    </Draggable>
    <DemoHand show={demo.show} still={demo.still} from={{x: centre(site), y: DNA_Y - 36}} to={{x: centre(site === 'coding' ? 'regulatory' : 'coding'), y: DNA_Y + 15}} text="Drag the element onto another site" labelAt={{x: 320, y: 100}} />
  </>;
}

export default function PhenotypeExplorer() {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [input, setInput] = useState(DEFAULT_PHENO);
  const [reached, setReached] = useState(() => new Set());
  const [note, setNote] = useState('');
  const result = phenotypeChain(input);
  const set = patch => setInput(prev => {
    const next = {...prev, ...patch}, r = phenotypeChain(next);
    setReached(seen => { const add = PHENO_GOALS.filter(g => g.done(r) && !seen.has(g.id)); return add.length ? new Set([...seen, ...add.map(g => g.id)]) : seen; });
    return next;
  });
  const onGesture = g => { const p = phenotypeIntent(g); if (p) set(p); return p; };
  const steps = [
    {title: 'Molecular change', state: result.molecular.state, text: result.molecular.text},
    {title: 'Pathway function', state: result.pathway.state, text: result.pathway.text},
    {title: 'Phenotype in this assay', state: result.phenotype.outcome.replace(' ', '-'), text: result.phenotype.text, outcome: result.phenotype.outcome},
  ];

  return <section className="lesson-section parts-bench" aria-labelledby={`${uid}-title`}>
    <p className="eyebrow">HANDS-ON · FROM INSERTION TO PHENOTYPE</p>
    <h2 id={`${uid}-title`}>A broken gene is not yet a changed trait.</h2>
    <p className="pb-goal">A hypothetical haploid bacterium makes a nutrient with one enzyme. Drag the element to where it lands, set what you know, then follow the chain of reasoning to the growth test.</p>

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>THE GENE · DRAG THE ELEMENT TO A SITE</span><span>{SITES[input.site]}</span></div>
      <div className="gx-scroll" style={{'--gx-min': `${VIEW_W}px`}}>
        <BenchStage variant="molecular" className="gx-stage" width={VIEW_W} height={VIEW_H}
          label={`Gene bench. The element is inserted ${SITES[input.site].toLowerCase()}. Drag it onto the promoter, the coding region or an intergenic site.`}
          after={<NextStep className="gx-note">{note || 'Drag the element onto a site, then set what you know.'}</NextStep>}>
          <PhenoScene site={input.site} onGesture={onGesture} setNote={setNote} />
        </BenchStage>
      </div>
    </figure>

    <AssumptionChoices values={input} onChange={(key, value) => onGesture({kind: 'assume', control: key, value})}
      items={[
        ...(input.site === 'regulatory' ? [{key: 'promoterInfo', label: 'Promoter information', options: PROMOTER_INFO}] : []),
        {key: 'backup', label: 'Backup enzyme', options: BACKUP, disabled: input.site === 'intergenic'},
        {key: 'medium', label: 'Growth test', options: MEDIUM},
      ]} />

    <figure className="pb-stage">
      <div className="pb-stage-head"><span>REASONING CHAIN · EACH STEP NEEDS AN ASSUMPTION</span><span>{result.maskedLoss ? 'Molecular loss hidden in growth' : ''}</span></div>
      <div className="ph-layout">
        <ol className="ph-chain" aria-label="Reasoning chain">{steps.map((st, i) => <li key={st.title} className={`ph-step ph-step--${st.state}`}><span className="ph-num" aria-hidden="true">{i + 1}</span><div><b>{st.title}{st.outcome && `: ${st.outcome}`}</b><p>{st.text}</p></div></li>)}</ol>
        <div className="ph-plate-wrap"><Plate outcome={result.phenotype.outcome} /><small>Illustrative growth plate</small></div>
      </div>
      <figcaption>Hypothetical contexts; no real gene identity or quantitative growth prediction.</figcaption>
    </figure>

    <div className={`pb-verdict ${result.phenotype.outcome === 'likely altered' ? 'is-bad' : result.phenotype.outcome === 'likely unchanged' ? 'is-good' : ''}`} role="status" aria-live="polite"><b>Phenotype: {result.phenotype.outcome}.</b> {result.phenotype.text}{result.maskedLoss && ' The gene is still broken: the plate just cannot show it.'}</div>

    <section className="pb-goals" aria-label="Goals"><p className="eyebrow">GOALS · {reached.size} / {PHENO_GOALS.length}</p>
      <ul>{PHENO_GOALS.map(g => <li key={g.id} className={reached.has(g.id) ? 'done' : ''}><span aria-hidden="true">{reached.has(g.id) ? '✓' : '○'}</span>{g.title}<span className="sr-only">{reached.has(g.id) ? ' (done)' : ' (not yet)'}</span></li>)}</ul>
    </section>
    <p className="quiet">Practice only; it doesn’t change lesson completion.</p>
  </section>;
}
