// From insertion to phenotype, as a chain of explicit assumptions (Phenotypic Consequences lesson).
// Hypothetical haploid bacterium, one enzyme in a nutrient pathway. Qualitative only.

export const SITES = {
  coding: 'Inside the enzyme’s coding region',
  regulatory: 'In the enzyme’s promoter region',
  intergenic: 'Intergenic, no known function',
};
export const PROMOTER_INFO = {sole: 'Known: it is the enzyme’s only promoter', unknown: 'Unknown: other promoters might exist'};
export const BACKUP = {none: 'No backup enzyme', present: 'A backup enzyme exists', unknown: 'Unknown'};
export const MEDIUM = {required: 'Nutrient must be made by the cell', supplied: 'Nutrient supplied in the medium', unknown: 'Assay conditions unknown'};
export const DEFAULT_PHENO = {site: 'coding', promoterInfo: 'unknown', backup: 'none', medium: 'required'};

export function phenotypeChain(input) {
  const c = {...DEFAULT_PHENO, ...input};
  if (!SITES[c.site] || !PROMOTER_INFO[c.promoterInfo] || !BACKUP[c.backup] || !MEDIUM[c.medium]) throw Error('Invalid phenotype input.');
  // Step 1: molecular effect.
  let molecular, lost;
  if (c.site === 'coding') { molecular = {state: 'lost', text: 'Coding region interrupted: assume loss of enzyme function.'}; lost = true; }
  else if (c.site === 'regulatory') {
    lost = c.promoterInfo === 'sole' ? true : null;
    molecular = lost ? {state: 'lost', text: 'Its only promoter is disrupted: assume the enzyme is no longer made.'}
      : {state: 'unknown', text: 'Promoter disrupted, but other promoters might still drive the gene.'};
  } else { molecular = {state: 'none', text: 'No known function at this site: assume no molecular effect on the pathway.'}; lost = false; }
  // Step 2: pathway function.
  let pathway;
  if (lost === false) pathway = {state: 'intact', text: 'The pathway is unaffected.'};
  else if (lost === null) pathway = {state: 'unknown', text: 'Cannot tell whether the enzyme is still made.'};
  else if (c.backup === 'present') pathway = {state: 'intact', text: 'The backup enzyme covers the lost step (redundancy).'};
  else if (c.backup === 'unknown') pathway = {state: 'unknown', text: 'Unknown whether anything covers the lost step.'};
  else pathway = {state: 'lost', text: 'No backup: the pathway step is lost.'};
  // Step 3: phenotype in this assay.
  let phenotype;
  if (pathway.state === 'intact') phenotype = {outcome: 'likely unchanged', text: c.site === 'intergenic' ? 'Unchanged is plausible under this condition, not proven for every condition.' : 'The molecular loss is real, but redundancy hides it in growth.'};
  else if (pathway.state === 'unknown') phenotype = {outcome: 'undetermined', text: 'A missing fact earlier in the chain means phenotype cannot be inferred.'};
  else if (c.medium === 'supplied') phenotype = {outcome: 'likely unchanged', text: 'Supplementation bypasses the lost pathway: growth may look normal although the loss of function remains.'};
  else if (c.medium === 'unknown') phenotype = {outcome: 'undetermined', text: 'Without knowing the assay, the effect on growth cannot be inferred.'};
  else phenotype = {outcome: 'likely altered', text: 'The cell must make the nutrient and cannot: growth is likely impaired.'};
  return {input: c, molecular, pathway, phenotype, maskedLoss: molecular.state === 'lost' && phenotype.outcome === 'likely unchanged'};
}

export const PHENO_GOALS = [
  {id: 'altered', title: 'Find a likely altered phenotype', done: r => r.phenotype.outcome === 'likely altered'},
  {id: 'masked', title: 'Lose the enzyme, yet keep growth looking normal', done: r => r.maskedLoss},
  {id: 'undetermined', title: 'Reach an honest “undetermined”', done: r => r.phenotype.outcome === 'undetermined'},
  {id: 'neutral', title: 'Insert without any molecular effect', done: r => r.molecular.state === 'none'},
];
