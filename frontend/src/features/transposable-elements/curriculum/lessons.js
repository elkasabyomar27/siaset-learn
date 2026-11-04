import {phase6} from './phase6.js';
import {phase5} from './phase5.js';
const question = (question, options, correct, explanation) => ({question, options, correct, explanation});
const variant = (label, blocks, explanation) => ({label, blocks, explanation});
export const lessons = [
  {
    id:'introduction', objectives:['Infer autonomy from encoded functions.','Separate autonomy from present mobility.'], terms:['autonomous','non-autonomous','in trans'], references:['acds'],
    concept:'Transposable elements can change genomic location. Autonomous elements encode their own element-specific movement machinery. Non-autonomous elements depend on compatible machinery supplied in trans. Both still require appropriate cellular conditions.',
    variants:[variant('Intact Ac',['end','Ac transposase gene','end'],'Ac encodes its transposase and is autonomous.'),variant('Ds alone',['end','Ds: no functional transposase','end'],'This representative Ds cannot supply transposase.'),variant('Ds with Ac',['end','Ds + Ac protein in trans','end'],'Compatible Ac protein can support movement. Ds remains non-autonomous.')],
    exercise:question('Ds moves when Ac protein is supplied. What is Ds?',['Autonomous now','Non-autonomous, complemented in trans','An RNA element'],1,'Supplying protein changes mobility conditions, not the genetic capacity encoded by Ds.'),
    check:question('Does an intact transposase gene guarantee an insertion now?',['Yes','No: compatible ends, protein activity and host conditions also matter'],1,'Autonomy describes capacity, not a guaranteed event.'),
    limitations:'Representative compatible Ac/Ds system only. No insertion frequency, host factors or preferences are calculated.'
  },
  {
    id:'discovery', objectives:['Connect McClintock’s maize observations to mobile DNA.','Predict representative Ds dependence on Ac.'],terms:['maize','Ac','Ds','mutable locus'],references:['mcclintock1950','acds'],
    concept:'Barbara McClintock connected changing chromosome behavior and mutable loci in maize to controlling elements. Ac (Activator) and Ds (Dissociation) became a foundational mobile-DNA system. Ds derivatives are structurally diverse; this lesson selects a non-autonomous derivative with compatible ends.',
    variants:[variant('Maize observations',['chromosome','mutable locus','chromosome'],'Genetic and cytological observations supported the controlling-element interpretation; this is not a reconstructed experiment.'),variant('Ac absent',['Ds ends','no compatible transposase','Ds ends'],'The selected Ds cannot undergo Ac-dependent movement without compatible transposase.'),variant('Ac present',['Ds ends','Ac transposase available','Ds ends'],'Movement becomes possible, not certain.')],
    exercise:question('Remove Ac and every other compatible transposase source. Predict Ds mobility.',['Ds self-mobilizes','Ac-dependent movement is unsupported','Ds becomes Class I'],1,'The selected Ds cannot encode functional transposase.'),
    check:question('Why qualify claims about Ds?',['All copies are identical','Different Ds derivatives have different structures'],1,'A single schematic cannot explain every Ds-associated chromosome or phenotype outcome.'),
    limitations:'No kernel color, timing, chromosome breakage or excision footprint is simulated. Historical observations are not generated experimental evidence.'
  },
  {
    id:'anatomy',objectives:['Identify ends, coding regions and orientation.','Distinguish TIRs from TSDs.'],terms:['TIR','TSD','orientation','transposase','cargo'],references:['tn5-ends','tn5-tsd'],
    concept:'In a representative TIR-bearing DNA element, terminal recognition regions and internal genes belong to the element. TSDs are host-derived direct repeats outside the insertion. Transposase genes encode movement machinery; accessory cargo serves other functions.',
    variants:[variant('Boundaries',['TSD →','TIR →','transposase →','← TIR','TSD →'],'The outer TSDs are host-derived. Opposing terminal arrows represent inverted end motifs.'),variant('Genes',['TIR →','transposase →','cargo →','← TIR'],'Coding arrows show schematic orientation; cargo and transposase have different roles.'),variant('Insertion junction',['host','TSD →','element →','TSD →','host'],'Both TSD copies trace to one target site, not two elements.')],
    exercise:question('Which regions move as part of this element?',['Host TSDs','Terminal ends and internal genes','All nearby host DNA'],1,'TIRs lie inside element boundaries; TSDs lie outside.'),
    check:question('Two flanking direct host repeats demonstrate what?',['Two element copies','Target-site duplication'],1,'Count complete elements independently of the target repeats.'),
    limitations:'Generic TIR-bearing architecture, not every DNA element. The Tn5 19 bp recognition region is not a perfect 19 bp inverted repeat. No nucleotide sequence or scale is asserted.'
  },
  {
    id:'classification',objectives:['Classify pathways by their intermediates.','Explain why Class II does not imply cut-and-paste.'],terms:['Class I','Class II','RNA intermediate','reverse transcription'],references:['ty','tn5-conservative','kitts1982'],
    concept:'Class I movement uses an RNA intermediate and reverse transcription to produce DNA. Class II movement is DNA-based and includes diverse pathways. Conservative Tn5 and replicative Tn3 are both Class II; the classification alone does not determine copy-number outcome.',
    variants:[variant('Ty: Class I',['DNA','RNA','reverse transcription','new DNA'],'Yeast Ty provides an experimentally supported RNA-intermediate example.'),variant('Tn5: Class II',['donor DNA','element relocation','target DNA'],'The selected conservative pathway relocates one element.'),variant('Tn3: Class II',['donor + target DNA','replication','cointegrate'],'A DNA-based pathway can increase element copy number.')],
    exercise:question('An element uses RNA followed by reverse transcription. Classify it.',['Class II because its product is DNA','Class I','Cannot classify'],1,'The intermediate and reverse-transcription step identify Class I.'),
    check:question('Does DNA-based movement always require conservative excision?',['Yes','No, replicative pathways also exist'],1,'Tn3 is a counterexample to a universal cut-and-paste claim.'),
    limitations:'Conceptual pathways, not additional calculated engines. Ty does not stand for every LTR or non-LTR mechanism.'
  },
  {
    id:'dna-diversity',objectives:['Compare conservative and replicative copy outcomes.','Separate transposition from resolution.'],terms:['conservative','replicative','cointegrate','res','TnpR'],references:['tn5-conservative','kitts1982','bennett1983','kostriken1981'],
    concept:'DNA transposons do not share one universal mechanism. The selected Tn5 model conserves one element copy. The documented Tn3 interplasmid pathway creates a two-copy cointegrate. TnpR-mediated resolution is a separate recombination operation that partitions, rather than deletes, those copies.',
    variants:[variant('Tn5',['donor: 1','target: 0','after: target 1'],'One copy overall, with target-side 9 bp TSDs; donor repair is unresolved.'),variant('Tn3 cointegrate',['both backbones','one circle','Tn3 → / Tn3 →'],'Replication creates two directly oriented copies in one circle.'),variant('Tn3 resolution',['cointegrate: 2','res + TnpR','replicons: 1 + 1'],'Two copies remain; target-side 5 bp TSDs persist. Physical unlinking is not calculated.')],
    exercise:question('One circle contains both backbones and two direct Tn3 copies. What occurred?',['Resolution removed a copy','Replicative cointegrate formation','Conservative Tn5 excision'],1,'The selected replicative transition joins backbones and increases copy number.'),
    check:question('How many Tn3 copies remain after resolution?',['Two overall','One overall'],0,'Resolution does not reverse replication.'),
    limitations:'The selected cointegrate route is not obligatory for every Tn3 event. Diagrams here are explanatory; launch the laboratories for calculated states.'
  },
  {
    id:'insertion-sequences',objectives:['Identify terminal regions and transposition-related genes.','Distinguish movement machinery from accessory cargo.'],terms:['IS','IS10','terminal region','transposition gene'],references:['is10-primary','tn5-ends'],
    concept:'Insertion sequences are compact elements whose genes primarily support transposition and its regulation. A representative IS10 contains terminal recognition regions and transposition-related coding DNA. The accessory resistance region in the composite examples is distinct from these movement functions. IS families differ in organization and mechanism.',
    variants:[variant('IS10',['terminal end','transposition gene →','terminal end'],'Simplified IS10 architecture; regulatory and possible overlapping coding details are omitted.'),variant('Composite comparison',['IS module','resistance cargo','IS module'],'Cargo bracketed by IS modules is a composite architecture, not a single simple IS.'),variant('Functional asymmetry',['IS10-L','cargo','IS10-R'],'Native Tn10 modules are not functionally equivalent: IS10-R supplies normal movement functions.')],
    exercise:question('Which region directly supplies movement machinery?',['Transposition-related gene','Resistance cargo','Host TSD'],0,'Resistance cargo has a different function from transposition genes.'),
    check:question('Can one IS diagram establish every IS family’s mechanism?',['Yes','No, family-specific evidence is needed'],1,'Coding organization, ends and mechanisms vary.'),
    limitations:'IS10 is a representative example, not a universal template. No IS movement or regulation is calculated.'
  },
  {
    id:'composite',objectives:['Compare Tn5, Tn10 and Tn9 architectures.','Separate IS modules, cargo, terminal motifs and TSDs.'],terms:['composite transposon','IS50','IS10','IS1','accessory cargo'],references:['tn5-ends','is10-primary','tn9-primary'],
    concept:'Composite transposons can contain accessory genes between flanking IS modules. Classical Tn5 and Tn10 have inverted IS50 and IS10 modules, respectively. Tn9 has directly repeated IS1 modules around chloramphenicol-resistance cargo. Whole-module orientation differs from short terminal motifs within each IS; architecture alone does not establish a shared pathway.',
    variants:[variant('Tn5',['IS50-L →','resistance cargo','← IS50-R'],'Inverted IS50 modules; this expands anatomy without changing the abstract engine.'),variant('Tn10',['IS10-L →','tetracycline cargo','← IS10-R'],'Inverted IS10 modules with unequal functional capacity.'),variant('Tn9',['IS1 →','chloramphenicol cargo','IS1 →'],'Direct IS1 repeats in classical Tn9; these are not host-derived TSDs.')],
    exercise:question('Both Tn9 IS1 arrows point the same way. What follows?',['Direct IS modules, not host TSDs','They are short TIR motifs','Tn9 must use the Tn5 pathway'],0,'Whole IS modules flank cargo. Their orientation does not establish a transposition mechanism.'),
    check:question('Does resistance cargo itself encode the movement machinery in these examples?',['Yes','No, that role is associated with the IS modules'],1,'Cargo and transposition functions are distinct; intact ends and functional machinery still matter.'),
    limitations:'Classical symbolic architectures only. Neither flanking module is assumed equally functional. Tn9 is an anatomy example, not an implemented conservative or replicative simulation.'
  }
];
lessons.push(...phase5, phase6);
export const lessonById = id => lessons.find(l => l.id === id);
export const topicHref = topic => topic.learning?.kind === 'laboratory'
  ? `/lab/transposable-elements?experiment=${topic.learning.experiment}`
  : topic.status === 'implemented' && topic.lessonId ? `/learn/transposable-elements/${topic.lessonId}` : null;
