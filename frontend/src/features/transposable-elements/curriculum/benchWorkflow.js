// Module 3 · Bench Workflow. One worked sample (benchWorkflow.js SAMPLE) runs through all four
// stations. Same lesson shape as the extraction lessons: each variant carries a qualitative
// outcome, so the explorer asks for a prediction before it reveals the result.
const q = (question, options, correct, explanation) => ({question, options, correct, explanation});
const v = (label, blocks, explanation, outcome) => ({label, blocks, explanation, outcome});

export const benchWorkflow = [
  {
    id: 'dna-quantification',
    objectives: ['Calculate DNA concentration and yield from A260.', 'Read A260/A280 and A260/A230 as purity checks.', 'Predict what a ratio outside the usual range suggests, and what it cannot tell you.'],
    terms: ['A260', '50 ng/µL per A260 unit', 'yield', 'A260/A280', 'A260/A230', 'path length', 'contaminant'],
    references: ['qiagen-spectro', 'desjardins2010'],
    concept: 'Nucleic acids absorb ultraviolet light most strongly at 260 nm, and absorbance rises in proportion to concentration. For double-stranded DNA at neutral pH and a 1 cm (10 mm) path, an A260 of 1.0 corresponds to about 50 ng/µL, so concentration = A260 × 50 ng/µL, and yield = concentration × volume. Ratios give a quick purity check. Pure DNA reads an A260/A280 of about 1.8; protein absorbs near 280 nm and pulls the ratio down, while RNA reads about 2.0 and pushes it up. Absorbance cannot tell DNA from RNA, so RNA also inflates the apparent DNA concentration. A260/A230 is usually about 1.8–2.2 for pure nucleic acid; a much lower value means something absorbing near 230 nm came along. A ratio flags a problem; it does not identify the contaminant.',
    variants: [
      v('Your DNA from the wash', ['A260 0.75', 'A280 0.41', 'A230 0.38', '260/280 = 1.83 · 260/230 = 1.97'], 'Both ratios are in the usual range for pure DNA: 37.5 ng/µL, about 1.9 µg in 50 µL.', 'pure DNA'),
      v('Protein carried over', ['A260 0.75', 'A280 0.47', '260/280 = 1.60'], 'Extra absorbance near 280 nm pulls A260/A280 well below about 1.8. Protein is the usual cause.', 'protein contamination'),
      v('RNase skipped', ['A260 0.90', 'A280 0.44', '260/280 = 2.05'], 'Without RNase A, RNA precipitates with the DNA. RNA reads near 2.0 and also adds to A260.', 'RNA contamination'),
      v('Carryover from the prep', ['A260 0.75', 'A230 0.60', '260/230 = 1.25'], 'Something absorbing near 230 nm came along with the DNA. The ratio flags it but does not say what it is.', 'low A260/A230 contaminant'),
    ],
    exercise: q('Your DNA reads A260 = 0.75 (10 mm path). What is its concentration?', ['37.5 ng/µL', '15 ng/µL', '75 ng/µL'], 0, 'For double-stranded DNA an A260 of 1.0 is about 50 ng/µL, so 0.75 × 50 = 37.5 ng/µL.'),
    check: q('A sample’s A260/A280 is 1.60. What is the most likely explanation?', ['RNA contamination', 'Protein contamination', 'Pure DNA'], 1, 'Protein absorbs near 280 nm and pulls the ratio below about 1.8. The ratio flags a problem; it does not prove what the contaminant is.'),
    check2: q('RNase A was skipped and A260/A280 reads 2.05. What else is wrong with this reading?', ['The A260 concentration overestimates the DNA', 'The DNA is degraded', 'The ratio proves the sample is pure'], 0, 'RNA also absorbs at 260 nm, so it inflates the concentration calculated from A260.'),
    limitations: 'Absorbance cannot tell DNA from RNA or free nucleotides. A260/A280 is insensitive to small amounts of protein. Ratios depend on the instrument, blank, pH and concentration, and are unreliable at very low A260; fluorescent dye assays measure dsDNA more specifically. The flag cut-offs used here (A260/A280 below 1.7 or at least 1.95; A260/A230 below 1.8) are teaching values, not instrument specifications.',
  },
  {
    id: 'pcr-amplification',
    objectives: ['Explain why each PCR cycle roughly doubles the target.', 'Predict how primer orientation, annealing temperature, polymerase and cycle number change the product.', 'Convert template mass into a starting copy number.'],
    terms: ['primer', 'template', 'denaturation', 'annealing', 'extension', 'Taq polymerase', 'melting temperature (Tm)', 'amplicon', 'plateau'],
    references: ['saiki1988', 'sigma-pcr', 'duewer2018'],
    concept: 'The polymerase chain reaction copies the stretch of DNA between two primers. Each cycle has three steps: heat to separate the strands (denaturation), cool so the primers bind their sites (annealing, typically about 5 °C below the primers’ melting temperature), then let a heat-stable polymerase such as Taq extend them at 72 °C. The primers point toward each other on opposite strands, so every new strand carries the other primer’s site and becomes a template in the next cycle: in an ideal cycle the target doubles. The first cycles make strands of variable length; exact-length copies of the amplicon first appear in the third cycle and soon dominate, so after n ideal cycles one template gives about 2ⁿ copies. Here 3.75 ng of human genomic DNA, at about 3.3 pg per haploid genome, is about 1,100 starting copies. Real reactions fall short of perfect doubling and eventually level off in a plateau phase.',
    variants: [
      v('Standard set-up', ['primers facing', 'anneal 55 °C', 'Taq', '30 cycles'], 'Both primers bind their own sites and every product is a new template: one band of the expected size.', 'single product'),
      v('Primers pointing away', ['← forward', 'target', 'reverse →'], 'Primers that point away from each other never define a region between them, so nothing is amplified.', 'no product'),
      v('Annealing at 72 °C', ['primer Tm ≈ 60 °C', 'anneal 72 °C'], 'Well above their melting temperature, the primers barely stay bound, so little or nothing is copied.', 'no product'),
      v('Annealing at 45 °C', ['primer Tm ≈ 60 °C', 'anneal 45 °C'], 'Far below the melting temperature, primers also bind partly matching sites and make extra products.', 'extra bands'),
      v('Only 10 cycles', ['primers facing', 'anneal 55 °C', '10 cycles'], 'The right product, but 2¹⁰ is only about a thousand-fold: too little to see clearly.', 'weak product'),
    ],
    exercise: q('Starting from about 1,100 template copies, roughly how many copies do 10 ideal cycles give?', ['About 11,000', 'About 1.1 million', 'About 110,000'], 1, '2¹⁰ = 1,024, and 1,100 × 1,024 ≈ 1.1 million.'),
    check: q('Why does the target roughly double every cycle?', ['Each strand of every duplex is a template for a new strand', 'The polymerase copies each strand twice', 'Primers copy themselves'], 0, 'After denaturation both strands are templates, and each new strand carries the other primer’s site.'),
    check2: q('You anneal far above the primers’ melting temperature. Predict the result.', ['Little or no product', 'Extra non-specific bands', 'A longer product'], 0, 'Above their Tm the primers do not stay bound long enough to be extended.'),
    limitations: 'An idealized model. Real efficiency is below 100% and falls in late cycles; the plateau curve shown is schematic, not calculated, and the cycle where it sets in varies. Annealing outcomes are qualitative categories around a stated primer Tm of about 60 °C. Primer-dimers, mispriming details, extension time, polymerase fidelity and hot-start chemistry are not modelled. The genome-copy conversion assumes about 3.3 pg per haploid human genome.',
  },
  {
    id: 'gel-electrophoresis',
    objectives: ['Explain why DNA moves through an agarose gel and which way it goes.', 'Estimate a fragment’s size against a ladder using a log scale.', 'Predict the effect of reversed electrodes, an early stop or ethanol in the sample.'],
    terms: ['agarose', 'anode', 'cathode', 'DNA ladder', 'log-linear migration', 'well', 'loading dye'],
    references: ['lee2012', 'green-ethanol'],
    concept: 'DNA’s phosphate backbone is negatively charged, so in an electric field it moves toward the positive electrode (the anode); the wells sit at the negative end. DNA has a uniform charge per unit mass, so the agarose mesh sorts molecules by size: shorter fragments slip through faster. Over a gel’s working range the distance travelled falls roughly linearly with the logarithm of size. A ladder of known sizes run in the next lane lets you read an unknown band: find the ladder bands either side, then interpolate on the log scale. Higher-percentage gels have smaller pores and spread small fragments; lower-percentage gels suit larger ones. Your PCR product should run as one band between the 800 and 900 bp ladder bands.',
    variants: [
      v('1% gel, wells at −', ['wells at − (black)', 'DNA → +', '100 bp ladder', 'PCR product'], 'DNA moves toward the anode and separates by size; the product sits between 800 and 900 bp.', 'band resolved'),
      v('Electrodes reversed', ['wells at + (red)', 'DNA → − ?'], 'DNA still moves toward the positive electrode, which is now behind the wells, so it leaves the gel into the buffer.', 'DNA runs out of the gel'),
      v('Ethanol left in the sample', ['pellet not dried', 'sample + loading dye', 'load the well'], 'Residual ethanol makes the sample less dense than the loading mixture, so it floats up out of the well.', 'sample floats out'),
      v('Run stopped early', ['wells at −', 'run 5 min', 'stop'], 'The fragments have barely entered the gel, so neighbouring sizes have not separated yet.', 'bands not separated'),
    ],
    exercise: q('The band sits between the 800 and 900 bp ladder bands, about halfway on the log scale. What is the best estimate?', ['About 850 bp', 'About 300 bp', 'About 1,700 bp'], 0, 'Halfway on a log scale between 800 and 900 is √(800 × 900) ≈ 849 bp.'),
    check: q('Which way do DNA fragments move in the gel?', ['Toward the positive electrode (anode)', 'Toward the negative electrode (cathode)', 'They stay in the well'], 0, 'The phosphate backbone is negatively charged, so DNA moves toward the anode.'),
    check2: q('Why plot the ladder as log(size) against distance?', ['Distance falls roughly linearly with log(size) over the gel’s range', 'Distance is proportional to size', 'Small fragments move more slowly'], 0, 'Distance travelled falls roughly linearly as log(size) rises, so a log scale turns the ladder into a straight line to read from.'),
    limitations: 'Band positions come from a schematic log-linear model, not from a specific gel, buffer, voltage or stain. Sizes read from a gel are estimates. Supercoiled, nicked and linear DNA of the same length migrate differently. Very large fragments leave the log-linear range. The agarose effect is shown as a qualitative trend; real resolution ranges depend on the agarose type and running conditions.',
  },
  {
    id: 'restriction-digest',
    objectives: ['Predict fragment sizes from known restriction sites.', 'Count fragments for linear and circular DNA.', 'Recognize an incomplete digest on a gel.'],
    terms: ['restriction enzyme', 'recognition site', 'palindrome', 'sticky end', '5′ overhang', 'EcoRI', 'HindIII', 'BamHI', 'partial digest'],
    references: ['neb-ecori', 'neb-hindiii', 'neb-bamhi', 'lee2012'],
    concept: 'A restriction enzyme cuts DNA wherever its recognition sequence occurs. EcoRI recognizes GAATTC and cuts between the G and the first A on both strands (G^AATTC), leaving four-base 5′ AATT overhangs; HindIII cuts A^AGCTT and BamHI cuts G^GATCC. If you know where the sites are, you can predict the fragments by subtracting positions. Cutting a linear molecule at n sites gives n + 1 pieces; cutting a circle gives n. In this station your gel-checked 850 bp product has one EcoRI site at 300 bp and one HindIII site at 700 bp, and no BamHI site. Comparing the digest lane with an uncut lane and the ladder checks the prediction. If the enzyme had too little time, some molecules stay uncut or cut once, and extra bands appear.',
    variants: [
      v('EcoRI', ['0', 'EcoRI at 300', '850'], 'One cut, 300 bp from one end, of a linear 850 bp molecule: two pieces.', '300 + 550 bp'),
      v('BamHI', ['0', 'no GGATCC', '850'], 'The amplicon has no BamHI site, so the enzyme has nothing to cut.', '850 bp, uncut'),
      v('EcoRI + HindIII', ['0', 'EcoRI at 300', 'HindIII at 700', '850'], 'Two cuts in a linear molecule give three pieces: 300, 400 and 150 bp.', '150 + 300 + 400 bp'),
      v('EcoRI, short incubation', ['0', 'EcoRI at 300 (not every molecule cut)', '850'], 'Some molecules are still uncut, so an 850 bp band remains beside 550 and 300 bp.', 'extra uncut band'),
    ],
    exercise: q('EcoRI cuts the 850 bp product once, 300 bp from one end. Which bands do you expect?', ['300 + 550 bp', '425 + 425 bp', '850 bp only'], 0, '850 − 300 = 550, so the cut leaves 300 and 550 bp pieces.'),
    check: q('A linear DNA has two sites for an enzyme. How many fragments does a complete digest give?', ['Three', 'Two', 'Four'], 0, 'n cuts in a linear molecule give n + 1 pieces. A circle with two sites would give two.'),
    check2: q('After an EcoRI digest you see bands at 850, 550 and 300 bp. What is most likely?', ['The digest was incomplete', 'EcoRI has a second site', 'The PCR made two products'], 0, 'The 850 bp band is uncut product: some molecules were never cut.'),
    limitations: 'The 850 bp product and its site map are a schematic teaching amplicon, not a real human locus or sequence. Sizes use the top-strand cut position and ignore overhang bases. Star activity, methylation sensitivity, buffer compatibility and end effects (a site very close to a PCR product’s end may cut poorly) are not modelled. The partial digest shows which products are possible, not their amounts.',
  },
];
