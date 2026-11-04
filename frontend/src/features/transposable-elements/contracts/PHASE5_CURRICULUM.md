# Phase 5 scientific contract addendum

This extends the lesson contract only. Existing Tn5/Tn3 state schemas, transitions, coordinate contracts and fixtures are unchanged. Topic 15 is planned.

## New structural model

consequences.js implements fixed symbolic block templates, not arbitrary sequence editing. Preconditions: homologous TE repeats; direct orientation for intramolecular deletion; inverted orientation for intramolecular inversion; two misaligned sister substrates with direct repeats for unequal crossover. Invalid combinations throw before returning a product. No mutable state is accepted or edited.

Postconditions: deletion retains L–TE–R and an excised TE–X circle; inversion reverses X orientation without deleting it; unequal crossover returns both a duplication and a deletion product and conserves four repeat blocks and two X blocks across the two substrates. A single ideal homologous crossover is assumed. Circles indicate structural topology only; catenation, nucleotide junctions, copy survival and selection are unmodeled. These generic crossover templates are separate from transposition and do not claim to reproduce transposase-mediated Tn10 rearrangements. Primary Alu duplication evidence supports the biological relevance of repeat-mediated rearrangement, not every detail of the schematic templates.

Insertion and TSD examples call the existing engine transitions at symbolic target boundary 200. Tn3 displays the cointegrate; resolution is not silently performed. TSD pairs come directly from engine blocks and retain matching target sourceSegments and pairId. Student labels convert to one-based inclusive intervals. No new sequence is asserted.

## Assessment and storage

Phase 5 requires correct predictions for every scenario, an applied reasoning exercise and two separate knowledge checks. Wrong scenario predictions show contextual feedback and do not record inspection. Completion is derived; opening a lesson is insufficient. Both checks persist under the compatible version-1 storage structure; legacy Phase 4 records remain valid and new optional check2 fields are validated. Progress is a browser-local teaching aid, not tamper-resistant certification. Scenario definitions prescribe qualitative inference under explicit assumptions; they are not measured outcomes or quantitative simulations.

## genomic-consequences

Objectives: Distinguish insertion from recombination. Trace all products of rearrangements.

Terms: insertion, deletion, inversion, duplication, homology

Insertion and recombination between pre-existing TE copies are different events. Direct homologous repeats on one molecule can recombine to excise an intervening segment; inverted repeats can invert it. Unequal crossover between misaligned sister chromatids can generate reciprocal duplication and deletion. These are selected symbolic outcomes, not inevitable consequences of transposition.

- Insertion: Run the existing conservative Tn5 model. Donor repair stays unresolved. Expected inference: target insertion.
- Direct-repeat recombination: Homology and direct orientation on one molecule are assumed. Retain the excised circle. Expected inference: deletion.
- Inverted-repeat recombination: Homology and inverted orientation on one molecule are assumed. Expected inference: inversion.
- Unequal crossover: Two sister substrates are required; inspect both reciprocal products. Expected inference: duplication.

References: rearrangements, tn5-conservative (registry contains primary URLs and verification status).

Applied reasoning: Which event produces the modeled duplication? Duplication requires the explicitly selected recombination substrates.

Check 1: Where is the excised interval after direct-repeat recombination? A deletion from the retained molecule need not destroy the excised DNA.

Check 2: Does inversion require a new transposition event here? This model labels recombination separately.

Limits: One ideal reciprocal crossover; repeat homology and permissive context assumed. No crossover nucleotide, repair mechanism, viability or product stability inferred.

## phenotypes

Objectives: Separate molecular disruption from phenotype. Use undetermined when context is missing.

Terms: loss of function, conditional phenotype, neutral, undetermined

Insertion can disrupt a gene or regulatory region, but phenotype depends on function, redundancy and environment. These hypothetical qualitative contexts are assumptions, not experimental measurements.

- Coding insertion: Assume loss of enzyme function, no backup and growth requiring that pathway: phenotype likely altered. Expected inference: likely altered.
- Intergenic insertion: Assume no relevant function at this site under the selected condition: unchanged is plausible, not proven universally. Expected inference: likely unchanged.
- Regulatory insertion: Without promoter function and assay context, phenotype cannot be inferred. Expected inference: undetermined.
- Condition changed: Assume supplementation bypasses the lost pathway: growth may be unchanged even though molecular loss of function remains. Expected inference: likely unchanged.

References: is2-expression, mcclintock1950 (registry contains primary URLs and verification status).

Applied reasoning: An insertion lies in a regulatory region, but the assay and promoter functions are unknown. Predict phenotype. Position alone is insufficient.

Check 1: Can supplementation mask a biosynthetic defect? Phenotype can depend on environment.

Check 2: Does a coding insertion prove every measured trait changes? Molecular function and the assayed phenotype are separate levels.

Limits: Hypothetical contexts; no real gene identity, clinical interpretation, selection coefficient or quantitative growth prediction.

## expression

Objectives: Predict qualitative transcription effects under explicit assumptions. Distinguish promoter effects, termination and coding disruption.

Terms: promoter, read-through, termination, operon polarity, orientation

