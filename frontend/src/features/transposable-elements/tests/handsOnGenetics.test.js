import test, {describe, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {SYSTEMS} from '../mobilityGates.js';
import {mobilityIntent, controlKind} from '../hands-on/intents/mobility.js';
import {kernelIntent} from '../hands-on/intents/kernel.js';
import {anatomyIntent} from '../hands-on/intents/anatomy.js';
import {ANATOMY_CASES, LABELS, correctBoundaries, transposaseDirection, checkDissection} from '../anatomyLab.js';
import {classificationIntent, cellId} from '../hands-on/intents/classification.js';
import {CLASS_CARDS, checkPlacement} from '../classificationSort.js';
import {copyLedgerIntent} from '../hands-on/intents/copyLedger.js';
import {LANES, COPY_CHOICES, copyFeedback} from '../copyLedger.js';
import {elementBuilderIntent, applyBuilderAction} from '../hands-on/intents/elementBuilder.js';
import {IS_PARTS, canAdd} from '../mobileElementBuilder.js';
import {compositeIntent} from '../hands-on/intents/composite.js';
import {MODULES, CARGO, END_CHOICES, REFERENCE, arrangement, matchElement} from '../compositeBuilder.js';
import {trackStep} from '../hands-on/gestures/track.js';
import {timingFromDegrees} from '../hands-on/intents/kernel.js';
import {recombinationIntent} from '../hands-on/intents/recombination.js';
import {ORIENTATIONS, SUBSTRATES, recombine} from '../recombinationLab.js';
import {phenotypeIntent} from '../hands-on/intents/phenotype.js';
import {SITES, PROMOTER_INFO, BACKUP, MEDIUM, DEFAULT_PHENO, phenotypeChain} from '../phenotypeChain.js';
import {operonIntent} from '../hands-on/intents/operon.js';
import {SLOTS, TE_PROMOTER, DEFAULT_OPERON, simulateOperon} from '../operonModel.js';
import {tsdIntent, fillGap} from '../hands-on/intents/tsd.js';
import {STAGGER_RANGE, HOST_LENGTH, clampCut, validSetup, tsdLayout, PRESETS} from '../tsdJourney.js';
import {hgtIntent} from '../hands-on/intents/hgt.js';
import {PREREQS, newHgt, setPrereq, act} from '../hgtLab.js';
import {startSsr} from './helpers/ssr.js';

const COMP = n => `/src/features/transposable-elements/components/${n}.jsx`;
const buttons = html => [...html.matchAll(/<g[^>]*role="button"[^>]*aria-label="([^"]*)"/g)].map(m => m[1]);
const noControlRow = html => {
  assert.doesNotMatch(html, /type="range"/);
  assert.doesNotMatch(html, /<button[^>]*class="[^"]*outline-button/, 'no outline-button lab row outside commitments');
};

describe('MobilityGates', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('MobilityGates'))).default; html = ssr.html(C, {mode: 'intro'}); });
  after(() => ssr.close());

  test('MobilityGates: gestures reach every option', () => {
    for (const [sys, def] of Object.entries(SYSTEMS)) {
      for (const c of def.controls) {
        const kind = controlKind(c);
        if (c.type === 'choice') {
          for (const v of Object.keys(c.options)) assert.deepEqual(mobilityIntent({kind: 'drop', target: 'cell', control: c.key, option: v}, def.defaults), {[c.key]: v}, `${sys}.${c.key}=${v}`);
          assert.equal(mobilityIntent({kind: 'drop', target: 'tray', control: c.key, option: 'Ac'}, {}), null);
        } else if (kind === 'assumption') {
          for (const v of [true, false]) assert.deepEqual(mobilityIntent({kind: 'assume', control: c.key, value: v}), {[c.key]: v});
          assert.match(c.key, /^(permissive|assume)/);
        } else if (kind === 'switch') {
          for (const cur of [true, false]) assert.deepEqual(mobilityIntent({kind: 'tap', target: 'switch', control: c.key}, {[c.key]: cur}), {[c.key]: !cur});
        } else {
          assert.deepEqual(mobilityIntent({kind: 'drop', target: 'cell', control: c.key}, {}), {[c.key]: true});
          assert.deepEqual(mobilityIntent({kind: 'drop', target: 'tray', control: c.key}, {}), {[c.key]: false});
        }
      }
    }
    assert.equal(mobilityIntent(null), null);
    assert.equal(mobilityIntent({kind: 'swipe', control: 'x'}), null);
  });

  test('MobilityGates: the old toggle row is gone and the cell has labelled targets', () => {
    assert.doesNotMatch(html, /mg-toggle/);
    noControlRow(html.replace(/<div class="cb-control mg-systems"[\s\S]*?<\/div><\/div>/, ''));
    const labels = buttons(html);
    assert.ok(labels.some(l => /Ac \(intact transposase gene\)/.test(l)));
    assert.ok(labels.some(l => /Active Ac elsewhere supplies protein in trans/.test(l)));
    assert.match(html, /<legend>Assumptions<\/legend>/);
    assert.match(html, /Assume permissive host conditions/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Maize Ac\/Ds cell/);
    assert.match(html, /Practice only/);
  });
});

