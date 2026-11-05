export const AVATAR_BUCKET='profile-avatars';
export const PHOTO_TYPES=['image/png','image/jpeg','image/webp','image/heic','image/heif'];
// Stored formats, in order of preference, with the file extension each is saved under.
export const AVATAR_TYPES=['image/webp','image/jpeg'];
const EXTENSIONS={'image/webp':'webp','image/jpeg':'jpg'};
export const AVATARS=[
  {id:'helix',name:'Helix',color:'#a0e5d0',background:'#174438'},
  {id:'orbit',name:'Orbit',color:'#b3d5ff',background:'#243e65'},
  {id:'bloom',name:'Bloom',color:'#e6b9ef',background:'#563a63'},
  {id:'spark',name:'Spark',color:'#ffd59c',background:'#604326'},
  {id:'wave',name:'Wave',color:'#97e1f1',background:'#194d5f'},
  {id:'prism',name:'Prism',color:'#c8bcff',background:'#44386a'},
  {id:'leaf',name:'Leaf',color:'#d2e8a5',background:'#3e502c'},
  {id:'nova',name:'Nova',color:'#ffb7be',background:'#61353e'},
];
export function profileDetails(user){
  const data=user?.user_metadata||{};
  const preset=AVATARS.find(item=>item.id===data.siaset_avatar_preset)?.id||'helix';
  return {name:typeof data.display_name==='string'?data.display_name.slice(0,100):typeof data.full_name==='string'?data.full_name.slice(0,100):'',preset,path:ownedAvatarPath(user,data.siaset_avatar_path)};
}
export function ownedAvatarPath(user,value){
  return user?.id&&typeof value==='string'&&value.startsWith(`${user.id}/`)&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(webp|jpg)$/.test(value)?value:null;
}
export async function prepareAvatar(file){
  // Some Android pickers report an empty type; HEIC/HEIF decode where the browser supports it (e.g. Safari).
  if(!file||(file.type&&!PHOTO_TYPES.includes(file.type)))throw Error('Choose a JPG, PNG, WebP or HEIC image.');
  if(file.size>5*1024*1024)throw Error('Choose an image smaller than 5 MB.');
  let image;
  try{image=await createImageBitmap(file);}catch{throw Error('This image could not be opened. Choose another photo.');}
  try{
    if(!image.width||!image.height||image.width*image.height>40000000)throw Error('Choose an image under 40 megapixels.');
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const context=canvas.getContext('2d');if(!context)throw Error('Image processing is unavailable in this browser.');
    const side=Math.min(image.width,image.height);
    context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,256,256);
    // Safari cannot encode WebP and silently returns PNG instead, so fall back to JPEG there.
    for(const type of AVATAR_TYPES){
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,0.86));
      if(blob?.type===type&&blob.size<=262144)return blob;
    }
    throw Error('The photo could not be resized. Choose another image.');
  }finally{image.close();}
}
export async function saveProfile(client,expectedUser,{name,preset,photo,keepPhoto=false}){
  const displayName=name.trim();
  if(!displayName||displayName.length>100)throw Error('Enter a display name of up to 100 characters.');
  if(!AVATARS.some(item=>item.id===preset))throw Error('Choose one of the available avatars.');
  const verified=await client.auth.getUser();
  if(verified.error||verified.data.user?.id!==expectedUser.id)throw Error('Your session changed. Sign in again before saving.');
  const oldPath=profileDetails(verified.data.user).path;
  let path=keepPhoto?oldPath:null,uploaded=null;
  if(photo){
    if(!EXTENSIONS[photo.type])throw Error('Choose another photo.');
    path=`${expectedUser.id}/${crypto.randomUUID()}.${EXTENSIONS[photo.type]}`;
    const result=await client.storage.from(AVATAR_BUCKET).upload(path,photo,{contentType:photo.type,upsert:false});
    if(result.error)throw Error('Photo upload failed. Your previous profile is unchanged. Please try again.');
    uploaded=path;
  }
  async function discard(value){try{await client.storage.from(AVATAR_BUCKET).remove([value]);}catch{/* A private orphan must not turn a successful profile save into a failure. */}}
  const current=await client.auth.getUser();
  if(current.error||current.data.user?.id!==expectedUser.id){if(uploaded)await discard(uploaded);throw Error('Your session changed. Sign in again before saving.');}
  const result=await client.auth.updateUser({data:{display_name:displayName,siaset_avatar_preset:preset,siaset_avatar_path:path}});
  if(result.error){if(uploaded)await discard(uploaded);throw Error('Profile could not be saved. Please try again.');}
  if(oldPath&&oldPath!==path)await discard(oldPath);
  return result.data.user;
}
