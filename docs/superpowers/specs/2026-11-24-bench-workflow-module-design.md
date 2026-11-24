# Bench Workflow module (stations 19–22): design

Date: 2026-11-24 · Status: awaiting approval

## Intent

SIASET is one virtual lab across fields. Molecular Biology has one module today: DNA Extraction & Purification (stations 16–18). It ends with clean DNA dissolved in TE buffer. In a real lab that DNA goes on to the next steps: measure it, amplify a target, check the product on a gel, and cut it with a restriction enzyme.

This module covers those steps. It is the next project after the teacher dashboard. It gives Molecular Biology a full bench story, and gives teachers four more stations they can assign.

## Goals

- Four new stations, ordered 19–22, in a new module **Bench Workflow** in the `molecular-biology` field:
  1. **DNA quantification** (`dna-quantification`): concentration from A260; purity from A260/A280 and A260/A230.
  2. **PCR** (`pcr-amplification`): primers, cycles, why the target doubles, and common failures.
  3. **Gel electrophoresis** (`gel-electrophoresis`): run the PCR product beside a ladder and read its size.
  4. **Restriction digest** (`restriction-digest`): cut at known sites, predict the fragments, check them on the gel.
- **One worked sample runs through all four stations.** Each station opens with a "From the last station" card that shows what came in.
- Every station has:
  - verifiable references;
  - a stated limitations note;
  - a bench activity;
  - a predict-then-test explorer;
  - three assessment questions.
- The module gets a practice assessment bank automatically, through `moduleBanks`.
- Teachers can assign the new stations from the station picker.

## Non-goals

- Hands-on labs with lab records, a new engine, or a `station_lab_scenarios` mapping. The user chose interactive lessons.
- Carrying each learner's own bench results into the next station. The user chose a fixed worked sample.
- The streak and the "Explain it back" note. Both are still waiting on a data decision.
- qPCR, sequencing, cloning and ligation.
- Changing existing experiments, existing lessons, or the frozen transposable-element bank v1.

## Anti-goals (a failure even if it works)

- **A wrong science claim.** Examples: a wrong recognition site, the wrong electrode direction, or a ratio presented as proof of what the contaminant is.
- **A number the model invents but presents as measured.** The plateau shape and the gel positions are schematic, and they must be labelled that way.
- **The teaching amplicon presented as a real gene.**
- **Saved progress for stations 1–18 breaks or changes meaning.** Topic ids and order of existing stations stay fixed.
- **Colours off the brand palette** outside scientific diagrams.

## Constraints (from the current code)

- **Lesson shape.** A lesson in `curriculum/lessons.js` has:
  - `objectives`, `terms`, `references` and `concept`;
  - `variants`, each with `label`, `blocks`, `explanation` and `outcome`;
  - `exercise`, `check` and `check2`;
  - `limitations`.

  Lessons with `check2` render `ConsequenceExplorer`. There the learner picks a predicted outcome for each variant before it is revealed. A correct prediction marks that variant inspected. `isComplete` requires every variant inspected and all three questions correct. The new lessons use exactly this shape, so completion, sync and the teacher dashboard work unchanged.
- **Topic data** follows `extractionTopics.json`:
  - `learning.kind: "lesson"`;
  - `assessment.includeEvidence: true`;
  - `status: "implemented"`;
  - `lessonId` equal to `id`.
- **Bench components** follow `ProtocolBench.jsx` and `ReagentStages.jsx`:
  - pure logic in a plain `.js` file, tested;
  - a component wired by hand in `Lessons.jsx`;
  - "Practice only; it doesn't change lesson completion."
- **The `learner-write` contract** is built from every lesson. New lessons change its fingerprint, so this needs:
  - `siaset-v3` in `server/validate.js` and `learnerMirror.js`;
  - `npm run build:db2`;
  - a migration registering the manifest, modelled on `20261124120000_contract_v2.sql`;
  - updated counts in `tests/db2/security.test.mjs`: 16 → 20 lessons, with views recounted.
- **No `station_lab_scenarios` change.** These are lessons, not labs.
- **Look:**
  - brand tokens from `src/theme.css` and `src/ui/lab-shell.css` only;
  - gel, band, tube and curve colours in `src/scientific.css`, used only inside diagrams;
  - 44px targets, WCAG AA contrast and `prefers-reduced-motion`.

