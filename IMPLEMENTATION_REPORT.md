# SiaSet Phases 1–3 — implementation report

## Current verification update

The later prerequisite-repair task resolved the build blocker with a supported Vite path-resolution setting, verified all 20 existing tests plus ESLint and production build, and exercised the Tn5/Tn3 workflows in the in-app browser on desktop/mobile. A narrow-screen navigation CSS issue was fixed. No scientific mechanisms were modified. See [PREREQUISITE_VALIDATION.md](PREREQUISITE_VALIDATION.md) for the current authoritative results and remaining boundaries. The pending-install/build/browser statements in the original report below are historical. Phase 4 remains on hold.

## Starting state

The selected `SIASET` directory was empty, with no Git repository or source. After the user explicitly authorized starting from zero, a local React frontend was created. No existing gel labs, routes, authentication or backend could be inspected or preserved. The application is not deployed or externally Git-synced.

## Phase 1

Created the ordered 15-topic registry, scenario registry, mechanism profiles, scientific reference registry, coordinate/event/state contracts, symbolic worked examples and Node tests. All five initial contract tests passed before engine transitions were implemented. Topics 1–5 and 8–15 remain planned registry entries only. Tn7 TnsD and TnsE profiles are separate; Ac/Ds, Ty retrotransposition, IS and composite profiles do not execute.

## Phase 2

Implemented a pure Tn5 transition with precondition validation, calculated block/feature structures, one-copy conservation, two external host-derived 9 bp TSDs, stable terminal IDs, unrepaired donor fragments, immutable state and replayable events. Added a dashboard, `/lab/transposable-elements`, responsive SVG workspace, keyboard-operable annotations, inspector, reasoning checkpoint, comparison, scientific event log and history controls. Phase 1 + Tn5/guided-rule tests passed before Tn3 implementation.

## Phase 3

Implemented separate `replicateTn3` and `resolveTn3` operations for an intact Tn3 symbolic E. coli interplasmid model. The completed cointegrate is a calculated single circle preserving donor/target backbone ancestry and containing two direct copies, each with internal res. A selected host site yields a 5 bp TSD pair flanking the insertion block around the circle. TnpR availability, compatible internal res and molecular ordering gate resolution. Output contains two circular replicon structures with one recombinant Tn3 each and two copies overall. The target retains its TSDs; physical unlinking is not claimed. Six guided stages distinguish explanatory stages from calculated events and include two reasoning checkpoints and an enzyme failure gate.

## Scientific sources and assumptions

The reference registry includes the six requested Tn3 sources and primary Tn5, Tn7, Ac/Ds and Ty sources, with per-reference verification/access limits. Core evidence: Goryshin & Reznikoff 1998 (conservative Tn5); Berg et al. 1983 (9 bp TSD); Heffron et al. 1979 (Tn3 anatomy); Kitts et al. 1982 (separable steps); Kostriken et al. 1981 and Kitts et al. 1983 (res/tnpR); Takeya et al. 1979 (5 bp TSD); Bennett et al. 1983 (non-obligatory cointegrates); Krasnow & Cozzarelli 1983 (resolution substrate topology and catenation).

All DNA is symbolic; no sequence/accession/experimental plasmid identity or precise biological insertion coordinate was invented. Coordinates, lengths and gene placement are illustrative model units. TIRs move with the element; TSDs are duplicated host material. Target boundary is a user-selected teaching placement without preference prediction. Tn5 donor repair is unresolved. Tn3 topology is assumed permissive; res subsites, strand exchange, replication forks, protein geometry and rates are explanatory/unmodeled. Resolution copy IDs are allocation labels with recombinant ancestry, not intact physical-copy claims. There are no experimental yields or synthetic observations.

## Verification and acceptance status

20 Node tests pass, including all earlier phases. Syntax parsing passes using an existing Babel parser without installing packages. Lint/build were attempted and blocked by missing ESLint/Vite. The user subsequently approved installation. Online installation failed with `ENOTFOUND registry.npmjs.org`; an offline retry failed with `ENOTCACHED` for `@eslint/js`. No frontend packages were installed. Browser, responsive, direct-route and screenshot checks are pending. Thus Phases 2–3 are **implemented but not browser/build validated**, not accepted as complete. See `TESTING_AND_VALIDATION.md` for the reproducible acceptance checklist.

## Files created

No pre-existing project files were modified. All files below are new; some were revised during implementation.

```text
.gitignore
package.json
README.md
IMPLEMENTATION_REPORT.md
frontend/package.json
frontend/index.html
frontend/vite.config.js
frontend/eslint.config.js
frontend/src/main.jsx
frontend/src/styles.css
frontend/src/features/transposable-elements/
  Laboratory.jsx
  learning.js
  TESTING_AND_VALIDATION.md
  curriculum/topics.json
  curriculum/scenarios.json
  profiles/mechanisms.json
  profiles/references.json
  contracts/SCIENTIFIC_CONTRACTS.md
  fixtures/worked-examples.json
  fixtures/SCIENTIFIC_FIXTURES.md
  engine/contracts.js
  engine/model.js
  engine/index.js
  engine/tn5.js
  engine/tn3.js
  components/MoleculeView.jsx
  components/Checkpoint.jsx
  tests/contracts.test.js
  tests/learning.test.js
  tests/tn5.test.js
  tests/tn3.test.js
```

## Remaining work within the approved phases

Install the already-approved declared packages from a terminal with registry access, generate a lockfile, run/fix lint and build, then complete both desktop/mobile workflows and direct-route checks. Obtain scientific instructor review. No existing gel regression can be executed in an empty-source project. The engine supports origin-crossing annotations as a data contract, but guided transitions deliberately reject annotated targets because feature remapping for arbitrary targets is not implemented. Histories are session-local and reset on page refresh. No Phase 4 or later instructional activity was started.

## Running locally

`npm test` works now. After restoring npm registry access: `npm --prefix frontend install`, then `npm run dev`, and open `http://127.0.0.1:5173/lab/transposable-elements`. `npm run lint` and `npm run build` are the remaining tooling checks. Static production hosting needs SPA fallback to `index.html`.
