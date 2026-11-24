import test from 'node:test';
import assert from 'node:assert/strict';
import topics from '../curriculum/topics.json' with { type: 'json' };
import references from '../profiles/references.json' with { type: 'json' };
import { modules, allTopics, allChapters, moduleForTopic, positionInModule } from '../curriculum/modules.js';
import { lessons, lessonById, topicHref } from '../curriculum/lessons.js';
import { adjacentTopics } from '../curriculum/navigation.js';
import { questions, moduleBanks, allQuestions, scoreAssessment, scoreModulePractice, BANK_VERSION } from '../assessment.js';
import { parseProgress, updateProgress, isComplete } from '../lessonProgress.js';
import { progressSummary } from '../learnerRecords.js';
import { routePresentation } from '../routePresentation.js';
import { REAGENTS, STAGES, checkReagent, reagentsSorted, evaluatePrecipitation, evaluateWash } from '../dnaExtraction.js';
import bankV1 from './assessment-v1.json' with { type: 'json' };

const extraction = moduleForTopic('extraction-principles');

test('the original fifteen topics form module 1 unchanged; DNA extraction is module 2', () => {
  assert.deepEqual(modules.map(m => m.id), ['transposable-elements', 'dna-extraction', 'bench-workflow']);
  assert.equal(modules[0].topics, topics);
  assert.deepEqual(extraction.topics.map(t => t.id), ['extraction-principles', 'isopropanol-precipitation', 'ethanol-wash']);
  assert.deepEqual(allTopics.map(t => t.order), Array.from({ length: allTopics.length }, (_, i) => i + 1));
  assert.equal(new Set(allTopics.map(t => t.id)).size, allTopics.length);
  for (const module of modules) assert.deepEqual(module.chapters.flatMap(c => c.topics), module.topics.map(t => t.id));
  assert.equal(new Set(allChapters.map(c => c.id)).size, allChapters.length);
  assert.deepEqual(positionInModule('ethanol-wash'), { index: 3, total: 3, module: extraction });
});

test('new topics have registry fields, lessons, references and module routes', () => {
  for (const t of extraction.topics) {
    for (const key of ['learningObjectives', 'essentialTerminology', 'plannedActivities', 'assessmentObjectives', 'references']) assert.ok(t[key].length, `${t.id}: ${key}`);
    for (const id of t.references) assert.ok(references.some(r => r.id === id), id);
    const lesson = lessonById(t.lessonId);
    assert.ok(lesson, t.id);
    assert.deepEqual(lesson.objectives, t.learningObjectives);
    assert.ok(lesson.check2 && lesson.variants.every(v => v.outcome));
    assert.equal(topicHref(t), `/learn/dna-extraction/${t.id}`);
    assert.equal(routePresentation(topicHref(t)).title, `${t.title} — Lesson ${t.order}`);
    assert.equal(routePresentation(topicHref(t)).section, 'curriculum');
  }
  for (const t of topics) if (t.learning.kind === 'lesson') assert.equal(topicHref(t), `/learn/transposable-elements/${t.id}`);
  assert.equal(adjacentTopics('bacterial-hgt').next.id, 'extraction-principles');
  assert.equal(adjacentTopics('ethanol-wash').next.id, 'dna-quantification');
  assert.equal(adjacentTopics('restriction-digest').next, undefined);
  assert.equal(lessons.length, 20);
});

test('the saved cumulative bank stays frozen; module 2 has its own practice bank', () => {
  assert.equal(BANK_VERSION, 1);
  assert.deepEqual(questions.map(q => q.id), bankV1.map(q => q.id));
  const bank = moduleBanks['dna-extraction'];
  assert.equal(bank.length, 9);
  assert.ok(bank.every(q => moduleForTopic(q.topicId) === extraction));
  // Teacher quiz import limits.
  for (const q of bank) {
    assert.ok(q.options.length >= 2 && q.options.length <= 4, q.id);
    assert.ok(q.question.length <= 300, q.id);
    assert.ok(q.options.every(o => o.length <= 120), q.id);
  }
  assert.equal(allQuestions.length, questions.length + bank.length + moduleBanks['bench-workflow'].length);
  const perfect = Object.fromEntries(bank.map(q => [q.id, q.correct]));
  assert.deepEqual([scoreModulePractice('dna-extraction', perfect).correct, scoreModulePractice('dna-extraction', perfect).total], [9, 9]);
  // An earlier saved attempt (original bank only) still scores in full.
  const legacy = Object.fromEntries(questions.map(q => [q.id, q.correct]));
  assert.equal(scoreAssessment(legacy).correct, questions.length);
  assert.throws(() => scoreAssessment({ [bank[0].id]: 0 }));
});

