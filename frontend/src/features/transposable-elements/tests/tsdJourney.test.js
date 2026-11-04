import test from 'node:test';
import assert from 'node:assert/strict';
import {tsdLayout, tsdOutcome, lengthChoices, predictionFeedback, clampCut, validSetup, describeLayout, TSD_STAGES, HOST_LENGTH, ELEMENT_WIDTH, PRESETS} from '../tsdJourney.js';

const setups = [{cut: 4, stagger: 9}, {cut: 6, stagger: 5}, {cut: 2, stagger: 2}, {cut: clampCut(99, 10), stagger: 10}];

test('each repeat equals the stagger between the cuts, and both trace the same host interval', () => {
  for (const {cut, stagger} of setups) {
    const final = tsdLayout({cut, stagger, stage: 'fill'});
    assert.equal(final.repeats.length, 2);
    for (const r of final.repeats) { assert.equal(r.width, stagger); assert.equal(r.from, cut + 1); assert.equal(r.to, cut + stagger); }
    assert.equal(tsdOutcome(stagger).repeatLength, stagger);
  }
});

test('strand transfer leaves exactly one gap per strand per interval position, and filling removes every gap', () => {
  for (const {cut, stagger} of setups) {
    const joined = tsdLayout({cut, stagger, stage: 'join'});
    assert.equal(joined.gaps.length, 2 * stagger);
    assert.equal(joined.gaps.filter(g => g.piece === 'left' && g.strand === 'top').length, stagger);
    assert.equal(joined.gaps.filter(g => g.piece === 'right' && g.strand === 'bottom').length, stagger);
    const filled = tsdLayout({cut, stagger, stage: 'fill'});
    assert.equal(filled.gaps.length, 0);
    // Host material is conserved and only the interval is added, once per strand.
    assert.equal(filled.cells.filter(c => !c.synthesized).length, 2 * HOST_LENGTH);
    assert.equal(filled.cells.filter(c => c.synthesized).length, 2 * stagger);
  }
});

test('after filling, every column on both flanks is double-stranded and no cell overlaps the element', () => {
  for (const {cut, stagger} of setups) {
    const {cells, element} = tsdLayout({cut, stagger, stage: 'fill'});
    const columns = new Map();
    for (const c of cells) {
      assert.ok(c.x < element.x || c.x >= element.x + element.width, `cell ${c.id} overlaps element`);
      const key = c.x; columns.set(key, [...(columns.get(key) || []), c.strand]);
    }
    for (const [x, strands] of columns) assert.deepEqual(strands.sort(), ['bottom', 'top'], `column ${x}`);
  }
});

test('host cells keep stable ids across stages; only the cut stage shows nicks', () => {
  const ids = s => tsdLayout({cut: 5, stagger: 5, stage: s}).cells.filter(c => !c.synthesized).map(c => c.id).sort();
  for (const s of TSD_STAGES) assert.deepEqual(ids(s.id), ids('target'));
  assert.equal(tsdLayout({cut: 5, stagger: 5, stage: 'cut'}).nicks.length, 2);
  for (const s of ['target', 'join', 'fill']) assert.equal(tsdLayout({cut: 5, stagger: 5, stage: s}).nicks.length, 0);
  assert.equal(tsdLayout({cut: 5, stagger: 5, stage: 'join'}).width, HOST_LENGTH + 5 + ELEMENT_WIDTH);
});

test('presets keep the literature lengths and invalid setups are refused', () => {
  assert.deepEqual(PRESETS.map(p => [p.id, p.stagger]), [['tn5', 9], ['tn3', 5]]);
  assert.equal(validSetup({cut: 1, stagger: 5}), false);
  assert.equal(validSetup({cut: 4, stagger: 11}), false);
  assert.throws(() => tsdLayout({cut: 4, stagger: 1, stage: 0}));
  assert.throws(() => tsdLayout({cut: 4, stagger: 5, stage: 'unknown'}));
});

test('prediction choices always include the answer, and feedback explains each misconception', () => {
  for (let s = 2; s <= 10; s++) {
    const choices = lengthChoices(s);
    assert.ok(choices.includes(s)); assert.equal(new Set(choices).size, choices.length);
    for (const choice of choices) {
      const fb = predictionFeedback(s, choice);
      assert.equal(fb.correct, choice === s); assert.ok(fb.text.includes(String(s)));
    }
  }
});

test('text description exists for every stage', () => {
  for (let i = 0; i < TSD_STAGES.length; i++) assert.ok(describeLayout(tsdLayout({cut: 4, stagger: 9, stage: i})).length > 20);
});