describe('KernelGrower', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('KernelGrower'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('KernelGrower: gestures reach every option', () => {
    assert.deepEqual(kernelIntent({kind: 'drop', target: 'genome'}), {ac: true});
    assert.deepEqual(kernelIntent({kind: 'drop', target: 'outside'}), {ac: false});
    // Every old slider value 0, 0.05 ... 1 is reachable from a position on the clock.
    for (let i = 0; i <= 20; i++) {
      const want = i / 20, deg = Math.min(359, Math.round(want * 360));
      assert.equal(kernelIntent({kind: 'track', value: deg}, {ac: true}).timing, want, `timing ${want}`);
    }
    assert.equal(kernelIntent({kind: 'track', value: 90}, {ac: false}), null, 'the old slider was disabled without Ac');
    assert.deepEqual(kernelIntent({kind: 'hold', target: 'kernel'}, {ac: true, prediction: 'large', growing: false}), {grow: true});
    assert.equal(kernelIntent({kind: 'hold', target: 'kernel'}, {ac: true, prediction: null}), null, 'no prediction: refused');
    assert.equal(kernelIntent({kind: 'hold', target: 'kernel'}, {prediction: 'large', growing: true}), null, 'still growing: refused');
  });

  test('KernelGrower: the checkbox, slider and grow button are gone; targets are labelled', () => {
    assert.doesNotMatch(html, /type="checkbox"/);
    assert.doesNotMatch(html, /<button[^>]*primary-button/);
    assert.doesNotMatch(html, /Grow the kernel/);
    const labels = buttons(html);
    assert.ok(labels.some(l => /^Ac element/.test(l)));
    assert.ok(labels.some(l => /^Excision timing/.test(l)));
    assert.ok(labels.some(l => /^Hold to grow the kernel/.test(l)));
    assert.match(html, /<fieldset class="tsd-predict">/, 'the prediction stays a question');
    assert.match(html, /role="img" aria-label="A colourless kernel, not grown yet\."/);
    assert.match(html, /Practice only/);
  });
});

