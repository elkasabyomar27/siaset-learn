import {createInitial,replay} from './engine/index.js';
import {stages,checkpoints} from './learning.js';
import {scoreAssessment,BANK_VERSION} from './assessment.js';
import {isComplete} from './lessonProgress.js';
export const LAB_KEY='siaset-guided-labs-v1';
export const ASSESSMENT_KEY='siaset-assessments-v1';
export function loadRecord(key,storage) {
  try {const r=JSON.parse((storage??globalThis.localStorage).getItem(key));return r?.version===1?r:null;} catch{return null;}
}
export function saveRecord(key,record,storage) {
  try{(storage??globalThis.localStorage).setItem(key,JSON.stringify(record));return true;}catch{return false;}
}
export function validLabEvidence(record) {
  try {
    const {scenario,stage,answers,events}=record;
    if(!['tn5','tn3'].includes(scenario)||stage!==stages[scenario].length-1||answers[scenario]!==checkpoints[scenario].correct||(scenario==='tn3'&&answers.resolution!==checkpoints.resolution.correct))return false;
    if(events.length!==(scenario==='tn5'?1:2))return false;
    const state=replay(createInitial(scenario),events);
    return state.phase===(scenario==='tn5'?'inserted':'resolved');
  }catch{return false;}
}
export function readLabs(storage) {
  const r=loadRecord(LAB_KEY,storage);const records={};
  for(const scenario of ['tn5','tn3'])if(r?.records?.[scenario]?.scenario===scenario&&validLabEvidence(r.records[scenario]))records[scenario]=r.records[scenario];
  return records;
}
export function recordLab(history,stage,answers,storage) {
  const record={scenario:history.state.scenario,stage,answers:{...answers},events:history.events.slice(0,history.cursor)};
  if(!validLabEvidence(record))return false;
  return saveRecord(LAB_KEY,{version:1,records:{...readLabs(storage),[record.scenario]:record}},storage);
}
export function readAttempts(storage) {
  const r=loadRecord(ASSESSMENT_KEY,storage);
  if(!Array.isArray(r?.attempts))return [];
  return r.attempts.filter(a=>{
    try{return a.bankVersion===BANK_VERSION&&typeof a.date==='string'&&Number.isFinite(Date.parse(a.date))&&scoreAssessment(a.answers).answered===scoreAssessment(a.answers).total;}catch{return false;}
  }).map(a=>({bankVersion:a.bankVersion,date:a.date,answers:a.answers}));
}
export function appendAttempt(answers,date,storage) {
  const score=scoreAssessment(answers);
  if(score.answered!==score.total||!Number.isFinite(Date.parse(date)))throw new Error('Complete valid attempt required');
  return saveRecord(ASSESSMENT_KEY,{version:1,attempts:[...readAttempts(storage),{bankVersion:BANK_VERSION,date,answers:{...answers}}]},storage);
}
export function topicCompleted(topic,progress,labs) {
  return topic.learning?.kind === 'laboratory' ? !!labs[topic.learning.experiment] : isComplete(topic.lessonId,progress[topic.lessonId]);
}
export function progressSummary(topics,progress,labs) {
  const completed=topics.filter(t=>topicCompleted(t,progress,labs)).length;
  return {completed,total:topics.length,percentage:topics.length ? Math.round(completed/topics.length*100) : 0};
}
