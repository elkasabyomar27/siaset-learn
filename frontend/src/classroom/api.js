import {useCallback, useEffect, useRef, useState} from 'react';

// Friendly text for the error codes raised by the classroom database functions and the teacher-request function.
const MESSAGES = {
  sign_in_required: 'Sign in to continue.',
  class_not_found: 'No class uses that code. Check it with your teacher.',
  own_class: 'You teach this class, so you can’t join it as a student.',
  class_full: 'This class is full.',
  not_your_class: 'Only the class teacher can do that.',
  game_not_found: 'No live game uses that PIN. Check the number on the screen.',
  own_game: 'You are hosting this game. Join from another account.',
  nickname_taken: 'Someone in this game already uses that nickname. Pick another.',
  game_full: 'This game is full.',
  question_closed: 'Time’s up for this question.',
  already_answered: 'You already answered this question.',
  not_in_game: 'Join the game first.',
  not_your_quiz: 'Only the quiz owner can start it.',
  details_required: 'Fill in your school and why you want teacher access.',
  recently_declined: 'Your last request was declined. You can ask again tomorrow.',
  email_failed: 'The request could not be emailed. Please try again in a minute.',
  not_configured: 'Teacher requests are not set up on this site yet.',
  origin_denied: 'Teacher requests aren’t enabled for this web address yet.',
  link_used_or_invalid: 'This approval link was already used or is no longer valid.',
  'row-level security': 'You don’t have permission to do that.',
  'Payload too large': 'That file is too large. The limit is 25 MB.',
  'mime type': 'That file type isn’t allowed. Use PDF, Word, PowerPoint, Excel, text or an image.',
};
export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  const text = [error?.message, error?.context?.error, error?.error, typeof error === 'string' ? error : ''].filter(Boolean).join(' ');
  const key = Object.keys(MESSAGES).find(k => text.includes(k));
  return key ? MESSAGES[key] : fallback;
}
export function missingSetup(error) {
  // PostgREST answers this way before the classroom migration has been applied to the project.
  return /PGRST20[25]|Could not find the (table|function)|relation .* does not exist/.test(error?.message || '') || error?.code === 'PGRST205' || error?.code === 'PGRST202';
}

/** Calls the teacher-request Edge Function and returns its JSON body, throwing friendly errors. */
export async function teacherRequest(client, body) {
  const {data, error} = await client.functions.invoke('teacher-request', {body});
  if (error) {
    let detail = null;
    try { detail = await error.context?.json(); } catch { /* not JSON */ }
    throw Error(friendlyError(detail || error, error.context?.status === 404 ? 'Teacher requests are not set up on this site yet.' : undefined));
  }
  return data;
}

/** The signed-in user's teacher status: loading | none | pending | approved | declined | unavailable. */
export function useTeacherStatus(client, user) {
  const [state, setState] = useState({status: 'loading', request: null});
  const load = useCallback(async () => {
    if (!client || !user) { setState({status: 'none', request: null}); return; }
    const {data, error} = await client.from('teacher_requests').select('status, school, reason, created_at, decided_at').maybeSingle();
    if (error) setState({status: missingSetup(error) ? 'unavailable' : 'none', request: null});
    else setState({status: data?.status || 'none', request: data});
  }, [client, user]);
  useEffect(() => { load(); }, [load]);
  return {...state, reload: load};
}

/**
 * Keeps data fresh for live screens: refetches on Supabase Realtime changes to the given tables
 * (filtered to one row set) and also polls, so screens still move if Realtime is unavailable.
 */
export function useLive(client, key, subscriptions, fetcher, pollMs = 2500) {
  const fetchRef = useRef(fetcher);
  useEffect(() => { fetchRef.current = fetcher; });
  const subsKey = JSON.stringify(subscriptions);
  useEffect(() => {
    if (!client || !key) return undefined;
    let active = true, timer;
    const run = () => { if (active) fetchRef.current(); };
    run();
    const channel = client.channel(`live-${key}-${Math.random().toString(36).slice(2)}`);
    for (const {table, filter} of JSON.parse(subsKey))
      channel.on('postgres_changes', {event: '*', schema: 'public', table, ...(filter ? {filter} : {})}, run);
    channel.subscribe();
    const poll = () => { timer = setTimeout(() => { run(); poll(); }, document.hidden ? pollMs * 4 : pollMs); };
    poll();
    return () => { active = false; clearTimeout(timer); client.removeChannel(channel); };
  }, [client, key, subsKey, pollMs]);
}

/** Seconds left on the current question, ticking locally from the server start time. */
export function useCountdown(startedAt, seconds) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt || !seconds) return null;
  return Math.max(0, Math.ceil(seconds - (now - new Date(startedAt).getTime()) / 1000));
}

export const OPTION_STYLES = [
  {name: 'red', shape: '▲'}, {name: 'blue', shape: '◆'}, {name: 'gold', shape: '●'}, {name: 'green', shape: '■'},
];

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'});
}
export function safeFileName(name) {
  const cleaned = String(name).normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').replace(/^[.-]+/, '').slice(-120);
  return cleaned || 'file';
}
