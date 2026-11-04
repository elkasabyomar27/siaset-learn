import {newHistory,execute} from './engine/index.js';
export const sandboxPositions=[0,200,895,900];
export function newSandbox(scenario){if(!['tn5','tn3'].includes(scenario))throw new Error('Unsupported sandbox preset');return newHistory(scenario);}
export function runSandbox(history,position,resolvaseAvailable=false){
 if(!sandboxPositions.includes(position))throw new Error('Unsupported sandbox boundary');
 const scenario=history.state.scenario;
 return execute(history,history.state.phase==='initial'?{type:scenario==='tn5'?'tn5.transpose':'tn3.replicate',targetBoundary:position}:{type:'tn3.resolve',resolvaseAvailable});
}