In bacteria an inserted element may interrupt a promoter, introduce an outward promoter, or impede transcription into downstream operon genes. Effects depend on promoter orientation, terminators and alternative transcription starts. The following idealized E. coli-like transcription contexts are not universal TE rules.

- Promoter disruption: Assume P is the sole functional promoter and is disabled: transcription from P is reduced. Expected inference: reduced.
- Outward promoter aligned: Assume an active outward promoter faces an intact promoterless gene with no intervening terminator: transcription becomes possible. IS3 supplies a documented mobile-promoter example. Expected inference: permitted.
- Outward promoter reversed: The promoter cannot directly drive rightward A transcription; without other promoter information total expression is undetermined. Expected inference: undetermined.
- Operon termination: Assume a functional terminator before B and no internal B promoter: downstream transcription is reduced (bacterial polarity). Expected inference: reduced.
- Read-through: Assume P remains active, transcription passes through and B is intact: B transcription is permitted; protein abundance remains unknown. Expected inference: permitted.

References: is3-promoter, is2-expression (registry contains primary URLs and verification status).

Applied reasoning: A TE disrupts gene A but an independent promoter drives B. Must B transcription decrease? Coding disruption is not the same as promoter loss or transcription termination.

Check 1: Can a reversed outward promoter directly transcribe a rightward gene? Transcription direction matters.

Check 2: What is needed to infer strong downstream transcriptional polarity here? Polarity depends on the specified bacterial context.

Limits: Qualitative transcription only. Terminator activity is a stipulated scenario condition, not inferred for all IS2/IS3 copies. No RNA/protein fold changes or universal phenotype inferred.

## tsd

Objectives: Trace host-derived duplicated target intervals. Compare Tn5 9 bp and Tn3 5 bp without generalizing.

Terms: TSD, TIR, staggered strand transfer, gap filling

In many transposition pathways, offset target-strand attacks leave gaps that synthesis and ligation can complete, producing direct host-derived target repeats. This explanation is schematic, not a strand-level simulation. TIRs belong to the element; TSDs flank it. TSD length is element-specific, and some elements do not generate TSDs.

- Tn5 junction: Inspect the existing Tn5 engine output and duplicated host interval. Expected inference: 9 bp.
- Tn3 junction: Inspect the existing Tn3 cointegrate. Resolution is a separate operation. Expected inference: 5 bp.
- Non-universal outcome: IS608 is a documented exception. No new IS608 engine is implemented. Expected inference: no TSD.

References: tn5-tsd, takeya1979, is608 (registry contains primary URLs and verification status).

Applied reasoning: Which features are host-derived? The target interval is copied; the terminal recognition regions are element-derived.

Check 1: Do two TSDs imply two element copies? Tn5 retains one element overall despite two target repeats.

Check 2: Can Tn5’s 9 bp rule be assigned to every element? Tn3 has 5 bp in the selected system and IS608 has no TSD.

Limits: Existing engine coordinates are symbolic units. TSD bp labels are literature-based. Offset target cleavage, synthesis and ligation are explanatory stages, not validated atomistic or strand geometry.

## regulation

Objectives: Identify element and organism-specific regulation. Separate molecular permission from event probability.

Terms: transposase, antisense RNA, RNA-OUT, DDM1, silencing

Regulation is system-specific. Ac protein can complement compatible Ds ends in maize. In bacterial IS10, promoter architecture controls transcription and RNA-OUT can inhibit transposase translation. In Arabidopsis, DDM1-associated chromatin and methylation participate in silencing selected elements such as CACTA1. Releasing one constraint does not guarantee movement.

- Maize: Ds without Ac: Assume no alternative compatible source: Ac-dependent transposition is not permitted. Expected inference: not permitted.
- Maize: Ac supplied: Under permissive host assumptions, the selected mobility gate is satisfied; an insertion is not guaranteed. Expected inference: permitted.
- Bacterial IS10: RNA-OUT: Assume functional antisense pairing and no compensating protein supply: transposase production is reduced relative to the unpaired condition. Expected inference: reduced.
- Bacterial IS10: promoter inactive: Assume no residual protein or alternative source: transposase availability gate is not met. Expected inference: not permitted.
- Arabidopsis CACTA1: silenced: Selected silenced CACTA1 context: mobility reduced relative to a released state. This is not bacterial regulation. Expected inference: reduced.
- Arabidopsis: ddm1 context: CACTA1 mobilization is documented in ddm1 backgrounds, but a particular copy’s next event cannot be predicted from this condition alone. Expected inference: undetermined.

References: acds, is10-antisense, is10-promoters, ddm1 (registry contains primary URLs and verification status).

Applied reasoning: RNA-OUT pairing is functional in bacterial IS10. What is the supported qualitative direction? Antisense pairing inhibits translation in this documented system.

Check 1: Does supplied Ac convert Ds into an autonomous element? Protein supplied in trans does not change Ds coding capacity.

Check 2: Does ddm1 guarantee movement of every Arabidopsis TE? Host silencing effects depend on family, copy and cellular context.

Limits: No universal stress switch or quantitative frequency. RNA-OUT acts at translation, distinct from promoter-level transcription. Host and element mechanisms are not interchangeable.

