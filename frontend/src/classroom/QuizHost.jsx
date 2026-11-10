import {useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router';
import {useAuth} from '../auth/AuthProvider.jsx';
import {friendlyError, OPTION_STYLES, useCountdown, useLive} from './api.js';
import {ClassroomGate} from './Teach.jsx';
import './classroom.css';

export function Leaderboard({players, limit, highlight}) {
  return <ol className="leaderboard">{players.slice(0, limit).map((p, i) => <li key={p.user_id} className={p.user_id === highlight ? 'is-me' : ''}>
    <span className="rank">{i + 1}</span><span className="name">{p.nickname}</span><span className="score">{p.score}</span></li>)}</ol>;
}

export function HostScreen({client, sessionId}) {
  const [session, setSession] = useState(null), [players, setPlayers] = useState([]), [answered, setAnswered] = useState(0), [message, setMessage] = useState('');
  const busy = useRef(false);
  useLive(client, sessionId, [{table: 'quiz_sessions', filter: `id=eq.${sessionId}`}, {table: 'quiz_players', filter: `session_id=eq.${sessionId}`}, {table: 'quiz_answers', filter: `session_id=eq.${sessionId}`}], async () => {
    const [s, p] = await Promise.all([
      client.from('quiz_sessions').select('*').eq('id', sessionId).maybeSingle(),
      client.from('quiz_players').select('user_id, nickname, score, correct_count').eq('session_id', sessionId).order('score', {ascending: false}).order('joined_at'),
    ]);
    if (s.error) { setMessage(friendlyError(s.error)); return; }
    setSession(s.data); setPlayers(p.data || []);
    if (s.data?.status === 'question') {
      const a = await client.from('quiz_answers').select('user_id', {count: 'exact', head: true}).eq('session_id', sessionId).eq('question_index', s.data.question_index);
      setAnswered(a.count || 0);
    }
  }, 2000);
  const remaining = useCountdown(session?.status === 'question' ? session.question_started_at : null, session?.current?.seconds);

  async function advance() {
    if (busy.current || !session) return;
    busy.current = true;
    const {data, error} = await client.rpc('quiz_advance', {p_session: sessionId, p_from_status: session.status, p_from_index: session.question_index});
    busy.current = false;
    if (error) setMessage(friendlyError(error));
    else setSession(current => current && {...current, status: data});
  }
  // Reveal automatically when time runs out or everyone has answered.
  const allIn = players.length > 0 && answered >= players.length;
  useEffect(() => {
    if (session?.status === 'question' && (remaining === 0 || allIn)) advance();
  });

  if (!session) return <p role="status">{message || 'Loading game…'}</p>;
  const last = session.question_index + 1 >= session.question_count;
  const joinUrl = `${window.location.origin}/play`;
  return <div className={`live-stage host is-${session.status}`}>
    <header className="live-top">
      <span><b>{session.title}</b>{session.status !== 'lobby' && session.status !== 'finished' && ` · Question ${session.question_index + 1} of ${session.question_count}`}</span>
      <span className="live-pin-small">PIN <b>{session.pin}</b></span>
      {session.status !== 'finished' && <button className="class-link" onClick={async () => { if (window.confirm('End this game for everyone?')) { const {error} = await client.rpc('quiz_end', {p_session: sessionId}); if (error) setMessage(friendlyError(error)); } }}>End game</button>}
    </header>

    {session.status === 'lobby' && <section className="live-lobby">
      <p>Go to <b>{joinUrl}</b>, sign in, and enter</p>
      <div className="live-pin" aria-label={`Game PIN ${session.pin}`}>{session.pin.slice(0, 3)} {session.pin.slice(3)}</div>
      <p className="live-count">{players.length} player{players.length === 1 ? '' : 's'} joined</p>
      <ul className="lobby-names">{players.map(p => <li key={p.user_id}>{p.nickname}</li>)}</ul>
      <button className="class-button primary big" disabled={players.length === 0} onClick={advance}>Start ▶</button>
    </section>}

    {(session.status === 'question' || session.status === 'reveal') && session.current && <section className="live-question">
      <div className="live-meta">
        {session.status === 'question' ? <><span className="timer" aria-label={`${remaining} seconds left`}>{remaining}</span><span className="live-count">{answered} / {players.length} answered</span></>
          : <span className="live-count">Answers are in</span>}
      </div>
      <h2>{session.current.text}</h2>
      <div className="live-options">{session.current.options.map((option, k) => {
        const count = session.answer_counts?.[k] || 0, total = Object.values(session.answer_counts || {}).reduce((a, b) => a + b, 0) || 1;
        const correct = session.status === 'reveal' && session.correct_option === k;
        return <div key={k} className={`live-option option-${OPTION_STYLES[k].name}${session.status === 'reveal' && !correct ? ' is-dim' : ''}${correct ? ' is-correct' : ''}`}>
          <span className="shape" aria-hidden="true">{OPTION_STYLES[k].shape}</span><span>{option}</span>
          {session.status === 'reveal' && <span className="tally"><i style={{width: `${(count / total) * 100}%`}}/>{count}{correct && ' ✓'}</span>}
        </div>;
      })}</div>
      <div className="live-actions">
        {session.status === 'question' ? <button className="class-button" onClick={advance}>Show answer now</button>
          : <><Leaderboard players={players} limit={5}/><button className="class-button primary big" onClick={advance}>{last ? 'Final results 🏆' : 'Next question ▶'}</button></>}
      </div>
    </section>}

    {session.status === 'finished' && <section className="live-final">
      <h2>🏆 Final results</h2>
      <div className="podium">{[1, 0, 2].map(i => players[i] && <div key={i} className={`podium-${i + 1}`}><b>{players[i].nickname}</b><span>{players[i].score}</span><div className="block">{i + 1}</div></div>)}</div>
      <Leaderboard players={players} limit={50}/>
      <Link className="class-button" to="/teach">Back to teaching</Link>
    </section>}
    {message && <p role="status" className="class-status">{message}</p>}
  </div>;
}

export default function QuizHost() {
  const {client, user, ready} = useAuth();
  const {sessionId} = useParams();
  return <main className="classroom-page live-page"><ClassroomGate client={client} user={user} ready={ready}><HostScreen client={client} sessionId={sessionId}/></ClassroomGate></main>;
}
