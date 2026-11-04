# Fixtures

`worked-examples.json` specifies symbolic initial conditions, actions, and independent expected structural assertions. `createInitial` will instantiate these recipes in Phases 2–3; fixtures do not call transitions to manufacture their expected outcomes. Lengths and insertion boundaries are teaching choices, not experimental coordinates. No nucleotide sequence is used.

Tn5 donor: 300-unit backbone + 300-unit element + 400-unit backbone. Target: 900-unit circular backbone. Placement boundary 200. Expected: target length 1209; two unrepaired donor fragments of 300 and 400 units; one total Tn5 copy; two external 9 bp TSDs; overall length 1909.

Tn3 donor: 700-unit backbone + 300-unit intact symbolic Tn3. Target: 900-unit circle. Placement boundary 200. Expected cointegrate: one circle, length 2205, two directly oriented elements and two internal res regions; two 5 bp TSDs. Expected resolution: donor circle 1000, target circle 1205, total copies 2, overall length 2205. The element sites are schematic: labels identify functional anatomy without claiming measured positions, transcript orientations or physical protein occupancy. Resolution product copies record recombinant ancestry.

Negative cases: missing TIR, missing res, reversed res, unavailable enzyme, repeated action, target boundary overflow, version mismatch, altered event, noncircular cointegrate. All must reject without mutation. No fixture asserts donor repair or decatenation.
