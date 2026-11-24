import {useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router';
import {useAuth} from '../auth/AuthProvider.jsx';
import {profileDetails} from '../auth/profile.js';
import {friendlyError, OPTION_STYLES, useCountdown, useLive} from './api.js';
import {ClassroomGate} from './Teach.jsx';
import {Leaderboard} from './QuizHost.jsx';
import ClassroomNav from './ClassroomNav.jsx';
import './classroom.css';

function JoinGame({client, user}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function join(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    const {data, error} = await client.rpc('join_quiz', {p_pin: String(values.get('pin')).replace(/\D/g, ''), p_nickname: values.get('nickname')});
    setBusy(false);
    if (error) setMessage(friendlyError(error)); else navigate(`/play/${data}`);
  }
  return <form className="live-join" onSubmit={join}>
    <h1>Join a live quiz</h1>
    <label>Game PIN<input name="pin" required inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} autoComplete="off" placeholder="123 456" className="code-input" disabled={busy}/></label>
    <label>Nickname<input name="nickname" required maxLength={30} defaultValue={(profileDetails(user).name || '').slice(0, 30)} disabled={busy}/></label>
    <button className="class-button primary big" disabled={busy}>{busy ? 'Joining…' : 'Enter ▶'}</button>
    {message && <p role="status" className="class-status">{message}</p>}
  </form>;
}

export function PlayScreen({client, user, sessionId}) {
  const [session, setSession] = useState(null), [players, setPlayers] = useState([]), [answers, setAnswers] = useState({}), [message, setMessage] = useState(''), [sending, setSending] = useState(false);
  useLive(client, sessionId, [{table: 'quiz_sessions', filter: `id=eq.${sessionId}`}, {table: 'quiz_players', filter: `session_id=eq.${sessionId}`}], async () => {
    const [s, p, a] = await Promise.all([
      client.from('quiz_sessions').select('id, title, status, question_index, question_count, current, question_started_at, correct_option').eq('id', sessionId).maybeSingle(),
      client.from('quiz_players').select('user_id, nickname, score, correct_count').eq('session_id', sessionId).order('score', {ascending: false}).order('joined_at'),
      client.from('quiz_answers').select('question_index, choice, is_correct, points').eq('session_id', sessionId).eq('user_id', user.id),
    ]);
    if (s.error || !s.data) { setMessage(s.error ? friendlyError(s.error) : 'This game isn’t available. Check the PIN and join again.'); return; }
    setSession(s.data); setPlayers(p.data || []);
    setAnswers(Object.fromEntries((a.data || []).map(r => [r.question_index, r])));
  }, 1500);
  const remaining = useCountdown(session?.status === 'question' ? session.question_started_at : null, session?.current?.seconds);

  if (!session) return <p role="status" className="live-wait">{message || 'Connecting…'} {message && <Link to="/play">Join a game</Link>}</p>;
  const me = players.find(p => p.user_id === user.id), rank = players.findIndex(p => p.user_id === user.id) + 1;
  const mine = answers[session.question_index];
  async function answer(choice) {
    if (sending || mine) return;
    setSending(true);
    const {data, error} = await client.rpc('quiz_answer', {p_session: sessionId, p_choice: choice});
    setSending(false);
    if (error) setMessage(friendlyError(error));
    else { setMessage(''); setAnswers(current => ({...current, [session.question_index]: {choice, points: data[0].points, is_correct: null}})); }
  }
  return <div className={`live-stage player is-${session.status}`}>
    <header className="live-top"><span><b>{me?.nickname}</b></span><span>{session.status !== 'lobby' && session.status !== 'finished' && `Q${session.question_index + 1}/${session.question_count}`}</span><span className="score">{me?.score ?? 0} pts</span></header>
    {session.status === 'lobby' && <div className="live-wait"><h2>You’re in! 🎉</h2><p>Watch the main screen. The quiz starts soon.</p><p className="live-count">{players.length} player{players.length === 1 ? '' : 's'} here</p></div>}
    {session.status === 'question' && session.current && (mine
      ? <div className="live-wait"><h2>Answer locked in</h2><p>Waiting for the others… {remaining != null && `${remaining}s`}</p></div>
      : remaining === 0 ? <div className="live-wait"><h2>Time’s up ⏱</h2></div>
      : <div className="live-question player-question">
        <div className="live-meta"><span className="timer">{remaining}</span></div>
        <h2>{session.current.text}</h2>
        <div className="live-options answer-buttons">{session.current.options.map((option, k) => <button key={k} disabled={sending} className={`live-option option-${OPTION_STYLES[k].name}`} onClick={() => answer(k)}>
          <span className="shape" aria-hidden="true">{OPTION_STYLES[k].shape}</span><span>{option}</span></button>)}</div>
      </div>)}
    {session.status === 'reveal' && <div className={`live-wait result ${mine ? (mine.choice === session.correct_option ? 'is-right' : 'is-wrong') : 'is-wrong'}`}>
      <h2>{!mine ? 'No answer' : mine.choice === session.correct_option ? 'Correct! ✓' : 'Not this time'}</h2>
      {mine?.choice === session.correct_option && <p className="points">+{mine.points}</p>}
      {mine?.choice !== session.correct_option && session.current && <p>The answer was <b>{session.current.options[session.correct_option]}</b>.</p>}
      <p>You’re <b>#{rank}</b> of {players.length}</p>
    </div>}
    {session.status === 'finished' && <div className="live-final"><h2>Game over</h2><p>You finished <b>#{rank}</b> with <b>{me?.score ?? 0}</b> points and {me?.correct_count ?? 0} correct.</p><Leaderboard players={players} limit={10} highlight={user.id}/><Link className="class-button" to="/play">Join another game</Link></div>}
    {message && <p role="status" className="class-status">{message}</p>}
  </div>;
}

export default function QuizPlay() {
  const {client, user, ready} = useAuth();
  const {sessionId} = useParams();
  return <main className="classroom-page live-page">
    <ClassroomNav/>
    <ClassroomGate client={client} user={user} ready={ready}>{sessionId ? <PlayScreen key={sessionId} client={client} user={user} sessionId={sessionId}/> : <JoinGame client={client} user={user}/>}</ClassroomGate>
  </main>;
}
