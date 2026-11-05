import test from 'node:test';
import assert from 'node:assert/strict';
import {ownedAvatarPath,profileDetails,prepareAvatar,saveProfile} from '../../frontend/src/auth/profile.js';
import {database} from './database.mjs';
const owner={id:'11111111-1111-4111-8111-111111111111'};
const other={id:'22222222-2222-4222-8222-222222222222'};
const filename='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp';
test('avatar storage policies restrict reads, uploads and deletes to the signed-in owner',async()=>{
  const db=await database(),file=id=>`${id}/${filename}`;
  const as=(role,sub,sql,claims={})=>db.transaction(async tx=>{
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)",[sub||'',JSON.stringify({sub,...claims})]);
    return tx.query(sql);
  });
  const insert=path=>`insert into storage.objects (bucket_id,name) values ('profile-avatars','${path}')`;
  const bucket=(await db.query("select public,file_size_limit,allowed_mime_types from storage.buckets where id='profile-avatars'")).rows[0];
  assert.deepEqual(bucket,{public:false,file_size_limit:262144,allowed_mime_types:['image/webp','image/jpeg']});
  await as('authenticated',owner.id,insert(`${owner.id}/${crypto.randomUUID()}.jpg`));
  await assert.rejects(as('authenticated',owner.id,insert(`${owner.id}/${crypto.randomUUID()}.jpeg`)),/row-level security/);
  await as('authenticated',owner.id,insert(file(owner.id)));
  await assert.rejects(as('authenticated',owner.id,insert(file(other.id))),/row-level security/);
  await assert.rejects(as('authenticated',owner.id,insert(`${owner.id}/photo.png`)),/row-level security/);
  await assert.rejects(as('authenticated',owner.id,insert(`${owner.id}/${crypto.randomUUID()}.webp`),{is_anonymous:true}),/row-level security/);
  await assert.rejects(as('anon','',insert(file(owner.id).replace(/a/g,'b'))),/permission denied|row-level security/);
  const visible=async(role,sub,claims)=>(await as(role,sub,"select name from storage.objects",claims)).rows.length;
  assert.equal(await visible('authenticated',owner.id),2);
  assert.equal(await visible('authenticated',other.id),0);
  assert.equal(await visible('authenticated',owner.id,{is_anonymous:true}),0);
  assert.equal(await visible('anon',''),0);
  assert.equal((await as('authenticated',other.id,"delete from storage.objects returning id")).rows.length,0);
  assert.equal((await as('authenticated',owner.id,"delete from storage.objects returning id")).rows.length,2);
});
test('profile display accepts only owned avatar paths and known preset IDs',()=>{
  assert.equal(ownedAvatarPath(owner,`${owner.id}/${filename}`),`${owner.id}/${filename}`);
  assert.equal(ownedAvatarPath(owner,`${owner.id}/${filename.replace('.webp','.jpg')}`),`${owner.id}/${filename.replace('.webp','.jpg')}`);
  for(const value of [`${other.id}/${filename}`,'https://example.org/photo.png',`${owner.id}/../other.webp`,`${owner.id}/a.svg`,null])assert.equal(ownedAvatarPath(owner,value),null);
  assert.equal(profileDetails({...owner,user_metadata:{siaset_avatar_preset:'invalid',display_name:'A'.repeat(200)}}).preset,'helix');
  assert.equal(profileDetails({...owner,user_metadata:{display_name:'A'.repeat(200)}}).name.length,100);
});
test('avatar preprocessing rejects unsupported and oversized originals before decoding',async()=>{
  await assert.rejects(prepareAvatar({type:'image/svg+xml',size:100}),/JPG, PNG, WebP or HEIC/);
  await assert.rejects(prepareAvatar({type:'image/png',size:6*1024*1024}),/5 MB/);
});
test('profile save refuses a changed identity before any mutation',async()=>{
  let writes=0;
  const client={auth:{getUser:async()=>({data:{user:other}}),updateUser:async()=>{writes++;}},storage:{from(){writes++;}}};
  await assert.rejects(saveProfile(client,owner,{name:'Learner',preset:'orbit'}),/session changed/);
  assert.equal(writes,0);
});
test('upload failure preserves the old metadata; preset saves clear the old photo only after success',async()=>{
  const calls=[],path=`${owner.id}/${filename}`,user={...owner,user_metadata:{siaset_avatar_path:path}};
  const client={auth:{getUser:async()=>({data:{user}}),updateUser:async update=>{calls.push(['update',update]);return {data:{user}};}},storage:{from:()=>({upload:async()=>({error:true}),remove:async files=>{calls.push(['remove',files]);return {};}})}};
  await assert.rejects(saveProfile(client,user,{name:'Learner',preset:'orbit',photo:new Blob(['x'],{type:'image/webp'})}),/upload failed/);
  assert.equal(calls.length,0);
  await saveProfile(client,user,{name:' Learner ',preset:'orbit'});
  assert.equal(calls[0][0],'update');assert.equal(calls[0][1].data.display_name,'Learner');assert.equal(calls[0][1].data.siaset_avatar_path,null);
  assert.deepEqual(calls[1],['remove',[path]]);
});

test('JPEG avatars (Safari cannot encode WebP) upload as .jpg with a JPEG content type',async()=>{
  const user={...owner,user_metadata:{}},uploads=[];
  const client={auth:{getUser:async()=>({data:{user}}),updateUser:async({data})=>({data:{user:{...user,user_metadata:data}}})},storage:{from:()=>({upload:async(path,_photo,options)=>{uploads.push([path,options.contentType]);return {error:null};},remove:async()=>({})})}};
  const saved=await saveProfile(client,user,{name:'Learner',preset:'orbit',photo:new Blob(['x'],{type:'image/jpeg'})});
  assert.match(uploads[0][0],new RegExp(`^${owner.id}/[a-f0-9-]{36}\.jpg$`));
  assert.equal(uploads[0][1],'image/jpeg');
  assert.equal(profileDetails(saved).path,uploads[0][0]);
  await assert.rejects(saveProfile(client,user,{name:'Learner',preset:'orbit',photo:new Blob(['x'],{type:'image/png'})}),/another photo/);
});
