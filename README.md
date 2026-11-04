# SiaSet — Transposable Elements Virtual Laboratory

Local React application for Phases 1–3. Started from an **empty directory** on 2026-11-02. No existing frontend, gel labs, backend, database or authentication implementation was present. This repository therefore provides a new frontend shell and the bounded TE feature, not an integration into an unseen application. No backend is needed for these deterministic local experiments.

## Run

Node 22.12+ or Node 24 is recommended. Engine tests require no third-party packages:

```powershell
npm test
npm run test:phase1
```

Frontend dependencies and `frontend/package-lock.json` are now present. Tests, lint, production build and manual desktop/mobile browser checks pass; see [prerequisite validation](PREREQUISITE_VALIDATION.md). For a fresh checkout, install from a terminal with npm registry access:

```powershell
npm --prefix frontend install
npm run dev
```

Open `http://127.0.0.1:5173/lab/transposable-elements` or the overview at `/`. Vite falls back to the app for direct route loads. Production static hosting must rewrite unknown paths to `index.html`.

```powershell
npm run lint
npm run build
```

Build output: `frontend/dist`. Use `npm ci --prefix frontend` with the existing lockfile for reproducible fresh installations. Vite uses `resolve.preserveSymlinks: true` because this restricted Windows executor rejects native realpath calls despite allowing file reads; this project currently has no symlinked dependencies. No permissions or security settings were changed. The underlying environment limitation is documented in the validation report.

## Experiments

**Tn5:** inspect linear donor / circular target → answer the prediction → calculate transposition → inspect the host-derived 9 bp TSDs and preserved element TIRs → review. The donor is left as two unrepaired fragments. No repair product is invented.

**Tn3:** inspect two circles → explanatory strand-transfer stage and first reasoning checkpoint → explanatory replication stage → calculate and inspect the circular cointegrate → inspect internal res regions and answer a second checkpoint → calculate TnpR-mediated resolution. Disable TnpR at the checkpoint to test a failure without changing molecular state. The final two replicon structures may remain catenated.

Undo/redo traverses molecular events. Reset clears history and checkpoint answers. Replay reconstructs the current event prefix from the initial state and verifies every recorded event. Refreshing the page resets the session; history is in memory only. Comparison displays the initial state alongside current molecular output. SVG features and annotation buttons support keyboard inspection.

## Architecture

`frontend/src/features/transposable-elements/` separates:

- `curriculum/`: all 15 topics in their original order and planned/implemented scenario registry.
- `profiles/`: mechanism-specific evidence, provenance, assumptions, limitations, reference access status.
- `contracts/`: scientific model, coordinates, state/event semantics and invariants.
- `fixtures/`: independent symbolic expectations.
- `engine/`: pure structural transitions, state validation and deterministic event history.
- `components/`: SVG molecules and reasoning checkpoints.
- `learning.js`: guided stage/checkpoint rules; no molecular calculation.
- `Laboratory.jsx`: laboratory controls rendering engine output.
- `tests/`: Node built-in contract, engine and guided-rule tests.

App routes live in `frontend/src/main.jsx`; shared visual tokens and responsive layouts in `frontend/src/styles.css`. No TypeScript, server, database, OAuth, telemetry or paid service was added. React, React Router, Vite, Tailwind and lint tooling are declared. Framer Motion is unnecessary for the structural model and was not added. Google Fonts are optional presentation requests with local system-font fallbacks.

See [scientific contracts](frontend/src/features/transposable-elements/contracts/SCIENTIFIC_CONTRACTS.md), [validation record](frontend/src/features/transposable-elements/TESTING_AND_VALIDATION.md) and [delivery report](IMPLEMENTATION_REPORT.md).
