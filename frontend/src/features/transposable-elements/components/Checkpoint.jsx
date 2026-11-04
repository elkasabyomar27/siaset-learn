import { checkpoints } from '../learning.js';
// reveal=false is predict-then-test: the choice is locked in without a verdict until the experiment runs.
export default function Checkpoint({id,answer,onAnswer,reveal=true}) {
  const q=checkpoints[id]; const answered=answer!==undefined; const correct=answer===q.correct;
  const verdictClass=reveal?(correct?'answer-correct':'answer-incorrect'):'';
  return <section className="checkpoint"><div className="eyebrow">{reveal?'REASONING CHECKPOINT':'YOUR PREDICTION'}</div><h3>{q.question}</h3><fieldset><legend className="sr-only">Choose a prediction</legend>{q.options.map((option,i)=><label key={option} className={answer===i?`chosen ${verdictClass}`:''}><input type="radio" name={`prediction-${id}`} value={i} checked={answer===i} onChange={()=>onAnswer(i)}/><span>{option}</span>{reveal&&answer===i&&<span className="answer-verdict">{correct?'✓ Correct':'✗ Not quite'}</span>}</label>)}</fieldset>{answered&&(reveal?<p role="status" className={correct?'feedback good':'feedback'}><b>{correct?'Correct. ':'Try again. '}</b>{q.explanation}</p>:<p role="status" className="prediction-locked">Prediction locked in. Run the experiment to test it.</p>)}</section>;
}