## Approaches considered

**Station type**

| Approach | Trade-offs |
|---|---|
| **Interactive lessons with a bench each (chosen)** | Matches stations 16–18. Needs no new database mapping beyond contract v3. Progress means views inspected and questions answered, not a recorded experiment. |
| One hands-on lab (gel or digest) | Teachers see a lab record. But it needs about twice the work, a new engine, lab records and a `station_lab_scenarios` line. |

**How stations pass the sample on**

| Approach | Trade-offs |
|---|---|
| **A. One fixed worked sample (chosen)** | Simple. Needs no new saved state, and stays clear of the pending data decision. The numbers don't react to what the learner did at earlier benches. |
| B. Carry each learner's own results forward | More personal. Needs shared cross-station state, which runs into the pending data decision. |
| C. Separate stations, linked only by story | Cheapest, but drops "each uses the previous output". |

The user picked **interactive lessons** and **A, with a teaching amplicon**.

## Design

### The worked sample

All four stations read one exported constant, `SAMPLE`, in `benchWorkflow.js`. No station hard-codes its own copy.

| Stage | Value | How it is derived |
|---|---|---|
| In from station 18 | Clean human genomic DNA, 50 µL in TE | The station 18 "clean" outcome |
| Readings | A260 0.75 · A280 0.41 · A230 0.38 (10 mm path equivalent) | Chosen teaching values |
| Concentration | 37.5 ng/µL | 0.75 × 50 ng/µL per A260 unit (dsDNA) |
| Total yield | ≈ 1.9 µg | 37.5 × 50 µL = 1,875 ng |
| Purity | 260/280 = 1.83; 260/230 = 1.97 | Ratios of the readings |
| PCR template | 1 µL of a 1:10 dilution = 3.75 ng ≈ 1,100 haploid genome copies | 3.75 ng ÷ ~3.3 pg per haploid genome |
| PCR product | The 850 bp teaching amplicon | Defined, not a real locus. 850 rather than 800 so it falls between two ladder bands and must be interpolated |
| Gel | One band between the 800 and 900 bp ladder bands, read as ≈ 850 bp | Log-linear interpolation |
| Digest sites | EcoRI cuts once at 300 bp; HindIII cuts once at 700 bp; BamHI has no site | Defined teaching map |

The **teaching amplicon** is a made-up 850 bp product. Its limitations note says so: "a schematic teaching amplicon, not a real human locus; its site positions are defined for this lesson." Fragment sizes use the top-strand cut position. The 4-nt overhangs are named but not counted in the sizes.

### Shared pieces

- **`benchWorkflow.js`** holds the pure logic and `SAMPLE`. It is tested the way `dnaExtraction.js` is.
- **`curriculum/benchWorkflow.js`** holds the four lesson definitions, in the same style as `extraction.js`.
- **`curriculum/benchWorkflowTopics.json`** holds the topic data for orders 19–22.
- **`modules.js`** gets a new module:
  - `id: 'bench-workflow'`, field `molecular-biology`, title "Bench Workflow", basePath `/learn/bench-workflow`;
  - two chapters: *Measure and amplify* (19, 20) and *Analyze the product* (21, 22);
  - a broader `molecular-biology` field summary. My call: "Bench methods for getting DNA out of cells, measuring it, copying it and cutting it."
- **`SampleHandoff.jsx`** is the "From the last station" card at the top of each bench. It shows what arrived and links to the previous station.
- **`GelImage.jsx`** is a schematic SVG gel. Stations 21 and 22 share it. It draws:
  - lanes and wells at the cathode (−) end;
  - band positions from the migration model;
  - a direction arrow toward the anode (+).
- **`stations.js`** gets a challenge line and an activity name for each new station.

### Station 19 · DNA quantification (`dna-quantification`)

**Bench: "Spectrophotometer".** The bench has four sample cards. Card 1 is our sample; the other three are problem samples:

| Card | A260 | A280 | A230 | Expected verdict |
|---|---|---|---|---|
| Your DNA (from station 18) | 0.75 | 0.41 | 0.38 | 1.83 / 1.97: no sign of protein or salt |
| Protein carried over | 0.75 | 0.47 | 0.40 | 260/280 ≈ 1.60: protein or phenol |
| RNase skipped (station 16) | 0.90 | 0.44 | 0.45 | 260/280 ≈ 2.05: RNA likely. The A260 concentration also overestimates the DNA |
| Carryover from the prep | 0.75 | 0.41 | 0.60 | 260/230 ≈ 1.25: something absorbing near 230 nm came along. The ratio does not say what |

