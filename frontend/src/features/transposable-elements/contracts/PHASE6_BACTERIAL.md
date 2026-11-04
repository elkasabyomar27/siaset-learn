# Phase 6 scientific and event contracts

Addendum only. Existing Tn5/Tn3 contracts, states and fixtures are unchanged.

## Bounded bacterial state

Version 1 contains donor-cell, recipient-cell, stable donor-chromosome and recipient-chromosome identity markers, the existing Tn5 molecular state in the donor, and an optional recipient plasmid copy. The chromosome markers are not molecular genome simulations. The linear Tn5 donor is a symbolic fragment, not a full circular chromosome. The circular target is a curated conjugative plasmid with no asserted experimental identity.

transpose: initial → loaded. Requires the existing Tn5 engine preconditions, including active transposase and the selected donor/target forms. Calls the existing pure transition. Cellular ownership is unchanged. One element remains overall at this stage; donor repair is unresolved.

conjugate: loaded → transferred. Requires a cargo-bearing circular donor target plus conjugative capability, oriT, transfer machinery, contact, and a compatible recipient. This bounded completed-event abstraction assumes transfer DNA synthesis, establishment and maintenance. It retains donor DNA and adds recipient-target with lineageId target. It does not transfer a chromosome, perform transposition or predict expression. Recipient-local annotations retain the source molecular map; engine-local copy IDs are lineage annotations, not assertions of one physical copy across cells.

All actions return cloned state and an explicit event (operation, phase transition, cellular scope). Invalid phase, missing prerequisite or unsupported action rejects without mutation. Only two selected completed operations are supported; there is no general population simulator. The transfer flags are didactic premises, not a sufficient biological model of conjugation under all conditions. No helper-mediated mobilization is calculated.

## Targeting and integron boundaries

Tn7 compatibility classifies two specified contexts with the target factor available and TnsABC assumed. TnsD/TniQ-family targeting of the established glmS-associated region is distinct from TnsE-associated replication/transfer contexts. Unsupported context means insufficient support for this selected route, not proof that the route can never occur elsewhere. No insertion, probability, sequence or target coordinate is calculated. Existing Tn7 profiles remain planned as molecular engines.

Integron capture is explanatory only: IntI plus compatible attI/attC sites, with Pc supporting cassette expression in an appropriate context. It is site-specific recombination, not transposase-mediated transposition. A nested integron does not confer conjugation functions on its carrier. Selection is discussed qualitatively, not modeled as DNA transfer or a measured phenotype.

## Lesson and completion

All 12 scenarios require a correct classification/prediction to receive credit. An applied question and two knowledge checks are also required. Wrong predictions show a contextual explanation without credit. Existing browser-local version-1 progress remains compatible; Topic 15 adds a new record without clearing old lessons. Reopening the page does not complete it.

### 1 · Identify bacterial DNA

The chromosome is a cellular replicon; the plasmid is a separate replicon. Tn5 is a DNA element carried on a replicon, not a cell or an independently transferring plasmid.

Expected supported interpretation: replicons and embedded element.

### 2 · Within-cell movement

The selected Tn5 event moves one element from a symbolic linear donor fragment to the circular target plasmid inside the donor cell. The fragment is not a simulated complete chromosome.

Expected supported interpretation: transposition, not HGT.

### 2 · Between-cell transfer

Model a completed transfer with DNA synthesis and establishment assumed. The donor retains its plasmid; the recipient acquires a plasmid copy. This is not another transposition event.

Expected supported interpretation: conjugation / HGT.

### 2 · Nonconjugative plasmid

This plasmid cannot self-transfer under these assumptions. Some nonconjugative plasmids are mobilizable with compatible helper functions; that is not modeled here.

Expected supported interpretation: transfer gate fails.

### 3 · Resistance: starting state

Classical Tn5 is a resistance-associated example. This curated symbolic fragment and conjugative target are not named experimental plasmids. Gene presence alone does not establish a resistance phenotype.

Expected supported interpretation: donor cargo only.

### 3 · Resistance: plasmid loading

Calculate the existing Tn5 conservative insertion first. Transposition makes the target plasmid cargo-bearing without moving DNA between cells. Donor repair remains unresolved.

Expected supported interpretation: loaded plasmid in donor.

### 3 · Resistance: recipient acquisition

After the separate transfer event, recipient DNA includes the determinant. Expression, host context and assay conditions remain unknown. Selection is not simulated; no treatment outcome is predicted.

Expected supported interpretation: recipient acquires determinant; phenotype undetermined.

### 4 · Tn7: glmS context

Native Tn7 TnsD (a TnsD/TniQ-family targeting factor) recognizes the glmS-associated context and recruits TnsC, which coordinates with TnsAB. This is the selected site-specific route; it is not TnsE recognition of replication structures.

Expected supported interpretation: TnsD route compatible.

### 4 · Tn7: transfer-related replication

TnsE targets replication-associated structures, including conjugation-related DNA contexts. The context alone does not prove the attTn7 recognition route. It is not limited exclusively to plasmids.

Expected supported interpretation: TnsE route compatible.

### 4 · Tn7: mismatched route

The supplied evidence supports TnsD recognition, not the selected TnsE route. Incompatible here means unsupported by this bounded context, not impossible in every biological circumstance.

Expected supported interpretation: selected route unsupported.

### 5 · Integron cassette capture

Compatible integrase and sites permit cassette capture by site-specific recombination. This is an explanatory diagram, not a computed recombination product; expression still depends on promoter and cassette context.

Expected supported interpretation: integron site-specific recombination.

### 5 · Nested mobile DNA

An IS primarily supplies transposition functions, a transposon may carry cargo, a plasmid is a replicon, and an integron captures/expresses cassettes. Nesting does not make these categories equivalent or make the plasmid conjugative.

Expected supported interpretation: distinct nested genetic systems.

## Evidence and limitations

Reference IDs: tn7d, tn7-glms, tn7e, tn7-assembly, rp4-transfer, cassette-capture, tn5-ends. Primary research records, relevance, verification status and limitations are in profiles/references.json. Newly checked primary records cover Tn7 complex assembly, RP4 oriT/relaxase and integron cassette insertion. Existing TnsD/glmS, TnsE and classical Tn5 anatomy records are reused. Evidence is verified at abstract/indexed primary-text level, not a claim of complete independent reproduction of the experiments.

Curated symbolic bacterial contexts only. No real plasmid identity, exact sequence, target coordinates, efficiency, rate or clinical phenotype is asserted. Tn7 compatibility is a teaching classification, not a new Tn7 insertion engine. TnsD/TniQ-family targeting is not a universal description of all TniQ homologs or CRISPR-associated systems. Conjugation models completed copy establishment and omits strand-transfer intermediates, host range, exclusion, defense and maintenance dynamics. Integron illustrations do not execute cassette recombination.