test('existing saved progress is read unchanged; new lessons record and complete normally', () => {
  const raw = JSON.stringify({ version: 1, records: { introduction: { inspected: [0, 1, 2], exercise: 1, check: 1 }, 'ethanol-wash': { inspected: [0, 99] } } });
  const p = parseProgress(raw);
  assert.equal(isComplete('introduction', p.introduction), true);
  assert.deepEqual(p['ethanol-wash'].inspected, [0]);
  for (const lesson of lessons.filter(l => moduleForTopic(l.id) === extraction)) {
    let progress = {};
    lesson.variants.forEach((_, i) => { progress = updateProgress(progress, lesson.id, 'inspect', i); });
    for (const kind of ['exercise', 'check']) progress = updateProgress(progress, lesson.id, kind, lesson[kind].correct);
    assert.equal(isComplete(lesson.id, progress[lesson.id]), false);
    progress = updateProgress(progress, lesson.id, 'check2', lesson.check2.correct);
    assert.equal(isComplete(lesson.id, progress[lesson.id]), true);
  }
  assert.deepEqual(progressSummary(allTopics, {}, {}), { completed: 0, total: allTopics.length, percentage: 0 });
});

test('reagent stages accept only the stage where each reagent acts', () => {
  for (const r of REAGENTS) for (const s of STAGES) {
    const result = checkReagent(r.id, s.id);
    assert.equal(result.correct, r.stages.includes(s.id));
    assert.ok(result.text);
  }
  assert.throws(() => checkReagent('phenol', 'lysis'));
  assert.equal(reagentsSorted(Object.fromEntries(REAGENTS.map(r => [r.id, r.stages[0]]))), true);
  assert.equal(reagentsSorted({ sds: 'lysis' }), false);
});

test('precipitation needs salt, enough alcohol, a tube that fits and a spin', () => {
  assert.equal(evaluatePrecipitation({}).outcome, 'pellet');
  assert.equal(evaluatePrecipitation({ salt: false }).outcome, 'poor');
  assert.equal(evaluatePrecipitation({ volumes: 0.2 }).outcome, 'poor');
  assert.equal(evaluatePrecipitation({ spin: false }).outcome, 'poor');
  assert.equal(evaluatePrecipitation({ temperature: 'ice' }).outcome, 'salty');
  // 700 µL + 2.5 vol ethanol = 2450 µL overflows; 200 µL + 2.5 vol = 700 µL fits.
  assert.equal(evaluatePrecipitation({ alcohol: 'ethanol', volumes: 2.5 }).outcome, 'overflow');
  assert.equal(evaluatePrecipitation({ alcohol: 'ethanol', volumes: 2.5, sample: 200 }).outcome, 'pellet');
  assert.equal(evaluatePrecipitation({ alcohol: 'ethanol', volumes: 0.7 }).outcome, 'poor');
  assert.equal(evaluatePrecipitation({ alcohol: 'ethanol', volumes: 2.5, sample: 200, temperature: 'ice' }).outcome, 'pellet');
});

test('washing: 70% ethanol and a brief dry give clean DNA; each mistake has its own outcome', () => {
  assert.equal(evaluateWash({ wash: 'e70', dry: 'brief' }).outcome, 'clean');
  assert.equal(evaluateWash({ wash: 'water' }).outcome, 'lost');
  assert.equal(evaluateWash({ wash: 'e100' }).outcome, 'salty');
  assert.equal(evaluateWash({ wash: 'none' }).outcome, 'salty');
  assert.equal(evaluateWash({ wash: 'e70', dry: 'none' }).outcome, 'ethanol');
  assert.equal(evaluateWash({ wash: 'e70', dry: 'long' }).outcome, 'hard');
  assert.match(evaluateWash({ wash: 'e100' }).purity, /A260\/A230 likely low/);
});
