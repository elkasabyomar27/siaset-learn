import teTopics from './topics.json' with { type: 'json' };
import extractionTopics from './extractionTopics.json' with { type: 'json' };
import benchWorkflowTopics from './benchWorkflowTopics.json' with { type: 'json' };

// The curriculum is a list of modules. Topic ids are unique across modules (they key saved
// progress), and `order` continues across modules so the whole path reads 01…N.
// The transposable-element module keeps its original 15 topics, routes and assessment bank.
// Fields group modules across the whole lab. A module names its field; fields own no topics.
// Add a field here and point new modules at it; every lab page groups and filters by field.
export const fields = [
  { id: 'genetics', title: 'Genetics', summary: 'How genes are built, move and change what a cell can do.' },
  { id: 'molecular-biology', title: 'Molecular Biology', summary: 'Bench methods for getting DNA out of cells, measuring it, copying it and cutting it.' },
];

export const modules = [
  {
    id: 'transposable-elements',
    field: 'genetics',
    title: 'Transposable Elements',
    summary: 'How mobile DNA was discovered, how it moves, and what an insertion can change.',
    basePath: '/learn/transposable-elements',
    topics: teTopics,
    chapters: [
      { id: 'recognize', title: 'Recognize an element', question: 'What is the evidence for mobility, which DNA belongs to the element, and what moves through which intermediate?', topics: ['introduction', 'discovery', 'anatomy', 'classification'] },
      { id: 'mechanism', title: 'Follow a mechanism', question: 'What happens to copies and replicons during the two worked pathways?', topics: ['dna-diversity', 'conservative', 'replicative'] },
      { id: 'architecture', title: 'Read genetic architecture', question: 'How are movement functions and cargo organized into modules?', topics: ['insertion-sequences', 'composite'] },
      { id: 'insertion', title: 'Interpret an insertion', question: 'Which structural, phenotypic, transcriptional and junction-level claims follow from the evidence?', topics: ['genomic-consequences', 'phenotypes', 'expression', 'tsd'] },
      { id: 'context', title: 'Place movement in context', question: 'What permits movement, and when does DNA enter a different cell?', topics: ['regulation', 'bacterial-hgt'] },
    ],
  },
  {
    id: 'dna-extraction',
    field: 'molecular-biology',
    title: 'DNA Extraction & Purification',
    summary: 'Free DNA from cells, pull it out of solution with isopropanol, and wash it clean.',
    basePath: '/learn/dna-extraction',
    topics: extractionTopics,
    chapters: [
      { id: 'isolate', title: 'From cell to clean DNA', question: 'How do we release DNA, bring it out of solution, and remove what came with it?', topics: ['extraction-principles', 'isopropanol-precipitation', 'ethanol-wash'] },
    ],
  },
  {
    id: 'bench-workflow',
    field: 'molecular-biology',
    title: 'Bench Workflow',
    summary: 'Measure your DNA, copy a target with PCR, size it on a gel and cut it with restriction enzymes.',
    basePath: '/learn/bench-workflow',
    topics: benchWorkflowTopics,
    chapters: [
      { id: 'measure-amplify', title: 'Measure and amplify', question: 'How much DNA do we have, how clean is it, and how do we copy one target from it?', topics: ['dna-quantification', 'pcr-amplification'] },
      { id: 'analyze-product', title: 'Analyze the product', question: 'Is the product the size we expect, and does it cut where its sites say it should?', topics: ['gel-electrophoresis', 'restriction-digest'] },
    ],
  },
];

const moduleByTopic = new Map(modules.flatMap(module => module.topics.map(topic => [topic.id, module])));

export const allTopics = modules.flatMap(module => module.topics).sort((a, b) => a.order - b.order);
export const allChapters = modules.flatMap(module => module.chapters.map(chapter => ({ ...chapter, module: module.id })));
export const moduleById = id => modules.find(module => module.id === id);
export const moduleForTopic = id => moduleByTopic.get(id);
export const fieldById = id => fields.find(field => field.id === id);
export const fieldForModule = module => fieldById(module?.field);
export const fieldForTopic = id => fieldForModule(moduleForTopic(id));
export const modulesInField = id => modules.filter(module => module.field === id);
/** 1-based position of a topic inside its own module. */
export const positionInModule = id => {
  const module = moduleForTopic(id);
  return module ? { index: module.topics.findIndex(topic => topic.id === id) + 1, total: module.topics.length, module } : null;
};
