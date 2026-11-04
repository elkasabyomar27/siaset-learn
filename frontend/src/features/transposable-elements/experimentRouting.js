export function experimentFromParams(params) {
  return params.get('experiment') === 'tn3' ? 'tn3' : 'tn5';
}

export function selectExperiment(params, scenario) {
  const next = new URLSearchParams(params);
  next.set('experiment', scenario === 'tn3' ? 'tn3' : 'tn5');
  return next;
}
