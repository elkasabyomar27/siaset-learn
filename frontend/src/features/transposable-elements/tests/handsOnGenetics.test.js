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

// @@MORE@@
