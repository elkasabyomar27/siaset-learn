# Phase 4 scientific and educational specification

Addendum to SCIENTIFIC_CONTRACTS.md. No molecular contracts, fixtures or engine functions changed. Topics 10–15 remain planned. Topics 6/7 retain their independent guided engines.

## introduction

Objectives: Infer autonomy from encoded functions. Separate autonomy from present mobility.

Terminology: autonomous, non-autonomous, in trans. Terms are explained in the core concept and view feedback.

Transposable elements can change genomic location. Autonomous elements encode their own element-specific movement machinery. Non-autonomous elements depend on compatible machinery supplied in trans. Both still require appropriate cellular conditions.

Activities:
- Intact Ac: Ac encodes its transposase and is autonomous.
- Ds alone: This representative Ds cannot supply transposase.
- Ds with Ac: Compatible Ac protein can support movement. Ds remains non-autonomous.

Applied reasoning: Ds moves when Ac protein is supplied. What is Ds?

Expected explanation: Supplying protein changes mobility conditions, not the genetic capacity encoded by Ds.

Assessment: Does an intact transposase gene guarantee an insertion now?

Expected explanation: Autonomy describes capacity, not a guaranteed event.

Reference IDs: acds (see profiles/references.json).

Simplifications and limits: Representative compatible Ac/Ds system only. No insertion frequency, host factors or preferences are calculated.

## discovery

Objectives: Connect McClintock’s maize observations to mobile DNA. Predict representative Ds dependence on Ac.

Terminology: maize, Ac, Ds, mutable locus. Terms are explained in the core concept and view feedback.

Barbara McClintock connected changing chromosome behavior and mutable loci in maize to controlling elements. Ac (Activator) and Ds (Dissociation) became a foundational mobile-DNA system. Ds derivatives are structurally diverse; this lesson selects a non-autonomous derivative with compatible ends.

Activities:
- Maize observations: Genetic and cytological observations supported the controlling-element interpretation; this is not a reconstructed experiment.
- Ac absent: The selected Ds cannot undergo Ac-dependent movement without compatible transposase.
- Ac present: Movement becomes possible, not certain.

Applied reasoning: Remove Ac and every other compatible transposase source. Predict Ds mobility.

Expected explanation: The selected Ds cannot encode functional transposase.

Assessment: Why qualify claims about Ds?

Expected explanation: A single schematic cannot explain every Ds-associated chromosome or phenotype outcome.

Reference IDs: mcclintock1950, acds (see profiles/references.json).

Simplifications and limits: No kernel color, timing, chromosome breakage or excision footprint is simulated. Historical observations are not generated experimental evidence.

## anatomy

Objectives: Identify ends, coding regions and orientation. Distinguish TIRs from TSDs.

Terminology: TIR, TSD, orientation, transposase, cargo. Terms are explained in the core concept and view feedback.

In a representative TIR-bearing DNA element, terminal recognition regions and internal genes belong to the element. TSDs are host-derived direct repeats outside the insertion. Transposase genes encode movement machinery; accessory cargo serves other functions.

Activities:
- Boundaries: The outer TSDs are host-derived. Opposing terminal arrows represent inverted end motifs.
- Genes: Coding arrows show schematic orientation; cargo and transposase have different roles.
- Insertion junction: Both TSD copies trace to one target site, not two elements.

Applied reasoning: Which regions move as part of this element?

Expected explanation: TIRs lie inside element boundaries; TSDs lie outside.

Assessment: Two flanking direct host repeats demonstrate what?

Expected explanation: Count complete elements independently of the target repeats.

Reference IDs: tn5-ends, tn5-tsd (see profiles/references.json).

Simplifications and limits: Generic TIR-bearing architecture, not every DNA element. The Tn5 19 bp recognition region is not a perfect 19 bp inverted repeat. No nucleotide sequence or scale is asserted.

## classification

Objectives: Classify pathways by their intermediates. Explain why Class II does not imply cut-and-paste.

Terminology: Class I, Class II, RNA intermediate, reverse transcription. Terms are explained in the core concept and view feedback.

Class I movement uses an RNA intermediate and reverse transcription to produce DNA. Class II movement is DNA-based and includes diverse pathways. Conservative Tn5 and replicative Tn3 are both Class II; the classification alone does not determine copy-number outcome.

Activities:
- Ty: Class I: Yeast Ty provides an experimentally supported RNA-intermediate example.
- Tn5: Class II: The selected conservative pathway relocates one element.
- Tn3: Class II: A DNA-based pathway can increase element copy number.

Applied reasoning: An element uses RNA followed by reverse transcription. Classify it.

Expected explanation: The intermediate and reverse-transcription step identify Class I.

Assessment: Does DNA-based movement always require conservative excision?

Expected explanation: Tn3 is a counterexample to a universal cut-and-paste claim.

Reference IDs: ty, tn5-conservative, kitts1982 (see profiles/references.json).

Simplifications and limits: Conceptual pathways, not additional calculated engines. Ty does not stand for every LTR or non-LTR mechanism.

## dna-diversity

Objectives: Compare conservative and replicative copy outcomes. Separate transposition from resolution.

Terminology: conservative, replicative, cointegrate, res, TnpR. Terms are explained in the core concept and view feedback.

