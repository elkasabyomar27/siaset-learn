import { useEffect, useState } from 'react';
import { AVATARS, AVATAR_BUCKET, profileDetails } from './profile.js';
import { useAuth } from './AuthProvider.jsx';

export function PresetAvatar({preset='helix',label}){
  const avatar=AVATARS.find(item=>item.id===preset)||AVATARS[0];
  return <svg className="profile-avatar-art" viewBox="0 0 64 64" role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true} style={{background:avatar.background,color:avatar.color}}><g fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    {avatar.id==='helix'&&<><path d="M23 13c0 14 18 24 18 38M41 13c0 14-18 24-18 38M25 18h14M27 25h10M27 39h10M25 46h14"/><circle cx="32" cy="32" r="3" fill="currentColor" stroke="none"/></>}
    {avatar.id==='orbit'&&<><circle cx="32" cy="32" r="5" fill="currentColor"/><ellipse cx="32" cy="32" rx="22" ry="10" transform="rotate(-35 32 32)"/><ellipse cx="32" cy="32" rx="22" ry="10" transform="rotate(35 32 32)"/></>}
    {avatar.id==='bloom'&&<><ellipse cx="32" cy="32" rx="10" ry="22"/><ellipse cx="32" cy="32" rx="10" ry="22" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="10" ry="22" transform="rotate(120 32 32)"/></>}
    {avatar.id==='spark'&&<path d="m34 10-17 25h13l-2 19 19-27H34z"/>}
    {avatar.id==='wave'&&<><path d="M12 25q10-14 20 0t20 0M12 37q10-14 20 0t20 0M17 48q8-10 16 0t15 0"/></>}
    {avatar.id==='prism'&&<><path d="m32 11 22 38H10zM32 11v38M10 49l33-19M54 49 21 30"/></>}
    {avatar.id==='leaf'&&<><path d="M49 14C20 9 10 30 21 43s33 1 28-29ZM18 49l24-27M26 40l-1-12M34 32l10 1"/></>}
    {avatar.id==='nova'&&<><path d="m32 10 6 15 16 7-16 6-6 16-6-16-16-6 16-7z"/><circle cx="50" cy="14" r="2" fill="currentColor"/></>}
  </g></svg>;
}
export default function Avatar({user,preview,preset,label}){
  const {client}=useAuth();
  const details=profileDetails(user), [image,setImage]=useState(null), [failed,setFailed]=useState(null);
  const owner=user?.id,path=details.path;
  useEffect(()=>{
    if(!client||!path)return;
    let active=true,url;
    client.storage.from(AVATAR_BUCKET).download(path).then(({data,error})=>{
      if(!active||error||!data)return;
      url=URL.createObjectURL(data);setImage({owner,path,url});
    }).catch(()=>{});
    return ()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[client,owner,path]);
  const src=preview||(image?.owner===owner&&image?.path===path?image.url:null);
  return <span className="profile-avatar">{src&&failed!==src?<img src={src} alt={label||'Profile avatar'} onError={()=>setFailed(src)}/>:<PresetAvatar preset={preset||details.preset} label={label}/>}</span>;
}
export function AvatarChoices({value,onChange,disabled=false}){
  return <div className="avatar-choices" role="group" aria-label="Choose your avatar">{AVATARS.map(avatar=><button type="button" key={avatar.id} aria-pressed={value===avatar.id} aria-label={`${avatar.name} avatar`} title={avatar.name} disabled={disabled} onClick={()=>onChange(avatar.id)}><PresetAvatar preset={avatar.id}/><span>{avatar.name}</span></button>)}</div>;
}
