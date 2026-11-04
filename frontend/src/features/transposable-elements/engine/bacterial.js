import {createInitial, transition} from './index.js';
export function initialBacteria() {
  return {version:1,phase:'initial',molecular:createInitial('tn5'),cells:[{id:'donor-cell',chromosome:'donor-chromosome',plasmids:['target']},{id:'recipient-cell',chromosome:'recipient-chromosome',plasmids:[]}],transfer:{conjugative:true,oriT:true,machinery:true,contact:true,compatibleRecipient:true},recipientPlasmid:null};
}
export function bacterialTransition(state, action) {
  if (state?.version !== 1 || !Array.isArray(state.cells) || state.cells.length !== 2 || state.cells[0].id !== 'donor-cell' || state.cells[1].id !== 'recipient-cell' || !state.cells[0].plasmids.includes('target')) throw new Error('Invalid bounded bacterial state');
  const next=structuredClone(state);
  if (action === 'transpose') {
    if(state.phase !== 'initial') throw new Error('Transposition requires initial donor fragment');
    next.molecular=transition(state.molecular,{type:'tn5.transpose',targetBoundary:200}).state;
    next.phase='loaded';
  } else if (action === 'conjugate') {
    if(state.phase !== 'loaded' || !Object.values(state.transfer).every(x=>x===true) || !['conjugative','oriT','machinery','contact','compatibleRecipient'].every(k=>state.transfer[k]===true)) throw new Error('Defined conjugation prerequisites not satisfied');
    const plasmid=state.molecular.molecules.find(m=>m.id==='target');
    if(!plasmid || plasmid.topology !== 'circular' || !plasmid.blocks.some(b=>b.kind==='element')) throw new Error('Loaded circular plasmid required');
    next.recipientPlasmid={...structuredClone(plasmid),id:'recipient-target',lineageId:'target'};
    next.cells[1].plasmids.push('recipient-target');
    next.phase='transferred';
  } else throw new Error('Unsupported bacterial action');
  return {state:next,event:{type:action,from:state.phase,to:next.phase,scope:action==='transpose'?'within donor cell':'between donor and recipient cells'}};
}
export function resistanceExample(stage) {
  if(!Number.isInteger(stage)||stage<0||stage>2) throw new Error('Invalid stage');
  let state=initialBacteria();const events=[];
  for(const action of ['transpose','conjugate'].slice(0,stage)){const result=bacterialTransition(state,action);state=result.state;events.push(result.event);}
  return {state,events};
}
export function targetingCompatible(route,context,factorAvailable=true) {
  if(!['tnsd','tnse'].includes(route)||!['attTn7-glmS','replication-transfer'].includes(context)) throw new Error('Unsupported target context');
  return factorAvailable && ((route==='tnsd'&&context==='attTn7-glmS')||(route==='tnse'&&context==='replication-transfer'));
}
export function predictionFeedback(expected,predicted,explanation) {
  return {correct:expected===predicted,text:`${expected===predicted?'Supported.':'Reconsider.'} Expected: ${expected}. ${explanation}`};
}
