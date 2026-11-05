import { useEffect, useId, useRef, useState } from 'react';
import { MIN_PASSWORD_LENGTH, passwordStrength } from './passwordStrength.js';

function EyeIcon({open}) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>
    {!open && <path d="M4 4l16 16"/>}
  </svg>;
}

/** A password input with a show/hide toggle. Extra props go to the <input>. */
export function PasswordInput({label, hint, describedBy, children, ...input}) {
  const id = useId(), [visible, setVisible] = useState(false);
  return <div className="password-field">
    <label htmlFor={id}>{label}</label>
    <div className="password-input">
      <input id={id} type={visible ? 'text' : 'password'} spellCheck={false} autoCapitalize="off" aria-describedby={describedBy} {...input}/>
      <button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} aria-controls={id} disabled={input.disabled} onClick={() => setVisible(value => !value)}><EyeIcon open={!visible}/></button>
    </div>
    {hint && <small>{hint}</small>}
    {children}
  </div>;
}

/**
 * New password + confirmation with a live strength meter and checklist. Renders inputs named
 * `password` and `confirmPassword`, so the surrounding form can keep reading them with FormData.
 */
export function NewPasswordFields({label = 'Password', disabled = false}) {
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [context, setContext] = useState({email: '', name: ''});
  const anchor = useRef(null), ids = useId();
  // Re-read email and name when those fields change, so the "personal" check stays current. Keystrokes
  // in the password fields themselves must not trigger this: a state update from a native listener in
  // the middle of React's handling of the same keystroke makes React revert the controlled input.
  useEffect(() => {
    const form = anchor.current?.form;
    if (!form) return;
    const sync = event => {
      if (event && !['email', 'displayName'].includes(event.target?.name)) return;
      setContext({email: form.elements.email?.value || '', name: form.elements.displayName?.value || ''});
    };
    sync(); form.addEventListener('input', sync);
    return () => form.removeEventListener('input', sync);
  }, []);
  const {level, checks, fixes} = passwordStrength(password, context);
  const mismatch = confirm.length > 0 && confirm !== password;
  return <>
    <input ref={anchor} type="hidden"/>
    <PasswordInput label={label} name="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" disabled={disabled} describedBy={`${ids}-strength ${ids}-checks`}>
      <div className={`password-strength is-${level.id}`}>
        <div className="password-meter" aria-hidden="true">{[1, 2, 3, 4].map(bar => <span key={bar} className={bar <= level.bars ? 'is-on' : ''}/>)}</div>
        <p id={`${ids}-strength`} aria-live="polite">{password ? <>Strength: <b>{level.label}</b>{fixes.length > 0 && <span className="password-next"> · {fixes.length === 1 ? 'fix the item marked ✗' : `fix the ${fixes.length} items marked ✗`}</span>}</> : 'Use a long phrase with a mix of character types.'}</p>
      </div>
      <ul id={`${ids}-checks`} className="password-checks" aria-label="Password requirements">
        {checks.map(check => {
          const missing = !!password && check.required && !check.met;
          return <li key={check.id} className={check.met ? 'is-met' : missing ? 'is-missing' : ''}>
            <span aria-hidden="true">{check.met ? '✓' : missing ? '✗' : check.required ? '•' : '+'}</span>
            <span>{check.label}{!check.required && <em> (recommended)</em>}{missing && check.fix && <small className="password-fix">{check.fix}</small>}</span>
            <span className="sr-only">{check.met ? ' — done' : missing ? ' — needs fixing' : ' — not yet'}</span>
          </li>;
        })}
      </ul>
    </PasswordInput>
    <PasswordInput label="Confirm password" name="confirmPassword" value={confirm} onChange={event => setConfirm(event.target.value)} required autoComplete="new-password" disabled={disabled} aria-invalid={mismatch || undefined} describedBy={`${ids}-match`}>
      <p id={`${ids}-match`} className={`password-match${confirm ? mismatch ? ' is-bad' : ' is-good' : ''}`} aria-live="polite">{confirm ? mismatch ? 'Passwords don’t match yet.' : '✓ Passwords match.' : 'Type the same password again.'}</p>
    </PasswordInput>
  </>;
}
