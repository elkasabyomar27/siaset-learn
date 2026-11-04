import { SCHEMA_VERSION, clone, requireCondition, validateFeature } from './contracts.js';

export function element(family, copyId) {
  // All positions are illustrative; they are not a sequence-derived gene map.
  const sites = [
    { key:'tir-left', label:'Left TIR', kind:'TIR', start:0, end:19, orientation:1 },
    { key:'tir-right', label:'Right TIR', kind:'TIR', start:281, end:300, orientation:-1 },
    { key:'tnpA', label:family === 'Tn5' ? 'Transposase region' : 'tnpA', kind:'gene', start:160, end:260, orientation:1 }
  ];
  if (family === 'Tn3') sites.push(
    { key:'tnpR', label:'tnpR', kind:'gene', start:40, end:80, orientation:-1 },
    { key:'res', label:'res', kind:'res', start:100, end:120, orientation:1 },
    { key:'bla', label:'bla cargo', kind:'gene', start:265, end:278, orientation:1 }
  );
  return { id:copyId, kind:'element', family, copyId, length:300, orientation:1, sites };
}
export function backbone(id, sourceId, start, end) {
  return { id, kind:'backbone', sourceId, sourceRange:[start,end], length:end-start, orientation:1 };
}
export function molecule(id, name, topology, blocks, extra = {}) {
  let offset = 0;
  const features = [];
  for (const b of blocks) {
    const start = offset; offset += b.length;
    features.push({ id:b.id, kind:b.kind, label:b.kind === 'element' ? b.family : b.kind === 'tsd' ? `${b.bp} bp TSD · ${b.side}` : `${b.sourceId} backbone`, orientation:b.orientation, segments:[[start,offset]], ...(b.copyId ? {copyId:b.copyId} : {}) });
    for (const site of b.sites || []) features.push({ id:`${b.copyId}:${site.key}`, parentId:b.copyId, kind:site.kind, label:site.label, orientation:site.orientation, segments:[[start+site.start,start+site.end]] });
  }
  features.push(...clone(extra.annotations||[]));
  return { id, name, topology, length:offset, blocks, features, backboneIds:[...new Set(blocks.filter(b=>b.kind==='backbone').map(b=>b.sourceId))], ...extra };
}
export function createInitial(scenario = 'tn5') {
  requireCondition(['tn5','tn3'].includes(scenario),'SCENARIO','Only Tn5 and Tn3 are executable.');
  const family = scenario === 'tn5' ? 'Tn5' : 'Tn3';
  const blocks = scenario === 'tn5'
    ? [backbone('donor-left','donor',0,300),element(family,'copy-1'),backbone('donor-right','donor',300,700)]
    : [backbone('donor-backbone','donor',0,700),element(family,'copy-1')];
  return { schemaVersion:SCHEMA_VERSION, revision:0, scenario, phase:'initial', enzymes:{transposase:true,resolvase:true}, donorRepair:scenario==='tn5'?'not-excised':'not-applicable', topologyNote:'No strand topology is calculated.', molecules:[molecule('donor','Donor DNA',scenario==='tn5'?'linear':'circular',blocks),molecule('target','Target DNA','circular',[backbone('target-backbone','target',0,900)])] };
}
export const copies = state => state.molecules.flatMap(m=>m.blocks.filter(b=>b.kind==='element'));
export const totalLength = state => state.molecules.reduce((n,m)=>n+m.length,0);
export function serialize(value) {
  // Canonical object-key ordering; array ordering remains molecularly significant.
  if (Array.isArray(value)) return `[${value.map(serialize).join(',')}]`;
  if (value!==null && typeof value==='object') return `{${Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>`${JSON.stringify(k)}:${serialize(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function validateState(state) {
  requireCondition(state?.schemaVersion === SCHEMA_VERSION,'STATE_VERSION','Unsupported state schema.');
  requireCondition(Number.isInteger(state.revision) && state.revision>=0,'REVISION','Invalid revision.');
  requireCondition(['tn5','tn3'].includes(state.scenario),'SCENARIO','Unknown mechanism.');
  requireCondition((state.scenario==='tn5'?['initial','inserted']:['initial','cointegrate','resolved']).includes(state.phase),'PHASE','Invalid molecular phase.');
  requireCondition(typeof state.enzymes?.transposase==='boolean' && typeof state.enzymes?.resolvase==='boolean','ENZYMES','Enzyme availability must be explicit.');
  requireCondition(Array.isArray(state.molecules) && state.molecules.length>0,'MOLECULES','Molecules are required.');
  const ids = new Set(); const featureIds = new Set();
  for (const m of state.molecules) {
    requireCondition(typeof m.id==='string' && !ids.has(m.id),'MOLECULE_ID','Duplicate or invalid molecule ID.'); ids.add(m.id);
    requireCondition(['linear','circular'].includes(m.topology) && Number.isInteger(m.length) && m.length>0,'TOPOLOGY','Invalid molecule topology/length.');
    requireCondition(Array.isArray(m.blocks) && m.blocks.length>0,'BLOCKS','Ordered molecular blocks are required.');
    for (const b of m.blocks) {
      requireCondition(['backbone','element','tsd'].includes(b.kind) && Number.isInteger(b.length) && b.length>0 && [1,-1].includes(b.orientation),'BLOCK','Invalid molecular block.');
      if (b.kind==='backbone') requireCondition(['donor','target'].includes(b.sourceId) && Array.isArray(b.sourceRange) && b.sourceRange.every(Number.isInteger) && b.sourceRange[1]-b.sourceRange[0]===b.length && b.sourceRange[0]>=0 && b.sourceRange[1]<=(b.sourceId==='donor'?700:900),'BACKBONE','Backbone ancestry must match its length and original extent.');
      if (b.kind==='element') {
        requireCondition(b.family===(state.scenario==='tn5'?'Tn5':'Tn3') && typeof b.copyId==='string' && b.id===b.copyId && Array.isArray(b.sites),'ELEMENT','Invalid element identity.');
        requireCondition(new Set(b.sites.map(s=>s.key)).size===b.sites.length,'SITES','Site keys must be unique.');
        for (const s of b.sites) requireCondition(Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start>=0&&s.end>s.start&&s.end<=b.length&&[1,-1].includes(s.orientation),'SITES','Invalid internal site.');
      }
      if (b.kind==='tsd') requireCondition(b.sourceId==='target' && b.bp===(state.scenario==='tn5'?9:5) && b.length===b.bp && ['left','right'].includes(b.side) && b.pairId==='target-tsd-pair' && Array.isArray(b.sourceSegments) && b.sourceSegments.every(([a,z])=>Number.isInteger(a)&&Number.isInteger(z)&&a>=0&&z>a&&z<=900) && b.sourceSegments.reduce((n,[a,z])=>n+z-a,0)===b.bp,'TSD','TSD must derive from the target site.');
    }
    const derived = molecule(m.id,m.name,m.topology,m.blocks,{annotations:m.annotations||[]});
    requireCondition(m.length===derived.length && serialize(m.features)===serialize(derived.features) && serialize(m.backboneIds)===serialize(derived.backboneIds),'DERIVED_FEATURES','Feature map disagrees with ordered blocks.');
    for (const f of m.features) { validateFeature(f,m.length); requireCondition(!featureIds.has(f.id),'FEATURE_ID','Feature identities must be unique.'); featureIds.add(f.id); }
  }
  const cs = copies(state);
  requireCondition(new Set(cs.map(c=>c.copyId)).size===cs.length,'COPY_ID','Copy identities must be unique.');
  requireCondition(cs.length===(state.scenario==='tn3' && state.phase!=='initial'?2:1),'COPY_COUNT','Unexpected mechanism-specific copy number.');
  const blocks=state.molecules.flatMap(m=>m.blocks);
  const tsds=blocks.filter(b=>b.kind==='tsd');
  requireCondition(tsds.length===(state.phase==='initial'?0:2),'TSD_COUNT','Expected one target duplication pair after insertion.');
  if(tsds.length) requireCondition(tsds[0].side!==tsds[1].side && serialize(tsds[0].sourceSegments)===serialize(tsds[1].sourceSegments),'TSD_PAIR','Duplicated flanks must trace to the same host interval.');
  for(const [sourceId,extent] of [['donor',700],['target',900]]) {
    const ranges=blocks.filter(b=>b.kind==='backbone'&&b.sourceId===sourceId).map(b=>b.sourceRange);
    // The left TSD is the retained original site; right is its new duplicate.
    if(sourceId==='target') ranges.push(...tsds.filter(b=>b.side==='left').flatMap(b=>b.sourceSegments));
    ranges.sort((a,b)=>a[0]-b[0]);let covered=0;
    for(const [a,z] of ranges){requireCondition(a===covered,'BACKBONE_COVERAGE','Backbone source material has a gap or overlap.');covered=z;}
    requireCondition(covered===extent,'BACKBONE_COVERAGE','Backbone source material was lost.');
  }
  const expectedMolecules=state.phase==='initial'?2:state.scenario==='tn5'?3:state.phase==='cointegrate'?1:2;
  requireCondition(state.molecules.length===expectedMolecules,'MOLECULE_COUNT','Unexpected structural product count.');
  requireCondition(totalLength(state)===(state.phase==='initial'?1900:state.scenario==='tn5'?1909:2205),'TOTAL_LENGTH','Unexpected total symbolic material.');
  if(state.scenario==='tn3')requireCondition(state.molecules.every(m=>m.topology==='circular'),'TOPOLOGY','This Tn3 interplasmid model requires circular molecules.');
  return true;
}
export function requireEnds(copy) {
  const left=copy.sites.find(s=>s.key==='tir-left'); const right=copy.sites.find(s=>s.key==='tir-right');
  requireCondition(left?.kind==='TIR' && right?.kind==='TIR' && left.start===0 && right.end===copy.length && left.orientation===1 && right.orientation===-1,'TIR','Both inward-facing terminal ends are required.');
}
// Rotate an initially unannotated circular target to the selected teaching boundary.
// The original target site occurs once as left TSD; right TSD is the new copy.
export function targetParts(target, position, bp) {
  requireCondition(target?.topology==='circular' && target.blocks.length===1 && target.blocks[0].kind==='backbone' && target.blocks[0].sourceId==='target' && !target.annotations?.length,'TARGET','Expected an intact unannotated target circle. Annotated-target remapping is outside this guided model.');
  requireCondition(Number.isInteger(position) && position>=0 && position<=target.length,'BOUNDARY','Choose a boundary from 0 through target length.');
  position%=target.length;
  const ranges = position===0?[[0,target.length]]:[[position,target.length],[0,position]];
  let needed=bp; const site=[]; const rest=[];
  for (const [a,z] of ranges) {
    const taken=Math.min(needed,z-a);
    if(taken) site.push([a,a+taken]);
    if(a+taken<z) rest.push(backbone(`target-segment-${a+taken}`,'target',a+taken,z));
    needed-=taken;
  }
  requireCondition(needed===0,'TARGET','Target is shorter than the duplication site.');
  const tsd = side => ({ id:`target-tsd-${side}`,kind:'tsd',length:bp,bp,orientation:1,side,sourceId:'target',sourceSegments:clone(site),pairId:'target-tsd-pair' });
  return {left:tsd('left'),right:tsd('right'),rest};
}