How the bench runs:
- For each card, the learner first **predicts** a verdict from four options, then reveals the calculated ratios and concentration.
- A final step asks the learner to compute our sample's concentration (multiple choice), then shows the working: 0.75 × 50 = 37.5 ng/µL, × 50 µL ≈ 1.9 µg.
- Logic: `quantify({a260, a280, a230, volumeUl})` returns `{concentration, yieldNg, r280, r230, flags}`. Flag thresholds:
  - r280 below 1.7 → protein flag;
  - r280 of 1.95 or more → RNA flag;
  - r230 below 1.8 → low-230 flag.

  These are teaching cut-offs; the limitations note says so.

**Explorer variants (outcome):**
- Clean sample → `pure DNA`
- Protein carried over → `protein or phenol contamination`
- RNase skipped → `RNA contamination`
- Carryover from the prep → `low A260/A230 contaminant`

**Questions:**
- *exercise:* Your DNA reads A260 = 0.75 (10 mm path). What is its concentration?
  - Options: 37.5 ng/µL ✔ · 15 ng/µL · 75 ng/µL
  - Explanation: For double-stranded DNA, an A260 of 1.0 corresponds to about 50 ng/µL, so 0.75 × 50 = 37.5 ng/µL.
- *check:* A sample's A260/A280 is 1.60. What is the most likely explanation?
  - Options: RNA contamination · protein or phenol contamination ✔ · pure DNA
  - Explanation: Protein and phenol absorb near 280 nm and pull the ratio below about 1.8. A ratio flags a problem; it does not identify the contaminant.
- *check2:* RNase A was skipped and the ratio reads 2.05. What else is wrong with this reading?
  - Options: The A260 concentration overestimates the DNA ✔ · the DNA is degraded · the ratio proves the sample is pure
  - Explanation: RNA also absorbs at 260 nm, so it inflates the A260-based concentration.

**References:**
- `desjardins2010` (existing): 1.8, 2.0 and 1.8–2.2.
- `qiagen-spectro` (new): A260 1.0 ≈ 50 µg/mL dsDNA, the 1 cm path basis, and the pH dependence of the ratio.
- `thermo-purity` (new): Thermo Scientific NanoDrop technical note on nucleic acid purity ratios. It backs the list of common 230 nm absorbers given as examples in the feedback (for example EDTA, carbohydrates, phenol, guanidine). If the note cannot be confirmed, the feedback names no examples.

The "Carryover" card is deliberately not tied to station 18. Salting out uses no chaotrope, and NaCl is a weak 230 nm absorber, so naming a cause would overclaim.

**Limitations:** Absorbance cannot tell DNA from RNA or free nucleotides. 260/280 is insensitive to small amounts of protein. Ratios depend on the instrument, blank, pH and concentration, and are unreliable at very low A260. Fluorescent dye assays measure dsDNA more specifically. The flag cut-offs are teaching values, not instrument specifications.

### Station 20 · PCR (`pcr-amplification`)

**Bench: "Thermocycler".** It opens with the template card: 1 µL of a 1:10 dilution, which is 3.75 ng, about 1,100 genome copies.

**Controls (gates, as in `ProtocolBench`):**

| Control | Options | Effect |
|---|---|---|
| Primers | Facing each other ✔ · Both on the same strand · Pointing away | Only facing primers define an amplifiable target |
| Annealing temperature (primer Tm ≈ 60 °C) | 45 °C · 56 °C ✔ · 72 °C | Too cold gives extra non-specific bands; too hot leaves little or no binding, so no product |
| Extension per cycle | 15 s · 60 s ✔ | Common Taq guideline: about 1 min per kb. 15 s is too short for 850 bp, giving a weak or no full-length product |
| Polymerase | Thermostable (Taq) ✔ · Non-thermostable | A non-thermostable enzyme is inactivated at the first denaturation |
| Cycles | 10 · 20 · 30 ✔ · 40 | Fewer cycles give a faint band; 40 gives no real gain past the plateau and more risk of extra bands |

