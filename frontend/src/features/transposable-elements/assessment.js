import topics from './curriculum/topics.json' with {type:'json'};
import {lessons} from './curriculum/lessons.js';
import {checkpoints} from './learning.js';
import {modules} from './curriculum/modules.js';
// Published bank v1: deterministic order and explicit keys, sourced from established lessons.
export const BANK_VERSION=1;
export function buildQuestions(topics, lessonBank = lessons) {
  return topics.flatMap(topic => {
    const lesson = lessonBank.find(l => l.id === topic.lessonId);
    const metadata = topic.assessment;
    const refs = lesson?.references || metadata.references;
    const primary = metadata.checkpoint ? checkpoints[metadata.checkpoint] : lesson.exercise;
    return [
      {...primary, id:`${topic.id}-primary`, topicId:topic.id, references:refs},
      ...(lesson?.check2 ? [{...lesson.check2, id:`${topic.id}-additional`, topicId:topic.id, references:refs}] : []),
      ...(metadata.includeEvidence ? [{...lesson.check, id:`${topic.id}-evidence`, topicId:topic.id, references:refs}] : []),
      ...(metadata.additionalCheckpoints || []).map(id => ({...checkpoints[id], id:`${topic.id}-${id}`, topicId:topic.id, references:refs}))
    ];
  });
}
export const questions = buildQuestions(topics);
const order = topics.map(topic => topic.id);
// Practice banks for the other modules. The saved cumulative bank above stays the frozen
// transposable-element bank v1, so earlier saved and synced attempts keep scoring.
export const moduleBanks = Object.fromEntries(modules.slice(1).map(module => [module.id, buildQuestions(module.topics)]));
/** Every published question, for teacher quiz import. */
export const allQuestions = [...questions, ...Object.values(moduleBanks).flat()];
export function scoreModulePractice(moduleId, answers) {
  const bank = moduleBanks[moduleId] || [];
  const items = bank.map(q => ({id:q.id, topicId:q.topicId, correct:answers[q.id] === q.correct, answered:Object.hasOwn(answers, q.id)}));
  const topicIds = [...new Set(bank.map(q => q.topicId))];
  return {correct:items.filter(i => i.correct).length, total:items.length, answered:items.filter(i => i.answered).length, items, topics:topicIds.map(topicId => ({topicId, correct:items.filter(i => i.topicId === topicId && i.correct).length, total:items.filter(i => i.topicId === topicId).length}))};
}
export function scoreAssessment(answers) {
  if(!answers || typeof answers!=='object' || Array.isArray(answers)) throw new Error('Answer map required');
  for(const [id,value] of Object.entries(answers)) {
    const q=questions.find(q=>q.id===id);
    if(!q || !Number.isInteger(value) || value<0 || value>=q.options.length) throw new Error('Invalid assessment answer');
  }
  const items=questions.map(q=>({id:q.id,topicId:q.topicId,correct:answers[q.id]===q.correct,answered:Object.hasOwn(answers,q.id)}));
  return {correct:items.filter(i=>i.correct).length,total:items.length,answered:items.filter(i=>i.answered).length,items,topics:order.map(topicId=>({topicId,correct:items.filter(i=>i.topicId===topicId&&i.correct).length,total:items.filter(i=>i.topicId===topicId).length}))};
}