DNA transposons do not share one universal mechanism. The selected Tn5 model conserves one element copy. The documented Tn3 interplasmid pathway creates a two-copy cointegrate. TnpR-mediated resolution is a separate recombination operation that partitions, rather than deletes, those copies.

Activities:
- Tn5: One copy overall, with target-side 9 bp TSDs; donor repair is unresolved.
- Tn3 cointegrate: Replication creates two directly oriented copies in one circle.
- Tn3 resolution: Two copies remain; target-side 5 bp TSDs persist. Physical unlinking is not calculated.

Applied reasoning: One circle contains both backbones and two direct Tn3 copies. What occurred?

Expected explanation: The selected replicative transition joins backbones and increases copy number.

Assessment: How many Tn3 copies remain after resolution?

Expected explanation: Resolution does not reverse replication.

Reference IDs: tn5-conservative, kitts1982, bennett1983, kostriken1981 (see profiles/references.json).

Simplifications and limits: The selected cointegrate route is not obligatory for every Tn3 event. Diagrams here are explanatory; launch the laboratories for calculated states.

## insertion-sequences

Objectives: Identify terminal regions and transposition-related genes. Distinguish movement machinery from accessory cargo.

Terminology: IS, IS10, terminal region, transposition gene. Terms are explained in the core concept and view feedback.

Insertion sequences are compact elements whose genes primarily support transposition and its regulation. A representative IS10 contains terminal recognition regions and transposition-related coding DNA. The accessory resistance region in the composite examples is distinct from these movement functions. IS families differ in organization and mechanism.

Activities:
- IS10: Simplified IS10 architecture; regulatory and possible overlapping coding details are omitted.
- Composite comparison: Cargo bracketed by IS modules is a composite architecture, not a single simple IS.
- Functional asymmetry: Native Tn10 modules are not functionally equivalent: IS10-R supplies normal movement functions.

Applied reasoning: Which region directly supplies movement machinery?

Expected explanation: Resistance cargo has a different function from transposition genes.

Assessment: Can one IS diagram establish every IS family’s mechanism?

Expected explanation: Coding organization, ends and mechanisms vary.

Reference IDs: is10-primary, tn5-ends (see profiles/references.json).

Simplifications and limits: IS10 is a representative example, not a universal template. No IS movement or regulation is calculated.

## composite

Objectives: Compare Tn5, Tn10 and Tn9 architectures. Separate IS modules, cargo, terminal motifs and TSDs.

Terminology: composite transposon, IS50, IS10, IS1, accessory cargo. Terms are explained in the core concept and view feedback.

Composite transposons can contain accessory genes between flanking IS modules. Classical Tn5 and Tn10 have inverted IS50 and IS10 modules, respectively. Tn9 has directly repeated IS1 modules around chloramphenicol-resistance cargo. Whole-module orientation differs from short terminal motifs within each IS; architecture alone does not establish a shared pathway.

Activities:
- Tn5: Inverted IS50 modules; this expands anatomy without changing the abstract engine.
- Tn10: Inverted IS10 modules with unequal functional capacity.
- Tn9: Direct IS1 repeats in classical Tn9; these are not host-derived TSDs.

Applied reasoning: Both Tn9 IS1 arrows point the same way. What follows?

Expected explanation: Whole IS modules flank cargo. Their orientation does not establish a transposition mechanism.

Assessment: Does resistance cargo itself encode the movement machinery in these examples?

Expected explanation: Cargo and transposition functions are distinct; intact ends and functional machinery still matter.

Reference IDs: tn5-ends, is10-primary, tn9-primary (see profiles/references.json).

Simplifications and limits: Classical symbolic architectures only. Neither flanking module is assumed equally functional. Tn9 is an anatomy example, not an implemented conservative or replicative simulation.

## Evidence and teaching status

Established claims are supported by the linked primary records. Ac/Ds uses the existing 2022 primary paper and McClintock historical record; Ty uses Boeke et al. (1985); Tn5 and Tn3 reuse the existing mechanism-specific evidence. New primary records are Halling et al. (1982) for IS10 anatomy and Alton & Vapnek (1979) for Tn9. The author-hosted Halling abstract and publisher Tn9 abstract were checked on 2026-11-02. Some PMC and publisher direct requests were blocked; search-indexed primary abstracts supplied the relevant confirmation. No new sequence, rate, exact coordinates, phenotype or experimental result is generated.

All lesson diagrams are explicitly explanatory. Whole-IS arrows indicate module orientation; short TIR motifs and host-derived TSDs are distinct objects. Diagram widths are not lengths, and moving between views does not execute a molecular transition. Native IS modules are not assumed functionally equivalent. Tn9 illustrates architecture, not a common Tn5-like pathway.

## Learning contract

Every lesson uses objectives → concept → three inspectable explanatory views → applied reasoning → independent knowledge check → completion summary and references. Both questions validate integer option indices. Incorrect answers receive causal feedback and permit retry. Completion is derived from all three inspections AND both currently correct answers; changing a correct answer to an incorrect one revokes completion. No completion boolean is trusted.

Progress is versioned browser-local data under siaset-lessons-v1. Parsing drops unknown topics, invalid indices and incompatible versions. Storage failure falls back to in-memory progress and a visible message. Reset removes only the selected lesson record. This is a learning aid, not a secure examination or backend record. Opening a page never completes it.
