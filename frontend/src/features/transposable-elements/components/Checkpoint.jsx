import { checkpoints } from '../learning.js';
export default function Checkpoint({id,answer,onAnswer}) {
  const q=checkpoints[id]; const answered=answer!==undefined; const correct=answer===q.correct;
  return <section className="checkpoint"><div className="eyebrow">REASONING CHECKPOINT</div><h3>{q.question}</h3><fieldset><legend className="sr-only">Choose a prediction</legend>{q.options.map((option,i)=><label key={option} className={answer===i?'chosen':''}><input type="radio" name={`prediction-${id}`} value={i} checked={answer===i} onChange={()=>onAnswer(i)}/><span>{option}</span></label>)}</fieldset>{answered&&<p role="status" className={correct?'feedback good':'feedback'}>{correct?'Correct. ': 'Try again. '}{q.explanation}</p>}</section>;
}
