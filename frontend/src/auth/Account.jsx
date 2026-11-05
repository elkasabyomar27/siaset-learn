import {useEffect, useRef, useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router';
import {useAuth} from './AuthProvider.jsx';
import {finishAuthFlow, restartAuthFlow, startAuthFlow} from './flows.js';
import {authRequestError} from './errors.js';
import ProfileEditor from './ProfileEditor.jsx';
import {PresetAvatar, AvatarChoices} from './Avatar.jsx';
import {NewPasswordFields, PasswordInput} from './PasswordFields.jsx';
import {passwordStrength} from './passwordStrength.js';
import './account.css';

export default function Account() {
 const location=useLocation(),navigate=useNavigate();
 const {client,user,ready,providers}=useAuth();
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[mode,setMode]=useState('login'),[signupAvatar,setSignupAvatar]=useState('helix');
 const [recoveryOwner,setRecoveryOwner]=useState(null),callback=useRef(null);
 const [confirmationEmail,setConfirmationEmail]=useState('');
 const inFlight=useRef(false);
 const callbackRoute=['/auth/callback','/auth/recovery'].includes(location.pathname);
 useEffect(()=>{
  if(!callbackRoute)return;
  if(!client){window.history.replaceState(window.history.state,'',location.pathname);return;}
  let active=true;callback.current??=finishAuthFlow(client,window.location.href);
  callback.current.then(result=>{if(!active)return;if(result.recovery){setRecoveryOwner(result.owner);setMessage('Link verified. Choose a new password.');}else navigate(result.destination,{replace:true});}).catch(()=>{if(active)setMessage('This link could not be verified. Restart sign-in in the browser where you requested it.');});
  return()=>{active=false;};
 },[client,callbackRoute,location.pathname,navigate]);
 async function run(action){if(inFlight.current)return;inFlight.current=true;setBusy(true);setMessage('');try{await action();}catch(error){setMessage(error.message||'Account request failed. Please try again.');}finally{inFlight.current=false;setBusy(false);}}
 async function submit(event){
  event.preventDefault();const form=event.currentTarget,values=new FormData(form),intent=event.nativeEvent.submitter?.value||mode;
  const email=String(values.get('email')||'').trim(),password=String(values.get('password')||''),displayName=String(values.get('displayName')||'').trim();
  const confirmPassword=String(values.get('confirmPassword')||'');
  await run(async()=>{
   if(intent==='login'&&!password)throw Error('Enter your password.');
   if(['signup','update'].includes(intent)){
    const strength=passwordStrength(password,{email,name:displayName});
    if(!strength.acceptable)throw Error(`Choose a stronger password: ${strength.checks.filter(check=>check.required&&!check.met).map(check=>check.label.toLowerCase()).join('; ')}.`);
    if(password!==confirmPassword)throw Error('The two passwords don’t match. Type the same password in both fields.');
   }
   if(intent==='signup'&&(!displayName||displayName.length>100))throw Error('Enter a display name of up to 100 characters.');
   if(intent==='update'){
    const verified=await client.auth.getUser();if(!recoveryOwner||verified.error||verified.data.user?.id!==recoveryOwner)throw Error('Request a new recovery link.');
    const result=await client.auth.updateUser({password});if(result.error)throw Error('Password could not be updated. Request a new link or check the password requirements.');
    form.reset();setRecoveryOwner(null);navigate('/account',{replace:true});setMessage('Password updated.');
   }else if(intent==='login'){
    const result=await client.auth.signInWithPassword({email,password});if(result.error){if(result.error.code==='email_not_confirmed')setConfirmationEmail(email);throw authRequestError(result.error,'Sign-in failed. Please try again.');}
    try{await restartAuthFlow();}catch{/* A verified sign-in must not be reported as failed because optional lease cleanup failed. */}
    setConfirmationEmail('');form.reset();setMessage('Welcome back. You are signed in.');
   }else{
    const result=await startAuthFlow(intent==='recover'?'recovery':'signup',()=>intent==='recover'?client.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/recovery`}):client.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/auth/callback`,data:{display_name:displayName,siaset_avatar_preset:signupAvatar}}}),{replacePending:true});
    if(intent==='signup'&&!result.data?.session){setConfirmationEmail(email);setMode('login');}else setConfirmationEmail('');
    form.reset();setMessage(result.data?.session?'Your account is ready. You are signed in.':'If this request is eligible, check your email and spam folder. Open the newest link in this browser within 10 minutes.');
   }
  });
 }
 return <main className="dashboard account-page account-studio"><header className="account-page-heading"><p className="eyebrow">SIASET / YOUR PERSONAL SPACE</p><h1>{user?'A space that feels like you.':'Curiosity looks good on you.'}</h1><p>{user?'Update your profile and make the learning workspace yours.':'Create your profile, choose an avatar, and make yourself at home.'}</p></header>
 <div className="account-layout"><aside className="account-story"><div className="account-avatar-art"><PresetAvatar preset={signupAvatar}/><span className="avatar-orbit-one"/><span className="avatar-orbit-two"/></div><p className="eyebrow">ONE PROFILE. YOUR OWN PERSPECTIVE.</p><h2>Meet your learning identity.</h2><p>A name, a little personality, and room to explore molecular science.</p><div className="account-privacy"><b>Learning stays on this device.</b><span>Signing in saves your profile. It does not upload or sync your existing learning evidence.</span></div></aside>
 <section className="account-main-panel" aria-label="Account settings">
 {!client?<p role="status">Accounts are not configured in this environment. You can continue learning without signing in.</p>:<>
 <p role="status" aria-live="polite" className={`account-status${message?' has-message':''}`}>{message||(!ready?'Checking account…':user?`Signed in as ${user.email||'verified account'}.`:'Sign in to your account, or create one below.')}</p>
 {!user&&confirmationEmail&&!callbackRoute&&<section className="confirmation-help"><b>Confirm your email to finish signing up</b><p>Use the newest confirmation email sent to {confirmationEmail}. Once confirmed, return here to sign in.</p><button disabled={busy} onClick={()=>run(async()=>{await startAuthFlow('signup',()=>client.auth.resend({type:'signup',email:confirmationEmail,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}}),{replacePending:true});setMessage('If eligible, a new confirmation email has been sent. Check your inbox and spam folder.');})}>Resend confirmation email</button><button disabled={busy} onClick={()=>{setConfirmationEmail('');setMessage('');setMode('signup');}}>Use a different email</button></section>}
 {recoveryOwner?<><h2>Choose a new password</h2><form onSubmit={submit}><NewPasswordFields label="New password" disabled={busy}/><button className="primary-button" value="update" disabled={busy}>Update password</button></form></>:callbackRoute?<Link to="/account">Return to account sign-in</Link>:user?<><ProfileEditor key={user.id} client={client} user={user} busy={busy} run={run} onMessage={setMessage}/><div className="account-session"><span>Signed in on this device</span><button className="account-text-button" disabled={busy} onClick={()=>run(async()=>{const result=await client.auth.signOut({scope:'local'});if(result.error)throw Error('Sign-out could not be confirmed. Please try again.');setRecoveryOwner(null);setMessage('Signed out on this device. Browser learning is still available.');})}>Sign out</button></div></>:<>
 <div className="account-mode-tabs" role="group" aria-label="Account action"><button aria-pressed={mode==='login'} disabled={busy} onClick={()=>{setMode('login');setMessage('');}}>Sign in</button><button aria-pressed={mode==='signup'} disabled={busy||providers?.signup===false} onClick={()=>{setMode('signup');setMessage('');}}>Create account</button></div>
 <form onSubmit={submit} key={mode}>
 {mode==='recover'&&<><h2>Reset your password</h2><p>We’ll send a recovery link to your email.</p></>}
 {mode==='signup'&&<label>Display name<input name="displayName" required maxLength={100} autoComplete="nickname" placeholder="What should we call you?" disabled={busy}/></label>}
 <label>Email address<input name="email" type="email" required autoComplete="email" maxLength={254} placeholder="you@example.com" disabled={busy}/></label>
 {mode==='login'&&<PasswordInput label="Password" name="password" required autoComplete="current-password" disabled={busy}/>}
 {mode==='signup'&&<NewPasswordFields disabled={busy}/>}
 {mode==='signup'&&<fieldset className="signup-avatars"><legend>Pick your first avatar</legend><AvatarChoices value={signupAvatar} onChange={setSignupAvatar} disabled={busy}/><p>You can upload your own photo after signing in.</p></fieldset>}
 {mode!=='login'&&<p className="profile-save-note">Requesting a new email link replaces any earlier pending request in this browser. Use the newest link.</p>}
 <button className="primary-button account-submit" value={mode} disabled={busy||!ready||mode==='signup'&&providers?.signup===false}>{busy?'Please wait…':mode==='signup'?'Create your account':mode==='recover'?'Send recovery link':'Sign in'} <span>→</span></button>
 {mode==='login'&&<button type="button" className="account-text-button" disabled={busy} onClick={()=>{setMode('recover');setMessage('');}}>Forgot your password?</button>}
 </form>
 {mode!=='recover'&&<><div className="account-or-divider"><span>or</span></div><button className="google-auth-button" disabled={busy||!ready||providers?.google!==true} onClick={()=>run(()=>startAuthFlow('google',()=>client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback`}}),{replacePending:true}))}><span aria-hidden="true">G</span> Continue with Google</button>{providers?.google===false&&<p className="provider-unavailable">Google sign-in is not available yet. You can use email instead.</p>}</>}
 </>}
 <details className="account-flow-help"><summary>Having trouble with an email or sign-in link?</summary><p>Start again to clear a pending request. Earlier email links may stop working.</p><button disabled={busy} onClick={()=>run(async()=>{await restartAuthFlow();setRecoveryOwner(null);navigate('/account',{replace:true});setMessage('Flow restarted. Earlier email links may no longer work.');})}>Restart pending sign-in or email flow</button></details>
 </>}
 <Link className="continue-without-account" to="/learn/transposable-elements">Continue learning in this browser ↗</Link>
 </section></div></main>;
}
