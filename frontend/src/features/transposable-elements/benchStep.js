// Predict-then-reveal state shared by the bench workflow benches. Pure, so it is testable
// without rendering: a result is only ever shown for the settings and prediction it came from.
export const initialStep = settings => ({settings, prediction: '', result: null});

const empty = p => p === '' || p == null || (Array.isArray(p) && p.length === 0);
const sameOutcome = (prediction, result) => prediction === result.outcome;

export function benchStep(state, action) {
  switch (action.type) {
    case 'set': return {settings: {...state.settings, ...action.patch}, prediction: '', result: null};
    case 'predict': return {...state, prediction: action.value, result: null};
    case 'reveal': {
      if (empty(state.prediction)) return state;
      const result = action.evaluate(state.settings);
      return {...state, result: {...result, correct: (action.judge ?? sameOutcome)(state.prediction, result)}};
    }
    case 'reset': return initialStep(action.settings);
    default: return state;
  }
}
