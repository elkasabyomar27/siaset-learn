import { clone, requireCondition } from './contracts.js';
import { copies, molecule, requireEnds, targetParts, totalLength } from './model.js';
export function transposeTn5(state, action) {
  requireCondition(state.scenario==='tn5' && state.phase==='initial','PRECONDITION','Tn5 requires its initial donor and target.');
  requireCondition(state.enzymes.transposase,'TRANSPOSASE','Transposase is required.');
  const donor=state.molecules.find(m=>m.id==='donor'); const target=state.molecules.find(m=>m.id==='target');
  const copy=copies(state)[0]; requireEnds(copy);
  requireCondition(donor?.topology==='linear' && donor.blocks.length===3 && donor.blocks[1].id===copy.id && donor.blocks[0].sourceId==='donor' && donor.blocks[2].sourceId==='donor','DONOR','This representative model requires a linear donor with two flanks.');
  const {left,right,rest}=targetParts(target,action.targetBoundary,9);
  const next=clone(state); next.phase='inserted'; next.donorRepair='unresolved';
  next.molecules=[
    molecule('donor-left-fragment','Donor left fragment · unrepaired','linear',[clone(donor.blocks[0])],{parentId:'donor',endStatus:'unrepaired'}),
    molecule('donor-right-fragment','Donor right fragment · unrepaired','linear',[clone(donor.blocks[2])],{parentId:'donor',endStatus:'unrepaired'}),
    molecule('target','Target with Tn5 insertion','circular',[left,clone(copy),right,...rest])
  ];
  requireCondition(copies(next).length===1 && totalLength(next)===totalLength(state)+9,'POSTCONDITION','Tn5 must conserve one element and duplicate nine target units.');
  return next;
}