**Predict first.** The learner picks a predicted outcome, then presses "Run the cycler". The outcomes are:
- `single product`
- `no product`
- `extra bands`
- `weak product`

The verdict shows a small gel preview using `GelImage`.

Copies here always mean duplexes (double-stranded molecules). The 1,100 starting copies are genome duplexes.

**Copy counter.** A table for cycles 1–5 counts **duplexes** throughout, from one template duplex, using the standard idealized count:
- 2ⁿ target-containing duplexes in total;
- 2ⁿ − 2n of them exact length (850 bp).

So 0 at cycles 1–2 and 2 at cycle 3.

**Curve.** A chart plots the ideal curve (1,100 × 2ⁿ) next to a **schematic** plateau curve. The plateau is labelled "schematic: real reactions slow as reagents run out; the cycle where this happens varies". Before showing the value at cycle 10, the bench asks the learner to predict it.

**Logic:**
- `runPcr(settings)` returns `{gates, outcome, bands}`.
- `idealCopies(start, n)` returns the ideal count.
- `exactLengthDuplexes(n)` returns 2ⁿ − 2n, clamped at 0.

**Explorer variants (outcome):**
- Standard set-up → `single product`
- Primers pointing away → `no product`
- Annealing at 72 °C → `no product`
- Annealing at 45 °C → `extra bands`
- 15 s extension → `weak product`

**Questions:**
- *exercise:* Starting from about 1,100 template copies, roughly how many copies does 10 ideal cycles give?
  - Options: about 11,000 · about 1.1 million ✔ · about 110,000
  - Explanation: 2¹⁰ = 1,024, and 1,100 × 1,024 ≈ 1.1 million.
- *check:* Why does the target roughly double every cycle?
  - Options: each strand of every duplex is a template for a new strand ✔ · the polymerase copies each strand twice · primers copy themselves
- *check2:* You anneal far above the primers' melting temperature. Predict the result.
  - Options: little or no product ✔ · extra non-specific bands · a longer product

**References:**
- `saiki1988` (new): thermostable Taq polymerase, cycled amplification, and genomic targets amplified more than 10⁷-fold.
- `sigma-pcr` (new): the plateau phase, and the target-length product as the template from cycle 3.
- `duewer2018` (new): converting human genomic DNA mass to haploid genome copies, at about 3.3 pg per haploid genome.

**Limitations:** An idealized model. Real efficiency is below 100% and falls in late cycles. The plateau curve is schematic, not calculated. Annealing and extension outcomes are qualitative categories around a stated primer Tm. Primer-dimers, mispriming details, polymerase fidelity and hot-start chemistry are not modelled. The genome-copy conversion assumes about 3.3 pg per haploid human genome.

### Station 21 · Gel electrophoresis (`gel-electrophoresis`)

**Bench: "Gel rig".** The lanes are:
- a 100 bp ladder: a schematic generic ladder, 100–1,000 bp in 100 bp steps, not a specific product;
- the PCR product from station 20;
- a no-template control, which stays empty;
- a sample with ethanol left in it, which floats out of the well. This ties back to station 18.

The learner chooses three things:
- **agarose:** 0.7% · 1% ✔ · 2%;
- **electrode set-up:** wells at the − end ✔ · wells at the + end;
- **run time:** short · right ✔.

**Predict first.** Before running, the learner predicts which ladder bands the product will sit between (700–800 · 800–900 ✔ · 900–1,000). After the run, an **estimate tool** asks for a size. It shows the log-linear interpolation between the two neighbouring ladder bands, then reveals ≈ 850 bp.

**Migration model:** distance = a − b·log₁₀(size), with `a` and `b` set per agarose %. A higher percentage spreads small fragments and compresses large ones. Positions are schematic. The outcomes:
- `band resolved`
- `DNA runs out of the gel`: polarity reversed, so the DNA moves the other way into the buffer;
- `sample floats out`
- `bands not separated`: run too short, or a 0.7% gel for small fragments, shown as bands bunched together.

**Logic:**
- `migrate(sizeBp, agarose, runTime)` returns a position.
- `runGel(settings)` returns `{lanes, outcome}`.
- `estimateSize(distance, ladder, agarose)` does log interpolation between the neighbouring ladder bands.

**Explorer variants (outcome):**
- 1% gel, wells at − → `band resolved`
- Electrodes reversed → `DNA runs out of the gel`
- Ethanol left in the sample → `sample floats out`
- Run stopped early → `bands not separated`

