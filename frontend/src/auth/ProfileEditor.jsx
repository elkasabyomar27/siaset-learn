import { useEffect, useState } from 'react';
import Avatar, { AvatarChoices } from './Avatar.jsx';
import { prepareAvatar, profileDetails, saveProfile } from './profile.js';

export default function ProfileEditor({client,user,busy,run,onMessage}){
  const initial=profileDetails(user);
  const [name,setName]=useState(initial.name),[preset,setPreset]=useState(initial.preset);
  const [photo,setPhoto]=useState(null),[preview,setPreview]=useState(null),[keepPhoto,setKeepPhoto]=useState(!!initial.path),[processing,setProcessing]=useState(false);
  useEffect(()=>{if(!photo)return;const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
  async function choosePhoto(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    setProcessing(true);onMessage('');
    try{setPhoto(await prepareAvatar(file));setKeepPhoto(false);}
    catch(error){onMessage(error.message);}finally{setProcessing(false);}
  }
  return <section className="profile-editor"><div className="profile-editor-heading"><div><p className="eyebrow">MAKE THIS SPACE YOURS</p><h2>Your profile</h2></div><span className="account-verified">{user.email_confirmed_at?'Email verified':'Signed in'}</span></div>
    <div className="profile-live-preview"><Avatar user={keepPhoto?user:null} preview={photo?preview:null} preset={preset}/><div><b>{name.trim()||'Your display name'}</b><span>{user.email}</span><small>Shown in your sidebar</small></div></div>
    <form onSubmit={event=>{event.preventDefault();run(async()=>{await saveProfile(client,user,{name,preset,photo,keepPhoto});setKeepPhoto(!!photo||keepPhoto);setPhoto(null);setPreview(null);onMessage('Your profile has been saved.');});}}>
      <label>Display name<input value={name} onChange={event=>setName(event.target.value)} maxLength={100} required autoComplete="nickname" disabled={busy}/></label>
      <fieldset disabled={busy||processing}><legend>Choose a custom avatar</legend><AvatarChoices value={!photo&&!keepPhoto?preset:null} onChange={value=>{setPreset(value);setPhoto(null);setPreview(null);setKeepPhoto(false);}} disabled={busy||processing}/>
        <div className="avatar-upload"><span>Or use your own photo</span><label className="avatar-upload-button">{processing?'Preparing image…':'Upload a photo'}<input aria-label="Upload profile photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={choosePhoto} disabled={busy||processing}/></label><small>JPG, PNG or WebP · up to 5 MB. A square crop is prepared before you save.</small></div>
      </fieldset><button className="primary-button" disabled={busy||processing}>{busy?'Saving…':'Save profile'}</button><p className="profile-save-note">Your name and avatar are saved to your account. Learning progress syncs across your signed-in devices.</p>
    </form>
  </section>;
}
