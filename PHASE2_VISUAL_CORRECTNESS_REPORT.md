# SIASET Learn Phase 2 visual correctness

Implemented locally on 3 November 2026. No deployment performed.

## Changes

- `frontend/src/scientific.css`: dedicated scientific tokens for donor, target, element, TSD, res, TIR and gene. Legend swatches and feature labels consume those tokens, independently of brand/action colors. Original scientific palette retained.
- `frontend/src/main.jsx`: loads the scientific stylesheet after the brand theme.
- `frontend/src/theme.css`: molecule-local legacy gold alias now points to the scientific element token.
- `frontend/src/features/transposable-elements/components/MoleculeView.jsx`: SVG scientific category colors use tokens. Omitting onSelect produces static SVG groups and span labels, without click/key handlers, button roles, tab stops or pressed states. Static features have a normal cursor and no hover brightening. Supplying onSelect preserves laboratory/sandbox inspection. SVG titles use single strings so React renders their text correctly.
- `frontend/src/features/transposable-elements/ConsequenceExplorer.jsx`: removes empty selection handlers from initial and calculated molecules. These are explanatory results; prediction and completion behavior remain unchanged. Existing coordinate titles and orientation labels remain available.
- `frontend/src/features/transposable-elements/Lessons.jsx` and `BacterialExplorer.jsx`: existing scientific category colors consume the same tokens; diagrams, geometry and teaching content retained.
- `frontend/src/features/transposable-elements/tests/branding.test.js`: updates palette expectation for semantic tokens.
- `frontend/src/features/transposable-elements/tests/visualCorrectness.test.js`: checks static and interactive rendered markup for initial and calculated circular/linear Tn5 molecules, scientific token independence, legend mapping, stylesheet order and removal of empty lesson handlers.

## Verification

- Full Node suite: **59 passed**, including all Phase 1 routing/progress reliability tests and molecular engine tests.
- ESLint: passed.
- Vite production build: passed.
- React rendered-markup checks: static results contain no buttons, button roles, tabindex or aria-pressed; laboratory mode retains focusable feature controls. Scientific palette/legend bindings verified.
- Browser UI checks were attempted in Chrome and the in-app browser, but both could not reach the running local Vite server (connection timeout). Visual appearance, computed browser colors, keyboard activation and narrow-screen layout have not been verified interactively in this session. Rendered-markup checks do not replace those checks.

## Scope and limitations

Phase 1 repository/routing logic, molecular engine, completion rules, dependencies and scientific calculations were not changed. The existing palette, diagram geometry and overall visual design are retained. Static results intentionally provide no feature inspector; their labels and SVG titles retain the existing descriptive evidence. Existing responsive rules may hide feature pills on narrow screens, as before.

The workspace has no Git repository, so a Git diff was unavailable. Build output in frontend/dist was regenerated. No deployment performed.