**Questions:**
- *exercise:* The band sits between the 800 and 900 bp ladder bands, about halfway on the log scale. What is the best estimate?
  - Options: about 850 bp ✔ · about 300 bp · about 1,700 bp
  - Explanation: halfway on a log scale between 800 and 900 is √(800 × 900) ≈ 849 bp.
- *check:* Which way do DNA fragments move in the gel?
  - Options: toward the positive electrode (anode) ✔ · toward the negative electrode (cathode) · they stay in the well
  - Explanation: the phosphate backbone is negatively charged.
- *check2:* Why plot the ladder as log(size) against distance?
  - Options: over the gel's working range, distance falls roughly linearly with the log of size ✔ · distance is proportional to size · small fragments move more slowly

**References:**
- `lee2012` (new): migration to the anode, distance inversely proportional to the log of molecular weight, sizing against a ladder, choosing agarose % by fragment size, the cathode near the wells, and conformation affecting mobility.
- `green-ethanol` (existing): context for the ethanol carryover.

**Limitations:** Band positions come from a schematic log-linear model, not from a specific gel, buffer, voltage or stain. Sizes read from a gel are estimates. Supercoiled, nicked and linear DNA of the same length migrate differently. Very large fragments leave the log-linear range. The agarose effect is shown as a qualitative trend; real resolution ranges depend on the agarose type and conditions.

### Station 22 · Restriction digest (`restriction-digest`)

**Bench: "Digest and check".** It opens with the gel-confirmed 850 bp product and a site map:
- EcoRI at 300;
- HindIII at 700;
- BamHI: no site.

How the bench runs:
1. The learner chooses enzymes (any combination).
2. They **predict the fragment sizes** by picking from a size list (150 · 300 · 400 · 550 · 700 · 850).
3. They press "Digest and run". The fragments appear on `GelImage` beside the ladder and an uncut lane, with feedback against their prediction.
4. A **"Short incubation"** toggle gives a partial digest. The bands then include the intermediates and the uncut 850 bp.
5. A rule card states the counting: n cuts give n + 1 fragments for linear DNA and n fragments for circular DNA. It ends with a one-question try-it for a circular plasmid with one site.

**Logic:**
- `digest(lengthBp, sites, enzymes, {topology, partial})` returns sorted fragment sizes. For a partial digest it returns every product of a subset of cuts.
- `fragmentsMatch(predicted, actual)` compares the prediction with the result.

**Explorer variants (outcome):**
- EcoRI → `300 + 550 bp`
- BamHI → `850 bp, uncut`
- EcoRI + HindIII → `150 + 300 + 400 bp`
- EcoRI, short incubation → `extra uncut band`

**Questions:**
- *exercise:* EcoRI cuts the 850 bp product once, 300 bp from one end. Which bands do you expect?
  - Options: 300 + 550 bp ✔ · 425 + 425 bp · 850 bp only
- *check:* A linear DNA has two sites for an enzyme. How many fragments does a complete digest give?
  - Options: three ✔ · two · four
  - Explanation: a circle with two sites would give two.
- *check2:* After an EcoRI digest you see bands at 850, 550 and 300 bp. What is most likely?
  - Options: the digest was incomplete ✔ · EcoRI has a second site · the PCR made two products

**References:**
- `neb-ecori` (new): EcoRI site G^AATTC with a 5′ AATT overhang.
- `neb-hindiii` (new): HindIII site A^AGCTT.
- `neb-bamhi` (new): BamHI site G^GATCC. Here it is used as an enzyme with no site in the amplicon.
- `lee2012`: reading fragments against a ladder.

