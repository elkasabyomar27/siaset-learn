import { clone, requireCondition } from './contracts.js';
import { copies, molecule, requireEnds, serialize, targetParts, totalLength } from './model.js';
function requireRes(copy) {
  const res=copy.sites.find(s=>s.key==='res');
  requireCondition(res?.kind==='res' && res.start>0 && res.end<copy.length && res.orientation===copy.orientation,'RES','An appropriate directly oriented internal res region is required in each Tn3 copy.');
  return res;
}
export function replicateTn3(state,action) {
  requireCondition(state.scenario==='tn3' && state.phase==='initial','PRECONDITION','Tn3 replication requires separate initial replicons.');
  requireCondition(state.enzymes.transposase,'TRANSPOSASE','Tn3 transposase must be available.');
  const donor=state.molecules.find(m=>m.id==='donor');const target=state.molecules.find(m=>m.id==='target');const original=copies(state)[0];
  requireCondition(donor?.topology==='circular' && donor.blocks.length===2 && donor.blocks[0].sourceId==='donor' && donor.blocks[1].copyId===original.copyId,'DONOR','Expected the intact symbolic circular Tn3 donor.');
  requireEnds(original); requireRes(original);
  requireCondition(['tnpA','tnpR','bla'].every(key=>original.sites.some(s=>s.key===key)),'INTACT_TN3','The selected reference system requires intact Tn3 functional anatomy.');
  const duplicate=clone(original);duplicate.id='copy-2';duplicate.copyId='copy-2';duplicate.derivedFrom=original.copyId;
  const {left,right,rest}=targetParts(target,action.targetBoundary,5);
  const next=clone(state);next.phase='cointegrate';
  next.molecules=[molecule('cointegrate','Tn3 cointegrate · donor + target','circular',[clone(donor.blocks[0]),clone(original),right,...rest,left,duplicate],{parentIds:['donor','target']})];
  next.topologyNote='One circular cointegrate. Supercoiling and protein geometry are assumed permissive, not calculated.';
  requireCondition(copies(next).length===2 && copies(next).every(c=>c.orientation===original.orientation) && totalLength(next)===totalLength(state)+original.length+5,'POSTCONDITION','Cointegrate copy-number or length invariant failed.');
  return next;
}
export function resolveTn3(state,action) {
  requireCondition(state.scenario==='tn3' && state.phase==='cointegrate','PRECONDITION','Resolution requires the completed Tn3 cointegrate.');
  requireCondition(state.enzymes.resolvase && (action.resolvaseAvailable===undefined || action.resolvaseAvailable===true),'TNPR','TnpR resolvase must be available; cointegrate remains unchanged.');
  requireCondition(state.molecules.length===1 && state.molecules[0].topology==='circular','COINTEGRATE','Resolution requires a single circular cointegrate.');
  const cointegrate=state.molecules[0];const cs=copies(state);const [first,second]=cs;
  requireCondition(first.orientation===second.orientation && first.orientation===1,'DIRECT_REPEATS','Tn3 copies must be directly oriented in this model.');
  const r1=requireRes(first);const r2=requireRes(second);
  requireCondition(r1.start===r2.start && r1.end===r2.end && first.length===second.length && serialize(first.sites)===serialize(second.sites),'RES_COMPATIBILITY','The selected model requires matching intact res regions and equivalent element anatomy.');
  requireEnds(first);requireEnds(second);
  const donorBlocks=cointegrate.blocks.filter(b=>b.kind==='backbone'&&b.sourceId==='donor');
  const targetBlocks=cointegrate.blocks.filter(b=>b.kind==='backbone'&&b.sourceId==='target');
  const left=cointegrate.blocks.find(b=>b.kind==='tsd'&&b.side==='left');const right=cointegrate.blocks.find(b=>b.kind==='tsd'&&b.side==='right');
  requireCondition(donorBlocks.length===1 && targetBlocks.length>0 && left && right && left.bp===5 && right.bp===5 && left.pairId===right.pairId && serialize(left.sourceSegments)===serialize(right.sourceSegments),'JUNCTIONS','Cointegrate backbone and target junctions must be traceable.');
  const expectedOrder=[...donorBlocks,first,right,...targetBlocks,left,second].map(b=>b.id);
  requireCondition(serialize(cointegrate.blocks.map(b=>b.id))===serialize(expectedOrder),'JUNCTION_ORDER','Backbone/element order is incompatible with the selected resolution pathway.');
  // Coarse-grained site-specific recombination: equivalent halves exchange at res.
  // Positions are schematic; parent copies describe material ancestry, not intact identity.
  const donorCopy={...clone(first),recombinantOf:[first.copyId,second.copyId],recombinationSite:'res'};
  const targetCopy={...clone(second),recombinantOf:[second.copyId,first.copyId],recombinationSite:'res'};
  const next=clone(state);next.phase='resolved';
  next.molecules=[molecule('donor','Resolved donor replicon','circular',[...clone(donorBlocks),donorCopy],{parentId:'cointegrate'}),molecule('target','Resolved target replicon','circular',[clone(right),...clone(targetBlocks),clone(left),targetCopy],{parentId:'cointegrate'})];
  next.topologyNote='Two circular replicon structures; products may remain catenated. Physical unlinking / decatenation is not simulated.';
  requireCondition(totalLength(next)===totalLength(state) && copies(next).length===2 && next.molecules.every(m=>m.blocks.filter(b=>b.kind==='element').length===1),'POSTCONDITION','Resolution must preserve two element copies and all modeled material.');
  return next;
}
