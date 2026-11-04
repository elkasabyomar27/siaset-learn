import topics from './topics.json' with {type:'json'};

// Display numbers need not be contiguous; navigation follows explicit order.
export function adjacentTopics(topicId, curriculum = topics) {
  const ordered = [...curriculum].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex(topic => topic.id === topicId);
  return index < 0 ? {} : {previous:ordered[index - 1], next:ordered[index + 1]};
}