**Limitations:** The amplicon and its site map are a defined teaching example, not a real sequence. Sizes use the top-strand cut position and ignore overhang nucleotides. Star activity, methylation sensitivity, buffer compatibility and end effects (a site too close to a PCR product's end may cut poorly) are not modelled. The partial digest shows which products are possible, not their amounts.

### References: new entries in `profiles/references.json`

Every entry has the existing shape: `id`, `citation`, `url`, `support`, `verification`, `verifiedOn`.

| id | Source | Verification status today |
|---|---|---|
| `saiki1988` | Saiki RK et al. (1988). Primer-directed enzymatic amplification of DNA with a thermostable DNA polymerase. *Science* 239:487–491. PMID 2448875 | Abstract verified via NCBI E-utilities |
| `lee2012` | Lee PY, Costumbrado J, Hsu CY, Kim YH (2012). Agarose gel electrophoresis for the separation of DNA fragments. *J Vis Exp* (62):3923. PMC4846332 | Full text verified via NCBI E-utilities |
| `thermo-purity` | Thermo Scientific NanoDrop technical note: assessment of nucleic acid purity | Not yet found; **find and confirm in a browser** |
| `duewer2018` | Duewer DL et al. (2018). Evaluating droplet digital PCR for the quantification of human genomic DNA… *Anal Bioanal Chem*. PMC5996397 | Bibliography verified via E-utilities. **The 3.3 pg statement still needs confirming in the text** |
| `qiagen-spectro` | QIAGEN Bench Guide: Spectrophotometric measurement of DNA concentration | Summary seen via search listing only; **confirm in a browser** |
| `sigma-pcr` | Sigma-Aldrich technical article: Polymerase chain reaction | Summary seen via search listing only; **confirm in a browser** |
| `neb-ecori`, `neb-hindiii`, `neb-bamhi` | NEB product pages R0101, R0104, R0136 | NEB blocks automated fetches; **confirm in a browser** |

**Verification rule:**
- Before a reference is committed, its page is opened and the claimed support is read. Automated fetches were blocked, so this is done in Claude in Chrome.
- The `verification` note says exactly how the reference was checked, for example "summary verified via PMC full text (E-utilities)".
- If a source can't be confirmed, its claim is cut or softened, or the source is replaced. An unchecked reference is never shipped.

### Feedback and accessibility

- **Every bench predicts first.** The reveal button stays disabled until the learner has made a prediction. Feedback says whether the prediction held and why.
- **SVGs** (gel, curve, tube) get `role="img"` and a full `aria-label`. Every band and value shown in a diagram is also given as text.
- **Motion:** band migration animates only when `prefers-reduced-motion` is not set. Otherwise the bands appear in place.

### Contract and database

- Bump `CONTRACT_VERSION` to `siaset-v3` and run `npm run build:db2`.
- Add the migration `2026112414xxxx_contract_v3.sql`, which registers the new manifest row.
- **Raise the assignment station cap.** `valid_station_list` in `20261124130000_assignment_stations.sql` allows at most 18 stations per assignment, so a teacher ticking all 22 would hit a check error. A second new migration replaces the function with a cap of 64. That leaves room for the next modules without another migration each time, while keeping a bound. A db2 test covers it: 22 passes, 65 fails. `stationDashboard.test.js` expects 22 checkboxes.
- Update `tests/db2/security.test.mjs` to 20 lessons and the new view count, which is 17 new variants (4 + 5 + 4 + 4) on top of 71. Check what the test counts as a "view" before changing the number.
- No `station_lab_scenarios` change.
- **Apply the migration to staging before redeploying `learner-write`. Ask the user before each step.**

## Left to the builder

- Exact component names, CSS class names and the precise SVG layout.
- The values of `a` and `b` in the migration model, provided the 850 bp band sits between the 800 and 900 ladder bands at 1%, the order is monotonic, and the band positions are labelled schematic.
- The exact copy for challenge lines and activity names (draft: "Measure your DNA before you use it." / "Spectrophotometer", and so on).
- Wording polish of explanations, keeping the facts above.

## Calls I made (please check)

1. **HindIII added as a third enzyme** (site at 700), so that "both enzymes together" gives a real three-fragment pattern. BamHI, which has no site, still teaches "no site, no cut".
2. **The RNase problem sample in station 19 links back** to the skipped-RNase variant of station 16.
3. **Teaching flag cut-offs** for the ratios: below 1.7, 1.95 or more, and below 1.8.
4. **Annealing options** around a stated primer Tm of 60 °C (45 / 56 / 72 °C).
5. **The Molecular Biology field summary is broadened** to cover the new module.
6. **The amplicon is 850 bp, not 800.** A 100 bp ladder has an 800 band, so an 800 bp product would sit level with it and there would be nothing to interpolate. All digest numbers move with it.
7. **The station cap goes from 18 to 64** (see Contract and database).
8. **The fourth quantification card is generic carryover**, not "wash skipped": salt isn't a strong 230 nm absorber.
