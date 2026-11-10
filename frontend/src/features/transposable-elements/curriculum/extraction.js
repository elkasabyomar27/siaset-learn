// Module 2 · DNA Extraction & Purification. Same lesson shape as the transposable-element
// lessons: each variant carries a qualitative outcome so the explorer asks for a prediction.
const q = (question, options, correct, explanation) => ({question, options, correct, explanation});
const v = (label, blocks, explanation, outcome) => ({label, blocks, explanation, outcome});

export const extraction = [
  {
    id: 'extraction-principles',
    objectives: ['Explain the purpose of each stage: lysis, protein and RNA removal, and DNA recovery.', 'Match common reagents to what they do to cells, proteins and nucleic acids.', 'Predict how skipping a stage affects yield or purity.'],
    terms: ['lysis', 'SDS', 'EDTA', 'proteinase K', 'RNase A', 'salting out', 'yield', 'purity'],
    references: ['miller1988', 'green-ethanol'],
    concept: 'Extracting DNA means releasing it from cells and separating it from everything else the cell contains. A lysis buffer uses a detergent such as SDS to disrupt lipid membranes and denature proteins, while EDTA chelates the Mg²⁺ ions that DNA-degrading nucleases (DNases) need. Proteinase K digests proteins, including nucleases, and RNase A degrades RNA. Proteins are then removed: for example by “salting out” with concentrated NaCl and centrifugation, by phenol–chloroform extraction, or by binding the DNA to silica. Finally the DNA is recovered from the cleared aqueous solution, often by alcohol precipitation and a wash, and dissolved in buffer.',
    variants: [
      v('Complete protocol', ['lysis: detergent + EDTA', 'proteinase K + RNase A digestion', 'salt out proteins, centrifuge', 'recover DNA: alcohol precipitation + wash'], 'Every stage is present: membranes are opened, nucleases are held back, proteins and RNA are removed, and DNA is recovered from the cleared supernatant.', 'good yield and purity'),
      v('No detergent', ['cells in buffer, no detergent', 'proteinase K added', 'centrifuge, keep supernatant'], 'Assume no other lysis method (such as grinding or bead beating). Many cells stay intact, and their DNA is discarded with the cell pellet.', 'low yield'),
      v('Protein removal skipped', ['lysis: detergent + EDTA', 'no proteinase K, no salting out', 'alcohol precipitation'], 'Proteins stay in solution and can come down with the DNA; any surviving nucleases can also act on it later.', 'protein contamination'),
      v('No EDTA, nucleases active', ['lysis without EDTA', 'Mg²⁺ available', 'endogenous DNases active'], 'Assume active cellular DNases and free divalent cations: DNA can be fragmented before the nucleases are digested or removed.', 'degraded DNA'),
      v('No RNase A', ['lysis: detergent + EDTA', 'proteinase K, no RNase', 'alcohol precipitation'], 'Alcohol precipitates RNA as well as DNA, so RNA co-purifies and inflates a concentration estimated from absorbance at 260 nm.', 'RNA contamination'),
    ],
    exercise: q('A lysate has been cleared of proteins and RNA. Which step recovers the DNA from this aqueous solution?', ['Adding more detergent', 'Alcohol precipitation in the presence of salt', 'Adding RNase A'], 1, 'Salt cations neutralize the phosphate backbone and alcohol lowers DNA solubility, so DNA comes out of solution and can be pelleted.'),
    check: q('What does EDTA contribute to a lysis buffer?', ['It digests proteins', 'It chelates Mg²⁺ so DNases are inhibited', 'It dissolves lipid membranes'], 1, 'DNases need divalent cations such as Mg²⁺. Binding them up protects the DNA; the detergent, not EDTA, opens membranes.'),
    check2: q('Why is RNase A added when extracting genomic DNA?', ['RNA would also precipitate and contaminate the DNA', 'RNase A breaks open the nucleus', 'RNase A removes salt'], 0, 'Alcohol precipitation does not tell DNA from RNA, so RNA co-purifies unless it is degraded.'),
    limitations: 'A generic salting-out workflow for cells without tough walls. Reagent concentrations, incubation times, tissue-specific lysis (plant cell walls, polysaccharides, Gram-positive bacteria) and kit chemistries vary. Outcomes are qualitative teaching categories, not predicted yields.',
  },
  {
    id: 'isopropanol-precipitation',
    objectives: ['Explain why salt and alcohol together bring DNA out of solution.', 'Choose an isopropanol volume and temperature that recover DNA without excess salt.', 'Compare isopropanol with ethanol precipitation.'],
    terms: ['precipitation', 'monovalent cation', 'sodium acetate', 'isopropanol', '0.6–0.7 volume', 'pellet', 'co-precipitation', 'supernatant'],
    references: ['green-isopropanol', 'green-ethanol'],
    concept: 'DNA dissolves in water because its negatively charged phosphate backbone is surrounded by water molecules. Monovalent cations from added salt (for example sodium acetate at about 0.3 M final) neutralize that charge, and alcohol lowers the dielectric constant of the solution so the cations stay bound and the DNA aggregates. DNA is less soluble in isopropanol than in ethanol, so 0.6–0.7 volume of isopropanol is enough, compared with 2–2.5 volumes of ethanol: useful when the sample volume is large. Salts are also less soluble in isopropanol, so the precipitation is usually done at room temperature to limit salt co-precipitation. Centrifugation collects the DNA as a pellet that is often glassy and hard to see; the supernatant is removed carefully and a 70% ethanol wash follows.',
    variants: [
      v('Salt + 0.7 vol isopropanol', ['aqueous DNA + 0.3 M sodium acetate', '+ 0.7 volume isopropanol, mix', 'room temperature', 'centrifuge → pellet'], 'Both requirements are met: the backbone charge is neutralized and the alcohol fraction is high enough. Room temperature limits salt co-precipitation.', 'DNA pellets'),
      v('No salt added', ['DNA in low-salt water', '+ 0.7 volume isopropanol', 'centrifuge'], 'Assume the sample contains very little salt. Without cations to neutralize the backbone, DNA precipitates poorly.', 'poor recovery'),
      v('Too little alcohol', ['DNA + 0.3 M sodium acetate', '+ 0.2 volume isopropanol', 'centrifuge'], 'The alcohol fraction is too low to drive DNA out of solution.', 'poor recovery'),
      v('Isopropanol on ice', ['DNA + salt', '+ 0.7 volume isopropanol', 'chilled on ice for a long time'], 'DNA still precipitates, but cold isopropanol favours salt coming down with it.', 'salt co-precipitates'),
      v('Ethanol instead', ['DNA + 0.3 M sodium acetate', '+ 2–2.5 volumes ethanol', 'centrifuge'], 'Ethanol also works, needing roughly three times the alcohol volume; check the total still fits the tube.', 'DNA pellets'),
    ],
    exercise: q('You must precipitate DNA from 700 µL in a 1.5 mL tube. Which alcohol addition fits?', ['2.5 volumes of ethanol', '0.7 volume of isopropanol', 'Either: the volume added makes no difference'], 1, '0.7 × 700 µL ≈ 490 µL, about 1.2 mL in total. 2.5 × 700 µL = 1750 µL would overflow the tube on its own.'),
    check: q('Why is isopropanol precipitation usually done at room temperature?', ['DNA is unstable in the cold', 'Cold isopropanol increases salt co-precipitation', 'Isopropanol freezes on ice'], 1, 'Salts are less soluble in isopropanol, especially when it is cold, so they can pellet with the DNA.'),
    check2: q('What role does the sodium acetate play?', ['Its Na⁺ ions neutralize the DNA phosphate backbone', 'It digests contaminating proteins', 'It redissolves the pellet'], 0, 'Neutralizing the negative charge lets DNA molecules aggregate once alcohol lowers the dielectric constant.'),
    limitations: 'Typical ratios from standard protocols. Optimal salt, alcohol volume, incubation and centrifugation depend on DNA amount and fragment size; very dilute or very short DNA may need a carrier or longer spins. Not a quantitative yield model.',
  },
  {
    id: 'ethanol-wash',
    objectives: ['Explain why a DNA pellet is washed with 70% ethanol.', 'Predict the effect of the wrong wash solution or drying time.', 'Connect leftover contaminants to purity readings and downstream problems.'],
    terms: ['70% ethanol', 'residual salt', 'residual alcohol', 'air-drying', 'over-drying', 'resuspension', 'TE buffer', 'A260/A280', 'A260/A230'],
    references: ['green-isopropanol', 'desjardins2010'],
    concept: 'After precipitation the pellet still holds salt and traces of isopropanol. Washing with 70% ethanol dissolves salt in its water fraction while the DNA stays insoluble, and it replaces the less volatile isopropanol with ethanol that evaporates more readily. The tube is spun again, the wash removed carefully, and the pellet air-dried briefly. Leftover ethanol can inhibit enzymes and make a sample float out of a gel well; over-drying makes large DNA slow to redissolve. The DNA is then dissolved in TE buffer or water. Absorbance ratios give a quick purity check: an A260/A280 of about 1.8 is typical of pure DNA, and an A260/A230 well below the usual 1.8–2.2 suggests carryover of contaminants that absorb near 230 nm.',
    variants: [
      v('70% ethanol, brief air-dry', ['pellet + residual salt', 'wash: 70% ethanol, spin', 'remove wash, air-dry briefly', 'dissolve in TE buffer'], 'Salt dissolves in the aqueous fraction, DNA stays pelleted, and only a little ethanol needs to evaporate.', 'clean DNA'),
      v('Wash with water', ['pellet', 'wash: water', 'spin, discard liquid'], 'DNA dissolves in water, so this “wash” pours the DNA away with the salt.', 'DNA lost'),
      v('Wash with 100% ethanol', ['pellet + residual salt', 'wash: 100% ethanol', 'air-dry'], 'With almost no water present, salt is poorly removed. The DNA is kept, but purity barely improves.', 'salt remains'),
      v('Wash skipped', ['isopropanol pellet', 'no wash', 'air-dry'], 'Salt and slow-evaporating isopropanol stay with the DNA.', 'salt remains'),
      v('Not dried', ['wash: 70% ethanol', 'dissolve immediately', 'ethanol left in the tube'], 'Residual ethanol can inhibit enzymes such as polymerases and make a loaded sample float out of the gel well.', 'ethanol carryover'),
      v('Over-dried', ['wash: 70% ethanol', 'dried far too long', 'add TE buffer'], 'An over-dried pellet, especially of large genomic DNA, can be slow and difficult to redissolve.', 'hard to dissolve'),
    ],
    exercise: q('Why wash the pellet with 70% rather than 100% ethanol?', ['DNA dissolves in 100% ethanol', 'The water fraction dissolves salt while DNA stays insoluble', '70% ethanol leaves no residue at all'], 1, 'The wash needs enough water to dissolve salt, but enough ethanol to keep DNA out of solution.'),
    check: q('A sample floats out of the well when loaded on an agarose gel. What is the most likely cause?', ['Residual ethanol from incomplete drying', 'Too much RNase A', 'The DNA is too pure'], 0, 'Ethanol is less dense than the loading mixture, so leftover ethanol lifts the sample out of the well.'),
    check2: q('Which reading most suggests salt or another contaminant carried over from the wash?', ['A260/A280 of about 1.8', 'A260/A230 well below 1.8', 'A260/A230 of about 2.1'], 1, 'Many contaminants absorb near 230 nm, lowering A260/A230. A ratio flags a problem; it does not identify the contaminant.'),
    limitations: 'Qualitative outcomes only. Real purity ratios depend on the instrument, blank, pH and concentration, and cannot identify a contaminant with certainty. Drying times depend on pellet size and method.',
  },
];
