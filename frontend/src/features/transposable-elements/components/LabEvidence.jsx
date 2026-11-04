export default function LabEvidence({
  scenario,
  activeProfile,
  activeRefs
}) {
  return <section className="evidence panel"><div><p className="eyebrow">SCIENTIFIC BASIS</p><h2>A model with explicit boundaries.</h2><p>{scenario === 'tn5' ? 'The donor repair outcome remains unresolved. Tn5 is one representative conservative mechanism; Class II also includes other DNA-based pathways.' : 'Selected intact Tn3 E. coli interplasmid cointegrate pathway. It is not obligatory for every Tn3 event. TnpR resolution is separate from transposition; products may remain linked.'}</p><p className="quiet">{activeProfile.sequenceProvenance}</p></div><div className="reference-list">{activeRefs.map(r => <a key={r.id} href={r.url} target="_blank" rel="noreferrer">{r.citation}<span>↗</span><small>{r.verification}</small></a>)}</div></section>;
}
