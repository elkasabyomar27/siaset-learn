import test from 'node:test';
import assert from 'node:assert/strict';
import references from '../profiles/references.json' with { type: 'json' };

const BENCH_REFS = ['qiagen-spectro', 'saiki1988', 'sigma-pcr', 'duewer2018', 'lee2012', 'neb-ecori', 'neb-hindiii', 'neb-bamhi'];

test('new bench references exist and are verified', () => {
  for (const id of BENCH_REFS) {
    const ref = references.find(r => r.id === id);
    assert.ok(ref, id);
    for (const key of ['citation', 'url', 'support', 'verification', 'verifiedOn']) assert.ok(ref[key], `${id}: ${key}`);
    assert.match(ref.url, /^https:\/\//, id);
    assert.equal(ref.verifiedOn, '2026-11-24', id);
  }
});

import * as bench from '../benchWorkflow.js';

test('quantify reads the worked sample from station 18', () => {
  const {a260, a280, a230} = bench.SAMPLE.readings;
  assert.deepEqual(bench.quantify({a260, a280, a230, volumeUl: bench.SAMPLE.volumeUl}), {concentration: 37.5, yieldNg: 1875, r280: 1.83, r230: 1.97, flags: []});
});

test('each quantification card gets its expected verdict', () => {
  assert.deepEqual(bench.QUANT_SAMPLES.map(c => c.verdict), ['pure', 'protein', 'rna', 'low230']);
  for (const card of bench.QUANT_SAMPLES) assert.equal(bench.verdictFor(bench.quantify({...card, volumeUl: 50})), card.verdict, card.id);
  assert.deepEqual(bench.QUANT_SAMPLES.map(c => bench.quantify({...c, volumeUl: 50}).r280), [1.83, 1.60, 2.05, 1.83]);
  assert.equal(bench.quantify({...bench.QUANT_SAMPLES[3], volumeUl: 50}).r230, 1.25);
});

test('purity flag thresholds are exact', () => {
  const flags = (a280, a230 = 2) => bench.quantify({a260: 1, a280: 1 / a280, a230: 1 / a230, volumeUl: 1}).flags;
  assert.deepEqual(flags(1.69), ['protein']);
  assert.deepEqual(flags(1.70), []);
  assert.deepEqual(flags(1.95), ['rna']);
  assert.deepEqual(flags(1.94), []);
  assert.deepEqual(flags(1.8, 1.79), ['low230']);
  assert.deepEqual(flags(1.8, 1.80), []);
});

test('the template carries about 1,100 genome copies into PCR', () => {
  assert.equal(bench.DS_DNA_NG_PER_UL_PER_A260, 50);
  assert.equal(bench.templateCopies(), 1136);
  assert.equal(bench.SAMPLE.ampliconBp, 850);
  assert.deepEqual(bench.SAMPLE.ladder, [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
});

test('quantify rejects impossible readings', () => {
  for (const bad of [{a280: 0}, {a230: -1}, {volumeUl: 0}]) assert.throws(() => bench.quantify({a260: 0.75, a280: 0.41, a230: 0.38, volumeUl: 50, ...bad}));
});

test('PCR outcomes follow the gates', () => {
  const run = patch => bench.runPcr({...bench.PCR.defaults, ...patch});
  assert.equal(run({}).outcome, 'single');
  assert.deepEqual(run({}).bands, [{bp: 850, intensity: 'strong', schematic: false}]);
  for (const [patch, outcome] of [[{primers: 'away'}, 'none'], [{primers: 'same'}, 'none'], [{anneal: 72}, 'none'], [{polymerase: 'mesophile'}, 'none'], [{anneal: 45}, 'extra'], [{cycles: 10}, 'weak'], [{cycles: 40}, 'single']])
    assert.equal(run(patch).outcome, outcome, JSON.stringify(patch));
  assert.deepEqual(run({}).gates.map(g => g.state), run({}).gates.map(() => 'open'));
  assert.equal(run({cycles: 40}).gates.find(g => g.id === 'cycles').state, 'restricted');
  assert.deepEqual(run({anneal: 45}).bands.map(b => [b.bp, b.schematic]), [[1150, true], [850, false], [420, true]]);
  for (const b of run({anneal: 45}).bands) assert.ok(bench.migrate(b.bp, '1', 'right') > 0.03, `${b.bp} bp stays clear of the well`);
  assert.deepEqual(run({cycles: 10}).bands, [{bp: 850, intensity: 'faint', schematic: false}]);
  assert.deepEqual(run({primers: 'away'}).bands, []);
  for (const key of ['single', 'none', 'extra', 'weak']) assert.ok(bench.PCR_OUTCOMES[key].label, key);
});

test('PCR copy counts double per cycle; the exact-length product appears at cycle 3', () => {
  assert.deepEqual([1, 2, 3, 4].map(bench.exactLengthDuplexes), [0, 0, 2, 8]);
  assert.deepEqual(bench.pcrTable(5).map(r => r.total), [2, 4, 8, 16, 32]);
  assert.deepEqual(bench.pcrTable(5).map(r => r.cycle), [1, 2, 3, 4, 5]);
  assert.equal(bench.idealCopies(1100, 10), 1126400);
});

test('gel migration is log-linear and the product falls between 800 and 900', () => {
  const sizes = [...bench.SAMPLE.ladder, 850].sort((a, b) => a - b);
  for (const agarose of ['0.7', '1', '2']) for (const run of ['short', 'right']) {
    const pos = sizes.map(s => bench.migrate(s, agarose, run));
    for (let i = 1; i < pos.length; i++) assert.ok(pos[i] < pos[i - 1], `${agarose}/${run}`);
  }
  const at = s => bench.migrate(s, '1', 'right');
  assert.ok(at(900) < at(850) && at(850) < at(800));
  assert.equal(bench.estimateSize(at(850), '1', 'right'), 850);
  assert.deepEqual(bench.bracket(850), [800, 900]);
  assert.equal(Math.round(Math.sqrt(800 * 900)), 849);
  assert.ok(bench.migrate(100, '0.7', 'right') > 1, '100 bp runs off a 0.7% gel');
  assert.ok(bench.migrate(850, '2', 'right') < at(850), 'a 2% gel holds 850 bp back');
});

test('gel outcomes', () => {
  const run = (patch, opts) => bench.runGel({...bench.GEL.defaults, ...patch}, opts);
  assert.equal(run({}).outcome, 'resolved');
  const reversed = run({polarity: 'wells-positive'});
  assert.equal(reversed.outcome, 'ranOut');
  assert.ok(reversed.lanes.every(l => l.bands.length === 0));
  assert.equal(run({run: 'short'}).outcome, 'unseparated');
  assert.equal(run({}, {ethanolLane: true}).outcome, 'floats');
  const lanes = run({}).lanes;
  assert.deepEqual(lanes.map(l => l.id), ['ladder', 'product', 'ntc']);
  assert.deepEqual(lanes[1].bands.map(b => b.bp), [850]);
  assert.deepEqual(lanes[2].bands, []);
  const withEthanol = run({}, {ethanolLane: true}).lanes;
  assert.deepEqual(withEthanol.map(l => l.id), ['ladder', 'ethanol', 'ntc'], 'the ethanol sample is the PCR lane, not an extra one');
  const eth = withEthanol.find(l => l.id === 'ethanol');
  assert.ok(eth.floats && eth.bands.length === 0);
  for (const key of ['resolved', 'ranOut', 'floats', 'unseparated']) assert.ok(bench.GEL_OUTCOMES[key].label, key);
});

test('digest of the 850 bp amplicon', () => {
  const cut = (names, opts) => bench.digest(bench.SAMPLE.ampliconBp, bench.cutsFor(names), opts);
  assert.deepEqual(cut(['EcoRI']), [550, 300]);
  assert.deepEqual(cut(['BamHI']), [850]);
  assert.deepEqual(cut(['HindIII']), [700, 150]);
  assert.deepEqual(cut(['EcoRI', 'HindIII']), [400, 300, 150]);
  assert.deepEqual(cut(['EcoRI', 'BamHI']), cut(['EcoRI']));
  assert.deepEqual(cut([]), [850]);
  assert.deepEqual(cut(['EcoRI'], {partial: true}), [850, 550, 300]);
  assert.deepEqual(cut(['EcoRI', 'HindIII'], {partial: true}), [850, 700, 550, 400, 300, 150]);
  assert.deepEqual(Object.fromEntries(Object.entries(bench.ENZYMES).map(([k, e]) => [k, e.cut])), {EcoRI: 'G^AATTC', HindIII: 'A^AGCTT', BamHI: 'G^GATCC'});
});

test('fragment counting: linear n cuts → n + 1, circular n cuts → n', () => {
  assert.deepEqual(bench.digest(3000, [100], {topology: 'circular'}), [3000]);
  assert.deepEqual(bench.digest(3000, [100, 1100], {topology: 'circular'}), [2000, 1000]);
  assert.deepEqual(bench.digest(3000, [], {topology: 'circular'}), [3000]);
  assert.deepEqual(bench.digest(1000, [100, 600]), [500, 400, 100]);
  assert.deepEqual(bench.digest(1000, [200, 200]), [800, 200]);
  assert.deepEqual(bench.digest(1000, [500]), [500], 'equal pieces collapse to one size');
  assert.deepEqual(bench.cutsFor(['HindIII', 'EcoRI', 'EcoRI']), [300, 700]);
});

test('fragment predictions match ignoring order; every answer is a size choice', () => {
  assert.equal(bench.fragmentsMatch([300, 550], [550, 300]), true);
  assert.equal(bench.fragmentsMatch([300], [550, 300]), false);
  const names = Object.keys(bench.ENZYMES);
  for (let mask = 0; mask < 8; mask++) for (const partial of [false, true]) {
    const chosen = names.filter((_, i) => mask & (1 << i));
    for (const bp of bench.digest(bench.SAMPLE.ampliconBp, bench.cutsFor(chosen), {partial})) assert.ok(bench.SIZE_CHOICES.includes(bp), `${chosen} ${bp}`);
  }
});

import { moduleById, allTopics, moduleForTopic, fieldForModule } from '../curriculum/modules.js';
import { lessonById, topicHref } from '../curriculum/lessons.js';
import { moduleBanks } from '../assessment.js';
import { routePresentation } from '../routePresentation.js';
import { parseProgress, isComplete } from '../lessonProgress.js';
import { challengeFor, activityFor } from '../curriculum/stations.js';

const IDS = ['dna-quantification', 'pcr-amplification', 'gel-electrophoresis', 'restriction-digest'];

test('Bench Workflow is module 3 of Molecular Biology with stations 19–22', () => {
  const mod = moduleById('bench-workflow');
  assert.equal(fieldForModule(mod).id, 'molecular-biology');
  assert.equal(fieldForModule(mod).summary, 'Bench methods for getting DNA out of cells, measuring it, copying it and cutting it.');
  assert.equal(mod.title, 'Bench Workflow');
  assert.equal(mod.basePath, '/learn/bench-workflow');
  assert.deepEqual(mod.topics.map(t => [t.id, t.order]), IDS.map((id, i) => [id, 19 + i]));
  assert.deepEqual(mod.chapters.map(c => [c.id, c.title, c.topics]), [['measure-amplify', 'Measure and amplify', IDS.slice(0, 2)], ['analyze-product', 'Analyze the product', IDS.slice(2)]]);
  assert.deepEqual(allTopics.map(t => t.order), Array.from({length: 22}, (_, i) => i + 1));
});

test('each bench lesson has the predict-first shape, resolvable references and stated limits', () => {
  assert.deepEqual(IDS.map(id => lessonById(id).variants.length), [4, 5, 4, 4]);
  for (const t of moduleById('bench-workflow').topics) {
    const lesson = lessonById(t.lessonId);
    assert.equal(t.lessonId, t.id);
    assert.equal(t.learning.kind, 'lesson');
    assert.deepEqual(lesson.objectives, t.learningObjectives);
    assert.deepEqual(lesson.references, t.references);
    assert.ok(lesson.check2 && lesson.variants.every(v => v.outcome && v.blocks.length && v.explanation), t.id);
    for (const id of lesson.references) assert.ok(references.some(r => r.id === id), `${t.id}: ${id}`);
    assert.ok(lesson.limitations.length > 80, t.id);
    assert.equal(topicHref(t), `/learn/bench-workflow/${t.id}`);
    assert.equal(routePresentation(topicHref(t)).title, `${t.title} — Lesson ${t.order}`);
    assert.ok(challengeFor(t.id) && activityFor(t.id), t.id);
  }
  assert.match(lessonById('restriction-digest').limitations, /teaching amplicon/);
  assert.match(lessonById('pcr-amplification').limitations, /schematic/);
});

test('bench outcome labels are exactly the lesson variant outcomes', () => {
  const outcomes = id => new Set(lessonById(id).variants.map(v => v.outcome));
  assert.deepEqual(outcomes('dna-quantification'), new Set(Object.values(bench.VERDICTS).map(v => v.label)));
  for (const o of outcomes('pcr-amplification')) assert.ok(Object.values(bench.PCR_OUTCOMES).some(x => x.label === o), o);
  assert.deepEqual(outcomes('gel-electrophoresis'), new Set(Object.values(bench.GEL_OUTCOMES).map(v => v.label)));
  assert.deepEqual([...outcomes('restriction-digest')], ['300 + 550 bp', '850 bp, uncut', '150 + 300 + 400 bp', 'extra uncut band']);
});

test('the module practice bank has 12 importable questions with the spec answers', () => {
  const bank = moduleBanks['bench-workflow'];
  assert.equal(bank.length, 12);
  for (const q of bank) {
    assert.ok(q.options.length >= 2 && q.options.length <= 4, q.id);
    assert.ok(q.question.length <= 300 && q.options.every(o => o.length <= 120), q.id);
    assert.ok(moduleForTopic(q.topicId) === moduleById('bench-workflow'));
  }
  const answer = (id, kind) => { const l = lessonById(id); return l[kind].options[l[kind].correct]; };
  assert.equal(answer('dna-quantification', 'exercise'), '37.5 ng/µL');
  assert.equal(answer('pcr-amplification', 'exercise'), 'About 1.1 million');
  assert.equal(answer('gel-electrophoresis', 'exercise'), 'About 850 bp');
  assert.equal(answer('restriction-digest', 'exercise'), '300 + 550 bp');
  assert.equal(answer('restriction-digest', 'check'), 'Three');
  assert.equal(answer('restriction-digest', 'check2'), 'The digest was incomplete');
  assert.match(answer('gel-electrophoresis', 'check'), /positive electrode/);
});

test('earlier saved progress still reads; a bench lesson records and completes', () => {
  const l = lessonById('restriction-digest');
  const raw = JSON.stringify({version: 1, records: {introduction: {inspected: [0, 1, 2], exercise: 1, check: 1}, 'restriction-digest': {inspected: [0, 1, 2, 3], exercise: l.exercise.correct, check: l.check.correct, check2: l.check2.correct}}});
  const p = parseProgress(raw);
  assert.equal(isComplete('introduction', p.introduction), true);
  assert.equal(isComplete('restriction-digest', p['restriction-digest']), true);
});

test('lesson wording matches the models: cycle 3 is when exact-length copies first appear; distance falls linearly with log(size)', () => {
  const pcr = lessonById('pcr-amplification').concept;
  assert.doesNotMatch(pcr, /becomes the main template/);
  assert.match(pcr, /first appear in the third cycle/);
  const gel = lessonById('gel-electrophoresis');
  assert.doesNotMatch(gel.check2.explanation, /inversely proportional/);
});
