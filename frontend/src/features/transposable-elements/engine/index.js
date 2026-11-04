import { SCHEMA_VERSION, clone, requireCondition, validateEvent } from './contracts.js';
import { createInitial, serialize, validateState } from './model.js';
import { transposeTn5 } from './tn5.js';
import { replicateTn3, resolveTn3 } from './tn3.js';
export { createInitial, validateState } from './model.js';
export { ScientificError } from './contracts.js';
export function transition(state, action) {
  validateState(state);
  requireCondition(action && typeof action.type==='string','ACTION','An explicit action is required.');
  const operations={
    'tn5.transpose':{run:transposeTn5,mechanism:'tn5',references:['tn5-conservative','tn5-tsd'],explanation:'Tn5 moved to the target; one element remains. Host-derived 9 bp TSDs flank the insertion. Donor ends remain unrepaired.'},
    'tn3.replicate':{run:replicateTn3,mechanism:'tn3',references:['kitts1982','takeya1979','bennett1983'],explanation:'Replication produced a second Tn3 copy. Donor and target backbones now form one circular cointegrate with directly oriented element copies and a host-derived 5 bp TSD pair.'},
    'tn3.resolve':{run:resolveTn3,mechanism:'tn3-resolution',references:['kostriken1981','kitts1983','tn3-topology'],explanation:'TnpR-mediated recombination at the two internal res regions partitioned the cointegrate into donor and target replicon structures. Two recombinant Tn3 copies remain overall. Decatenation is not modeled.'}
  };
  requireCondition(Object.hasOwn(operations,action.type),'ACTION','Unsupported molecular operation.');
  const operation=operations[action.type];
  const next=operation.run(state,action); next.revision=state.revision+1; validateState(next);
  const event={schemaVersion:SCHEMA_VERSION,id:`${state.scenario}:${next.revision}:${action.type}`,type:action.type,action:clone(action),fromRevision:state.revision,toRevision:next.revision,mechanism:operation.mechanism,references:operation.references,explanation:operation.explanation,before:serialize(state),after:serialize(next)};
  validateEvent(event); return {state:next,event};
}
export function replay(initial, events) {
  let state=clone(initial); validateState(state);
  for(const event of events) {
    validateEvent(event); requireCondition(event.before===serialize(state),'REPLAY_STATE','Event does not match current state.');
    const result=transition(state,event.action);
    requireCondition(serialize(event)===serialize(result.event),'REPLAY_EVENT','Event differs from deterministic calculation.'); state=result.state;
  }
  return state;
}
export function newHistory(scenario='tn5') { const initial=createInitial(scenario); return {initial,state:clone(initial),events:[],cursor:0}; }
export function execute(history, action) {
  const result=transition(history.state,action);
  return {...history,state:result.state,events:[...history.events.slice(0,history.cursor),result.event],cursor:history.cursor+1};
}
export function seek(history,cursor) {
  requireCondition(Number.isInteger(cursor)&&cursor>=0&&cursor<=history.events.length,'HISTORY','Invalid history position.');
  return {...history,cursor,state:replay(history.initial,history.events.slice(0,cursor))};
}
export function reset(history) { return {initial:clone(history.initial),state:clone(history.initial),events:[],cursor:0}; }