describe('AnatomyLab', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('AnatomyLab'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('AnatomyLab: gestures reach every option', () => {
    for (const c of ANATOMY_CASES) {
      let w = {left: null, right: null, labels: {}, direction: null};
      const apply = g => { const p = anatomyIntent(g, w); assert.ok(p, JSON.stringify(g)); w = {...w, ...p}; return p; };
      // Every gap takes either bracket, as {left: g} / {right: g}.
      for (let g = 0; g <= c.segments.length; g++) for (const b of ['left', 'right']) assert.deepEqual(anatomyIntent({kind: 'drop', target: 'gap', index: g, bracket: b}, w), {[b]: g});
      // Every label on every segment, as the old per-label button wrote it.
      c.segments.forEach((_, i) => Object.keys(LABELS).forEach(tag => assert.deepEqual(anatomyIntent({kind: 'drop', target: 'segment', index: i, tag}, {labels: {}}), {labels: {[i]: tag}})));
      // A full correct dissection by gestures alone is graded as solved.
      const [L, R] = correctBoundaries(c);
      apply({kind: 'drop', target: 'gap', index: L, bracket: 'left'}); apply({kind: 'drop', target: 'gap', index: R, bracket: 'right'});
      c.segments.forEach((s, i) => apply({kind: 'drop', target: 'segment', index: i, tag: s.kind}));
      const want = transposaseDirection(c);
      for (let n = 0; n < 2 && w.direction !== want; n++) apply({kind: 'swipe', target: 'arrow'}); // a swipe flips the reading
      assert.equal(w.direction, want);
      assert.equal(checkDissection(c, w).allOk, true, c.id);
      // A wrong tag still reaches the model, which then marks it wrong.
      const wrong = anatomyIntent({kind: 'drop', target: 'segment', index: 0, tag: 'cargo'}, w).labels;
      assert.equal(checkDissection(c, {...w, labels: wrong}).labelResults[0], false);
    }
    assert.equal(anatomyIntent({kind: 'tap', target: 'segment', index: 3}).selected, 3);
    assert.equal(anatomyIntent({kind: 'drop', target: 'gap', index: 1, bracket: 'middle'}), null);
  });

  test('AnatomyLab: the label, gap and direction buttons are gone; targets are labelled', () => {
    assert.doesNotMatch(html, /class="al-gap/);
    assert.doesNotMatch(html, /class="al-labels"/);
    assert.doesNotMatch(html, /al-direction/);
    assert.doesNotMatch(html, /Rightward|Leftward/);
    const labels = buttons(html);
    assert.equal(labels.filter(l => /^Name tag:/.test(l)).length, Object.keys(LABELS).length);
    assert.equal(labels.filter(l => /^Segment \d/.test(l)).length, ANATOMY_CASES[0].segments.length);
    assert.ok(labels.some(l => /^Left bracket/.test(l)) && labels.some(l => /^Right bracket/.test(l)));
    assert.ok(labels.some(l => /^Transposase reading direction/.test(l)));
    assert.match(html, /Check my dissection/, 'Check stays a button');
    assert.match(html, /Practice only/);
  });
});

describe('ClassificationSort', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('ClassificationSort'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('ClassificationSort: gestures reach every option', () => {
    for (const card of CLASS_CARDS) for (const cls of ['I', 'II']) for (const copies of ['increase', 'same']) {
      const place = classificationIntent({kind: 'drop', card: card.id, target: cellId(cls, copies)});
      assert.deepEqual(place, {card: card.id, cls, copies});
      // Right or wrong, the drop reaches the model, which answers a wrong one with its hint.
      const r = checkPlacement(place.card, place.cls, place.copies);
      assert.equal(r.correct, card.cls === cls && card.copies === copies);
      assert.ok(r.text.length > 10);
    }
    assert.equal(classificationIntent({kind: 'drop', card: 'ty', target: 'tray'}), null);
    assert.equal(classificationIntent({kind: 'tap', card: 'ty', target: 'I-same'}), null);
  });

  test('ClassificationSort: select-then-click cells are gone; every card is a labelled target', () => {
    assert.doesNotMatch(html, /class="cs-cell/);
    assert.doesNotMatch(html, /cs-tray/);
    assert.doesNotMatch(html, /<button[^>]*aria-pressed/);
    const labels = buttons(html);
    assert.equal(labels.filter(l => /Drag it into a grid cell/.test(l)).length, CLASS_CARDS.length);
    assert.ok(labels.some(l => /^Ty \(yeast\)/.test(l)));
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Classification grid/);
    assert.match(html, /Practice only/);
  });
});

describe('CopyLedger', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('CopyLedger'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('CopyLedger: gestures reach every option', () => {
    // Holding the crank advances once a guess exists, for every guess; without one it is refused.
    for (const lane of Object.keys(LANES)) for (const guess of COPY_CHOICES) {
      assert.deepEqual(copyLedgerIntent({kind: 'hold', target: 'crank'}, {guess}), {type: 'advance'});
      // The feedback the advance produces is the engine's, for that guess.
      assert.equal(typeof copyFeedback(lane, 1, guess).correct, 'boolean');
    }
    assert.equal(copyLedgerIntent({kind: 'hold', target: 'crank'}, {guess: null}), null);
    assert.equal(copyLedgerIntent({kind: 'tap', target: 'crank'}, {guess: 1}), null);
    assert.equal(copyLedgerIntent({kind: 'hold', target: 'gear'}, {guess: 1}), null);
  });

  test('CopyLedger: the advance button is gone; each lane has a labelled crank and keeps its question', () => {
    assert.doesNotMatch(html, /<button[^>]*primary-button/);
    assert.doesNotMatch(html, /Transpose →|Replicate →/);
    const labels = buttons(html);
    assert.equal(labels.filter(l => /^Hold the crank/.test(l)).length, 2);
    assert.equal((html.match(/<fieldset class="tsd-predict">/g) || []).length, 2, 'the guess stays a question');
    assert.match(html, /Predict copies after/);
    assert.match(html, /Practice only/);
  });
});

describe('MobileElementBuilder', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('MobileElementBuilder'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  // What the old buttons did, kept here as the reference.
  const oldAdd = (t, kind) => canAdd(t, kind) ? [...t, kind] : t;
  const oldMove = (t, i, d) => { const j = i + d; if (j < 0 || j >= t.length) return t; const n = [...t]; [n[i], n[j]] = [n[j], n[i]]; return n; };

  test('MobileElementBuilder: gestures reach every option', () => {
    // Add: every part, gated by canAdd (track limit and two ends).
    let t = [];
    for (const kind of ['end', 'transposase', 'cargo', 'host', 'end', 'end']) {
      const a = elementBuilderIntent({kind: 'drop', source: 'bin', part: kind, target: 'rail'}, t);
      assert.equal(!!a, canAdd(t, kind), `add ${kind} to ${t.length}`);
      t = applyBuilderAction(t, a);
    }
    assert.deepEqual(t, ['end', 'transposase', 'cargo', 'host', 'end'].slice(0, 5));
    assert.equal(elementBuilderIntent({kind: 'drop', source: 'bin', part: 'host', target: 'rail'}, t), null, 'full track refuses');
    assert.equal(elementBuilderIntent({kind: 'drop', source: 'bin', part: 'end', target: 'off'}, []), null);
    // Reorder from any index to any slot equals the repeated adjacent moves.
    const base = ['end', 'transposase', 'cargo', 'host', 'end'];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const a = elementBuilderIntent({kind: 'drop', source: 'tile', index: i, target: 'slot', slot: j}, base);
      if (i === j) { assert.equal(a, null); continue; }
      let want = base; for (let k = i; k !== j; k += j > i ? 1 : -1) want = oldMove(want, k, j > i ? 1 : -1);
      assert.deepEqual(applyBuilderAction(base, a), want, `${i}->${j}`);
    }
    // Remove: dragging any tile off the track equals the old × button.
    for (let i = 0; i < 5; i++) assert.deepEqual(applyBuilderAction(base, elementBuilderIntent({kind: 'drop', source: 'tile', index: i, target: 'off'}, base)), base.filter((_, n) => n !== i));
    assert.deepEqual(oldAdd([], 'end'), applyBuilderAction([], {type: 'add', kind: 'end'}));
    assert.equal(elementBuilderIntent({kind: 'drop', source: 'tile', index: 9, target: 'off'}, base), null);
  });

  test('MobileElementBuilder: the part and arrow buttons are gone; Test stays a button', () => {
    assert.doesNotMatch(html, /pb-part-button|pb-palette|pb-tile-tools/);
    assert.doesNotMatch(html, /Move .* (left|right)|aria-label="Remove /);
    const labels = buttons(html);
    for (const part of Object.values(IS_PARTS)) assert.ok(labels.some(l => l.startsWith(part.label)), part.label);
    assert.match(html, /Test: can it move\?/);
    assert.match(html, /Clear track/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="DNA track with 0 of 5 parts/);
    assert.match(html, /Practice only/);
  });
});

describe('CompositeBuilder', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('CompositeBuilder'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('CompositeBuilder: gestures reach every option', () => {
    const design = {module: 'IS50', left: 1, right: -1, cargo: 'tet'};
    for (const m of MODULES) for (const side of ['left', 'right']) assert.deepEqual(compositeIntent({kind: 'drop', part: 'module', module: m, target: side}, design), {module: m});
    for (const id of Object.keys(CARGO)) assert.deepEqual(compositeIntent({kind: 'drop', part: 'cargo', cargo: id, target: 'cargo'}, design), {cargo: id});
    for (const id of Object.keys(END_CHOICES)) assert.deepEqual(compositeIntent({kind: 'drop', part: 'transposase', target: `ends-${id}`}, design), {ends: id});
    // Flip: both signs reach both sides, as the old Flip buttons.
    for (const side of ['left', 'right']) for (const sign of [1, -1]) assert.deepEqual(compositeIntent({kind: 'swipe', target: side}, {...design, [side]: sign}), {[side]: -sign});
    // Rebuilding every classical element by gestures alone reaches its match.
    for (const [name, r] of Object.entries(REFERENCE)) {
      let d = {module: 'IS1', left: 1, right: 1, cargo: 'kan'};
      const apply = p => { d = {...d, ...p}; };
      apply(compositeIntent({kind: 'drop', part: 'module', module: r.module, target: 'left'}, d));
      apply(compositeIntent({kind: 'drop', part: 'cargo', cargo: r.cargo, target: 'cargo'}, d));
      if (arrangement(d) !== r.arrangement) apply(compositeIntent({kind: 'swipe', target: 'right'}, d));
      assert.equal(matchElement(d), name);
    }
    assert.equal(compositeIntent({kind: 'drop', part: 'module', module: 'IS99', target: 'left'}, design), null);
    assert.equal(compositeIntent({kind: 'drop', part: 'transposase', target: 'ends-inner'}, design), null);
    assert.equal(compositeIntent({kind: 'swipe', target: 'cargo'}, design), null);
  });

  test('CompositeBuilder: the module, cargo, ends and flip buttons are gone; Run stays a button', () => {
    assert.doesNotMatch(html, /aria-label="(IS module type|Module directions|Cargo|Ends used by transposase)"/);
    assert.doesNotMatch(html, /Flip left|Flip right/);
    const labels = buttons(html);
    assert.equal(labels.filter(l => /^IS module IS/.test(l)).length, MODULES.length);
    assert.equal(labels.filter(l => /^Cargo gene/.test(l)).length, Object.keys(CARGO).length);
    assert.ok(labels.some(l => /^Left IS module/.test(l)) && labels.some(l => /^Right IS module/.test(l)));
    assert.ok(labels.some(l => /^Transposase: acting on/.test(l)));
    assert.match(html, /Run transposase/);
    assert.match(html, /aria-label="Choose an element to rebuild"/, 'the target choice stays tabs');
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="IS50 module/);
    assert.match(html, /Practice only/);
  });
});

describe('KernelGrower timing track', () => {
  test('KernelGrower: the timing track stops at both ends instead of wrapping', () => {
    const opts = {step: 18, bigStep: 54, wrap: false};
    assert.equal(timingFromDegrees(trackStep(342, 'ArrowRight', opts)), 1, '0.95 plus a step is 1, not 0');
    assert.equal(timingFromDegrees(trackStep(359, 'ArrowRight', opts)), 1);
    assert.equal(timingFromDegrees(trackStep(0, 'ArrowLeft', opts)), 0);
    assert.equal(timingFromDegrees(trackStep(342, 'Shift+ArrowRight', opts)), 1);
    // The same step wraps on a clock, which is why the kernel timeline opts out.
    assert.equal(timingFromDegrees(trackStep(342, 'ArrowRight', {step: 18, bigStep: 54})), 0);
  });
  test('KernelGrower: the scene turns wrapping off and the Track passes it on', async () => {
    const fs = await import('node:fs');
    assert.match(fs.readFileSync(new URL('../components/KernelGrower.jsx', import.meta.url), 'utf8'), /wrap=\{false\}/);
    assert.match(fs.readFileSync(new URL('../hands-on/kit/Track.jsx', import.meta.url), 'utf8'), /startTrack, \{cx, cy, value, step, bigStep, wrap\}/);
  });
});

describe('RecombinationLab', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('RecombinationLab'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('RecombinationLab: gestures reach every option', () => {
    // Orientation: a swipe flips from either side, so both values are reachable.
    for (const o of Object.keys(ORIENTATIONS)) assert.deepEqual(recombinationIntent({kind: 'swipe', target: 'copy2'}, {orientation: o}), {orientation: o === 'direct' ? 'inverted' : 'direct'});
    for (const s of Object.keys(SUBSTRATES)) assert.deepEqual(recombinationIntent({kind: 'drop', part: 'substrate', substrate: s, target: 'stage'}), {substrate: s});
    for (const h of [true, false]) assert.deepEqual(recombinationIntent({kind: 'assume', control: 'homology', value: h}), {homology: h});
    // Every old (orientation, substrate, homology) combination is reachable and runs the model with those inputs.
    for (const o of Object.keys(ORIENTATIONS)) for (const s of Object.keys(SUBSTRATES)) for (const h of [true, false]) {
      let cur = {orientation: 'direct', substrate: 'intramolecular', homology: true};
      if (cur.orientation !== o) cur = {...cur, ...recombinationIntent({kind: 'swipe', target: 'copy2'}, cur)};
      cur = {...cur, ...recombinationIntent({kind: 'drop', part: 'substrate', substrate: s, target: 'stage'}, cur), ...recombinationIntent({kind: 'assume', control: 'homology', value: h}, cur)};
      assert.deepEqual(cur, {orientation: o, substrate: s, homology: h});
      assert.deepEqual(recombinationIntent({kind: 'drop', part: 'copy', target: 'copy2'}, cur), {run: true});
      assert.equal(typeof recombine(cur).ok, 'boolean');
    }
    assert.equal(recombinationIntent({kind: 'drop', part: 'substrate', substrate: 'nonsense', target: 'stage'}), null);
    assert.equal(recombinationIntent({kind: 'drop', part: 'copy', target: 'stage'}), null);
    assert.equal(recombinationIntent({kind: 'swipe', target: 'copy1'}, {}), null);
    assert.equal(recombinationIntent(null), null);
  });

  test('RecombinationLab: the old buttons are gone; targets are labelled', () => {
    assert.doesNotMatch(html, /Recombine →/);
    assert.doesNotMatch(html, /aria-label="(Second copy direction|Where the copies pair)"/);
    assert.doesNotMatch(html, /<button[^>]*class="[^"]*(outline-button|primary-button)/);
    assert.doesNotMatch(html, /type="range"/);
    const labels = buttons(html);
    assert.ok(labels.some(l => /^Second copy points/.test(l)));
    assert.equal(labels.filter(l => /^Substrate card:/.test(l)).length, 2);
    assert.ok(labels.some(l => /^First TE copy\. Drag it onto the second copy/.test(l)));
    assert.match(html, /<legend>Assumptions<\/legend>/);
    assert.match(html, /similar enough to pair/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Recombination bench/);
    assert.match(html, /role="status"/);
    assert.match(html, /Practice only/);
  });
});

describe('PhenotypeExplorer', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('PhenotypeExplorer'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('PhenotypeExplorer: gestures reach every option', () => {
    for (const site of Object.keys(SITES)) assert.deepEqual(phenotypeIntent({kind: 'drop', part: 'element', target: site}), {site});
    for (const [control, options] of Object.entries({promoterInfo: PROMOTER_INFO, backup: BACKUP, medium: MEDIUM}))
      for (const value of Object.keys(options)) assert.deepEqual(phenotypeIntent({kind: 'assume', control, value}), {[control]: value});
    // Every old button combination is reachable, and the model gets exactly that input.
    for (const site of Object.keys(SITES)) for (const promoterInfo of Object.keys(PROMOTER_INFO)) for (const backup of Object.keys(BACKUP)) for (const medium of Object.keys(MEDIUM)) {
      let cur = {...DEFAULT_PHENO};
      for (const g of [{kind: 'drop', part: 'element', target: site}, {kind: 'assume', control: 'promoterInfo', value: promoterInfo}, {kind: 'assume', control: 'backup', value: backup}, {kind: 'assume', control: 'medium', value: medium}]) cur = {...cur, ...phenotypeIntent(g)};
      assert.deepEqual(cur, {site, promoterInfo, backup, medium});
      assert.equal(typeof phenotypeChain(cur).phenotype.outcome, 'string');
    }
    assert.equal(phenotypeIntent({kind: 'drop', part: 'element', target: 'moon'}), null);
    assert.equal(phenotypeIntent({kind: 'assume', control: 'backup', value: 'maybe'}), null);
    assert.equal(phenotypeIntent({kind: 'assume', control: 'site', value: 'coding'}), null);
    assert.equal(phenotypeIntent(null), null);
  });

  test('PhenotypeExplorer: the site buttons are gone; the element is a labelled target and assumptions are chips', () => {
    assert.doesNotMatch(html, /aria-label="Insertion site"/);
    assert.doesNotMatch(html, /Inside the enzyme’s coding region<\/button>/);
    assert.ok(buttons(html).some(l => /^Element: inserted in the enzyme’s coding region/.test(l)));
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Gene bench/);
    assert.match(html, /aria-label="Assumptions"/);
    assert.match(html, /<legend>Backup enzyme<\/legend>/);
    assert.match(html, /<legend>Growth test<\/legend>/);
    assert.match(html, /role="img" aria-label="Illustrative growth plate/);
    assert.match(html, /Practice only/);
  });
});

describe('OperonExplorer', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('OperonExplorer'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('OperonExplorer: gestures reach every option', () => {
    // Slot: each real slot by dropping into it, "No insertion" by dropping the element back in the tray.
    for (const slot of Object.keys(SLOTS)) {
      const g = {kind: 'drop', part: 'element', target: slot === 'none' ? 'tray' : slot};
      assert.deepEqual(operonIntent(g, DEFAULT_OPERON), {slot});
    }
    // Outward promoter: a swipe cycles, so every value is reachable from every value (when an element is placed).
    const values = Object.keys(TE_PROMOTER);
    for (const from of values) for (const to of values) {
      let cur = {slot: 'geneA', tePromoter: from}, n = 0;
      while (cur.tePromoter !== to && n++ < 5) cur = {...cur, ...operonIntent({kind: 'swipe', target: 'promoter'}, cur)};
      assert.equal(cur.tePromoter, to, `${from} -> ${to}`);
    }
    assert.equal(operonIntent({kind: 'swipe', target: 'promoter'}, {slot: 'none', tePromoter: 'none'}), null, 'the old buttons were disabled without an element');
    // Pieces: terminator, B promoter, assumption, each both ways.
    const placed = {slot: 'between'};
    assert.deepEqual(operonIntent({kind: 'drop', part: 'terminator', target: 'te'}, placed), {terminator: true});
    assert.deepEqual(operonIntent({kind: 'drop', part: 'terminator', target: 'tray'}, placed), {terminator: false});
    assert.equal(operonIntent({kind: 'drop', part: 'terminator', target: 'te'}, {slot: 'none'}), null, 'the old checkbox was disabled without an element');
    assert.deepEqual(operonIntent({kind: 'drop', part: 'bPromoter', target: 'geneB'}, {slot: 'none'}), {bPromoter: true});
    assert.deepEqual(operonIntent({kind: 'drop', part: 'bPromoter', target: 'tray'}, {slot: 'none'}), {bPromoter: false});
    for (const v of [true, false]) assert.deepEqual(operonIntent({kind: 'assume', control: 'assumeNoHidden', value: v}), {assumeNoHidden: v});
    // Every old configuration is reachable and the model accepts it.
    for (const slot of Object.keys(SLOTS)) for (const tePromoter of values) for (const terminator of [true, false]) for (const bPromoter of [true, false]) {
      let cur = {...DEFAULT_OPERON};
      const go = g => { cur = {...cur, ...operonIntent(g, cur)}; };
      go({kind: 'drop', part: 'element', target: slot === 'none' ? 'tray' : slot});
      while (cur.tePromoter !== tePromoter && slot !== 'none') go({kind: 'swipe', target: 'promoter'});
      if (slot !== 'none') go({kind: 'drop', part: 'terminator', target: terminator ? 'te' : 'tray'});
      go({kind: 'drop', part: 'bPromoter', target: bPromoter ? 'geneB' : 'tray'});
      assert.equal(cur.slot, slot);
      assert.equal(cur.bPromoter, bPromoter);
      if (slot !== 'none') assert.deepEqual([cur.tePromoter, cur.terminator], [tePromoter, terminator]);
      assert.ok(simulateOperon(cur).genes.A);
    }
    assert.equal(operonIntent({kind: 'drop', part: 'element', target: 'none'}, {}), null);
    assert.equal(operonIntent(null), null);
  });

  test('OperonExplorer: slot, promoter and part controls are gone; the DNA has labelled targets', () => {
    assert.doesNotMatch(html, /aria-label="(Insertion site|Element outward promoter)"/);
    assert.doesNotMatch(html, /type="checkbox"[^>]*>\s*<span>Element has a terminator|Gene B has its own promoter<\/label>|Element has a terminator/);
    assert.doesNotMatch(html, /Outward promoter →<\/button>/);
    const labels = buttons(html);
    assert.ok(labels.some(l => /^Element: in the tray/.test(l)));
    assert.ok(labels.some(l => /^Terminator piece/.test(l)));
    assert.ok(labels.some(l => /^B promoter piece/.test(l)));
    assert.match(html, /<legend>Assumptions<\/legend>/);
    assert.match(html, /Assume no other promoters exist/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Operon bench/);
    assert.match(html, /Practice only/);
  });
});

describe('TsdBuilder', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('TsdBuilder'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  test('TsdBuilder: gestures reach every option', () => {
    // Every (stagger, cut) the two sliders could make: top mark to the cut, then bottom mark to cut + stagger.
    for (let stagger = STAGGER_RANGE[0]; stagger <= STAGGER_RANGE[1]; stagger++) for (let cut = 2; cut <= HOST_LENGTH - stagger - 2; cut++) {
      let cur = {cut: 2, stagger: 2, stage: 0};
      cur = {...cur, ...tsdIntent({kind: 'drop', part: 'cut', mark: 'top', pos: cut}, cur)};
      cur = {...cur, ...tsdIntent({kind: 'drop', part: 'cut', mark: 'bottom', pos: cut + stagger}, cur)};
      assert.deepEqual([cur.cut, cur.stagger], [cut, stagger], `${stagger}/${cut}`);
      assert.ok(validSetup(cur));
      assert.doesNotThrow(() => tsdLayout({cut: cur.cut, stagger: cur.stagger, stage: 3}));
    }
    // Wild drops are clamped exactly like the sliders were (stagger 2..10, clampCut).
    for (const pos of [-5, 0, 1, 19, 20, 99]) for (const mark of ['top', 'bottom']) {
      const p = tsdIntent({kind: 'drop', part: 'cut', mark, pos}, {cut: 4, stagger: 9});
      assert.ok(validSetup(p), `${mark} ${pos}`);
      assert.equal(p.cut, clampCut(p.cut, p.stagger));
    }
    // A mystery element keeps its hidden stagger: only the cut position can move.
    assert.deepEqual(tsdIntent({kind: 'drop', part: 'cut', mark: 'top', pos: 7}, {cut: 4, stagger: 6, locked: true}), {cut: 7, stagger: 6, stage: 1});
    assert.equal(tsdIntent({kind: 'drop', part: 'cut', mark: 'bottom', pos: 7}, {cut: 4, stagger: 6, locked: true}), null);
    // Presets stay chips and set the same stagger.
    assert.deepEqual(PRESETS.map(p => p.stagger), [9, 5]);
    // The old Next button, by gesture: still gated behind the prediction.
    assert.equal(tsdIntent({kind: 'drop', part: 'element', target: 'gap'}, {stage: 1, predicted: false}), null);
    assert.deepEqual(tsdIntent({kind: 'drop', part: 'element', target: 'gap'}, {stage: 1, predicted: true}), {stage: 2});
    assert.equal(tsdIntent({kind: 'drop', part: 'element', target: 'gap'}, {stage: 0, predicted: true}), null);
    assert.deepEqual(tsdIntent({kind: 'drop', part: 'polymerase', target: 'left'}, {stage: 2}), {fill: 'left'});
    assert.equal(tsdIntent({kind: 'drop', part: 'polymerase', target: 'left'}, {stage: 1}), null);
    let r = fillGap([], 'left'); assert.deepEqual([r.filled, r.done], [['left'], false]);
    r = fillGap(r.filled, 'left'); assert.equal(r.done, false, 'the same gap twice does not finish');
    r = fillGap(r.filled, 'right'); assert.equal(r.done, true);
    assert.equal(tsdIntent(null), null);
    assert.equal(tsdIntent({kind: 'tap'}), null);
  });

  test('TsdBuilder: sliders and the next-step button are gone; cut marks are labelled; Back and presets stay', () => {
    assert.doesNotMatch(html, /type="range"/);
    assert.doesNotMatch(html, /Next step →|Predict first/);
    assert.doesNotMatch(html, /<button[^>]*primary-button/, 'no primary button before the last stage');
    const labels = buttons(html);
    assert.ok(labels.some(l => /^Top cut mark: before position 5/.test(l)));
    assert.ok(labels.some(l => /^Bottom cut mark: after position 13/.test(l)));
    assert.match(html, /← Back/);
    assert.match(html, /Forward →/);
    assert.match(html, /aria-label="Load a real element"/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="The target is an unbroken double strand/);
    assert.match(html, /role="status"/);
    assert.match(html, /Practice only/);
  });
});

describe('HgtLab', () => {
  let ssr, html;
  before(async () => { ssr = await startSsr(); const C = (await ssr.load(COMP('HgtLab'))).default; html = ssr.html(C); });
  after(() => ssr.close());

  // What the old checkboxes and buttons did, applied to a lab.
  const apply = (lab, p) => 'prereq' in p ? setPrereq(lab, p.prereq, p.value) : 'act' in p ? act(lab, p.act).lab : lab;

  test('HgtLab: gestures reach every option', () => {
    assert.deepEqual(hgtIntent({kind: 'drop', part: 'donor', target: 'recipient'}), {prereq: 'contact', value: true});
    assert.deepEqual(hgtIntent({kind: 'drop', part: 'donor', target: 'apart'}), {prereq: 'contact', value: false});
    for (const part of ['conjugative', 'oriT']) {
      assert.deepEqual(hgtIntent({kind: 'drop', part, target: 'plasmid'}), {prereq: part, value: true});
      assert.deepEqual(hgtIntent({kind: 'drop', part, target: 'tray'}), {prereq: part, value: false});
    }
    for (const v of [true, false]) {
      assert.deepEqual(hgtIntent({kind: 'assume', control: 'compatibleRecipient', value: v}), {prereq: 'compatibleRecipient', value: v});
      assert.deepEqual(hgtIntent({kind: 'assume', control: 'selection', value: v}), {assume: v});
    }
    assert.deepEqual(hgtIntent({kind: 'hold', target: 'tn5'}), {act: 'transpose'});
    assert.deepEqual(hgtIntent({kind: 'hold', target: 'bridge'}), {act: 'conjugate'});
    // Every old prerequisite is reachable, and the lab ends in the same state as the old checkboxes gave.
    for (const key of Object.keys(PREREQS)) for (const value of [true, false]) {
      const g = key === 'contact' ? {kind: 'drop', part: 'donor', target: value ? 'recipient' : 'apart'}
        : key === 'compatibleRecipient' ? {kind: 'assume', control: key, value} : {kind: 'drop', part: key, target: value ? 'plasmid' : 'tray'};
      assert.deepEqual(apply(newHgt(), hgtIntent(g)), setPrereq(newHgt(), key, value), `${key}=${value}`);
    }
    // Refused moves still reach the model: conjugating with a requirement missing logs the failure.
    let lab = apply(newHgt(), hgtIntent({kind: 'hold', target: 'bridge'}));
    assert.equal(lab.log.at(-1).ok, false);
    lab = apply(lab, hgtIntent({kind: 'hold', target: 'tn5'}));
    assert.equal(lab.log.at(-1).ok, true);
    for (const [k, p] of [['conjugative', 'plasmid'], ['oriT', 'plasmid']]) lab = apply(lab, hgtIntent({kind: 'drop', part: k, target: p}));
    lab = apply(lab, hgtIntent({kind: 'drop', part: 'donor', target: 'recipient'}));
    lab = apply(lab, hgtIntent({kind: 'assume', control: 'compatibleRecipient', value: true}).prereq ? {prereq: 'compatibleRecipient', value: true} : {});
    lab = apply(lab, hgtIntent({kind: 'hold', target: 'bridge'}));
    assert.equal(lab.bact.phase, 'transferred');
    assert.equal(hgtIntent({kind: 'drop', part: 'donor', target: 'moon'}), null);
    assert.equal(hgtIntent({kind: 'hold', target: 'bench'}), null);
    assert.equal(hgtIntent({kind: 'assume', control: 'conjugative', value: true}), null);
    assert.equal(hgtIntent(null), null);
  });

  test('HgtLab: prerequisite checkboxes and operation buttons are gone; selection and reset stay', () => {
    assert.doesNotMatch(html, /type="checkbox"[^>]*>\s*(<!-- -->)? ?Plasmid encodes transfer machinery/);
    assert.doesNotMatch(html, /Plasmid encodes transfer machinery|origin of transfer \(oriT\)<\/label>|Cells are in contact/);
    assert.doesNotMatch(html, /Transpose <small>|Conjugate <small>/);
    const labels = buttons(html);
    assert.ok(labels.some(l => /^Donor cell: touching the recipient/.test(l)));
    assert.ok(labels.some(l => /^Transfer machinery: on the plasmid/.test(l)));
    assert.ok(labels.some(l => /^Origin of transfer \(oriT\): on the plasmid/.test(l)));
    assert.ok(labels.some(l => /^Tn5 on the donor DNA fragment\. Hold to transpose/.test(l)));
    assert.ok(labels.some(l => /^Bridge between the cells \(touching\)\. Hold to conjugate/.test(l)));
    assert.match(html, /Add antibiotic/);
    assert.match(html, /Reset cells/);
    assert.match(html, /Recipient is compatible/);
    assert.match(html, /<svg[^>]*role="group"[^>]*aria-label="Two bacterial cells, touching/);
    assert.match(html, /role="img" aria-label="Donor cell: chromosome/);
    assert.match(html, /Practice only/);
  });
});

// @@MORE@@
