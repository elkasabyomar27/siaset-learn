# Scientific contracts — schema 1

## Scope and provenance
This is a symbolic, deterministic structural teaching model, not a sequence, kinetic, strand-level, protein-geometry or experimental-outcome simulator. Integer coordinates and lengths are **illustrative model units**, not verified bp coordinates. Only explicitly annotated TSD lengths (Tn5: 9 bp; Tn3: 5 bp) and the explanatory Tn5 terminal recognition length (19 bp) are literature-derived. No nucleotide strings or experimental plasmid identities are asserted. A model unit represents one schematic length unit; the TSD block uses 9 or 5 such units to preserve its bookkeeping length, without making the rest of the schematic an experimental map.

## Molecules and coordinates
Molecules have stable IDs, topology (`linear`/`circular`), length, ordered blocks, derived features and backbone lineage. Blocks partition the molecule; every backbone block carries `sourceId` and `sourceRange`. Element blocks carry a copy ID, family, orientation and internal sites. Features use zero-based, half-open intervals. UI inspection displays one-based, inclusive intervals. Circular boundary L equals 0. An origin-crossing feature has ONE ID with ordered segments `[start,L),[0,end)`; it is not two features. No interval has zero length or overlaps another segment of the same feature.

## Actions and preconditions
`tn5.transpose`: initial Tn5 state, active transposase, one element with both terminal ends, one intact target. User-selected target boundary is a deterministic teaching placement, never a prediction of insertion preference. It must leave space for the host site and may not overlap an annotated feature.

`tn3.replicate`: separate circular replicons, intact Tn3 and internal res, active transposase, no target element. Generate one circle with donor backbone, first Tn3, target-derived right TSD, rotated remaining target, left TSD, second directly oriented Tn3. The insertion block E2–donor–E1 is flanked by the two target-derived TSDs around the circle.

`tn3.resolve`: completed circular cointegrate, available TnpR, two appropriate directly oriented internal res regions, intact lineage and junction structure. Split the donor and target backbone products and assign one recombinant Tn3 to each. Resolution exchanges equivalent element halves at res; copy IDs in products are allocation labels with `recombinantOf` ancestry, NOT a claim that each entire original copy remains chemically untouched. res subsite geometry, supercoiling and strand topology are assumed permissive, not solved. Products may be catenated; physical unlinking and decatenation are NOT modeled.

## Postconditions and invariants
Tn5: exactly one element remains, same copy and terminal feature IDs, on target with two external host-derived 9 bp TSDs. Donor becomes two unrepaired linear fragments; original donor relationship survives through `parentId` and backbone lineage. No donor end joining, footprint or repair outcome is invented. Target length increases by element length plus 9 symbolic units. Donor fragments plus target conserve original symbolic material plus one duplicated target site.

Tn3: separate → cointegrate increases total copies 1→2, total model length by element length + 5, and joins two backbones. Directly oriented copies each retain internal res, tnpA, tnpR and TIR annotations. Resolution keeps total length, two copies, both backbone source identities and the target TSD pair. Products each have one copy; the original donor/target molecule IDs are restored with cointegrate parent lineage. Tn3 is intact in the selected E. coli interplasmid model; bla cargo is schematic, expression is not simulated. Cointegrates are a selected documented pathway, not obligatory for all Tn3 events. No rule is inferred from Class II membership alone.

## Errors, events and history
Pure transitions validate state/action, clone input, calculate output, validate postconditions and return `{state,event}`. Failure throws `ScientificError` with a stable code; the input remains untouched. State has `schemaVersion:1`, monotonic molecular `revision`, scenario, phase and molecules. Events have schema version, deterministic ID, action, before/after canonical state serialization, from/to revision, mechanism, references and explanation. Events never contain wall-clock time or random IDs. Replay validates event schema, initial before-state, calculated after-state and full regenerated event equality; corrupt or stale events fail closed.

History stores initial state plus actions/events and a cursor. Undo/redo moves the cursor and reconstructs molecular state by replay; a new action truncates the redo branch. Reset returns the same initial state and empties events. The guided UI owns checkpoint answers and explanatory stage selection only; scientific truth comes exclusively from engine state. Replay is molecular replay; it does not assert that a learner repeated an assessment.

## Versioning
Schema 1 rejects other schema versions. No implicit migration. Contract changes require an explicit documentation update and fixtures/tests. References include access/verification limitations. Planned profiles are registered but cannot execute engine actions. This project starts in an empty folder: there are no pre-existing gel labs, backend APIs, authentication or data schemas to preserve or to regression-test.
