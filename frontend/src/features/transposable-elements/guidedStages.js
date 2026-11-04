// Teaching stages retain their v1 order for saved completion evidence.
// Only historyLanding stages are selected by undo/redo.
export const guidedStages = {
  "tn5": [
    {
      "id": "inspect",
      "title": "Inspect the molecules",
      "cursor": 0,
      "historyLanding": true,
      "boundaryControl": true,
      "note": "Find the gold Tn5 element in the linear donor. Its two terminal recognition ends belong to the element; the target initially has no Tn5."
    },
    {
      "id": "predict",
      "title": "Predict the outcome",
      "cursor": 0,
      "checkpoint": "tn5",
      "action": "tn5.transpose",
      "actionLabel": "Run transposition",
      "badge": "PREDICTION",
      "note": "Predict element copy number before executing the modeled reaction. Transposase is available in this guided experiment."
    },
    {
      "id": "calculate",
      "title": "Calculate transposition",
      "cursor": 1,
      "historyLanding": true,
      "note": "Calculated state: Tn5 has moved to the target. The donor is represented as two unrepaired fragments. No donor repair product is assumed."
    },
    {
      "id": "insertion",
      "title": "Inspect the insertion",
      "cursor": 1,
      "note": "Select the purple target-site duplications. Each represents 9 bp of host-derived DNA outside the inserted element. TIR labels mark terminal end regions inside the element. The 19 bp Tn5 recognition region is not a perfect 19 bp inverted repeat; full IS50 anatomy is not expanded here."
    },
    {
      "id": "review",
      "title": "Review the mechanism",
      "cursor": 1,
      "final": true,
      "note": "One element was conserved while the target site was duplicated. This is a representative conservative Tn5 model, not a universal rule for Class II elements."
    }
  ],
  "tn3": [
    {
      "id": "inspect",
      "title": "Separate replicons",
      "cursor": 0,
      "historyLanding": true,
      "boundaryControl": true,
      "note": "Inspect two separate circular replicons. The symbolic donor contains one intact Tn3 with TIRs, tnpA, tnpR, an internal res region, and schematic bla cargo. The target has no Tn3."
    },
    {
      "id": "transfer",
      "title": "Strand transfer",
      "cursor": 0,
      "checkpoint": "tn3",
      "explanatory": true,
      "note": "Explanatory stage only: transposase-mediated strand transfer connects element ends to target DNA in the documented pathway. No strand-level structure or molecular change is calculated here. Predict the completed cointegrate."
    },
    {
      "id": "replicate",
      "title": "Replication & formation",
      "cursor": 0,
      "action": "tn3.replicate",
      "actionLabel": "Form cointegrate",
      "explanatory": true,
      "note": "Explanatory stage only: DNA synthesis can produce a second element copy during formation of the cointegrate. Fork geometry and kinetics are not simulated. Use Form cointegrate to calculate the completed structural product."
    },
    {
      "id": "cointegrate",
      "title": "Inspect the cointegrate",
      "cursor": 1,
      "historyLanding": true,
      "note": "Calculated cointegrate: follow the teal donor backbone and blue target backbone in a single circle. Two gold Tn3 copies have the same orientation; each retains an internal res region. The host-derived 5 bp TSD pair flanks the insertion block E2–donor–E1 around the circle. Resolution has not occurred."
    },
    {
      "id": "recognize-res",
      "title": "res recognition",
      "cursor": 1,
      "checkpoint": "resolution",
      "action": "tn3.resolve",
      "actionLabel": "Resolve cointegrate",
      "explanatory": true,
      "enzymeGate": true,
      "note": "TnpR can recombine the two appropriate, directly oriented internal res regions under the assumed permissive topology. Predict copy number, then test the enzyme gate. Recognition geometry is explanatory; resolution is the next separate calculated event."
    },
    {
      "id": "resolved",
      "title": "Resolved products",
      "cursor": 2,
      "historyLanding": true,
      "final": true,
      "note": "Calculated products: one donor and one target replicon structure, each with one recombinant Tn3. The target retains its 5 bp TSD pair. Two copies remain overall. The circles may still be catenated; physical unlinking has not been calculated."
    }
  ]
};
export function stageForCursor(scenario, cursor) {
  const index = guidedStages[scenario]?.findIndex(stage => stage.historyLanding && stage.cursor === cursor);
  if (index === undefined || index < 0) throw new Error('No guided stage for molecular cursor');
  return index;
}
